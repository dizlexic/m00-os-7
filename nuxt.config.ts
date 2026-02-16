// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  
  // Enable Vue devtools
  devtools: { enabled: true },

  // Configure modules
  modules: [
    '@nuxt/ui',
    '@nuxt/content',
    '@nuxt/image',
    '@nuxt/a11y',
    '@nuxt/eslint',
    '@nuxt/scripts'
  ],

  // TypeScript configuration with strict mode
  typescript: {
    strict: true,
    typeCheck: false // Disabled for faster builds, run `npm run typecheck` separately
  },

  // App configuration
  app: {
    head: {
      title: 'm00-os-7 - Mac OS 7 Web Clone',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'A faithful recreation of Apple Macintosh System 7 as a web application' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  },

  // Runtime configuration
  runtimeConfig: {
    // Private keys (server-side only)
    secretKey: '',
    // Public keys (exposed to client)
    public: {
      appName: 'm00-os-7',
      appVersion: '0.1.0'
    }
  },

  // CSS configuration
  css: [
    '~/assets/css/main.css'
  ],

  // Nuxt UI configuration
  ui: {
    // Disable default Tailwind colors to use custom Mac OS 7 palette
  },

  // Content module configuration
  content: {
    // Content configuration for articles and help docs
  },

  // Image optimization configuration
  image: {
    // Image optimization settings
  },

  // Nitro server configuration
  nitro: {
    experimental: {
      // Enable WebSocket support for STC (Share the Computer) mode
      websocket: true
    }
  }
})
