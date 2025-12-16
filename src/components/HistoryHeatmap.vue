<template>
  <div class="w-full px-5 pt-8 pb-4">
    <!-- Top Section: Streak -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h2
          class="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1"
        >
          Current Streak
        </h2>
        <div class="flex items-baseline gap-2">
          <span
            class="text-6xl font-black text-zinc-900 tracking-tighter leading-none"
            >{{ streak }}</span
          >
          <span class="text-zinc-500 font-medium text-lg">Days</span>
        </div>
      </div>
      <div
        :class="[
          'p-4 rounded-full',
          streak > 0
            ? 'bg-orange-100 text-orange-500'
            : 'bg-gray-100 text-gray-400',
        ]"
      >
        <Flame :size="32" :class="streak > 0 ? 'fill-orange-500' : ''" />
      </div>
    </div>

    <!-- Grid: Last 70 days. Using grid-cols-10 for a denser look. -->
    <div class="w-full">
      <div class="grid grid-cols-10 gap-1.5 w-full">
        <div
          v-for="day in history.slice(-70)"
          :key="day.date"
          :class="[
            'aspect-square rounded-sm transition-all duration-300 hover:scale-125 hover:z-10 hover:shadow-md',
            getColorClass(day.count),
          ]"
          :title="`${day.date}: ${day.count} squad members`"
        />
      </div>

      <div class="flex justify-between mt-2 px-1">
        <span class="text-[10px] text-zinc-400 font-medium">10 weeks ago</span>
        <span class="text-[10px] text-zinc-400 font-medium">Today</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Flame } from "lucide-vue-next";
import type { DailyStats } from "../types";

interface Props {
  history: DailyStats[];
  todayCount: number;
  streak: number;
}

defineProps<Props>();

const getColorClass = (count: number): string => {
  switch (count) {
    case 0:
      return "bg-gray-200";
    case 1:
      return "bg-green-200";
    case 2:
      return "bg-green-400";
    case 3:
      return "bg-green-600";
    case 4:
      return "bg-lime-500 shadow-[0_0_8px_rgba(132,204,22,0.6)]"; // Neon glow
    default:
      return "bg-gray-200";
  }
};
</script>
