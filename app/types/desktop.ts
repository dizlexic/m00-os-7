/**
 * Desktop Type Definitions
 *
 * Types for the desktop environment including icons, positions, and settings.
 */

/** Position coordinates */
export interface Position {
  x: number
  y: number
}

/** Size dimensions */
export interface Size {
  width: number
  height: number
}

/** Desktop icon types */
export type IconType =
  | 'folder'
  | 'document'
  | 'application'
  | 'trash'
  | 'hard-drive'
  | 'alias'

/** Desktop icon state */
export interface DesktopIcon {
  /** Unique identifier */
  id: string
  /** Display name */
  name: string
  /** Icon type */
  type: IconType
  /** Icon image path */
  icon: string
  /** Position on desktop */
  position: Position
  /** Whether icon is selected */
  isSelected: boolean
  /** Whether icon is being renamed */
  isRenaming: boolean
  /** Associated file path or action */
  path?: string
  /** Application to open with */
  opensWith?: string
}

/** Desktop background pattern */
export interface DesktopPattern {
  /** Pattern identifier */
  id: string
  /** Pattern display name */
  name: string
  /** Pattern image path or CSS value */
  pattern: string
  /** Whether it's a solid color */
  isSolid: boolean
}

/** Desktop state */
export interface DesktopState {
  /** All desktop icons */
  icons: DesktopIcon[]
  /** Currently selected icon IDs */
  selectedIds: string[]
  /** Current background pattern */
  backgroundPattern: DesktopPattern
  /** Grid size for icon snapping */
  gridSize: number
  /** Whether to show grid */
  showGrid: boolean
}

/** Desktop context menu item */
export interface ContextMenuItem {
  /** Menu item identifier */
  id: string
  /** Display label */
  label: string
  /** Keyboard shortcut display */
  shortcut?: string
  /** Icon path */
  icon?: string
  /** Whether item is disabled */
  disabled?: boolean
  /** Whether item is a separator */
  isSeparator?: boolean
  /** Submenu items */
  submenu?: ContextMenuItem[]
  /** Action handler */
  action?: () => void
}

/** Desktop context menu state */
export interface ContextMenuState {
  /** Whether menu is visible */
  isVisible: boolean
  /** Menu position */
  position: Position
  /** Menu items */
  items: ContextMenuItem[]
}

/** Marquee selection state */
export interface MarqueeSelection {
  /** Whether marquee is active */
  isActive: boolean
  /** Start position */
  start: Position
  /** Current position */
  current: Position
}

/** Default desktop patterns */
export const DEFAULT_PATTERNS: DesktopPattern[] = [
  {
    id: 'default',
    name: 'Default',
    pattern: '#666699',
    isSolid: true
  },
  {
    id: 'gray',
    name: 'Gray',
    pattern: '#808080',
    isSolid: true
  },
  {
    id: 'stripes',
    name: 'Stripes',
    pattern: 'repeating-linear-gradient(0deg, #666699, #666699 2px, #555588 2px, #555588 4px)',
    isSolid: false
  },
  {
    id: 'dots',
    name: 'Dots',
    pattern: 'radial-gradient(#555588 1px, #666699 1px)',
    isSolid: false
  }
]

/** Default grid size in pixels */
export const DEFAULT_GRID_SIZE = 80

/** Icon dimensions */
export const ICON_SIZE = {
  width: 32,
  height: 32
}

/** Icon label dimensions */
export const ICON_LABEL = {
  maxWidth: 72,
  fontSize: 12
}
