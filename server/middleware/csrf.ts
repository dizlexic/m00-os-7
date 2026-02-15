import { defineEventHandler, getCookie, setCookie, getHeader, createError } from 'h3';

export default defineEventHandler((event) => {
  const method = event.method;
  const isStateChanging = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

  // Get existing CSRF token from cookie
  let csrfToken = getCookie(event, 'csrf_token');

  // If no token exists, generate one (simple random string for now)
  if (!csrfToken) {
    csrfToken = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
    setCookie(event, 'csrf_token', csrfToken, {
      httpOnly: false, // Must be accessible by client to read and send back as header
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });
  }

  // Validate token for state-changing requests
  if (isStateChanging) {
    const headerToken = getHeader(event, 'x-csrf-token');

    if (!headerToken || headerToken !== csrfToken) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Invalid or missing CSRF token',
      });
    }
  }
});
