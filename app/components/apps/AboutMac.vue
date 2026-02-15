<script setup lang="ts">
import { computed } from 'vue'
import { useWindowManager } from '~/composables/useWindowManager'

/**
 * About This Macintosh Component
 *
 * Classic Mac OS 7 "About" dialog showing system info and memory usage.
 */

const { windowList } = useWindowManager()

const systemVersion = '7.5.3'
const totalMemory = 16 * 1024 // 16MB in KB
const systemMemory = 2450 // KB

const openApps = computed(() => {
  const apps = []
  // We want to list unique applications, as multiple windows might belong to the same app
  const uniqueApps = new Map<string, { name: string, icon: string, memoryUsage: number }>()

  for (const win of windowList.value) {
    if (win.type === 'about') continue

    // Simple heuristic for app name and memory
    let appName = win.title
    let memoryUsage = 512
    let icon = win.icon || '/assets/icons/system/finder.png'

    if (win.type === 'finder') {
      appName = 'Finder'
      memoryUsage = 1240
    } else if (win.type === 'calculator') {
      appName = 'Calculator'
      memoryUsage = 256
    } else if (win.type === 'simpletext') {
      appName = 'SimpleText'
      memoryUsage = 800
    } else if (win.type === 'notepad') {
      appName = 'Note Pad'
      memoryUsage = 384
    } else if (win.type === 'control-panels' || win.type === 'general-settings' || win.type === 'sound-settings' || win.type === 'date-time-settings') {
      appName = 'Control Panels'
      memoryUsage = 768
      icon = '/assets/icons/system/preferences.png'
    }

    if (!uniqueApps.has(appName)) {
      uniqueApps.set(appName, { name: appName, icon, memoryUsage })
    }
  }

  return Array.from(uniqueApps.values())
})

const usedMemory = computed(() => {
  const appsMemory = openApps.value.reduce((acc, app) => acc + app.memoryUsage, 0)
  return systemMemory + appsMemory
})

const freeMemory = computed(() => totalMemory - usedMemory.value)

function formatMemory(kb: number): string {
  if (kb >= 1024) {
    return `${(kb / 1024).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} MB`
  }
  return `${kb.toLocaleString()} KB`
}

function getBarWidth(kb: number): string {
  return `${Math.max(1, (kb / totalMemory) * 100)}%`
}
</script>

<template>
  <div class="about-mac no-select">
    <div class="about-mac__header">
      <div class="about-mac__logo-container">
        <img src="/assets/icons/system/finder.png" alt="Mac OS" class="about-mac__logo" />
      </div>
      <div class="about-mac__info">
        <h1 class="about-mac__title">About This Macintosh</h1>
        <p class="about-mac__version">System Software {{ systemVersion }}</p>
        <p class="about-mac__copyright">© Apple Computer, Inc. 1983-1996</p>
      </div>
    </div>

    <div class="about-mac__divider" />

    <div class="about-mac__memory">
      <div class="about-mac__memory-row">
        <span class="about-mac__memory-label">Total Memory:</span>
        <span class="about-mac__memory-value">{{ formatMemory(totalMemory) }}</span>
      </div>

      <div class="about-mac__app-list">
        <!-- System Software -->
        <div class="about-mac__app-row">
          <img src="/assets/icons/system/finder.png" class="about-mac__app-icon" />
          <div class="about-mac__app-details">
            <div class="about-mac__app-info">
              <span class="about-mac__app-name">System Software</span>
              <span class="about-mac__app-usage">{{ formatMemory(systemMemory) }}</span>
            </div>
            <div class="about-mac__memory-bar">
              <div class="about-mac__memory-bar-fill" :style="{ width: getBarWidth(systemMemory) }" />
            </div>
          </div>
        </div>

        <!-- Open Apps -->
        <div v-for="app in openApps" :key="app.name" class="about-mac__app-row">
          <img :src="app.icon" class="about-mac__app-icon" />
          <div class="about-mac__app-details">
            <div class="about-mac__app-info">
              <span class="about-mac__app-name">{{ app.name }}</span>
              <span class="about-mac__app-usage">{{ formatMemory(app.memoryUsage) }}</span>
            </div>
            <div class="about-mac__memory-bar">
              <div class="about-mac__memory-bar-fill" :style="{ width: getBarWidth(app.memoryUsage) }" />
            </div>
          </div>
        </div>

        <!-- Largest Unused Block -->
        <div class="about-mac__app-row">
          <div class="about-mac__app-icon-placeholder" />
          <div class="about-mac__app-details">
            <div class="about-mac__app-info">
              <span class="about-mac__app-name">Largest Unused Block</span>
              <span class="about-mac__app-usage">{{ formatMemory(freeMemory) }}</span>
            </div>
            <div class="about-mac__memory-bar">
              <div class="about-mac__memory-bar-fill about-mac__memory-bar-fill--free" :style="{ width: getBarWidth(freeMemory) }" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.about-mac {
  padding: var(--spacing-md);
  background-color: var(--color-white);
  height: 100%;
  display: flex;
  flex-direction: column;
  font-family: var(--font-system);
  color: var(--color-black);
}

.about-mac__header {
  display: flex;
  align-items: flex-start;
  margin-bottom: var(--spacing-md);
  gap: var(--spacing-md);
}

.about-mac__logo-container {
  padding: var(--spacing-xs);
}

.about-mac__logo {
  width: var(--icon-size-md);
  height: var(--icon-size-md);
}

.about-mac__info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.about-mac__title {
  font-size: var(--font-size-md);
  font-weight: bold;
  margin: 0;
}

.about-mac__version,
.about-mac__copyright {
  margin: 0;
  font-size: var(--font-size-xs);
}

.about-mac__divider {
  height: 1px;
  background-color: var(--color-black);
  margin-bottom: var(--spacing-md);
}

.about-mac__memory {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.about-mac__memory-row {
  display: flex;
  justify-content: space-between;
  font-weight: bold;
  font-size: var(--font-size-md);
  margin-bottom: var(--spacing-md);
}

.about-mac__app-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.about-mac__app-row {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
}

.about-mac__app-icon {
  width: var(--icon-size-sm);
  height: var(--icon-size-sm);
  margin-top: 2px;
}

.about-mac__app-icon-placeholder {
  width: var(--icon-size-sm);
  height: var(--icon-size-sm);
}

.about-mac__app-details {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.about-mac__app-info {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-md);
  margin-bottom: 2px;
}

.about-mac__app-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.about-mac__memory-bar {
  height: 12px;
  border: 1px solid var(--color-black);
  background-color: var(--color-white);
  position: relative;
}

.about-mac__memory-bar-fill {
  height: 100%;
  background-color: var(--color-gray-dark);
}

.about-mac__memory-bar-fill--free {
  background-color: var(--color-white);
}
</style>
