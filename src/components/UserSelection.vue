<template>
  <div class="user-selection-container">
    <div class="user-selection-card">
      <!-- Header -->
      <div class="selection-header">
        <h2>Select Your Profile</h2>
        <p>Choose which team member you are</p>
      </div>

      <!-- User List -->
      <div class="user-list">
        <button
          v-for="user in availableUsers"
          :key="user.id"
          @click="handleSelectUser(user.id)"
          :disabled="selecting"
          class="user-card"
        >
          <div class="user-avatar">{{ user.initials }}</div>
          <div class="user-info">
            <h3>{{ user.name }}</h3>
          </div>
          <svg
            class="arrow-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="selecting" class="loading-overlay">
        <div class="spinner"></div>
        <p>Binding account...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { getAvailableAppUsers } from "../services/auth/binding";

const emit = defineEmits<{
  select: [userId: string];
}>();

const availableUsers = getAvailableAppUsers();
const selecting = ref(false);

const handleSelectUser = async (userId: string) => {
  selecting.value = true;
  try {
    emit("select", userId);
  } catch (error) {
    console.error("User selection failed:", error);
    selecting.value = false;
  }
};
</script>

<style scoped>
.user-selection-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  background: linear-gradient(135deg, var(--color-primary) 0%, #1e40af 100%);
  padding: 1rem;
}

.user-selection-card {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
  position: relative;
}

.selection-header {
  text-align: center;
  margin-bottom: 2rem;
}

.selection-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 0.5rem 0;
}

.selection-header p {
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  margin: 0;
}

.user-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  text-align: left;
}

.user-card:hover:not(:disabled) {
  border-color: var(--color-primary);
  background: #f9fafb;
  transform: translateX(4px);
}

.user-card:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: 600;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
}

.user-info h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.arrow-icon {
  width: 20px;
  height: 20px;
  color: var(--color-text-secondary);
  flex-shrink: 0;
  transition: transform 0.2s;
}

.user-card:hover:not(:disabled) .arrow-icon {
  transform: translateX(4px);
  color: var(--color-primary);
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
