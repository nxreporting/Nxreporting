'use client';

import { useState, useEffect } from 'react';

export default function HealthPage() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setHealth(data);
    } catch (error: any) {
      setHealth({ error: error.message });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">🏥 System Health Check</h1>
      
      {loading ? (
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
            <span>Checking system health...</span>
          </div>
        </div>
      ) : (
        <div className={`p-6 rounded-lg ${health?.error ? 'bg-red-50' : 'bg-green-50'}`}>
          <h2 className="text-xl font-semibold mb-4">
            {health?.error ? '❌ System Error' : '✅ System Healthy'}
          </h2>
          <pre className="bg-white p-4 rounded border overflow-auto text-sm">
            {JSON.stringify(health, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-6 space-y-4">
        <button
          onClick={checkHealth}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Refresh Health Check
        </button>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">🔗 Available Test Pages:</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="/test" className="text-blue-600 hover:underline">
                📄 /test - PDF Extraction Test Suite
              </a>
            </li>
            <li>
              <a href="/health" className="text-blue-600 hover:underline">
                🏥 /health - System Health Check (this page)
              </a>
            </li>
            <li>
              <a href="/pdf-extract" className="text-blue-600 hover:underline">
                📊 /pdf-extract - Main PDF Extraction Interface
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}