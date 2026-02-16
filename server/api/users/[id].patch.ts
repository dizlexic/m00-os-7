import { defineEventHandler, readBody, createError } from 'h3';
import { updateUser, getUserById } from '../../utils/users';

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id;
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing user ID'
    });
  }

  const userId = parseInt(id);
  if (isNaN(userId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid user ID'
    });
  }

  const body = await readBody(event);
  
  // Only allow updating certain fields
  const allowedFields = ['username', 'avatar', 'role'];
  const updateData: any = {};
  
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateData[field] = body[field];
    }
  }

  if (Object.keys(updateData).length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No valid fields to update'
    });
  }

  const success = updateUser(userId, updateData);
  
  if (!success) {
    throw createError({
      statusCode: 404,
      statusMessage: 'User not found or update failed'
    });
  }

  const updatedUser = getUserById(userId);
  if (updatedUser) {
    const { password_hash, ...userWithoutPassword } = updatedUser;
    return {
      user: userWithoutPassword
    };
  }

  return { success: true };
});
