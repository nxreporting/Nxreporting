export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    user: User;
    token: string;
  };
  error?: {
    message: string;
  };
}

export interface UploadedFile {
  id: string;
  originalName: string;
  filename: string;
  path: string;
  mimetype: string;
  size: number;
  uploadedAt: string;
  uploadedById: string;
  extractedData?: ExtractedData[];
}

export interface ExtractedData {
  id: string;
  rawData: {
    text: string;
    pages: number;
    info?: any;
  };
  structuredData: {
    title?: string;
    dates?: string[];
    numbers?: number[];
    tables?: any[];
    metadata?: {
      wordCount: number;
      lineCount: number;
      hasNumbers: boolean;
      hasDates: boolean;
      hasTables: boolean;
    };
  };
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'PENDING';
  errorMessage?: string;
  extractedAt: string;
  fileId: string;
  extractedById: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ReportData {
  totalFiles: number;
  successfulExtractions: number;
  failedExtractions: number;
  timeline: Record<string, number>;
  fileSizes: Array<{
    name: string;
    size: number;
    status: string;
    extractedAt: string;
  }>;
  statusDistribution: {
    completed: number;
    failed: number;
    processing: number;
    pending: number;
  };
  insights: Array<{
    fileId: string;
    fileName: string;
    metadata: any;
    dates: string[];
    numbers: number[];
  }>;
}