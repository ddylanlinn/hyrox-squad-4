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

  /**
   * Wait for check-in update to appear in realtime listener
   *
   * Strategy:
   * - Monitor changes to current user's record (not just count)
   * - Detect both new records and updated timestamps
   * - Include safety timeout to prevent infinite waiting
   *
   * @param timeoutMs - Maximum time to wait (default: 5000ms)
   * @returns Promise that resolves when update is detected or timeout
   */
  function waitForCheckInUpdate(timeoutMs = 5000): Promise<void> {
    return new Promise((resolve) => {
      if (!appUserId.value) {
        resolve();
        return;
      }

      // Capture current state
      const currentUserRecord = todaysRecords.value.find(
        (r) => r.userId === appUserId.value
      );
      const currentTimestamp = currentUserRecord?.completedAt;
      const hasRecordBefore = !!currentUserRecord;

      let resolved = false;

      // Watch for changes in todaysRecords
      const stopWatch = watch(
        todaysRecords,
        (newRecords) => {
          if (resolved) return;

          const newUserRecord = newRecords.find(
            (r) => r.userId === appUserId.value
          );

          // Detect change: from no record to has record, or timestamp updated
          const hasNewRecord = !hasRecordBefore && !!newUserRecord;
          const hasUpdatedRecord =
            hasRecordBefore &&
            newUserRecord &&
            newUserRecord.completedAt !== currentTimestamp;

          if (hasNewRecord || hasUpdatedRecord) {
            console.log("Check-in detected in realtime listener", {
              hasNewRecord,
              hasUpdatedRecord,
              newTimestamp: newUserRecord?.completedAt,
            });
            resolved = true;
            stopWatch();
            clearTimeout(timeoutId);
            resolve();
          }
        },
        { deep: true }
      );

      // Timeout fallback to prevent infinite waiting
      const timeoutId = setTimeout(() => {
        if (!resolved) {
          console.log("waitForCheckInUpdate timeout reached");
          resolved = true;
          stopWatch();
          resolve();
        }
      }, timeoutMs);
    });
  }

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
    waitForCheckInUpdate,
  };
}
