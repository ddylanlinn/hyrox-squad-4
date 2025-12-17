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
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import {
  onSnapshot,
  collection,
  query,
  where,
  orderBy as firestoreOrderBy,
} from "firebase/firestore";
import { db } from "./config/firebase";
import { useAuth } from "./composables/useAuth";
import LoginView from "./components/LoginView.vue";
import UserSelection from "./components/UserSelection.vue";
import HistoryHeatmap from "./components/HistoryHeatmap.vue";
import EnergyDashboard from "./components/EnergyDashboard.vue";
import ActionSection from "./components/ActionSection.vue";
import PhotoModal from "./components/PhotoModal.vue";
import {
  getDashboardData,
  createWorkout,
  calculateStreak,
  getTodayString,
} from "./services/firestore";
import { uploadWorkoutImage, validateFile } from "./services/storage";
import type { WorkoutRecord, DailyStats, User } from "./types";
import type {
  WorkoutDocument,
  UserDailyStats,
  SquadMemberDocument,
} from "./types/firestore";

// Auth
const {
  user,
  appUserId,
  needsBinding,
  loading: authLoading,
  signOut,
  bindAppUser,
} = useAuth();

// Constants
const CURRENT_SQUAD_ID = "squad-001";

// State
const loading = ref(true);
const error = ref<string | null>(null);
const history = ref<DailyStats[]>([]);
const todaysRecords = ref<WorkoutRecord[]>([]);
const users = ref<User[]>([]);
const streak = ref(0);
const modalOpen = ref(false);
const selectedRecord = ref<WorkoutRecord | null>(null);
const uploading = ref(false);

// Firestore realtime listener unsubscribe function
let unsubscribeWorkouts: (() => void) | null = null;

// Computed
const currentUserRecord = computed(() =>
  todaysRecords.value.find((r) => r.userId === appUserId.value)
);

const isCompleted = computed(() => !!currentUserRecord.value);

const selectedUser = computed(() =>
  users.value.find((u) => u.id === selectedRecord.value?.userId)
);

// Helper: Get user initials
function getUserInitials(firebaseUser: any): string {
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

// Handle user selection binding
const handleUserSelect = async (selectedUserId: string) => {
  try {
    await bindAppUser(selectedUserId);
    console.log("User binding successful:", selectedUserId);
  } catch (err) {
    console.error("User binding failed:", err);
    alert("Binding failed, please try again later");
  }
};

// Convert Firestore data to frontend format
function convertUserDailyStatsToHistory(stats: UserDailyStats[]): DailyStats[] {
  return stats.map((stat) => ({
    date: stat.date,
    count: stat.count,
    records: [], // Detailed records not needed
  }));
}

function convertWorkoutDocumentToRecord(
  workout: WorkoutDocument
): WorkoutRecord {
  return {
    userId: workout.userId,
    completedAt: workout.completedAt.toDate().toISOString(),
    imageUrl: workout.imageUrl,
    note: workout.note,
  };
}

function convertSquadMembersToUsers(members: SquadMemberDocument[]): User[] {
  return members.map((member) => ({
    id: member.userId,
    name: member.name,
    initials: member.initials,
    avatarUrl: member.avatarUrl,
  }));
}

async function loadDashboardData() {
  if (!appUserId.value) {
    console.warn("App user not bound, cannot load data");
    return;
  }

  try {
    loading.value = true;
    error.value = null;

    const data = await getDashboardData(appUserId.value, CURRENT_SQUAD_ID);

    if (data.userStats) {
      history.value = convertUserDailyStatsToHistory(data.userStats);
      streak.value = calculateStreak(data.userStats);
    }

    if (data.todayWorkouts) {
      todaysRecords.value = data.todayWorkouts.map(
        convertWorkoutDocumentToRecord
      );
    }

    if (data.members) {
      users.value = convertSquadMembersToUsers(data.members);
    }

    console.log("Dashboard data loaded successfully", {
      userId: appUserId.value,
      history: history.value.length,
      todayWorkouts: todaysRecords.value.length,
      users: users.value.length,
      streak: streak.value,
    });
  } catch (err) {
    console.error("Failed to load dashboard data:", err);
    error.value = "Failed to load data, please refresh the page";
  } finally {
    loading.value = false;
  }
}

// Setup realtime listener for today's workout records
function setupRealtimeWorkouts() {
  const today = getTodayString();
  const workoutsRef = collection(db, "workouts");
  const q = query(
    workoutsRef,
    where("squadId", "==", CURRENT_SQUAD_ID),
    where("date", "==", today),
    firestoreOrderBy("completedAt", "desc")
  );

  unsubscribeWorkouts = onSnapshot(
    q,
    (snapshot) => {
      todaysRecords.value = snapshot.docs.map((doc) => {
        const workout = doc.data() as WorkoutDocument;
        return convertWorkoutDocumentToRecord(workout);
      });
      console.log(
        "Today's workout records updated:",
        todaysRecords.value.length
      );
    },
    (err) => {
      console.error("Realtime listener failed:", err);
    }
  );
}

// Watch appUserId changes
watch(appUserId, async (newAppUserId) => {
  if (newAppUserId) {
    console.log("App user bound:", newAppUserId);
    await loadDashboardData();
    setupRealtimeWorkouts();
  } else {
    console.log("App user not bound");
    // Cleanup data
    history.value = [];
    todaysRecords.value = [];
    users.value = [];
    streak.value = 0;
    if (unsubscribeWorkouts) {
      unsubscribeWorkouts();
      unsubscribeWorkouts = null;
    }
  }
});

// Initialize Data
onMounted(async () => {
  if (appUserId.value) {
    await loadDashboardData();
    setupRealtimeWorkouts();
  }
});

// Cleanup
onUnmounted(() => {
  if (unsubscribeWorkouts) {
    unsubscribeWorkouts();
  }
});

// Handlers
const handleCheckIn = async (data: { file: File; note: string }) => {
  if (!appUserId.value) {
    alert("Please login and select your profile first");
    return;
  }

  try {
    uploading.value = true;

    // Validate file
    const validation = validateFile(data.file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    // 1. Upload image to Storage
    console.log("Starting image upload...");
    const imageUrl = await uploadWorkoutImage(
      data.file,
      appUserId.value,
      CURRENT_SQUAD_ID
    );
    console.log("Image upload successful:", imageUrl);

    // 2. Create workout record in Firestore
    console.log("Creating workout record...");
    const workoutId = await createWorkout(
      appUserId.value,
      CURRENT_SQUAD_ID,
      imageUrl,
      data.note
    );
    console.log("Check-in successful!", workoutId);

    // Realtime listener will auto-update UI, no manual update needed
  } catch (err) {
    console.error("Check-in failed:", err);
    alert("Check-in failed, please try again later");
  } finally {
    uploading.value = false;
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
