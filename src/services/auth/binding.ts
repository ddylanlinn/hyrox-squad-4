/**
 * Auth Binding Service
 * Handles binding between Firebase Auth UID and app user ID
 */

import {
  doc,
  getDoc,
  setDoc,
  Timestamp,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { APP_USERS } from "../../constants";
import type { AuthBindingDocument } from "../../types/firestore";

/**
 * Check if Firebase Auth UID is bound to an app user
 *
 * @param firebaseAuthUid - Firebase Auth UID
 * @returns Binding data, or null if not bound
 */
export async function getAuthBinding(
  firebaseAuthUid: string
): Promise<AuthBindingDocument | null> {
  const bindingRef = doc(db, "auth-bindings", firebaseAuthUid);
  const bindingSnap = await getDoc(bindingRef);

  if (bindingSnap.exists()) {
    return bindingSnap.data() as AuthBindingDocument;
  }
  return null;
}

/**
 * Create binding between Firebase Auth UID and app user ID
 *
 * @param firebaseAuthUid - Firebase Auth UID
 * @param appUserId - App user ID (u1, u2, u3, u4)
 * @param provider - Login method (google.com, facebook.com, etc.)
 * @param email - Login email
 * @param displayName - Login display name
 */
export async function createAuthBinding(
  firebaseAuthUid: string,
  appUserId: string,
  provider: string,
  email?: string,
  displayName?: string
): Promise<void> {
  const bindingRef = doc(db, "auth-bindings", firebaseAuthUid);

  const bindingData: AuthBindingDocument = {
    firebaseAuthUid,
    appUserId,
    provider,
    email,
    displayName,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  await setDoc(bindingRef, bindingData);
  console.log("Auth binding created successfully:", {
    firebaseAuthUid,
    appUserId,
    provider,
  });
}

/**
 * Update binding's last updated timestamp
 *
 * @param firebaseAuthUid - Firebase Auth UID
 */
export async function updateAuthBindingTimestamp(
  firebaseAuthUid: string
): Promise<void> {
  const bindingRef = doc(db, "auth-bindings", firebaseAuthUid);

  await setDoc(
    bindingRef,
    {
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  );
}

/**
 * Get list of all bindable app users
 *
 * @returns App user list
 */
export function getAvailableAppUsers(): ReadonlyArray<{
  readonly id: string;
  readonly name: string;
  readonly initials: string;
}> {
  return APP_USERS;
}

/**
 * Get list of bound member IDs from a list of member IDs
 * This is used for streak calculation - only bound members should be counted
 *
 * @param memberIds - List of all member IDs in the squad
 * @returns List of member IDs that have auth bindings
 */
export async function getBoundMemberIds(
  memberIds: string[]
): Promise<string[]> {
  // Query auth-bindings where appUserId is in memberIds
  const bindingsRef = collection(db, "auth-bindings");
  const bindingsQuery = query(bindingsRef, where("appUserId", "in", memberIds));

  const bindingsSnap = await getDocs(bindingsQuery);

  // Extract unique bound member IDs
  const boundMemberIds = new Set<string>();
  bindingsSnap.forEach((doc) => {
    const binding = doc.data() as AuthBindingDocument;
    boundMemberIds.add(binding.appUserId);
  });

  return Array.from(boundMemberIds);
}
