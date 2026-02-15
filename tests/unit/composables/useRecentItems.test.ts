import { describe, it, expect, beforeEach } from 'vitest'
import { useRecentItems } from '~/composables/useRecentItems'

describe('useRecentItems', () => {
  beforeEach(() => {
    const { clearRecentItems } = useRecentItems()
    clearRecentItems()
  })

  it('should add a recent application', () => {
    const { addRecentApp, recentApps } = useRecentItems()
    
    addRecentApp({
      id: 'calculator',
      name: 'Calculator',
      type: 'calculator',
      icon: '/assets/icons/apps/calculator.png'
    })

    expect(recentApps.value).toHaveLength(1)
    expect(recentApps.value[0].name).toBe('Calculator')
  })

  it('should add a recent document', () => {
    const { addRecentDoc, recentDocs } = useRecentItems()
    
    addRecentDoc({
      id: 'doc-1',
      name: 'README.txt',
      type: 'file',
      icon: '/assets/icons/system/document.png'
    })

    expect(recentDocs.value).toHaveLength(1)
    expect(recentDocs.value[0].name).toBe('README.txt')
  })

  it('should not add duplicate items (move to top instead)', () => {
    const { addRecentApp, recentApps } = useRecentItems()
    
    addRecentApp({ id: 'calculator', name: 'Calculator', type: 'calculator' })
    addRecentApp({ id: 'simpletext', name: 'SimpleText', type: 'simpletext' })
    addRecentApp({ id: 'calculator', name: 'Calculator', type: 'calculator' })

    expect(recentApps.value).toHaveLength(2)
    expect(recentApps.value[0].name).toBe('Calculator')
    expect(recentApps.value[1].name).toBe('SimpleText')
  })

  it('should limit the number of recent items', () => {
    const { addRecentApp, recentApps } = useRecentItems()
    
    for (let i = 0; i < 15; i++) {
      addRecentApp({ id: `app-${i}`, name: `App ${i}`, type: 'generic' })
    }

    // Default limit should be 10
    expect(recentApps.value).toHaveLength(10)
    expect(recentApps.value[0].name).toBe('App 14')
    expect(recentApps.value[9].name).toBe('App 5')
  })
})
