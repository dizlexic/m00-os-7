<script setup lang="ts">
/**
 * Root Application Component
 *
 * Main entry point for the Mac OS 7 web clone.
 * Renders the menu bar and desktop environment.
 */
import Desktop from "~/components/desktop/Desktop.vue";
import MenuBar from "~/components/desktop/MenuBar.vue";
import AlertDialog from "~/components/system/AlertDialog.vue";
import { useAlert } from "~/composables/useAlert";

const { alertState, hideAlert } = useAlert();
</script>

<template>
  <div class="app">
    <NuxtRouteAnnouncer />

    <!-- Menu Bar -->
    <MenuBar app-name="Finder" />

    <!-- Desktop Environment -->
    <Desktop />

    <!-- System Alerts -->
    <AlertDialog
      v-if="alertState.isVisible"
      :message="alertState.message"
      :title="alertState.title"
      :type="alertState.type"
      :buttons="alertState.buttons"
      @close="hideAlert"
    />
  </div>
</template>

<style>
.app {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
</style>
