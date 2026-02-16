/**
 * Window Type Definitions
 *
 * Types for the window management system including window state,
 * configuration, and events.
 */

import type { Position, Size } from './desktop'
import type { Menu } from './menu'

/** Window state enumeration */
export type WindowState = 'normal' | 'minimized' | 'maximized' | 'collapsed'

/** Window type for different applications */
export type WindowType =
  | 'finder'
  | 'simpletext'
  | 'calculator'
  | 'notepad'
  | 'scrapbook'
  | 'puzzle'
  | 'paint'
  | 'control-panel'
  | 'control-panels'
  | 'general-settings'
  | 'sound-settings'
  | 'date-time-settings'
  | 'apple-menu-settings'
  | 'color-settings'
  | 'desktop-patterns-settings'
  | 'extensions-settings'
  | 'memory-settings'
  | 'monitors-settings'
  | 'mouse-settings'
  | 'users-settings'
  | 'network-settings'
  | 'startup-disk-settings'
  | 'get-info'
  | 'about'
  | 'article'
  | 'help'
  | 'alert'
  | 'imageviewer'
  | 'eliza'
  | 'generic'

/** Window configuration for creating new windows */
export interface WindowConfig {
  /** Window type */
  type: WindowType
  /** Window title */
  title: string
  /** Initial position (optional, will be cascaded if not provided) */
  position?: Position
  /** Initial size */
  size?: Size
  /** Minimum size constraints */
  minSize?: Size
  /** Maximum size constraints */
  maxSize?: Size
  /** Whether window is resizable */
  resizable?: boolean
  /** Whether window is closable */
  closable?: boolean
  /** Whether window is minimizable */
  minimizable?: boolean
  /** Whether window is maximizable */
  maximizable?: boolean
  /** Whether window has a collapse button */
  collapsible?: boolean
  /** Associated file path or data */
  data?: unknown
  /** Icon path for window */
  icon?: string
  /** Custom menus for this window */
  menus?: Menu[]
}

/** Window instance state */
export interface WindowInstance {
  /** Unique window identifier */
  id: string
  /** Window type */
  type: WindowType
  /** Window title */
  title: string
  /** Current position */
  position: Position
  /** Current size */
  size: Size
  /** Size before maximizing (for restore) */
  previousSize?: Size
  /** Position before maximizing (for restore) */
  previousPosition?: Position
  /** Minimum size constraints */
  minSize: Size
  /** Maximum size constraints */
  maxSize: Size
  /** Current window state */
  state: WindowState
  /** Z-index for stacking order */
  zIndex: number
  /** Whether window is currently active/focused */
  isActive: boolean
  /** Whether window is resizable */
  resizable: boolean
  /** Whether window is closable */
  closable: boolean
  /** Whether window is minimizable */
  minimizable: boolean
  /** Whether window is maximizable */
  maximizable: boolean
  /** Whether window has a collapse button */
  collapsible: boolean
  /** Associated data */
  data?: unknown
  /** Icon path */
  icon?: string
  /** Timestamp when window was created */
  createdAt: number
  /** Custom menus for this window */
  menus?: Menu[]
}

/** Window manager state */
export interface WindowManagerState {
  /** All window instances */
  windows: Map<string, WindowInstance>
  /** Currently active window ID */
  activeWindowId: string | null
  /** Current highest z-index */
  topZIndex: number
  /** Cascade offset for new windows */
  cascadeOffset: Position
}

/** Window drag state */
export interface WindowDragState {
  /** Whether currently dragging */
  isDragging: boolean
  /** Window being dragged */
  windowId: string | null
  /** Drag start position */
  startPosition: Position
  /** Window start position */
  windowStartPosition: Position
}

/** Window resize state */
export interface WindowResizeState {
  /** Whether currently resizing */
  isResizing: boolean
  /** Window being resized */
  windowId: string | null
  /** Resize start position */
  startPosition: Position
  /** Window start size */
  windowStartSize: Size
  /** Resize direction */
  direction: ResizeDirection
}

/** Resize direction */
export type ResizeDirection =
  | 'n' | 's' | 'e' | 'w'
  | 'ne' | 'nw' | 'se' | 'sw'

/** Default window sizes by type */
export const DEFAULT_WINDOW_SIZES: Record<WindowType, Size> = {
  finder: { width: 500, height: 350 },
  simpletext: { width: 450, height: 400 },
  calculator: { width: 182, height: 281 },
  notepad: { width: 300, height: 400 },
  scrapbook: { width: 350, height: 400 },
  puzzle: { width: 200, height: 240 },
  paint: { width: 700, height: 500 },
  'control-panel': { width: 400, height: 300 },
  'control-panels': { width: 400, height: 300 },
  'general-settings': { width: 400, height: 350 },
  'sound-settings': { width: 400, height: 350 },
  'date-time-settings': { width: 400, height: 400 },
  'apple-menu-settings': { width: 400, height: 350 },
  'color-settings': { width: 400, height: 350 },
  'desktop-patterns-settings': { width: 400, height: 350 },
  'extensions-settings': { width: 400, height: 350 },
  'memory-settings': { width: 400, height: 350 },
  'monitors-settings': { width: 400, height: 350 },
  'mouse-settings': { width: 400, height: 350 },
  'users-settings': { width: 400, height: 400 },
  'network-settings': { width: 450, height: 400 },
  'startup-disk-settings': { width: 400, height: 350 },
  'get-info': { width: 300, height: 400 },
  about: { width: 400, height: 250 },
  article: { width: 600, height: 500 },
  help: { width: 600, height: 500 },
  alert: { width: 350, height: 150 },
  imageviewer: { width: 400, height: 350 },
  eliza: { width: 450, height: 380 },
  generic: { width: 400, height: 300 }
}

/** Default minimum window size */
export const DEFAULT_MIN_SIZE: Size = {
  width: 100,
  height: 50
}

/** Default maximum window size */
export const DEFAULT_MAX_SIZE: Size = {
  width: 9999,
  height: 9999
}

/** Window title bar height */
export const TITLE_BAR_HEIGHT = 20

/** Cascade offset for new windows */
export const CASCADE_OFFSET: Position = {
  x: 20,
  y: 20
}

/** Initial window position */
export const INITIAL_WINDOW_POSITION: Position = {
  x: 40,
  y: 20
}

/** Maximum number of windows */
export const MAX_WINDOWS = 20
