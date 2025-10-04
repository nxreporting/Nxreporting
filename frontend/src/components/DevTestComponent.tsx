import React, { useState, useEffect } from 'react'

interface DevTestResponse {
  success: boolean
  message: string
  timestamp: string
  method: string
  hotReload: boolean
  version: string
}

export default function DevTestComponent() {
  const [testResult, setTestResult] = useState<DevTestResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testHotReload = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/dev-test')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data: DevTestResponse = await response.json()
      setTestResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Auto-test on component mount
    testHotReload()
  }, [])

  return (
    <div className="p-6 bg-gray-50 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">
        🔥 Hot Reload Test Component
      </h3>
      
      <div className="space-y-4">
        <button
          onClick={testHotReload}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test API Hot Reload'}
        </button>

        {error && (
          <div className="p-3 bg-red-100 border border-red-300 rounded text-red-700">
            <strong>Error:</strong> {error}
          </div>
        )}

        {testResult && (
          <div className="p-4 bg-green-100 border border-green-300 rounded">
            <h4 className="font-semibold text-green-800 mb-2">✅ API Response:</h4>
            <div className="text-sm text-green-700 space-y-1">
              <p><strong>Message:</strong> {testResult.message}</p>
              <p><strong>Timestamp:</strong> {testResult.timestamp}</p>
              <p><strong>Method:</strong> {testResult.method}</p>
              <p><strong>Hot Reload:</strong> {testResult.hotReload ? '✅ Enabled' : '❌ Disabled'}</p>
              <p><strong>Version:</strong> {testResult.version}</p>
            </div>
          </div>
        )}

        <div className="text-xs text-gray-600 mt-4">
          <p><strong>Hot Reload Test Instructions:</strong></p>
          <ol className="list-decimal list-inside space-y-1 mt-2">
            <li>Make changes to this component or the API route</li>
            <li>Save the file</li>
            <li>Watch for automatic updates without page refresh</li>
            <li>Click "Test API Hot Reload" to verify API changes</li>
          </ol>
        </div>
      </div>
    </div>
  )
}