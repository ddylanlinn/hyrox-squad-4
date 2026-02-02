<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="isOpen && record && user" class="modal-overlay">
        <div class="modal-container">
          <!-- Header with Close Button -->
          <div class="modal-header">
            <button @click="emit('close')" class="modal-close-button">
              <X :size="24" />
            </button>
          </div>

          <!-- Image Container -->
          <div class="modal-image-container">
            <img
              :src="record.imageUrl"
              alt="Workout Proof"
              class="modal-image"
            />
          </div>

          <!-- Info Overlay -->
          <div class="modal-info-overlay">
            <div class="modal-user-info">
              <div class="modal-avatar">
                <img
                  v-if="user.avatarUrl"
                  :src="user.avatarUrl"
                  :alt="user.name"
                  class="modal-avatar-img"
                />
                <span v-else>{{ user.initials }}</span>
              </div>
              <div>
                <h3 class="modal-user-name">{{ user.name }}</h3>
                <div class="modal-time">
                  <Clock :size="12" />
                  <span>{{ formatTime(record.completedAt) }}</span>
                </div>
              </div>
            </div>

            <!-- Edit Form -->
            <div v-if="isEditing" class="modal-edit-form">
              <input
                ref="editFileInputRef"
                type="file"
                accept="image/*"
                class="hidden"
                @change="handleImageSelect"
              />
              <textarea
                v-model="editedNote"
                placeholder="Update note..."
                class="edit-textarea"
              ></textarea>
              <div class="edit-actions">
                <button @click="selectNewImage" class="edit-action-button secondary">
                  Change Photo
                </button>
                <div class="edit-primary-actions">
                  <button @click="cancelEdit" class="edit-action-button secondary">
                    Cancel
                  </button>
                  <button @click="saveEdit" class="edit-action-button primary">
                    Save
                  </button>
                </div>
              </div>
              <p v-if="newImageFile" class="new-image-indicator">
                New image selected: {{ newImageFile.name }}
              </p>
            </div>

            <!-- Normal View -->
            <template v-else>
              <div v-if="record.note" class="modal-quote">
                <div class="modal-quote-content">
                  <Quote :size="16" class="modal-quote-icon" />
                  <p class="modal-quote-text">"{{ record.note }}"</p>
                </div>
              </div>

              <!-- Edit/Delete Actions -->
              <div v-if="canEdit" class="modal-actions">
                <button @click="startEdit" class="action-button edit-button">
                  <Edit :size="20" /> Edit
                </button>
                <button @click="handleDelete" class="action-button delete-button">
                  <Trash :size="20" /> Delete
                </button>
              </div>
            </template>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { X, Clock, Quote, Edit, Trash } from "lucide-vue-next";
import type { User, WorkoutRecord } from "../types";

interface Props {
  isOpen: boolean;
  record: WorkoutRecord | null;
  user: User | undefined;
  workoutId?: string;
  currentUserId?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  edit: [
    data: { workoutId: string; note?: string; file?: File; oldImageUrl: string }
  ];
  delete: [workoutId: string];
}>();

const isEditing = ref(false);
const editedNote = ref("");
const editFileInputRef = ref<HTMLInputElement | null>(null);
const newImageFile = ref<File | null>(null);

const canEdit = computed(() => {
  return (
    props.record &&
    props.currentUserId &&
    props.workoutId &&
    props.record.userId === props.currentUserId
  );
});

const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const startEdit = () => {
  if (!props.record) return;
  editedNote.value = props.record.note || "";
  newImageFile.value = null;
  isEditing.value = true;
};

const cancelEdit = () => {
  isEditing.value = false;
  editedNote.value = "";
  newImageFile.value = null;
  if (editFileInputRef.value) {
    editFileInputRef.value.value = "";
  }
};

const selectNewImage = () => {
  editFileInputRef.value?.click();
};

const handleImageSelect = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    newImageFile.value = target.files[0];
  }
};

