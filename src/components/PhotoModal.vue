<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isOpen && record && user"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md"
      >
        <!-- Close Button -->
        <button
          @click="emit('close')"
          class="absolute top-6 right-6 z-10 p-2 bg-zinc-800/50 rounded-full text-white backdrop-blur-sm"
        >
          <X :size="24" />
        </button>

        <div class="w-full h-full flex flex-col relative">
          <!-- Image Container -->
          <div class="flex-1 flex items-center justify-center p-4">
            <img
              :src="record.imageUrl"
              alt="Workout Proof"
              class="max-h-full max-w-full rounded-lg shadow-2xl object-contain"
            />
          </div>

          <!-- Info Overlay -->
          <div
            class="bg-gradient-to-t from-black via-black/80 to-transparent pt-12 pb-10 px-6"
          >
            <div class="flex items-center gap-3 mb-2">
              <div
                class="w-10 h-10 rounded-full bg-lime-400 flex items-center justify-center text-black font-bold"
              >
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

            <div
              v-if="record.note"
              class="mt-4 p-3 bg-zinc-800/50 rounded-lg border-l-4 border-lime-400 backdrop-blur-sm"
            >
              <div class="flex gap-2">
                <Quote :size="16" class="text-lime-400 shrink-0" />
                <p class="text-zinc-200 text-sm italic">"{{ record.note }}"</p>
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
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
