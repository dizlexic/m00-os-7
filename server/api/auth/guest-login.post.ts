import { defineEventHandler, setCookie } from 'h3';
import { registerGuest } from '../../utils/guests';

export default defineEventHandler(async (event) => {
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
