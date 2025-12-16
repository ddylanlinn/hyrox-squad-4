<template>
  <div class="app-container">
    <!-- Section A: History -->
    <HistoryHeatmap
      :history="history"
      :todayCount="todaysRecords.length"
      :streak="streak"
    />

    <!-- Section B: Energy -->
    <EnergyDashboard
      :users="USERS"
      :records="todaysRecords"
      @avatar-click="handleAvatarClick"
    />

    <!-- Section C: Action -->
    <ActionSection
      :mission="mission"
      :isCompleted="isCompleted"
      :completedCount="todaysRecords.length"
      @check-in="handleCheckIn"
      @update-mission="handleUpdateMission"
    />

    <!-- Section D: Modal -->
    <PhotoModal
      :isOpen="modalOpen"
      :record="selectedRecord"
      :user="selectedUser"
      @close="modalOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import HistoryHeatmap from "./components/HistoryHeatmap.vue";
import EnergyDashboard from "./components/EnergyDashboard.vue";
import ActionSection from "./components/ActionSection.vue";
import PhotoModal from "./components/PhotoModal.vue";
import {
  generateHistory,
  getStreakCount,
  TODAY_MISSION,
  USERS,
  CURRENT_USER_ID,
} from "./services/mockData";
import type { WorkoutRecord, DailyStats, Mission } from "./types";

// State
const history = ref<DailyStats[]>([]);
const todaysRecords = ref<WorkoutRecord[]>([]);
const streak = ref(0);
const modalOpen = ref(false);
const selectedRecord = ref<WorkoutRecord | null>(null);
const mission = ref<Mission>(TODAY_MISSION);

// Computed
const currentUserRecord = computed(() =>
  todaysRecords.value.find((r) => r.userId === CURRENT_USER_ID)
);

const isCompleted = computed(() => !!currentUserRecord.value);

const selectedUser = computed(() =>
  USERS.find((u) => u.id === selectedRecord.value?.userId)
);

// Initialize Data
onMounted(() => {
  const hist = generateHistory();
  history.value = hist;
  streak.value = getStreakCount(hist);

  // Check local storage for today's temporary state or initialize empty
  // For MVP demo, we start empty or with some dummy data if we wanted
  const dummyToday: WorkoutRecord[] = [
    {
      userId: "u2",
      completedAt: new Date().toISOString(),
      imageUrl: "https://picsum.photos/400/600?random=1",
      note: "Dying after those wall balls",
    },
  ];
  todaysRecords.value = dummyToday;
});

// Handlers
const handleCheckIn = (file: File) => {
  const objectUrl = URL.createObjectURL(file);

  const newRecord: WorkoutRecord = {
    userId: CURRENT_USER_ID,
    completedAt: new Date().toISOString(),
    imageUrl: objectUrl,
    note: "Done! Let's go squad!",
  };

  todaysRecords.value = [...todaysRecords.value, newRecord];

  // In a real app, we would update history optimistically here too
  // But history is strictly "past days" in this MVP structure
};

const handleAvatarClick = (record: WorkoutRecord) => {
  console.log("🚀 ~ handleAvatarClick ~ record:", record);
  selectedRecord.value = record;
  modalOpen.value = true;
};

const handleUpdateMission = (newMission: Mission) => {
  mission.value = newMission;
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
</style>
