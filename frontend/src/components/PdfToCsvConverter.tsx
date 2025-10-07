'use client';

import React, { useState } from 'react';
import { Upload, FileText, Download, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface ConversionResponse {
  success: boolean;
  message?: string;
  csvData?: string;
  tableData?: string[][];
  metadata?: {
    originalFilename: string;
    fileSize: number;
    pages: number;
    tablesFound: number;
    companyName?: string;
    reportDate?: string;
    processingTime: number;
  };
  error?: string;
}

const PdfToCsvConverter: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionResult, setConversionResult] = useState<ConversionResponse | null>(null);

  const handleFileSelect = (file: File) => {
    if (file.type !== 'application/pdf') {
      alert('Please select a PDF file');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      alert('File size must be less than 50MB');
      return;
    }

    setSelectedFile(file);
    setConversionResult(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const convertPdfToCsv = async () => {
    if (!selectedFile) {
      alert('Please select a PDF file first.');
      return;
    }

    setIsConverting(true);
    setConversionResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      console.log(`🚀 Starting PDF to CSV conversion: ${selectedFile.name}`);

      const response = await fetch('/api/pdf-to-csv', {
        method: 'POST',
        body: formData,
      });

      let result: ConversionResponse;
      
      if (!response.ok) {
        // Handle non-200 responses
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        
        try {
          const errorJson = JSON.parse(errorText);
          result = {
            success: false,
            error: errorJson.error || errorJson.message || `HTTP ${response.status}: ${response.statusText}`
          };
        } catch {
          result = {
            success: false,
            error: `HTTP ${response.status}: ${response.statusText}`
          };
        }
      } else {
        result = await response.json();
      }

      console.log('📬 Conversion response:', result);
      setConversionResult(result);

    } catch (error: any) {
      console.error('❌ Conversion failed:', error);
      setConversionResult({
        success: false,
        error: `Conversion failed: ${error.message}`
      });
    } finally {
      setIsConverting(false);
    }
  };

  const downloadCsv = () => {
    if (!conversionResult?.csvData) return;

    const blob = new Blob([conversionResult.csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedFile?.name?.replace('.pdf', '') || 'converted'}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">PDF to CSV Converter</h1>
        <p className="text-gray-600">Convert pharmaceutical PDF reports to CSV format</p>
      </div>

      {/* File Upload Area */}
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6 hover:border-blue-400 transition-colors"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Upload PDF File</h3>
        <p className="text-gray-600 mb-4">Drag and drop your PDF here, or click to browse</p>
        
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileInput}
          className="hidden"
          id="file-input"
        />
        <label
          htmlFor="file-input"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
        >
          Choose File
        </label>
        <p className="text-sm text-gray-500 mt-2">Maximum file size: 50MB</p>
      </div>

      {/* Selected File Info */}
      {selectedFile && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <FileText className="h-5 w-5 text-blue-600 mr-2" />
            <span className="font-medium">{selectedFile.name}</span>
            <span className="text-gray-500 ml-2">({(selectedFile.size / 1024).toFixed(2)} KB)</span>
          </div>
        </div>
      )}

      {/* Convert Button */}
      <button
        onClick={convertPdfToCsv}
        disabled={!selectedFile || isConverting}
        className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
          !selectedFile || isConverting
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-green-600 text-white hover:bg-green-700'
        }`}
      >
        {isConverting ? (
          <div className="flex items-center justify-center">
            <Loader2 className="animate-spin h-5 w-5 mr-2" />
            Converting PDF to CSV...
          </div>
        ) : (
          'Convert to CSV'
        )}
      </button>

      {/* Results */}
      {conversionResult && (
        <div className="mt-8">
          {conversionResult.success ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
                <h3 className="text-lg font-medium text-green-900">Conversion Successful!</h3>
              </div>
              
              {conversionResult.metadata && (
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div><strong>Company:</strong> {conversionResult.metadata.companyName}</div>
                  <div><strong>Report Date:</strong> {conversionResult.metadata.reportDate}</div>
                  <div><strong>Pages:</strong> {conversionResult.metadata.pages}</div>
                  <div><strong>Tables Found:</strong> {conversionResult.metadata.tablesFound}</div>
                  <div><strong>Processing Time:</strong> {conversionResult.metadata.processingTime}ms</div>
                  <div><strong>Rows Extracted:</strong> {conversionResult.tableData?.length || 0}</div>
                </div>
              )}

              <button
                onClick={downloadCsv}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Download CSV
              </button>

              {/* Preview Table */}
              {conversionResult.tableData && conversionResult.tableData.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium mb-2">Preview (first 10 rows):</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-300">
                      <tbody>
                        {conversionResult.tableData.slice(0, 10).map((row, index) => (
                          <tr key={index} className={index === 0 ? 'bg-gray-100 font-medium' : 'bg-white'}>
                            {row.map((cell, cellIndex) => (
                              <td key={cellIndex} className="border border-gray-300 px-2 py-1 text-sm">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center mb-2">
                <AlertCircle className="h-6 w-6 text-red-600 mr-2" />
                <h3 className="text-lg font-medium text-red-900">Conversion Failed</h3>
              </div>
              <p className="text-red-700">
                {typeof conversionResult.error === 'string' 
                  ? conversionResult.error 
                  : JSON.stringify(conversionResult.error)
                }
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PdfToCsvConverter;