<template>
  <div
    ref="sectionRef"
    class="date-section"
    :class="{ 'is-active': isActive, 'is-inactive': !isActive }"
  >
    <!-- CENTER SPINE (Date) - Absolute positioned -->
    <div class="spine">
      <div class="spine-line" />
      <div class="date-marker-wrapper">
        <div class="date-marker" :class="{ active: isActive }">
          <span class="month">{{ month }}</span>
          <span class="day" :class="{ active: isActive }">{{ day }}</span>
        </div>
        <div class="weekday" :class="{ active: isActive }">{{ weekday }}</div>
      </div>
    </div>

    <!-- Two Column Layout -->
    <div class="columns-wrapper">
      <!-- Left Column -->
      <div class="column column-left">
        <div
          v-for="item in leftRecordsWithOffset"
          :key="`${item.record.userId}-${item.record.completedAt}`"
          class="record-wrapper"
          :style="{ marginTop: `${item.offset}rem` }"
        >
          <RecordCard
            :user="getUserById(item.record.userId)"
            :record="item.record"
            alignment="left"
            @image-click="handleImageClick(item.record)"
          />
        </div>
      </div>

      <!-- Right Column -->
      <div class="column column-right">
        <div
          v-for="item in rightRecordsWithOffset"
          :key="`${item.record.userId}-${item.record.completedAt}`"
          class="record-wrapper"
          :style="{ marginTop: `${item.offset}rem` }"
        >
          <RecordCard
            :user="getUserById(item.record.userId)"
            :record="item.record"
            alignment="right"
            @image-click="handleImageClick(item.record)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import RecordCard from "./RecordCard.vue";
import type { User, WorkoutRecord } from "../../types";

interface Props {
  date: string;
  records: WorkoutRecord[];
  users: User[];
  leftUserIds: string[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  imageClick: [record: WorkoutRecord, user: User];
}>();

const handleImageClick = (record: WorkoutRecord) => {
  const user = getUserById(record.userId);
  emit("imageClick", record, user);
};

const sectionRef = ref<HTMLDivElement | null>(null);
const isActive = ref(false);

// Sort all records by time (latest first - closer to now at top)
const sortedRecordsWithIndex = computed(() => {
  const sorted = [...props.records].sort((a, b) => {
    return (
      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );
  });
  return sorted.map((record, index) => ({ record, globalIndex: index }));
});

// Calculate offset based on position in the OTHER column
// This creates the staggered effect
const leftRecordsWithOffset = computed(() => {
  const result: { record: WorkoutRecord; offset: number }[] = [];
  let rightCountBefore = 0;

  for (const item of sortedRecordsWithIndex.value) {
    if (props.leftUserIds.includes(item.record.userId)) {
      // For left records, offset based on how many right records came before
      result.push({ record: item.record, offset: rightCountBefore * 1.5 });
    } else {
      rightCountBefore++;
    }
  }
  return result;
});

const rightRecordsWithOffset = computed(() => {
  const result: { record: WorkoutRecord; offset: number }[] = [];
  let leftCountBefore = 0;

  for (const item of sortedRecordsWithIndex.value) {
    if (!props.leftUserIds.includes(item.record.userId)) {
      // For right records, offset based on how many left records came before
      result.push({ record: item.record, offset: leftCountBefore * 1.5 });
    } else {
      leftCountBefore++;
    }
  }
  return result;
});

// Check if user belongs to left side
const isLeftUser = (userId: string): boolean => {
  return props.leftUserIds.includes(userId);
};

// Get user by ID
const getUserById = (userId: string): User => {
  return (
    props.users.find((u) => u.id === userId) || {
      id: userId,
      name: "Unknown",
      initials: "?",
    }
  );
};

// Format date
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr + "T00:00:00");
  const day = date.getDate();
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
  return { day, month, weekday };
};

const { day, month, weekday } = formatDate(props.date);

// IntersectionObserver for scroll animation
let observer: IntersectionObserver | null = null;

onMounted(() => {
  // Early return if ref is not available
  if (!sectionRef.value) return;

  observer = new IntersectionObserver(
    ([entry]) => {
      isActive.value = entry.isIntersecting;
    },
    {
      root: null,
      threshold: 0.3,
      rootMargin: "-20% 0px -20% 0px",
    }
  );

  observer.observe(sectionRef.value);
});

onUnmounted(() => {
  observer?.disconnect();
  observer = null;
});
</script>

<style scoped>
.date-section {
  position: relative;
  margin-bottom: 2rem;
  transition: opacity 0.7s, filter 0.7s;
  min-height: 8rem;
}

.date-section.is-active {
  opacity: 1;
}

.date-section.is-inactive {
  opacity: 0.4;
  filter: grayscale(0.5);
}

/* Spine - Centered absolute */
.spine {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  top: 0;
  bottom: 0;
  width: 3rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 10;
  pointer-events: none;
}

@media (min-width: 640px) {
  .spine {
    width: 5rem;
  }
}

.spine-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--color-border);
  z-index: 0;
}

.date-marker-wrapper {
  position: sticky;
  top: 50%;
  transform: translateY(-50%);
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: auto;
}

.date-marker {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: 0.75rem;
  border: 3px solid var(--color-border);
  background: var(--color-background);
  box-shadow: var(--shadow-lg);
  transition: all 0.5s;
}

.date-marker.active {
  border-color: var(--color-primary-400);
  transform: scale(1.1);
  box-shadow: var(--shadow-glow-primary);
}

@media (min-width: 640px) {
  .date-marker {
    width: 4rem;
    height: 4rem;
  }
}

.month {
  font-size: 0.6rem;
  font-weight: 700;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

@media (min-width: 640px) {
  .month {
    font-size: 0.75rem;
  }
}

.day {
  font-family: "Oswald", sans-serif;
  font-size: 1.125rem;
  font-weight: 700;
  line-height: 1;
  color: var(--color-text-tertiary);
  transition: color 0.5s;
}

.day.active {
  color: var(--color-text-primary);
}

@media (min-width: 640px) {
  .day {
    font-size: 1.5rem;
  }
}

.weekday {
  margin-top: 0.5rem;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  background: var(--color-neutral-100);
  border: 1px solid var(--color-border);
  color: var(--color-text-tertiary);
  transition: color 0.5s;
}

.weekday.active {
  color: var(--color-primary-600);
}

/* Two Column Layout */
.columns-wrapper {
  display: grid;
  grid-template-columns: 1fr 3rem 1fr;
  padding: 1rem 0.25rem 0; /* Less outer padding */
}

@media (min-width: 640px) {
  .columns-wrapper {
    grid-template-columns: 1fr 5rem 1fr;
    padding: 1rem 0.5rem 0;
  }
}

.column {
  display: flex;
  flex-direction: column;
  min-width: 0; /* Prevent grid blowout */
}

.column-left {
  grid-column: 1;
  padding-right: 0.75rem; /* More space from center */
  align-items: flex-end;
}

.column-right {
  grid-column: 3;
  padding-left: 0.75rem; /* More space from center */
  align-items: flex-start;
}

@media (min-width: 640px) {
  .column-left {
    padding-right: 1rem;
  }

  .column-right {
    padding-left: 1rem;
  }
}

.record-wrapper {
  margin-bottom: 0.5rem;
  max-width: 100%;
}
</style>
