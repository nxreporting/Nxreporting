# File Management API Routes

This directory contains the Next.js API routes for file management, converted from the original Express.js backend routes.

## Endpoints

### `GET /api/files`
Lists user's uploaded files with pagination support.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 50)

**Response:**
```json
{
  "success": true,
  "data": {
    "files": [...],
  },
  "metadata": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

### `POST /api/files`
Uploads a PDF file and optionally extracts data using AI.

**Form Data:**
- `pdf`: PDF file (required)
- `useAI`: Boolean flag for AI extraction (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "file": {
      "id": "...",
      "originalName": "document.pdf",
      "filename": "safe_filename.pdf",
      "path": "https://cloud-storage-url...",
      "size": 1024000,
      "uploadedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### `GET /api/files/[id]`
Gets details for a specific file including extraction data.

**Response:**
```json
{
  "success": true,
  "data": {
    "file": {
      "id": "...",
      "originalName": "document.pdf",
      "extractedData": [...],
      "uploadedBy": {...}
    }
  }
}
```

### `DELETE /api/files/[id]`
Deletes a file and all associated data.

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "File deleted successfully",
    "storageDeleted": true
  }
}
```

### `GET /api/files/test/ai-models`
Tests AI model availability for debugging purposes.

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "AI model test completed successfully",
    "logs": [...],
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## Features

- **Cloud Storage Integration**: Files are stored in Vercel Blob or Supabase Storage
- **Serverless Compatible**: Optimized for Vercel's serverless functions
- **Authentication**: All routes require JWT authentication
- **Error Handling**: Comprehensive error handling with standardized responses
- **File Validation**: Type and size validation for uploaded files
- **Async Processing**: PDF extraction runs asynchronously to avoid blocking responses

## Migration Notes

These routes replace the following Express.js routes from the backend:
- `GET /files` → `GET /api/files`
- `POST /files/upload` → `POST /api/files`
- `GET /files/:id` → `GET /api/files/[id]`
- `DELETE /files/:id` → `DELETE /api/files/[id]`
- `GET /files/test/ai-models` → `GET /api/files/test/ai-models`

Key changes:
- File storage moved from local filesystem to cloud storage
- Multipart form parsing using formidable instead of multer
- Async PDF extraction to work within serverless function limits
- Updated to use shared utilities (auth, storage, api-response)