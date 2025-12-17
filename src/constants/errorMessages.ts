/**
 * Error message constants
 */

/**
 * Firebase Auth error messages
 * Maps Firebase Auth error codes to user-friendly messages
 */
export const AUTH_ERROR_MESSAGES: Record<string, string> = {
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

/**
 * Default error message for unknown auth errors
 */
export const DEFAULT_AUTH_ERROR_MESSAGE =
  "Login failed, please try again later";
