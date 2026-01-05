<template>
  <div class="timeline-container">
    <!-- Header -->
    <header class="timeline-header">
      <div class="header-content">
        <div class="header-left">
          <router-link to="/" class="back-btn" title="Back to Dashboard">
            <ArrowLeft :size="20" />
          </router-link>
          <h1 class="header-title">TIMELINE</h1>
        </div>
      </div>
    </header>

    <!-- Team Legend -->
    <!-- <div class="team-legend">
      <span>{{ leftTeamLabel }}</span>
      <span>{{ rightTeamLabel }}</span>
    </div> -->

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading timeline...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <p>{{ error }}</p>
      <button @click="loadData">Retry</button>
    </div>

    <!-- Timeline Content -->
    <div v-else class="timeline-content">
      <DateSection
        v-for="[date, records] in sortedTimelineData"
        :key="date"
        :date="date"
        :records="records"
        :users="users"
        :leftUserIds="leftUserIds"
        @image-click="handleImageClick"
      />

      <!-- Empty State -->
      <div v-if="sortedTimelineData.length === 0" class="empty-state">
        <p>No workout records yet</p>
      </div>

      <!-- End of Feed -->
      <div v-else class="end-of-feed">
        <div class="end-line"></div>
        <span class="end-text">END OF RECORDS</span>
      </div>
    </div>

    <!-- Photo Modal -->
    <PhotoModal
      :isOpen="modalOpen"
      :record="selectedRecord"
      :user="selectedUser"
      @close="modalOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { ArrowLeft } from "lucide-vue-next";
import { useAuth } from "../composables/useAuth";
import { getAllWorkouts, getSquadMembers } from "../services/firestore";
import { convertSquadMembersToUsers } from "../utils/dataConverters";
import { CURRENT_SQUAD_ID } from "../constants";
import DateSection from "../components/Timeline/DateSection.vue";
import PhotoModal from "../components/PhotoModal.vue";
import type { User, WorkoutRecord } from "../types";
import type { WorkoutDocument } from "../types/firestore";

// Auth
const { appUserId, loading: authLoading } = useAuth();

// State
const loading = ref(true);
const error = ref<string | null>(null);
const users = ref<User[]>([]);
const timelineData = ref<Map<string, WorkoutRecord[]>>(new Map());

// Modal State
const modalOpen = ref(false);
const selectedRecord = ref<WorkoutRecord | null>(null);
const selectedUser = ref<User | undefined>(undefined);

const handleImageClick = (record: WorkoutRecord, user: User) => {
  selectedRecord.value = record;
  selectedUser.value = user;
  modalOpen.value = true;
};

// Compute left user IDs (first half of users)
const leftUserIds = computed(() => {
  const ids = users.value.map((u) => u.id);
  const midpoint = Math.ceil(ids.length / 2);
  return ids.slice(0, midpoint);
});

// Team labels
const leftTeamLabel = computed(() => {
  const names = users.value
    .filter((u) => leftUserIds.value.includes(u.id))
    .map((u) => u.name);
  return names.length > 0 ? names.join(" / ") : "Team A";
});

const rightTeamLabel = computed(() => {
  const names = users.value
    .filter((u) => !leftUserIds.value.includes(u.id))
    .map((u) => u.name);
  return names.length > 0 ? names.join(" / ") : "Team B";
});

// Sort timeline data by date (descending)
const sortedTimelineData = computed(() => {
  const entries = Array.from(timelineData.value.entries());
  return entries.sort((a, b) => b[0].localeCompare(a[0]));
});

// Convert WorkoutDocument to WorkoutRecord
function convertToRecord(doc: WorkoutDocument): WorkoutRecord {
  return {
    userId: doc.userId,
    completedAt: doc.completedAt.toDate().toISOString(),
    imageUrl: doc.imageUrl,
    note: doc.note,
  };
}

// Load data
async function loadData() {
  if (!appUserId.value) {
    error.value = "User not logged in";
    loading.value = false;
    return;
  }

  try {
    loading.value = true;
    error.value = null;

    // Fetch users and workouts in parallel
    const [members, workoutsMap] = await Promise.all([
      getSquadMembers(CURRENT_SQUAD_ID),
      getAllWorkouts(CURRENT_SQUAD_ID),
    ]);

    // Convert members to users
    users.value = convertSquadMembersToUsers(members);

    // Convert workouts to records
    const recordsMap = new Map<string, WorkoutRecord[]>();
    for (const [date, docs] of workoutsMap.entries()) {
      recordsMap.set(date, docs.map(convertToRecord));
    }
    timelineData.value = recordsMap;

    console.log("Timeline data loaded:", {
      users: users.value.length,
      dates: timelineData.value.size,
    });
  } catch (err) {
    console.error("Failed to load timeline data:", err);
    error.value = "Failed to load timeline data";
  } finally {
    loading.value = false;
  }
}

// Wait for auth to be ready before loading data
watch(
  authLoading,
  (isLoading) => {
    if (!isLoading) {
      loadData();
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.timeline-container {
  /* Make this the scroll container for sticky to work */
  height: 100dvh;
  overflow-x: hidden;
  overflow-y: auto;
  background: var(--color-neutral-50);
  color: var(--color-text-primary);
  padding-bottom: 8rem;
}

/* Header */
.timeline-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: var(--color-background);
  border-bottom: 1px solid var(--color-border);
}

.header-content {
  max-width: 48rem;
  margin: 0 auto;
  padding: 0 1rem;
  height: 4rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-radius: 0.5rem;
  color: var(--color-text-secondary);
  transition: all 0.2s;
}

.back-btn:hover {
  background: var(--color-neutral-100);
  color: var(--color-text-primary);
}

.header-title {
  font-family: "Oswald", sans-serif;
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--color-text-primary);
}

/* Team Legend */
.team-legend {
  max-width: 48rem;
  margin: 0 auto;
  padding: 1rem 1rem 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-text-tertiary);
}

/* Timeline Content */
.timeline-content {
  max-width: 48rem;
  margin: 0 auto;
  padding: 1.5rem 0.5rem;
}

@media (min-width: 640px) {
  .timeline-content {
    padding: 1.5rem 1rem;
  }
}

/* Loading State */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
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
  min-height: 400px;
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

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: var(--color-text-tertiary);
}

/* End of Feed */
.end-of-feed {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 0;
  gap: 0.5rem;
  opacity: 0.5;
}

.end-line {
  width: 2px;
  height: 3rem;
  background: linear-gradient(to bottom, var(--color-border), transparent);
}

.end-text {
  font-family: monospace;
  font-size: 0.75rem;
  color: var(--color-text-tertiary);
}
</style>
