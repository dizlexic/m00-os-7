import { defineEventHandler, readBody, createError } from 'h3';
import { requireUserId } from '../../utils/auth';
import { saveSettings } from '../../utils/settings';

export default defineEventHandler(async (event) => {
  const userId = requireUserId(event);
  const body = await readBody(event);

  if (!body.settings) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Settings are required',
    });
  }

  saveSettings(userId, body.settings);

  return {
    success: true
  };
});
