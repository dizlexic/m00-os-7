<script setup lang="ts">
/**
 * SoundSettings Component
 *
 * Control panel for system sound settings like volume and alert sound.
 */
import { ref } from 'vue'
import { useSettings } from '~/composables/useSettings'
import { useSound } from '~/composables/useSound'

const { settings, updateSetting } = useSettings()
const { playSystemSound, playBeep } = useSound()

const alertSounds = [
  { id: 'beep', name: 'System Beep' },
  { id: 'quack', name: 'Quack' },
  { id: 'droplet', name: 'Droplet' },
  { id: 'indigo', name: 'Indigo' },
  { id: 'sosumi', name: 'Sosumi' },
  { id: 'wild-eep', name: 'Wild Eep' }
]

const selectedSound = ref('beep')

function handleVolumeChange(event: Event) {
  const value = (event.target as HTMLInputElement).value
  updateSetting('soundVolume', parseInt(value))
}

function playSelectedSound() {
  if (selectedSound.value === 'beep') {
    playBeep()
  } else {
    playSystemSound(selectedSound.value)
  }
}

function selectSound(id: string) {
  selectedSound.value = id
  playSelectedSound()
}
</script>

<template>
  <div class="sound-settings">
    <div class="sound-settings__section">
      <h3 class="sound-settings__title">Speaker Volume</h3>
      <div class="sound-settings__volume-control">
        <span class="sound-settings__volume-label">0</span>
        <input
          type="range"
          min="0"
          max="100"
          :value="settings.soundVolume"
          class="sound-settings__slider"
          @input="handleVolumeChange"
        />
        <span class="sound-settings__volume-label">100</span>
        <div class="sound-settings__volume-value">{{ settings.soundVolume }}</div>
      </div>
    </div>

    <div class="sound-settings__section">
      <h3 class="sound-settings__title">Alert Sound</h3>
      <div class="sound-settings__sound-list">
        <div
          v-for="sound in alertSounds"
          :key="sound.id"
          class="sound-settings__sound-item"
          :class="{ 'sound-settings__sound-item--active': selectedSound === sound.id }"
          @click="selectSound(sound.id)"
        >
          {{ sound.name }}
        </div>
      </div>
      <div class="sound-settings__actions">
        <button class="mac-button" @click="playSelectedSound">
          Test Sound
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sound-settings {
  padding: var(--spacing-md);
  background-color: var(--color-gray-light);
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  overflow-y: auto;
}

.sound-settings__section {
  background-color: var(--color-white);
  border: 1px solid var(--color-black);
  padding: var(--spacing-md);
  box-shadow: 1px 1px 0 var(--color-white) inset;
}

.sound-settings__title {
  font-family: var(--font-system);
  font-size: var(--font-size-md);
  margin-top: 0;
  margin-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--color-gray-light);
  padding-bottom: var(--spacing-xs);
}

.sound-settings__volume-control {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.sound-settings__volume-label {
  font-size: var(--font-size-xs);
  width: 20px;
}

.sound-settings__volume-value {
  font-family: var(--font-system);
  font-size: var(--font-size-md);
  width: 30px;
  text-align: right;
}

.sound-settings__slider {
  flex: 1;
  appearance: none;
  height: 4px;
  background: var(--color-gray-light);
  border: 1px solid var(--color-black);
  outline: none;
}

.sound-settings__slider::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 20px;
  background: var(--color-white);
  border: 1px solid var(--color-black);
  cursor: pointer;
  box-shadow: 1px 1px 0 var(--color-gray-dark);
}

.sound-settings__sound-list {
  border: 1px solid var(--color-black);
  background-color: var(--color-white);
  max-height: 120px;
  overflow-y: auto;
  margin-bottom: var(--spacing-md);
}

.sound-settings__sound-item {
  padding: var(--spacing-xs) var(--spacing-sm);
  cursor: default;
  font-family: var(--font-system);
  font-size: var(--font-size-md);
}

.sound-settings__sound-item:hover {
  background-color: var(--color-gray-light);
}

.sound-settings__sound-item--active {
  background-color: var(--color-highlight);
  color: var(--color-highlight-text);
}

.sound-settings__actions {
  display: flex;
  justify-content: flex-end;
}
</style>
