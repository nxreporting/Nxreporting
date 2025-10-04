import express from 'express';
import express from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { extractPDFData } from '../services/pdfExtraction';
import { testAvailableModels } from '../services/huggingFaceService';

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB default
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Upload PDF file
router.post('/upload', authenticate, upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { message: 'No file uploaded' }
      });
    }

    const user = (req as any).user;

    // Save file info to database
    const uploadedFile = await prisma.uploadedFile.create({
      data: {
        originalName: req.file.originalname,
        filename: req.file.filename,
        path: req.file.path,
        mimetype: req.file.mimetype,
        size: req.file.size,
        uploadedById: user.id
      }
    });

    // Check if AI extraction is requested
    const useAI = req.body.useAI === 'true' || req.query.useAI === 'true';
    
    // Start PDF extraction process
    try {
      console.log(`🚀 Starting extraction for ${req.file.originalname} (AI: ${useAI})`);
      const extractedData = await extractPDFData(req.file.path, useAI);
      
      // Prepare structured data for database storage
      const structuredDataForDB = {
        ...extractedData.structured,
        ...(extractedData.aiExtracted && {
          aiExtracted: extractedData.aiExtracted
        })
      };
      
      await prisma.extractedData.create({
        data: {
          rawData: extractedData.raw,
          structuredData: structuredDataForDB,
          status: 'COMPLETED',
          fileId: uploadedFile.id,
          extractedById: user.id
        }
      });
      
      console.log('✅ Extraction completed successfully');
    } catch (extractionError) {
      console.error('Extraction error:', extractionError);
      
      await prisma.extractedData.create({
        data: {
          rawData: {},
          structuredData: {},
          status: 'FAILED',
          errorMessage: extractionError instanceof Error ? extractionError.message : 'Unknown error',
          fileId: uploadedFile.id,
          extractedById: user.id
        }
      });
    }

    res.status(201).json({
      success: true,
      data: { file: uploadedFile }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'File upload failed' }
    });
  }
});

// Get user's uploaded files
router.get('/', authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const files = await prisma.uploadedFile.findMany({
      where: { uploadedById: user.id },
      include: {
        extractedData: {
          select: {
            id: true,
            status: true,
            extractedAt: true,
            errorMessage: true
          }
        }
      },
      orderBy: { uploadedAt: 'desc' },
      skip,
      take: limit
    });

    const total = await prisma.uploadedFile.count({
      where: { uploadedById: user.id }
    });

    res.json({
      success: true,
      data: {
        files,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch files' }
    });
  }
});

// Test available AI models
router.get('/test/ai-models', authenticate, async (req, res) => {
  try {
    console.log('🧪 Starting AI model availability test...');
    
    // Capture console output
    const originalLog = console.log;
    const logs: string[] = [];
    console.log = (...args) => {
      logs.push(args.join(' '));
      originalLog(...args);
    };
    
    await testAvailableModels();
    
    // Restore console.log
    console.log = originalLog;
    
    res.json({
      success: true,
      data: {
        message: 'AI model test completed. Check console for detailed results.',
        logs: logs
      }
    });
  } catch (error) {
    console.error('AI model test error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'AI model test failed' }
    });
  }
});

// Get specific file details
router.get('/:id', authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const fileId = req.params.id;

    const file = await prisma.uploadedFile.findFirst({
      where: {
        id: fileId,
        uploadedById: user.id
      },
      include: {
        extractedData: true
      }
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        error: { message: 'File not found' }
      });
    }

    res.json({
      success: true,
      data: { file }
    });
  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch file' }
    });
  }
});

// Delete file
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const fileId = req.params.id;

    const file = await prisma.uploadedFile.findFirst({
      where: {
        id: fileId,
        uploadedById: user.id
      }
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        error: { message: 'File not found' }
      });
    }

    // Delete file record (cascades to extracted data)
    await prisma.uploadedFile.delete({
      where: { id: fileId }
    });

    // TODO: Also delete physical file from filesystem

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to delete file' }
    });
  }
});

export default router;