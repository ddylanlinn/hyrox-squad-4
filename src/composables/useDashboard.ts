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
  calculateSquadStreak,
  getTodayString,
} from "../services/firestore";
import { getBoundMemberIds } from "../services/auth/binding";
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
  const boundMemberIds = ref<string[]>([]); // Cached bound member IDs for streak calculation

  // Flag to prevent duplicate reloads during realtime updates
  let isReloading = false;

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

      // Get squad name
      if (data.squad) {
        squadName.value = data.squad.name || "";
      }

      // Calculate personal streak in real-time from userStats
      if (data.userStats) {
        personalStreak.value = calculateStreak(data.userStats);
      }

      // Calculate squad streak in real-time from memberStatsMap
      if (data.squad?.memberIds && data.memberStatsMap) {
        const boundIds = await getBoundMemberIds(data.squad.memberIds);
        boundMemberIds.value = boundIds; // Cache for later use in watch
        streak.value = calculateSquadStreak(data.memberStatsMap, boundIds);
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
   * Setup realtime listener for squad name changes
   * Note: Streak is calculated in real-time, not from cached values
   */
  function setupRealtimeStreaks() {
    if (!appUserId.value) return;

    // Listen to Squad document for name changes only
    const squadRef = doc(db, "squads", squadId);
    unsubscribeSquad = onSnapshot(squadRef, (docSnap) => {
      if (docSnap.exists()) {
        const squadData = docSnap.data();
        if (squadName.value !== squadData.name) {
          squadName.value = squadData.name || "";
        }
      }
    });

    // Note: Personal streak is calculated in real-time from userStats
    // We still listen to user document for potential future fields
    const userRef = doc(db, "users", appUserId.value);
    unsubscribeUser = onSnapshot(userRef, () => {
      // Reserved for future use
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
   * Watch for today's records changes and recalculate streaks
   * This enables real-time streak updates after check-in
   *
   * Strategy: Instead of optimistic updates which can be incorrect in edge cases,
   * we reload dashboard data to ensure streaks are calculated correctly.
   */
  watch(
    todaysRecords,
    async (newRecords, oldRecords) => {
      // Skip if no user bound or during initial load or already reloading
      if (!appUserId.value || loading.value || isReloading) return;

      // Check if there's a meaningful change (new records added)
      const hasNewRecords = newRecords.length > (oldRecords?.length || 0);
      if (!hasNewRecords) return;

      console.log("New workout record detected, reloading streak data...");

      // Reload to get correct streak calculation
      // This ensures we use the proper calculateStreak logic rather than optimistic +1
      isReloading = true;
      try {
        // Only reload streak-related data, not full dashboard
        const data = await getDashboardData(appUserId.value, squadId);

        // Recalculate personal streak
        if (data.userStats) {
          personalStreak.value = calculateStreak(data.userStats);
          console.log("Personal streak recalculated:", personalStreak.value);
        }

        // Recalculate squad streak using cached bound member IDs
        if (data.memberStatsMap && boundMemberIds.value.length > 0) {
          streak.value = calculateSquadStreak(
            data.memberStatsMap,
            boundMemberIds.value
          );
          console.log("Squad streak recalculated:", streak.value);
        }
      } finally {
        isReloading = false;
      }
    },
    { deep: true }
  );

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
