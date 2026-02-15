import { defineEventHandler, getRouterParam, createError } from 'h3';
import { requireUserId } from '../../utils/auth';
import { deleteFile, getFile } from '../../utils/filesystem';

export default defineEventHandler(async (event) => {
  const userId = requireUserId(event);
  const id = getRouterParam(event, 'id');
  
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Node ID is required',
    });
  }
  
  const node = getFile(id);
  if (!node) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Node not found',
    });
  }
  
  if (node.owner_id !== userId) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
    });
  }
  
  deleteFile(id);
  
  return {
    success: true
  };
});
