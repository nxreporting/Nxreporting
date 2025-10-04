import { createMocks } from 'node-mocks-http'
import { NextApiRequest, NextApiResponse } from 'next'
import extractHandler from '../../../pages/api/extract'
import { nanonetsService } from '../../../lib/services/nanonetsExtractionService'
import { uploadFile, validateFile, generateSafeFilename } from '../../../lib/storage'
import * as formidable from 'formidable'

// Mock formidable
jest.mock('formidable')
const mockedFormidable = formidable as jest.Mocked<typeof formidable>

// Mock file system
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    unlink: jest.fn(),
  },
}))

// Mock services
jest.mock('../../../lib/services/nanonetsExtractionService')
jest.mock('../../../lib/storage')

const mockedNanonetsService = nanonetsService as jest.Mocked<typeof nanonetsService>
const mockedUploadFile = uploadFile as jest.MockedFunction<typeof uploadFile>
const mockedValidateFile = validateFile as jest.MockedFunction<typeof validateFile>
const mockedGenerateSafeFilename = generateSafeFilename as jest.MockedFunction<typeof generateSafeFilename>

describe('/api/extract', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default mocks
    mockedValidateFile.mockReturnValue({ valid: true })
    mockedGenerateSafeFilename.mockReturnValue('safe-filename.pdf')
    mockedUploadFile.mockResolvedValue({ success: true, url: 'https://storage.example.com/file.pdf' })
  })

  it('should extract PDF successfully', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
    })

    // Mock formidable parse
    const mockFile = {
      filepath: '/tmp/test.pdf',
      originalFilename: 'test.pdf',
      size: 1024 * 1024, // 1MB
      mimetype: 'application/pdf',
    }

    const mockForm = {
      parse: jest.fn().mockResolvedValue([{}, { file: mockFile }]),
    }
    
    ;(mockedFormidable as any).mockReturnValue(mockForm)

    // Mock file system
    const fs = require('fs')
    fs.promises.readFile.mockResolvedValue(Buffer.from('mock pdf content'))
    fs.promises.unlink.mockResolvedValue(undefined)

    // Mock Nanonets service
    mockedNanonetsService.extractFromBuffer.mockResolvedValue({
      success: true,
      data: {
        company_name: 'Test Company',
        report_title: 'Stock Report',
        items: [],
      },
      extractedText: 'Test extracted text',
      rawResponse: {},
    })

    await extractHandler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.success).toBe(true)
    expect(data.data.message).toBe('PDF extracted successfully')
    expect(data.data.data.company_name).toBe('Test Company')
    expect(mockedNanonetsService.extractFromBuffer).toHaveBeenCalledWith(
      expect.any(Buffer),
      'test.pdf',
      'flat-json'
    )
  })

  it('should reject non-PDF files', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
    })

    const mockFile = {
      filepath: '/tmp/test.txt',
      originalFilename: 'test.txt',
      size: 1024,
      mimetype: 'text/plain',
    }

    const mockForm = {
      parse: jest.fn().mockResolvedValue([{}, { file: mockFile }]),
    }
    
    ;(mockedFormidable as any).mockReturnValue(mockForm)

    // Mock validation to reject non-PDF
    mockedValidateFile.mockReturnValue({
      valid: false,
      error: 'Only PDF files are allowed',
    })

    await extractHandler(req, res)

    expect(res._getStatusCode()).toBe(400)
    const data = JSON.parse(res._getData())
    expect(data.success).toBe(false)
    expect(data.error.message).toBe('Only PDF files are allowed')
  })

  it('should handle file size limits', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
    })

    const mockFile = {
      filepath: '/tmp/large.pdf',
      originalFilename: 'large.pdf',
      size: 100 * 1024 * 1024, // 100MB
      mimetype: 'application/pdf',
    }

    const mockForm = {
      parse: jest.fn().mockResolvedValue([{}, { file: mockFile }]),
    }
    
    ;(mockedFormidable as any).mockReturnValue(mockForm)

    // Mock validation to reject large files
    mockedValidateFile.mockReturnValue({
      valid: false,
      error: 'File size exceeds 50MB limit',
    })

    await extractHandler(req, res)

    expect(res._getStatusCode()).toBe(400)
    const data = JSON.parse(res._getData())
    expect(data.success).toBe(false)
    expect(data.error.message).toBe('File size exceeds 50MB limit')
  })

  it('should handle missing file', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
    })

    const mockForm = {
      parse: jest.fn().mockResolvedValue([{}, {}]), // No file
    }
    
    ;(mockedFormidable as any).mockReturnValue(mockForm)

    await extractHandler(req, res)

    expect(res._getStatusCode()).toBe(400)
    const data = JSON.parse(res._getData())
    expect(data.success).toBe(false)
    expect(data.error.message).toBe('No PDF file provided. Please upload a PDF file.')
  })

  it('should handle Nanonets extraction failure', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
    })

    const mockFile = {
      filepath: '/tmp/test.pdf',
      originalFilename: 'test.pdf',
      size: 1024,
      mimetype: 'application/pdf',
    }

    const mockForm = {
      parse: jest.fn().mockResolvedValue([{}, { file: mockFile }]),
    }
    
    ;(mockedFormidable as any).mockReturnValue(mockForm)

    const fs = require('fs')
    fs.promises.readFile.mockResolvedValue(Buffer.from('mock pdf content'))
    fs.promises.unlink.mockResolvedValue(undefined)

    // Mock Nanonets service failure
    mockedNanonetsService.extractFromBuffer.mockResolvedValue({
      success: false,
      error: 'Nanonets API error',
      data: null,
      extractedText: '',
      rawResponse: {},
    })

    await extractHandler(req, res)

    expect(res._getStatusCode()).toBe(500)
    const data = JSON.parse(res._getData())
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('EXTRACTION_FAILED')
  })

  it('should reject non-POST methods', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
    })

    await extractHandler(req, res)

    expect(res._getStatusCode()).toBe(405)
    const data = JSON.parse(res._getData())
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('METHOD_NOT_ALLOWED')
  })

  it('should handle timeout errors', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
    })

    const mockFile = {
      filepath: '/tmp/test.pdf',
      originalFilename: 'test.pdf',
      size: 1024,
      mimetype: 'application/pdf',
    }

    const mockForm = {
      parse: jest.fn().mockResolvedValue([{}, { file: mockFile }]),
    }
    
    ;(mockedFormidable as any).mockReturnValue(mockForm)

    const fs = require('fs')
    fs.promises.readFile.mockResolvedValue(Buffer.from('mock pdf content'))
    fs.promises.unlink.mockResolvedValue(undefined)

    // Mock timeout error
    mockedNanonetsService.extractFromBuffer.mockRejectedValue(new Error('Function timeout'))

    await extractHandler(req, res)

    expect(res._getStatusCode()).toBe(408)
    const data = JSON.parse(res._getData())
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('TIMEOUT_ERROR')
  })
})