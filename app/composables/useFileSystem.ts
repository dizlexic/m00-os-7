import { ref, readonly } from 'vue'
import type { FileNode, FolderNode, FileSystemState, FileNodeType } from '~/types/filesystem'
import { useUser } from '~/composables/useUser'

// Default root ID
const ROOT_ID = 'root'

// Initial state
const state = ref<FileSystemState>({
  nodes: {
    [ROOT_ID]: {
      id: ROOT_ID,
      name: 'Macintosh HD',
      type: 'folder',
      parentId: null,
      childrenIds: [],
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      size: 0,
      isSystem: true
    } as FolderNode
  },
  rootId: ROOT_ID
})

let isInitialized = false

export function useFileSystem() {
  const { isAuthenticated } = useUser()

  const generateId = (): string => {
    return typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2, 11)
  }

  const convertFromDb = (dbNode: any): FileNode => {
    const node: any = {
      id: dbNode.id,
      name: dbNode.name,
      type: dbNode.type,
      parentId: dbNode.parent_id,
      createdAt: new Date(dbNode.created_at).getTime(),
      modifiedAt: new Date(dbNode.updated_at).getTime(),
      size: dbNode.size || 0,
      content: dbNode.content,
      isSystem: dbNode.is_system === 1
    }
    if (node.type === 'folder') {
      node.childrenIds = []
    }
    return node
  }

  const convertToDb = (node: FileNode) => {
    return {
      id: node.id,
      parent_id: node.parentId,
      name: node.name,
      type: node.type,
      content: node.content || null,
      size: node.size || 0,
      is_system: node.isSystem ? 1 : 0
    }
  }

  const syncNode = async (node: FileNode) => {
    if (isAuthenticated.value && !node.isSystem) {
      try {
        await $fetch('/api/files', {
          method: 'POST',
          body: { node: convertToDb(node) }
        })
      } catch (e) {
        console.error('Failed to sync node:', e)
      }
    }
  }

  const removeNodeFromServer = async (id: string) => {
    if (isAuthenticated.value) {
      try {
        const node = state.value.nodes[id]
        if (node && !node.isSystem) {
          await $fetch(`/api/files/${id}`, { method: 'DELETE' })
        }
      } catch (e) {
        console.error('Failed to delete node from server:', e)
      }
    }
  }

  const fetchFilesFromServer = async () => {
    if (!isAuthenticated.value) return
    try {
      const response = await $fetch<{ files: any[] }>('/api/files')
      const files = response.files
      if (files && files.length > 0) {
        // We keep system nodes and the root
        const newNodes: Record<string, FileNode> = {}

        // Preserve system nodes and root
        Object.values(state.value.nodes).forEach(node => {
          if (node.isSystem || node.id === ROOT_ID) {
            newNodes[node.id] = { ...node }
            if (node.type === 'folder') {
              (newNodes[node.id] as FolderNode).childrenIds = (node as FolderNode).childrenIds.filter(childId => {
                const child = state.value.nodes[childId]
                return child && child.isSystem
              })
            }
          }
        })

        // Add nodes from server
        files.forEach(f => {
          const node = convertFromDb(f)
          newNodes[node.id] = node
        })

        // Rebuild childrenIds
        Object.values(newNodes).forEach(node => {
          if (node.parentId && newNodes[node.parentId] && newNodes[node.parentId].type === 'folder') {
            const parent = newNodes[node.parentId] as FolderNode
            if (!parent.childrenIds.includes(node.id)) {
              parent.childrenIds.push(node.id)
            }
          }
        })

        state.value.nodes = newNodes
      }
    } catch (e) {
      console.error('Failed to fetch files:', e)
    }
  }

  const createNode = (
    name: string,
    type: FileNodeType,
    parentId: string,
    additionalProps: Partial<FileNode> = {}
  ): FileNode => {
    const id = generateId()
    const now = Date.now()

    const newNode: FileNode = {
      id,
      name,
      type,
      parentId,
      createdAt: now,
      modifiedAt: now,
      size: 0,
      ...additionalProps
    }

    if (type === 'folder') {
      (newNode as FolderNode).childrenIds = []
    }

    state.value.nodes[id] = newNode

    // Add to parent
    const parent = state.value.nodes[parentId] as FolderNode
    if (parent && parent.type === 'folder') {
      parent.childrenIds.push(id)
      parent.modifiedAt = now

      // Sync parent if not system
      if (!parent.isSystem) {
        syncNode(parent)
      }
    }

    // Sync new node
    syncNode(newNode)

    return newNode
  }

  const createFile = (name: string, parentId: string, content: string = ''): FileNode => {
    return createNode(name, 'file', parentId, { content, size: content.length })
  }

  const createFolder = (name: string, parentId: string): FolderNode => {
    return createNode(name, 'folder', parentId) as FolderNode
  }

  const initialize = async () => {
    if (isInitialized) return
    isInitialized = true

    const rootId = state.value.rootId

    // System Folder
    const systemFolder = createFolder('System Folder', rootId)
    systemFolder.isSystem = true

    createFile('Finder', systemFolder.id, 'Finder System File').isSystem = true
    createFile('System', systemFolder.id, 'System Resources').isSystem = true
    createFolder('Control Panels', systemFolder.id).isSystem = true
    createFolder('Extensions', systemFolder.id).isSystem = true
    createFolder('Preferences', systemFolder.id).isSystem = true

    // Applications
    const appsFolder = createFolder('Applications', rootId)
    createNode('Calculator', 'application', appsFolder.id, { icon: 'calculator' })
    createNode('SimpleText', 'application', appsFolder.id, { icon: 'simpletext' })
    createNode('NotePad', 'application', appsFolder.id, { icon: 'notepad' })

    // Documents
    const docsFolder = createFolder('Documents', rootId)
    createFile('Read Me', docsFolder.id, 'Welcome to Mac OS 7 Web Clone!')

    // Trash
    const trashFolder = createFolder('Trash', rootId)
    trashFolder.isSystem = true

    // Fetch from server if authenticated
    if (isAuthenticated.value) {
      await fetchFilesFromServer()
    }
  }
  const getRoot = (): FolderNode => {
    return state.value.nodes[state.value.rootId] as FolderNode
  }

  const getNode = (id: string): FileNode | undefined => {
    return state.value.nodes[id]
  }

  const getChildren = (folderId: string): FileNode[] => {
    const folder = state.value.nodes[folderId] as FolderNode
    if (!folder || folder.type !== 'folder') return []
    return folder.childrenIds
      .map(id => state.value.nodes[id])
      .filter(Boolean) as FileNode[]
  }

  const deleteNode = (id: string): void => {
    const node = state.value.nodes[id]
    if (!node || node.isSystem) return

    // Remove from parent
    if (node.parentId) {
      const parent = state.value.nodes[node.parentId] as FolderNode
      if (parent) {
        parent.childrenIds = parent.childrenIds.filter(childId => childId !== id)
        parent.modifiedAt = Date.now()

        // Sync parent
        if (!parent.isSystem) {
          syncNode(parent)
        }
      }
    }

    // If folder, recursively delete children
    if (node.type === 'folder') {
      const folder = node as FolderNode
      [...folder.childrenIds].forEach(childId => deleteNode(childId))
    }

    // Remove from server
    removeNodeFromServer(id)

    delete state.value.nodes[id]
  }

  const renameNode = (id: string, newName: string): void => {
    const node = state.value.nodes[id]
    if (!node) return
    node.name = newName
    node.modifiedAt = Date.now()

    // Sync node
    syncNode(node)
  }

  const moveNode = (id: string, newParentId: string): void => {
    const node = state.value.nodes[id]
    if (!node || node.isSystem) return
    if (node.parentId === newParentId) return

    const oldParentId = node.parentId
    const now = Date.now()

    // Remove from old parent
    if (oldParentId) {
      const oldParent = state.value.nodes[oldParentId] as FolderNode
      if (oldParent) {
        oldParent.childrenIds = oldParent.childrenIds.filter(childId => childId !== id)
        oldParent.modifiedAt = now

        // Sync old parent
        if (!oldParent.isSystem) {
          syncNode(oldParent)
        }
      }
    }

    // Add to new parent
    const newParent = state.value.nodes[newParentId] as FolderNode
    if (newParent && newParent.type === 'folder') {
      newParent.childrenIds.push(id)
      newParent.modifiedAt = now
      node.parentId = newParentId
      node.modifiedAt = now

      // Sync new parent
      if (!newParent.isSystem) {
        syncNode(newParent)
      }

      // Sync node
      syncNode(node)
    }
  }

  const getNodeByPath = (path: string): FileNode | undefined => {
    const parts = path.split('/').filter(Boolean)
    if (parts.length === 0) return undefined

    // Check if path starts with root name
    const root = getRoot()
    if (parts[0] !== root.name) return undefined

    if (parts.length === 1) return root

    let current: FileNode | undefined = root
    for (let i = 1; i < parts.length; i++) {
      if (!current || current.type !== 'folder') return undefined
      const children = getChildren(current.id)
      current = children.find(child => child.name === parts[i])
    }

    return current
  }

  return {
    state: readonly(state),
    initialize,
    getRoot,
    getNode,
    getChildren,
    createFile,
    createFolder,
    deleteNode,
    renameNode,
    moveNode,
    getNodeByPath,
    fetchFilesFromServer
  }
}
