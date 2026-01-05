<template>
  <div
    class="record-card"
    :class="[alignment === 'left' ? 'items-end text-right' : 'items-start text-left']"
  >
    <!-- Header: Avatar, Name & Time -->
    <div
      class="header"
      :class="[alignment === 'left' ? 'flex-row-reverse' : 'flex-row']"
    >
      <div class="avatar">
        <img
          v-if="user.avatarUrl"
          :src="user.avatarUrl"
          :alt="user.name"
          class="avatar-img"
        />
        <span v-else class="avatar-placeholder">{{ user.initials }}</span>
      </div>
      <span class="user-name">{{ user.name }}</span>
      <span class="time-text">{{ formattedTime }}</span>
    </div>

    <!-- Bubble / Card Content -->
    <div
      class="card-content"
      :class="[alignment === 'left' ? 'rounded-tr-none' : 'rounded-tl-none']"
    >
      <!-- Image -->
      <div
        v-if="record.imageUrl"
        class="image-container"
        @click="emit('imageClick')"
      >
        <img :src="record.imageUrl" alt="Workout" class="workout-image" />
      </div>

      <!-- Note -->
      <div v-if="record.note" class="content-body">
        <p class="note">{{ record.note }}</p>
      </div>
    </div>

    <!-- Decorative connecting line -->
    <div
      class="connector-line"
      :class="[alignment === 'left' ? 'right-connector' : 'left-connector']"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { User, WorkoutRecord } from "../../types";

interface Props {
  user: User;
  record: WorkoutRecord;
  alignment: "left" | "right";
}

const props = defineProps<Props>();

const emit = defineEmits<{
  imageClick: [];
}>();

const formattedTime = computed(() => {
  const date = new Date(props.record.completedAt);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
});
</script>

<style scoped>
.record-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  transition: all 0.5s;
}

.record-card:hover {
  z-index: 10;
}

.header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.avatar {
  position: relative;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  border: 2px solid var(--color-border);
  overflow: hidden;
  background: var(--color-neutral-200);
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.user-name {
  font-family: "Oswald", sans-serif;
  font-weight: 700;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
}

.time-text {
  font-family: monospace;
  font-size: 0.75rem;
  color: var(--color-text-tertiary);
}

.card-content {
  position: relative;
  width: 100%;
  max-width: 10rem;
  min-width: 8rem;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: var(--shadow-card);
  transition: transform 0.3s;
}

.record-card:hover .card-content {
  transform: scale(1.02);
}

.image-container {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  background: var(--color-neutral-100);
  cursor: pointer;
}

.workout-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.content-body {
  padding: 0.75rem;
}

.note {
  font-size: 0.875rem;
  color: var(--color-text-primary);
  line-height: 1.5;
  white-space: pre-wrap;
}

.connector-line {
  position: absolute;
  top: 1rem;
  width: 1rem;
  height: 1px;
  background: var(--color-border);
}

.right-connector {
  right: -1.25rem;
}

.left-connector {
  left: -1.25rem;
}

@media (min-width: 640px) {
  .card-content {
    width: 12rem;
  }
}
</style>
