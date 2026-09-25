<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { CreateMLCEngine } from '@mlc-ai/web-llm'
import KnowledgeExplorer from './components/KnowledgeExplorer.vue'
import byoxCatalog from './data/byox-catalog.json'
import awesomeCatalog from './data/awesome-catalog.json'
import { findTutorials, buildContext, missingLanguages } from './knowledge/byox.js'
import { findLists, buildContext as buildListsContext, displayName } from './knowledge/awesome.js'

const messages = ref([])
const inputMessage = ref('')
const isLoading = ref(false)
const isModelLoaded = ref(false)
const progress = ref('')
const messagesContainer = ref(null)
const showExplorer = ref(false)
let engine = null

const systemPrompt = "Você é um professor particular de Inteligência Artificial para alunos do ensino médio. Seu objetivo é ajudar os alunos a aprender de forma fácil e clara. Responda sempre em português. Seja amigável, encorajador, use exemplos simples e seja sempre ético."

const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const initializeModel = async () => {
  isLoading.value = true
  progress.value = 'Preparando o seu professor... (isso pode levar uns minutinhos na primeira vez)'

  try {
    const initProgressCallback = (report) => {
      // Simplifica as mensagens de log técnico para algo mais amigável, se possível, ou apenas mostra o progresso.
      progress.value = `Baixando o conhecimento... (${Math.round(report.progress * 100)}%)`
    }
    const selectedModel = "Llama-3.2-1B-Instruct-q4f32_1-MLC"

    engine = await CreateMLCEngine(selectedModel, { initProgressCallback })
    isModelLoaded.value = true
    progress.value = 'Tudo pronto!'

    messages.value.push({
      role: 'assistant',
      content: 'Olá! Eu sou o seu Professor de IA particular. Estou aqui para te ajudar com os estudos. O que vamos aprender hoje?'
    })
  } catch (error) {
    console.error('Error initializing the model:', error)
    progress.value = 'Ops, tivemos um probleminha ao preparar a aula. Tente recarregar a página.'
  } finally {
    isLoading.value = false
  }
}

const sendMessage = async () => {
  if (!inputMessage.value.trim() || !isModelLoaded.value || isLoading.value) return

  const userText = inputMessage.value.trim()
  // Procura tutoriais do catálogo build-your-own-x antes de chamar o modelo.
  // O modelo recebe só títulos (sem links) e a interface mostra os links
  // verdadeiros, para que nenhum URL apresentado ao aluno seja inventado.
  const tutorials = findTutorials(byoxCatalog, userText)
  // As listas "awesome" respondem a pedidos de recursos ("onde aprendo X?"),
  // não de projetos; as duas pesquisas são independentes e podem somar-se.
  const lists = findLists(awesomeCatalog, userText)
  const knowledge = [buildContext(tutorials, userText), buildListsContext(lists)]
    .filter(Boolean)
    .join('\n\n')
  messages.value.push({ role: 'user', content: userText })
  inputMessage.value = ''
  isLoading.value = true
  await scrollToBottom()

  try {
    // O contexto vai no próprio prompt de sistema porque o WebLLM só aceita
    // uma mensagem de sistema, e tem de ser a primeira. É recalculado a cada
    // pergunta para não arrastar referências de temas anteriores.
    const chatHistory = [
      { role: "system", content: knowledge ? `${systemPrompt}\n\n${knowledge}` : systemPrompt },
      ...messages.value.map(msg => ({ role: msg.role, content: msg.content }))
    ]

    const reply = await engine.chat.completions.create({
      messages: chatHistory,
    })

    messages.value.push({
      role: 'assistant',
      content: reply.choices[0].message.content,
      // Guardados na mensagem (e não enviados ao modelo, ver o map acima)
      // para que cada resposta mostre os tutoriais que a fundamentaram.
      tutorials,
      missing: missingLanguages(tutorials, userText),
      lists,
    })
    await scrollToBottom()
  } catch (error) {
    console.error('Error during generation:', error)
    messages.value.push({ role: 'assistant', content: 'Puxa, me confundi um pouco. Pode repetir a pergunta?' })
    await scrollToBottom()
  } finally {
    isLoading.value = false
  }
}

