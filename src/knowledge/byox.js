// Pesquisa lexical sobre o catálogo build-your-own-x.
//
// Porquê pesquisa lexical e não embeddings: o modelo local (Llama 3.2 1B) já
// ocupa a memória do navegador, e o catálogo tem apenas algumas centenas de
// entradas com títulos curtos. Um índice de palavras-chave com sinónimos em
// português chega para encontrar os tutoriais certos, corre em
// microssegundos e não exige descarregar um segundo modelo.
//
// As funções recebem o catálogo como argumento (em vez de o importarem) para
// poderem ser testadas em Node sem passar pelo bundler.

import { normalize, tokenize } from './text.js'

// Reexportadas para manter a API pública deste módulo.
export { normalize, tokenize }

// Sinónimos por categoria. Palavras genéricas partilhadas por vários temas
// ("motor", "web") ficam de fora: empatariam temas distintos, como "motor de
// física" e "motor de templates", ou "navegador web" e "servidor web".
// Os alunos escrevem em português, mas os títulos
// do catálogo estão em inglês; sem esta ponte, "sistema operativo" nunca
// encontraria "Operating System". Incluímos as variantes europeia e
// brasileira ("ficheiro"/"arquivo", "ecrã"/"tela") porque ambas aparecem.
const CATEGORY_KEYWORDS = {
  'distributed-systems': ['distribuido', 'distribuidos', 'distributed', 'kafka', 'fila', 'mensagens'],
  '3d-renderer': ['3d', 'renderizador', 'renderizacao', 'render', 'renderer', 'raytracing', 'ray', 'tracing', 'graficos', 'opengl'],
  'ai-model': ['ia', 'ai', 'llm', 'gpt', 'modelo', 'transformer', 'chatgpt', 'inteligencia', 'artificial'],
  'augmented-reality': ['aumentada', 'ar', 'augmented'],
  'bittorrent-client': ['bittorrent', 'torrent', 'p2p'],
  'blockchain-cryptocurrency': ['blockchain', 'cripto', 'criptomoeda', 'bitcoin', 'cryptocurrency', 'moeda'],
  bot: ['bot', 'bots', 'chatbot', 'discord', 'telegram', 'slack'],
  'command-line-tool': ['terminal', 'cli', 'comandos', 'linha', 'consola', 'console'],
  database: ['base', 'dados', 'database', 'bd', 'sql', 'sqlite', 'redis'],
  docker: ['docker', 'contentor', 'contentores', 'container', 'containers'],
  'emulator-virtual-machine': ['emulador', 'emulator', 'maquina', 'virtual', 'vm', 'chip8', 'gameboy', 'nes'],
  'front-end-framework-library': ['frontend', 'front', 'react', 'vue', 'framework', 'biblioteca', 'dom'],
  game: ['jogo', 'jogos', 'game', 'games', 'tetris', 'snake', 'roguelike', 'pong'],
  git: ['git', 'versoes', 'controlo', 'controle'],
  'memory-allocator': ['memoria', 'alocador', 'malloc', 'allocator'],
  'network-stack': ['pilha', 'rede', 'redes', 'tcp', 'ip', 'network', 'protocolo'],
  'neural-network': ['neural', 'neuronal', 'neuronios', 'rede', 'aprendizagem', 'aprendizado', 'machine', 'learning', 'deep'],
  'operating-system': ['sistema', 'operativo', 'operacional', 'os', 'kernel', 'nucleo'],
  'physics-engine': ['fisica', 'physics', 'colisoes', 'simulacao'],
  processor: ['processador', 'cpu', 'processor', 'circuito'],
  'programming-language': ['linguagem', 'compilador', 'interpretador', 'compiler', 'interpreter', 'lisp', 'parser'],
  'regex-engine': ['regex', 'expressoes', 'regulares', 'expressao', 'regular'],
  'search-engine': ['pesquisa', 'busca', 'search', 'indice', 'google'],
  shell: ['shell', 'bash', 'terminal'],
  'template-engine': ['template', 'templates', 'modelos'],
  'text-editor': ['editor', 'texto', 'vim', 'nano'],
  'visual-recognition-system': ['visao', 'reconhecimento', 'imagem', 'imagens', 'facial', 'computacional'],
  'voxel-engine': ['voxel', 'minecraft', 'cubos'],
  'web-browser': ['navegador', 'browser', 'browsers'],
  'web-server': ['servidor', 'server', 'http'],
}

