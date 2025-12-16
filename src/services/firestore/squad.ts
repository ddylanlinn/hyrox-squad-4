/**
 * Squad Service
 * 處理小隊相關的 Firestore 操作
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import type { SquadDocument, SquadMemberDocument } from "../../types/firestore";

/**
 * 取得小隊資料
 */
export async function getSquad(squadId: string): Promise<SquadDocument | null> {
  const squadRef = doc(db, "squads", squadId);
  const squadSnap = await getDoc(squadRef);

  if (squadSnap.exists()) {
    return squadSnap.data() as SquadDocument;
  }
  return null;
}

/**
 * 取得小隊成員列表
 * 按連續天數降序排列
 */
export async function getSquadMembers(
  squadId: string
): Promise<SquadMemberDocument[]> {
  const membersRef = collection(db, "squads", squadId, "members");
  const membersQuery = query(membersRef, orderBy("currentStreak", "desc"));
  const membersSnap = await getDocs(membersQuery);

  return membersSnap.docs.map((doc) => doc.data() as SquadMemberDocument);
}

/**
 * 更新小隊資料
 */
export async function updateSquad(
  squadId: string,
  data: Partial<SquadDocument>
): Promise<void> {
  const squadRef = doc(db, "squads", squadId);
  await updateDoc(squadRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

/**
 * 更新小隊成員資料
 */
export async function updateSquadMember(
  squadId: string,
  userId: string,
  data: Partial<SquadMemberDocument>
): Promise<void> {
  const memberRef = doc(db, "squads", squadId, "members", userId);
  await updateDoc(memberRef, data);
}
