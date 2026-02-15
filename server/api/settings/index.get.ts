import { defineEventHandler } from 'h3';
import { requireUserId } from '../../utils/auth';
import { getSettings } from '../../utils/settings';

export default defineEventHandler(async (event) => {
  const userId = requireUserId(event);
  const settings = getSettings(userId);
  
  return {
    settings
  };
});
