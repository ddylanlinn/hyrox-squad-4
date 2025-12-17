<template>
  <div
    class="w-full px-5 pb-8 pt-4 bg-gradient-to-t from-white via-white to-transparent"
  >
    <!-- Note Input Card -->
    <div v-if="!isCompleted" class="note-card rounded-2xl p-5 mb-6">
      <label class="block text-xs font-bold text-tertiary uppercase mb-3">
        Today's Workout
      </label>
      <input
        v-model="noteContent"
        type="text"
        class="note-input"
        :placeholder="WORKOUT_PLACEHOLDER"
      />
    </div>
    <!-- Main Action Section -->
    <div v-if="!isCompleted" class="sticky bottom-6">
      <input
        ref="fileInputRef"
        type="file"
        accept="image/*"
        capture="environment"
        class="hidden"
        @change="handleFileChange"
      />
      <button
        @click="handleCheckInClick"
        :disabled="loading"
        class="checkin-button"
      >
        <template v-if="loading">
          <Loader2 class="animate-spin" /> Uploading...
        </template>
        <template v-else>
          <Camera :size="24" />
          CHECK-IN
        </template>
      </button>
    </div>
    <div v-else class="sticky bottom-6">
      <button
        @click="handleNudge"
        :class="[
          'nudge-button',
          copied ? 'nudge-button-copied' : 'nudge-button-default',
        ]"
      >
        <template v-if="copied">
          <Check :size="24" />
          COPIED!
        </template>
        <template v-else>
          <Copy :size="24" />
          NUDGE SQUAD
        </template>
      </button>
      <p class="text-center text-tertiary text-xs mt-3 font-medium">
        Great work! Now motivate the others.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { Camera, Copy, Loader2, Check } from "lucide-vue-next";
import {
  NUDGE_MESSAGES,
  DEFAULT_WORKOUT_NOTE,
  SQUAD_GOAL_ACHIEVED_MESSAGE,
  WORKOUT_PLACEHOLDER,
  SQUAD_MEMBER_COUNT,
} from "../constants";

interface Props {
  isCompleted: boolean;
  completedCount: number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "check-in": [data: { file: File; note: string }];
}>();

const fileInputRef = ref<HTMLInputElement | null>(null);
const loading = ref(false);
const copied = ref(false);
const noteContent = ref("");

const handleCheckInClick = () => {
  const confirmMessage = noteContent.value
    ? `Ready to check in?\n\nWorkout: ${noteContent.value}`
    : `Ready to check in?\n\n(Tip: Add your workout details above)`;

  if (confirm(confirmMessage)) {
    fileInputRef.value?.click();
  }
};

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    loading.value = true;
    setTimeout(() => {
      emit("check-in", {
        file: target.files![0],
        note: noteContent.value || DEFAULT_WORKOUT_NOTE,
      });
      loading.value = false;
      // Clear note after successful check-in
      noteContent.value = "";
    }, 1500);
  }
};

const handleNudge = () => {
  const msg =
    props.completedCount === SQUAD_MEMBER_COUNT
      ? SQUAD_GOAL_ACHIEVED_MESSAGE
      : NUDGE_MESSAGES[Math.floor(Math.random() * NUDGE_MESSAGES.length)];

  navigator.clipboard.writeText(`Daily Training Check-in\n\n${msg}`);
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 2000);
};
</script>

<style scoped>
/* ========== Note Card ========== */
.note-card {
  background-color: var(--color-action-card-bg);
  border: 1px solid var(--color-action-card-border);
  box-shadow: var(--shadow-card);
}

.note-input {
  width: 100%;
  font-weight: 600;
  font-size: 1rem;
  border-bottom: 2px solid var(--color-border);
  outline: none;
  padding: 0.5rem 0;
  background-color: transparent;
  color: var(--color-text-primary);
  transition: border-color 0.2s;
}

.note-input::placeholder {
  color: var(--color-neutral-300);
  font-weight: 400;
}

.note-input:focus {
  border-bottom-color: var(--color-action-input-focus);
}

/* ========== Check-in Button ========== */
.checkin-button {
  width: 100%;
  background-color: var(--color-action-button-bg);
  color: var(--color-action-button-text);
  font-weight: 700;
  font-size: 1.125rem;
  padding: 1rem 0;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  box-shadow: var(--shadow-button);
  transition: transform 0.2s;
}

.checkin-button:active {
  transform: scale(0.95);
}

/* ========== Nudge Button ========== */
.nudge-button {
  width: 100%;
  font-weight: 700;
  font-size: 1.125rem;
  padding: 1rem 0;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  transition: all 0.2s;
  border: 1px solid;
}

.nudge-button:active {
  transform: scale(0.95);
}

.nudge-button-copied {
  background-color: var(--color-action-button-success-bg);
  color: var(--color-action-button-success-text);
  border-color: var(--color-action-button-success-bg);
  box-shadow: var(--shadow-glow-primary);
}

.nudge-button-default {
  background-color: white;
  color: var(--color-text-primary);
  border-color: var(--color-border);
  box-shadow: var(--shadow-lg);
}

/* ========== Text Colors ========== */
.text-primary {
  color: var(--color-text-primary);
}

.text-secondary {
  color: var(--color-text-secondary);
}

.text-tertiary {
  color: var(--color-text-tertiary);
}
</style>
