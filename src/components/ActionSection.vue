<template>
  <div
    class="w-full px-5 pb-8 pt-4 bg-gradient-to-t from-white via-white to-transparent"
  >
    <!-- WOD Card -->
    <div
      class="bg-white border border-zinc-100 shadow-[0_4px_20px_rgba(0,0,0,0.05)] rounded-2xl p-5 mb-6 relative group"
    >
      <template v-if="!isEditing">
        <div
          class="absolute top-4 right-4 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
        >
          <button
            @click="isEditing = true"
            class="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 rounded-full transition-colors"
          >
            <Pencil :size="16" />
          </button>
        </div>
        <div class="flex items-start gap-4">
          <div class="p-3 bg-lime-50 rounded-xl text-lime-600 mt-1 shrink-0">
            <Dumbbell :size="24" />
          </div>
          <div>
            <h3 class="text-zinc-900 font-bold text-lg leading-tight pr-8">
              {{ mission.title }}
            </h3>
            <p class="text-zinc-500 text-sm mt-2 leading-relaxed">
              {{ mission.description }}
            </p>
          </div>
        </div>
      </template>
      <div v-else class="flex flex-col gap-3">
        <div class="flex justify-between items-center mb-1">
          <span class="text-xs font-bold text-zinc-400 uppercase"
            >Edit Workout</span
          >
          <button
            @click="handleSave"
            class="flex items-center gap-1 text-xs font-bold bg-zinc-900 text-white px-3 py-1.5 rounded-full"
          >
            <Save :size="12" /> Save
          </button>
        </div>
        <input
          type="text"
          v-model="editTitle"
          class="w-full font-bold text-lg border-b border-zinc-200 focus:border-lime-500 outline-none py-1 bg-transparent text-zinc-900 placeholder:text-zinc-300"
          placeholder="Workout Title"
        />
        <textarea
          v-model="editDesc"
          class="w-full text-sm text-zinc-600 border border-zinc-200 rounded-lg p-3 focus:border-lime-500 outline-none bg-zinc-50 min-h-[80px]"
          placeholder="Description (e.g., 5k Run + 100 Burpees)"
        />
      </div>
    </div>

    <!-- Main Action Button -->
    <div v-if="!isCompleted" class="sticky bottom-6">
      <input
        ref="fileInputRef"
        type="file"
        accept="image/*"
        capture="environment"
        class="hidden"
        @change="handleFileChange"
      />
      <button
        @click="fileInputRef?.click()"
        :disabled="loading"
        class="w-full bg-zinc-900 text-white font-bold text-lg py-4 rounded-xl flex items-center justify-center gap-3 shadow-[0_8px_20px_rgba(24,24,27,0.3)] active:scale-95 transition-transform"
      >
        <template v-if="loading">
          <Loader2 class="animate-spin" /> Uploading...
        </template>
        <template v-else>
          <Camera :size="24" />
          CHECK-IN
        </template>
      </button>
    </div>
    <div v-else class="sticky bottom-6">
      <button
        @click="handleNudge"
        :class="[
          'w-full font-bold text-lg py-4 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-95 border',
          copied
            ? 'bg-lime-400 text-black border-lime-400 shadow-[0_0_20px_rgba(163,230,53,0.4)]'
            : 'bg-white text-zinc-900 border-zinc-200 shadow-lg',
        ]"
      >
        <template v-if="copied">
          <Check :size="24" />
          COPIED!
        </template>
        <template v-else>
          <Copy :size="24" />
          NUDGE SQUAD
        </template>
      </button>
      <p class="text-center text-zinc-400 text-xs mt-3 font-medium">
        Great work! Now motivate the others.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import {
  Camera,
  Copy,
  Dumbbell,
  Loader2,
  Check,
  Pencil,
  Save,
} from "lucide-vue-next";
import type { Mission } from "../types";

interface Props {
  mission: Mission;
  isCompleted: boolean;
  completedCount: number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "check-in": [file: File];
  "update-mission": [mission: Mission];
}>();

const fileInputRef = ref<HTMLInputElement | null>(null);
const loading = ref(false);
const copied = ref(false);

// Edit State
const isEditing = ref(false);
const editTitle = ref(props.mission.title);
const editDesc = ref(props.mission.description);

// Watch for mission changes to update edit state
watch(
  () => props.mission,
  (newMission) => {
    editTitle.value = newMission.title;
    editDesc.value = newMission.description;
  }
);

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    loading.value = true;
    setTimeout(() => {
      emit("check-in", target.files![0]);
      loading.value = false;
    }, 1500);
  }
};

const handleNudge = () => {
  const messages = [
    "Wake up squad! Only I have trained today? 😤",
    "Let's go team! Don't break the streak! 🔥",
    "Training done. Who's next? ⚡️",
    "Hyrox waits for no one. Get it done! 🏋️",
  ];
  const msg =
    props.completedCount === 4
      ? "Squad goal achieved! 💪"
      : messages[Math.floor(Math.random() * messages.length)];

  navigator.clipboard.writeText(
    `${props.mission.title}\n${props.mission.description}\n\n${msg}`
  );
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 2000);
};

const handleSave = () => {
  emit("update-mission", {
    title: editTitle.value,
    description: editDesc.value,
  });
  isEditing.value = false;
};
</script>
