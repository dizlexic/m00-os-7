export type ChatStatus = 'online' | 'away' | 'busy' | 'offline'

export interface ChatUser {
  id: string
  username: string
  status: ChatStatus
  avatar?: string
  customStatus?: string
}

export interface ChatMessage {
  id: string
  senderId: string
  senderName?: string
  text: string
  timestamp: number
  roomId?: string // If present, it's a room message
  recipientId?: string // If present, it's a private message
}

export interface ChatRoom {
  id: string
  name: string
  ownerId: string
  members: string[] // User IDs
  memberNames?: Record<string, string> // Map of UserID -> Username
  isPrivate?: boolean
}

export interface ChatState {
  currentUser: ChatUser | null
  friends: string[] // User IDs
  blocked: string[] // User IDs
  rooms: ChatRoom[]
  messages: ChatMessage[]
  activeChatId: string | null // Can be a roomId or userId
  isConnected: boolean
}
