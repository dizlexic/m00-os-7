import { defineEventHandler, readBody, createError } from 'h3';
import { createUser, getUserByName } from '../../utils/users';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { username, password } = body;

  if (!username || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Username and password are required',
    });
  }

  if (username.length < 3) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Username must be at least 3 characters long',
    });
  }

  if (password.length < 4) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Password must be at least 4 characters long',
    });
  }

  const existingUser = getUserByName(username);
  if (existingUser) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Username already exists',
    });
  }

  try {
    const userId = createUser(username, password);
    return {
      success: true,
      userId
    };
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create user',
    });
  }
});
