/**
 * Firebase Authentication Service
 * Handles user authentication operations
 *
 * Supported login methods:
 * - Google login
 * - Email/Password login
 *
 * Usage example:
 * import { signInWithGoogle, signOut, getCurrentUser } from '@/services/auth';
 */

import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
} from "firebase/auth";
import { auth } from "../../config/firebase";

/**
 * Google login
 */
export async function signInWithGoogle(): Promise<FirebaseUser> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: "select_account", // Force account selection
  });

  const result = await signInWithPopup(auth, provider);
  return result.user;
}

/**
 * Email/Password login
 * Auto-register if user doesn't exist
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<FirebaseUser> {
  try {
    // Attempt login
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error: any) {
    // If user doesn't exist or invalid credentials, auto-register
    if (
      error.code === "auth/user-not-found" ||
      error.code === "auth/invalid-credential"
    ) {
      console.log("User not found, creating new account...");
      const displayName = email.split("@")[0]; // Use email prefix as name
      return await signUpWithEmail(email, password, displayName);
    }
    // Throw other errors directly
    throw error;
  }
}

/**
 * Email/Password signup
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string
): Promise<FirebaseUser> {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  const user = result.user;

  // Update display name
  await updateProfile(user, { displayName });

  return user;
}

/**
 * Anonymous login
 */
export async function signInAnonymouslyUser(): Promise<FirebaseUser> {
  const result = await signInAnonymously(auth);
  return result.user;
}

/**
 * Logout
 */
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

/**
 * Get current user
 */
export function getCurrentUser(): FirebaseUser | null {
  return auth.currentUser;
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(
  callback: (user: FirebaseUser | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}

/**
 * Error message conversion
 */
export function getAuthErrorMessage(error: any): string {
  const errorCode = error?.code || "";

  const errorMessages: Record<string, string> = {
    "auth/invalid-email": "Invalid email address",
    "auth/user-disabled": "This account has been disabled",
    "auth/user-not-found": "User not found",
    "auth/wrong-password": "Incorrect password",
    "auth/email-already-in-use": "This email is already in use",
    "auth/weak-password": "Password is too weak (at least 6 characters)",
    "auth/operation-not-allowed": "This login method is not enabled",
    "auth/popup-closed-by-user": "Login popup was closed",
    "auth/cancelled-popup-request": "Login request was cancelled",
    "auth/network-request-failed": "Network connection failed",
  };

  return errorMessages[errorCode] || "Login failed, please try again later";
}
