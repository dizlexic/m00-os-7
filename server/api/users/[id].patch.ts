import { defineEventHandler, readBody, createError } from 'h3';
import { updateUser, getUserById } from '../../utils/users';
import { requireUserId } from '../../utils/auth';

export default defineEventHandler(async (event) => {
  const currentUserId = requireUserId(event);
  const currentUser = getUserById(currentUserId);
  
  const id = event.context.params?.id;
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing user ID'
    });
  }

  const targetUserId = parseInt(id);
  if (isNaN(targetUserId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid user ID'
    });
  }

  // Permission check: Only admin or self can update
  if (!currentUser || (currentUser.role !== 'admin' && currentUserId !== targetUserId)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden: You do not have permission to update this user'
    });
  }

  const body = await readBody(event);
  
  // Only allow updating certain fields
  const allowedFields = ['username', 'avatar', 'role'];
  const updateData: any = {};
  
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      // Only admin can update role
      if (field === 'role' && currentUser.role !== 'admin') {
        continue;
      }
      updateData[field] = body[field];
    }
  }

  if (Object.keys(updateData).length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No valid fields to update'
    });
  }

  const success = updateUser(targetUserId, updateData);
  
  if (!success) {
    throw createError({
      statusCode: 404,
      statusMessage: 'User not found or update failed'
    });
  }

  const updatedUser = getUserById(targetUserId);
  if (updatedUser) {
    const { password_hash, ...userWithoutPassword } = updatedUser;
    return {
      user: userWithoutPassword
    };
  }

  return { success: true };
});
