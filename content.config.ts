import { defineContentConfig, defineCollection } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    articles: defineCollection({
      type: 'page',
      source: 'articles/**'
    }),
    help: defineCollection({
      type: 'page',
      source: 'help/**'
    })
  }
})
