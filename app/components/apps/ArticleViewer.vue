<script setup lang="ts">
/**
 * Article Viewer Component
 *
 * Displays Markdown content from @nuxt/content.
 * Used for Readme files and other articles.
 */

interface Props {
  path?: string
}

const props = defineProps<Props>()

// Default to 'welcome' if no path provided
const articlePath = computed(() => props.path || 'articles/welcome')

const { data: article } = await useAsyncData(`article-${articlePath.value}`, () => {
  return queryContent(articlePath.value).findOne()
})
</script>

<template>
  <div class="article-viewer mac-scrollbar selectable">
    <div v-if="article" class="article-viewer__content">
      <h1 v-if="article.title" class="article-viewer__title">{{ article.title }}</h1>
      <div v-if="article.author || article.date" class="article-viewer__meta">
        <span v-if="article.author">By {{ article.author }}</span>
        <span v-if="article.author && article.date"> • </span>
        <span v-if="article.date">{{ new Date(article.date).toLocaleDateString() }}</span>
      </div>
      <div class="article-viewer__body">
        <ContentRenderer :value="article" />
      </div>
    </div>
    <div v-else class="article-viewer__error">
      <p>Article not found.</p>
    </div>
  </div>
</template>

<style scoped>
.article-viewer {
  background-color: var(--color-white);
  height: 100%;
  overflow-y: auto;
  padding: var(--spacing-lg);
  font-family: var(--font-system);
  color: var(--color-black);
}

.article-viewer__title {
  font-size: var(--font-size-xl);
  font-weight: bold;
  margin-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--color-black);
  padding-bottom: var(--spacing-sm);
}

.article-viewer__meta {
  font-size: var(--font-size-xs);
  color: var(--color-gray-dark);
  margin-bottom: var(--spacing-lg);
}

.article-viewer__body :deep(h2) {
  font-size: var(--font-size-lg);
  font-weight: bold;
  margin-top: var(--spacing-lg);
  margin-bottom: var(--spacing-sm);
}

.article-viewer__body :deep(h3) {
  font-size: var(--font-size-md);
  font-weight: bold;
  margin-top: var(--spacing-md);
  margin-bottom: var(--spacing-xs);
}

.article-viewer__body :deep(p) {
  margin-bottom: var(--spacing-md);
  line-height: var(--line-height-relaxed);
}

.article-viewer__body :deep(ul), .article-viewer__body :deep(ol) {
  margin-bottom: var(--spacing-md);
  padding-left: var(--spacing-xl);
}

.article-viewer__body :deep(li) {
  margin-bottom: var(--spacing-xs);
}

.article-viewer__body :deep(strong) {
  font-weight: bold;
}

.article-viewer__body :deep(em) {
  font-style: italic;
}

.article-viewer__body :deep(code) {
  background-color: var(--color-gray-light);
  padding: 0 4px;
  font-family: monospace;
}
</style>
