'use client';

import { useState } from 'react';

export default function TestPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const testOCRService = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-ocr');
      const data = await response.json();
      setResult({ type: 'OCR Service Test', data });
    } catch (error: any) {
      setResult({ type: 'OCR Service Test', error: error.message });
    }
    setLoading(false);
  };

  const testPDFExtraction = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-pdf-extraction');
      const data = await response.json();
      setResult({ type: 'PDF Extraction Test', data });
    } catch (error: any) {
      setResult({ type: 'PDF Extraction Test', error: error.message });
    }
    setLoading(false);
  };

  const uploadAndTest = async () => {
    if (!selectedFile) {
      alert('Please select a PDF file');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('output_type', 'flat-json');

      const response = await fetch('/api/extract', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      setResult({ type: 'PDF Upload Test', data });
    } catch (error: any) {
      setResult({ type: 'PDF Upload Test', error: error.message });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">🧪 PDF Extraction Test Suite</h1>
      
      <div className="grid gap-6">
        {/* Test Buttons */}
        <div className="bg-blue-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">🔧 Service Tests</h2>
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={testOCRService}
              disabled={loading}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              Test OCR Service
            </button>
            <button
              onClick={testPDFExtraction}
              disabled={loading}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
            >
              Test PDF Extraction Service
            </button>
          </div>
        </div>

        {/* PDF Upload Test */}
        <div className="bg-purple-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">📄 PDF Upload Test</h2>
          <div className="space-y-4">
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
            />
            <button
              onClick={uploadAndTest}
              disabled={loading || !selectedFile}
              className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
            >
              Upload & Test PDF
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
              <span>Processing...</span>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className={`p-6 rounded-lg ${result.error ? 'bg-red-50' : 'bg-green-50'}`}>
            <h2 className="text-xl font-semibold mb-4">
              {result.error ? '❌' : '✅'} {result.type} Results
            </h2>
            <pre className="bg-white p-4 rounded border overflow-auto text-sm">
              {JSON.stringify(result.data || result.error, null, 2)}
            </pre>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">📋 Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li><strong>Test OCR Service:</strong> Checks if OCR.space API is working</li>
            <li><strong>Test PDF Extraction Service:</strong> Tests the complete PDF processing pipeline</li>
            <li><strong>Upload PDF:</strong> Test with your actual pharmaceutical PDF file</li>
          </ol>
          
          <div className="mt-4 p-4 bg-blue-100 rounded">
            <h3 className="font-semibold">🎯 Expected Results:</h3>
            <ul className="list-disc list-inside text-sm mt-2 space-y-1">
              <li><strong>Company:</strong> "SHIVOHAM MEDICINES" (not "Unknown Company")</li>
              <li><strong>Items:</strong> 5-10 pharmaceutical products (not empty array)</li>
              <li><strong>Sales:</strong> Real values like ₹5,695.20 (not ₹0)</li>
              <li><strong>Provider:</strong> "Nanonets" (primary OCR service)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}