'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileText, Download, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

// Interface for extraction response
interface ExtractionResponse {
  success: boolean;
  message?: string;
  data?: any;
  formattedData?: any;
  summary?: string;
  brandAnalysis?: any[];
  detailedBrandReport?: string;
  extractedText?: string;
  error?: string;
  formatError?: string;
  metadata?: {
    originalFilename: string;
    fileSize: number;
    outputType: string;
    processedAt: string;
    formattingStatus?: {
      formattedData: boolean;
      summary: boolean;
      brandAnalysis: boolean;
      detailedBrandReport: boolean;
    };
  };
}

// Interface for extraction status
interface ExtractionStatus {
  success: boolean;
  status?: {
    apiKeyConfigured: boolean;
    apiEndpoint: string;
    ready: boolean;
    uptime: number;
    timestamp: string;
  };
}

/**
 * PDF Extraction Component
 * Allows users to upload PDF files and extract data using Nanonets API
 */
const PDFExtractor: React.FC = () => {
  // State management
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionResult, setExtractionResult] = useState<ExtractionResponse | null>(null);
  const [outputType, setOutputType] = useState<'flat-json' | 'markdown' | 'json'>('flat-json');
  const [dragActive, setDragActive] = useState(false);
  const [serviceStatus, setServiceStatus] = useState<ExtractionStatus | null>(null);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Check the status of the extraction service
   */
  const checkServiceStatus = async () => {
    try {
      const response = await fetch('/api/extract/status');
      const status: ExtractionStatus = await response.json();
      setServiceStatus(status);
    } catch (error) {
      console.error('Failed to check service status:', error);
      setServiceStatus({
        success: false
      });
    }
  };

  /**
   * Test the API connection
   */
  const testAPIConnection = async () => {
    try {
      console.log('🧪 Testing API connection...');
      const response = await fetch('/api/health');
      const result = await response.json();
      console.log('🏥 Health check result:', result);
      alert(`API Health: ${result.success ? 'OK' : 'Failed'}`);
    } catch (error) {
      console.error('❌ API test failed:', error);
      alert(`API Test Failed: ${error.message}`);
    }
  };

  /**
   * Handle file selection from input or drag & drop
   */
  const handleFileSelect = (file: File) => {
    // Validate file type
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please select a PDF file only.');
      return;
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      alert('File size must be less than 50MB.');
      return;
    }

    setSelectedFile(file);
    setExtractionResult(null); // Clear previous results
  };

  /**
   * Handle drag and drop events
   */
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  /**
   * Handle file input change
   */
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  /**
   * Extract data from the selected PDF file
   */
  const extractPDF = async () => {
    if (!selectedFile) {
      alert('Please select a PDF file first.');
      return;
    }

    setIsExtracting(true);
    setExtractionResult(null);

    try {
      // Prepare form data
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('output_type', outputType);

      console.log(`🚀 Starting extraction with output type: ${outputType}`);
      console.log(`📄 File details:`, {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type
      });

      // Send request to API route (with cache busting)
      const response = await fetch(`/api/extract?t=${Date.now()}`, {
        method: 'POST',
        body: formData,
        cache: 'no-cache'
      });

      console.log(`📬 Response status: ${response.status} ${response.statusText}`);
      console.log(`📋 Response headers:`, Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HTTP Error Response:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: ExtractionResponse = await response.json();

      console.log('📬 Extraction response:', result);
      console.log('✅ Response success:', result.success);
      console.log('📊 Response data keys:', result.data ? Object.keys(result.data) : 'no data');

      // Ensure error is a string for proper rendering
      const processedResult = {
        ...result,
        error: result.error 
          ? (typeof result.error === 'string' 
              ? result.error 
              : result.error.message || 'An error occurred')
          : undefined
      };

      setExtractionResult(processedResult);

      if (result.success) {
        console.log('✅ Extraction completed successfully');
      } else {
        console.error('❌ Extraction failed:', result.error);
      }

    } catch (error: any) {
      console.error('❌ Extraction request failed:', error);
      setExtractionResult({
        success: false,
        error: `Request failed: ${error.message}`
      });
    } finally {
      setIsExtracting(false);
    }
  };

  /**
   * Download extracted data as JSON file
   */
  const downloadResult = () => {
    if (!extractionResult?.data) return;

    const dataStr = JSON.stringify(extractionResult.data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `extracted-data-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  /**
   * Format file size for display
   */
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Check service status on component mount
  React.useEffect(() => {
    checkServiceStatus();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          PDF Data Extractor v2.0
        </h1>
        <p className="text-gray-600">
          Upload a PDF file and extract structured data with brand analysis
        </p>
      </div>

      {/* Service Status */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="font-medium">Extraction service is ready</span>
          </div>
          <button
            onClick={testAPIConnection}
            className="text-blue-600 hover:text-blue-700 text-sm underline"
          >
            Test API Connection
          </button>
        </div>
      </div>

      {/* File Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Upload PDF File
        </h3>
        <p className="text-gray-600 mb-4">
          Drag and drop your PDF here, or click to browse
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileInputChange}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Choose File
        </button>
        <p className="text-sm text-gray-500 mt-2">
          Maximum file size: 50MB
        </p>
      </div>

      {/* Selected File Info */}
      {selectedFile && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <FileText className="w-8 h-8 text-blue-600" />
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{selectedFile.name}</h4>
              <p className="text-sm text-gray-600">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Output Type Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Output Format
        </label>
        <select
          value={outputType}
          onChange={(e) => setOutputType(e.target.value as typeof outputType)}
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="flat-json">Flat JSON (Structured Data)</option>
          <option value="json">JSON (Hierarchical)</option>
          <option value="markdown">Markdown</option>
        </select>
      </div>

      {/* Extract Button */}
      <button
        onClick={extractPDF}
        disabled={!selectedFile || isExtracting}
        className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
          !selectedFile || isExtracting
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {isExtracting ? (
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Extracting Data...</span>
          </div>
        ) : (
          'Extract Data'
        )}
      </button>

      {/* Extraction Results */}
      {extractionResult && (
        <div className="space-y-4">
          {/* Result Status */}
          <div className={`p-4 rounded-lg border ${
            extractionResult.success
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {extractionResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <span className="font-medium">
                  {extractionResult.success 
                    ? 'Extraction Successful' 
                    : 'Extraction Failed'}
                </span>
              </div>
              {extractionResult.success && extractionResult.data && (
                <button
                  onClick={downloadResult}
                  className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
                >
                  <Download className="w-4 h-4" />
                  <span>Download JSON</span>
                </button>
              )}
            </div>
            {extractionResult.error && (
              <p className="text-red-700 mt-2 text-sm">
                {typeof extractionResult.error === 'string' 
                  ? extractionResult.error 
                  : extractionResult.error.message || 'An error occurred'}
              </p>
            )}
          </div>

          {/* Debug Information */}
          {extractionResult.success && extractionResult.metadata?.formattingStatus && (
            <div className="border border-yellow-200 rounded-lg bg-yellow-50">
              <div className="bg-yellow-100 px-4 py-2 border-b border-yellow-200">
                <h4 className="font-medium text-yellow-900">🔧 Debug Information</h4>
              </div>
              <div className="p-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className={`inline-block w-3 h-3 rounded-full mr-2 ${extractionResult.metadata.formattingStatus.formattedData ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    Formatted Data: {extractionResult.metadata.formattingStatus.formattedData ? 'Success' : 'Failed'}
                  </div>
                  <div>
                    <span className={`inline-block w-3 h-3 rounded-full mr-2 ${extractionResult.metadata.formattingStatus.summary ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    Summary: {extractionResult.metadata.formattingStatus.summary ? 'Success' : 'Failed'}
                  </div>
                  <div>
                    <span className={`inline-block w-3 h-3 rounded-full mr-2 ${extractionResult.metadata.formattingStatus.brandAnalysis ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    Brand Analysis: {extractionResult.metadata.formattingStatus.brandAnalysis ? 'Success' : 'Failed'}
                  </div>
                  <div>
                    <span className={`inline-block w-3 h-3 rounded-full mr-2 ${extractionResult.metadata.formattingStatus.detailedBrandReport ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    Detailed Report: {extractionResult.metadata.formattingStatus.detailedBrandReport ? 'Success' : 'Failed'}
                  </div>
                </div>
                {extractionResult.formatError && (
                  <div className="mt-3 p-2 bg-red-100 border border-red-200 rounded text-red-800">
                    <strong>Format Error:</strong> {extractionResult.formatError}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Debug Data Structure */}
          {extractionResult.success && (
            <div className="border border-blue-200 rounded-lg bg-blue-50 p-4 mb-4">
              <h4 className="font-medium text-blue-900 mb-2">🔍 Debug: Data Structure</h4>
              <div className="text-sm space-y-1">
                <div>Has formattedData: {extractionResult.formattedData ? '✅ Yes' : '❌ No'}</div>
                <div>Has items: {extractionResult.formattedData?.items ? '✅ Yes' : '❌ No'}</div>
                <div>Items length: {extractionResult.formattedData?.items?.length || 0}</div>
                <div>Items type: {typeof extractionResult.formattedData?.items}</div>
                <div>Company name: {extractionResult.formattedData?.company?.name || 'Not found'}</div>
                {extractionResult.formattedData?.items && (
                  <div>First item: {JSON.stringify(extractionResult.formattedData.items[0])}</div>
                )}
              </div>
            </div>
          )}

          {/* Stock Report Table */}
          {extractionResult.success && extractionResult.formattedData?.items && extractionResult.formattedData.items.length > 0 && (
            <div className="border border-gray-200 rounded-lg">
              <div className="bg-blue-50 px-4 py-3 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-blue-900">📊 Stock Report - {extractionResult.formattedData.company?.name}</h4>
                  <span className="text-sm text-blue-700">
                    {extractionResult.formattedData.report?.dateRange}
                  </span>
                </div>
              </div>
              <div className="p-4">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {extractionResult.formattedData.summary?.totalItems || 0}
                    </div>
                    <div className="text-sm text-blue-700">Total Items</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {extractionResult.formattedData.summary?.totalSalesQty || 0}
                    </div>
                    <div className="text-sm text-green-700">Total Sales Qty</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      ₹{(extractionResult.formattedData.summary?.totalSalesValue || 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-purple-700">Total Sales Value</div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      ₹{(extractionResult.formattedData.summary?.totalClosingValue || 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-orange-700">Total Closing Value</div>
                  </div>
                </div>

                {/* Stock Items Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Item Name
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Opening
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Purchase
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sales Qty
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sales Value
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Closing Qty
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Closing Value
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {extractionResult.formattedData.items.map((item: any, index: number) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {item.name}
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-gray-700">
                            {item.opening?.qty || 0}
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-gray-700">
                            {item.purchase?.qty || 0}
                            {item.purchase?.free > 0 && (
                              <span className="text-green-600 text-xs ml-1">
                                (+{item.purchase.free} free)
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-center font-medium text-blue-600">
                            {item.sales?.qty || 0}
                          </td>
                          <td className="px-4 py-3 text-sm text-center font-medium text-green-600">
                            ₹{(item.sales?.value || 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-gray-700">
                            {item.closing?.qty || 0}
                          </td>
                          <td className="px-4 py-3 text-sm text-center font-medium text-purple-600">
                            ₹{(item.closing?.value || 0).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Item Cards View - Your Requested Format */}
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h5 className="font-medium text-gray-900">📋 Item Details</h5>
                    <span className="text-sm text-gray-600">
                      Showing format: "Item Name - Sale Qty - Sales Value"
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {extractionResult.formattedData.items
                      .filter((item: any) => item.sales?.qty > 0 || item.sales?.value > 0)
                      .map((item: any, index: number) => (
                        <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="font-medium text-gray-900 mb-2 text-sm">
                            {item.name}
                          </div>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Sale:</span>
                              <span className="font-medium text-blue-600">{item.sales?.qty || 0}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Sales Value:</span>
                              <span className="font-medium text-green-600">₹{(item.sales?.value || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Closing:</span>
                              <span className="font-medium text-purple-600">{item.closing?.qty || 0}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Closing Value:</span>
                              <span className="font-medium text-orange-600">₹{(item.closing?.value || 0).toLocaleString()}</span>
                            </div>
                          </div>
                          {/* Example format you requested */}
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="text-xs text-gray-500 font-mono">
                              {item.name} Sale {item.sales?.qty || 0} Sales value {item.sales?.value || 0}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h5 className="font-medium text-blue-900 mb-2">🔝 Top Selling Items</h5>
                    <div className="space-y-1 text-sm">
                      {extractionResult.formattedData.items
                        .filter((item: any) => item.sales?.qty > 0)
                        .sort((a: any, b: any) => (b.sales?.qty || 0) - (a.sales?.qty || 0))
                        .slice(0, 3)
                        .map((item: any, index: number) => (
                          <div key={index} className="flex justify-between">
                            <span className="text-blue-800 truncate">{item.name}</span>
                            <span className="text-blue-600 font-medium">{item.sales.qty}</span>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <h5 className="font-medium text-green-900 mb-2">💰 Highest Revenue</h5>
                    <div className="space-y-1 text-sm">
                      {extractionResult.formattedData.items
                        .filter((item: any) => item.sales?.value > 0)
                        .sort((a: any, b: any) => (b.sales?.value || 0) - (a.sales?.value || 0))
                        .slice(0, 3)
                        .map((item: any, index: number) => (
                          <div key={index} className="flex justify-between">
                            <span className="text-green-800 truncate">{item.name}</span>
                            <span className="text-green-600 font-medium">₹{item.sales.value.toLocaleString()}</span>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h5 className="font-medium text-purple-900 mb-2">📦 Highest Stock Value</h5>
                    <div className="space-y-1 text-sm">
                      {extractionResult.formattedData.items
                        .filter((item: any) => item.closing?.value > 0)
                        .sort((a: any, b: any) => (b.closing?.value || 0) - (a.closing?.value || 0))
                        .slice(0, 3)
                        .map((item: any, index: number) => (
                          <div key={index} className="flex justify-between">
                            <span className="text-purple-800 truncate">{item.name}</span>
                            <span className="text-purple-600 font-medium">₹{item.closing.value.toLocaleString()}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Summary Display */}
          {extractionResult.success && extractionResult.summary && (
            <div className="border border-gray-200 rounded-lg">
              <div className="bg-blue-50 px-4 py-2 border-b border-gray-200">
                <h4 className="font-medium text-blue-900">📊 Business Summary</h4>
              </div>
              <div className="p-4">
                <div className="bg-white p-4 rounded-lg border">
                  <pre className="whitespace-pre-wrap text-gray-800 font-mono text-sm">
                    {extractionResult.summary}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Brand Analysis Display */}
          {extractionResult.success && extractionResult.brandAnalysis && extractionResult.brandAnalysis.length > 0 && (
            <div className="border border-gray-200 rounded-lg">
              <div className="bg-green-50 px-4 py-2 border-b border-gray-200">
                <h4 className="font-medium text-green-900">🏷️ Brand-wise Analysis</h4>
              </div>
              <div className="p-4 space-y-4">
                {extractionResult.brandAnalysis.map((brand: any, index: number) => (
                  <div key={index} className="bg-white border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h5 className="text-lg font-semibold text-gray-900">
                        🏷️ {brand.brand}
                      </h5>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                        {brand.itemCount} products
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {brand.metrics.totalSaleStrips}
                        </div>
                        <div className="text-sm text-gray-600">Sale Strips</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {brand.metrics.totalFreeStrips}
                        </div>
                        <div className="text-sm text-gray-600">Free Strips</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          ₹{brand.metrics.totalSalesAmount.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600">Sales Amount</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          ₹{brand.metrics.totalClosingValue.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600">Closing Value</div>
                      </div>
                    </div>

                    {/* Individual Products */}
                    <div className="space-y-2">
                      <h6 className="font-medium text-gray-700">Products:</h6>
                      {brand.items.map((item: any, itemIndex: number) => (
                        <div key={itemIndex} className="bg-gray-50 p-3 rounded border-l-4 border-blue-400">
                          <div className="font-medium text-gray-900">{item.name}</div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-sm text-gray-600">
                            <div>Purchase: {item.purchase.qty} + {item.purchase.free} free</div>
                            <div>Sales: {item.sales.qty} strips</div>
                            <div>Revenue: ₹{item.sales.value}</div>
                            <div>Closing: {item.closing.qty} strips</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Brand Report */}
          {extractionResult.success && extractionResult.detailedBrandReport && (
            <div className="border border-gray-200 rounded-lg">
              <div className="bg-purple-50 px-4 py-2 border-b border-gray-200">
                <h4 className="font-medium text-purple-900">📋 Detailed Brand Report</h4>
              </div>
              <div className="p-4">
                <div className="bg-white p-4 rounded-lg border max-h-96 overflow-auto">
                  <pre className="whitespace-pre-wrap text-gray-800 font-mono text-sm">
                    {extractionResult.detailedBrandReport}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Raw Extracted Data Display */}
          {extractionResult.success && extractionResult.data && (
            <div className="border border-gray-200 rounded-lg">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <h4 className="font-medium text-gray-900">🔧 Raw Extracted Data</h4>
              </div>
              <div className="p-4">
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-96 text-sm">
                  {JSON.stringify(extractionResult.data, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Extracted Text Display */}
          {extractionResult.success && extractionResult.extractedText && (
            <div className="border border-gray-200 rounded-lg">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <h4 className="font-medium text-gray-900">📄 Extracted Text</h4>
              </div>
              <div className="p-4">
                <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-auto text-sm">
                  <pre className="whitespace-pre-wrap text-gray-800">
                    {extractionResult.extractedText}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Metadata */}
          {extractionResult.metadata && (
            <div className="text-xs text-gray-500 space-y-1">
              <p>File: {extractionResult.metadata.originalFilename}</p>
              <p>Size: {formatFileSize(extractionResult.metadata.fileSize)}</p>
              <p>Output Type: {extractionResult.metadata.outputType}</p>
              <p>Processed: {new Date(extractionResult.metadata.processedAt).toLocaleString()}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PDFExtractor;