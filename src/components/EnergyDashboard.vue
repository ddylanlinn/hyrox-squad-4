<template>
  <div class="flex flex-col items-center justify-center flex-1 relative">
    <!-- Power Ring -->
    <div class="relative w-64 h-56 flex items-center justify-center mb-8">
      <!-- Background Circle -->
      <svg class="absolute top-0 left-0 w-full h-full transform -rotate-90">
        <circle
          cx="50%"
          cy="50%"
          :r="radius"
          fill="transparent"
          class="energy-ring-bg"
          stroke-width="12"
          stroke-linecap="round"
        />
        <!-- Progress Circle -->
        <circle
          class="ring-circle energy-ring-progress"
          cx="50%"
          cy="50%"
          :r="radius"
          fill="transparent"
          stroke-width="12"
          stroke-linecap="round"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="offset"
          :class="{ 'energy-complete': percent === 100 }"
        />
      </svg>

      <div class="z-10 text-center">
        <div
          class="text-6xl font-black text-primary tabular-nums tracking-tighter"
        >
          {{ percent }}<span class="text-3xl text-tertiary"> %</span>
        </div>
        <div
          class="text-tertiary text-sm uppercase tracking-widest font-bold mt-1"
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
          getUserRecord(user.id) ? 'avatar-active' : 'avatar-inactive',
        ]"
        @click="handleAvatarClick(user.id)"
      >
        <template v-if="getUserRecord(user.id)">
          <img
            :src="getUserRecord(user.id)?.imageUrl"
            :alt="user.name"
            class="w-full h-full object-cover rounded-full p-[2px]"
          />
          <div class="avatar-check-badge">
            <Check :size="10" :stroke-width="4" />
          </div>
        </template>
        <span v-else class="text-tertiary font-bold text-sm">{{
          user.initials
        }}</span>

        <!-- Name Label -->
        <span
          :class="[
            'absolute -bottom-6 text-[10px] font-bold tracking-wide',
            getUserRecord(user.id)
              ? 'avatar-name-active'
              : 'avatar-name-inactive',
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
import { SQUAD_MEMBER_COUNT } from "../constants";

interface Props {
  users: User[];
  records: WorkoutRecord[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  "avatar-click": [record: WorkoutRecord];
}>();

const percent = ref(0);

// Calculate percentage based on squad member count
const completedCount = computed(() => props.records.length);
const targetPercent = computed(
  () => (completedCount.value / SQUAD_MEMBER_COUNT) * 100
);

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

<style scoped>
/* ========== Energy Ring Colors ========== */
.energy-ring-bg {
  stroke: var(--color-energy-ring-bg);
}

.energy-ring-progress {
  stroke: var(--color-energy-ring-progress);
}

.energy-complete {
  stroke: var(--color-primary-500);
  filter: drop-shadow(0 0 8px rgba(132, 204, 22, 0.5));
}

/* ========== Avatar States ========== */
.avatar-active {
  border-color: var(--color-primary-500);
  background-color: white;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(132, 204, 22, 0.3);
}

.avatar-active:hover {
  transform: scale(1.05);
}

.avatar-inactive {
  border-color: var(--color-border);
  background-color: var(--color-neutral-50);
  opacity: 0.6;
}

.avatar-check-badge {
  position: absolute;
  bottom: -0.25rem;
  right: -0.25rem;
  background-color: var(--color-primary-500);
  color: white;
  border-radius: 9999px;
  padding: 0.125rem;
  border: 2px solid white;
}

.avatar-name-active {
  color: var(--color-primary-600);
}

.avatar-name-inactive {
  color: var(--color-text-tertiary);
}

/* ========== Text Colors ========== */
.text-primary {
  color: var(--color-text-primary);
}

.text-tertiary {
  color: var(--color-text-tertiary);
}
</style>
