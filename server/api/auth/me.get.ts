import { defineEventHandler, getCookie } from 'h3';
import { getUserById } from '../../utils/users';

export default defineEventHandler(async (event) => {
  const userId = getCookie(event, 'user_id');
  
  if (!userId) {
    return { user: null };
  }
  
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
