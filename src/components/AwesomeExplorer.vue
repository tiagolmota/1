<script setup>
// Explorador do catálogo sindresorhus/awesome.
//
// Ao contrário do explorador de projetos, aqui há uma caixa de pesquisa:
// com 671 listas e 26 secções, escolher só por secção obrigaria a percorrer
// "Diversos" (131 listas) para encontrar, por exemplo, "Math".
import { computed, ref } from 'vue'
import catalog from '../data/awesome-catalog.json'
import { listSections, displayName } from '../knowledge/awesome.js'
import { normalize } from '../knowledge/text.js'

const sections = listSections(catalog)
// "Aprender" é a secção mais próxima do público do tutor (alunos), por isso
// é o ponto de partida em vez da primeira do readme ("Plataformas").
const selectedSection = ref(sections.some(s => s.id === 'learn') ? 'learn' : '')
const search = ref('')

// Texto pesquisável pré-normalizado uma única vez, para a filtragem a cada
// tecla não repetir a remoção de acentos em 671 entradas.
const searchable = catalog.entries.map(e => ({
  entry: e,
  text: normalize(`${displayName(e)} ${e.description} ${e.section}`),
}))

const visible = computed(() => {
  const q = normalize(search.value.trim())
  // Com texto na pesquisa, procuramos em todas as secções: quem escreve
  // "math" não sabe que a lista está em "Diversos".
  return searchable
    .filter(({ entry, text }) => q ? text.includes(q) : entry.sectionId === selectedSection.value)
    .map(({ entry }) => entry)
})
</script>

<template>
  <div class="flex-1 flex flex-col overflow-hidden">
    <div class="px-4 sm:px-6 py-3 border-b border-slate-100">
      <p class="text-xs sm:text-sm text-slate-500">
        {{ catalog.count }} listas curadas de recursos (em inglês) do catálogo
        <a :href="catalog.source.repository" target="_blank" rel="noopener noreferrer" class="underline">awesome</a>,
        em domínio público (CC0).
      </p>
    </div>

    <div class="px-4 sm:px-6 py-3 grid grid-cols-2 sm:grid-cols-[1fr_14rem] gap-3 border-b border-slate-100">
      <label class="min-w-0 text-sm">
        <span class="block text-slate-500 mb-1">Pesquisar (em inglês)</span>
        <input v-model="search" type="search" placeholder="ex.: math, python"
               class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
      </label>
      <label class="min-w-0 text-sm">
        <span class="block text-slate-500 mb-1">Secção</span>
        <select v-model="selectedSection" :disabled="!!search.trim()"
                class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl disabled:opacity-50">
          <option v-for="s in sections" :key="s.id" :value="s.id">{{ s.label }} ({{ s.count }})</option>
        </select>
      </label>
    </div>

    <ul class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2 bg-slate-50/50">
      <li v-for="l in visible" :key="l.url">
        <a :href="l.url" target="_blank" rel="noopener noreferrer"
           class="block px-4 py-3 bg-white border border-slate-200 rounded-2xl hover:border-emerald-300 hover:shadow-sm transition">
          <span class="font-medium text-slate-800">{{ displayName(l) }}</span>
          <span v-if="l.description" class="block text-xs text-slate-500 mt-0.5">{{ l.description }}</span>
        </a>
      </li>
      <li v-if="!visible.length" class="text-center text-slate-500 py-8">
        Nenhuma lista encontrada. Os nomes estão em inglês: experimenta "math" em vez de "matemática".
      </li>
    </ul>
  </div>
</template>
