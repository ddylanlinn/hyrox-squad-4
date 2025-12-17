<template>
  <div class="login-container">
    <div class="login-card">
      <!-- Logo / Title -->
      <div class="login-header">
        <h1>HYROX</h1>
        <p>login to start training</p>
      </div>

      <!-- Error Message -->
      <div v-if="authError" class="error-message">
        {{ authError }}
      </div>

      <!-- Login Buttons -->
      <div class="login-buttons">
        <!-- Google Login -->
        <button
          @click="handleGoogleLogin"
          :disabled="authLoading"
          class="login-btn google-btn"
        >
          <svg class="icon google-icon" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span>login with google</span>
        </button>

        <!-- Divider -->
        <div class="divider">
          <span>or</span>
        </div>

        <!-- Email Login Form -->
        <form @submit.prevent="handleEmailLogin" class="email-form">
          <div class="form-group">
            <label for="email">Email</label>
            <input
              id="email"
              v-model="email"
              type="email"
              placeholder="your@email.com"
              required
              :disabled="authLoading"
              class="email-input"
            />
          </div>
          <button
            type="submit"
            :disabled="authLoading || !email"
            class="login-btn email-btn"
          >
            <svg
              class="icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <span>login with email</span>
          </button>
        </form>
      </div>

      <!-- Loading State -->
      <div v-if="authLoading" class="loading-overlay">
        <div class="spinner"></div>
        <p>Logging in...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useAuth } from "../composables/useAuth";
import { FIXED_LOGIN_PASSWORD } from "../constants";

const {
  loading: authLoading,
  error: authError,
  signInWithGoogle,
  signInWithEmail,
} = useAuth();

const email = ref("");

const handleGoogleLogin = async () => {
  try {
    await signInWithGoogle();
  } catch (error) {
    console.error("Google login failed:", error);
  }
};

const handleEmailLogin = async () => {
  if (!email.value) {
    return;
  }

  try {
    await signInWithEmail(email.value, FIXED_LOGIN_PASSWORD);
  } catch (error: any) {
    console.error("Email login failed:", error);
    // If user not found error, attempt to register
    if (error?.code === "auth/user-not-found") {
      console.log("User not found, attempting to create account...");
      // useAuth will automatically handle the registration process
    }
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  background: linear-gradient(135deg, var(--color-primary) 0%, #1e40af 100%);
  padding: 1rem;
}

.login-card {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
  position: relative;
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-header h1 {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 0.5rem 0;
}

.login-header p {
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  margin: 0;
}

.error-message {
  background-color: #fee2e2;
  color: #991b1b;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
  text-align: center;
}

.login-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.login-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-btn .icon {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
}

.google-btn {
  background: white;
  color: #1f2937;
  border: 1px solid #e5e7eb;
}

.google-btn:hover:not(:disabled) {
  background: #f9fafb;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 0.5rem 0;
}

.divider::before,
.divider::after {
  content: "";
  flex: 1;
  border-bottom: 1px solid #e5e7eb;
}

.divider span {
  padding: 0 0.75rem;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}

.email-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-primary);
}

.email-input {
  padding: 0.75rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: all 0.2s;
}

.email-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.email-input:disabled {
  background: #f9fafb;
  cursor: not-allowed;
}

.email-btn {
  background: var(--color-primary);
  color: white;
}

.email-btn:hover:not(:disabled) {
  opacity: 0.9;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  border-radius: 1rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-overlay p {
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  margin: 0;
}
</style>
