'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  id?: string;
  error?: string;
}

export default function UploadPage() {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [useAI, setUseAI] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Handle authentication redirect
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  // Define onDrop callback - must be defined before any early returns
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newFiles: UploadingFile[] = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const
    }));

    setUploadingFiles(prev => [...prev, ...newFiles]);

    // Upload each file
    for (let i = 0; i < newFiles.length; i++) {
      const uploadingFile = newFiles[i];
      try {
        const formData = new FormData();
        formData.append('pdf', uploadingFile.file);
        formData.append('useAI', useAI.toString());

        console.log(`🚀 Uploading ${uploadingFile.file.name} with AI: ${useAI}`);

        const response = await api.post('/files/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const progress = progressEvent.total 
              ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
              : 0;
            
            setUploadingFiles(prev => 
              prev.map((file, index) => 
                index === prev.length - newFiles.length + i
                  ? { ...file, progress }
                  : file
              )
            );
          },
        });

        if (response.data.success) {
          setUploadingFiles(prev => 
            prev.map((file, index) => 
              index === prev.length - newFiles.length + i
                ? { ...file, status: 'success', id: response.data.data.file.id }
                : file
            )
          );
        } else {
          throw new Error(response.data.error?.message || 'Upload failed');
        }
      } catch (error: any) {
        setUploadingFiles(prev => 
          prev.map((file, index) => 
            index === prev.length - newFiles.length + i
              ? { 
                  ...file, 
                  status: 'error', 
                  error: error.response?.data?.error?.message || error.message || 'Upload failed'
                }
              : file
          )
        );
      }
    }
  }, [useAI]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: true
  });

  // Return loading while checking authentication
  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const removeFile = (index: number) => {
    setUploadingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getStatusIcon = (status: UploadingFile['status']) => {
    switch (status) {
      case 'uploading':
        return <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Upload PDFs</h1>
        <p className="mt-2 text-gray-600">
          Upload your PDF files to extract structured data and generate analytics.
        </p>
      </div>

      {/* AI Extraction Toggle */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="ai-extraction"
              type="checkbox"
              checked={useAI}
              onChange={(e) => setUseAI(e.target.checked)}
              className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
          </div>
          <div className="ml-3">
            <label htmlFor="ai-extraction" className="text-sm font-medium text-blue-900">
              🤖 Enable AI-Powered Extraction
            </label>
            <p className="text-sm text-blue-700">
              Use Hugging Face Mistral-7B to extract structured pharmaceutical data from your PDFs.
              {useAI && (
                <span className="block mt-1 text-xs text-blue-600">
                  ✨ AI extraction will identify: item names, quantities, sales values, stock levels
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={`file-upload-zone border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer
          ${isDragActive ? 'drag-over' : 'border-gray-300 hover:border-gray-400'}
        `}
      >
        <input {...getInputProps()} />
        <div className="space-y-4">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-primary-100">
            <Upload className="h-8 w-8 text-primary-600" />
          </div>
          
          {isDragActive ? (
            <div>
              <p className="text-lg font-medium text-primary-600">Drop the files here...</p>
            </div>
          ) : (
            <div>
              <p className="text-lg font-medium text-gray-900">
                Drag & drop PDF files here, or click to select
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Only PDF files are allowed. You can upload multiple files at once.
              </p>
            </div>
          )}
          
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Select Files
          </button>
        </div>
      </div>

      {/* Upload Progress */}
      {uploadingFiles.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Progress</h3>
            <div className="space-y-4">
              {uploadingFiles.map((uploadingFile, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <FileText className="h-8 w-8 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {uploadingFile.file.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {(uploadingFile.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    
                    {uploadingFile.status === 'uploading' && (
                      <div className="mt-2">
                        <div className="bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadingFile.progress}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {uploadingFile.progress}% uploaded
                        </p>
                      </div>
                    )}
                    
                    {uploadingFile.status === 'error' && uploadingFile.error && (
                      <p className="text-sm text-red-600 mt-1">{uploadingFile.error}</p>
                    )}
                    
                    {uploadingFile.status === 'success' && (
                      <p className="text-sm text-green-600 mt-1">
                        Upload complete! Processing data extraction...
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(uploadingFile.status)}
                    <button
                      onClick={() => removeFile(index)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {uploadingFiles.some(f => f.status === 'success') && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  View Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}