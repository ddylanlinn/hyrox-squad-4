/**
 * User Service
 * 處理使用者相關的 Firestore 操作
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import type { UserDocument, UserDailyStats } from "../../types/firestore";

/**
 * 取得使用者資料
 */
export async function getUser(userId: string): Promise<UserDocument | null> {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data() as UserDocument;
  }
  return null;
}

/**
 * 取得使用者最近 N 天的統計資料
 *
 * @param userId - 使用者 ID
 * @param days - 天數，預設 70 天
 */
export async function getUserStats(
  userId: string,
  days: number = 70
): Promise<UserDailyStats[]> {
  const statsRef = collection(db, "users", userId, "stats");
  const statsQuery = query(statsRef, orderBy("date", "desc"), limit(days));
  const statsSnap = await getDocs(statsQuery);

  return statsSnap.docs.map((doc) => doc.data() as UserDailyStats);
}

/**
 * 取得使用者特定日期的統計
 */
export async function getUserStatsByDate(
  userId: string,
  date: string
): Promise<UserDailyStats | null> {
  const statsRef = doc(db, "users", userId, "stats", date);
  const statsSnap = await getDoc(statsRef);

  if (statsSnap.exists()) {
    return statsSnap.data() as UserDailyStats;
  }
  return null;
}

/**
 * 更新使用者資料
 */
export async function updateUser(
  userId: string,
  data: Partial<UserDocument>
): Promise<void> {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

/**
 * 更新使用者每日統計
 * 內部使用，由 workout service 呼叫
 */
export async function updateUserDailyStats(
  userId: string,
  date: string,
  workoutId: string
): Promise<void> {
  const statsRef = doc(db, "users", userId, "stats", date);
  const statsSnap = await getDoc(statsRef);

  if (statsSnap.exists()) {
    // 更新現有統計
    const currentData = statsSnap.data() as UserDailyStats;
    await updateDoc(statsRef, {
      count: currentData.count + 1,
      workoutIds: [...currentData.workoutIds, workoutId],
      updatedAt: Timestamp.now(),
    });
  } else {
    // 建立新統計
    const newStats: UserDailyStats = {
      date,
      userId,
      count: 1,
      workoutIds: [workoutId],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    await setDoc(statsRef, newStats);
  }
}
