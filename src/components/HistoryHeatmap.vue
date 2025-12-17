<template>
  <div class="w-full px-5 pt-8 pb-4">
    <!-- Top Section: Countdown & Streak -->
    <div class="flex justify-between items-start mb-6 gap-4">
      <!-- Race Countdown -->
      <div class="flex-1">
        <h2
          class="text-secondary text-xs font-bold uppercase tracking-widest mb-1"
        >
          Race Countdown
        </h2>
        <div class="flex items-baseline gap-2">
          <span
            class="text-5xl font-black text-primary tracking-tighter leading-none"
            >{{ daysUntilRace }}</span
          >
          <span class="text-secondary font-medium text-base">Days</span>
        </div>
        <p class="text-xs text-tertiary mt-1">
          Until HYROX {{ COMPETITION_DATE.replace(/-/g, "/") }}
        </p>
      </div>

      <!-- Current Streak -->
      <div class="flex-1 text-right">
        <h2
          class="text-secondary text-xs font-bold uppercase tracking-widest mb-1"
        >
          Current Streak
        </h2>
        <div class="flex items-baseline gap-2 justify-end">
          <Flame
            :size="20"
            :class="streak > 0 ? 'streak-active' : 'streak-inactive'"
          />
          <span
            class="text-5xl font-black text-primary tracking-tighter leading-none"
            >{{ streak }}</span
          >
          <span class="text-secondary font-medium text-base">Days</span>
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
import { computed } from "vue";
import { Flame, Zap } from "lucide-vue-next";
import type { DailyStats } from "../types";
import { COMPETITION_DATE, HEATMAP_DAYS_COUNT } from "../constants";

interface Props {
  history: DailyStats[];
  todayCount: number;
  streak: number;
}

const props = defineProps<Props>();

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

  // Generate days: from D-(HEATMAP_DAYS_COUNT-1) to D-1
  for (let i = HEATMAP_DAYS_COUNT - 1; i >= 1; i--) {
    const d = new Date(raceDay);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];

    // Find matching history data or create empty
    const existingDay = props.history.find((h) => h.date === dateStr);
    result.push(
      existingDay || {
        date: dateStr,
        count: 0,
        records: [],
      }
    );
  }

  // Add race day itself as the last item (D-0)
  result.push({
    date: new Date(COMPETITION_DATE).toISOString().split("T")[0],
    count: 0,
    records: [],
  });

  return result;
});

// Check if a date is today
const isToday = (dateStr: string): boolean => {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  return dateStr === todayStr;
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
