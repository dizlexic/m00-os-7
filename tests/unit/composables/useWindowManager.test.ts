/**
 * useWindowManager Composable Tests
 *
 * Comprehensive tests for the window management system including
 * opening, closing, focusing, and arranging windows.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useWindowManager } from '~/composables/useWindowManager'
import type { WindowConfig } from '~/types/window'
import { MAX_WINDOWS, INITIAL_WINDOW_POSITION, CASCADE_OFFSET, TITLE_BAR_HEIGHT } from '~/types/window'

// Mock useRecentItems
vi.mock('~/composables/useRecentItems', () => ({
  useRecentItems: () => ({
    addRecentApp: vi.fn(),
    addRecentDocument: vi.fn(),
    recentApps: { value: [] },
    recentDocuments: { value: [] }
  })
}))

describe('useWindowManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset window manager state by closing all windows
    const { closeAllWindows } = useWindowManager()
    closeAllWindows()
  })

  describe('initialization', () => {
    it('should initialize with empty window list', () => {
      const { windowList, windowCount } = useWindowManager()
      expect(windowList.value).toEqual([])
      expect(windowCount.value).toBe(0)
    })

    it('should initialize with no active window', () => {
      const { activeWindowId, activeWindow } = useWindowManager()
      expect(activeWindowId.value).toBeNull()
      expect(activeWindow.value).toBeNull()
    })
  })

  describe('openWindow', () => {
    it('should create a new window with default position', () => {
      const { openWindow, getWindow } = useWindowManager()
      const config: WindowConfig = {
        type: 'generic',
        title: 'Test Window'
      }

      const windowId = openWindow(config)

      const window = getWindow(windowId)
      expect(window).toBeDefined()
      expect(window?.title).toBe('Test Window')
      expect(window?.type).toBe('generic')
      expect(window?.position).toEqual(INITIAL_WINDOW_POSITION)
    })

    it('should assign unique id to each window', () => {
      const { openWindow } = useWindowManager()
      const config: WindowConfig = { type: 'generic', title: 'Test' }

      const id1 = openWindow(config)
      const id2 = openWindow(config)

      expect(id1).not.toBe(id2)
    })

    it('should create window with specified position', () => {
      const { openWindow, getWindow } = useWindowManager()
      const config: WindowConfig = {
        type: 'generic',
        title: 'Test Window',
        position: { x: 100, y: 200 }
      }

      const windowId = openWindow(config)

      const window = getWindow(windowId)
      expect(window?.position).toEqual({ x: 100, y: 200 })
    })

    it('should create window with specified size', () => {
      const { openWindow, getWindow } = useWindowManager()
      const config: WindowConfig = {
        type: 'generic',
        title: 'Test Window',
        size: { width: 500, height: 400 }
      }

      const windowId = openWindow(config)

      const window = getWindow(windowId)
      expect(window?.size).toEqual({ width: 500, height: 400 })
    })

    it('should use default size for window type when not specified', () => {
      const { openWindow, getWindow } = useWindowManager()
      const config: WindowConfig = {
        type: 'calculator',
        title: 'Calculator'
      }

      const windowId = openWindow(config)

      const window = getWindow(windowId)
      expect(window?.size).toEqual({ width: 182, height: 281 })
    })

    it('should set new window as active', () => {
      const { openWindow, activeWindowId, activeWindow } = useWindowManager()
      const config: WindowConfig = { type: 'generic', title: 'Test' }

      const windowId = openWindow(config)

      expect(activeWindowId.value).toBe(windowId)
      expect(activeWindow.value?.id).toBe(windowId)
      expect(activeWindow.value?.isActive).toBe(true)
    })

    it('should deactivate previous active window when opening new one', () => {
      const { openWindow, getWindow } = useWindowManager()

      const id1 = openWindow({ type: 'generic', title: 'Window 1' })
      const id2 = openWindow({ type: 'generic', title: 'Window 2' })

      expect(getWindow(id1)?.isActive).toBe(false)
      expect(getWindow(id2)?.isActive).toBe(true)
    })

    it('should cascade window positions', () => {
      const { openWindow, getWindow } = useWindowManager()

      const id1 = openWindow({ type: 'generic', title: 'Window 1' })
      const id2 = openWindow({ type: 'generic', title: 'Window 2' })

      const window1 = getWindow(id1)
      const window2 = getWindow(id2)

      expect(window2?.position.x).toBe(window1!.position.x + CASCADE_OFFSET.x)
      expect(window2?.position.y).toBe(window1!.position.y + CASCADE_OFFSET.y)
    })

    it('should increment z-index for each new window', () => {
      const { openWindow, getWindow } = useWindowManager()

      const id1 = openWindow({ type: 'generic', title: 'Window 1' })
      const id2 = openWindow({ type: 'generic', title: 'Window 2' })

      expect(getWindow(id2)?.zIndex).toBeGreaterThan(getWindow(id1)!.zIndex)
    })

    it('should throw error when max windows exceeded', () => {
      const { openWindow } = useWindowManager()

      // Open maximum number of windows
      for (let i = 0; i < MAX_WINDOWS; i++) {
        openWindow({ type: 'generic', title: `Window ${i}` })
      }

      // Attempt to open one more
      expect(() => {
        openWindow({ type: 'generic', title: 'One Too Many' })
      }).toThrow(`Maximum number of windows (${MAX_WINDOWS}) exceeded`)
    })

    it('should set window state to normal', () => {
      const { openWindow, getWindow } = useWindowManager()

      const windowId = openWindow({ type: 'generic', title: 'Test' })

      expect(getWindow(windowId)?.state).toBe('normal')
    })

    it('should set default window capabilities', () => {
      const { openWindow, getWindow } = useWindowManager()

      const windowId = openWindow({ type: 'generic', title: 'Test' })
      const window = getWindow(windowId)

      expect(window?.resizable).toBe(true)
      expect(window?.closable).toBe(true)
      expect(window?.minimizable).toBe(true)
      expect(window?.maximizable).toBe(true)
      expect(window?.collapsible).toBe(true)
    })

    it('should respect custom window capabilities', () => {
      const { openWindow, getWindow } = useWindowManager()

      const windowId = openWindow({
        type: 'generic',
        title: 'Test',
        resizable: false,
        closable: false,
        minimizable: false
      })
      const window = getWindow(windowId)

      expect(window?.resizable).toBe(false)
      expect(window?.closable).toBe(false)
      expect(window?.minimizable).toBe(false)
    })

    it('should store custom data in window', () => {
      const { openWindow, getWindow } = useWindowManager()
      const customData = { filePath: '/test/file.txt' }

      const windowId = openWindow({
        type: 'simpletext',
        title: 'Test',
        data: customData
      })

      expect(getWindow(windowId)?.data).toEqual(customData)
    })
  })

  describe('closeWindow', () => {
    it('should remove window from registry', () => {
      const { openWindow, closeWindow, hasWindow, windowCount } = useWindowManager()

      const windowId = openWindow({ type: 'generic', title: 'Test' })
      expect(hasWindow(windowId)).toBe(true)
      expect(windowCount.value).toBe(1)

      closeWindow(windowId)

      expect(hasWindow(windowId)).toBe(false)
      expect(windowCount.value).toBe(0)
    })

    it('should activate top window when closing active window', () => {
      const { openWindow, closeWindow, activeWindowId, getWindow } = useWindowManager()

      const id1 = openWindow({ type: 'generic', title: 'Window 1' })
      const id2 = openWindow({ type: 'generic', title: 'Window 2' })

      closeWindow(id2)

      expect(activeWindowId.value).toBe(id1)
      expect(getWindow(id1)?.isActive).toBe(true)
    })

    it('should set activeWindowId to null when closing last window', () => {
      const { openWindow, closeWindow, activeWindowId } = useWindowManager()

      const windowId = openWindow({ type: 'generic', title: 'Test' })
      closeWindow(windowId)

      expect(activeWindowId.value).toBeNull()
    })

    it('should do nothing when closing non-existent window', () => {
      const { closeWindow, windowCount } = useWindowManager()

      closeWindow('non-existent-id')

      expect(windowCount.value).toBe(0)
    })
  })

  describe('closeAllWindows', () => {
    it('should remove all windows', () => {
      const { openWindow, closeAllWindows, windowCount, windowList } = useWindowManager()

      openWindow({ type: 'generic', title: 'Window 1' })
      openWindow({ type: 'generic', title: 'Window 2' })
      openWindow({ type: 'generic', title: 'Window 3' })

      expect(windowCount.value).toBe(3)

      closeAllWindows()

      expect(windowCount.value).toBe(0)
      expect(windowList.value).toEqual([])
    })

    it('should reset active window to null', () => {
      const { openWindow, closeAllWindows, activeWindowId } = useWindowManager()

      openWindow({ type: 'generic', title: 'Test' })
      closeAllWindows()

      expect(activeWindowId.value).toBeNull()
    })
  })

  describe('activateWindow', () => {
    it('should set window as active', () => {
      const { openWindow, activateWindow, getWindow, activeWindowId } = useWindowManager()

      const id1 = openWindow({ type: 'generic', title: 'Window 1' })
      openWindow({ type: 'generic', title: 'Window 2' })

      activateWindow(id1)

      expect(activeWindowId.value).toBe(id1)
      expect(getWindow(id1)?.isActive).toBe(true)
    })

    it('should deactivate previously active window', () => {
      const { openWindow, activateWindow, getWindow } = useWindowManager()

      const id1 = openWindow({ type: 'generic', title: 'Window 1' })
      const id2 = openWindow({ type: 'generic', title: 'Window 2' })

      activateWindow(id1)

      expect(getWindow(id2)?.isActive).toBe(false)
    })

    it('should bring window to front (increase z-index)', () => {
      const { openWindow, activateWindow, getWindow } = useWindowManager()

      const id1 = openWindow({ type: 'generic', title: 'Window 1' })
      const id2 = openWindow({ type: 'generic', title: 'Window 2' })
      const initialZIndex = getWindow(id1)!.zIndex

      activateWindow(id1)

      expect(getWindow(id1)?.zIndex).toBeGreaterThan(initialZIndex)
      expect(getWindow(id1)?.zIndex).toBeGreaterThan(getWindow(id2)!.zIndex)
    })

    it('should do nothing for non-existent window', () => {
      const { openWindow, activateWindow, activeWindowId } = useWindowManager()

      const windowId = openWindow({ type: 'generic', title: 'Test' })
      activateWindow('non-existent-id')

      expect(activeWindowId.value).toBe(windowId)
    })
  })

  describe('bringToFront', () => {
    it('should be an alias for activateWindow', () => {
      const { openWindow, bringToFront, activeWindowId, getWindow } = useWindowManager()

      const id1 = openWindow({ type: 'generic', title: 'Window 1' })
      openWindow({ type: 'generic', title: 'Window 2' })

      bringToFront(id1)

      expect(activeWindowId.value).toBe(id1)
      expect(getWindow(id1)?.isActive).toBe(true)
    })
  })

  describe('sendToBack', () => {
    it('should set window z-index below all others', () => {
      const { openWindow, sendToBack, getWindow } = useWindowManager()

      const id1 = openWindow({ type: 'generic', title: 'Window 1' })
      const id2 = openWindow({ type: 'generic', title: 'Window 2' })
      const id3 = openWindow({ type: 'generic', title: 'Window 3' })

      sendToBack(id3)

      expect(getWindow(id3)?.zIndex).toBeLessThan(getWindow(id1)!.zIndex)
      expect(getWindow(id3)?.zIndex).toBeLessThan(getWindow(id2)!.zIndex)
    })

    it('should activate the new top window', () => {
      const { openWindow, sendToBack, activeWindowId, sortedWindows } = useWindowManager()

      openWindow({ type: 'generic', title: 'Window 1' })
      openWindow({ type: 'generic', title: 'Window 2' })
      const id3 = openWindow({ type: 'generic', title: 'Window 3' })

      sendToBack(id3)

      const topWindow = sortedWindows.value[sortedWindows.value.length - 1]
      expect(activeWindowId.value).toBe(topWindow.id)
    })
  })

  describe('minimizeWindow', () => {
    it('should set window state to minimized', () => {
      const { openWindow, minimizeWindow, getWindow } = useWindowManager()

      const windowId = openWindow({ type: 'generic', title: 'Test' })
      minimizeWindow(windowId)

      expect(getWindow(windowId)?.state).toBe('minimized')
    })

    it('should deactivate the window', () => {
      const { openWindow, minimizeWindow, getWindow } = useWindowManager()

      const windowId = openWindow({ type: 'generic', title: 'Test' })
      minimizeWindow(windowId)

      expect(getWindow(windowId)?.isActive).toBe(false)
    })

    it('should activate next visible window when minimizing active window', () => {
      const { openWindow, minimizeWindow, activeWindowId, getWindow } = useWindowManager()

      const id1 = openWindow({ type: 'generic', title: 'Window 1' })
      const id2 = openWindow({ type: 'generic', title: 'Window 2' })

      minimizeWindow(id2)

      expect(activeWindowId.value).toBe(id1)
      expect(getWindow(id1)?.isActive).toBe(true)
    })

    it('should not minimize non-minimizable window', () => {
      const { openWindow, minimizeWindow, getWindow } = useWindowManager()

      const windowId = openWindow({
        type: 'generic',
        title: 'Test',
        minimizable: false
      })
      minimizeWindow(windowId)

      expect(getWindow(windowId)?.state).toBe('normal')
    })

    it('should set activeWindowId to null when all windows are minimized', () => {
      const { openWindow, minimizeWindow, activeWindowId } = useWindowManager()

      const windowId = openWindow({ type: 'generic', title: 'Test' })
      minimizeWindow(windowId)

      expect(activeWindowId.value).toBeNull()
    })
  })

  describe('maximizeWindow', () => {
    it('should set window state to maximized', () => {
      const { openWindow, maximizeWindow, getWindow } = useWindowManager()

      const windowId = openWindow({ type: 'generic', title: 'Test' })
      maximizeWindow(windowId)

      expect(getWindow(windowId)?.state).toBe('maximized')
    })

    it('should save previous position and size', () => {
      const { openWindow, maximizeWindow, getWindow } = useWindowManager()

      const windowId = openWindow({
        type: 'generic',
        title: 'Test',
        position: { x: 100, y: 100 },
        size: { width: 300, height: 200 }
      })
      maximizeWindow(windowId)

      const window = getWindow(windowId)
      expect(window?.previousPosition).toEqual({ x: 100, y: 100 })
      expect(window?.previousSize).toEqual({ width: 300, height: 200 })
    })

    it('should toggle back to normal when already maximized', () => {
      const { openWindow, maximizeWindow, getWindow } = useWindowManager()

      const windowId = openWindow({ type: 'generic', title: 'Test' })
      maximizeWindow(windowId)
      maximizeWindow(windowId)

      expect(getWindow(windowId)?.state).toBe('normal')
    })

    it('should not maximize non-maximizable window', () => {
      const { openWindow, maximizeWindow, getWindow } = useWindowManager()

      const windowId = openWindow({
        type: 'generic',
        title: 'Test',
        maximizable: false
      })
      maximizeWindow(windowId)

      expect(getWindow(windowId)?.state).toBe('normal')
    })

    it('should activate the window', () => {
      const { openWindow, maximizeWindow, activeWindowId } = useWindowManager()

      const id1 = openWindow({ type: 'generic', title: 'Window 1' })
      openWindow({ type: 'generic', title: 'Window 2' })

      maximizeWindow(id1)

      expect(activeWindowId.value).toBe(id1)
    })
  })

  describe('collapseWindow', () => {
    it('should set window state to collapsed', () => {
      const { openWindow, collapseWindow, getWindow } = useWindowManager()

      const windowId = openWindow({ type: 'generic', title: 'Test' })
      collapseWindow(windowId)

      expect(getWindow(windowId)?.state).toBe('collapsed')
    })

    it('should collapse window height to title bar height', () => {
      const { openWindow, collapseWindow, getWindow } = useWindowManager()

      const windowId = openWindow({
        type: 'generic',
        title: 'Test',
        size: { width: 400, height: 300 }
      })
      collapseWindow(windowId)

      const window = getWindow(windowId)
      expect(window?.size.height).toBe(TITLE_BAR_HEIGHT)
      expect(window?.size.width).toBe(400) // Width should remain
    })

    it('should save previous size before collapsing', () => {
      const { openWindow, collapseWindow, getWindow } = useWindowManager()

      const windowId = openWindow({
        type: 'generic',
        title: 'Test',
        size: { width: 400, height: 300 }
      })
      collapseWindow(windowId)

      expect(getWindow(windowId)?.previousSize).toEqual({ width: 400, height: 300 })
    })

    it('should toggle back to normal when already collapsed', () => {
      const { openWindow, collapseWindow, getWindow } = useWindowManager()

      const windowId = openWindow({
        type: 'generic',
        title: 'Test',
        size: { width: 400, height: 300 }
      })
      collapseWindow(windowId)
      collapseWindow(windowId)

      const window = getWindow(windowId)
      expect(window?.state).toBe('normal')
      expect(window?.size).toEqual({ width: 400, height: 300 })
    })

    it('should not collapse non-collapsible window', () => {
      const { openWindow, collapseWindow, getWindow } = useWindowManager()

      const windowId = openWindow({
        type: 'generic',
        title: 'Test',
        collapsible: false
      })
      collapseWindow(windowId)

      expect(getWindow(windowId)?.state).toBe('normal')
    })
  })

  describe('restoreWindow', () => {
    it('should restore minimized window to normal state', () => {
      const { openWindow, minimizeWindow, restoreWindow, getWindow } = useWindowManager()

      const windowId = openWindow({ type: 'generic', title: 'Test' })
      minimizeWindow(windowId)
      restoreWindow(windowId)

      expect(getWindow(windowId)?.state).toBe('normal')
    })

    it('should restore maximized window to previous position and size', () => {
      const { openWindow, maximizeWindow, restoreWindow, getWindow } = useWindowManager()

      const windowId = openWindow({
        type: 'generic',
        title: 'Test',
        position: { x: 100, y: 100 },
        size: { width: 300, height: 200 }
      })
      maximizeWindow(windowId)
      restoreWindow(windowId)

      const window = getWindow(windowId)
      expect(window?.state).toBe('normal')
      expect(window?.position).toEqual({ x: 100, y: 100 })
      expect(window?.size).toEqual({ width: 300, height: 200 })
    })

    it('should restore collapsed window to previous size', () => {
      const { openWindow, collapseWindow, restoreWindow, getWindow } = useWindowManager()

      const windowId = openWindow({
        type: 'generic',
        title: 'Test',
        size: { width: 400, height: 300 }
      })
      collapseWindow(windowId)
      restoreWindow(windowId)

      const window = getWindow(windowId)
      expect(window?.state).toBe('normal')
      expect(window?.size).toEqual({ width: 400, height: 300 })
    })

    it('should activate the window', () => {
      const { openWindow, minimizeWindow, restoreWindow, activeWindowId } = useWindowManager()

      const id1 = openWindow({ type: 'generic', title: 'Window 1' })
      openWindow({ type: 'generic', title: 'Window 2' })
      minimizeWindow(id1)

      restoreWindow(id1)

      expect(activeWindowId.value).toBe(id1)
    })
  })

  describe('moveWindow', () => {
    it('should update window position', () => {
      const { openWindow, moveWindow, getWindow } = useWindowManager()

      const windowId = openWindow({ type: 'generic', title: 'Test' })
      moveWindow(windowId, { x: 200, y: 150 })

      expect(getWindow(windowId)?.position).toEqual({ x: 200, y: 150 })
    })

    it('should constrain position to screen bounds (minimum)', () => {
      const { openWindow, moveWindow, getWindow } = useWindowManager()

      const windowId = openWindow({ type: 'generic', title: 'Test' })
      moveWindow(windowId, { x: -100, y: -100 })

      const window = getWindow(windowId)
      expect(window?.position.x).toBeGreaterThanOrEqual(0)
      expect(window?.position.y).toBeGreaterThanOrEqual(0)
    })

    it('should do nothing for non-existent window', () => {
      const { moveWindow, windowCount } = useWindowManager()

      moveWindow('non-existent-id', { x: 100, y: 100 })

      expect(windowCount.value).toBe(0)
    })
  })

  describe('resizeWindow', () => {
    it('should update window size', () => {
      const { openWindow, resizeWindow, getWindow } = useWindowManager()

      const windowId = openWindow({ type: 'generic', title: 'Test' })
      resizeWindow(windowId, { width: 500, height: 400 })

      expect(getWindow(windowId)?.size).toEqual({ width: 500, height: 400 })
    })

    it('should respect minimum size constraints', () => {
      const { openWindow, resizeWindow, getWindow } = useWindowManager()

      const windowId = openWindow({
        type: 'generic',
        title: 'Test',
        minSize: { width: 200, height: 150 }
      })
      resizeWindow(windowId, { width: 50, height: 50 })

      const window = getWindow(windowId)
      expect(window?.size.width).toBeGreaterThanOrEqual(200)
      expect(window?.size.height).toBeGreaterThanOrEqual(150)
    })

    it('should respect maximum size constraints', () => {
      const { openWindow, resizeWindow, getWindow } = useWindowManager()

      const windowId = openWindow({
        type: 'generic',
        title: 'Test',
        maxSize: { width: 600, height: 400 }
      })
      resizeWindow(windowId, { width: 1000, height: 1000 })

      const window = getWindow(windowId)
      expect(window?.size.width).toBeLessThanOrEqual(600)
      expect(window?.size.height).toBeLessThanOrEqual(400)
    })

    it('should not resize non-resizable window', () => {
      const { openWindow, resizeWindow, getWindow } = useWindowManager()

      const windowId = openWindow({
        type: 'generic',
        title: 'Test',
        size: { width: 300, height: 200 },
        resizable: false
      })
      resizeWindow(windowId, { width: 500, height: 400 })

      expect(getWindow(windowId)?.size).toEqual({ width: 300, height: 200 })
    })
  })

  describe('cascadeWindows', () => {
    it('should arrange windows in cascade pattern', () => {
      const { openWindow, cascadeWindows, getWindow } = useWindowManager()

      const id1 = openWindow({ type: 'generic', title: 'Window 1', position: { x: 500, y: 500 } })
      const id2 = openWindow({ type: 'generic', title: 'Window 2', position: { x: 500, y: 500 } })
      const id3 = openWindow({ type: 'generic', title: 'Window 3', position: { x: 500, y: 500 } })

      cascadeWindows()

      const window1 = getWindow(id1)
      const window2 = getWindow(id2)
      const window3 = getWindow(id3)

      expect(window1?.position).toEqual(INITIAL_WINDOW_POSITION)
      expect(window2?.position.x).toBe(INITIAL_WINDOW_POSITION.x + CASCADE_OFFSET.x)
      expect(window2?.position.y).toBe(INITIAL_WINDOW_POSITION.y + CASCADE_OFFSET.y)
      expect(window3?.position.x).toBe(INITIAL_WINDOW_POSITION.x + CASCADE_OFFSET.x * 2)
      expect(window3?.position.y).toBe(INITIAL_WINDOW_POSITION.y + CASCADE_OFFSET.y * 2)
    })

    it('should skip minimized windows', () => {
      const { openWindow, minimizeWindow, cascadeWindows, getWindow } = useWindowManager()

      const id1 = openWindow({ type: 'generic', title: 'Window 1' })
      const id2 = openWindow({ type: 'generic', title: 'Window 2' })
      minimizeWindow(id1)

      cascadeWindows()

      // Window 1 should still be minimized
      expect(getWindow(id1)?.state).toBe('minimized')
      // Window 2 should be at initial position
      expect(getWindow(id2)?.position).toEqual(INITIAL_WINDOW_POSITION)
    })

    it('should restore windows to normal state', () => {
      const { openWindow, maximizeWindow, cascadeWindows, getWindow } = useWindowManager()

      const windowId = openWindow({ type: 'generic', title: 'Test' })
      maximizeWindow(windowId)

      cascadeWindows()

      expect(getWindow(windowId)?.state).toBe('normal')
    })
  })

  describe('tileWindows', () => {
    it('should arrange windows in a grid', () => {
      const { openWindow, tileWindows, getWindow } = useWindowManager()

      const id1 = openWindow({ type: 'generic', title: 'Window 1' })
      const id2 = openWindow({ type: 'generic', title: 'Window 2' })

      tileWindows()

      const window1 = getWindow(id1)
      const window2 = getWindow(id2)

      // Windows should have different positions
      expect(window1?.position).not.toEqual(window2?.position)
    })

    it('should skip minimized windows', () => {
      const { openWindow, minimizeWindow, tileWindows, getWindow } = useWindowManager()

      const id1 = openWindow({ type: 'generic', title: 'Window 1' })
      const id2 = openWindow({ type: 'generic', title: 'Window 2' })
      minimizeWindow(id1)

      tileWindows()

      expect(getWindow(id1)?.state).toBe('minimized')
    })

    it('should restore windows to normal state', () => {
      const { openWindow, maximizeWindow, tileWindows, getWindow } = useWindowManager()

      const windowId = openWindow({ type: 'generic', title: 'Test' })
      maximizeWindow(windowId)

      tileWindows()

      expect(getWindow(windowId)?.state).toBe('normal')
    })

    it('should do nothing when no visible windows', () => {
      const { openWindow, minimizeWindow, tileWindows, getWindow } = useWindowManager()

      const windowId = openWindow({ type: 'generic', title: 'Test' })
      minimizeWindow(windowId)

      // Should not throw
      expect(() => tileWindows()).not.toThrow()
      expect(getWindow(windowId)?.state).toBe('minimized')
    })
  })

  describe('getWindow', () => {
    it('should return window by id', () => {
      const { openWindow, getWindow } = useWindowManager()

      const windowId = openWindow({ type: 'generic', title: 'Test' })
      const window = getWindow(windowId)

      expect(window).toBeDefined()
      expect(window?.id).toBe(windowId)
    })

    it('should return undefined for non-existent window', () => {
      const { getWindow } = useWindowManager()

      expect(getWindow('non-existent-id')).toBeUndefined()
    })
  })

  describe('getWindowsByType', () => {
    it('should return all windows of specified type', () => {
      const { openWindow, getWindowsByType } = useWindowManager()

      openWindow({ type: 'finder', title: 'Finder 1' })
      openWindow({ type: 'finder', title: 'Finder 2' })
      openWindow({ type: 'calculator', title: 'Calculator' })

      const finderWindows = getWindowsByType('finder')

      expect(finderWindows).toHaveLength(2)
      expect(finderWindows.every(w => w.type === 'finder')).toBe(true)
    })

    it('should return empty array when no windows of type exist', () => {
      const { openWindow, getWindowsByType } = useWindowManager()

      openWindow({ type: 'finder', title: 'Finder' })

      expect(getWindowsByType('calculator')).toEqual([])
    })
  })

  describe('hasWindow', () => {
    it('should return true for existing window', () => {
      const { openWindow, hasWindow } = useWindowManager()

      const windowId = openWindow({ type: 'generic', title: 'Test' })

      expect(hasWindow(windowId)).toBe(true)
    })

    it('should return false for non-existent window', () => {
      const { hasWindow } = useWindowManager()

      expect(hasWindow('non-existent-id')).toBe(false)
    })
  })

  describe('updateWindow', () => {
    it('should update window properties', () => {
      const { openWindow, updateWindow, getWindow } = useWindowManager()

      const windowId = openWindow({ type: 'generic', title: 'Test' })
      updateWindow(windowId, { title: 'Updated Title' })

      expect(getWindow(windowId)?.title).toBe('Updated Title')
    })

    it('should do nothing for non-existent window', () => {
      const { updateWindow, windowCount } = useWindowManager()

      updateWindow('non-existent-id', { title: 'Test' })

      expect(windowCount.value).toBe(0)
    })
  })

  describe('setWindowTitle', () => {
    it('should update window title', () => {
      const { openWindow, setWindowTitle, getWindow } = useWindowManager()

      const windowId = openWindow({ type: 'generic', title: 'Original' })
      setWindowTitle(windowId, 'New Title')

      expect(getWindow(windowId)?.title).toBe('New Title')
    })
  })

  describe('sortedWindows', () => {
    it('should return windows sorted by z-index', () => {
      const { openWindow, activateWindow, sortedWindows } = useWindowManager()

      const id1 = openWindow({ type: 'generic', title: 'Window 1' })
      const id2 = openWindow({ type: 'generic', title: 'Window 2' })
      const id3 = openWindow({ type: 'generic', title: 'Window 3' })

      // Activate window 1 to bring it to front
      activateWindow(id1)

      const sorted = sortedWindows.value
      expect(sorted[sorted.length - 1].id).toBe(id1)
    })
  })

  describe('windowList', () => {
    it('should return array of all windows', () => {
      const { openWindow, windowList } = useWindowManager()

      openWindow({ type: 'generic', title: 'Window 1' })
      openWindow({ type: 'generic', title: 'Window 2' })

      expect(windowList.value).toHaveLength(2)
    })
  })
})
