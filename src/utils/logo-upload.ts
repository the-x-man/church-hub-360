import { supabase } from './supabase';

export interface LogoUploadResult {
  url: string;
  path: string;
}

export interface LogoUploadError {
  message: string;
  code?: string;
}

// File validation constants
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
const BUCKET_NAME = 'org-logos';

/**
 * Validates a file for logo upload
 * @param file - The file to validate
 * @returns Object with isValid boolean and error message if invalid
 */
export function validateLogoFile(file: File): { isValid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`
    };
  }

  // Check file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: 'File must be PNG, JPEG, SVG, or WebP format'
    };
  }

  return { isValid: true };
}

/**
 * Generates a unique file path for the logo
 * @param organizationId - The organization ID
 * @param fileName - Original file name
 * @returns Unique file path
 */
function generateLogoPath(organizationId: string, fileName: string): string {
  const timestamp = Date.now();
  const extension = fileName.split('.').pop();
  return `${organizationId}/${timestamp}.${extension}`;
}

/**
 * Uploads a logo file to Supabase storage
 * @param file - The file to upload
 * @param organizationId - The organization ID
 * @returns Promise with upload result or throws error
 */
export async function uploadLogo(
  file: File,
  organizationId: string
): Promise<LogoUploadResult> {
  // Validate file first
  const validation = validateLogoFile(file);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  try {
    // Generate unique file path
    const filePath = generateLogoPath(organizationId, file.name);

    // Upload file to Supabase storage
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return {
      url: urlData.publicUrl,
      path: filePath
    };
  } catch (error) {
    console.error('Logo upload error:', error);
    throw error instanceof Error ? error : new Error('Upload failed');
  }
}

/**
 * Deletes a logo file from Supabase storage
 * @param filePath - The file path to delete
 * @returns Promise that resolves when deletion is complete
 */
export async function deleteLogo(filePath: string): Promise<void> {
  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  } catch (error) {
    console.error('Logo deletion error:', error);
    throw error instanceof Error ? error : new Error('Deletion failed');
  }
}

/**
 * Extracts the file path from a Supabase storage URL
 * @param url - The full storage URL
 * @returns The file path or null if invalid URL
 */
export function extractFilePathFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const bucketIndex = pathParts.findIndex(part => part === BUCKET_NAME);
    
    if (bucketIndex === -1 || bucketIndex === pathParts.length - 1) {
      return null;
    }
    
    return pathParts.slice(bucketIndex + 1).join('/');
  } catch {
    return null;
  }
}