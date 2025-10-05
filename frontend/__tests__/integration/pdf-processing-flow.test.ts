import { createMocks } from 'node-mocks-http'
import { NextApiRequest, NextApiResponse } from 'next'
import extractHandler from '../../pages/api/extract'
import filesHandler from '../../pages/api/files/index'
import { prisma } from '../../lib/prisma'
import { nanonetsService } from '../../lib/services/nanonetsExtractionService'
import { uploadFile, validateFile, generateSafeFilename } from '../../lib/storage'
import formidable from 'formidable'

// Mock formidable
jest.mock('formidable')
const mockedFormidable = formidable as jest.Mocked<typeof formidable>

// Mock services
jest.mock('../../lib/services/nanonetsExtractionService')
jest.mock('../../lib/storage')

const mockedNanonetsService = nanonetsService as jest.Mocked<typeof nanonetsService>
const mockedUploadFile = uploadFile as jest.MockedFunction<typeof uploadFile>
const mockedValidateFile = validateFile as jest.MockedFunction<typeof validateFile>
const mockedGenerateSafeFilename = generateSafeFilename as jest.MockedFunction<typeof generateSafeFilename>

// Mock auth
jest.mock('../../lib/auth', () => ({
  withAuth: jest.fn((handler) => (req: any, res: any) => {
    req.user = {
      id: 'user-1',
      email: 'test@example.com',
      role: 'USER',
    }
    return handler(req, res)
  }),
}))

