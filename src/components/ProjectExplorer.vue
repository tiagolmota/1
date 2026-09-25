<script setup>
// Explorador do catálogo build-your-own-x.
//
// Porquê existir fora do chat: o modelo de 1B só vê 5 tutoriais de cada vez e
// só quando a pergunta menciona um tema. Muitos alunos não sabem o que
// perguntar; navegar por temas e linguagens dá-lhes ideias de projetos antes
// de falarem com o professor.
import { computed, ref } from 'vue'
import catalog from '../data/byox-catalog.json'
import { explorerQuestion, listCategories, listLanguages } from '../knowledge/byox.js'

const emit = defineEmits(['ask'])

const categories = listCategories(catalog)
// Limita o filtro às linguagens com pelo menos 3 tutoriais: as restantes
// (ATS, Alloy, Racket...) raramente interessam a alunos do secundário e
// tornariam a lista difícil de percorrer num telemóvel.
const languages = listLanguages(catalog).filter(l => l.count >= 3)

const selectedCategory = ref(categories[0]?.id ?? '')
const selectedLanguage = ref('')

const visible = computed(() =>
  catalog.entries.filter(e =>
    e.categoryId === selectedCategory.value &&
    (!selectedLanguage.value || e.languages.includes(selectedLanguage.value))))

const FORMAT_LABELS = { video: 'vídeo', pdf: 'PDF' }

// "Outros projetos" junta temas sem relação entre si, por isso não há uma
// pergunta que a pesquisa do chat consiga associar a esse grupo.
const canAsk = computed(() => selectedCategory.value !== 'uncategorized')

function askAbout() {
  emit('ask', explorerQuestion(selectedCategory.value, selectedLanguage.value))
}
</script>

<template>
  <div class="flex-1 flex flex-col overflow-hidden">
    <!-- O botão para voltar ao chat está no cabeçalho da página; repeti-lo
         aqui roubaria espaço à lista, que já é curta em ecrãs de telemóvel. -->
    <div class="px-4 sm:px-6 py-3 border-b border-slate-100">
      <h2 class="text-lg sm:text-xl font-bold text-indigo-900">Construir do zero</h2>
      <p class="text-xs sm:text-sm text-slate-500">
        {{ catalog.count }} tutoriais (links externos, em inglês) do catálogo
        <a :href="catalog.source.repository" target="_blank" rel="noopener noreferrer" class="underline">build-your-own-x</a>,
        em domínio público (CC0).
      </p>
    </div>

    <div class="px-4 sm:px-6 py-3 grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_14rem] gap-3 border-b border-slate-100">
      <label class="min-w-0 text-sm">
        <span class="block text-slate-500 mb-1">Tema</span>
        <select v-model="selectedCategory" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
          <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.label }} ({{ c.count }})</option>
        </select>
      </label>
      <label class="text-sm">
        <span class="block text-slate-500 mb-1">Linguagem</span>
        <select v-model="selectedLanguage" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
          <option value="">Todas</option>
          <option v-for="l in languages" :key="l.name" :value="l.name">{{ l.name }}</option>
        </select>
      </label>
    </div>

    <ul class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2 bg-slate-50/50">
      <li v-for="t in visible" :key="t.url">
        <a :href="t.url" target="_blank" rel="noopener noreferrer"
           class="block px-4 py-3 bg-white border border-slate-200 rounded-2xl hover:border-indigo-300 hover:shadow-sm transition">
          <span class="font-medium text-slate-800">{{ t.title }}</span>
          <span class="block text-xs text-slate-500 mt-0.5">
            {{ t.languages.join(' · ') }}<template v-if="FORMAT_LABELS[t.format]"> · {{ FORMAT_LABELS[t.format] }}</template>
          </span>
        </a>
      </li>
      <li v-if="!visible.length" class="text-center text-slate-500 py-8">
        Não há tutoriais deste tema nesta linguagem. Experimenta "Todas".
      </li>
    </ul>

    <div v-if="canAsk" class="p-3 border-t border-slate-100 bg-white flex justify-end">
      <button @click="askAbout" class="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl">
        Perguntar ao professor
      </button>
    </div>
  </div>
</template>
