<template>
  <Transition name="slide">
    <div v-if="visible" class="loading-bar">
      <div class="loading-bar-spinner"></div>
      <span class="loading-bar-text">{{ text }}</span>
    </div>
  </Transition>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    visible: boolean;
    text?: string;
  }>(),
  {
    text: "Loading...",
  }
);
</script>

<style scoped>
.loading-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: linear-gradient(to right, #f0fdf4, #dcfce7);
  color: #166534;
  font-size: 0.8125rem;
  font-weight: 500;
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  max-width: 28rem;
  width: 100%;
  z-index: 9999;
  box-shadow: 0 1px 3px rgba(22, 101, 52, 0.08);
  border-bottom: 1px solid #86efac;
}

.loading-bar-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid #bbf7d0;
  border-top-color: #166534;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-bar-text {
  opacity: 1;
  letter-spacing: 0.01em;
}

/* Slide transition */
.slide-enter-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-leave-active {
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-enter-from,
.slide-leave-to {
  transform: translate(-50%, -100%);
  opacity: 0;
}
</style>