describe('PDF Processing Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default mocks
    mockedValidateFile.mockReturnValue({ valid: true })
    mockedGenerateSafeFilename.mockReturnValue('safe-filename.pdf')
    mockedUploadFile.mockResolvedValue({ 
      success: true, 
      url: 'https://storage.example.com/file.pdf' 
    })
  })

  it('should complete full PDF upload and extraction flow', async () => {
    // Step 1: Upload PDF file
    const uploadReq = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
    })

    const mockFile = {
      filepath: '/tmp/test.pdf',
      originalFilename: 'test-document.pdf',
      size: 1024 * 1024, // 1MB
      mimetype: 'application/pdf',
    }

    const mockForm = {
      parse: jest.fn().mockResolvedValue([{ useAI: ['true'] }, { pdf: mockFile }]),
    }
    
    ;(mockedFormidable as any).mockReturnValue(mockForm)

    // Mock file system
    const fs = require('fs')
    fs.promises.readFile.mockResolvedValue(Buffer.from('mock pdf content'))
    fs.promises.unlink.mockResolvedValue(undefined)

    const mockDbFile = {
      id: 'file-1',
      originalName: 'test-document.pdf',
      filename: 'safe-filename.pdf',
      path: 'https://storage.example.com/file.pdf',
      mimetype: 'application/pdf',
      size: 1024 * 1024,
      uploadedById: 'user-1',
      uploadedAt: new Date(),
    }

    ;(prisma.uploadedFile.create as jest.Mock).mockResolvedValue(mockDbFile)

    // Mock successful Nanonets extraction for async processing
    mockedNanonetsService.extractFromUrl.mockResolvedValue({
      success: true,
      data: {
        company_name: 'Test Company',
        report_title: 'Stock Report',
        items: [
          { product: 'Product A', quantity: 100, value: 1000 },
          { product: 'Product B', quantity: 50, value: 500 },
        ],
      },
      extractedText: 'Test Company Stock Report...',
      rawResponse: {},
    })

    ;(prisma.extractedData.create as jest.Mock).mockResolvedValue({
      id: 'extract-1',
      fileId: 'file-1',
      status: 'COMPLETED',
      extractedAt: new Date(),
    })

    await filesHandler(uploadReq.req, uploadReq.res)

    expect(uploadReq.res._getStatusCode()).toBe(201)
    const uploadData = JSON.parse(uploadReq.res._getData())
    expect(uploadData.success).toBe(true)
    expect(uploadData.data.file.id).toBe('file-1')
    expect(uploadData.data.file.originalName).toBe('test-document.pdf')

    // Step 2: Direct extraction via extract endpoint
    const extractReq = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
    })

    const extractMockForm = {
      parse: jest.fn().mockResolvedValue([
        { output_type: ['flat-json'] }, 
        { file: mockFile }
      ]),
    }
    
    ;(mockedFormidable as any).mockReturnValue(extractMockForm)

    // Mock successful extraction
    mockedNanonetsService.extractFromBuffer.mockResolvedValue({
      success: true,
      data: {
        company_name: 'Test Company',
        report_title: 'Stock Report',
        date_range: '2024-01-01 to 2024-01-31',
        items: [
          { 
            product: 'Product A', 
            quantity: 100, 
            unit_price: 10.00,
            total_value: 1000.00 
          },
          { 
            product: 'Product B', 
            quantity: 50, 
            unit_price: 10.00,
            total_value: 500.00 
          },
        ],
        total_sales_value: 1500.00,
        total_closing_value: 1500.00,
      },
      extractedText: 'Test Company Stock Report Product A 100 units...',
      rawResponse: { status: 'success' },
    })

    await extractHandler(extractReq.req, extractReq.res)

    expect(extractReq.res._getStatusCode()).toBe(200)
    const extractData = JSON.parse(extractReq.res._getData())
    expect(extractData.success).toBe(true)
    expect(extractData.data.message).toBe('PDF extracted successfully')
    expect(extractData.data.data.company_name).toBe('Test Company')
    expect(extractData.data.formattedData).toBeDefined()
    expect(extractData.data.summary).toBeDefined()
    expect(extractData.data.brandAnalysis).toBeDefined()

    // Step 3: Verify file listing includes uploaded file
    const listReq = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      query: { page: '1', limit: '10' },
    })

    const mockFiles = [
      {
        ...mockDbFile,
        extractedData: [
          {
            id: 'extract-1',
            status: 'COMPLETED',
            extractedAt: new Date(),
            errorMessage: null,
          },
        ],
      },
    ]

    ;(prisma.uploadedFile.findMany as jest.Mock).mockResolvedValue(mockFiles)
    ;(prisma.uploadedFile.count as jest.Mock).mockResolvedValue(1)

    await filesHandler(listReq.req, listReq.res)

    expect(listReq.res._getStatusCode()).toBe(200)
    const listData = JSON.parse(listReq.res._getData())
    expect(listData.success).toBe(true)
    expect(listData.data.files).toHaveLength(1)
    expect(listData.data.files[0].id).toBe('file-1')
    expect(listData.data.files[0].extractedData).toHaveLength(1)
    expect(listData.data.files[0].extractedData[0].status).toBe('COMPLETED')
  })

  it('should handle extraction failures gracefully', async () => {
    const extractReq = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
    })

    const mockFile = {
      filepath: '/tmp/corrupted.pdf',
      originalFilename: 'corrupted.pdf',
      size: 1024,
      mimetype: 'application/pdf',
    }

    const mockForm = {
      parse: jest.fn().mockResolvedValue([{}, { file: mockFile }]),
    }
    
    ;(mockedFormidable as any).mockReturnValue(mockForm)

    const fs = require('fs')
    fs.promises.readFile.mockResolvedValue(Buffer.from('corrupted pdf content'))
    fs.promises.unlink.mockResolvedValue(undefined)

    // Mock extraction failure
    mockedNanonetsService.extractFromBuffer.mockResolvedValue({
      success: false,
      error: 'Unable to process corrupted PDF',
      data: null,
      extractedText: '',
      rawResponse: {},
    })

    await extractHandler(extractReq.req, extractReq.res)

    expect(extractReq.res._getStatusCode()).toBe(500)
    const data = JSON.parse(extractReq.res._getData())
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('EXTRACTION_FAILED')
    expect(data.error.message).toBe('Unable to process corrupted PDF')
  })

  it('should handle large file processing with timeout protection', async () => {
    const extractReq = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
    })

    const mockFile = {
      filepath: '/tmp/large.pdf',
      originalFilename: 'large-document.pdf',
      size: 45 * 1024 * 1024, // 45MB
      mimetype: 'application/pdf',
    }

    const mockForm = {
      parse: jest.fn().mockResolvedValue([{}, { file: mockFile }]),
    }
    
    ;(mockedFormidable as any).mockReturnValue(mockForm)

    const fs = require('fs')
    fs.promises.readFile.mockResolvedValue(Buffer.alloc(45 * 1024 * 1024))
    fs.promises.unlink.mockResolvedValue(undefined)

    // Mock timeout during extraction
    mockedNanonetsService.extractFromBuffer.mockImplementation(() => {
      return new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Function timeout')), 100)
      })
    })

    await extractHandler(extractReq.req, extractReq.res)

    expect(extractReq.res._getStatusCode()).toBe(408)
    const data = JSON.parse(extractReq.res._getData())
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('TIMEOUT_ERROR')
  })

  it('should validate file types and reject non-PDFs', async () => {
    const uploadReq = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
    })

    const mockFile = {
      filepath: '/tmp/document.docx',
      originalFilename: 'document.docx',
      size: 1024,
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    }

    const mockForm = {
      parse: jest.fn().mockResolvedValue([{}, { pdf: mockFile }]),
    }
    
    ;(mockedFormidable as any).mockReturnValue(mockForm)

    const fs = require('fs')
    fs.promises.readFile.mockResolvedValue(Buffer.from('docx content'))
    fs.promises.unlink.mockResolvedValue(undefined)

    // Mock validation failure
    mockedValidateFile.mockReturnValue({
      valid: false,
      error: 'Only PDF files are allowed',
    })

    await filesHandler(uploadReq.req, uploadReq.res)

    expect(uploadReq.res._getStatusCode()).toBe(400)
    const data = JSON.parse(uploadReq.res._getData())
    expect(data.success).toBe(false)
    expect(data.error.message).toBe('Only PDF files are allowed')
  })

  it('should handle cloud storage failures during upload', async () => {
    const uploadReq = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
    })

    const mockFile = {
      filepath: '/tmp/test.pdf',
      originalFilename: 'test.pdf',
      size: 1024,
      mimetype: 'application/pdf',
    }

    const mockForm = {
      parse: jest.fn().mockResolvedValue([{}, { pdf: mockFile }]),
    }
    
    ;(mockedFormidable as any).mockReturnValue(mockForm)

    const fs = require('fs')
    fs.promises.readFile.mockResolvedValue(Buffer.from('pdf content'))
    fs.promises.unlink.mockResolvedValue(undefined)

    // Mock storage failure
    mockedUploadFile.mockResolvedValue({
      success: false,
      error: 'Cloud storage service temporarily unavailable',
    })

    await filesHandler(uploadReq.req, uploadReq.res)

    expect(uploadReq.res._getStatusCode()).toBe(500)
    const data = JSON.parse(uploadReq.res._getData())
    expect(data.success).toBe(false)
    expect(data.error.message).toBe('Cloud storage service temporarily unavailable')
  })
})