// Nomes em português para mostrar na interface.
export const CATEGORY_LABELS = {
  'distributed-systems': 'Sistemas distribuídos',
  '3d-renderer': 'Renderizador 3D',
  'ai-model': 'Modelo de IA',
  'augmented-reality': 'Realidade aumentada',
  'bittorrent-client': 'Cliente BitTorrent',
  'blockchain-cryptocurrency': 'Blockchain / criptomoeda',
  bot: 'Bot',
  'command-line-tool': 'Ferramenta de linha de comandos',
  database: 'Base de dados',
  docker: 'Docker',
  'emulator-virtual-machine': 'Emulador / máquina virtual',
  'front-end-framework-library': 'Framework front-end',
  game: 'Jogo',
  git: 'Git',
  'memory-allocator': 'Alocador de memória',
  'network-stack': 'Pilha de rede',
  'neural-network': 'Rede neuronal',
  'operating-system': 'Sistema operativo',
  'physics-engine': 'Motor de física',
  processor: 'Processador',
  'programming-language': 'Linguagem de programação',
  'regex-engine': 'Motor de expressões regulares',
  'search-engine': 'Motor de pesquisa',
  shell: 'Shell',
  'template-engine': 'Motor de templates',
  'text-editor': 'Editor de texto',
  'visual-recognition-system': 'Reconhecimento visual',
  'voxel-engine': 'Motor voxel',
  'web-browser': 'Navegador web',
  'web-server': 'Servidor web',
  uncategorized: 'Outros projetos',
}

// Aliases de linguagens. As chaves já estão normalizadas (ver normalize), por
// isso "c++" chega aqui como "c++" e "C#" como "c#".
const LANGUAGE_ALIASES = {
  python: 'Python', py: 'Python',
  javascript: 'JavaScript', js: 'JavaScript',
  typescript: 'TypeScript', ts: 'TypeScript',
  node: 'Node.js', 'node.js': 'Node.js', nodejs: 'Node.js',
  c: 'C',
  'c++': 'C++', cpp: 'C++',
  'c#': 'C#', csharp: 'C#',
  go: 'Go', golang: 'Go',
  rust: 'Rust', ruby: 'Ruby', java: 'Java', kotlin: 'Kotlin', swift: 'Swift',
  haskell: 'Haskell', php: 'PHP', lua: 'Lua', scala: 'Scala', elixir: 'Elixir',
  clojure: 'Clojure', ocaml: 'OCaml', nim: 'Nim', zig: 'Zig', perl: 'Perl',
  'f#': 'F#', assembly: 'Assembly', asm: 'Assembly', verilog: 'Verilog',
}

// O catálogo distingue "Node.js" de "JavaScript", mas para um aluno que pede
// JavaScript um tutorial em Node.js serve perfeitamente (e vice-versa).
const LANGUAGE_FAMILY = { 'Node.js': 'JavaScript', JavaScript: 'Node.js' }

// Linguagens que, sendo tutoriais agnósticos ("(any)", pseudocódigo), servem
// qualquer pedido de linguagem.
const ANY_LANGUAGE = new Set(['(any)', 'Pseudocode'])

// Sinais de que o aluno quer um projeto prático. Sem um destes, ou sem uma
// categoria reconhecida, não injetamos referências: uma pergunta sobre a
// fotossíntese não deve receber links para compiladores.
const INTENT_WORDS = [
  'construir', 'criar', 'fazer', 'programar', 'implementar', 'desenvolver',
  'projeto', 'projetos', 'tutorial', 'tutoriais', 'build', 'scratch', 'zero',
  'praticar', 'exercicio', 'aprender',
]

// Palavras sem valor discriminativo; removidas para que "como criar um jogo"
// não pontue títulos só por conterem "a" ou "how".
const STOPWORDS = new Set([
  'a', 'o', 'as', 'os', 'um', 'uma', 'de', 'do', 'da', 'dos', 'das', 'em', 'no',
  'na', 'com', 'para', 'por', 'que', 'e', 'eu', 'meu', 'minha', 'como', 'quero',
  'queria', 'posso', 'pode', 'sobre', 'the', 'an', 'of', 'in', 'to', 'and',
  'for', 'your', 'own', 'how', 'with', 'from', 'using', 'build', 'write',
  'simple', 'part',
])

// Índice pré-calculado dos títulos para não re-tokenizar em cada pesquisa.
const titleTokenCache = new WeakMap()
function titleTokens(entry) {
  let tokens = titleTokenCache.get(entry)
  if (!tokens) {
    tokens = new Set(tokenize(entry.title).filter(t => t.length > 2 && !STOPWORDS.has(t)))
    titleTokenCache.set(entry, tokens)
  }
  return tokens
}

// Analisa a pergunta uma vez: que categorias, linguagens e termos contém.
export function analyzeQuery(query) {
  const tokens = tokenize(query)
  const tokenSet = new Set(tokens)

  const categories = new Map()
  for (const [id, words] of Object.entries(CATEGORY_KEYWORDS)) {
    // Conta quantas palavras da categoria aparecem; categorias com mais
    // coincidências (p.ex. "sistema" + "operativo") ganham a palavras
    // ambíguas isoladas (p.ex. "rede", presente em duas categorias).
    const hits = words.filter(w => tokenSet.has(w)).length
    if (hits) categories.set(id, hits)
  }

  const languages = new Set()
  for (const t of tokens) if (LANGUAGE_ALIASES[t]) languages.add(LANGUAGE_ALIASES[t])

  const terms = tokens.filter(t => t.length > 2 && !STOPWORDS.has(t))
  const hasIntent = tokens.some(t => INTENT_WORDS.includes(t))

  return { categories, languages, terms, hasIntent }
}

