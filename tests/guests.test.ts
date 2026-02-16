import { describe, it, expect } from 'vitest';
import { generateGuestName, registerGuest, getGuestById } from '../server/utils/guests';

describe('Guest Management', () => {
  it('should generate a guest name with three parts', () => {
    const name = generateGuestName();
    const parts = name.split(' ');
    expect(parts.length).toBe(3);
    expect(typeof parts[0]).toBe('string');
    expect(typeof parts[1]).toBe('string');
    expect(parseInt(parts[2])).toBeGreaterThanOrEqual(100);
    expect(parseInt(parts[2])).toBeLessThanOrEqual(999);
  });

  it('should generate different names', () => {
    const name1 = generateGuestName();
    const name2 = generateGuestName();
    // There is a small chance they are equal, but very low with 900 suffixes and many adj/nouns
    expect(name1).not.toBe(name2);
  });

  it('should register and retrieve a guest', () => {
    const guest = registerGuest();
    expect(guest.id).toMatch(/^user-/);
    expect(guest.username).toBeDefined();
    
    const retrieved = getGuestById(guest.id);
    expect(retrieved).toEqual(guest);
  });

  it('should register a guest with a specific name', () => {
    const name = 'Custom Guest';
    const guest = registerGuest(name);
    expect(guest.username).toBe(name);
  });
});
