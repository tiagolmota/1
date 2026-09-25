<script setup>
// Agrupa os dois catálogos em separadores. Ficam separados, e não numa lista
// única, porque respondem a necessidades distintas: um tutorial ensina a
// construir uma coisa concreta; uma lista "awesome" aponta para muitos
// recursos sobre um tema. Misturá-los confundiria o que cada link oferece.
import { ref } from 'vue'
import ProjectExplorer from './ProjectExplorer.vue'
import AwesomeExplorer from './AwesomeExplorer.vue'

const emit = defineEmits(['ask'])

const tabs = [
  { id: 'projects', label: 'Construir do zero' },
  { id: 'lists', label: 'Listas de recursos' },
]
const active = ref('projects')
</script>

<template>
  <div class="flex-1 flex flex-col overflow-hidden">
    <div role="tablist" class="flex border-b border-slate-100">
      <button v-for="t in tabs" :key="t.id" role="tab" :aria-selected="active === t.id"
              @click="active = t.id"
              class="flex-1 px-4 py-3 text-sm sm:text-base font-bold transition-colors border-b-2"
              :class="active === t.id ? 'text-indigo-900 border-indigo-600' : 'text-slate-400 border-transparent hover:text-slate-600'">
        {{ t.label }}
      </button>
    </div>
    <!-- v-show em vez de v-if: preserva filtros e pesquisa ao trocar de separador. -->
    <ProjectExplorer v-show="active === 'projects'" @ask="text => emit('ask', text)" />
    <AwesomeExplorer v-show="active === 'lists'" />
  </div>
</template>
