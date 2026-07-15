import { defineStore } from 'pinia'

export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
}

export interface ChatSession {
  id: string
  title: string
  messages: Message[]
  scenario: string
}

export const useChatStore = defineStore('chat', {
  state: () => ({
    sessions: [] as ChatSession[],
    currentSessionId: null as string | null,
    isLoading: false,
    error: null as string | null,
  }),

  getters: {
    currentSession: (state) => {
      return state.sessions.find(s => s.id === state.currentSessionId) || null
    },
    currentMessages: (state) => {
      const session = state.sessions.find(s => s.id === state.currentSessionId)
      return session ? session.messages : []
    }
  },

  actions: {
    createNewSession(scenario: string = 'default') {
      const newSession: ChatSession = {
        id: crypto.randomUUID(),
        title: 'New Conversation',
        messages: [],
        scenario
      }
      this.sessions.push(newSession)
      this.currentSessionId = newSession.id
      return newSession.id
    },

    async sendMessage(content: string) {
      if (!this.currentSessionId) {
        this.createNewSession()
      }

      const session = this.currentSession
      if (!session) return

      // Add user message
      session.messages.push({
        role: 'user',
        content,
        timestamp: new Date().toISOString()
      })

      this.isLoading = true
      this.error = null

      try {
        const response = await fetch('/api/v1/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            prompt: content,
            scenario: session.scenario
          })
        })

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        const data = await response.json()

        // Add assistant message
        session.messages.push({
          role: 'assistant',
          content: data.response,
          timestamp: new Date().toISOString()
        })
      } catch (err: any) {
        this.error = err.message || 'An error occurred'
        // Add error message to chat
        session.messages.push({
          role: 'system',
          content: `Error: ${this.error}`,
          timestamp: new Date().toISOString()
        })
      } finally {
        this.isLoading = false
      }
    }
  }
})
