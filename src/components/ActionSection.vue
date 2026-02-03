<template>
  <div
    class="w-full px-5 pb-8 pt-4 bg-gradient-to-t from-white via-white to-transparent"
  >
    <!-- Main Action Section -->
    <div v-if="!isCompleted" class="sticky bottom-6">
      <input
        ref="fileInputRef"
        type="file"
        accept="image/*"
        class="hidden"
        @change="handleFileChange"
      />
      <button
        @click="openModal()"
        :disabled="uploading"
        class="checkin-button"
      >
        <template v-if="uploading">
          <Loader2 class="uploading-spinner" /> Uploading...
        </template>
        <template v-else>
          <Camera :size="24" />
          CHECK-IN
        </template>
      </button>
    </div>
    <div v-else class="sticky bottom-6 flex flex-col items-center">
      <button
        @click="handleNudge"
        :class="[
          'nudge-button mb-3',
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
      
      <button 
        @click="openModal()" 
        class="text-tertiary text-xs font-bold uppercase tracking-widest hover:text-primary transition-colors flex items-center gap-1"
      >
        <Camera :size="14" /> Add Past Workout
      </button>

      <p class="text-center text-tertiary text-[10px] mt-2 font-medium">
        Great work! Now motivate the others.
      </p>
    </div>

    <!-- Check-in Modal -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-container">
          <button class="modal-close" @click="closeModal">
            <X :size="24" />
          </button>

          <h2 class="modal-title">Ready to check in?</h2>

          <!-- Note Input Card (Moved from main UI) -->
          <div class="note-card rounded-2xl p-5 mb-4">
            <label class="block text-xs font-bold text-tertiary uppercase mb-3">
              Today's Workout
            </label>
            <input
              v-model="noteContent"
              type="text"
              class="note-input"
              :placeholder="WORKOUT_PLACEHOLDER"
              @keyup.enter="handleConfirm"
            />
          </div>

          <!-- Workout Date (Only shown for past check-ins) -->
          <div v-if="enablePastDate" class="past-date-section mb-8">
            <label class="block text-xs font-bold text-tertiary uppercase mb-3">
              Workout Date
            </label>
            <div class="past-date-picker">
              <input
                v-model="selectedDate"
                type="date"
                :max="getTodayString()"
                class="date-input"
              />
            </div>
          </div>

          <button @click="handleConfirm" class="checkin-button">
            <Camera :size="24" />
            SELECT PHOTO & GO
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { Camera, Copy, Loader2, Check, X } from "lucide-vue-next";
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
  uploading: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "check-in": [data: { file: File; note: string; date?: string }];
}>();

const fileInputRef = ref<HTMLInputElement | null>(null);

const copied = ref(false);
const noteContent = ref("");
const showModal = ref(false);
const enablePastDate = ref(false);
const selectedDate = ref("");

const getTodayString = (): string => {
  return new Date().toISOString().split("T")[0];
};

const openModal = (date?: string) => {
  showModal.value = true;
  if (date) {
    enablePastDate.value = true;
    selectedDate.value = date;
  } else if (props.isCompleted) {
    // If today is done, "Add Past Workout" button sets context to past date
    enablePastDate.value = true;
    selectedDate.value = getTodayString();
  } else {
    // Default today check-in
    enablePastDate.value = false;
  }
};

const closeModal = () => {
  showModal.value = false;
  enablePastDate.value = false;
  selectedDate.value = "";
};

defineExpose({
  openModal,
});

const handleConfirm = () => {
  fileInputRef.value?.click();
};

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    emit("check-in", {
      file: target.files[0],
      note: noteContent.value || DEFAULT_WORKOUT_NOTE,
      date: enablePastDate.value && selectedDate.value ? selectedDate.value : undefined,
    });
    // Clear state
    noteContent.value = "";
    showModal.value = false;
    enablePastDate.value = false;
    selectedDate.value = "";
    // Clear file input
    target.value = "";
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
  transition: transform 0.2s, opacity 0.2s;
}

.checkin-button:active:not(:disabled) {
  transform: scale(0.95);
}

.checkin-button:disabled {
  cursor: not-allowed;
  opacity: 0.85;
}

/* Uploading spinner animation */
.uploading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
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

/* ========== Modals ========== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 1.25rem;
  backdrop-filter: blur(4px);
}

.modal-container {
  background-color: white;
  width: 100%;
  max-width: 24rem;
  border-radius: 1.5rem;
  padding: 2rem 1.5rem;
  position: relative;
  box-shadow: var(--shadow-2xl);
  animation: modal-in 0.3s ease-out;
}

@keyframes modal-in {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  color: var(--color-text-tertiary);
  background: transparent;
  border-radius: 50%;
  padding: 0.25rem;
  transition: background-color 0.2s;
}

.modal-close:hover {
  background-color: var(--color-neutral-100);
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 900;
  color: var(--color-text-primary);
  margin-bottom: 1.5rem;
  text-align: center;
  letter-spacing: -0.025em;
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

/* ========== Past Date Section ========== */
.past-date-section {
  border-top: 1px solid var(--color-border);
  padding-top: 1rem;
}

.past-date-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.past-date-checkbox {
  width: 1.125rem;
  height: 1.125rem;
  cursor: pointer;
}

.past-date-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.past-date-picker {
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.date-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid var(--color-border);
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  color: var(--color-text-primary);
  background-color: white;
  transition: border-color 0.2s;
}

.date-input:focus {
  outline: none;
  border-color: var(--color-action-input-focus);
}
</style>
