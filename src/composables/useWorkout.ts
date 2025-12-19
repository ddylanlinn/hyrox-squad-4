import { ref, type Ref } from "vue";
import { executeCheckIn } from "../services/firestore";
import { uploadWorkoutImage, validateFile } from "../services/storage";

interface UseWorkoutOptions {
  appUserId: Ref<string | null>;
  squadId: string;
}

interface CheckInData {
  file: File;
  note: string;
}

/**
 * Composable for managing workout check-in operations
 */
export function useWorkout({ appUserId, squadId }: UseWorkoutOptions) {
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

      // Note: Realtime listener will auto-update UI, no manual update needed
    } finally {
      uploading.value = false;
    }
  }

  return {
    uploading,
    handleCheckIn,
  };
}
