/**
 * Virtual Filesystem Types
 */

export type FileNodeType = 'file' | 'folder' | 'application' | 'alias';

export interface FileNode {
  id: string;
  name: string;
  type: FileNodeType;
  parentId: string | null;
  content?: string; // For text files
  icon?: string; // Custom icon name
  createdAt: number;
  modifiedAt: number;
  size: number;
  isReadOnly?: boolean;
  isSystem?: boolean;
  metadata?: Record<string, any>;
}

export interface FolderNode extends FileNode {
  type: 'folder';
  childrenIds: string[];
}

export interface FileSystemState {
  nodes: Record<string, FileNode>;
  rootId: string;
}
