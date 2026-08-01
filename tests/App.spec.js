import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import App from '../src/App.vue'
import * as webLlm from '@mlc-ai/web-llm'

// Mock the CreateMLCEngine function
vi.mock('@mlc-ai/web-llm', () => ({
  CreateMLCEngine: vi.fn(),
}))

describe('App.vue', () => {
  it('handles error in initializeModel', async () => {
    // Arrange
    const errorMsg = 'Failed to load model'
    webLlm.CreateMLCEngine.mockRejectedValue(new Error(errorMsg))

    // Catch console.error to avoid polluting the test output
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const wrapper = mount(App)

    // Act
    // Find the button and click it to call initializeModel
    await wrapper.find('button').trigger('click')

    // Wait for everything to resolve
    await flushPromises()

    // The text will be in the progress div, but we also have to check if it's visible.
    // Wait, the progress text is only shown if isLoading is true.
    // In finally block, isLoading is set to false!
    // So the progress text might not be visible at the end!

    // Let's check the Vue instance data directly for progress value
    expect(wrapper.vm.progress).toBe('Ops, tivemos um probleminha ao preparar a aula. Tente recarregar a página.')
    expect(consoleSpy).toHaveBeenCalledWith('Error initializing the model:', expect.any(Error))

    consoleSpy.mockRestore()
  })
})
