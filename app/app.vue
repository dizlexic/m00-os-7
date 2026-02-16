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
const { fetchSettingsFromServer, resetSettings } = useSettings();
const { activeWindow, restoreWindows, closeAllWindows } = useWindowManager();

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
const isInitialDataLoaded = ref(false);

// Initialize on app start
onMounted(async () => {
  await initialize();
  await init();
});

// Load data when authenticated
watch(isAuthenticated, async (isAuth) => {
  if (isAuth) {
    isInitialDataLoaded.value = false;
    await Promise.all([
      fetchFilesFromServer(),
      fetchSettingsFromServer()
    ]);
    restoreWindows();
    isInitialDataLoaded.value = true;
  } else {
    isInitialDataLoaded.value = false;
    resetSettings();
    closeAllWindows();
  }
}, { immediate: true });

const currentAppName = computed(() => {
  if (activeWindow.value) {
    // Capitalize first letter
    const type = activeWindow.value.type;
    return type.charAt(0).toUpperCase() + type.slice(1);
  }
  return 'Finder';
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

      <template v-else-if="isInitialDataLoaded">
        <!-- Menu Bar -->
        <MenuBar :app-name="currentAppName" />

        <!-- Desktop Environment -->
        <Desktop />
      </template>

      <!-- Loading screen while data is being fetched -->
      <div v-else class="loading-screen">
        <div class="mac-os-progress">
          <div class="mac-os-progress-bar"></div>
        </div>
      </div>
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

.loading-screen {
  width: 100%;
  height: 100%;
  background-color: var(--color-gray-light, #CCCCCC);
  display: flex;
  justify-content: center;
  align-items: center;
}

.mac-os-progress {
  width: 200px;
  height: 20px;
  border: 1px solid black;
  background-color: white;
  padding: 2px;
}

.mac-os-progress-bar {
  width: 50%;
  height: 100%;
  background: repeating-linear-gradient(
    45deg,
    #000,
    #000 2px,
    #fff 2px,
    #fff 4px
  );
  animation: progress-move 2s linear infinite;
}

@keyframes progress-move {
  from { background-position: 0 0; }
  to { background-position: 40px 0; }
}
</style>
