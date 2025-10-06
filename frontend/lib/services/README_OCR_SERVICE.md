# Multi-Provider OCR Service Documentation

## 📖 Overview

The `multiProviderOCRService` is a robust, production-ready OCR (Optical Character Recognition) service that extracts text from PDF documents using multiple providers with automatic fallback.

### Key Features

- ✅ **Multi-Provider Strategy**: Tries multiple OCR providers in order
- ✅ **Automatic Retry**: 3 attempts per provider with exponential backoff
- ✅ **Smart File Handling**: Optimizes encoding based on file size
- ✅ **Security First**: No API keys in code, sanitized logging
- ✅ **Performance Monitoring**: Built-in analytics and metrics
- ✅ **Serverless Optimized**: Works in Vercel/AWS Lambda environments
- ✅ **Type Safe**: Full TypeScript support

---

## 🚀 Quick Start

### Installation

The service is already included in the project. No additional installation needed.

### Basic Usage

```typescript
import { ocrService } from '@/lib/services/multiProviderOCRService';

// Extract text from PDF buffer
const result = await ocrService.extractFromBuffer(fileBuffer, 'document.pdf');

if (result.success) {
  console.log('Extracted text:', result.extractedText);
  console.log('Provider used:', result.provider);
  console.log('Duration:', result.metadata?.duration, 'ms');
} else {
  console.error('Extraction failed:', result.error);
}
```

---

## 📋 API Reference

### Main Methods

#### `extractFromBuffer(fileBuffer, filename)`

Extract text from a PDF file buffer.

**Parameters:**
- `fileBuffer` (Buffer): The PDF file as a Buffer
- `filename` (string): Original filename (for logging and metadata)

**Returns:** `Promise<OCRResponse>`

**Example:**
```typescript
const fs = require('fs');
const fileBuffer = fs.readFileSync('document.pdf');
const result = await ocrService.extractFromBuffer(fileBuffer, 'document.pdf');
```

#### `extractFromPDF(filePath)`

Extract text from a PDF file path (backward compatibility).

**Parameters:**
- `filePath` (string): Path to the PDF file

**Returns:** `Promise<OCRResponse>`

**Example:**
```typescript
const result = await ocrService.extractFromPDF('/path/to/document.pdf');
```

#### `extractFromUrl(fileUrl)`

Extract text from a PDF URL (downloads first, then extracts).

**Parameters:**
- `fileUrl` (string): URL to the PDF file

**Returns:** `Promise<OCRResponse>`

**Example:**
```typescript
const result = await ocrService.extractFromUrl('https://example.com/document.pdf');
```

#### `getStatus()`

Get the current status of all OCR providers.

**Returns:** Object with provider status

**Example:**
```typescript
const status = ocrService.getStatus();
console.log('Ready:', status.ready);
console.log('Providers:', status.providers);
```

---

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file with the following variables:

```bash
# OCR.space API (Recommended - Free tier available)
OCR_SPACE_API_KEY="your-ocr-space-api-key"

# Nanonets API (Optional - Requires paid plan)
NANONETS_API_KEY="your-nanonets-api-key"
NANONETS_MODEL_ID="your-model-id"
```

### Provider Priority

Providers are tried in this order:

1. **Nanonets** (if configured)
   - Best for pharmaceutical documents
   - Requires paid plan
   - Custom models available

2. **OCR.space** (always available)
   - Free tier: 25,000 requests/month
   - Reliable and fast
   - Good accuracy

3. **Fallback** (always available)
   - Returns file info only
   - No actual OCR
   - Last resort

---

## 📊 Response Format

### OCRResponse Interface

```typescript
interface OCRResponse {
  success: boolean;           // Whether extraction succeeded
  data?: any;                 // Raw response from OCR provider
  error?: string;             // Error message if failed
  extractedText?: string;     // Extracted text content
  rawResponse?: any;          // Full raw response
  provider?: string;          // Which provider was used
  metadata?: {
    attempts?: number;        // Number of retry attempts
    duration?: number;        // Total time in milliseconds
    fileSize?: number;        // File size in bytes
  };
}
```

### Success Response Example

```typescript
{
  success: true,
  extractedText: "This is the extracted text from the PDF...",
  provider: "OCR.space",
  metadata: {
    attempts: 1,
    duration: 2340,
    fileSize: 1024000
  }
}
```

### Error Response Example

```typescript
{
  success: false,
  error: "All OCR providers failed",
  provider: "none",
  metadata: {
    attempts: 9,
    duration: 15000,
    fileSize: 1024000
  }
}
```

---

## 🔄 Provider Details

### Nanonets Provider

**Endpoint:** `https://app.nanonets.com/api/v2/OCR/Model/{modelId}/LabelFile/`

**Authentication:** Basic Auth (API key + colon, base64 encoded)

