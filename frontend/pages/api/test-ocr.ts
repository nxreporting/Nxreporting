import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check environment variables
    const ocrSpaceKey = process.env.OCR_SPACE_API_KEY;
    const nanonetsKey = process.env.NANONETS_API_KEY;
    
    console.log('🔍 Testing OCR configuration...');
    console.log('OCR.space key:', ocrSpaceKey ? 'Configured' : 'Missing');
    console.log('Nanonets key:', nanonetsKey ? 'Configured' : 'Missing');
    
    // Test OCR.space with a simple base64 image (avoids file type detection issues)
    const testBase64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    
    const formData = new FormData();
    formData.append('base64Image', testBase64Image);
    formData.append('apikey', ocrSpaceKey || 'helloworld');
    formData.append('language', 'eng');
    formData.append('isOverlayRequired', 'false');
    formData.append('detectOrientation', 'false');
    formData.append('scale', 'true');
    formData.append('OCREngine', '2');

    console.log('📡 Making test OCR.space request...');

    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      body: formData
    });

    console.log('📊 Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ OCR.space error response:', errorText);
      
      return res.status(200).json({
        success: false,
        error: `OCR.space HTTP error: ${response.status} ${response.statusText}`,
        details: errorText,
        config: {
          ocrSpaceConfigured: !!ocrSpaceKey,
          nanonetsConfigured: !!nanonetsKey
        }
      });
    }

    const responseData = await response.json();
    console.log('📊 OCR.space response received');

    if (responseData.IsErroredOnProcessing) {
      const errorMsg = Array.isArray(responseData.ErrorMessage) 
        ? responseData.ErrorMessage.join(', ') 
        : responseData.ErrorMessage;
      console.log('❌ OCR.space processing error:', errorMsg);
      
      return res.status(200).json({
        success: false,
        error: `OCR.space processing error: ${errorMsg}`,
        rawResponse: responseData,
        config: {
          ocrSpaceConfigured: !!ocrSpaceKey,
          nanonetsConfigured: !!nanonetsKey
        }
      });
    }

    // Extract text from OCR.space response
    let extractedText = '';
    if (responseData.ParsedResults && responseData.ParsedResults.length > 0) {
      extractedText = responseData.ParsedResults
        .map((result: any) => result.ParsedText || '')
        .filter((text: string) => text.trim())
        .join('\n')
        .trim();
    }

    if (extractedText) {
      console.log('✅ OCR.space extraction successful!');
      console.log('📜 Extracted text length:', extractedText.length);
      
      return res.status(200).json({
        success: true,
        message: 'OCR service is working correctly',
        extractedText: extractedText.substring(0, 500) + (extractedText.length > 500 ? '...' : ''),
        textLength: extractedText.length,
        config: {
          ocrSpaceConfigured: !!ocrSpaceKey,
          nanonetsConfigured: !!nanonetsKey
        }
      });
    } else {
      return res.status(200).json({
        success: false,
        error: 'No text extracted from test image',
        rawResponse: responseData,
        config: {
          ocrSpaceConfigured: !!ocrSpaceKey,
          nanonetsConfigured: !!nanonetsKey
        }
      });
    }

  } catch (error: any) {
    console.error('❌ OCR test failed:', error);
    
    return res.status(500).json({
      success: false,
      error: `OCR test failed: ${error.message}`,
      config: {
        ocrSpaceConfigured: !!process.env.OCR_SPACE_API_KEY,
        nanonetsConfigured: !!process.env.NANONETS_API_KEY
      }
    });
  }
}