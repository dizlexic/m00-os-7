import { H3Event, getCookie, createError } from 'h3';
import { getUserById } from './users';

/**
 * Get the current user ID from the session cookie.
 *
 * @param event - The H3 event
 * @returns The user ID (number for registered users, string for guests)
 * @throws {Error} if the user is not authenticated
 */
export function requireUserId(event: H3Event): number | string {
  const userId = getCookie(event, 'user_id');

  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Not authenticated',
    });
  }

  // Handle guest IDs
  if (userId.startsWith('user-')) {
    return userId;
  }

  return parseInt(userId, 10);
}

/**
 * Check if a user is an admin.
 *
 * @param event - The H3 event
 * @throws {Error} if the user is not an admin
 */
export function requireAdmin(event: H3Event): void {
  const userId = requireUserId(event);
  const user = getUserById(userId);

  if (!user || user.role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden: Admin access required',
    });
  }
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
