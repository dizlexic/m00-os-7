import { defineEventHandler, createError, getRouterParam } from 'h3';
import { deleteUser, getUserById } from '../../utils/users';
import { requireAdmin, requireUserId } from '../../utils/auth';

export default defineEventHandler(async (event) => {
  requireAdmin(event);
  const currentUserId = requireUserId(event);

  const idParam = getRouterParam(event, 'id');
  const id = parseInt(idParam || '', 10);

  if (isNaN(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid user ID',
    });
  }

  // Prevent deleting self
  if (id === currentUserId) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Cannot delete your own account',
    });
  }

  const user = getUserById(id);
  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: 'User not found',
    });
  }

  // Prevent deleting Admin user
  if (user.username === 'Admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Cannot delete Admin user',
    });
  }

  const success = deleteUser(id);
  if (!success) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete user',
    });
  }

  return {
    success: true
  };
});
