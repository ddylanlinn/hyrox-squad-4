/**
 * Workout Service
 * 處理訓練記錄相關的 Firestore 操作
 */

import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import type { WorkoutDocument } from "../../types/firestore";
import { updateUserDailyStats } from "./user";

/**
 * 取得今日所有訓練記錄
 */
export async function getTodayWorkouts(
  squadId: string
): Promise<WorkoutDocument[]> {
  const today = new Date().toISOString().split("T")[0];
  return getWorkoutsByDate(squadId, today);
}

/**
 * 取得特定日期的訓練記錄
 */
export async function getWorkoutsByDate(
  squadId: string,
  date: string
): Promise<WorkoutDocument[]> {
  const workoutsRef = collection(db, "workouts");
  const workoutsQuery = query(
    workoutsRef,
    where("squadId", "==", squadId),
    where("date", "==", date),
    orderBy("completedAt", "desc")
  );
  const workoutsSnap = await getDocs(workoutsQuery);

  return workoutsSnap.docs.map((doc) => doc.data() as WorkoutDocument);
}

/**
 * 取得使用者的訓練記錄
 */
export async function getUserWorkouts(
  userId: string,
  limit?: number
): Promise<WorkoutDocument[]> {
  const workoutsRef = collection(db, "workouts");
  let workoutsQuery = query(
    workoutsRef,
    where("userId", "==", userId),
    orderBy("completedAt", "desc")
  );

  if (limit) {
    workoutsQuery = query(workoutsQuery, orderBy("completedAt", "desc"));
  }

  const workoutsSnap = await getDocs(workoutsQuery);
  return workoutsSnap.docs.map((doc) => doc.data() as WorkoutDocument);
}

/**
 * 建立訓練記錄
 *
 * @param userId - 使用者 ID
 * @param squadId - 小隊 ID
 * @param imageUrl - 訓練照片 URL
 * @param note - 備註（可選）
 * @returns 訓練記錄 ID
 */
export async function createWorkout(
  userId: string,
  squadId: string,
  imageUrl: string,
  note?: string
): Promise<string> {
  const workoutsRef = collection(db, "workouts");
  const workoutDoc = doc(workoutsRef);
  const today = new Date().toISOString().split("T")[0];

  const workoutData: WorkoutDocument = {
    id: workoutDoc.id,
    userId,
    squadId,
    date: today,
    completedAt: Timestamp.now(),
    imageUrl,
    note: note || "",
    createdAt: Timestamp.now(),
  };

  // 建立訓練記錄
  await setDoc(workoutDoc, workoutData);

  // 更新使用者每日統計
  await updateUserDailyStats(userId, today, workoutDoc.id);

  return workoutDoc.id;
}

/**
 * 刪除訓練記錄
 * 注意：這個操作也應該更新相關的統計資料
 */
export async function deleteWorkout(workoutId: string): Promise<void> {
  const workoutRef = doc(db, "workouts", workoutId);
  // TODO: 實作刪除邏輯，包含更新統計
  // await deleteDoc(workoutRef);
  throw new Error("Delete workout not implemented yet");
}
