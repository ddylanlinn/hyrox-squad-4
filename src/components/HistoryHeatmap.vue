<template>
  <div class="w-full px-5 pt-8">
    <!-- Top Section: Countdown & Streak -->
    <div class="flex justify-between items-center mb-6 gap-2">
      <!-- Race Countdown (Left) -->
      <div class="flex-1 flex flex-col items-start min-w-0 relative">
        <div class="flex items-center gap-1 mb-1">
          <h2
            class="text-secondary text-[10px] font-bold uppercase tracking-widest whitespace-nowrap"
          >
            Countdown
          </h2>
          <button
            @click="showTooltip = !showTooltip"
            class="text-tertiary hover:text-secondary transition-colors"
          >
            <Info :size="12" />
          </button>
        </div>

        <div class="flex items-baseline gap-1">
          <span
            class="text-4xl font-black text-primary tracking-tighter leading-none"
            >{{ daysUntilRace }}</span
          >
          <span class="text-secondary font-medium text-xs">Days</span>
        </div>

        <!-- Tooltip -->
        <div
          v-if="showTooltip"
          v-click-away="() => (showTooltip = false)"
          class="absolute top-6 left-0 z-20 bg-white border border-border rounded-md shadow-lg p-2 whitespace-nowrap animate-in fade-in zoom-in duration-200"
        >
          <p class="text-[10px] font-bold text-primary">
            HYROX Taipei {{ COMPETITION_DATE.replace(/-/g, "/") }}
          </p>
        </div>
      </div>

      <!-- Squad Streak (Middle) -->
      <div class="flex-1 flex flex-col items-center min-w-0 px-2 relative">
        <div class="flex items-center gap-1 mb-1">
          <h2
            class="text-secondary text-[10px] font-bold uppercase tracking-widest whitespace-nowrap"
          >
            Streak
          </h2>
          <button
            @click="showStreakTooltip = !showStreakTooltip"
            class="text-tertiary hover:text-secondary transition-colors"
          >
            <Info :size="12" />
          </button>
        </div>
        <div
          class="flex items-baseline gap-1.5 px-3 py-1 rounded-full transition-all duration-500"
        >
          <Flame
            :size="24"
            :class="streak > 0 ? 'streak-active' : 'streak-inactive'"
          />
          <span
            class="text-5xl font-black text-primary tracking-tighter leading-none"
            >{{ streak }}</span
          >
          <span class="text-secondary font-medium text-xs">Days</span>
        </div>

        <!-- Streak Tooltip -->
        <div
          v-if="showStreakTooltip"
          v-click-away="() => (showStreakTooltip = false)"
          class="absolute top-6 left-1/2 -translate-x-1/2 z-20 bg-white border border-border rounded-md shadow-lg p-2 whitespace-nowrap animate-in fade-in zoom-in duration-200"
        >
          <p class="text-[10px] font-bold text-primary">
            Days in a row the squad trained
          </p>
        </div>
      </div>

      <!-- Personal Streak (Right) -->
      <div class="flex-1 flex flex-col items-end min-w-0 relative">
        <div class="flex items-center gap-1 mb-1">
          <h2
            class="text-secondary text-[10px] font-bold uppercase tracking-widest whitespace-nowrap"
          >
            P. Streak
          </h2>
          <button
            @click="showPersonalStreakTooltip = !showPersonalStreakTooltip"
            class="text-tertiary hover:text-secondary transition-colors"
          >
            <Info :size="12" />
          </button>
        </div>
        <div class="flex items-baseline gap-1">
          <Flame
            :size="16"
            :class="personalStreak > 0 ? 'streak-active' : 'streak-inactive'"
          />
          <span
            class="text-4xl font-black text-primary tracking-tighter leading-none"
            >{{ personalStreak }}</span
          >
          <span class="text-secondary font-medium text-xs">Days</span>
        </div>

        <!-- Personal Streak Tooltip -->
        <div
          v-if="showPersonalStreakTooltip"
          v-click-away="() => (showPersonalStreakTooltip = false)"
          class="absolute top-6 right-0 z-20 bg-white border border-border rounded-md shadow-lg p-2 whitespace-nowrap animate-in fade-in zoom-in duration-200"
        >
          <p class="text-[10px] font-bold text-primary">
            Your daily check-in streak
          </p>
        </div>
      </div>
    </div>

    <!-- Grid: 80 days countdown to race day (D-79 to D-0) -->
    <div class="w-full">
      <div class="grid grid-cols-16 gap-0.5 w-full">
        <div
          v-for="(day, index) in displayHistory"
          :key="day.date"
          :class="[
            'aspect-square rounded-sm transition-all duration-300 hover:scale-110 hover:z-10 hover:shadow-md relative',
            getColorClass(day.count),
            isToday(day.date) ? 'today-ring' : '',
          ]"
        >
          <div
            v-show="index === displayHistory.length - 1"
            class="absolute inset-0 flex items-center justify-center"
          >
            <Zap :size="16" class="race-icon" fill="currentColor" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { Flame, Zap, Info } from "lucide-vue-next";
