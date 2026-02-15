import { ref, readonly, watch } from 'vue'
import type { RecentItem, RecentItemsState } from '~/types/recent'

const DEFAULT_MAX_ITEMS = 10

// State
const recentApps = ref<RecentItem[]>([])
const recentDocs = ref<RecentItem[]>([])
const maxItems = ref(DEFAULT_MAX_ITEMS)

/**
 * useRecentItems Composable
 *
 * Manages tracking of recently opened applications and documents.
 */
export function useRecentItems() {
  /**
   * Adds an application to the recent items list.
   * If it already exists, it moves to the top.
   */
  function addRecentApp(item: Omit<RecentItem, 'openedAt'>): void {
    const newItem: RecentItem = {
      ...item,
      openedAt: Date.now()
    }

    // Remove existing if it exists
    const index = recentApps.value.findIndex(i => i.id === item.id)
    if (index !== -1) {
      recentApps.value.splice(index, 1)
    }

    // Add to top
    recentApps.value.unshift(newItem)

    // Limit size
    if (recentApps.value.length > maxItems.value) {
      recentApps.value = recentApps.value.slice(0, maxItems.value)
    }
  }

  /**
   * Adds a document to the recent items list.
   * If it already exists, it moves to the top.
   */
  function addRecentDoc(item: Omit<RecentItem, 'openedAt'>): void {
    const newItem: RecentItem = {
      ...item,
      openedAt: Date.now()
    }

    // Remove existing if it exists
    const index = recentDocs.value.findIndex(i => i.id === item.id)
    if (index !== -1) {
      recentDocs.value.splice(index, 1)
    }

    // Add to top
    recentDocs.value.unshift(newItem)

    // Limit size
    if (recentDocs.value.length > maxItems.value) {
      recentDocs.value = recentDocs.value.slice(0, maxItems.value)
    }
  }

  /**
   * Clears all recent items.
   */
  function clearRecentItems(): void {
    recentApps.value = []
    recentDocs.value = []
  }

  /**
   * Sets the maximum number of recent items to keep.
   */
  function setMaxItems(count: number): void {
    maxItems.value = count

    // Trim current lists if they exceed new limit
    if (recentApps.value.length > count) {
      recentApps.value = recentApps.value.slice(0, count)
    }
    if (recentDocs.value.length > count) {
      recentDocs.value = recentDocs.value.slice(0, count)
    }
  }

  return {
    recentApps: readonly(recentApps),
    recentDocs: readonly(recentDocs),
    maxItems: readonly(maxItems),
    addRecentApp,
    addRecentDoc,
    clearRecentItems,
    setMaxItems
  }
}
