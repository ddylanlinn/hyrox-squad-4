<template>
  <div class="app-container">
    <!-- Auth Loading State -->
    <div v-if="authLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Checking login status...</p>
    </div>

    <!-- Login View -->
    <LoginView v-else-if="!user" />

    <!-- User Selection (Binding Required) -->
    <UserSelection v-else-if="needsBinding" @select="handleUserSelect" />

    <!-- Main App (Authenticated & Bound) -->
    <template v-else>
      <router-view></router-view>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useAuth } from "./composables/useAuth";
import LoginView from "./components/LoginView.vue";
import UserSelection from "./components/UserSelection.vue";

// Auth
const { user, needsBinding, loading: authLoading, bindAppUser } = useAuth();

// Handlers
const handleUserSelect = async (selectedUserId: string) => {
  try {
    await bindAppUser(selectedUserId);
    console.log("User binding successful:", selectedUserId);
  } catch (err) {
    console.error("User binding failed:", err);
    alert("Binding failed, please try again later");
  }
};
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  max-width: 28rem; /* 448px = max-w-md */
  margin-left: auto;
  margin-right: auto;
  background-color: var(--color-background);
  box-shadow: var(--shadow-2xl);
  overflow: hidden;
  position: relative;
}

/* Loading State */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  gap: 1rem;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-container p {
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}
</style>
