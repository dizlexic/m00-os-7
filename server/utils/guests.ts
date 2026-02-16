import { generateUserId } from './stc';

interface GuestUser {
  id: string;
  username: string;
  createdAt: number;
}

const guests = new Map<string, GuestUser>();

const ADJECTIVES = [
  'Happy', 'Classic', 'Retro', 'Vintage', 'Speedy',
  'Cool', 'Bright', 'Golden', 'Silver', 'Magic',
  'Swift', 'Bold', 'Silent', 'Friendly', 'Pixel'
];

const NOUNS = [
  'Mac', 'User', 'Voyager', 'Pioneer', 'Surfer',
  'Explorer', 'Fan', 'Wizard', 'Artist', 'Pilot',
  'Desktop', 'Finder', 'Apple', 'System', 'Buddy'
];

/**
 * Generate a friendly guest name that is not currently in use
 */
export function generateGuestName(): string {
  let name = '';
  let isUnique = false;
  let attempts = 0;

  while (!isUnique && attempts < 10) {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    const suffix = Math.floor(Math.random() * 900) + 100; // 100-999
    name = `${adj} ${noun} ${suffix}`;
    
    // Check if name is already in use by an active guest
    isUnique = true;
    for (const guest of guests.values()) {
      if (guest.username === name) {
        isUnique = false;
        break;
      }
    }
    attempts++;
  }
  
  return name;
}

/**
 * Register a new guest
 */
export function registerGuest(username?: string): GuestUser {
  const id = generateUserId(); // Uses the utility from stc.ts
  const name = username || generateGuestName();

  const guest: GuestUser = {
    id,
    username: name,
    createdAt: Date.now()
  };

  guests.set(id, guest);
  return guest;
}

/**
 * Get guest by ID
 */
export function getGuestById(id: string): GuestUser | undefined {
  return guests.get(id);
}

/**
 * Remove guest
 */
export function removeGuest(id: string): boolean {
  return guests.delete(id);
}

/**
 * Clean up old guests (e.g., older than 24 hours)
 */
export function cleanupGuests(maxAgeMs: number = 24 * 60 * 60 * 1000): void {
  const now = Date.now();
  for (const [id, guest] of guests) {
    if (now - guest.createdAt > maxAgeMs) {
      guests.delete(id);
    }
  }
}
