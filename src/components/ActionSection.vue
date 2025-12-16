<template>
  <div
    class="w-full px-5 pb-8 pt-4 bg-gradient-to-t from-white via-white to-transparent"
  >
    <!-- WOD Card -->
    <div class="action-card rounded-2xl p-5 mb-6 relative group">
      <template v-if="!isEditing">
        <div
          class="absolute top-4 right-4 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
        >
          <button @click="isEditing = true" class="edit-button">
            <Pencil :size="16" />
          </button>
        </div>
        <div class="flex items-center gap-4">
          <div class="action-icon-bg">
            <Dumbbell :size="24" />
          </div>
          <div>
            <h3 class="text-primary font-bold text-lg leading-tight pr-8">
              {{ mission.title }}
            </h3>
          </div>
        </div>
      </template>
      <div v-else class="flex flex-col gap-3">
        <div class="flex justify-between items-center mb-1">
          <span class="text-xs font-bold text-tertiary uppercase"
            >Edit Workout</span
          >
          <button @click="handleSave" class="save-button">Save</button>
        </div>
        <input
          type="text"
          v-model="editContent"
          class="input-content"
          placeholder="Today's Workout (e.g., 5k Run + 100 Burpees)"
        />
      </div>
    </div>

    <!-- Main Action Button -->
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
        @click="fileInputRef?.click()"
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
import { ref, watch } from "vue";
import {
  Camera,
  Copy,
  Dumbbell,
  Loader2,
  Check,
  Pencil,
  Save,
} from "lucide-vue-next";
import type { Mission } from "../types";

interface Props {
  mission: Mission;
  isCompleted: boolean;
  completedCount: number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "check-in": [file: File];
  "update-mission": [mission: Mission];
}>();

const fileInputRef = ref<HTMLInputElement | null>(null);
const loading = ref(false);
const copied = ref(false);

// Edit State
const isEditing = ref(false);
const editContent = ref(props.mission.title);

// Watch for mission changes to update edit state
watch(
  () => props.mission,
  (newMission) => {
    editContent.value = newMission.title;
  }
);

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    loading.value = true;
    setTimeout(() => {
      emit("check-in", target.files![0]);
      loading.value = false;
    }, 1500);
  }
};

const handleNudge = () => {
  const messages = [
    "Wake up squad! Only I have trained today? 😤",
    "Let's go team! Don't break the streak! 🔥",
    "Training done. Who's next? ⚡️",
    "Hyrox waits for no one. Get it done! 🏋️",
  ];
  const msg =
    props.completedCount === 4
      ? "Squad goal achieved! 💪"
      : messages[Math.floor(Math.random() * messages.length)];

  navigator.clipboard.writeText(`${props.mission.title}\n\n${msg}`);
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 2000);
};

const handleSave = () => {
  emit("update-mission", {
    title: editContent.value,
    description: "",
  });
  isEditing.value = false;
};
</script>

<style scoped>
/* ========== Card Styles ========== */
.action-card {
  background-color: var(--color-action-card-bg);
  border: 1px solid var(--color-action-card-border);
  box-shadow: var(--shadow-card);
}

/* ========== Edit Button ========== */
.edit-button {
  padding: 0.5rem;
  color: var(--color-text-tertiary);
  border-radius: 9999px;
  transition: all 0.2s;
}

.edit-button:hover {
  color: var(--color-neutral-600);
  background-color: var(--color-neutral-50);
}

/* ========== Icon Background ========== */
.action-icon-bg {
  padding: 0.75rem;
  background-color: var(--color-action-icon-bg);
  border-radius: 0.75rem;
  color: var(--color-action-icon-text);
  flex-shrink: 0;
}

/* ========== Save Button ========== */
.save-button {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 700;
  background-color: var(--color-action-button-bg);
  color: var(--color-action-button-text);
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
}

/* ========== Input Styles ========== */
.input-content {
  width: 100%;
  font-weight: 700;
  font-size: 1.125rem;
  border-bottom: 1px solid var(--color-border);
  outline: none;
  padding: 0.25rem 0;
  background-color: transparent;
  color: var(--color-text-primary);
}

.input-content::placeholder {
  color: var(--color-neutral-300);
}

.input-content:focus {
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
