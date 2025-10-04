import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';

// Import routes
import authRoutes from './routes/auth';
import fileRoutes from './routes/files';
import dataRoutes from './routes/data';
import reportRoutes from './routes/reports';
import { extractPDF, getExtractionStatus, uploadMiddleware } from './routes/extract';
import * as brandRoutes from './routes/brands';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(morgan('combined'));
// CORS configuration for production
const corsOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',')
  : [process.env.FRONTEND_URL || 'http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003', 'http://localhost:3004'];

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files (uploaded files)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/reports', reportRoutes);

// PDF Extraction routes
app.post('/api/extract', uploadMiddleware, extractPDF);
app.get('/api/extract/status', getExtractionStatus);

// Brand Management routes
app.get('/api/brands/divisions', brandRoutes.getAllDivisions);
app.get('/api/brands/divisions/:divisionId', brandRoutes.getBrandsByDivision);
app.get('/api/brands/search', brandRoutes.searchBrands);
app.post('/api/brands/identify', brandRoutes.identifyBrand);
app.post('/api/brands/divisions/:divisionId/brands', brandRoutes.addBrandToDivision);
app.post('/api/brands/divisions', brandRoutes.addDivision);
app.get('/api/brands/stats', brandRoutes.getBrandStats);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
});

export default app;