import type { DailyStats } from "../types";
import { COMPETITION_DATE, HEATMAP_DAYS_COUNT } from "../constants";
import { getTodayString, toLocalDateString } from "../services/firestore";

interface Props {
  history: DailyStats[];
  todayCount: number;
  streak: number;
  personalStreak: number;
}

const props = defineProps<Props>();

const showTooltip = ref(false);
const showStreakTooltip = ref(false);
const showPersonalStreakTooltip = ref(false);

// Calculate days until race
const daysUntilRace = computed(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const raceDay = new Date(COMPETITION_DATE);
  raceDay.setHours(0, 0, 0, 0);
  const diff = raceDay.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// Generate history ending at race day
const displayHistory = computed(() => {
  const result: DailyStats[] = [];
  const raceDay = new Date(COMPETITION_DATE);
  const todayString = getTodayString();

  // Generate days: from D-(HEATMAP_DAYS_COUNT-1) to D-0 (race day)
  for (let i = HEATMAP_DAYS_COUNT - 1; i >= 0; i--) {
    const d = new Date(raceDay);
    d.setDate(d.getDate() - i);
    const dateStr = toLocalDateString(d);

    // Find matching history data
    const existingDay = props.history.find((h) => h.date === dateStr);

    if (existingDay) {
      result.push(existingDay);
    } else {
      // Create empty day, but use todayCount if it's today
      result.push({
        date: dateStr,
        count: dateStr === todayString ? props.todayCount : 0,
        records: [],
      });
    }
  }

  return result;
});

// Check if a date is today
const isToday = (dateStr: string): boolean => {
  return dateStr === getTodayString();
};

const getColorClass = (count: number): string => {
  switch (count) {
    case 0:
      return "heatmap-empty";
    case 1:
      return "heatmap-level-1";
    case 2:
      return "heatmap-level-2";
    case 3:
      return "heatmap-level-3";
    case 4:
      return "heatmap-level-4";
    default:
      return "heatmap-empty";
  }
};
</script>

<style scoped>
/* ========== Heatmap Colors ========== */
.heatmap-empty {
  background-color: var(--color-heatmap-empty);
}

.heatmap-level-1 {
  background-color: var(--color-heatmap-level-1);
}

.heatmap-level-2 {
  background-color: var(--color-heatmap-level-2);
}

.heatmap-level-3 {
  background-color: var(--color-heatmap-level-3);
}

.heatmap-level-4 {
  background-color: var(--color-heatmap-level-4);
}

/* ========== Today's Date Ring ========== */
.today-ring {
  box-shadow: 0 0 0 1px white, 0 0 0 3px var(--color-heatmap-today-ring);
}

/* ========== Race Day Icon ========== */
.race-icon {
  color: var(--color-heatmap-race-icon);
}

/* ========== Streak Colors ========== */
.streak-active {
  color: var(--color-streak-active);
  fill: var(--color-streak-active);
}

.streak-inactive {
  color: var(--color-streak-inactive);
}

.streak-bg-active {
  background: rgba(234, 88, 12, 0.08); /* Flame orange with low opacity */
  box-shadow: 0 0 20px rgba(234, 88, 12, 0.1);
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
