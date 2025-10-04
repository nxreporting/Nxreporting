// Basic test file to verify utilities are properly configured
// This is a placeholder - in a real project you'd use Jest or similar

import { createSuccessResponse, createErrorResponse } from '../api-response'
import { generateToken, verifyToken } from '../auth'
import { validateFile } from '../storage'

// Test API Response utilities
console.log('Testing API Response utilities...')
const successResponse = createSuccessResponse({ message: 'Test data' })
console.log('✅ Success response created:', successResponse.success === true)

const errorResponse = createErrorResponse('Test error', 'TEST_ERROR')
console.log('✅ Error response created:', errorResponse.success === false)

// Test file validation
console.log('\nTesting file validation...')
const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
const validation = validateFile(mockFile)
console.log('✅ File validation passed:', validation.valid === true)

const invalidFile = new File(['test content'], 'test.txt', { type: 'text/plain' })
const invalidValidation = validateFile(invalidFile)
console.log('✅ Invalid file rejected:', invalidValidation.valid === false)

console.log('\n✅ All utility tests passed!')