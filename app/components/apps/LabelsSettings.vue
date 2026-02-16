<script setup lang="ts">
/**
 * LabelsSettings Component
 *
 * Control panel for editing label names and colors.
 */
import { ref, watch } from 'vue'
import { useSettings } from '~/composables/useSettings'

const { settings, updateSetting } = useSettings()

const labelNames = ref([...settings.value.labelNames])
const labelColors = ref([...settings.value.labelColors])

const activeColorPicker = ref<number | null>(null)

const availableColors = [
  '#000000', '#FFFFFF', '#CCCCCC', '#999999', '#666666',
  '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
  '#800000', '#008000', '#000080', '#808000', '#800080', '#008080',
  '#FF8000', '#FF007F', '#804000', '#FFCC00'
]

// Watch for external changes to settings
watch(() => settings.value.labelNames, (newVal) => {
  labelNames.value = [...newVal]
}, { deep: true })

watch(() => settings.value.labelColors, (newVal) => {
  labelColors.value = [...newVal]
}, { deep: true })

function updateName(index: number, name: string) {
  labelNames.value[index] = name
  updateSetting('labelNames', [...labelNames.value])
}

function selectColor(index: number, color: string) {
  labelColors.value[index] = color
  updateSetting('labelColors', [...labelColors.value])
  activeColorPicker.value = null
}

function toggleColorPicker(index: number) {
  if (activeColorPicker.value === index) {
    activeColorPicker.value = null
  } else {
    activeColorPicker.value = index
  }
}
</script>

<template>
  <div class="labels-settings" @click="activeColorPicker = null">
    <div class="labels-settings__header">
      <span>Labels</span>
    </div>
    <div class="labels-settings__content">
      <div
        v-for="index in 7"
        :key="index"
        class="labels-settings__row"
      >
        <div class="labels-settings__color-container">
          <div
            class="labels-settings__color-box"
            :style="{ backgroundColor: labelColors[index] }"
            @click.stop="toggleColorPicker(index)"
          ></div>

          <!-- Popover Color Picker -->
          <div
            v-if="activeColorPicker === index"
            class="labels-settings__color-picker"
            @click.stop
          >
            <div
              v-for="color in availableColors"
              :key="color"
              class="labels-settings__color-option"
              :style="{ backgroundColor: color }"
              :class="{ 'labels-settings__color-option--active': labelColors[index] === color }"
              @click="selectColor(index, color)"
            ></div>
          </div>
        </div>

        <input
          :value="labelNames[index]"
          type="text"
          class="mac-input labels-settings__input"
          @input="updateName(index, ($event.target as HTMLInputElement).value)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.labels-settings {
  padding: var(--spacing-md);
  background-color: var(--color-gray-light);
  height: 100%;
  display: flex;
  flex-direction: column;
  font-family: var(--font-system);
}

.labels-settings__header {
  margin-bottom: var(--spacing-md);
  font-size: var(--font-size-md);
}

.labels-settings__content {
  background-color: var(--color-white);
  border: 1px solid var(--color-black);
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  box-shadow: 1px 1px 0 var(--color-white) inset;
}

.labels-settings__row {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.labels-settings__color-container {
  position: relative;
}

.labels-settings__color-box {
  width: 30px;
  height: 16px;
  border: 1px solid var(--color-black);
  cursor: pointer;
  box-shadow: 1px 1px 0 var(--color-gray-medium);
}

.labels-settings__input {
  flex: 1;
  height: 20px;
}

.labels-settings__color-picker {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 100;
  background-color: var(--color-white);
  border: 1px solid var(--color-black);
  box-shadow: 2px 2px 0 var(--color-black);
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 2px;
  padding: 2px;
  width: 100px;
}

.labels-settings__color-option {
  width: 16px;
  height: 16px;
  border: 1px solid var(--color-black);
  cursor: pointer;
}

.labels-settings__color-option:hover {
  outline: 1px solid var(--color-highlight);
}

.labels-settings__color-option--active {
  outline: 1px solid var(--color-highlight);
  box-shadow: 0 0 0 1px var(--color-white) inset;
}
</style>
