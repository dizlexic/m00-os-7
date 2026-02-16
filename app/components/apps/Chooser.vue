<script setup lang="ts">
import { ref } from 'vue'

const selectedLeftItem = ref('AppleTalk')
const leftItems = [
  { id: 'appletalk', label: 'AppleTalk', icon: '🌐' },
  { id: 'laserwriter', label: 'LaserWriter', icon: '🖨️' },
  { id: 'imagewriter', label: 'ImageWriter', icon: '📠' },
  { id: 'stylewriter', label: 'StyleWriter', icon: '🖨️' }
]

const rightItems = ref([
  { id: 'server1', label: 'Macintosh HD Shared' },
  { id: 'server2', label: 'Public Folder' },
  { id: 'printer1', label: 'Office LaserWriter' }
])

const appleTalkActive = ref(true)

function selectLeftItem(id: string) {
  selectedLeftItem.value = id
}
</script>

<template>
  <div class="chooser no-select">
    <div class="chooser__main">
      <!-- Left side: Device types -->
      <div class="chooser__left">
        <div
          v-for="item in leftItems"
          :key="item.id"
          class="chooser__device-icon"
          :class="{ 'chooser__device-icon--selected': selectedLeftItem === item.id }"
          @click="selectLeftItem(item.id)"
        >
          <div class="chooser__icon-placeholder">{{ item.icon }}</div>
          <div class="chooser__icon-label">{{ item.label }}</div>
        </div>
      </div>

      <!-- Right side: Device list -->
      <div class="chooser__right">
        <div class="chooser__list-header">Select a {{ selectedLeftItem }}:</div>
        <div class="chooser__list">
          <div
            v-for="item in rightItems"
            :key="item.id"
            class="chooser__list-item"
          >
            {{ item.label }}
          </div>
        </div>

        <div class="chooser__apple-talk">
          <div class="chooser__apple-talk-label">AppleTalk</div>
          <div class="chooser__apple-talk-options">
            <label class="chooser__radio">
              <input type="radio" :value="true" v-model="appleTalkActive">
              <span>Active</span>
            </label>
            <label class="chooser__radio">
              <input type="radio" :value="false" v-model="appleTalkActive">
              <span>Inactive</span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <div class="chooser__footer">
      <div class="chooser__info">User Name: Macintosh User</div>
      <div class="chooser__version">AppleShare 3.7</div>
    </div>
  </div>
</template>

<style scoped>
.chooser {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: var(--spacing-md);
  background-color: var(--color-gray-light);
  color: var(--color-black);
  font-family: var(--font-system);
  font-size: var(--font-size-md);
}

.chooser__main {
  display: flex;
  flex: 1;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.chooser__left {
  width: 120px;
  background-color: var(--color-white);
  border: 1px solid var(--color-black);
  overflow-y: auto;
  display: grid;
  grid-template-columns: 1fr;
  align-content: start;
}

.chooser__device-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-sm);
  cursor: default;
}

.chooser__device-icon--selected {
  background-color: var(--color-black);
  color: var(--color-white);
}

.chooser__icon-placeholder {
  font-size: 24px;
  margin-bottom: 2px;
}

.chooser__icon-label {
  font-size: 9px;
  text-align: center;
}

.chooser__right {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.chooser__list-header {
  margin-bottom: var(--spacing-xs);
}

.chooser__list {
  flex: 1;
  background-color: var(--color-white);
  border: 1px solid var(--color-black);
  overflow-y: auto;
}

.chooser__list-item {
  padding: 2px var(--spacing-sm);
}

.chooser__list-item:hover {
  background-color: var(--color-black);
  color: var(--color-white);
}

.chooser__apple-talk {
  margin-top: var(--spacing-md);
  border: 1px solid var(--color-black);
  padding: var(--spacing-sm);
}

.chooser__apple-talk-label {
  font-weight: bold;
  margin-bottom: var(--spacing-xs);
}

.chooser__apple-talk-options {
  display: flex;
  gap: var(--spacing-md);
}

.chooser__radio {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.chooser__footer {
  display: flex;
  justify-content: space-between;
  font-size: 9px;
  border-top: 1px solid var(--color-black);
  padding-top: var(--spacing-sm);
}
</style>
