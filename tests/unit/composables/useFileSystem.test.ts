import { describe, it, expect, beforeEach } from 'vitest'
import { useFileSystem } from '~/composables/useFileSystem'

describe('useFileSystem', () => {
  let fs: ReturnType<typeof useFileSystem>

  beforeEach(() => {
    fs = useFileSystem()
  })

  it('should have a root directory', () => {
    const root = fs.getRoot()
    expect(root).toBeDefined()
    expect(root.type).toBe('folder')
    expect(root.name).toBe('Macintosh HD')
  })

  it('should create a folder', () => {
    const root = fs.getRoot()
    const folder = fs.createFolder('New Folder', root.id)
    
    expect(folder).toBeDefined()
    expect(folder.name).toBe('New Folder')
    expect(folder.parentId).toBe(root.id)
    expect(fs.getNode(folder.id)).toEqual(folder)
    
    const updatedRoot = fs.getNode(root.id) as any
    expect(updatedRoot.childrenIds).toContain(folder.id)
  })

  it('should create a file', () => {
    const root = fs.getRoot()
    const file = fs.createFile('Document.txt', root.id, 'Hello World')
    
    expect(file).toBeDefined()
    expect(file.name).toBe('Document.txt')
    expect(file.content).toBe('Hello World')
    expect(fs.getNode(file.id)).toEqual(file)
  })

  it('should delete a node', () => {
    const root = fs.getRoot()
    const folder = fs.createFolder('To Delete', root.id)
    
    fs.deleteNode(folder.id)
    
    expect(fs.getNode(folder.id)).toBeUndefined()
    const updatedRoot = fs.getNode(root.id) as any
    expect(updatedRoot.childrenIds).not.toContain(folder.id)
  })

  it('should rename a node', () => {
    const root = fs.getRoot()
    const folder = fs.createFolder('Old Name', root.id)
    
    fs.renameNode(folder.id, 'New Name')
    
    const updatedFolder = fs.getNode(folder.id)
    expect(updatedFolder?.name).toBe('New Name')
  })

  it('should move a node', () => {
    const root = fs.getRoot()
    const folder1 = fs.createFolder('Folder 1', root.id)
    const folder2 = fs.createFolder('Folder 2', root.id)
    const file = fs.createFile('File.txt', folder1.id)
    
    fs.moveNode(file.id, folder2.id)
    
    const updatedFile = fs.getNode(file.id)
    expect(updatedFile?.parentId).toBe(folder2.id)
    
    const updatedFolder1 = fs.getNode(folder1.id) as any
    const updatedFolder2 = fs.getNode(folder2.id) as any
    expect(updatedFolder1.childrenIds).not.toContain(file.id)
    expect(updatedFolder2.childrenIds).toContain(file.id)
  })

  it('should copy a node', () => {
    const root = fs.getRoot()
    const folder1 = fs.createFolder('Folder 1', root.id)
    const folder2 = fs.createFolder('Folder 2', root.id)
    const file = fs.createFile('File.txt', folder1.id, 'Original Content')
    
    const copiedNodeId = fs.copyNode(file.id, folder2.id)
    
    expect(copiedNodeId).toBeDefined()
    expect(copiedNodeId).not.toBe(file.id)
    
    const copiedFile = fs.getNode(copiedNodeId!)
    expect(copiedFile?.name).toBe('File.txt')
    expect(copiedFile?.parentId).toBe(folder2.id)
    expect((copiedFile as any).content).toBe('Original Content')
    
    const updatedFolder2 = fs.getNode(folder2.id) as any
    expect(updatedFolder2.childrenIds).toContain(copiedNodeId)
    
    // Original file should still exist in original location
    const originalFile = fs.getNode(file.id)
    expect(originalFile).toBeDefined()
    expect(originalFile?.parentId).toBe(folder1.id)
  })

  it('should copy a folder recursively', () => {
    const root = fs.getRoot()
    const sourceFolder = fs.createFolder('Source', root.id)
    const subFolder = fs.createFolder('Sub', sourceFolder.id)
    const file = fs.createFile('File.txt', subFolder.id, 'Content')
    const targetFolder = fs.createFolder('Target', root.id)
    
    const copiedFolderId = fs.copyNode(sourceFolder.id, targetFolder.id)
    
    expect(copiedFolderId).toBeDefined()
    const copiedFolder = fs.getNode(copiedFolderId!) as any
    expect(copiedFolder.name).toBe('Source')
    expect(copiedFolder.childrenIds.length).toBe(1)
    
    const copiedSubFolderId = copiedFolder.childrenIds[0]
    const copiedSubFolder = fs.getNode(copiedSubFolderId) as any
    expect(copiedSubFolder.name).toBe('Sub')
    expect(copiedSubFolder.childrenIds.length).toBe(1)
    
    const copiedFileId = copiedSubFolder.childrenIds[0]
    const copiedFile = fs.getNode(copiedFileId) as any
    expect(copiedFile.name).toBe('File.txt')
    expect(copiedFile.content).toBe('Content')
  })

  it('should get node by path', () => {
    const root = fs.getRoot()
    const folder = fs.createFolder('System Folder', root.id)
    const file = fs.createFile('Finder', folder.id)
    
    const foundNode = fs.getNodeByPath('Macintosh HD/System Folder/Finder')
    expect(foundNode?.id).toBe(file.id)
  })

  it('should initialize with default structure', async () => {
    await fs.initialize()
    
    const systemFolder = fs.getNodeByPath('Macintosh HD/System Folder')
    expect(systemFolder).toBeDefined()
    expect(systemFolder?.type).toBe('folder')
    
    const finder = fs.getNodeByPath('Macintosh HD/System Folder/Finder')
    expect(finder).toBeDefined()
    expect(finder?.type).toBe('file')
    
    const calculator = fs.getNodeByPath('Macintosh HD/Applications/Calculator')
    expect(calculator).toBeDefined()
    expect(calculator?.type).toBe('application')
  })
})
