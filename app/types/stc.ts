/**
 * Share the Computer (STC) Mode Type Definitions
 *
 * Types for the shared desktop experience where multiple users
 * can interact with the same desktop simultaneously via WebSockets.
 */

import type { Position } from './desktop'

/** Cursor style options for remote users */
export type CursorStyle = 
  | 'arrow'
  | 'hand'
  | 'crosshair'
  | 'pointer'

/** Predefined cursor colors */
export type CursorColor =
  | '#FF0000'  // Red
  | '#00FF00'  // Green
  | '#0000FF'  // Blue
  | '#FFFF00'  // Yellow
  | '#FF00FF'  // Magenta
  | '#00FFFF'  // Cyan
  | '#FF8000'  // Orange
  | '#8000FF'  // Purple

/** Cursor color names for display */
export const CURSOR_COLOR_NAMES: Record<CursorColor, string> = {
  '#FF0000': 'Red',
  '#00FF00': 'Green',
  '#0000FF': 'Blue',
  '#FFFF00': 'Yellow',
  '#FF00FF': 'Magenta',
  '#00FFFF': 'Cyan',
  '#FF8000': 'Orange',
  '#8000FF': 'Purple'
}

/** Available cursor colors as array */
export const CURSOR_COLORS: CursorColor[] = [
  '#FF0000',
  '#00FF00',
  '#0000FF',
  '#FFFF00',
  '#FF00FF',
  '#00FFFF',
  '#FF8000',
  '#8000FF'
]

/** Available cursor styles */
export const CURSOR_STYLES: CursorStyle[] = [
  'arrow',
  'hand',
  'crosshair',
  'pointer'
]

/** User cursor configuration */
export interface CursorConfig {
  /** Cursor style */
  style: CursorStyle
  /** Cursor color */
  color: CursorColor | string
}

/** Remote user information */
export interface RemoteUser {
  /** Unique user identifier */
  id: string
  /** Display name */
  username: string
  /** Current cursor position */
  position: Position
  /** Cursor configuration */
  cursor: CursorConfig
  /** Whether user is currently active */
  isActive: boolean
  /** Last activity timestamp */
  lastActivity: number
}

/** STC session state */
export interface STCSession {
  /** Session identifier */
  id: string
  /** Session name */
  name: string
  /** Host user ID */
  hostId: string
  /** Connected users */
  users: RemoteUser[]
  /** Whether session is active */
  isActive: boolean
  /** Session creation timestamp */
  createdAt: number
}

/** STC connection state */
export type STCConnectionState = 
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error'

/** STC mode settings stored in user preferences */
export interface STCSettings {
  /** Whether STC mode is enabled */
  enabled: boolean
  /** User's cursor configuration */
  cursor: CursorConfig
  /** Whether to show remote cursors */
  showRemoteCursors: boolean
  /** Whether to show user labels on cursors */
  showCursorLabels: boolean
}

/** Default STC settings */
export const DEFAULT_STC_SETTINGS: STCSettings = {
  enabled: false,
  cursor: {
    style: 'arrow',
    color: '#FF0000'
  },
  showRemoteCursors: true,
  showCursorLabels: true
}

// ============================================
// WebSocket Message Types
// ============================================

/** Base WebSocket message structure */
export interface STCMessage<T = unknown> {
  /** Message type */
  type: STCMessageType
  /** Message payload */
  payload: T
  /** Sender user ID */
  userId: string
  /** Message timestamp */
  timestamp: number
}

/** All possible STC message types */
export type STCMessageType =
  // Connection messages
  | 'connect'
  | 'disconnect'
  | 'user-joined'
  | 'user-left'
  // Cursor messages
  | 'cursor-move'
  | 'cursor-config-update'
  // Desktop interaction messages
  | 'icon-select'
  | 'icon-deselect'
  | 'icon-move'
  | 'icon-rename'
  | 'icon-open'
  // Window messages
  | 'window-open'
  | 'window-close'
  | 'window-move'
  | 'window-resize'
  | 'window-focus'
  | 'window-minimize'
  | 'window-maximize'
  // Input messages
  | 'key-press'
  | 'text-input'
  // Session messages
  | 'session-create'
  | 'session-join'
  | 'session-leave'
  | 'session-state'
  | 'session-users'
  // Error messages
  | 'error'

// ============================================
// Message Payloads
// ============================================

/** Connect message payload */
export interface ConnectPayload {
  username: string
  cursor: CursorConfig
}

/** User joined/left payload */
export interface UserPresencePayload {
  user: RemoteUser
}

/** Cursor move payload */
export interface CursorMovePayload {
  position: Position
}

/** Cursor config update payload */
export interface CursorConfigPayload {
  cursor: CursorConfig
}

/** Icon select/deselect payload */
export interface IconSelectPayload {
  iconId: string
  addToSelection?: boolean
}

/** Icon move payload */
export interface IconMovePayload {
  iconId: string
  position: Position
}

/** Icon rename payload */
export interface IconRenamePayload {
  iconId: string
  newName: string
}

/** Icon open payload */
export interface IconOpenPayload {
  iconId: string
}

/** Window open payload */
export interface WindowOpenPayload {
  windowId: string
  type: string
  title: string
  position: Position
  size: { width: number; height: number }
}

/** Window close payload */
export interface WindowClosePayload {
  windowId: string
}

/** Window move payload */
export interface WindowMovePayload {
  windowId: string
  position: Position
}

/** Window resize payload */
export interface WindowResizePayload {
  windowId: string
  size: { width: number; height: number }
}

/** Window focus payload */
export interface WindowFocusPayload {
  windowId: string
}

/** Window state change payload (minimize/maximize) */
export interface WindowStatePayload {
  windowId: string
  state: 'normal' | 'minimized' | 'maximized' | 'collapsed'
}

/** Key press payload */
export interface KeyPressPayload {
  key: string
  modifiers: {
    ctrl: boolean
    alt: boolean
    shift: boolean
    meta: boolean
  }
  targetWindowId?: string
}

/** Text input payload */
export interface TextInputPayload {
  text: string
  targetWindowId?: string
  targetElementId?: string
}

/** Session create payload */
export interface SessionCreatePayload {
  sessionName: string
}

/** Session join payload */
export interface SessionJoinPayload {
  sessionId: string
}

/** Session state payload (full state sync) */
export interface SessionStatePayload {
  session: STCSession
  desktopState?: {
    icons: Array<{
      id: string
      position: Position
      isSelected: boolean
    }>
  }
  windowState?: Array<{
    id: string
    type: string
    title: string
    position: Position
    size: { width: number; height: number }
    state: string
    zIndex: number
  }>
}

/** Session users payload */
export interface SessionUsersPayload {
  users: RemoteUser[]
}

/** Error payload */
export interface ErrorPayload {
  code: string
  message: string
}

// ============================================
// Type Guards
// ============================================

/** Check if a message is of a specific type */
export function isSTCMessage<T>(
  message: unknown,
  type: STCMessageType
): message is STCMessage<T> {
  return (
    typeof message === 'object' &&
    message !== null &&
    'type' in message &&
    (message as STCMessage).type === type
  )
}
