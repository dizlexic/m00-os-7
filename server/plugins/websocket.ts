import { defineNitroPlugin } from 'nitropack/runtime/plugin'
import { cleanupInactiveSessions } from '../utils/stc'

export default defineNitroPlugin((nitroApp) => {
  console.log('Initializing WebSocket Server Plugin...')

  // Set up periodic cleanup of inactive STC sessions
  // Runs every 5 minutes
  const CLEANUP_INTERVAL_MS = 5 * 60 * 1000

  const cleanupInterval = setInterval(() => {
    try {
      cleanupInactiveSessions()
    } catch (error) {
      console.error('[WebSocket] Failed to cleanup inactive sessions:', error)
    }
  }, CLEANUP_INTERVAL_MS)

  // Clean up interval when nitro app closes
  nitroApp.hooks.hook('close', () => {
    clearInterval(cleanupInterval)
  })

  console.log('WebSocket Server Plugin initialized.')
})
