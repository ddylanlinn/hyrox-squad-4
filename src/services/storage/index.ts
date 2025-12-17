/**
 * Firebase Storage Service
 * Handles file upload and management
 *
 * Usage example:
 * import { uploadWorkoutImage, uploadUserAvatar } from '@/services/storage';
 */

import imageCompression from "browser-image-compression";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { storage } from "../../config/firebase";

/**
 * Compress image
 *
 * @param file - Original image file
 * @returns Compressed image file
 */
async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 1, // Max 1MB after compression
    maxWidthOrHeight: 1920, // Max width or height 1920px
    useWebWorker: true, // Use Web Worker to avoid blocking UI
    fileType: "image/jpeg" as const, // Unified output as JPEG format (smaller file size)
  };

  try {
    console.log(
      `Compressing image: ${file.name} (${(file.size / 1024 / 1024).toFixed(
        2
      )}MB)`
    );
    const compressedFile = await imageCompression(file, options);
    console.log(
      `Compression complete: ${compressedFile.name} (${(
        compressedFile.size /
        1024 /
        1024
      ).toFixed(2)}MB)`
    );
    return compressedFile;
  } catch (error) {
    console.error("Image compression failed:", error);
    // If compression fails, return original file
    console.warn("Using original file for upload");
    return file;
  }
}

/**
 * Upload workout photo
 *
 * Storage path: workouts/{squadId}/{userId}/{fileName}
 *
 * @param file - File to upload
 * @param userId - User ID
 * @param squadId - Squad ID
 * @returns Uploaded file URL
 */
export async function uploadWorkoutImage(
  file: File,
  userId: string,
  squadId: string
): Promise<string> {
  // Compress image
  const compressedFile = await compressImage(file);

  // Generate unique filename
  const timestamp = Date.now();
  const extension = compressedFile.name.split(".").pop();
  const fileName = `${userId}_${timestamp}.${extension}`;

  // Create storage path
  const storagePath = `workouts/${squadId}/${userId}/${fileName}`;
  const storageRef = ref(storage, storagePath);

  // Upload file
  const snapshot = await uploadBytes(storageRef, compressedFile, {
    contentType: compressedFile.type,
  });

  // Get download URL
  const downloadURL = await getDownloadURL(snapshot.ref);

  return downloadURL;
}

/**
 * Delete workout photo
 *
 * @param imageUrl - Image URL to delete
 */
export async function deleteWorkoutImage(imageUrl: string): Promise<void> {
  try {
    // Parse storage path from URL
    const url = new URL(imageUrl);
    const pathMatch = url.pathname.match(/\/o\/(.+)\?/);

    if (pathMatch && pathMatch[1]) {
      const storagePath = decodeURIComponent(pathMatch[1]);
      const storageRef = ref(storage, storagePath);
      await deleteObject(storageRef);
    }
  } catch (error) {
    console.error("Failed to delete image:", error);
    // Don't throw error, as image may already be deleted or doesn't exist
  }
}

/**
 * Upload user avatar
 *
 * Storage path: avatars/{userId}.{extension}
 *
 * @param file - File to upload
 * @param userId - User ID
 * @returns Uploaded file URL
 */
export async function uploadUserAvatar(
  file: File,
  userId: string
): Promise<string> {
  // Compress image
  const compressedFile = await compressImage(file);

  const extension = compressedFile.name.split(".").pop();
  const fileName = `${userId}.${extension}`;
  const storagePath = `avatars/${fileName}`;
  const storageRef = ref(storage, storagePath);

  const snapshot = await uploadBytes(storageRef, compressedFile, {
    contentType: compressedFile.type,
  });

  const downloadURL = await getDownloadURL(snapshot.ref);

  return downloadURL;
}

/**
 * Validate file type
 *
 * @param file - File to validate
 * @param allowedTypes - Allowed MIME types
 * @returns Whether file type is allowed
 */
export function validateFileType(
  file: File,
  allowedTypes: string[] = ["image/jpeg", "image/png", "image/webp"]
): boolean {
  return allowedTypes.includes(file.type);
}

/**
 * Validate file size
 *
 * @param file - File to validate
 * @param maxSizeMB - Max size (MB), default 5MB
 * @returns Whether file meets size limit
 */
export function validateFileSize(file: File, maxSizeMB: number = 5): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

/**
 * Validate file (type + size)
 *
 * @param file - File to validate
 * @returns Validation result
 */
export function validateFile(file: File): {
  valid: boolean;
  error?: string;
} {
  if (!validateFileType(file)) {
    return {
      valid: false,
      error:
        "File type not supported, please upload JPG, PNG or WebP format images",
    };
  }

  if (!validateFileSize(file)) {
    return {
      valid: false,
      error: "File size exceeds 5MB limit",
    };
  }

  return { valid: true };
}
