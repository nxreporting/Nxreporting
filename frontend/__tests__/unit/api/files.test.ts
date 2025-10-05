import { createMocks } from 'node-mocks-http'
import { NextApiRequest, NextApiResponse } from 'next'
import filesHandler from '../../../pages/api/files/index'
import { prisma } from '../../../lib/prisma'
import { uploadFile, validateFile, generateSafeFilename } from '../../../lib/storage'
import formidable from 'formidable'

// Mock formidable
jest.mock('formidable')
const mockedFormidable = formidable as jest.Mocked<typeof formidable>

// Mock services
jest.mock('../../../lib/storage')
const mockedUploadFile = uploadFile as jest.MockedFunction<typeof uploadFile>
const mockedValidateFile = validateFile as jest.MockedFunction<typeof validateFile>
const mockedGenerateSafeFilename = generateSafeFilename as jest.MockedFunction<typeof generateSafeFilename>

// Mock auth
jest.mock('../../../lib/auth', () => ({
  withAuth: jest.fn((handler) => (req: any, res: any) => {
    // Mock authenticated user
    req.user = {
      id: 'user-1',
      email: 'test@example.com',
      role: 'USER',
    }
    return handler(req, res)
  }),
}))

describe('/api/files', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default mocks
    mockedValidateFile.mockReturnValue({ valid: true })
    mockedGenerateSafeFilename.mockReturnValue('safe-filename.pdf')
    mockedUploadFile.mockResolvedValue({ success: true, url: 'https://storage.example.com/file.pdf' })
  })

  describe('GET /api/files', () => {
    it('should return user files with pagination', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { page: '1', limit: '10' },
      })

      const mockFiles = [
        {
          id: 'file-1',
          originalName: 'test1.pdf',
          filename: 'safe-test1.pdf',
          path: 'https://storage.example.com/test1.pdf',
          size: 1024,
          uploadedAt: new Date(),
          extractedData: [],
        },
        {
          id: 'file-2',
          originalName: 'test2.pdf',
          filename: 'safe-test2.pdf',
          path: 'https://storage.example.com/test2.pdf',
          size: 2048,
          uploadedAt: new Date(),
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
      ;(prisma.uploadedFile.count as jest.Mock).mockResolvedValue(2)

      await filesHandler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(true)
      expect(data.data.files).toHaveLength(2)
      expect(data.metadata.total).toBe(2)
      expect(data.metadata.page).toBe(1)
      expect(data.metadata.limit).toBe(10)
    })

    it('should handle pagination parameters', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { page: '2', limit: '5' },
      })

      ;(prisma.uploadedFile.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.uploadedFile.count as jest.Mock).mockResolvedValue(0)

      await filesHandler(req, res)

      expect(prisma.uploadedFile.findMany).toHaveBeenCalledWith({
        where: { uploadedById: 'user-1' },
        include: expect.any(Object),
        orderBy: { uploadedAt: 'desc' },
        skip: 5, // (page 2 - 1) * limit 5
        take: 5,
      })
    })

    it('should limit maximum items per page', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { page: '1', limit: '100' }, // Requesting more than max
      })

      ;(prisma.uploadedFile.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.uploadedFile.count as jest.Mock).mockResolvedValue(0)

      await filesHandler(req, res)

      expect(prisma.uploadedFile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50, // Should be limited to 50
        })
      )
    })
  })

  describe('POST /api/files', () => {
    it('should upload file successfully', async () => {
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
        parse: jest.fn().mockResolvedValue([{}, { pdf: mockFile }]),
      }
      
      ;(mockedFormidable as any).mockReturnValue(mockForm)

      // Mock file system
      const fs = require('fs')
      fs.promises.readFile.mockResolvedValue(Buffer.from('mock pdf content'))
      fs.promises.unlink.mockResolvedValue(undefined)

      const mockDbFile = {
        id: 'file-1',
        originalName: 'test.pdf',
        filename: 'safe-filename.pdf',
        path: 'https://storage.example.com/file.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        uploadedById: 'user-1',
      }

      ;(prisma.uploadedFile.create as jest.Mock).mockResolvedValue(mockDbFile)

      await filesHandler(req, res)

      expect(res._getStatusCode()).toBe(201)
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(true)
      expect(data.data.file.id).toBe('file-1')
      expect(mockedUploadFile).toHaveBeenCalledWith(
        expect.any(Buffer),
        'safe-filename.pdf'
      )
    })

    it('should reject invalid file types', async () => {
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
        parse: jest.fn().mockResolvedValue([{}, { pdf: mockFile }]),
      }
      
      ;(mockedFormidable as any).mockReturnValue(mockForm)

      const fs = require('fs')
      fs.promises.readFile.mockResolvedValue(Buffer.from('text content'))
      fs.promises.unlink.mockResolvedValue(undefined)

      // Mock validation failure
      mockedValidateFile.mockReturnValue({
        valid: false,
        error: 'Only PDF files are allowed',
      })

      await filesHandler(req, res)

      expect(res._getStatusCode()).toBe(400)
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(false)
      expect(data.error.message).toBe('Only PDF files are allowed')
    })

    it('should handle missing file', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
      })

      const mockForm = {
        parse: jest.fn().mockResolvedValue([{}, {}]), // No file
      }
      
      ;(mockedFormidable as any).mockReturnValue(mockForm)

      await filesHandler(req, res)

      expect(res._getStatusCode()).toBe(400)
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(false)
      expect(data.error.message).toBe('No file uploaded')
    })

    it('should handle cloud storage upload failure', async () => {
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
        parse: jest.fn().mockResolvedValue([{}, { pdf: mockFile }]),
      }
      
      ;(mockedFormidable as any).mockReturnValue(mockForm)

      const fs = require('fs')
      fs.promises.readFile.mockResolvedValue(Buffer.from('mock pdf content'))
      fs.promises.unlink.mockResolvedValue(undefined)

      // Mock upload failure
      mockedUploadFile.mockResolvedValue({
        success: false,
        error: 'Storage service unavailable',
      })

      await filesHandler(req, res)

      expect(res._getStatusCode()).toBe(500)
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(false)
      expect(data.error.message).toBe('Storage service unavailable')
    })
  })

  it('should reject unsupported HTTP methods', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'DELETE',
    })

    await filesHandler(req, res)

    expect(res._getStatusCode()).toBe(405)
    const data = JSON.parse(res._getData())
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('METHOD_NOT_ALLOWED')
  })
})