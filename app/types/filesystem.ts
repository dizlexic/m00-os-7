/**
 * Virtual Filesystem Types
 */

export type FileNodeType = 'file' | 'folder' | 'application' | 'alias' | 'markdown' | 'image';

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
  label?: number; // 0-7
}

export interface FolderNode extends FileNode {
  type: 'folder';
  childrenIds: string[];
}

export interface FileSystemState {
  nodes: Record<string, FileNode>;
  rootId: string;
}

export const LABEL_COLORS = [
  'transparent',
  '#FF8000', // Orange
  '#FF0000', // Red
  '#FF00FF', // Pink
  '#00FFFF', // Light Blue
  '#0000FF', // Dark Blue
  '#8000FF', // Purple
  '#00FF00'  // Green
];

export const LABEL_NAMES = [
  'None',
  'Essential',
  'Hot',
  'In-Progress',
  'Cool',
  'Personal',
  'Project 1',
  'Project 2'
];
