/**
 * useAuth Composable
 * Manages user authentication state and app user binding
 *
 * Usage example:
 * const { user, appUserId, needsBinding, bindAppUser, signInWithGoogle, signOut } = useAuth();
 */

import { ref, onMounted, onUnmounted } from "vue";
import type { Ref } from "vue";
import type { User as FirebaseUser } from "firebase/auth";
import {
  signInWithGoogle as authSignInWithGoogle,
  signInWithEmail as authSignInWithEmail,
  signUpWithEmail as authSignUpWithEmail,
  signOut as authSignOut,
  getCurrentUser,
  onAuthStateChange,
  getAuthErrorMessage,
} from "../services/auth";
import {
  getAuthBinding,
  createAuthBinding,
  syncUserAvatar,
} from "../services/auth/binding";

interface UseAuthReturn {
  user: Ref<FirebaseUser | null>;
  appUserId: Ref<string | null>; // Bound app user ID
  needsBinding: Ref<boolean>; // Whether user needs to select binding
  loading: Ref<boolean>;
  error: Ref<string | null>;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
  bindAppUser: (appUserId: string) => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const user = ref<FirebaseUser | null>(null);
  const appUserId = ref<string | null>(null);
  const needsBinding = ref(false);
  const loading = ref(true);
  const error = ref<string | null>(null);

  let unsubscribe: (() => void) | null = null;

  // Check binding status
  async function checkBinding(firebaseUser: FirebaseUser) {
    try {
      const binding = await getAuthBinding(firebaseUser.uid);

      if (binding) {
        // Already bound
        appUserId.value = binding.appUserId;
        needsBinding.value = false;
        console.log("App user already bound:", binding.appUserId);

        // Sync avatar if user has a photo (non-blocking, only syncs if changed)
        if (firebaseUser.photoURL) {
          syncUserAvatar(binding.appUserId, firebaseUser.photoURL)
            .then((updated) => {
              if (updated) {
                console.log("Avatar updated for user:", binding.appUserId);
              }
            })
            .catch((err) => console.warn("Failed to sync avatar:", err));
        }
      } else {
        // Not bound, need to select
        appUserId.value = null;
        needsBinding.value = true;
        console.log("App user binding required");
      }
    } catch (err) {
      console.error("Failed to check auth binding:", err);
      error.value = "Failed to check binding status";
    }
  }

  // Listen to auth state changes
  onMounted(async () => {
    // Get current user first (if any)
    const currentUser = getCurrentUser();
    user.value = currentUser;

    if (currentUser) {
      await checkBinding(currentUser);
      loading.value = false;
    } else {
      loading.value = false;
    }

    // Listen to auth state changes
    unsubscribe = onAuthStateChange(async (newUser) => {
      user.value = newUser;

      if (newUser) {
        console.log("Auth state changed:", newUser.uid);
        await checkBinding(newUser);
      } else {
        console.log("Auth state changed: Not logged in");
        appUserId.value = null;
        needsBinding.value = false;
      }

      loading.value = false;
    });
  });

  // Cleanup listeners
  onUnmounted(() => {
    if (unsubscribe) {
      unsubscribe();
    }
  });

  // Bind app user
  const bindAppUser = async (selectedAppUserId: string) => {
    if (!user.value) {
      throw new Error("User not logged in");
    }

    try {
      loading.value = true;
      error.value = null;

      const provider = user.value.providerData[0]?.providerId || "unknown";

      await createAuthBinding(
        user.value.uid,
        selectedAppUserId,
        provider,
        user.value.email || undefined,
        user.value.displayName || undefined,
        user.value.photoURL || undefined
      );

      appUserId.value = selectedAppUserId;
      needsBinding.value = false;

      console.log("App user binding successful:", selectedAppUserId);
    } catch (err: any) {
      console.error("App user binding failed:", err);
      error.value = "Binding failed, please try again later";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Google login
  const signInWithGoogle = async () => {
    try {
      loading.value = true;
      error.value = null;
      await authSignInWithGoogle();
      // checkBinding will be executed automatically in onAuthStateChange
    } catch (err: any) {
      console.error("Google login failed:", err);
      error.value = getAuthErrorMessage(err);
      loading.value = false;
      throw err;
    }
  };

  // Email/Password login
  const signInWithEmail = async (email: string, password: string) => {
    try {
      loading.value = true;
      error.value = null;
      await authSignInWithEmail(email, password);
    } catch (err: any) {
      console.error("Email login failed:", err);
      error.value = getAuthErrorMessage(err);
      loading.value = false;
      throw err;
    }
  };

  // Email/Password signup
  const signUpWithEmail = async (
    email: string,
    password: string,
    displayName: string
  ) => {
    try {
      loading.value = true;
      error.value = null;
      await authSignUpWithEmail(email, password, displayName);
    } catch (err: any) {
      console.error("Email signup failed:", err);
      error.value = getAuthErrorMessage(err);
      loading.value = false;
      throw err;
    }
  };

  // Logout
  const signOut = async () => {
    try {
      loading.value = true;
      error.value = null;
      await authSignOut();
      appUserId.value = null;
      needsBinding.value = false;
    } catch (err: any) {
      console.error("Logout failed:", err);
      error.value = "Logout failed, please try again later";
      loading.value = false;
      throw err;
    }
  };

  return {
    user,
    appUserId,
    needsBinding,
    loading,
    error,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    bindAppUser,
  };
}
