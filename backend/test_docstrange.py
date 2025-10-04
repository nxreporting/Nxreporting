#!/usr/bin/env python3
"""
Simple DocStrange test script
"""

import sys
import json
import os

def test_docstrange_import():
    """Test if DocStrange can be imported and used"""
    try:
        print("Testing DocStrange import...")
        from docstrange import DocumentExtractor
        print("✅ DocStrange imported successfully!")
        
        # Initialize extractor in cloud mode (free tier)
        print("Initializing DocumentExtractor...")
        extractor = DocumentExtractor()
        print("✅ DocumentExtractor initialized successfully!")
        
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"❌ Initialization error: {e}")
        return False

def test_docstrange_with_file(file_path):
    """Test DocStrange with a real file"""
    try:
        from docstrange import DocumentExtractor
        
        # Check if file exists
        if not os.path.exists(file_path):
            print(f"❌ File not found: {file_path}")
            return False
        
        print(f"📄 Testing with file: {file_path}")
        
        # Initialize extractor
        extractor = DocumentExtractor()
        
        # Extract document
        print("🔬 Extracting document...")
        result = extractor.extract(file_path)
        
        # Try different extraction methods
        try:
            markdown = result.extract_markdown()
            print(f"✅ Markdown extraction successful! Length: {len(markdown)} chars")
            print(f"Preview: {markdown[:200]}...")
            return True
        except Exception as e:
            print(f"⚠️ Markdown extraction failed: {e}")
        
        try:
            text = result.extract_text()
            print(f"✅ Text extraction successful! Length: {len(text)} chars")
            print(f"Preview: {text[:200]}...")
            return True
        except Exception as e:
            print(f"⚠️ Text extraction failed: {e}")
        
        return False
        
    except Exception as e:
        print(f"❌ DocStrange test failed: {e}")
        return False

if __name__ == "__main__":
    print("🧪 DocStrange Integration Test")
    print("=" * 40)
    
    # Test 1: Import test
    if not test_docstrange_import():
        print("❌ DocStrange import test failed")
        sys.exit(1)
    
    # Test 2: File processing test
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
        if test_docstrange_with_file(file_path):
            print("✅ DocStrange file test successful!")
        else:
            print("❌ DocStrange file test failed!")
    else:
        print("ℹ️ No file provided for testing")
    
    print("🎉 DocStrange integration test completed!")