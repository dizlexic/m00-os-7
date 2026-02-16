<script setup lang="ts">
/**
 * WindowTitleBar Component
 *
 * Mac OS 7 style window title bar with close button, title,
 * zoom button, and horizontal stripes for active windows.
 */

interface Props {
  title: string
  isActive?: boolean
  closable?: boolean
  minimizable?: boolean
  maximizable?: boolean
  collapsible?: boolean
  isCollapsed?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isActive: false,
  closable: true,
  minimizable: true,
  maximizable: true,
  collapsible: true,
  isCollapsed: false
})

const emit = defineEmits<{
  close: []
  minimize: []
  maximize: []
  collapse: []
}>()

function handleCloseClick(event: MouseEvent): void {
  event.stopPropagation()
  emit('close')
}

function handleZoomClick(event: MouseEvent): void {
  event.stopPropagation()
  emit('maximize')
}

function handleCollapseClick(event: MouseEvent): void {
  event.stopPropagation()
  emit('collapse')
}
</script>

<template>
  <div
    class="title-bar"
    :class="{
      'title-bar--active': isActive,
      'title-bar--inactive': !isActive
    }"
  >
    <!-- Close Button -->
    <button
      v-if="closable"
      class="title-bar__button title-bar__button--close"
      :class="{ 'title-bar__button--active': isActive }"
      aria-label="Close window"
      @click="handleCloseClick"
      @mousedown.stop
    >
      <span class="title-bar__button-inner" />
    </button>

    <!-- Left Stripes (for active window) -->
    <div
      v-if="isActive"
      class="title-bar__stripes title-bar__stripes--left"
    />

    <!-- Title -->
    <div class="title-bar__title">
      {{ title }}
    </div>

    <!-- Right Stripes (for active window) -->
    <div
      v-if="isActive"
      class="title-bar__stripes title-bar__stripes--right"
    />

    <!-- Collapse Button (Window Shade) -->
    <button
      v-if="collapsible"
      class="title-bar__button title-bar__button--collapse"
      :class="{
        'title-bar__button--active': isActive,
        'title-bar__button--collapsed': isCollapsed
      }"
      :aria-label="isCollapsed ? 'Expand window' : 'Collapse window'"
      @click="handleCollapseClick"
      @mousedown.stop
    >
      <span class="title-bar__button-inner" />
    </button>

    <!-- Zoom Button -->
    <button
      v-if="maximizable"
      class="title-bar__button title-bar__button--zoom"
      :class="{ 'title-bar__button--active': isActive }"
      aria-label="Zoom window"
      @click="handleZoomClick"
      @mousedown.stop
    >
      <span class="title-bar__button-inner" />
    </button>
  </div>
</template>

<style scoped>
.title-bar {
  display: flex;
  align-items: center;
  height: 20px;
  padding: 0 4px;
  background-color: var(--color-window-bg, #CCCCCC);
  border-bottom: 1px solid var(--color-black);
  cursor: grab;
  user-select: none;
  flex-shrink: 0;
}

.title-bar:active {
  cursor: grabbing;
}

.title-bar--inactive {
  background-color: var(--color-gray-light);
}

.title-bar__button {
  width: 13px;
  height: 11px;
  padding: 0;
  margin: 0 2px;
  background-color: var(--color-white);
  border: 1px solid var(--color-black);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.title-bar__button:active {
  background-color: var(--color-black);
}

.title-bar__button--active {
  box-shadow:
    inset -1px -1px 0 var(--color-gray-dark),
    inset 1px 1px 0 var(--color-white);
}

.title-bar__button:active {
  box-shadow: none;
}

.title-bar__button-inner {
  display: block;
  width: 7px;
  height: 7px;
}

/* Close button - empty box */
.title-bar__button--close .title-bar__button-inner {
  /* Empty box, no content */
}

/* Zoom button - inner box */
.title-bar__button--zoom .title-bar__button-inner {
  border: 1px solid var(--color-black);
  width: 5px;
  height: 5px;
}

.title-bar__button--zoom:active .title-bar__button-inner {
  border-color: var(--color-white);
}

/* Collapse button - horizontal line */
.title-bar__button--collapse .title-bar__button-inner {
  width: 7px;
  height: 2px;
  background-color: var(--color-black);
}

.title-bar__button--collapse:active .title-bar__button-inner {
  background-color: var(--color-white);
}

.title-bar__button--collapsed .title-bar__button-inner {
  height: 1px;
  margin-top: 2px;
}

.title-bar__stripes {
  flex: 1;
  height: 11px;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 1px,
    var(--color-black) 1px,
    var(--color-black) 2px,
    transparent 2px,
    transparent 3px
  );
  margin: 0 4px;
}

.title-bar__stripes--left {
  margin-left: 4px;
  margin-right: 8px;
}

.title-bar__stripes--right {
  margin-left: 8px;
  margin-right: 4px;
}

.title-bar--inactive .title-bar__stripes {
  display: none;
}

.title-bar__title {
  font-family: var(--font-system);
  font-size: var(--font-size-md, 12px);
  font-weight: bold;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 4px;
  flex-shrink: 0;
  max-width: 200px;
}

.title-bar--inactive .title-bar__title {
  flex: 1;
  max-width: none;
}
</style>
