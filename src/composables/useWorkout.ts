import { ref, type Ref } from "vue";
import { executeCheckIn } from "../services/firestore";
import { uploadWorkoutImage, validateFile } from "../services/storage";

interface UseWorkoutOptions {
  appUserId: Ref<string | null>;
  squadId: string;
  /** Optional callback to wait for realtime update after check-in */
  waitForUpdate?: () => Promise<void>;
  /** Optional callback to update streaks immediately from check-in result */
  onStreakUpdate?: (personalStreak: number, squadStreak: number) => void;
}

interface CheckInData {
  file: File;
  note: string;
}

/**
 * Composable for managing workout check-in operations
 */
export function useWorkout({
  appUserId,
  squadId,
  waitForUpdate,
  onStreakUpdate,
}: UseWorkoutOptions) {
  const uploading = ref(false);

  /**
   * Handle workout check-in
   * Validates file, uploads image to Storage, and creates workout record in Firestore
   */
  async function handleCheckIn(data: CheckInData): Promise<void> {
    if (!appUserId.value) {
      throw new Error("Please login and select your profile first");
    }

    try {
      uploading.value = true;

      // Validate file
      const validation = validateFile(data.file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // 1. Upload image to Storage
      console.log("Starting image upload...");
      const imageUrl = await uploadWorkoutImage(
        data.file,
        appUserId.value,
        squadId
      );
      console.log("Image upload successful:", imageUrl);

      // 2. Execute check-in workflow (creates workout + updates streaks)
      console.log("Executing check-in workflow...");
      const result = await executeCheckIn({
        userId: appUserId.value,
        squadId,
        imageUrl,
        note: data.note,
      });
      console.log("Check-in successful!", {
        workoutId: result.workoutId,
        personalStreak: result.personalStreak,
        squadStreak: result.squadStreak,
      });

      // 3. Update streaks immediately using check-in result (if callback provided)
      if (onStreakUpdate) {
        onStreakUpdate(result.personalStreak, result.squadStreak);
        console.log("Streaks updated immediately from check-in result");
      }

      // 4. Wait for realtime listener to update UI (if callback provided)
      if (waitForUpdate) {
        console.log("Waiting for realtime update...");
        await waitForUpdate();
        console.log("Realtime update detected");
      }
    } finally {
      uploading.value = false;
    }
  }

  return {
    uploading,
    handleCheckIn,
  };
}
