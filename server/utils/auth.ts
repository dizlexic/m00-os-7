import { H3Event, getCookie, createError } from 'h3';

/**
 * Get the current user ID from the session cookie.
 * 
 * @param event - The H3 event
 * @returns The user ID
 * @throws {Error} if the user is not authenticated
 */
export function requireUserId(event: H3Event): number {
  const userId = getCookie(event, 'user_id');
  
  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Not authenticated',
    });
  }
  
  return parseInt(userId, 10);
}

/**
 * Check if a user is authenticated.
 * 
 * @param event - The H3 event
 * @returns true if authenticated
 */
export function isAuthenticated(event: H3Event): boolean {
  return !!getCookie(event, 'user_id');
}
