import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import App from './App.vue'

// Mock the web-llm library
vi.mock('@mlc-ai/web-llm', () => ({
  CreateMLCEngine: vi.fn().mockResolvedValue({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content: 'Mock response' } }]
        })
      }
    }
  })
}))

describe('App.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Ensure we don't have issues with scrolling in JSDOM
    window.HTMLElement.prototype.scrollIntoView = vi.fn()
  })

  it('does not send message if input is empty or contains only spaces', async () => {
    const wrapper = mount(App)

    // 1. Initialize the model so isModelLoaded becomes true
    const startButton = wrapper.find('button')
    await startButton.trigger('click')

    // Wait for async operations to complete (model initialization)
    await flushPromises()

    // Verify model is loaded by checking for the input field which only shows after loading
    const input = wrapper.find('input[type="text"]')
    expect(input.exists()).toBe(true)

    // Assert that the initial assistant message is present
    let messageElements = wrapper.findAll('.whitespace-pre-wrap')
    expect(messageElements.length).toBe(1)
    expect(messageElements[0].text()).toContain('Olá! Eu sou o seu Professor de IA particular')

    const form = wrapper.find('form')

    // 2. Try to send an empty message
    await input.setValue('')
    await form.trigger('submit')
    await flushPromises()

    // Should still have only 1 message
    messageElements = wrapper.findAll('.whitespace-pre-wrap')
    expect(messageElements.length).toBe(1)

    // 3. Try to send a message with only spaces
    await input.setValue('    ')
    await form.trigger('submit')
    await flushPromises()

    // Should still have only 1 message
    messageElements = wrapper.findAll('.whitespace-pre-wrap')
    expect(messageElements.length).toBe(1)
  })
})
