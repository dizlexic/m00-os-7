import { describe, it, expect } from 'vitest'
import { getElizaResponse } from '~/utils/eliza'

describe('eliza engine', () => {
  it('should respond to hello', () => {
    const response = getElizaResponse('hello')
    const greetings = [
      "How do you do. Please state your problem.",
      "Hi. What seems to be your problem?",
      "Hello! How are you feeling today?"
    ]
    expect(greetings).toContain(response)
  })

  it('should reflect "i am"', () => {
    const response = getElizaResponse('i am sad')
    expect(response).toMatch(/sad/i)
    // One of the responses for "i am" should be triggered
    const validResponse = /you are/i.test(response) || /been/i.test(response) || /being/i.test(response)
    expect(validResponse).toBe(true)
  })

  it('should respond to family keywords', () => {
    const response = getElizaResponse('my mother is here')
    // Response should mention family or the specific keyword
    const mentionsFamily = /family/i.test(response) || /mother/i.test(response)
    expect(mentionsFamily).toBe(true)
  })

  it('should give a default response for unknown input', () => {
    const response = getElizaResponse('asdfghjkl')
    const defaults = [
      "I see. Please go on.",
      "What does that suggest to you?",
      "How does that make you feel?",
      "Can you elaborate on that?",
      "That is interesting. Tell me more.",
      "I'm not sure I understand you fully.",
      "Does that trouble you?"
    ]
    expect(defaults).toContain(response)
  })

  it('should handle empty input', () => {
    const response = getElizaResponse('')
    expect(response).toBe("Please say something.")
  })
})
