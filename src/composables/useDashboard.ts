import { ref, watch, onUnmounted, type Ref } from "vue";
import {
  onSnapshot,
  collection,
  query,
  where,
  doc,
  orderBy as firestoreOrderBy,
} from "firebase/firestore";
import { db } from "../config/firebase";
import {
  getDashboardData,
  calculateStreak,
  getTodayString,
} from "../services/firestore";
import {
  convertTeamDailyStatsToHistory,
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
  const history = ref<DailyStats[]>([]); // Now uses TEAM history (count = 0-4)
  const todaysRecords = ref<WorkoutRecord[]>([]);
  const users = ref<User[]>([]);
  const streak = ref(0); // Squad streak
  const squadName = ref(""); // Squad name
  const personalStreak = ref(0); // Personal streak

  // Firestore realtime listener unsubscribe functions
  let unsubscribeWorkouts: (() => void) | null = null;
  let unsubscribeSquad: (() => void) | null = null;
  let unsubscribeUser: (() => void) | null = null;

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

      // Use TEAM history for Heatmap (per TECHNICAL_SPEC.md L549-555)
      // count = number of members who completed (0-4)
      if (data.teamHistory) {
        history.value = convertTeamDailyStatsToHistory(data.teamHistory);
      }

      // Use squad streak from squad document (already calculated during check-in)
      if (data.squad) {
        streak.value = data.squad.currentStreak || 0;
        squadName.value = data.squad.name || "";
      }

      // Calculate personal streak
      if (data.user) {
        personalStreak.value = data.user.currentStreak || 0;
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
        teamHistory: history.value.length,
        todayWorkouts: todaysRecords.value.length,
        users: users.value.length,
        squadStreak: streak.value,
        personalStreak: personalStreak.value,
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
   * Setup realtime listeners for squad and user streaks
   */
  function setupRealtimeStreaks() {
    if (!appUserId.value) return;

    // 1. Listen to Squad document
    const squadRef = doc(db, "squads", squadId);
    unsubscribeSquad = onSnapshot(squadRef, (docSnap) => {
      if (docSnap.exists()) {
        const squadData = docSnap.data();
        if (streak.value !== squadData.currentStreak) {
          console.log(
            "Squad streak updated in real-time:",
            squadData.currentStreak
          );
          streak.value = squadData.currentStreak || 0;
        }
        if (squadName.value !== squadData.name) {
          squadName.value = squadData.name || "";
        }
      }
    });

    // 2. Listen to User document
    const userRef = doc(db, "users", appUserId.value);
    unsubscribeUser = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data();
        if (personalStreak.value !== userData.currentStreak) {
          console.log(
            "Personal streak updated in real-time:",
            userData.currentStreak
          );
          personalStreak.value = userData.currentStreak || 0;
        }
      }
    });
  }

  /**
   * Cleanup data and listeners
   */
  function cleanup() {
    history.value = [];
    todaysRecords.value = [];
    users.value = [];
    streak.value = 0;
    squadName.value = "";
    personalStreak.value = 0;
    if (unsubscribeWorkouts) {
      unsubscribeWorkouts();
      unsubscribeWorkouts = null;
    }
    if (unsubscribeSquad) {
      unsubscribeSquad();
      unsubscribeSquad = null;
    }
    if (unsubscribeUser) {
      unsubscribeUser();
      unsubscribeUser = null;
    }
  }

  /**
   * Initialize dashboard when appUserId is available
   */
  async function initialize() {
    if (appUserId.value) {
      await loadDashboardData();
      setupRealtimeWorkouts();
      setupRealtimeStreaks();
    }
  }

  // Watch appUserId changes
  watch(appUserId, async (newAppUserId) => {
    if (newAppUserId) {
      console.log("App user bound:", newAppUserId);
      await loadDashboardData();
      setupRealtimeWorkouts();
      setupRealtimeStreaks();
    } else {
      console.log("App user not bound");
      cleanup();
    }
  });

  // Cleanup on unmount
  onUnmounted(() => {
    cleanup();
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
    squadName,
    personalStreak,

    // Methods
    loadDashboardData,
    initialize,
    waitForCheckInUpdate,
  };
}
