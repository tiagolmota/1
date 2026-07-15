<script setup>
import { ref, onMounted } from 'vue'
import { CreateMLCEngine } from '@mlc-ai/web-llm'

const messages = ref([])
const inputMessage = ref('')
const isLoading = ref(false)
const isModelLoaded = ref(false)
const progress = ref('')
let engine = null

const systemPrompt = "Você é um assistente educacional de Inteligência Artificial para alunos do ensino médio. O seu propósito é ajudar os alunos com informações precisas e seguras. Responda sempre em português. Seja útil, amigável e ético."

const initializeModel = async () => {
  isLoading.value = true
  progress.value = 'Iniciando o modelo...'

  try {
    const initProgressCallback = (report) => {
      progress.value = report.text
    }
    const selectedModel = "Llama-3.2-1B-Instruct-q4f32_1-MLC"

    engine = await CreateMLCEngine(selectedModel, { initProgressCallback })
    isModelLoaded.value = true
    progress.value = 'Modelo pronto!'

    messages.value.push({
      role: 'assistant',
      content: 'Olá! Sou seu assistente de IA educacional local. Estou pronto para ajudar e responder às suas dúvidas com total segurança de dados. O que gostaria de aprender hoje?'
    })
  } catch (error) {
    console.error('Error initializing the model:', error)
    progress.value = 'Erro ao carregar o modelo. Verifique a console.'
  } finally {
    isLoading.value = false
  }
}

const sendMessage = async () => {
  if (!inputMessage.value.trim() || !isModelLoaded.value || isLoading.value) return

  const userText = inputMessage.value.trim()
  messages.value.push({ role: 'user', content: userText })
  inputMessage.value = ''
  isLoading.value = true

  try {
    // We construct the prompt sequence manually or let the engine handle it.
    // It's recommended to include the system prompt for instructions.
    const chatHistory = [
      { role: "system", content: systemPrompt },
      ...messages.value.map(msg => ({ role: msg.role, content: msg.content }))
    ]

    const reply = await engine.chat.completions.create({
      messages: chatHistory,
    })

    messages.value.push({ role: 'assistant', content: reply.choices[0].message.content })
  } catch (error) {
    console.error('Error during generation:', error)
    messages.value.push({ role: 'assistant', content: 'Desculpe, ocorreu um erro ao gerar a resposta.' })
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  // Option to auto-load, or we could require a button click to save bandwidth
  // initializeModel()
})
</script>

<template>
  <div class="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-4 font-sans text-slate-800">
    <!-- Header / Info -->
    <header class="w-full max-w-3xl text-center mb-8">
      <h1 class="text-3xl font-bold text-slate-900 mb-2">Assistente IA Educacional</h1>
      <p class="text-slate-600 mb-4">Desenvolvido para alunos do ensino médio</p>

      <!-- Compliance Badges -->
      <div class="flex flex-wrap justify-center gap-2 text-sm font-medium">
        <span class="px-3 py-1 bg-green-100 text-green-800 rounded-full border border-green-200">
          ✓ EU AI Act Compliance
        </span>
        <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full border border-blue-200">
          ✓ 100% Local (Nenhum dado é exportado)
        </span>
        <span class="px-3 py-1 bg-purple-100 text-purple-800 rounded-full border border-purple-200">
          ✓ Seguro & Auditável
        </span>
      </div>
    </header>

    <!-- Chat Container -->
    <main class="w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col" style="height: 600px;">

      <!-- Initialization state -->
      <div v-if="!isModelLoaded" class="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50">
        <div class="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800 max-w-md">
          <h3 class="font-bold mb-2">Bem-vindo(a)</h3>
          <p class="text-sm">Para garantir a sua privacidade, este modelo de IA (LLM) será baixado e executado inteiramente no seu navegador. Isso pode demorar alguns minutos dependendo da sua conexão.</p>
        </div>

        <button
          @click="initializeModel"
          :disabled="isLoading"
          class="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold rounded-xl shadow-sm transition-colors"
        >
          {{ isLoading ? 'Carregando...' : 'Carregar Motor de IA (Open Source)' }}
        </button>

        <div v-if="isLoading" class="mt-4 text-sm text-slate-500 max-w-md">
          {{ progress }}
        </div>
      </div>

      <!-- Messages Area -->
      <div v-else class="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        <div v-for="(msg, index) in messages" :key="index" class="flex flex-col" :class="msg.role === 'user' ? 'items-end' : 'items-start'">
          <div class="max-w-[80%] rounded-2xl px-5 py-3 shadow-sm"
               :class="msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'">
            <p class="whitespace-pre-wrap leading-relaxed">{{ msg.content }}</p>
          </div>
          <span class="text-xs text-slate-400 mt-1 px-1">
            {{ msg.role === 'user' ? 'Você' : 'Assistente IA' }}
          </span>
        </div>

        <!-- Thinking state -->
        <div v-if="isLoading && inputMessage === ''" class="flex flex-col items-start">
          <div class="bg-white border border-slate-200 text-slate-500 rounded-2xl rounded-tl-none px-5 py-3 shadow-sm flex items-center space-x-2">
            <div class="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
            <div class="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
            <div class="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
          </div>
        </div>
      </div>

      <!-- Input Area -->
      <div v-if="isModelLoaded" class="p-4 bg-white border-t border-slate-200">
        <form @submit.prevent="sendMessage" class="flex gap-2">
          <input
            v-model="inputMessage"
            type="text"
            placeholder="Faça uma pergunta..."
            class="flex-1 px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            :disabled="isLoading"
          />
          <button
            type="submit"
            :disabled="!inputMessage.trim() || isLoading"
            class="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 text-white font-semibold rounded-xl transition-colors shadow-sm"
          >
            Enviar
          </button>
        </form>
        <p class="text-center text-xs text-slate-400 mt-2">
          As respostas são processadas localmente e não são armazenadas externamente.
        </p>
      </div>

    </main>
  </div>
</template>

<style>
/* Any custom styles could go here, but we are using Tailwind CSS */
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}
</style>