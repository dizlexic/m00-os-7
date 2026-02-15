import type { WindowType } from './window'

/**
 * Recent Item Type
 * 
 * Represents an item that was recently opened, either an application or a document.
 */
export interface RecentItem {
  /** Unique identifier (app type or file ID) */
  id: string
  /** Display name */
  name: string
  /** Type (application window type or 'file') */
  type: WindowType | 'file'
  /** Icon path */
  icon?: string
  /** When it was opened */
  openedAt: number
  /** Additional data (e.g., file path, custom parameters) */
  data?: unknown
}

/**
 * Recent items state
 */
export interface RecentItemsState {
  /** List of recent applications */
  recentApps: RecentItem[]
  /** List of recent documents */
  recentDocs: RecentItem[]
  /** Maximum number of items to keep */
  maxItems: number
}
