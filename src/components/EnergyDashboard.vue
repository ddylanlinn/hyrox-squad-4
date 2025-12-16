<template>
  <div class="flex flex-col items-center justify-center flex-1 py-4 relative">
    <!-- Power Ring -->
    <div class="relative w-64 h-64 flex items-center justify-center mb-8">
      <!-- Background Circle -->
      <svg class="absolute top-0 left-0 w-full h-full transform -rotate-90">
        <circle
          cx="50%"
          cy="50%"
          :r="radius"
          fill="transparent"
          stroke="#e4e4e7"
          stroke-width="12"
          stroke-linecap="round"
        />
        <!-- Progress Circle -->
        <circle
          class="ring-circle"
          cx="50%"
          cy="50%"
          :r="radius"
          fill="transparent"
          :stroke="percent === 100 ? '#84cc16' : '#22c55e'"
          stroke-width="12"
          stroke-linecap="round"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="offset"
          :style="{
            filter:
              percent === 100
                ? 'drop-shadow(0 0 8px rgba(132,204,22,0.5))'
                : 'none',
          }"
        />
      </svg>

      <!-- Center Stats -->
      <div class="z-10 text-center">
        <div
          class="text-6xl font-black text-zinc-900 tabular-nums tracking-tighter"
        >
          {{ percent }}<span class="text-3xl text-zinc-400">%</span>
        </div>
        <div
          class="text-zinc-400 text-sm uppercase tracking-widest font-bold mt-1"
        >
          Energy
        </div>
      </div>
    </div>

    <!-- Satellites (User Avatars) -->
    <div class="flex justify-center gap-4 w-full px-4">
      <button
        v-for="user in users"
        :key="user.id"
        :disabled="!getUserRecord(user.id)"
        :class="[
          'group relative flex items-center justify-center w-14 h-14 rounded-full border-2 transition-all duration-300',
          getUserRecord(user.id)
            ? 'border-lime-500 bg-white cursor-pointer hover:scale-105 shadow-[0_4px_12px_rgba(132,204,22,0.3)]'
            : 'border-zinc-200 bg-zinc-50 opacity-60',
        ]"
        @click="handleAvatarClick(user.id)"
      >
        <template v-if="getUserRecord(user.id)">
          <img
            :src="getUserRecord(user.id)?.imageUrl"
            :alt="user.name"
            class="w-full h-full object-cover rounded-full p-[2px]"
          />
          <div
            class="absolute -bottom-1 -right-1 bg-lime-500 text-white rounded-full p-0.5 border-2 border-white"
          >
            <Check :size="10" :stroke-width="4" />
          </div>
        </template>
        <span v-else class="text-zinc-400 font-bold text-sm">{{
          user.initials
        }}</span>

        <!-- Name Label -->
        <span
          :class="[
            'absolute -bottom-6 text-[10px] font-bold tracking-wide',
            getUserRecord(user.id) ? 'text-lime-600' : 'text-zinc-400',
          ]"
        >
          {{ user.name }}
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { Check } from "lucide-vue-next";
import type { User, WorkoutRecord } from "../types";

interface Props {
  users: User[];
  records: WorkoutRecord[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  "avatar-click": [record: WorkoutRecord];
}>();

const percent = ref(0);

// Calculate percentage based on 4 members
const completedCount = computed(() => props.records.length);
const targetPercent = computed(() => (completedCount.value / 4) * 100);

// SVG Config
const radius = 90;
const circumference = 2 * Math.PI * radius;
const offset = computed(
  () => circumference - (percent.value / 100) * circumference
);

// Animate percent on change
watch(targetPercent, (newPercent) => {
  setTimeout(() => {
    percent.value = newPercent;
  }, 100);
});

onMounted(() => {
  setTimeout(() => {
    percent.value = targetPercent.value;
  }, 100);
});

const getUserRecord = (userId: string) => {
  return props.records.find((r) => r.userId === userId);
};

const handleAvatarClick = (userId: string) => {
  const userRecord = getUserRecord(userId);
  if (userRecord) {
    emit("avatar-click", userRecord);
  }
};
</script>
