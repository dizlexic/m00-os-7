import { defineEventHandler, readBody } from 'h3';
import { requireAdmin } from '../../utils/auth';
import { setSystemSetting } from '../../utils/systemSettings';

export default defineEventHandler(async (event) => {
  requireAdmin(event);
  const body = await readBody(event);
  
  if (body.allowGuestLogin !== undefined) {
    setSystemSetting('allow_guest_login', body.allowGuestLogin ? 'true' : 'false');
  }
  
  return {
    success: true
  };
});
