import { defineEventHandler, readBody, createError } from 'h3';
import { getUserByName, validatePassword } from '../../utils/users';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { username, password } = body;

  if (!username || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Username and password are required',
    });
  }

  const user = getUserByName(username);

  if (!user || !validatePassword(password, user.password_hash)) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid username or password',
    });
  }

  // In a real app, we would set a session cookie here
  // For now, we just return the user info
  return {
    user: {
      id: user.id,
      username: user.username,
    },
  };
});
