'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import { 
  FileText, ArrowLeft, Download, Eye, Calendar, Hash, 
  Mail, Phone, Table, Key, AlertCircle, CheckCircle, 
  Pill, Package
} from 'lucide-react';

interface PharmaStockData {
  itemName: string;
  openingQty: number | null;
  purchaseQty: number | null;
  purchaseFree: number | null;
  salesQty: number | null;
  salesValue: number | null;
  closingQty: number | null;
  closingValue: number | null;
}

interface ExtractedData {
  id: string;
  rawData: any;
  structuredData: any;
  status: string;
  extractedAt: string;
  errorMessage?: string;
}

interface FileDetails {
  id: string;
  originalName: string;
  size: number;
  uploadedAt: string;
  extractedData: ExtractedData[];
}

export default function ViewDataPage() {
  const [fileData, setFileData] = useState<FileDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'raw' | 'structured' | 'pharma'>('overview');
  
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const fileId = params.id as string;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (fileId && user) {
      fetchFileData();
    }
  }, [fileId, user]);

  const fetchFileData = async () => {
    try {
      const response = await api.get(`/files/${fileId}`);
      if (response.data.success) {
        setFileData(response.data.data.file);
      }
    } catch (error) {
      console.error('Error fetching file data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!fileData) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">File not found</h3>
        <p className="mt-1 text-gray-500">The requested file could not be found.</p>
        <button
          onClick={() => router.push('/files')}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Files
        </button>
      </div>
    );
  }

  const extractedData = fileData.extractedData[0];
  const structured = extractedData?.structuredData || {};
  const aiExtracted = structured.aiExtracted;
  const pharmaData = aiExtracted?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/files')}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">PDF Data Viewer</h1>
            <p className="text-gray-600">{fileData.originalName}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {extractedData?.status === 'COMPLETED' && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              Extraction Complete
            </span>
          )}
        </div>
      </div>

      {/* File Info */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">File Size</dt>
            <dd className="mt-1 text-sm text-gray-900">{formatFileSize(fileData.size)}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Upload Date</dt>
            <dd className="mt-1 text-sm text-gray-900">{formatDate(fileData.uploadedAt)}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Extraction Date</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {extractedData ? formatDate(extractedData.extractedAt) : 'Not processed'}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Status</dt>
            <dd className="mt-1 text-sm text-gray-900">{extractedData?.status || 'Pending'}</dd>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            {[
              { id: 'overview', name: 'Overview', icon: Eye },
              { id: 'pharma', name: 'AI Pharmaceutical Data', icon: Pill },
              { id: 'structured', name: 'Structured Data', icon: Table },
              { id: 'raw', name: 'Raw Text', icon: FileText }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center px-6 py-3 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Hash className="h-5 w-5 text-gray-400 mr-2" />
                    <div>
                      <div className="text-lg font-semibold">{structured.metadata?.wordCount || 0}</div>
                      <div className="text-sm text-gray-600">Words</div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                    <div>
                      <div className="text-lg font-semibold">
                        {(structured.dates && Array.isArray(structured.dates)) ? structured.dates.length : 0}
                      </div>
                      <div className="text-sm text-gray-600">Dates</div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Hash className="h-5 w-5 text-gray-400 mr-2" />
                    <div>
                      <div className="text-lg font-semibold">
                        {(structured.numbers && Array.isArray(structured.numbers)) ? structured.numbers.length : 0}
                      </div>
                      <div className="text-sm text-gray-600">Numbers</div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Table className="h-5 w-5 text-gray-400 mr-2" />
                    <div>
                      <div className="text-lg font-semibold">
                        {(structured.tables && Array.isArray(structured.tables)) ? structured.tables.length : 0}
                      </div>
                      <div className="text-sm text-gray-600">Tables</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Document Title */}
              {structured.title && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Document Title</h3>
                  <p className="text-gray-600 bg-gray-50 rounded p-3">{structured.title}</p>
                </div>
              )}

              {/* Document Type */}
              {structured.metadata?.documentType && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Document Type</h3>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {structured.metadata.documentType.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              )}

              {/* Key Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Dates */}
                {structured.dates && Array.isArray(structured.dates) && structured.dates.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                      <Calendar className="w-5 h-5 mr-2" />
                      Dates Found
                    </h3>
                    <div className="space-y-2">
                      {structured.dates
                        .filter((date: any) => date && String(date).trim())
                        .map((date: any, index: number) => (
                        <div key={index} className="bg-gray-50 rounded p-2 text-sm">
                          {String(date)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Emails & Phones */}
                {((structured.emails && Array.isArray(structured.emails) && structured.emails.length > 0) || 
                  (structured.phones && Array.isArray(structured.phones) && structured.phones.length > 0)) && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Contact Information</h3>
                    <div className="space-y-2">
                      {structured.emails && Array.isArray(structured.emails) && structured.emails
                        .filter((email: any) => email && String(email).includes('@'))
                        .map((email: any, index: number) => (
                        <div key={`email-${index}`} className="flex items-center bg-gray-50 rounded p-2 text-sm">
                          <Mail className="w-4 h-4 mr-2 text-gray-400" />
                          {String(email)}
                        </div>
                      ))}
                      {structured.phones && Array.isArray(structured.phones) && structured.phones
                        .filter((phone: any) => phone && String(phone).trim())
                        .map((phone: any, index: number) => (
                        <div key={`phone-${index}`} className="flex items-center bg-gray-50 rounded p-2 text-sm">
                          <Phone className="w-4 h-4 mr-2 text-gray-400" />
                          {String(phone)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'structured' && (
            <div className="space-y-6">
              {/* Key-Value Pairs */}
              {structured.keyValuePairs && typeof structured.keyValuePairs === 'object' && Object.keys(structured.keyValuePairs).length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                    <Key className="w-5 h-5 mr-2" />
                    Key-Value Pairs
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Key
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Value
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {Object.entries(structured.keyValuePairs)
                          .filter(([key, value]) => key && value && String(key).trim() && String(value).trim())
                          .map(([key, value], index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {String(key)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {String(value)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tables */}
              {structured.tables && structured.tables.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                    <Table className="w-5 h-5 mr-2" />
                    Extracted Tables
                  </h3>
                  <div className="space-y-4">
                    {structured.tables
                      .filter((table: any) => Array.isArray(table) && table.length > 0)
                      .map((table: any[], index: number) => (
                      <div key={index} className="overflow-x-auto">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Table {index + 1}</h4>
                        <table className="min-w-full divide-y divide-gray-200 border">
                          <tbody className="bg-white divide-y divide-gray-200">
                            {table
                              .filter((row: any) => Array.isArray(row))
                              .map((row: any[], rowIndex: number) => (
                              <tr key={rowIndex} className={rowIndex === 0 ? 'bg-gray-50' : ''}>
                                {row.map((cell: any, cellIndex: number) => (
                                  <td key={cellIndex} className="px-4 py-2 text-sm text-gray-900 border-r">
                                    {String(cell || '').trim()}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Numbers */}
              {structured.numbers && Array.isArray(structured.numbers) && structured.numbers.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Extracted Numbers</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {structured.numbers
                      .filter((num: any) => num !== null && num !== undefined)
                      .slice(0, 20)
                      .map((number: any, index: number) => (
                      <div key={index} className="bg-gray-50 rounded p-2 text-center text-sm">
                        {typeof number === 'number' ? number : String(number)}
                      </div>
                    ))}
                    {structured.numbers.length > 20 && (
                      <div className="bg-gray-100 rounded p-2 text-center text-sm text-gray-500">
                        +{structured.numbers.length - 20} more
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'pharma' && (
            <div className="space-y-6">
              {/* AI Extraction Status */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Pill className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-blue-900">AI Pharmaceutical Data Extraction</h3>
                      <p className="text-sm text-blue-700">
                        {aiExtracted?.success
                          ? 'AI successfully extracted pharmaceutical inventory data'
                          : 'AI extraction not available or failed'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {aiExtracted?.success ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Success
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {aiExtracted ? 'Failed' : 'Not Available'}
                      </span>
                    )}
                  </div>
                </div>
                {aiExtracted?.error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-700">
                      <strong>Error:</strong> {aiExtracted.error}
                    </p>
                  </div>
                )}
              </div>

              {/* Pharmaceutical Data Table */}
              {aiExtracted?.success && pharmaData && Array.isArray(pharmaData) && pharmaData.length > 0 ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                      <Package className="w-5 h-5 mr-2" />
                      Extracted Pharmaceutical Inventory ({pharmaData.length} items)
                    </h3>
                    <div className="text-sm text-gray-500">
                      Fields: Item Name, Opening Qty, Purchase Qty, Sales Qty, Sales Value, Closing Qty, Closing Value
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Item Name
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Opening Qty
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Purchase Qty
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Purchase Free
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Sales Qty
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Sales Value
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Closing Qty
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Closing Value
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {pharmaData.map((item: PharmaStockData, index: number) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {item.itemName || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              {item.openingQty !== null ? item.openingQty.toLocaleString() : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              {item.purchaseQty !== null ? item.purchaseQty.toLocaleString() : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              {item.purchaseFree !== null ? item.purchaseFree.toLocaleString() : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              {item.salesQty !== null ? item.salesQty.toLocaleString() : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              {item.salesValue !== null ? `₹${item.salesValue.toLocaleString()}` : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              {item.closingQty !== null ? item.closingQty.toLocaleString() : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              {item.closingValue !== null ? `₹${item.closingValue.toLocaleString()}` : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Summary Statistics */}
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <Package className="h-5 w-5 text-blue-400 mr-2" />
                        <div>
                          <div className="text-lg font-semibold text-blue-900">{pharmaData.length}</div>
                          <div className="text-sm text-blue-600">Total Items</div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <Hash className="h-5 w-5 text-green-400 mr-2" />
                        <div>
                          <div className="text-lg font-semibold text-green-900">
                            {pharmaData.reduce((sum, item) => sum + (item.salesQty || 0), 0).toLocaleString()}
                          </div>
                          <div className="text-sm text-green-600">Total Sales Qty</div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <Hash className="h-5 w-5 text-yellow-400 mr-2" />
                        <div>
                          <div className="text-lg font-semibold text-yellow-900">
                            ₹{pharmaData.reduce((sum, item) => sum + (item.salesValue || 0), 0).toLocaleString()}
                          </div>
                          <div className="text-sm text-yellow-600">Total Sales Value</div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <Hash className="h-5 w-5 text-purple-400 mr-2" />
                        <div>
                          <div className="text-lg font-semibold text-purple-900">
                            {pharmaData.reduce((sum, item) => sum + (item.closingQty || 0), 0).toLocaleString()}
                          </div>
                          <div className="text-sm text-purple-600">Total Closing Qty</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-gray-100">
                    <Pill className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="mt-2 text-lg font-medium text-gray-900">No Pharmaceutical Data Available</h3>
                  <p className="mt-1 text-gray-500">
                    {!aiExtracted 
                      ? 'This file was not processed with AI extraction enabled.'
                      : !aiExtracted.success 
                      ? 'AI extraction failed to process pharmaceutical data.'
                      : 'No pharmaceutical inventory data was found in this document.'
                    }
                  </p>
                  <div className="mt-4 text-sm text-gray-400">
                    <p>💡 Tip: Upload pharmaceutical PDFs with "AI Extraction" enabled to see structured inventory data here.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'raw' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Raw Extracted Text</h3>
              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                  {extractedData?.rawData?.text || 'No raw text available'}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}