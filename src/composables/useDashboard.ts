import { ref, watch, onUnmounted, type Ref } from "vue";
import {
  onSnapshot,
  collection,
  query,
  where,
  orderBy as firestoreOrderBy,
} from "firebase/firestore";
import { db } from "../config/firebase";
import {
  getDashboardData,
  calculateStreak,
  getTodayString,
} from "../services/firestore";
import {
  convertUserDailyStatsToHistory,
  convertWorkoutDocumentToRecord,
  convertSquadMembersToUsers,
} from "../utils/dataConverters";
import type { WorkoutRecord, DailyStats, User } from "../types";
import type { WorkoutDocument } from "../types/firestore";

interface UseDashboardOptions {
  appUserId: Ref<string | null>;
  squadId: string;
}

/**
 * Composable for managing dashboard data and realtime workout updates
 */
export function useDashboard({ appUserId, squadId }: UseDashboardOptions) {
  // State
  const loading = ref(true);
  const error = ref<string | null>(null);
  const history = ref<DailyStats[]>([]);
  const todaysRecords = ref<WorkoutRecord[]>([]);
  const users = ref<User[]>([]);
  const streak = ref(0);

  // Firestore realtime listener unsubscribe function
  let unsubscribeWorkouts: (() => void) | null = null;

  /**
   * Load dashboard data from Firestore
   */
  async function loadDashboardData() {
    if (!appUserId.value) {
      console.warn("App user not bound, cannot load data");
      return;
    }

    try {
      loading.value = true;
      error.value = null;

      const data = await getDashboardData(appUserId.value, squadId);

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

  /**
   * Setup realtime listener for today's workout records
   */
  function setupRealtimeWorkouts() {
    const today = getTodayString();
    const workoutsRef = collection(db, "workouts");
    const q = query(
      workoutsRef,
      where("squadId", "==", squadId),
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

  /**
   * Cleanup data and listeners
   */
  function cleanup() {
    history.value = [];
    todaysRecords.value = [];
    users.value = [];
    streak.value = 0;
    if (unsubscribeWorkouts) {
      unsubscribeWorkouts();
      unsubscribeWorkouts = null;
    }
  }

  /**
   * Initialize dashboard when appUserId is available
   */
  async function initialize() {
    if (appUserId.value) {
      await loadDashboardData();
      setupRealtimeWorkouts();
    }
  }

  // Watch appUserId changes
  watch(appUserId, async (newAppUserId) => {
    if (newAppUserId) {
      console.log("App user bound:", newAppUserId);
      await loadDashboardData();
      setupRealtimeWorkouts();
    } else {
      console.log("App user not bound");
      cleanup();
    }
  });

  // Cleanup on unmount
  onUnmounted(() => {
    if (unsubscribeWorkouts) {
      unsubscribeWorkouts();
    }
  });

  return {
    // State
    loading,
    error,
    history,
    todaysRecords,
    users,
    streak,

    // Methods
    loadDashboardData,
    initialize,
  };
}