// Pergunta vinda do explorador de projetos. Se o modelo ainda não estiver
// carregado, a pergunta fica escrita na caixa de texto para ser enviada
// depois, em vez de se perder.
const askFromExplorer = async (text) => {
  showExplorer.value = false
  inputMessage.value = text
  if (isModelLoaded.value) await sendMessage()
}
</script>

<template>
  <div class="min-h-screen bg-indigo-50 flex flex-col items-center py-6 px-4 sm:px-6 lg:px-8 font-sans text-slate-800">
    <!-- Header -->
    <header class="w-full max-w-3xl text-center mb-6">
      <h1 class="text-4xl font-extrabold text-indigo-900 mb-2 tracking-tight">Meu Professor IA 🎒</h1>
      <p class="text-indigo-600 text-lg mb-4">Seu parceiro de estudos, sempre aqui para ajudar!</p>

      <!-- Simplified Badges -->
      <div class="flex flex-wrap justify-center gap-3 text-xs sm:text-sm font-semibold">
        <span class="px-4 py-1.5 bg-green-100 text-green-800 rounded-full shadow-sm flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
          100% Privado
        </span>
        <span class="px-4 py-1.5 bg-blue-100 text-blue-800 rounded-full shadow-sm flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
          Super Seguro
        </span>
        <button
          @click="showExplorer = !showExplorer"
          class="px-4 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-full shadow-sm flex items-center gap-1 transition-colors"
        >
          🛠️ {{ showExplorer ? 'Voltar ao chat' : 'Ideias e recursos' }}
        </button>
      </div>
    </header>

    <!-- Main App Area -->
    <main class="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-indigo-100 overflow-hidden flex flex-col h-[70vh] min-h-[500px]">

      <!-- Explorador das bases de conhecimento (build-your-own-x e awesome) -->
      <KnowledgeExplorer v-if="showExplorer" @ask="askFromExplorer" />

      <!-- Welcome / Load Screen -->
      <div v-else-if="!isModelLoaded" class="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-white to-indigo-50">
        <div class="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mb-6 text-4xl shadow-inner">
          🤖
        </div>
        <h2 class="text-2xl font-bold text-indigo-900 mb-3">Pronto para estudar?</h2>
        <p class="text-slate-600 mb-8 max-w-md text-lg leading-relaxed">
          Tudo o que você perguntar fica <strong>só no seu computador</strong>. Ninguém mais tem acesso!
        </p>

        <button
          @click="initializeModel"
          :disabled="isLoading"
          class="group relative px-8 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-xl font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all disabled:transform-none disabled:cursor-not-allowed transform hover:-translate-y-1"
        >
          <span class="flex items-center gap-2">
            {{ isLoading ? 'Preparando...' : 'Começar Agora!' }}
            <svg v-if="!isLoading" class="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
          </span>
        </button>

        <div v-if="isLoading" class="mt-6">
          <p class="text-indigo-600 font-medium animate-pulse">{{ progress }}</p>
        </div>
      </div>

      <!-- Chat Screen -->
      <div v-else class="flex-1 flex flex-col h-full overflow-hidden">
        <!-- Messages List -->
        <div ref="messagesContainer" class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/50 scroll-smooth">
          <div v-for="(msg, index) in messages" :key="index" class="flex w-full" :class="msg.role === 'user' ? 'justify-end' : 'justify-start'">

            <div class="flex max-w-[85%] sm:max-w-[75%] items-end gap-2" :class="msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'">

              <!-- Avatar -->
              <div class="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm shadow-sm"
                   :class="msg.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-indigo-600 text-white'">
                {{ msg.role === 'user' ? '👤' : '🤖' }}
              </div>

              <!-- Message Bubble -->
              <div class="px-5 py-3.5 rounded-3xl shadow-sm text-[15px] sm:text-base leading-relaxed"
                   :class="msg.role === 'user'
                     ? 'bg-indigo-600 text-white rounded-br-sm'
                     : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'">
                <p class="whitespace-pre-wrap">{{ msg.content }}</p>

                <!-- Tutoriais do catálogo usados nesta resposta; os links vêm do JSON, nunca do modelo -->
                <div v-if="msg.tutorials?.length" class="mt-4 pt-3 border-t border-slate-100 space-y-2">
                  <p class="text-xs font-semibold text-slate-500">Tutoriais para construir do zero:</p>
                  <a v-for="(t, i) in msg.tutorials" :key="t.url" :href="t.url" target="_blank" rel="noopener noreferrer"
                     class="block px-3 py-2 bg-indigo-50 hover:bg-indigo-100 rounded-xl text-sm transition-colors">
                    <span class="font-medium text-indigo-900">{{ i + 1 }}. {{ t.title }}</span>
                    <span class="block text-xs text-indigo-600">{{ t.languages.join(' · ') }}<template v-if="t.format !== 'text'"> · {{ t.format === 'video' ? 'vídeo' : t.format.toUpperCase() }}</template></span>
                  </a>
                  <p v-if="msg.missing?.length" class="text-xs text-amber-700">
                    Não há tutoriais deste tema em {{ msg.missing.join(', ') }} no catálogo; estes são noutras linguagens.
                  </p>
                  <p class="text-[11px] text-slate-400">Fonte: build-your-own-x (links externos, em inglês).</p>
                </div>

                <!-- Listas "awesome" usadas nesta resposta; letras A, B, C como no contexto do modelo -->
                <div v-if="msg.lists?.length" class="mt-4 pt-3 border-t border-slate-100 space-y-2">
                  <p class="text-xs font-semibold text-slate-500">Listas de recursos:</p>
                  <a v-for="(l, i) in msg.lists" :key="l.url" :href="l.url" target="_blank" rel="noopener noreferrer"
                     class="block px-3 py-2 bg-emerald-50 hover:bg-emerald-100 rounded-xl text-sm transition-colors">
                    <span class="font-medium text-emerald-900">{{ String.fromCharCode(65 + i) }}. {{ displayName(l) }}</span>
                    <span v-if="l.description" class="block text-xs text-emerald-700">{{ l.description }}</span>
                  </a>
                  <p class="text-[11px] text-slate-400">Fonte: sindresorhus/awesome (links externos, em inglês).</p>
                </div>
              </div>
            </div>

          </div>

          <!-- Typing Indicator -->
          <div v-if="isLoading && inputMessage === ''" class="flex justify-start">
            <div class="flex items-end gap-2 max-w-[85%]">
              <div class="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm shadow-sm bg-indigo-600 text-white">🤖</div>
              <div class="bg-white border border-slate-200 rounded-3xl rounded-bl-sm px-5 py-4 shadow-sm flex items-center space-x-2">
                <div class="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                <div class="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                <div class="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Input Area -->
        <div class="p-4 sm:p-5 bg-white border-t border-slate-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
          <form @submit.prevent="sendMessage" class="flex gap-3 relative">
            <input
              v-model="inputMessage"
              type="text"
              placeholder="Digite sua dúvida aqui..."
              class="flex-1 min-w-0 px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-inner"
              :disabled="isLoading"
            />
            <button
              type="submit"
              :disabled="!inputMessage.trim() || isLoading"
              class="px-6 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-2xl transition-colors shadow-md flex items-center justify-center min-w-[100px]"
            >
              Enviar
            </button>
          </form>
          <div class="mt-3 text-center flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
            Sua conversa é particular e não sai do seu celular/computador.
          </div>
        </div>
      </div>

    </main>
  </div>
</template>

<style>
body {
  margin: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background-color: #f8fafc; /* Tailwind slate-50 to match min-h-screen bg but globally */
}

/* Custom scrollbar for webkit */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}
::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>