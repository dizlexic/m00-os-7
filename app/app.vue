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

useSeoMeta({
  title: 'm00-os-7 - Mac OS 7 Web Clone',
  ogTitle: 'm00-os-7 - Mac OS 7 Web Clone',
  description: 'A faithful recreation of Apple Macintosh System 7 as a web application',
  ogDescription: 'A faithful recreation of Apple Macintosh System 7 as a web application',
  ogImage: '/og-image.png',
  ogType: 'website',
  ogLocale: 'en_US',
  ogSiteName: 'm00-os-7',
  twitterCard: 'summary_large_image',
  twitterTitle: 'm00-os-7 - Mac OS 7 Web Clone',
  twitterDescription: 'A faithful recreation of Apple Macintosh System 7 as a web application',
  twitterImage: '/og-image.png',
})

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
      :show-input="alertState.showInput"
      :default-value="alertState.defaultValue"
      :input-placeholder="alertState.inputPlaceholder"
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
