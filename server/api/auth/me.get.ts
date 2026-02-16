import { defineEventHandler, getCookie } from 'h3';
import { getUserById } from '../../utils/users';
import { getGuestById } from '../../utils/guests';

export default defineEventHandler(async (event) => {
  const userId = getCookie(event, 'user_id');

  if (!userId) {
    return { user: null };
  }

  // Check if it's a guest ID
  if (userId.startsWith('user-')) {
    const guest = getGuestById(userId);
    if (guest) {
      return {
        user: {
          id: guest.id,
          username: guest.username,
          isGuest: true
        }
      };
    }
  }

  // Otherwise check database
  const user = getUserById(parseInt(userId, 10));

  if (!user) {
    return { user: null };
  }

  return {
    user: {
      id: user.id,
      username: user.username,
    },
  };
});
