<template>
  <div class="menu-wrapper" ref="menuRef">
    <button class="menu-trigger" @click="toggle" :aria-expanded="isOpen">
      <MoreVertical :size="20" />
    </button>

    <Transition name="dropdown">
      <div v-if="isOpen" class="menu-dropdown">
        <router-link to="/timeline" class="menu-item" @click="close">
          <Calendar :size="18" />
          <span>Timeline</span>
        </router-link>
        <router-link to="/race-guide" class="menu-item" @click="close">
          <Map :size="18" />
          <span>Race Guide</span>
        </router-link>
        <button class="menu-item menu-item--danger" @click="handleLogout">
          <LogOut :size="18" />
          <span>Logout</span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { MoreVertical, Calendar, Map, LogOut } from "lucide-vue-next";

const emit = defineEmits<{
  logout: [];
}>();

const isOpen = ref(false);
const menuRef = ref<HTMLElement | null>(null);

const toggle = () => {
  isOpen.value = !isOpen.value;
};

const close = () => {
  isOpen.value = false;
};

const handleLogout = () => {
  close();
  emit("logout");
};

// 點擊外部關閉 - 使用 cleanup 函數確保正確清理
let cleanupClickOutside: (() => void) | null = null;

onMounted(() => {
  const handleClickOutside = (e: MouseEvent) => {
    if (menuRef.value && !menuRef.value.contains(e.target as Node)) {
      close();
    }
  };

  document.addEventListener("click", handleClickOutside);
  cleanupClickOutside = () => document.removeEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  cleanupClickOutside?.();
});
</script>

<style scoped>
.menu-wrapper {
  position: relative;
}

.menu-trigger {
  padding: 0.5rem;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  transition: all 0.2s;
}

.menu-trigger:hover {
  background-color: var(--color-neutral-100);
  color: var(--color-text-primary);
}

.menu-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  min-width: 160px;
  background: white;
  border-radius: 0.75rem;
  box-shadow:
    0 4px 6px -1px rgb(0 0 0 / 0.1),
    0 2px 4px -2px rgb(0 0 0 / 0.1);
  border: 1px solid var(--color-border);
  overflow: hidden;
  z-index: 50;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.875rem 1rem;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--color-text-primary);
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  transition: background-color 0.15s;
}

.menu-item:hover {
  background-color: var(--color-neutral-50);
}

.menu-item:not(:last-child) {
  border-bottom: 1px solid var(--color-border);
}

.menu-item--danger {
  color: var(--color-error, #ef4444);
}

.menu-item--danger:hover {
  background-color: #fef2f2;
}

/* Transition */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.95);
}
</style>
