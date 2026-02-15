import { defineEventHandler, readBody } from 'h3';
import { requireUserId } from '../../utils/auth';
import { saveFile } from '../../utils/filesystem';

export default defineEventHandler(async (event) => {
  const userId = requireUserId(event);
  const body = await readBody(event);

  const { node } = body;

  if (!node || !node.id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Node data is required',
    });
  }

  // Ensure the user owns the node
  node.owner_id = userId;

  saveFile(node);

  return {
    success: true
  };
});
