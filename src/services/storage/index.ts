/**
 * Firebase Storage Service
 * 處理檔案上傳和管理
 *
 * 使用範例：
 * import { uploadWorkoutImage, uploadUserAvatar } from '@/services/storage';
 */

import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { storage } from "../../config/firebase";

/**
 * 上傳訓練照片
 *
 * 儲存路徑：workouts/{squadId}/{userId}/{fileName}
 *
 * @param file - 要上傳的檔案
 * @param userId - 使用者 ID
 * @param squadId - 小隊 ID
 * @returns 上傳後的檔案 URL
 */
export async function uploadWorkoutImage(
  file: File,
  userId: string,
  squadId: string
): Promise<string> {
  // 產生唯一檔名
  const timestamp = Date.now();
  const extension = file.name.split(".").pop();
  const fileName = `${userId}_${timestamp}.${extension}`;

  // 建立儲存路徑
  const storagePath = `workouts/${squadId}/${userId}/${fileName}`;
  const storageRef = ref(storage, storagePath);

  // 上傳檔案
  const snapshot = await uploadBytes(storageRef, file, {
    contentType: file.type,
  });

  // 取得下載 URL
  const downloadURL = await getDownloadURL(snapshot.ref);

  return downloadURL;
}

/**
 * 刪除訓練照片
 *
 * @param imageUrl - 要刪除的圖片 URL
 */
export async function deleteWorkoutImage(imageUrl: string): Promise<void> {
  try {
    // 從 URL 解析出 storage path
    const url = new URL(imageUrl);
    const pathMatch = url.pathname.match(/\/o\/(.+)\?/);

    if (pathMatch && pathMatch[1]) {
      const storagePath = decodeURIComponent(pathMatch[1]);
      const storageRef = ref(storage, storagePath);
      await deleteObject(storageRef);
    }
  } catch (error) {
    console.error("刪除圖片失敗:", error);
    // 不拋出錯誤，因為圖片可能已經被刪除或不存在
  }
}

/**
 * 上傳使用者頭像
 * 
 * 儲存路徑：avatars/{userId}.{extension}
 * 
@param file - 要上傳的檔案
 * @param userId - 使用者 ID
 * @returns 上傳後的檔案 URL
 */
export async function uploadUserAvatar(
  file: File,
  userId: string
): Promise<string> {
  const extension = file.name.split(".").pop();
  const fileName = `${userId}.${extension}`;
  const storagePath = `avatars/${fileName}`;
  const storageRef = ref(storage, storagePath);

  const snapshot = await uploadBytes(storageRef, file, {
    contentType: file.type,
  });

  const downloadURL = await getDownloadURL(snapshot.ref);

  return downloadURL;
}

/**
 * 驗證檔案類型
 *
 * @param file - 要驗證的檔案
 * @param allowedTypes - 允許的 MIME types
 * @returns 是否為允許的類型
 */
export function validateFileType(
  file: File,
  allowedTypes: string[] = ["image/jpeg", "image/png", "image/webp"]
): boolean {
  return allowedTypes.includes(file.type);
}

/**
 * 驗證檔案大小
 *
 * @param file - 要驗證的檔案
 * @param maxSizeMB - 最大大小（MB），預設 5MB
 * @returns 是否符合大小限制
 */
export function validateFileSize(file: File, maxSizeMB: number = 5): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

/**
 * 驗證檔案（類型 + 大小）
 *
 * @param file - 要驗證的檔案
 * @returns 驗證結果
 */
export function validateFile(file: File): {
  valid: boolean;
  error?: string;
} {
  if (!validateFileType(file)) {
    return {
      valid: false,
      error: "檔案類型不支援，請上傳 JPG、PNG 或 WebP 格式的圖片",
    };
  }

  if (!validateFileSize(file)) {
    return {
      valid: false,
      error: "檔案大小超過 5MB 限制",
    };
  }

  return { valid: true };
}
