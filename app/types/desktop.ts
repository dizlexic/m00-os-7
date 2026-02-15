/**
 * Desktop Type Definitions
 *
 * Types for the desktop environment including icons, positions, and settings.
 */

import type { MenuItem } from './menu'

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

/** Desktop context menu state */
export interface ContextMenuState {
  /** Whether menu is visible */
  isVisible: boolean
  /** Menu position */
  position: Position
  /** Menu items */
  items: MenuItem[]
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
    pattern: '#999999',
    isSolid: true
  },
  {
    id: 'blueprint',
    name: 'Blueprint',
    pattern: 'url(/assets/patterns/blueprint.png)',
    isSolid: false
  },
  {
    id: 'bricks',
    name: 'Bricks',
    pattern: 'url(/assets/patterns/bricks.png)',
    isSolid: false
  },
  {
    id: 'checkerboard',
    name: 'Checkerboard',
    pattern: 'url(/assets/patterns/checkerboard.png)',
    isSolid: false
  },
  {
    id: 'circuit',
    name: 'Circuit',
    pattern: 'url(/assets/patterns/circuit.png)',
    isSolid: false
  },
  {
    id: 'diagonal',
    name: 'Diagonal',
    pattern: 'url(/assets/patterns/diagonal.png)',
    isSolid: false
  },
  {
    id: 'gray-dither',
    name: 'Gray Dither',
    pattern: 'url(/assets/patterns/gray-dither.png)',
    isSolid: false
  },
  {
    id: 'maze',
    name: 'Maze',
    pattern: 'url(/assets/patterns/maze.png)',
    isSolid: false
  },
  {
    id: 'polka-dots',
    name: 'Polka Dots',
    pattern: 'url(/assets/patterns/polka-dots.png)',
    isSolid: false
  },
  {
    id: 'stripes-vertical',
    name: 'Stripes',
    pattern: 'url(/assets/patterns/stripes-vertical.png)',
    isSolid: false
  },
  {
    id: 'waves',
    name: 'Waves',
    pattern: 'url(/assets/patterns/waves.png)',
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
