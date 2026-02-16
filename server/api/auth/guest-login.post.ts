import { defineEventHandler, setCookie, createError } from 'h3';
import { registerGuest } from '../../utils/guests';
import { getSystemSetting } from '../../utils/systemSettings';

export default defineEventHandler(async (event) => {
  const allowGuest = getSystemSetting('allow_guest_login') !== 'false';
  if (!allowGuest) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Guest login is disabled'
    });
  }

  const guest = registerGuest();

  // Set a session cookie
  // We use the same 'user_id' cookie name but it will contain the guest ID (string starting with 'user-')
  setCookie(event, 'user_id', guest.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 // 1 day for guests
  });

  return {
    user: {
      id: guest.id,
      username: guest.username,
      isGuest: true
    },
  };
});
