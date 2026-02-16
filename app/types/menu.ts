/**
 * Menu Type Definitions
 *
 * Shared types for menus, dropdowns, and context menus.
 */

/** Generic menu item */
export interface MenuItem {
  /** Unique identifier */
  id: string
  /** Display label */
  label: string
  /** Keyboard shortcut display (e.g., "⌘N") */
  shortcut?: string
  /** Icon path (optional) */
  icon?: string
  /** Whether item is disabled */
  disabled?: boolean
  /** Whether item is a separator */
  isSeparator?: boolean
  /** Submenu items */
  submenu?: MenuItem[]
  /** Whether item is checked (shows checkmark) */
  checked?: boolean
  /** Action handler */
  action?: () => void
}

/** Menu configuration */
export interface Menu {
  /** Unique identifier */
  id: string
  /** Display label */
  label: string
  /** Menu items */
  items: MenuItem[]
}
