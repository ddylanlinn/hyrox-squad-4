<template>
  <!-- RUN: Minimal transition zone -->
  <div
    v-if="item.type === StationType.RUN"
    class="h-8 bg-zinc-50 flex items-center justify-center"
  >
    <div class="flex items-center space-x-2 opacity-40">
      <component :is="getIcon(item.icon)" :size="10" class="text-zinc-400" />
      <span
        class="text-[10px] font-medium text-zinc-400 tracking-[0.15em] uppercase"
      >
        1000m Run
      </span>
      <component
        :is="getIcon(item.icon)"
        :size="10"
        class="text-zinc-400 transform scale-x-[-1]"
      />
    </div>
  </div>

  <!-- WORKOUT: Station card with refined colors -->
  <div
    v-else
    class="relative bg-white h-24 flex flex-row items-stretch overflow-hidden"
  >
    <!-- Left: Station Number - Deep slate instead of pure black -->
    <div
      class="w-14 flex flex-col items-center justify-center relative"
      :style="{
        background: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)',
      }"
    >
      <span
        class="text-3xl font-black text-amber-400 leading-none"
        style="font-family: 'Oswald', sans-serif"
      >
        {{ String(item.stationNumber).padStart(2, "0") }}
      </span>
      <span
        class="text-[7px] text-slate-400 font-semibold uppercase tracking-widest mt-0.5"
      >
        Station
      </span>
    </div>

    <!-- Center: Content -->
    <div class="flex-1 flex flex-col justify-center px-4 py-2 relative z-10">
      <h3
        class="text-xl font-black text-zinc-900 uppercase tracking-tight leading-tight"
        style="font-family: 'Oswald', sans-serif"
      >
        {{ item.title }}
      </h3>
      <span v-if="item.titleZh" class="text-sm text-zinc-500 mt-0.5">
        {{ item.titleZh }}
      </span>
    </div>

    <!-- Right: Metrics -->
    <div
      class="w-28 flex flex-col justify-center items-center pr-4 relative z-10"
    >
      <div v-if="metrics.main" class="bg-zinc-100 px-2 py-1 rounded-md mb-1">
        <span
          class="text-sm font-bold text-zinc-800 uppercase whitespace-nowrap"
          style="font-family: 'Oswald', sans-serif"
        >
          {{ metrics.main }}
        </span>
      </div>
      <span
        v-if="metrics.sub"
        class="text-xs font-bold text-zinc-600 uppercase tracking-wide text-center"
      >
        {{ metrics.sub }}
      </span>
    </div>

    <!-- Watermark icon -->
    <div
      class="absolute right-[30%] bottom-0 transform translate-y-1/4 opacity-[0.04] pointer-events-none z-0"
    >
      <component :is="getIcon(item.icon)" :size="80" stroke-width="1" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { StationType, type RaceItem } from "../../types/race";
import * as LucideIcons from "lucide-vue-next";

const props = defineProps<{
  item: RaceItem;
  weight?: string;
  isLast?: boolean;
}>();

const getIcon = (iconName?: string) => {
  if (!iconName) return null;
  return (LucideIcons as any)[iconName];
};

const metrics = computed(() => {
  const main = props.item.baseMetric || "";
  const sub = props.weight || "";
  return { main, sub };
});
</script>
