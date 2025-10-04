import { uploadFile, validateFile, generateSafeFilename } from '../../../lib/storage'
import { put } from '@vercel/blob'

// Mock Vercel Blob
jest.mock('@vercel/blob', () => ({
  put: jest.fn(),
}))

const mockedPut = put as jest.MockedFunction<typeof put>

describe('Storage Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('validateFile', () => {
    it('should validate PDF files successfully', () => {
      const file = new File(['pdf content'], 'document.pdf', {
        type: 'application/pdf',
      })

      const result = validateFile(file)

      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject non-PDF files', () => {
      const file = new File(['text content'], 'document.txt', {
        type: 'text/plain',
      })

      const result = validateFile(file)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('Only PDF files are allowed')
    })

    it('should reject files exceeding size limit', () => {
      const file = new File(['x'.repeat(60 * 1024 * 1024)], 'large.pdf', {
        type: 'application/pdf',
      })

      const result = validateFile(file, { maxSize: 50 * 1024 * 1024 })

      expect(result.valid).toBe(false)
      expect(result.error).toContain('File size exceeds')
    })

    it('should reject empty files', () => {
      const file = new File([''], 'empty.pdf', {
        type: 'application/pdf',
      })

      const result = validateFile(file)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('File is empty')
    })

    it('should validate custom file types', () => {
      const file = new File(['image content'], 'image.jpg', {
        type: 'image/jpeg',
      })

      const result = validateFile(file, {
        allowedTypes: ['image/jpeg', 'image/png'],
      })

      expect(result.valid).toBe(true)
    })

    it('should reject files with invalid extensions', () => {
      const file = new File(['pdf content'], 'document.exe', {
        type: 'application/pdf',
      })

      const result = validateFile(file)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('Invalid file extension')
    })
  })

  describe('generateSafeFilename', () => {
    it('should generate safe filename with timestamp', () => {
      const result = generateSafeFilename('document.pdf')

      expect(result).toMatch(/^\d{13}-document\.pdf$/)
    })

    it('should sanitize unsafe characters', () => {
      const result = generateSafeFilename('my document (1) & file.pdf')

      expect(result).toMatch(/^\d{13}-my-document-1-file\.pdf$/)
    })

    it('should handle files without extensions', () => {
      const result = generateSafeFilename('document')

      expect(result).toMatch(/^\d{13}-document$/)
    })

    it('should handle very long filenames', () => {
      const longName = 'a'.repeat(200) + '.pdf'
      const result = generateSafeFilename(longName)

      expect(result.length).toBeLessThanOrEqual(100)
      expect(result).toMatch(/^\d{13}-a+\.pdf$/)
    })

    it('should handle special characters and spaces', () => {
      const result = generateSafeFilename('file with spaces & symbols!@#.pdf')

      expect(result).toMatch(/^\d{13}-file-with-spaces-symbols\.pdf$/)
    })

    it('should preserve file extension', () => {
      const result = generateSafeFilename('document.PDF')

      expect(result).toMatch(/^\d{13}-document\.pdf$/)
    })
  })

  describe('uploadFile', () => {
    it('should upload file successfully to Vercel Blob', async () => {
      const fileBuffer = Buffer.from('pdf content')
      const filename = 'test-document.pdf'

      mockedPut.mockResolvedValue({
        url: 'https://blob.vercel-storage.com/test-document.pdf',
        pathname: 'test-document.pdf',
        contentType: 'application/pdf',
        contentDisposition: 'attachment; filename="test-document.pdf"',
      })

      const result = await uploadFile(fileBuffer, filename)

      expect(result.success).toBe(true)
      expect(result.url).toBe('https://blob.vercel-storage.com/test-document.pdf')
      expect(result.error).toBeUndefined()
      expect(mockedPut).toHaveBeenCalledWith(filename, fileBuffer, {
        access: 'public',
        contentType: 'application/pdf',
      })
    })

    it('should handle upload failures', async () => {
      const fileBuffer = Buffer.from('pdf content')
      const filename = 'test-document.pdf'

      mockedPut.mockRejectedValue(new Error('Storage service unavailable'))

      const result = await uploadFile(fileBuffer, filename)

      expect(result.success).toBe(false)
      expect(result.url).toBeUndefined()
      expect(result.error).toBe('Storage service unavailable')
    })

    it('should detect content type from filename', async () => {
      const fileBuffer = Buffer.from('image content')
      const filename = 'image.jpg'

      mockedPut.mockResolvedValue({
        url: 'https://blob.vercel-storage.com/image.jpg',
        pathname: 'image.jpg',
        contentType: 'image/jpeg',
        contentDisposition: 'attachment; filename="image.jpg"',
      })

      await uploadFile(fileBuffer, filename)

      expect(mockedPut).toHaveBeenCalledWith(filename, fileBuffer, {
        access: 'public',
        contentType: 'image/jpeg',
      })
    })

    it('should handle unknown file types', async () => {
      const fileBuffer = Buffer.from('unknown content')
      const filename = 'file.unknown'

      mockedPut.mockResolvedValue({
        url: 'https://blob.vercel-storage.com/file.unknown',
        pathname: 'file.unknown',
        contentType: 'application/octet-stream',
        contentDisposition: 'attachment; filename="file.unknown"',
      })

      await uploadFile(fileBuffer, filename)

      expect(mockedPut).toHaveBeenCalledWith(filename, fileBuffer, {
        access: 'public',
        contentType: 'application/octet-stream',
      })
    })

    it('should handle network timeouts', async () => {
      const fileBuffer = Buffer.from('pdf content')
      const filename = 'test-document.pdf'

      mockedPut.mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Network timeout')), 100)
        })
      })

      const result = await uploadFile(fileBuffer, filename)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network timeout')
    })
  })
})