// Devolve até `limit` tutoriais ordenados por relevância, ou [] quando a
// pergunta não tem relação com construir projetos.
export function findTutorials(catalog, query, { limit = 5 } = {}) {
  const q = analyzeQuery(query)
  // Exige intenção explícita de construir: sem ela, "o que é inteligência
  // artificial?" (pergunta frequente neste tutor) devolveria tutoriais de
  // modelos de IA a quem só queria uma definição.
  const relevant = q.hasIntent && (q.categories.size > 0 || q.languages.size > 0)
  if (!relevant) return []

  const maxCategoryHits = Math.max(0, ...q.categories.values())

  const scored = []
  for (const entry of catalog.entries) {
    let score = 0

    const catHits = q.categories.get(entry.categoryId) || 0
    // Quando o aluno nomeia um tema, só esse tema interessa; sem isto, "bot
    // em JavaScript" traria tutoriais de blockchain em JavaScript.
    if (q.categories.size && !catHits) continue
    // Só a(s) categoria(s) mais fortes contam por inteiro; as restantes
    // valem pouco. Evita que "rede neuronal" traga tutoriais de TCP/IP.
    if (catHits) score += catHits === maxCategoryHits ? 10 : 2

    if (q.languages.size) {
      const match = entry.languages.some(l => q.languages.has(l) || q.languages.has(LANGUAGE_FAMILY[l]))
      const agnostic = entry.languages.some(l => ANY_LANGUAGE.has(l))
      if (match) score += 6
      else if (agnostic) score += 2
      // Se o aluno pediu uma linguagem, penalizar as outras é mais útil do
      // que mostrar um tutorial perfeito numa linguagem que ele não conhece.
      else score -= 4
    }

    const tt = titleTokens(entry)
    for (const term of q.terms) if (tt.has(term)) score += 2

    if (score > 0) scored.push({ entry, score })
  }

  // Ordenação estável: em empate, mantém a ordem do README, que já agrupa
  // os tutoriais mais conhecidos no início de cada secção.
  scored.sort((a, b) => b.score - a.score)
  const best = scored.length ? scored[0].score : 0
  // Descarta resultados muito abaixo do melhor para não diluir a resposta.
  return scored
    .filter(s => s.score >= Math.max(6, best * 0.5))
    .slice(0, limit)
    .map(s => s.entry)
}

// Bloco de contexto para o modelo. Não inclui URLs de propósito: um modelo de
// 1B tende a corromper ou inventar links. Os links verdadeiros são mostrados
// pela interface diretamente a partir do catálogo.
export function buildContext(tutorials, query = '') {
  if (!tutorials.length) return ''
  const missing = missingLanguages(tutorials, query)
  const lines = tutorials.map((t, i) =>
    `${i + 1}. "${t.title}" (${t.languages.join(', ')}; tema: ${CATEGORY_LABELS[t.categoryId] || t.category})`)
  return [
    'Referências verificadas do catálogo "build-your-own-x" (tutoriais para construir tecnologias do zero):',
    ...lines,
    // Sem esta nota, o modelo tende a afirmar que os tutoriais estão na
    // linguagem pedida mesmo quando o catálogo não tem nenhum nela.
    ...(missing.length
      ? [`O catálogo não tem tutoriais deste tema em ${missing.join(', ')}; diz isso ao aluno com honestidade.`]
      : []),
    'Se forem úteis, recomenda estes tutoriais pelo número e título. Não escrevas links nem inventes outros tutoriais; os links aparecem automaticamente abaixo da tua resposta.',
  ].join('\n')
}

// Linguagens pedidas na pergunta que nenhum dos resultados cobre.
export function missingLanguages(tutorials, query) {
  const { languages } = analyzeQuery(query)
  return [...languages].filter(lang => !tutorials.some(t =>
    t.languages.some(l => l === lang || LANGUAGE_FAMILY[l] === lang || ANY_LANGUAGE.has(l))))
}

// Pergunta gerada pelo explorador de projetos. Vive aqui, junto da pesquisa,
// porque tem de conter uma palavra de intenção e o nome do tema que
// findTutorials reconhece; o teste de ida-e-volta garante que assim é.
export function explorerQuestion(categoryId, language = '') {
  const label = (CATEGORY_LABELS[categoryId] || categoryId).toLowerCase()
  return `Quero construir um projeto de ${label}${language ? ` em ${language}` : ''}. Por onde começo?`
}

export function listCategories(catalog) {
  const counts = new Map()
  for (const e of catalog.entries) counts.set(e.categoryId, (counts.get(e.categoryId) || 0) + 1)
  return [...counts].map(([id, count]) => ({ id, label: CATEGORY_LABELS[id] || id, count }))
}

export function listLanguages(catalog) {
  const counts = new Map()
  for (const e of catalog.entries) for (const l of e.languages) counts.set(l, (counts.get(l) || 0) + 1)
  // Por frequência: as linguagens com mais tutoriais aparecem primeiro no filtro.
  return [...counts].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }))
}
