import { ref, readonly } from 'vue'
import type { FileNode, FolderNode, FileSystemState, FileNodeType } from '~/types/filesystem'

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
  const generateId = (): string => {
    return typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2, 11)
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
    }

    return newNode
  }

  const createFile = (name: string, parentId: string, content: string = ''): FileNode => {
    return createNode(name, 'file', parentId, { content, size: content.length })
  }

  const createFolder = (name: string, parentId: string): FolderNode => {
    return createNode(name, 'folder', parentId) as FolderNode
  }

  const initialize = () => {
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
      }
    }

    // If folder, recursively delete children
    if (node.type === 'folder') {
      const folder = node as FolderNode
      [...folder.childrenIds].forEach(childId => deleteNode(childId))
    }

    delete state.value.nodes[id]
  }

  const renameNode = (id: string, newName: string): void => {
    const node = state.value.nodes[id]
    if (!node) return
    node.name = newName
    node.modifiedAt = Date.now()
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
      }
    }

    // Add to new parent
    const newParent = state.value.nodes[newParentId] as FolderNode
    if (newParent && newParent.type === 'folder') {
      newParent.childrenIds.push(id)
      newParent.modifiedAt = now
      node.parentId = newParentId
      node.modifiedAt = now
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
    getNodeByPath
  }
}
