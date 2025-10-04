// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Mock environment variables for testing
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db'
process.env.NANONETS_API_KEY = 'test-nanonets-key'
process.env.OPENAI_API_KEY = 'test-openai-key'
process.env.BLOB_READ_WRITE_TOKEN = 'test-blob-token'

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to ignore specific log levels
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

// Mock fetch for API calls
global.fetch = jest.fn()

// Mock file system operations
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    unlink: jest.fn(),
    mkdir: jest.fn(),
  },
}))

// Mock formidable for file uploads
jest.mock('formidable', () => {
  return {
    __esModule: true,
    default: jest.fn(() => ({
      parse: jest.fn(),
    })),
  }
})

// Mock Prisma client
jest.mock('./lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    uploadedFile: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    extractedData: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    $disconnect: jest.fn(),
  },
}))

// Mock external services
jest.mock('./lib/services/nanonetsExtractionService', () => ({
  nanonetsService: {
    extractFromBuffer: jest.fn(),
    extractFromUrl: jest.fn(),
  },
}))

jest.mock('./lib/storage', () => ({
  uploadFile: jest.fn(),
  validateFile: jest.fn(),
  generateSafeFilename: jest.fn(),
}))

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks()
})