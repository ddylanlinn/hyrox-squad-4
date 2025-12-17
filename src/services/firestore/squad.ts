/**
 * Squad Service
 * Handle squad-related Firestore operations
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
 * Get squad data
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
 * Get squad members list
 * Sort by consecutive days in descending order
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
 * Update squad data
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
 * Update squad member data
 */
export async function updateSquadMember(
  squadId: string,
  userId: string,
  data: Partial<SquadMemberDocument>
): Promise<void> {
  const memberRef = doc(db, "squads", squadId, "members", userId);
  await updateDoc(memberRef, data);
}
