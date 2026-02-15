export default defineNuxtPlugin(() => {
  const csrfToken = useCookie('csrf_token')

  // Use a custom fetch instance that includes the CSRF token
  // and assign it back to globalThis.$fetch to support existing code
  const originalFetch = globalThis.$fetch

  if (typeof originalFetch === 'function') {
    globalThis.$fetch = (async (request: any, options: any = {}) => {
      if (csrfToken.value) {
        const headers = { ...(options.headers || {}) } as Record<string, string>
        headers['x-csrf-token'] = csrfToken.value
        options.headers = headers
      }
      return originalFetch(request, options)
    }) as typeof originalFetch
  }
})
