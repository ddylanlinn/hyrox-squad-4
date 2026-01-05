<template>
  <div
    class="min-h-screen bg-gray-50 text-zinc-900 font-sans selection:bg-yellow-400 selection:text-black"
  >
    <!-- Header -->
    <header class="race-guide-header">
      <div class="header-content">
        <div class="header-left">
          <router-link to="/" class="back-btn" title="Back to Dashboard">
            <ArrowLeft :size="20" />
          </router-link>
          <h1 class="header-title">RACE GUIDE</h1>
        </div>
        <div class="relative">
          <button
            @click="isDropdownOpen = !isDropdownOpen"
            class="flex items-center space-x-2 bg-zinc-100 px-3 py-1.5 rounded-full border border-zinc-200 hover:bg-zinc-50 transition-colors"
          >
            <span
              class="text-xs font-bold text-zinc-600 tracking-wider uppercase"
              >{{ selectedCategory }}</span
            >
            <ChevronDown
              :size="12"
              class="text-zinc-400 transition-transform duration-200"
              :class="{ 'rotate-180': isDropdownOpen }"
            />
          </button>

          <!-- Dropdown Menu -->
          <div
            v-if="isDropdownOpen"
            v-click-away="() => (isDropdownOpen = false)"
            class="absolute right-0 top-full mt-2 w-48 bg-white border border-zinc-200 rounded-lg shadow-xl overflow-hidden z-20 max-h-[80vh] overflow-y-auto"
          >
            <div
              v-for="group in RACE_CATEGORIES"
              :key="group.group"
              class="border-b border-zinc-100 last:border-0"
            >
              <div class="px-3 py-2 bg-zinc-50/50">
                <span
                  class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest"
                  >{{ group.group }}</span
                >
              </div>
              <button
                v-for="item in group.items"
                :key="item"
                @click="selectCategory(item)"
                class="w-full text-left px-4 py-2 text-sm font-medium transition-colors flex items-center justify-between group"
                :class="
                  selectedCategory === item
                    ? 'text-black bg-zinc-50'
                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-black'
                "
              >
                <span>{{ item }}</span>
                <Check
                  v-if="selectedCategory === item"
                  :size="14"
                  class="text-green-500"
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Spacer for fixed header -->
    <div class="h-16"></div>

    <!-- Main Content - The "Power List" -->
    <main class="px-0">
      <div class="flex flex-col space-y-[1px] bg-zinc-200 shadow-sm">
        <RaceTableRow
          v-for="(item, index) in RACE_SEQUENCE"
          :key="item.id"
          :item="item"
          :weight="getWeightForStation(item.id)"
          :is-last="index === RACE_SEQUENCE.length - 1"
        />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { ChevronDown, MapPin, ArrowLeft, Check } from "lucide-vue-next";
import {
  RACE_CATEGORIES,
  DEFAULT_CATEGORY,
  CATEGORY_WEIGHTS,
} from "../constants/raceData";
import { generateRaceSequence, shouldShowWeight } from "../utils/raceUtils";
import RaceTableRow from "../components/RaceGuide/RaceTableRow.vue";

const isDropdownOpen = ref(false);
const selectedCategory = ref(DEFAULT_CATEGORY);

// Pre-generate race sequence
const RACE_SEQUENCE = generateRaceSequence();

const selectCategory = (category: string) => {
  selectedCategory.value = category;
  isDropdownOpen.value = false;
};

// Get weight for a station by its ID (e.g., "w-1" -> index 0)
const getWeightForStation = (stationId: string): string | undefined => {
  const match = stationId.match(/^w-(\d+)$/);
  if (!match) return undefined;
  const index = parseInt(match[1], 10) - 1;
  const weight = CATEGORY_WEIGHTS[selectedCategory.value]?.[index];
  return shouldShowWeight(weight) ? weight : undefined;
};
</script>

<style scoped>
/* Header */
.race-guide-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  background: var(--color-background);
  border-bottom: 1px solid var(--color-border);
  max-width: 28rem;
  margin: 0 auto;
}

.header-content {
  padding: 0 1rem;
  height: 4rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-radius: 0.5rem;
  color: var(--color-text-secondary);
  transition: all 0.2s;
}

.back-btn:hover {
  background: var(--color-neutral-100);
  color: var(--color-text-primary);
}

.header-title {
  font-family: "Oswald", sans-serif;
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--color-text-primary);
}
</style>
