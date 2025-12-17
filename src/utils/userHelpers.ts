import type { User as FirebaseUser } from "firebase/auth";

/**
 * Get user initials from Firebase user object
 * Priority: displayName > email > default 'U'
 */
export function getUserInitials(firebaseUser: FirebaseUser): string {
  if (firebaseUser.displayName) {
    const words = firebaseUser.displayName.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return firebaseUser.displayName.substring(0, 2).toUpperCase();
  }
  if (firebaseUser.email) {
    return firebaseUser.email.substring(0, 2).toUpperCase();
  }
  return "U";
}

/**
 * Get user display name from Firebase user object
 * Priority: displayName > email > 'Guest'
 */
export function getUserDisplayName(firebaseUser: FirebaseUser): string {
  return firebaseUser.displayName || firebaseUser.email || "Guest";
}
