<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="isOpen && record && user" class="modal-overlay">
        <div class="modal-container">
          <!-- Header with Close Button -->
          <div class="modal-header">
            <button @click="emit('close')" class="modal-close-button">
              <X :size="24" />
            </button>
          </div>

          <!-- Image Container -->
          <div class="modal-image-container">
            <img
              :src="record.imageUrl"
              alt="Workout Proof"
              class="modal-image"
            />
          </div>

          <!-- Info Overlay -->
          <div class="modal-info-overlay">
            <div class="modal-user-info">
              <div class="modal-avatar">
                <img
                  v-if="user.avatarUrl"
                  :src="user.avatarUrl"
                  :alt="user.name"
                  class="modal-avatar-img"
                />
                <span v-else>{{ user.initials }}</span>
              </div>
              <div>
                <h3 class="modal-user-name">{{ user.name }}</h3>
                <div class="modal-time">
                  <Clock :size="12" />
                  <span>{{ formatTime(record.completedAt) }}</span>
                </div>
              </div>
            </div>

            <div v-if="record.note" class="modal-quote">
              <div class="modal-quote-content">
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
  return new Date(dateString).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
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
  height: 100vh;
  height: 100dvh;
}

.modal-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* ========== Header ========== */
.modal-header {
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  padding: 1rem 1rem 0.5rem;
}

.modal-close-button {
  padding: 0.5rem;
  background-color: rgba(39, 39, 42, 0.5);
  border-radius: 9999px;
  color: white;
  backdrop-filter: blur(4px);
}

/* ========== Image Container ========== */
.modal-image-container {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 1rem;
}

.modal-image {
  max-height: 100%;
  max-width: 100%;
  border-radius: 0.5rem;
  box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);
  object-fit: contain;
}

/* ========== Info Overlay ========== */
.modal-info-overlay {
  flex-shrink: 0;
  background: linear-gradient(to top, black, rgba(0, 0, 0, 0.8), transparent);
  padding: 3rem 1.5rem 2.5rem;
}

.modal-user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.modal-user-name {
  color: white;
  font-weight: 700;
  font-size: 1.25rem;
}

.modal-time {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #a1a1aa;
  font-size: 0.75rem;
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
  overflow: hidden;
}

.modal-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
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

.modal-quote-content {
  display: flex;
  gap: 0.5rem;
}

.modal-quote-icon {
  color: var(--color-modal-quote-icon);
  flex-shrink: 0;
}

.modal-quote-text {
  color: #e4e4e7;
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
