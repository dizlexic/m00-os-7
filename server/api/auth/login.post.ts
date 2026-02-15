import { defineEventHandler, readBody, createError, setCookie } from 'h3';
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

  // Set a session cookie
  setCookie(event, 'user_id', user.id.toString(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7 // 1 week
  });

  return {
    user: {
      id: user.id,
      username: user.username,
    },
  };
});
