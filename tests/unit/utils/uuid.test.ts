import { describe, it, expect } from 'vitest'
import { generateUUID } from '~/utils/uuid'

describe('generateUUID', () => {
  it('should generate a string of 36 characters', () => {
    const uuid = generateUUID()
    expect(uuid).toHaveLength(36)
  })

  it('should generate a valid UUID v4 format', () => {
    const uuid = generateUUID()
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    expect(uuid).toMatch(uuidV4Regex)
  })

  it('should generate unique UUIDs', () => {
    const uuids = new Set()
    for (let i = 0; i < 1000; i++) {
      uuids.add(generateUUID())
    }
    expect(uuids.size).toBe(1000)
  })
})
