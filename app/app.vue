<script setup lang="ts">
import { ref, onMounted } from 'vue'
/**
 * Root Application Component
 *
 * Main entry point for the Mac OS 7 web clone.
 * Renders the menu bar and desktop environment.
 */
import Desktop from "~/components/desktop/Desktop.vue";
import MenuBar from "~/components/desktop/MenuBar.vue";
import AlertDialog from "~/components/system/AlertDialog.vue";
import BootScreen from "~/components/system/BootScreen.vue";
import LoginScreen from "~/components/system/LoginScreen.vue";
import { useAlert } from "~/composables/useAlert";
import { useFileSystem } from "~/composables/useFileSystem";
import { useUser } from "~/composables/useUser";
import { useSettings } from "~/composables/useSettings";
import { useWindowManager } from "~/composables/useWindowManager";

const { alertState, hideAlert } = useAlert();
const { initialize, fetchFilesFromServer } = useFileSystem();
const { isAuthenticated, init } = useUser();
const { fetchSettingsFromServer } = useSettings();
const { activeWindow } = useWindowManager();

const isBooting = ref(true);

const currentAppName = computed(() => {
  if (activeWindow.value) {
    // Capitalize first letter
    const type = activeWindow.value.type;
    return type.charAt(0).toUpperCase() + type.slice(1);
  }
  return 'Finder';
});

// Initialize on app start
onMounted(async () => {
  const loggedIn = await init();
  await initialize();

  if (loggedIn) {
    await Promise.all([
      fetchFilesFromServer(),
      fetchSettingsFromServer()
    ]);
  }
});

function onBootComplete() {
  isBooting.value = false;
}
</script>

<template>
  <div class="app">
    <NuxtRouteAnnouncer />

    <BootScreen v-if="isBooting" @complete="onBootComplete" />

    <template v-else>
      <LoginScreen v-if="!isAuthenticated" />

      <template v-else>
        <!-- Menu Bar -->
        <MenuBar :app-name="currentAppName" />

        <!-- Desktop Environment -->
        <Desktop />
      </template>
    </template>

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
