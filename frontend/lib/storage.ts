import { put, del, head } from '@vercel/blob'
import { createClient } from '@supabase/supabase-js'

export interface StorageFile {
  url: string
  pathname: string
  size: number
  uploadedAt: Date
}

export interface UploadResult {
  success: boolean
  url?: string
  pathname?: string
  size?: number
  error?: string
}

export interface DeleteResult {
  success: boolean
  error?: string
}

export type StorageProvider = 'vercel' | 'supabase'

/**
 * Get the configured storage provider
 */
function getStorageProvider(): StorageProvider {
  return (process.env.STORAGE_PROVIDER as StorageProvider) || 'vercel'
}

/**
 * Initialize Supabase client for storage operations
 */
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration missing. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  }

  return createClient(supabaseUrl, supabaseKey)
}

/**
 * Upload file using Vercel Blob Storage
 */
async function uploadToVercelBlob(
  file: File | Buffer,
  filename: string
): Promise<UploadResult> {
  try {
    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: true,
    })

    return {
      success: true,
      url: blob.url,
      pathname: blob.pathname,
      size: file instanceof File ? file.size : file.length,
    }
  } catch (error) {
    console.error('Vercel Blob upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    }
  }
}

/**
 * Upload file using Supabase Storage
 */
async function uploadToSupabaseStorage(
  file: File | Buffer,
  filename: string
): Promise<UploadResult> {
  try {
    const supabase = getSupabaseClient()
    const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'pdf-uploads'
    
    // Generate unique filename
    const timestamp = Date.now()
    const uniqueFilename = `${timestamp}-${filename}`

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(uniqueFilename, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      throw error
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path)

    return {
      success: true,
      url: urlData.publicUrl,
      pathname: data.path,
      size: file instanceof File ? file.size : file.length,
    }
  } catch (error) {
    console.error('Supabase Storage upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    }
  }
}

/**
 * Delete file from Vercel Blob Storage
 */
async function deleteFromVercelBlob(url: string): Promise<DeleteResult> {
  try {
    await del(url)
    return { success: true }
  } catch (error) {
    console.error('Vercel Blob delete error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed'
    }
  }
}

/**
 * Delete file from Supabase Storage
 */
async function deleteFromSupabaseStorage(pathname: string): Promise<DeleteResult> {
  try {
    const supabase = getSupabaseClient()
    const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'pdf-uploads'

    const { error } = await supabase.storage
      .from(bucketName)
      .remove([pathname])

    if (error) {
      throw error
    }

    return { success: true }
  } catch (error) {
    console.error('Supabase Storage delete error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed'
    }
  }
}

/**
 * Upload file to configured storage provider
 */
export async function uploadFile(
  file: File | Buffer,
  filename: string
): Promise<UploadResult> {
  const provider = getStorageProvider()

  switch (provider) {
    case 'vercel':
      return uploadToVercelBlob(file, filename)
    case 'supabase':
      return uploadToSupabaseStorage(file, filename)
    default:
      return {
        success: false,
        error: `Unsupported storage provider: ${provider}`
      }
  }
}

/**
 * Delete file from configured storage provider
 */
export async function deleteFile(
  url: string,
  pathname?: string
): Promise<DeleteResult> {
  const provider = getStorageProvider()

  switch (provider) {
    case 'vercel':
      return deleteFromVercelBlob(url)
    case 'supabase':
      if (!pathname) {
        return {
          success: false,
          error: 'Pathname required for Supabase Storage deletion'
        }
      }
      return deleteFromSupabaseStorage(pathname)
    default:
      return {
        success: false,
        error: `Unsupported storage provider: ${provider}`
      }
  }
}

/**
 * Get file information from Vercel Blob
 */
async function getVercelBlobInfo(url: string): Promise<StorageFile | null> {
  try {
    const info = await head(url)
    return {
      url: info.url,
      pathname: info.pathname,
      size: info.size,
      uploadedAt: info.uploadedAt
    }
  } catch (error) {
    console.error('Error getting Vercel Blob info:', error)
    return null
  }
}

/**
 * Get file information from Supabase Storage
 */
async function getSupabaseStorageInfo(pathname: string): Promise<StorageFile | null> {
  try {
    const supabase = getSupabaseClient()
    const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'pdf-uploads'

    const { data, error } = await supabase.storage
      .from(bucketName)
      .list(pathname.split('/').slice(0, -1).join('/'), {
        search: pathname.split('/').pop()
      })

    if (error || !data || data.length === 0) {
      return null
    }

    const fileInfo = data[0]
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(pathname)

    return {
      url: urlData.publicUrl,
      pathname,
      size: fileInfo.metadata?.size || 0,
      uploadedAt: new Date(fileInfo.created_at)
    }
  } catch (error) {
    console.error('Error getting Supabase Storage info:', error)
    return null
  }
}

/**
 * Get file information from configured storage provider
 */
export async function getFileInfo(
  url: string,
  pathname?: string
): Promise<StorageFile | null> {
  const provider = getStorageProvider()

  switch (provider) {
    case 'vercel':
      return getVercelBlobInfo(url)
    case 'supabase':
      if (!pathname) {
        console.error('Pathname required for Supabase Storage info')
        return null
      }
      return getSupabaseStorageInfo(pathname)
    default:
      console.error(`Unsupported storage provider: ${provider}`)
      return null
  }
}

/**
 * Validate file type and size
 */
export function validateFile(
  file: File,
  options: {
    maxSize?: number // in bytes
    allowedTypes?: string[]
  } = {}
): { valid: boolean; error?: string } {
  const { maxSize = 50 * 1024 * 1024, allowedTypes = ['application/pdf'] } = options

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${Math.round(maxSize / 1024 / 1024)}MB`
    }
  }

  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
    }
  }

  return { valid: true }
}

/**
 * Generate a safe filename
 */
export function generateSafeFilename(originalName: string): string {
  // Remove unsafe characters and limit length
  const safeName = originalName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .substring(0, 100)
  
  // Add timestamp to ensure uniqueness
  const timestamp = Date.now()
  const extension = safeName.split('.').pop()
  const nameWithoutExt = safeName.substring(0, safeName.lastIndexOf('.'))
  
  return `${nameWithoutExt}_${timestamp}.${extension}`
}