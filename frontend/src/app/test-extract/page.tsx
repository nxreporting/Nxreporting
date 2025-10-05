'use client';

import { useState } from 'react';

export default function TestExtractPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [endpoint, setEndpoint] = useState('/api/extract-debug');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      alert('Please select a PDF file');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('output_type', 'flat-json');

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: { message: error instanceof Error ? error.message : 'Unknown error' }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Extract Endpoint Test</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <div>
          <label className="block text-sm font-medium mb-2">
            Endpoint:
          </label>
          <select 
            value={endpoint} 
            onChange={(e) => setEndpoint(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="/api/extract-debug">Debug Extract (Recommended)</option>
            <option value="/api/extract-simple">Simple Extract</option>
            <option value="/api/extract">Original Extract</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            PDF File:
          </label>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={loading || !selectedFile}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Test Extract'}
        </button>
      </form>

      {result && (
        <div className={`p-4 rounded-md border ${
          result.success 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <h3 className="text-lg font-semibold mb-2">
            {result.success ? 'Success' : 'Error'}
          </h3>
          <pre className="text-sm overflow-auto max-h-96 whitespace-pre-wrap">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}