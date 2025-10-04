// Simple test script for Hugging Face integration
// Run with: node backend/test-hf.js

const { HfInference } = require('@huggingface/inference');
require('dotenv').config({ path: 'backend/.env' });

const hf = new HfInference(process.env.HF_API_TOKEN);

const sampleText = `
PHARMACY STOCK REPORT - AUGUST 2024

Item: PARACETAMOL 500MG
Opening Stock: 100 units
Purchase: 50 units
Sales: 80 units  
Sales Value: ₹1,200
Closing Stock: 70 units

Item: ASPIRIN 75MG
Opening Stock: 120 units
Purchase: 40 units
Sales: 60 units
Sales Value: ₹1,800
Closing Stock: 100 units
`;

async function testExtraction() {
  console.log('🧪 Testing Hugging Face Pharmaceutical Data Extraction');
  console.log('Token available:', process.env.HF_API_TOKEN ? 'Yes ✅' : 'No ❌');
  
  const prompt = `Extract pharmaceutical inventory data from this text and return as JSON array with fields: itemName, openingQty, purchaseQty, salesQty, salesValue, closingQty. Text: ${sampleText}`;
  
  try {
    const result = await hf.textGeneration({
      model: 'mistralai/Mistral-7B-Instruct-v0.2',
      inputs: prompt,
      parameters: { max_new_tokens: 500, temperature: 0.1 }
    });
    
    console.log('\\n📄 AI Response:');
    console.log(result.generated_text);
    
    // Try to extract JSON
    const jsonMatch = result.generated_text.match(/\\[.*\\]/s);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      console.log('\\n🎯 Extracted JSON:');
      console.log(JSON.stringify(data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testExtraction();