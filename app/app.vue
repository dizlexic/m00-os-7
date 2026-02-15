<script setup lang="ts">
/**
 * Root Application Component
 *
 * Main entry point for the Mac OS 7 web clone.
 * Renders the menu bar and desktop environment.
 */
import Desktop from "~/components/desktop/Desktop.vue";
import MenuBar from "~/components/desktop/MenuBar.vue";
</script>

<template>
  <div class="app">
    <NuxtRouteAnnouncer />

    <!-- Menu Bar -->
    <MenuBar app-name="Finder" />

    <!-- Desktop Environment -->
    <Desktop />
  </div>
</template>

<style>
.app {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
</style>
