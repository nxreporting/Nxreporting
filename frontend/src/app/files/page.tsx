'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import { UploadedFile } from '@/types';
import { 
  FileText, Eye, Download, Trash2, Search, RefreshCw,
  CheckCircle, XCircle, Clock, AlertTriangle, Upload
} from 'lucide-react';

export default function FilesPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Handle authentication redirect
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  // Fetch files when component mounts and user is authenticated
  useEffect(() => {
    if (!authLoading && user) {
      fetchFiles();
    }
  }, [user, authLoading]);

  // Return loading while checking authentication
  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const response = await api.get('/files?limit=50');
      if (response.data.success) {
        setFiles(response.data.data.files);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteFile = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await api.delete(`/files/${fileId}`);
      if (response.data.success) {
        setFiles(files.filter(f => f.id !== fileId));
        if (selectedFile?.id === fileId) {
          setSelectedFile(null);
          setShowDetails(false);
        }
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Failed to delete file. Please try again.');
    }
  };

  const viewFileDetails = async (file: UploadedFile) => {
    try {
      const response = await api.get(`/files/${file.id}`);
      if (response.data.success) {
        setSelectedFile(response.data.data.file);
        setShowDetails(true);
      }
    } catch (error) {
      console.error('Error fetching file details:', error);
    }
  };

  const filteredFiles = files.filter(file =>
    file.originalName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const config = {
      COMPLETED: { icon: CheckCircle, color: 'text-green-600 bg-green-100', label: 'Completed' },
      FAILED: { icon: XCircle, color: 'text-red-600 bg-red-100', label: 'Failed' },
      PROCESSING: { icon: Clock, color: 'text-blue-600 bg-blue-100', label: 'Processing' },
      PENDING: { icon: AlertTriangle, color: 'text-yellow-600 bg-yellow-100', label: 'Pending' }
    };

    const { icon: Icon, color, label } = config[status as keyof typeof config] || config.PENDING;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">File Management</h1>
          <p className="mt-2 text-gray-600">
            View, manage, and monitor your uploaded PDF files and their processing status.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchFiles}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={() => router.push('/upload')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload New
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search files..."
            className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          />
        </div>
      </div>

      {/* Files Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Files List */}
        <div className="lg:col-span-2">
          {filteredFiles.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {searchTerm ? 'No files found' : 'No files uploaded'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm 
                  ? 'Try adjusting your search terms.'
                  : 'Get started by uploading your first PDF file.'
                }
              </p>
              {!searchTerm && (
                <div className="mt-6">
                  <button
                    onClick={() => router.push('/upload')}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload PDF
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="divide-y divide-gray-200">
                {filteredFiles.map((file) => (
                  <div key={file.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <FileText className="h-8 w-8 text-gray-400" />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {file.originalName}
                          </h3>
                          <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                            <span>{formatFileSize(file.size)}</span>
                            <span>•</span>
                            <span>{formatDate(file.uploadedAt)}</span>
                          </div>
                          <div className="mt-2">
                            {getStatusBadge(file.extractedData?.[0]?.status || 'PENDING')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => router.push(`/view-data/${file.id}`)}
                          className="p-2 text-gray-400 hover:text-blue-600"
                          title="View Extracted Data"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => viewFileDetails(file)}
                          className="p-2 text-gray-400 hover:text-gray-600"
                          title="View Details"
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteFile(file.id)}
                          className="p-2 text-gray-400 hover:text-red-600"
                          title="Delete File"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* File Details Sidebar */}
        <div className="lg:col-span-1">
          {showDetails && selectedFile ? (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">File Details</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Filename</dt>
                  <dd className="mt-1 text-sm text-gray-900 break-words">{selectedFile.originalName}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Size</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatFileSize(selectedFile.size)}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Upload Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(selectedFile.uploadedAt)}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1">
                    {getStatusBadge(selectedFile.extractedData?.[0]?.status || 'PENDING')}
                  </dd>
                </div>

                {selectedFile.extractedData?.[0]?.structuredData && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Extracted Data Summary</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      <div className="bg-gray-50 rounded p-3 space-y-2">
                        {(selectedFile.extractedData[0].structuredData as any)?.metadata && (
                          <>
                            <div>Word Count: {(selectedFile.extractedData[0].structuredData as any).metadata.wordCount || 0}</div>
                            <div>Dates Found: {(selectedFile.extractedData[0].structuredData as any).dates?.length || 0}</div>
                            <div>Numbers Found: {(selectedFile.extractedData[0].structuredData as any).numbers?.length || 0}</div>
                            <div>Has Tables: {(selectedFile.extractedData[0].structuredData as any).metadata.hasTables ? 'Yes' : 'No'}</div>
                          </>
                        )}
                      </div>
                    </dd>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-center text-gray-500">
                <FileText className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No file selected</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Click on a file to view its details and extraction results.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}