**Configuration:**
```typescript
NANONETS_API_KEY="your-api-key"
NANONETS_MODEL_ID="your-model-id"
```

**Features:**
- Custom OCR models
- High accuracy for specific document types
- Structured data extraction
- Table detection

**Limitations:**
- Requires paid plan
- Model training needed for best results
- Slower than OCR.space

**When to use:**
- Pharmaceutical documents
- Custom document formats
- Need structured data extraction
- High accuracy required

### OCR.space Provider

**Endpoint:** `https://api.ocr.space/parse/image`

**Authentication:** API key in request body

**Configuration:**
```typescript
OCR_SPACE_API_KEY="your-api-key"
```

**Features:**
- Free tier available (25,000 requests/month)
- Fast processing
- Good accuracy
- Multiple OCR engines
- PDF support

**Limitations:**
- 1MB file size limit (free tier)
- Basic text extraction only
- No custom models

**When to use:**
- General PDF extraction
- High volume processing
- Cost-effective solution
- Quick results needed

### Fallback Provider

**No external API** - Returns file metadata only

**Features:**
- Always available
- No API key needed
- Instant response

**Limitations:**
- No actual OCR
- Returns file info only

**When to use:**
- All other providers failed
- Testing/development
- Graceful degradation

---

## 🎯 Advanced Usage

### Custom Retry Configuration

```typescript
// Modify retry settings in multiProviderOCRService.ts
const result = await retryWithBackoff(
  () => provider.extract(fileBuffer, filename),
  5,      // maxRetries (default: 3)
  2000    // baseDelay in ms (default: 1000)
);
```

### File Size Optimization

The service automatically optimizes based on file size:

```typescript
// Small files (<5MB): Use base64 encoding
// - More reliable for PDFs
// - Better compatibility
// - Slightly slower

// Large files (>5MB): Use multipart upload
// - Faster upload
// - Less memory usage
// - Better for serverless
```

### Error Handling

```typescript
try {
  const result = await ocrService.extractFromBuffer(buffer, filename);
  
  if (!result.success) {
    // Handle extraction failure
    if (result.error?.includes('too large')) {
      // File too large
      return { error: 'Please upload a smaller file' };
    } else if (result.provider === 'none') {
      // All providers failed
      return { error: 'OCR service unavailable' };
    } else {
      // Other errors
      return { error: 'Extraction failed' };
    }
  }
  
  // Success - process extracted text
  return processText(result.extractedText);
  
} catch (error) {
  // Handle unexpected errors
  console.error('Unexpected error:', error);
  return { error: 'An unexpected error occurred' };
}
```

### Analytics Integration

```typescript
// The service automatically tracks metrics
// Integrate with your analytics service:

import { track } from '@vercel/analytics';

const result = await ocrService.extractFromBuffer(buffer, filename);

track('ocr_extraction', {
  provider: result.provider,
  success: result.success,
  duration: result.metadata?.duration,
  fileSize: result.metadata?.fileSize
});
```

---

## 🔍 Monitoring & Debugging

### Enable Debug Logging

The service includes comprehensive logging:

```typescript
// Logs are automatically generated:
console.log('🔬 MultiProviderOCR: Starting extraction...');
console.log('📄 File: document.pdf');
console.log('📏 Size: 1024.00 KB');
console.log('🔄 Nanonets: Attempting extraction...');
console.log('❌ Nanonets: Failed - API key not configured');
console.log('🔄 OCR.space: Attempting extraction...');
console.log('✅ OCR.space: Success (2340ms, 5432 chars)');
```

### Check Provider Status

```typescript
const status = ocrService.getStatus();

console.log('Service ready:', status.ready);
console.log('Providers:');
status.providers.forEach(p => {
  console.log(`  ${p.name}: ${p.configured ? '✅' : '❌'}`);
});

// Output:
// Service ready: true
// Providers:
//   Nanonets: ❌
//   OCR.space: ✅
//   Fallback: ✅
```

### Performance Metrics

```typescript
const result = await ocrService.extractFromBuffer(buffer, filename);

console.log('Performance Metrics:');
console.log('  Provider:', result.provider);
console.log('  Duration:', result.metadata?.duration, 'ms');
console.log('  Attempts:', result.metadata?.attempts);
console.log('  File Size:', result.metadata?.fileSize, 'bytes');
console.log('  Text Length:', result.extractedText?.length, 'chars');
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "All OCR providers failed"

**Cause:** No API keys configured or all keys are invalid

**Solution:**
```bash
# Check environment variables
echo $OCR_SPACE_API_KEY
echo $NANONETS_API_KEY

# Add to .env.local
OCR_SPACE_API_KEY="your-key-here"

# Restart the app
npm run dev
```

#### 2. "File too large"

**Cause:** File exceeds 50MB limit

**Solution:**
```bash
# Compress PDF
gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 \
   -dPDFSETTINGS=/ebook -dNOPAUSE -dQUIET -dBATCH \
   -sOutputFile=compressed.pdf input.pdf

