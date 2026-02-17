import { randomUUID } from 'node:crypto'

/**
 * Generate a unique UUID v4 string.
 * 
 * @returns A string in UUID v4 format
 */
export function generateUUID(): string {
  return randomUUID()
}
