import { defineEventHandler, readBody, createError, getCookie } from 'h3';
import { updateUser, getUserById } from '../../utils/users';

export default defineEventHandler(async (event) => {
  const userId = getCookie(event, 'user_id');

  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  // Guest users cannot update their profile in the database
  if (userId.startsWith('user-')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Guest users cannot update profile',
    });
  }

  const body = await readBody(event);
  const { username, password, avatar } = body;

  const id = parseInt(userId, 10);

  try {
    const success = updateUser(id, {
      username,
      password_plain: password,
      avatar
    });

    if (!success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No changes provided or update failed',
      });
    }

    const user = getUserById(id);

    return {
      user: {
        id: user!.id,
        username: user!.username,
        avatar: user!.avatar
      },
    };
  } catch (e: any) {
    if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw createError({
        statusCode: 409,
        statusMessage: 'Username already taken',
      });
    }
    throw e;
  }
});
