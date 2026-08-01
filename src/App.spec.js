import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import App from './App.vue'
import { CreateMLCEngine } from '@mlc-ai/web-llm'

vi.mock('@mlc-ai/web-llm', () => ({
  CreateMLCEngine: vi.fn()
}))

describe('App.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock implementation for successful initialization
    CreateMLCEngine.mockResolvedValue({
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [{ message: { content: 'Mock assistant reply' } }]
          })
        }
      }
    })
  })

  it('renders the initial non-loaded state correctly', () => {
    const wrapper = mount(App)

    expect(wrapper.text()).toContain('Pronto para estudar?')
    expect(wrapper.text()).toContain('Começar Agora!')
    expect(wrapper.find('input[type="text"]').exists()).toBe(false)
  })

  it('shows loading state when clicking "Começar Agora!"', async () => {
    let resolveEngine
    const enginePromise = new Promise(resolve => {
      resolveEngine = resolve
    })
    CreateMLCEngine.mockReturnValue(enginePromise)

    const wrapper = mount(App)

    const startButton = wrapper.find('button')
    await startButton.trigger('click')

    expect(wrapper.text()).toContain('Preparando...')
    expect(wrapper.find('button').attributes('disabled')).toBeDefined()

    resolveEngine({})
  })

  it('initializes model and shows initial assistant message', async () => {
    const wrapper = mount(App)

    const startButton = wrapper.find('button')
    await startButton.trigger('click')

    // Wait for the initialization promise to resolve
    await flushPromises()

    // Model should be loaded, input should be visible
    expect(wrapper.find('input[type="text"]').exists()).toBe(true)

    // Initial message from assistant should be rendered
    expect(wrapper.text()).toContain('Olá! Eu sou o seu Professor de IA particular. Estou aqui para te ajudar com os estudos. O que vamos aprender hoje?')
  })

  it('allows user to send a message and displays assistant reply', async () => {
    const mockCreate = vi.fn().mockResolvedValue({
      choices: [{ message: { content: 'Essa é a resposta do professor.' } }]
    })

    CreateMLCEngine.mockResolvedValue({
      chat: {
        completions: {
          create: mockCreate
        }
      }
    })

    const wrapper = mount(App)

    // Initialize
    await wrapper.find('button').trigger('click')
    await flushPromises()

    // Send a message
    const input = wrapper.find('input[type="text"]')
    await input.setValue('O que é fotossíntese?')

    const form = wrapper.find('form')
    await form.trigger('submit')

    // Wait for nextTick and api call
    await flushPromises()

    // Check if user message is shown
    expect(wrapper.text()).toContain('O que é fotossíntese?')

    // Check if api was called
    expect(mockCreate).toHaveBeenCalledTimes(1)

    // Check if assistant reply is shown
    expect(wrapper.text()).toContain('Essa é a resposta do professor.')
  })
})