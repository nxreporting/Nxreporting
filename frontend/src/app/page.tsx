import Link from 'next/link'
import { FileText, BarChart3, Upload, Settings } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
          PDF Data Extraction & 
          <span className="text-primary-600"> Analytics</span>
        </h1>
        <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
          Upload your PDFs, extract structured data, and generate powerful analytics reports. 
          Transform unstructured documents into actionable insights.
        </p>
        <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
          <div className="rounded-md shadow">
            <Link
              href="/upload"
              className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 md:py-4 md:text-lg md:px-10"
            >
              Get Started
            </Link>
          </div>
          <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
            <Link
              href="/analytics"
              className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
            >
              View Analytics
            </Link>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="mt-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Upload Feature */}
          <div className="text-center">
            <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white mx-auto">
              <Upload className="h-6 w-6" />
            </div>
            <div className="mt-5">
              <h3 className="text-lg font-medium text-gray-900">Easy Upload</h3>
              <p className="mt-2 text-base text-gray-500">
                Drag and drop your PDF files or browse to upload. Supports multiple files.
              </p>
            </div>
          </div>

          {/* Extraction Feature */}
          <div className="text-center">
            <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white mx-auto">
              <FileText className="h-6 w-6" />
            </div>
            <div className="mt-5">
              <h3 className="text-lg font-medium text-gray-900">Smart Extraction</h3>
              <p className="mt-2 text-base text-gray-500">
                AI-powered extraction of text, tables, numbers, and dates from your PDFs.
              </p>
            </div>
          </div>

          {/* Analytics Feature */}
          <div className="text-center">
            <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white mx-auto">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div className="mt-5">
              <h3 className="text-lg font-medium text-gray-900">Rich Analytics</h3>
              <p className="mt-2 text-base text-gray-500">
                Generate insights with interactive charts and comprehensive reports.
              </p>
            </div>
          </div>

          {/* Export Feature */}
          <div className="text-center">
            <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white mx-auto">
              <Settings className="h-6 w-6" />
            </div>
            <div className="mt-5">
              <h3 className="text-lg font-medium text-gray-900">Export Options</h3>
              <p className="mt-2 text-base text-gray-500">
                Download your data as CSV, Excel, or generate PDF reports.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-semibold text-gray-900">1000+</div>
              <div className="text-sm font-medium text-gray-500">PDFs Processed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-gray-900">50GB+</div>
              <div className="text-sm font-medium text-gray-500">Data Extracted</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-gray-900">98%</div>
              <div className="text-sm font-medium text-gray-500">Success Rate</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}