# Or split into smaller files
pdftk input.pdf burst output page_%02d.pdf
```

#### 3. "OCR.space: Processing error"

**Cause:** Invalid file format or corrupted PDF

**Solution:**
```bash
# Verify PDF
file document.pdf

# Repair PDF
gs -o repaired.pdf -sDEVICE=pdfwrite -dPDFSETTINGS=/prepress input.pdf
```

#### 4. "Extraction timeout"

**Cause:** Large file or slow network

**Solution:**
```typescript
// Increase timeout in API route
const result = await withTimeout(
  ocrService.extractFromBuffer(buffer, filename),
  60000, // Increase to 60 seconds
  'Extraction timed out'
);
```

---

## 🔒 Security Best Practices

### 1. API Key Management

```bash
# ✅ DO: Use environment variables
OCR_SPACE_API_KEY="your-key"

# ❌ DON'T: Hardcode keys
const apiKey = "your-key-here";

# ✅ DO: Use different keys for dev/prod
# .env.local (development)
OCR_SPACE_API_KEY="dev-key"

# Vercel dashboard (production)
OCR_SPACE_API_KEY="prod-key"
```

### 2. Key Rotation

```bash
# Rotate keys every 90 days
# 1. Generate new key
# 2. Update environment variables
# 3. Deploy
# 4. Verify
# 5. Revoke old key
```

### 3. Rate Limiting

```typescript
// Add rate limiting to API routes
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/extract', limiter);
```

### 4. Input Validation

```typescript
// Validate file before extraction
if (!file || file.size === 0) {
  throw new Error('Invalid file');
}

if (file.size > 50 * 1024 * 1024) {
  throw new Error('File too large');
}

if (!file.mimetype?.includes('pdf')) {
  throw new Error('Only PDF files allowed');
}
```

---

## 📈 Performance Optimization

### 1. Caching

```typescript
import { LRUCache } from 'lru-cache';

const cache = new LRUCache({
  max: 100,
  ttl: 1000 * 60 * 60, // 1 hour
});

// Cache results by file hash
const fileHash = crypto.createHash('md5').update(fileBuffer).digest('hex');
const cached = cache.get(fileHash);

if (cached) {
  return cached;
}

const result = await ocrService.extractFromBuffer(buffer, filename);
cache.set(fileHash, result);
```

### 2. Parallel Processing

```typescript
// Process multiple files in parallel
const files = [file1, file2, file3];

const results = await Promise.all(
  files.map(file => 
    ocrService.extractFromBuffer(file.buffer, file.name)
  )
);
```

### 3. Streaming for Large Files

```typescript
// For very large files, consider streaming
import { pipeline } from 'stream/promises';

async function processLargeFile(filePath: string) {
  const readStream = fs.createReadStream(filePath);
  const chunks: Buffer[] = [];
  
  await pipeline(
    readStream,
    async function* (source) {
      for await (const chunk of source) {
        chunks.push(chunk);
      }
    }
  );
  
  const buffer = Buffer.concat(chunks);
  return ocrService.extractFromBuffer(buffer, 'large-file.pdf');
}
```

---

## 🧪 Testing

### Unit Tests

```typescript
import { ocrService } from '@/lib/services/multiProviderOCRService';

describe('MultiProviderOCRService', () => {
  it('should extract text from PDF', async () => {
    const buffer = fs.readFileSync('test.pdf');
    const result = await ocrService.extractFromBuffer(buffer, 'test.pdf');
    
    expect(result.success).toBe(true);
    expect(result.extractedText).toBeTruthy();
    expect(result.provider).toBeTruthy();
  });
  
  it('should handle invalid files', async () => {
    const buffer = Buffer.from('not a pdf');
    const result = await ocrService.extractFromBuffer(buffer, 'invalid.pdf');
    
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });
});
```

### Integration Tests

```typescript
describe('OCR API Integration', () => {
  it('should extract text via API', async () => {
    const formData = new FormData();
    formData.append('file', fs.createReadStream('test.pdf'));
    
    const response = await fetch('http://localhost:3000/api/extract', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    expect(result.success).toBe(true);
    expect(result.data.extractedText).toBeTruthy();
  });
});
```

---

## 📚 Additional Resources

- [OCR.space API Documentation](https://ocr.space/ocrapi)
- [Nanonets API Documentation](https://nanonets.com/documentation/)
- [PDF Processing Best Practices](https://www.pdfa.org/resource/pdf-processing-best-practices/)

---

## 🤝 Contributing

To improve the OCR service:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

---

## 📄 License

This service is part of the PDF Extraction & Reporting System.

---

**Last Updated**: January 2025
**Version**: 2.0.0
**Maintainer**: Development Team
