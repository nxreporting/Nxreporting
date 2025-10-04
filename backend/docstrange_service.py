#!/usr/bin/env python3
"""
DocStrange Bridge Service for NX Reporting System
Extracts pharmaceutical data from PDFs using DocStrange
"""

import sys
import json
import os
import traceback
import logging
from pathlib import Path
from typing import Dict, List, Any, Optional

try:
    from docstrange import DocumentExtractor
except ImportError as e:
    print(json.dumps({
        "success": False,
        "error": f"DocStrange not installed: {str(e)}. Please run: pip install docstrange"
    }))
    sys.exit(1)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PharmaDataExtractor:
    """Pharmaceutical data extractor using DocStrange"""
    
    def __init__(self, api_key: Optional[str] = None):
        """Initialize the extractor with optional API key for cloud processing"""
        try:
            if api_key and api_key != "":
                # Use cloud processing with API key for 10k docs/month
                self.extractor = DocumentExtractor(api_key=api_key)
                self.mode = "cloud_authenticated"
                logger.info("🔑 Initialized DocStrange with API key (10k docs/month)")
            else:
                # Use free cloud processing (limited)
                self.extractor = DocumentExtractor()
                self.mode = "cloud_free"
                logger.info("☁️ Initialized DocStrange in free cloud mode")
                
        except Exception as e:
            logger.error(f"Failed to initialize DocStrange: {e}")
            raise
    
    def extract_pharmaceutical_data(self, file_path: str) -> Dict[str, Any]:
        """
        Extract pharmaceutical data from PDF using DocStrange
        
        Args:
            file_path: Path to the PDF file
            
        Returns:
            Dictionary with extraction results
        """
        try:
            # Validate file exists
            if not os.path.exists(file_path):
                return {
                    "success": False,
                    "error": f"File not found: {file_path}"
                }
            
            # Check file size (reasonable limits)
            file_size_mb = os.path.getsize(file_path) / (1024 * 1024)
            logger.info(f"📄 Processing file: {os.path.basename(file_path)} ({file_size_mb:.2f} MB)")
            
            if file_size_mb > 50:  # 50MB limit for free tier
                return {
                    "success": False,
                    "error": f"File too large ({file_size_mb:.2f} MB). Maximum size is 50MB."
                }
            
            # Extract using DocStrange
            logger.info("🔬 Starting DocStrange extraction...")
            result = self.extractor.extract(file_path)
            
            # Try different extraction methods
            extracted_data = self._try_extraction_methods(result)
            
            if extracted_data["success"]:
                # Parse pharmaceutical data from extracted text
                pharma_data = self._parse_pharmaceutical_data(extracted_data["text"])
                
                return {
                    "success": True,
                    "data": pharma_data,
                    "mode": self.mode,
                    "extracted_text_length": len(extracted_data["text"]),
                    "text_preview": extracted_data["text"][:200] + "..." if len(extracted_data["text"]) > 200 else extracted_data["text"]
                }
            else:
                return extracted_data
                
        except Exception as e:
            logger.error(f"DocStrange extraction failed: {e}")
            logger.error(traceback.format_exc())
            return {
                "success": False,
                "error": f"DocStrange extraction failed: {str(e)}"
            }
    
    def _try_extraction_methods(self, result) -> Dict[str, Any]:
        """Try different DocStrange extraction methods"""
        
        methods = [
            ("Markdown", lambda: result.extract_markdown()),
            ("Text", lambda: result.extract_text()),
            ("HTML", lambda: result.extract_html()),
            ("JSON Data", lambda: self._extract_structured_data(result))
        ]
        
        for method_name, method_func in methods:
            try:
                logger.info(f"🔍 Trying {method_name} extraction...")
                extracted_content = method_func()
                
                if extracted_content and len(str(extracted_content).strip()) > 10:
                    logger.info(f"✅ {method_name} extraction successful!")
                    return {
                        "success": True,
                        "text": str(extracted_content),
                        "method": method_name.lower()
                    }
                else:
                    logger.warning(f"⚠️ {method_name} extraction returned insufficient data")
                    
            except Exception as e:
                logger.warning(f"❌ {method_name} extraction failed: {e}")
                continue
        
        return {
            "success": False,
            "error": "All extraction methods failed to return sufficient data"
        }
    
    def _extract_structured_data(self, result) -> str:
        """Extract structured pharmaceutical data using DocStrange"""
        try:
            # Define pharmaceutical fields to extract
            pharma_fields = [
                "medicine_name", "drug_name", "item_name", "product_name",
                "opening_quantity", "opening_qty", "opening_stock",
                "purchase_quantity", "purchase_qty", "purchased",
                "sales_quantity", "sales_qty", "sold",
                "closing_quantity", "closing_qty", "closing_stock",
                "sales_value", "sales_amount", "total_value",
                "unit_price", "rate", "amount"
            ]
            
            # Try to extract specific pharmaceutical fields
            logger.info("🏥 Attempting pharmaceutical field extraction...")
            structured_data = result.extract_data(specified_fields=pharma_fields)
            
            if structured_data and isinstance(structured_data, dict):
                return json.dumps(structured_data, indent=2)
            else:
                # Fallback to general JSON extraction
                logger.info("📊 Fallback to general JSON extraction...")
                general_data = result.extract_data()
                return json.dumps(general_data, indent=2) if general_data else ""
                
        except Exception as e:
            logger.warning(f"Structured extraction failed: {e}")
            return ""
    
    def _parse_pharmaceutical_data(self, text: str) -> List[Dict[str, Any]]:
        """Parse pharmaceutical inventory data from extracted text"""
        
        pharma_items = []
        lines = text.split('\n')
        
        logger.info(f"📋 Analyzing {len(lines)} lines for pharmaceutical patterns...")
        
        for line_num, line in enumerate(lines):
            line = line.strip()
            
            # Skip empty lines and headers
            if not line or len(line) < 5:
                continue
            
            # Skip common headers
            if any(header in line.upper() for header in [
                'ITEM', 'NAME', 'MEDICINE', 'DRUG', 'S.NO', 'SR.NO', 
                'OPENING', 'PURCHASE', 'SALES', 'CLOSING', 'QTY', 'QUANTITY'
            ]):
                continue
            
            # Try enhanced pharmaceutical patterns
            item_data = self._extract_pharma_item(line)
            if item_data:
                pharma_items.append(item_data)
        
        # Remove duplicates based on item name
        seen_names = set()
        unique_items = []
        for item in pharma_items:
            name_key = item.get('itemName', '').upper().strip()
            if name_key and name_key not in seen_names:
                seen_names.add(name_key)
                unique_items.append(item)
        
        logger.info(f"💊 Extracted {len(unique_items)} unique pharmaceutical items")
        return unique_items[:50]  # Limit to 50 items
    
    def _extract_pharma_item(self, line: str) -> Optional[Dict[str, Any]]:
        """Extract pharmaceutical item data from a line"""
        import re
        
        # Enhanced patterns for pharmaceutical data
        patterns = [
            # Pattern 1: Name followed by numbers (space separated)
            r'^([A-Z][A-Z\s\d\-\.\(\)\/]{3,50})\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)(?:\s+(\d+(?:\.\d+)?))?',
            
            # Pattern 2: Name with multiple spaces then numbers
            r'^([A-Z][A-Z\s\d\-\.\(\)\/]{3,50})\s{2,}([\d\s\.]+)$',
            
            # Pattern 3: Tab separated values
            r'^([A-Z][A-Z\s\d\-\.\(\)\/]{3,50})\t+([\d\t\.]+)$'
        ]
        
        for pattern in patterns:
            match = re.match(pattern, line.strip())
            if match:
                groups = match.groups()
                item_name = groups[0].strip()
                
                # Validate item name (should look like a medicine name)
                if not self._is_valid_medicine_name(item_name):
                    continue
                
                # Extract numbers
                if len(groups) >= 7:  # Full pattern match
                    numbers = [float(g) if g else 0 for g in groups[1:8]]
                else:  # Pattern with number string
                    number_str = groups[1] if len(groups) > 1 else ""
                    numbers = [float(x) for x in re.findall(r'\d+(?:\.\d+)?', number_str)]
                
                # Ensure we have at least 4 numbers
                while len(numbers) < 7:
                    numbers.append(0)
                
                return {
                    "itemName": item_name,
                    "openingQty": int(numbers[0]) if numbers[0] else None,
                    "purchaseQty": int(numbers[1]) if numbers[1] else None,
                    "purchaseFree": int(numbers[2]) if numbers[2] else None,
                    "salesQty": int(numbers[3]) if numbers[3] else None,
                    "salesValue": round(numbers[4], 2) if numbers[4] else None,
                    "closingQty": int(numbers[5]) if numbers[5] else None,
                    "closingValue": round(numbers[6], 2) if numbers[6] else None
                }
        
        return None
    
    def _is_valid_medicine_name(self, name: str) -> bool:
        """Validate if the name looks like a medicine name"""
        if len(name) < 3 or len(name) > 60:
            return False
        
        # Should contain letters
        if not re.search(r'[A-Za-z]', name):
            return False
        
        # Should not be only numbers
        if re.match(r'^\d+\.?\d*$', name.strip()):
            return False
        
        # Should not contain too many special characters
        special_chars = len(re.findall(r'[^A-Za-z0-9\s\-\.\(\)\/]', name))
        if special_chars > len(name) * 0.3:  # More than 30% special chars
            return False
        
        return True

def main():
    """Main function to handle command line arguments"""
    
    if len(sys.argv) < 2:
        print(json.dumps({
            "success": False,
            "error": "Usage: python docstrange_service.py <pdf_file_path> [api_key]"
        }))
        sys.exit(1)
    
    file_path = sys.argv[1]
    api_key = sys.argv[2] if len(sys.argv) > 2 else None
    
    try:
        # Initialize extractor
        extractor = PharmaDataExtractor(api_key=api_key)
        
        # Extract pharmaceutical data
        result = extractor.extract_pharmaceutical_data(file_path)
        
        # Output JSON result
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": f"Extraction failed: {str(e)}"
        }))
        sys.exit(1)

if __name__ == "__main__":
    main()