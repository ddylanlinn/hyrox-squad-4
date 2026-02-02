import { ref, type Ref } from "vue";
import { executeCheckIn } from "../services/firestore";
import {
  executeEditWorkout,
  executeDeleteWorkout,
} from "../services/firestore/workflows/editWorkout";
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
  date?: string;
}

interface EditWorkoutData {
  workoutId: string;
  file?: File;
  note?: string;
  oldImageUrl: string;
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
   *
   * @param data - Check-in data including file, note, and optional date
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
        date: data.date,
      });
      console.log("Check-in successful!", {
        workoutId: result.workoutId,
        personalStreak: result.personalStreak,
        squadStreak: result.squadStreak,
        date: data.date || "today",
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

  /**
   * Handle workout edit
   * Updates workout note and/or image
   *
   * @param data - Edit data including workoutId, optional file, note, and oldImageUrl
   */
  async function handleEditWorkout(data: EditWorkoutData): Promise<void> {
    if (!appUserId.value) {
      throw new Error("Please login and select your profile first");
    }

    try {
      uploading.value = true;

      let imageUrl: string | undefined;

      // If new file provided, validate and upload
      if (data.file) {
        const validation = validateFile(data.file);
        if (!validation.valid) {
          throw new Error(validation.error);
        }

        console.log("Uploading new image...");
        imageUrl = await uploadWorkoutImage(
          data.file,
          appUserId.value,
          squadId
        );
        console.log("New image uploaded:", imageUrl);
      }

      // Execute edit workflow
      console.log("Executing edit workout workflow...");
      await executeEditWorkout({
        workoutId: data.workoutId,
        userId: appUserId.value,
        squadId,
        imageUrl,
        note: data.note,
        oldImageUrl: data.oldImageUrl,
      });
      console.log("Workout edited successfully!");

      // Wait for realtime update
      if (waitForUpdate) {
        console.log("Waiting for realtime update...");
        await waitForUpdate();
        console.log("Realtime update detected");
      }
    } finally {
      uploading.value = false;
    }
  }

  /**
   * Handle workout deletion
   * Deletes workout and recalculates streaks
   *
   * @param workoutId - ID of workout to delete
   */
  async function handleDeleteWorkout(workoutId: string): Promise<void> {
    if (!appUserId.value) {
      throw new Error("Please login and select your profile first");
    }

    try {
      uploading.value = true;

      // Execute delete workflow
      console.log("Executing delete workout workflow...");
      const result = await executeDeleteWorkout({
        workoutId,
        userId: appUserId.value,
        squadId,
      });
      console.log("Workout deleted successfully!", {
        personalStreak: result.personalStreak,
        squadStreak: result.squadStreak,
      });

      // Update streaks immediately using delete result (if callback provided)
      if (onStreakUpdate) {
        onStreakUpdate(result.personalStreak, result.squadStreak);
        console.log("Streaks updated immediately from delete result");
      }

      // Wait for realtime update
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
    handleEditWorkout,
    handleDeleteWorkout,
  };
}
