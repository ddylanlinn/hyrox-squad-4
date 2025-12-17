<template>
  <div class="app-container">
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>載入中...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <p>{{ error }}</p>
      <button @click="loadDashboardData">重試</button>
    </div>

    <!-- Main Content -->
    <template v-else>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import {
  onSnapshot,
  collection,
  query,
  where,
  orderBy as firestoreOrderBy,
} from "firebase/firestore";
import { db } from "./config/firebase";
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

// Constants
const CURRENT_USER_ID = "u1";
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

// Firestore 即時監聽取消函數
let unsubscribeWorkouts: (() => void) | null = null;

// Computed
const currentUserRecord = computed(() =>
  todaysRecords.value.find((r) => r.userId === CURRENT_USER_ID)
);

const isCompleted = computed(() => !!currentUserRecord.value);

const selectedUser = computed(() =>
  users.value.find((u) => u.id === selectedRecord.value?.userId)
);

// 轉換 Firestore 資料為前端格式
function convertUserDailyStatsToHistory(stats: UserDailyStats[]): DailyStats[] {
  return stats.map((stat) => ({
    date: stat.date,
    count: stat.count,
    records: [], // 不需要詳細記錄
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

// 載入儀表板資料
async function loadDashboardData() {
  try {
    loading.value = true;
    error.value = null;

    const data = await getDashboardData(CURRENT_USER_ID, CURRENT_SQUAD_ID);

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

    console.log("✅ 儀表板資料載入完成", {
      history: history.value.length,
      todayWorkouts: todaysRecords.value.length,
      users: users.value.length,
      streak: streak.value,
    });
  } catch (err) {
    console.error("❌ 載入儀表板資料失敗:", err);
    error.value = "載入資料失敗，請重新整理頁面";
  } finally {
    loading.value = false;
  }
}

// 設定即時監聽今日訓練記錄
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
      console.log("🔄 今日訓練記錄已更新:", todaysRecords.value.length);
    },
    (err) => {
      console.error("❌ 即時監聽失敗:", err);
    }
  );
}

// Initialize Data
onMounted(async () => {
  await loadDashboardData();
  setupRealtimeWorkouts();
});

// Cleanup
onUnmounted(() => {
  if (unsubscribeWorkouts) {
    unsubscribeWorkouts();
  }
});

// Handlers
const handleCheckIn = async (data: { file: File; note: string }) => {
  try {
    uploading.value = true;

    // 驗證檔案
    const validation = validateFile(data.file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    // 1. 上傳照片到 Storage
    console.log("📤 開始上傳照片...");
    const imageUrl = await uploadWorkoutImage(
      data.file,
      CURRENT_USER_ID,
      CURRENT_SQUAD_ID
    );
    console.log("✅ 照片上傳成功:", imageUrl);

    // 2. 建立訓練記錄到 Firestore
    console.log("💾 建立訓練記錄...");
    const workoutId = await createWorkout(
      CURRENT_USER_ID,
      CURRENT_SQUAD_ID,
      imageUrl,
      data.note
    );
    console.log("✅ 打卡成功！", workoutId);

    // 即時監聽會自動更新 UI，不需要手動更新
  } catch (err) {
    console.error("❌ 打卡失敗:", err);
    alert("打卡失敗，請稍後再試");
  } finally {
    uploading.value = false;
  }
};

const handleAvatarClick = (record: WorkoutRecord) => {
  console.log("🚀 ~ handleAvatarClick ~ record:", record);
  selectedRecord.value = record;
  modalOpen.value = true;
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
