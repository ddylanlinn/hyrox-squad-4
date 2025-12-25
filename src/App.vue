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
      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>Loading...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-container">
        <p>{{ error }}</p>
        <button @click="loadDashboardData">retry</button>
      </div>

      <!-- Main Content -->
      <template v-else>
        <!-- User Info Bar -->
        <div class="user-info-bar">
          <div class="user-info">
            <img
              v-if="user.photoURL"
              :src="user.photoURL"
              :alt="user.displayName || 'User'"
              class="user-avatar"
            />
            <div v-else class="user-avatar-placeholder">
              {{ getUserInitials(user) }}
            </div>
            <span class="user-name">{{
              user.displayName || user.email || "Guest"
            }}</span>
          </div>
          <button @click="handleSignOut" class="sign-out-btn" title="Logout">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </button>
        </div>

        <!-- Section A: History -->
        <HistoryHeatmap
          :history="history"
          :todayCount="todaysRecords.length"
          :streak="streak"
          :personalStreak="personalStreak"
        />

        <!-- Section B: Energy -->
        <EnergyDashboard
          :users="users"
          :records="todaysRecords"
          @avatar-click="handleAvatarClick"
        />

        <!-- Section C: Action -->
        <ActionSection
          :isCompleted="isCompleted"
          :completedCount="todaysRecords.length"
          :uploading="uploading"
          @check-in="handleCheckIn"
        />

        <!-- Section D: Modal -->
        <PhotoModal
          :isOpen="modalOpen"
          :record="selectedRecord"
          :user="selectedUser"
          @close="modalOpen = false"
        />
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useAuth } from "./composables/useAuth";
import { useDashboard } from "./composables/useDashboard";
import { useWorkout } from "./composables/useWorkout";
import { getUserInitials } from "./utils/userHelpers";
import { CURRENT_SQUAD_ID } from "./constants";
import LoginView from "./components/LoginView.vue";
import UserSelection from "./components/UserSelection.vue";
import HistoryHeatmap from "./components/HistoryHeatmap.vue";
import EnergyDashboard from "./components/EnergyDashboard.vue";
import ActionSection from "./components/ActionSection.vue";
import PhotoModal from "./components/PhotoModal.vue";
import type { WorkoutRecord } from "./types";

// Auth
const {
  user,
  appUserId,
  needsBinding,
  loading: authLoading,
  signOut,
  bindAppUser,
} = useAuth();

// Dashboard
const {
  loading,
  error,
  history,
  todaysRecords,
  users,
  streak,
  personalStreak,
  loadDashboardData,
  initialize: initializeDashboard,
  waitForCheckInUpdate,
} = useDashboard({
  appUserId,
  squadId: CURRENT_SQUAD_ID,
});

// Workout
const { uploading, handleCheckIn: checkIn } = useWorkout({
  appUserId,
  squadId: CURRENT_SQUAD_ID,
  waitForUpdate: waitForCheckInUpdate,
});

// Modal State
const modalOpen = ref(false);
const selectedRecord = ref<WorkoutRecord | null>(null);

// Computed
const currentUserRecord = computed(() =>
  todaysRecords.value.find((r) => r.userId === appUserId.value)
);

const isCompleted = computed(() => !!currentUserRecord.value);

const selectedUser = computed(() =>
  users.value.find((u) => u.id === selectedRecord.value?.userId)
);

// Initialize dashboard on mount
onMounted(async () => {
  await initializeDashboard();
});

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

const handleCheckIn = async (data: { file: File; note: string }) => {
  try {
    await checkIn(data);
  } catch (err) {
    const errorMessage =
      err instanceof Error
        ? err.message
        : "Check-in failed, please try again later";
    alert(errorMessage);
  }
};

const handleAvatarClick = (record: WorkoutRecord) => {
  console.log("Avatar clicked, record:", record);
  selectedRecord.value = record;
  modalOpen.value = true;
};

const handleSignOut = async () => {
  if (confirm("Are you sure you want to logout?")) {
    try {
      await signOut();
    } catch (err) {
      console.error("Logout failed:", err);
      alert("Logout failed, please try again later");
    }
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

/* User Info Bar */
.user-info-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: white;
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 10;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.user-avatar-placeholder {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
}

.user-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-primary);
}

.sign-out-btn {
  padding: 0.5rem;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--color-text-secondary);
  transition: color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sign-out-btn:hover {
  color: var(--color-error, #ef4444);
}

.sign-out-btn svg {
  width: 20px;
  height: 20px;
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

/* Error State */
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  gap: 1rem;
  padding: 2rem;
  text-align: center;
}

.error-container p {
  color: var(--color-error, #ef4444);
  font-size: 0.875rem;
}

.error-container button {
  padding: 0.5rem 1.5rem;
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: opacity 0.2s;
}

.error-container button:hover {
  opacity: 0.9;
}

.error-container button:active {
  opacity: 0.8;
}
</style>
