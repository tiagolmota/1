<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useChatStore } from './store/chat'

const chatStore = useChatStore()
const userInput = ref('')

onMounted(() => {
  chatStore.createNewSession()
})

const handleSend = () => {
  if (userInput.value.trim() === '') return
  chatStore.sendMessage(userInput.value)
  userInput.value = ''
}
</script>

<template>
  <div class="flex flex-col h-screen bg-gray-50 font-sans">
    <header class="bg-blue-600 text-white p-4 shadow-md flex justify-between items-center">
      <h1 class="text-xl font-bold">Protótipo Soberano IAGen</h1>
      <span class="text-sm bg-blue-700 px-2 py-1 rounded">Educational Local AI</span>
    </header>

    <main class="flex-1 overflow-y-auto p-4 w-full max-w-4xl mx-auto flex flex-col space-y-4">
      <div
        v-for="(msg, index) in chatStore.currentMessages"
        :key="index"
        :class="[
          'p-3 rounded-lg max-w-[80%]',
          msg.role === 'user' ? 'bg-blue-100 text-blue-900 self-end rounded-tr-none' :
          msg.role === 'assistant' ? 'bg-white border border-gray-200 text-gray-800 self-start rounded-tl-none shadow-sm' :
          'bg-red-100 text-red-800 self-center text-sm'
        ]"
      >
        <div class="text-xs opacity-50 mb-1 capitalize">{{ msg.role }}</div>
        <div class="whitespace-pre-wrap">{{ msg.content }}</div>
      </div>

      <div v-if="chatStore.isLoading" class="bg-gray-100 p-3 rounded-lg max-w-[80%] self-start text-gray-500 rounded-tl-none animate-pulse">
        <div class="text-xs opacity-50 mb-1">Assistant</div>
        Thinking...
      </div>
    </main>

    <footer class="bg-white p-4 border-t border-gray-200">
      <div class="max-w-4xl mx-auto flex">
        <input
          v-model="userInput"
          @keyup.enter="handleSend"
          type="text"
          placeholder="Type your message here..."
          class="flex-1 border border-gray-300 rounded-l-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          :disabled="chatStore.isLoading"
        />
        <button
          @click="handleSend"
          :disabled="chatStore.isLoading || userInput.trim() === ''"
          class="bg-blue-600 text-white px-6 rounded-r-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* Optional custom styles, mostly handled by Tailwind */
</style>