const saveEdit = () => {
  if (!props.record || !props.workoutId) return;

  emit("edit", {
    workoutId: props.workoutId,
    note: editedNote.value !== props.record.note ? editedNote.value : undefined,
    file: newImageFile.value || undefined,
    oldImageUrl: props.record.imageUrl,
  });

  cancelEdit();
  emit("close");
};

const handleDelete = () => {
  if (!props.workoutId) return;

  if (confirm("Delete this workout? Streaks will be recalculated.")) {
    emit("delete", props.workoutId);
    emit("close");
  }
};
</script>

<style scoped>
/* ========== Modal Overlay ========== */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-modal-overlay);
  backdrop-filter: blur(12px);
  height: 100vh;
  height: 100dvh;
}

.modal-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* ========== Header ========== */
.modal-header {
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  padding: 1rem 1rem 0.5rem;
}

.modal-close-button {
  padding: 0.5rem;
  background-color: rgba(39, 39, 42, 0.5);
  border-radius: 9999px;
  color: white;
  backdrop-filter: blur(4px);
}

/* ========== Image Container ========== */
.modal-image-container {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 1rem;
}

.modal-image {
  max-height: 100%;
  max-width: 100%;
  border-radius: 0.5rem;
  box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);
  object-fit: contain;
}

/* ========== Info Overlay ========== */
.modal-info-overlay {
  flex-shrink: 0;
  background: linear-gradient(to top, black, rgba(0, 0, 0, 0.8), transparent);
  padding: 3rem 1.5rem 2.5rem;
}

.modal-user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.modal-user-name {
  color: white;
  font-weight: 700;
  font-size: 1.25rem;
}

.modal-time {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #a1a1aa;
  font-size: 0.75rem;
}

/* ========== Avatar ========== */
.modal-avatar {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 9999px;
  background-color: var(--color-modal-avatar-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: black;
  font-weight: 700;
  overflow: hidden;
}

.modal-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* ========== Quote Box ========== */
.modal-quote {
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: rgba(39, 39, 42, 0.5);
  border-radius: 0.5rem;
  border-left: 4px solid var(--color-modal-quote-border);
  backdrop-filter: blur(4px);
}

.modal-quote-content {
  display: flex;
  gap: 0.5rem;
}

.modal-quote-icon {
  color: var(--color-modal-quote-icon);
  flex-shrink: 0;
}

.modal-quote-text {
  color: #e4e4e7;
  font-size: 0.875rem;
  font-style: italic;
}

/* ========== Fade Transition ========== */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ========== Action Buttons ========== */
.modal-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
}

.action-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.edit-button {
  background-color: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.edit-button:hover {
  background-color: rgba(59, 130, 246, 0.2);
}

.delete-button {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.delete-button:hover {
  background-color: rgba(239, 68, 68, 0.2);
}

/* ========== Edit Form ========== */
.modal-edit-form {
  margin-top: 1rem;
}

.edit-textarea {
  width: 100%;
  min-height: 80px;
  padding: 0.75rem;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  background-color: rgba(39, 39, 42, 0.5);
  color: #e4e4e7;
  font-size: 0.875rem;
  resize: vertical;
  backdrop-filter: blur(4px);
  margin-bottom: 0.75rem;
}

.edit-textarea::placeholder {
  color: #a1a1aa;
}

.edit-textarea:focus {
  outline: none;
  border-color: rgba(59, 130, 246, 0.5);
}

.edit-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.edit-primary-actions {
  display: flex;
  gap: 0.75rem;
}

.edit-action-button {
  flex: 1;
  padding: 0.75rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.edit-action-button.primary {
  background-color: #3b82f6;
  color: white;
}

.edit-action-button.primary:hover {
  background-color: #2563eb;
}

.edit-action-button.secondary {
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.edit-action-button.secondary:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.new-image-indicator {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #a1a1aa;
  text-align: center;
}

.hidden {
  display: none;
}
</style>
