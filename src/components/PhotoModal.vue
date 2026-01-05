<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="isOpen && record && user" class="modal-overlay">
        <!-- Close Button -->
        <button @click="emit('close')" class="modal-close-button">
          <X :size="24" />
        </button>

        <div class="w-full h-full flex flex-col relative">
          <!-- Image Container -->
          <div class="flex-1 min-h-0 flex items-center justify-center p-4 overflow-hidden">
            <img
              :src="record.imageUrl"
              alt="Workout Proof"
              class="max-h-full max-w-full rounded-lg shadow-2xl object-contain"
            />
          </div>

          <!-- Info Overlay -->
          <div class="modal-info-overlay">
            <div class="flex items-center gap-3 mb-2">
              <div class="modal-avatar">
                {{ user.initials }}
              </div>
              <div>
                <h3 class="text-white font-bold text-xl">{{ user.name }}</h3>
                <div class="flex items-center text-zinc-400 text-xs gap-1">
                  <Clock :size="12" />
                  <span>{{ formatTime(record.completedAt) }}</span>
                </div>
              </div>
            </div>

            <div v-if="record.note" class="modal-quote">
              <div class="flex gap-2">
                <Quote :size="16" class="modal-quote-icon" />
                <p class="modal-quote-text">"{{ record.note }}"</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { X, Clock, Quote } from "lucide-vue-next";
import type { User, WorkoutRecord } from "../types";

interface Props {
  isOpen: boolean;
  record: WorkoutRecord | null;
  user: User | undefined;
}

defineProps<Props>();

const emit = defineEmits<{
  close: [];
}>();

const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};
</script>

<style scoped>
/* ========== Modal Overlay ========== */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-modal-overlay);
  backdrop-filter: blur(12px);
  height: 100vh; /* fallback */
  height: 100dvh; /* dynamic viewport height for mobile */
}

/* ========== Close Button ========== */
.modal-close-button {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 10;
  padding: 0.5rem;
  background-color: rgba(39, 39, 42, 0.5);
  border-radius: 9999px;
  color: white;
  backdrop-filter: blur(4px);
}

/* ========== Info Overlay ========== */
.modal-info-overlay {
  background: linear-gradient(to top, black, rgba(0, 0, 0, 0.8), transparent);
  padding-top: 3rem;
  padding-bottom: 2.5rem;
  padding-left: 1.5rem;
  padding-right: 1.5rem;
}

/* ========== Avatar ========== */
.modal-avatar {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 9999px;
  background-color: var(--color-modal-avatar-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: black;
  font-weight: 700;
}

/* ========== Quote Box ========== */
.modal-quote {
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: rgba(39, 39, 42, 0.5);
  border-radius: 0.5rem;
  border-left: 4px solid var(--color-modal-quote-border);
  backdrop-filter: blur(4px);
}

.modal-quote-icon {
  color: var(--color-modal-quote-icon);
  flex-shrink: 0;
}

.modal-quote-text {
  color: #e4e4e7; /* zinc-200 */
  font-size: 0.875rem;
  font-style: italic;
}

/* ========== Fade Transition ========== */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
