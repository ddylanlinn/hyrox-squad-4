/**
 * Squad Operations
 * Handle squad-related Firestore CRUD operations
 */

import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "../../../config/firebase";
import type {
  SquadDocument,
  SquadMemberDocument,
  UserDocument,
} from "../../../types/firestore";

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
 * Get squad members list with real-time data from users collection
 * Sort by consecutive days in descending order
 *
 * This function reads member data from:
 * - users/{userId} for real-time stats (currentStreak, totalWorkouts, etc.)
 * - squads/{squadId}/members/{userId} for squad-specific info (joinedAt, role)
 */
export async function getSquadMembers(
  squadId: string
): Promise<SquadMemberDocument[]> {
  // First, get the squad to get memberIds
  const squad = await getSquad(squadId);
  if (!squad || !squad.memberIds || squad.memberIds.length === 0) {
    return [];
  }

  // Fetch all member data in parallel
  const memberPromises = squad.memberIds.map(async (userId) => {
    // Get user data (real-time stats)
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    // Get squad member subcollection data (joinedAt, role)
    const memberRef = doc(db, "squads", squadId, "members", userId);
    const memberSnap = await getDoc(memberRef);

    if (!userSnap.exists()) {
      return null; // User not found, skip
    }

    const userData = userSnap.data() as UserDocument;
    const memberData = memberSnap.exists()
      ? memberSnap.data()
      : { role: "member" as const }; // Default role if subcollection doesn't exist

    // Combine data into SquadMemberDocument
    const memberDoc: SquadMemberDocument = {
      userId: userData.id,
      squadId,
      joinedAt: memberData.joinedAt || Timestamp.now(),
      role: memberData.role || "member",
      // Real-time stats from user document
      currentStreak: userData.currentStreak || 0,
      totalWorkouts: userData.totalWorkouts || 0,
      lastWorkoutDate: userData.lastWorkoutDate,
      // User basic data
      name: userData.name,
      initials: userData.initials,
      avatarUrl: userData.avatarUrl,
    };

    return memberDoc;
  });

  // Wait for all members and filter out nulls
  const members = (await Promise.all(memberPromises)).filter(
    (member): member is SquadMemberDocument => member !== null
  );

  // Sort by currentStreak in descending order
  return members.sort((a, b) => b.currentStreak - a.currentStreak);
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
 * Update squad streak
 */
export async function updateSquadStreak(
  squadId: string,
  currentStreak: number,
  averageStreak: number
): Promise<void> {
  await updateSquad(squadId, {
    currentStreak,
    averageStreak,
    lastActivityDate: new Date().toISOString().split("T")[0],
  });
}
