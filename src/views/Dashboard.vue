<template>
  <div class="dashboard-content">
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
        <!-- Left: User Info -->
        <div class="user-info">
          <img
            v-if="user?.photoURL"
            :src="user.photoURL"
            :alt="user.displayName || 'User'"
            class="user-avatar"
          />
          <div v-else class="user-avatar-placeholder">
            {{ user ? getUserInitials(user as any) : "?" }}
          </div>
        </div>

        <!-- Center: Squad Name -->
        <div class="squad-name">{{ squadName }}</div>

        <!-- Right: Actions -->
        <div class="flex items-center gap-1">
          <router-link to="/race-guide" class="nav-btn" title="Race Guide">
            <Map :size="20" />
          </router-link>
          <button
            @click="handleSignOut"
            class="nav-btn text-zinc-400 hover:text-red-500"
            title="Logout"
          >
            <LogOut :size="20" />
          </button>
        </div>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useAuth } from "../composables/useAuth";
import { useDashboard } from "../composables/useDashboard";
import { useWorkout } from "../composables/useWorkout";
import { getUserInitials } from "../utils/userHelpers";
import { CURRENT_SQUAD_ID } from "../constants";
import HistoryHeatmap from "../components/HistoryHeatmap.vue";
import EnergyDashboard from "../components/EnergyDashboard.vue";
import ActionSection from "../components/ActionSection.vue";
import PhotoModal from "../components/PhotoModal.vue";
import type { WorkoutRecord } from "../types";
import { Map, LogOut } from "lucide-vue-next";

// Auth
const { user, appUserId, signOut } = useAuth();

// Dashboard
const {
  loading,
  error,
  history,
  todaysRecords,
  users,
  streak,
  squadName,
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
.dashboard-content {
  display: flex;
  flex-direction: column;
  flex: 1;
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
  gap: 1rem;
}

.squad-name {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-weight: 700;
  font-size: 1rem;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 50%;
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

.nav-btn {
  padding: 0.5rem;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--color-text-secondary);
  transition: color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
}

.nav-btn:hover {
  background-color: var(--color-neutral-100);
  color: var(--color-text-primary);
}

.nav-btn.text-red-500:hover {
  color: var(--color-error, #ef4444);
  background-color: #fee2e2;
}

/* Loading State */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 1rem;
  min-height: 400px;
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
  flex: 1;
  gap: 1rem;
  padding: 2rem;
  text-align: center;
  min-height: 400px;
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
</style>
