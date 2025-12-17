/**
 * Auth Binding Service
 * Handles binding between Firebase Auth UID and app user ID
 */

import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "../../config/firebase";
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
export function getAvailableAppUsers(): Array<{
  id: string;
  name: string;
  initials: string;
}> {
  return [
    { id: "u1", name: "Dylan", initials: "DL" },
    { id: "u2", name: "Crystal", initials: "CH" },
    { id: "u3", name: "Sylvi", initials: "SB" },
    { id: "u4", name: "Andrew", initials: "AC" },
  ];
}
