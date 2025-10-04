# Data and Reports API Routes

This document describes the converted Next.js API routes for data extraction and report generation functionality.

## Data API Routes (`/api/data/[...data]`)

### Base Endpoint: `/api/data`

#### GET `/api/data`
Get all extracted data for the authenticated user with pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "extractedData": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "pages": 5
    }
  }
}
```

#### GET `/api/data/file/{fileId}`
Get extracted data for a specific file.

**Parameters:**
- `fileId`: The ID of the file

**Response:**
```json
{
  "success": true,
  "data": {
    "extractedData": [...]
  }
}
```

#### GET `/api/data/analytics/summary`
Get analytics summary for the authenticated user.

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalFiles": 10,
      "totalExtractions": 15,
      "successfulExtractions": 12,
      "failedExtractions": 3,
      "successRate": "80.0",
      "totalFileSize": 1048576
    },
    "recentActivity": [...]
  }
}
```

#### GET `/api/data/search`
Search extracted data.

**Query Parameters:**
- `q` (required): Search query
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "extractedData": [...],
    "query": "search term",
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "pages": 1
    }
  }
}
```

## Reports API Routes (`/api/reports/[...reports]`)

### Base Endpoint: `/api/reports`

#### GET `/api/reports/csv`
Generate and download a CSV report.

**Query Parameters:**
- `fileIds` (optional): Comma-separated list of file IDs to include

**Response:**
- Content-Type: `text/csv`
- Content-Disposition: `attachment; filename="report.csv"`
- Body: CSV data

#### GET `/api/reports/excel`
Generate and download an Excel report.

**Query Parameters:**
- `fileIds` (optional): Comma-separated list of file IDs to include

**Response:**
- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Content-Disposition: `attachment; filename="report.xlsx"`
- Body: Excel file data

#### GET `/api/reports/data`
Get report data for visualization.

**Query Parameters:**
- `startDate` (optional): Start date filter (ISO string)
- `endDate` (optional): End date filter (ISO string)

**Response:**
```json
{
  "success": true,
  "data": {
    "totalFiles": 10,
    "successfulExtractions": 8,
    "failedExtractions": 2,
    "timeline": {
      "2024-01-01": 3,
      "2024-01-02": 5
    },
    "fileSizes": [...],
    "statusDistribution": {
      "completed": 8,
      "failed": 2,
      "processing": 0,
      "pending": 0
    },
    "insights": [...]
  }
}
```

#### GET `/api/reports/analytics/monthly`
Get monthly analytics data.

**Query Parameters:**
- `year` (optional): Year to get analytics for (default: current year)

**Response:**
```json
{
  "success": true,
  "data": {
    "year": 2024,
    "monthlyData": [
      {
        "month": 1,
        "monthName": "January",
        "uploads": 5,
        "extractions": 5,
        "successful": 4,
        "successRate": "80.0"
      },
      ...
    ]
  }
}
```

## Authentication

All endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Error Responses

All endpoints return standardized error responses:
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}
```

## Migration Notes

These API routes replace the following Express.js routes:
- `backend/src/routes/data.ts` → `/api/data/[...data]`
- `backend/src/routes/reports.ts` → `/api/reports/[...reports]`

### Key Changes:
1. **Serverless Architecture**: Routes now run as serverless functions
2. **Next.js API Routes**: Using Next.js dynamic routing with catch-all segments
3. **Prisma Client**: Using serverless-optimized Prisma client configuration
4. **Response Format**: Consistent with existing frontend API response patterns
5. **Authentication**: Using existing JWT-based authentication middleware

### Dependencies:
- `@prisma/client`: Database operations
- `xlsx`: Excel file generation
- `jsonwebtoken`: JWT authentication
- Custom utilities: `lib/auth.ts`, `lib/api-response.ts`, `lib/prisma.ts`

## Testing

Use the test endpoint to verify functionality:
```
GET /api/test-data-reports
```

This endpoint tests database connectivity and provides an overview of available endpoints.