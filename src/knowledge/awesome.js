// Pesquisa sobre o catálogo sindresorhus/awesome (listas curadas por tema).
//
// Papel complementar ao de build-your-own-x: aquele responde a "quero
// construir X"; este responde a "onde encontro recursos, ferramentas ou
// materiais sobre X". Por isso as palavras de intenção são diferentes e os
// dois blocos podem aparecer juntos na mesma resposta.
//
// Tal como em byox.js, a pesquisa é lexical (sem embeddings) para não
// competir com o modelo local pela memória do navegador.

import { tokenize } from './text.js'

// Nomes em português das secções do readme, para a interface.
export const SECTION_LABELS = {
  platforms: 'Plataformas',
  'programming-languages': 'Linguagens de programação',
  'front-end-development': 'Desenvolvimento front-end',
  'back-end-development': 'Desenvolvimento back-end',
  'computer-science': 'Ciência da computação',
  'big-data': 'Big data',
  theory: 'Teoria',
  books: 'Livros',
  editors: 'Editores',
  gaming: 'Jogos',
  'development-environment': 'Ambiente de desenvolvimento',
  entertainment: 'Entretenimento',
  databases: 'Bases de dados',
  media: 'Media',
  learn: 'Aprender',
  security: 'Segurança',
  'content-management-systems': 'Gestão de conteúdos (CMS)',
  hardware: 'Hardware',
  business: 'Negócios',
  work: 'Trabalho',
  networking: 'Redes',
  'decentralized-systems': 'Sistemas descentralizados',
  'health-and-social-science': 'Saúde e ciências sociais',
  events: 'Eventos',
  testing: 'Testes',
  miscellaneous: 'Diversos',
}

// Ponte português → inglês. Os nomes e descrições do catálogo estão em
// inglês; sem este glossário, só nomes próprios ("Python", "React")
// coincidiriam. A lista cobre temas do secundário e de programação
// introdutória; não pretende ser um dicionário, e um termo ausente
// simplesmente não encontra nada (preferível a um resultado errado).
const GLOSSARY = {
  jogo: ['game'], jogos: ['game'], videojogos: ['game'],
  seguranca: ['security'], ciberseguranca: ['security', 'hacking'], hacking: ['hacking'],
  dados: ['data', 'database'], base: [], bases: [],
  matematica: ['math', 'mathematics'], fisica: ['physics'], quimica: ['chemistry'],
  biologia: ['biology'], astronomia: ['astronomy'], geografia: ['gis', 'geospatial'],
  mapas: ['map', 'gis'], economia: ['economics'], financas: ['finance'],
  historia: ['history'], musica: ['music', 'audio'], som: ['audio', 'sound'],
  video: ['video'], imagem: ['image'], imagens: ['image'], fotografia: ['photography'],
  design: ['design'], desenho: ['design', 'drawing'], cores: ['color'],
  rede: ['network', 'networking'], redes: ['network', 'networking'],
  ciencia: ['science'], ciencias: ['science'], computacao: ['computer', 'computing'],
  programacao: ['programming'], programar: ['programming', 'program'], algoritmos: ['algorithm'],
  livros: ['book'], livro: ['book'], cursos: ['course'], curso: ['course'],
  educacao: ['education', 'educational'], educativo: ['educational'], educativos: ['educational'],
  ensino: ['education', 'educational', 'teaching'], professores: ['teaching', 'education'],
  criancas: ['kid'], robotica: ['robotic'], robos: ['robotic'],
  ia: ['ai', 'artificial', 'intelligence'], inteligencia: ['intelligence'], artificial: ['artificial'],
  aprendizagem: ['learning'], automatica: ['machine'], maquina: ['machine'],
  saude: ['health'], medicina: ['medical', 'healthcare'], psicologia: ['psychology'],
  telemovel: ['mobile'], celular: ['mobile'], telemoveis: ['mobile'],
  aplicacoes: ['app'], apps: ['app'], site: ['web', 'website'], sites: ['web', 'website'],
  web: ['web'], internet: ['web'], navegador: ['browser'],
  testes: ['testing', 'test'], terminal: ['cli', 'shell', 'terminal'],
  linha: [], comandos: ['cli', 'command'], editor: ['editor'], editores: ['editor'],
  servidor: ['server'], servidores: ['server'], nuvem: ['cloud'],
  sistema: [], operativo: ['operating'], operacional: ['operating'],
  linux: ['linux'], windows: ['windows'], mac: ['macos'],
  graficos: ['graphics', 'visualization'], visualizacao: ['visualization'],
  estatistica: ['statistics'], blockchain: ['blockchain'], cripto: ['crypto', 'cryptography'],
  criptografia: ['cryptography'], privacidade: ['privacy'], acessibilidade: ['accessibility'],
  negocios: ['business'], empreendedorismo: ['startup', 'business'],
  gratuito: ['free'], gratuitos: ['free'], gratis: ['free'],
  produtividade: ['productivity'], escrita: ['writing'], apresentacoes: ['speaking', 'presentation'],
  hardware: ['hardware'], eletronica: ['electronic', 'arduino'], arduino: ['arduino'],
  realidade: ['reality'], aumentada: ['augmented'], virtual: ['virtual'],
}

// Expressões de várias palavras cujo sentido se perde palavra a palavra:
// "aprender" sozinho é só intenção, mas "aprender a programar" é o tema da
// lista "Learn to Program"; "base de dados" não é "base" + "dados".
const PHRASES = {
  'aprender a programar': ['learn', 'program'],
  'ciencia de dados': ['data', 'science'],
  'ciencia da computacao': ['computer', 'science'],
  'base de dados': ['database'],
  'bases de dados': ['database'],
  'aprendizagem automatica': ['machine', 'learning'],
  'aprendizado de maquina': ['machine', 'learning'],
  'linha de comandos': ['cli', 'command', 'line'],
  'sistema operativo': ['operating', 'system'],
  'sistema operacional': ['operating', 'system'],
}

// Pedidos de recursos. Sem uma destas palavras não sugerimos listas: numa
// conversa de estudo normal ("explica a fotossíntese") seria ruído.
const INTENT_WORDS = new Set([
  'recursos', 'recurso', 'lista', 'listas', 'ferramentas', 'ferramenta',
  'bibliotecas', 'biblioteca', 'materiais', 'material', 'links', 'sites',
  'recomendas', 'recomenda', 'recomendacoes', 'sugestoes', 'sugeres',
  'estudar', 'aprender', 'onde', 'awesome', 'referencias', 'livros', 'cursos',
])

const STOPWORDS = new Set([
  'a', 'o', 'as', 'os', 'um', 'uma', 'de', 'do', 'da', 'dos', 'das', 'em',
  'no', 'na', 'nos', 'nas', 'com', 'para', 'por', 'que', 'e', 'eu', 'me',
  'meu', 'minha', 'como', 'quero', 'queria', 'posso', 'pode', 'sobre', 'mais',
  'bons', 'boas', 'bom', 'boa', 'melhores', 'algum', 'alguns', 'alguma',
  'the', 'an', 'of', 'in', 'to', 'and', 'for', 'with', 'from', 'on', 'your',
  'that', 'by', 'or', 'is', 'are', 'it', 'its', 'you', 'all', 'awesome',
])

// Singularização mínima em inglês ("games" → "game"), aplicada dos dois
// lados. Um stemmer completo seria excessivo para títulos de duas palavras,
// e regras mais agressivas partiriam nomes próprios curtos.
function stem(token) {
  if (token.length > 4 && token.endsWith('ies')) return token.slice(0, -3) + 'y'
  if (token.length > 3 && token.endsWith('s') && !token.endsWith('ss')) return token.slice(0, -1)
  return token
}

function termsOf(text) {
  return tokenize(text).filter(t => !STOPWORDS.has(t)).map(stem)
}

// Índice por entrada, calculado uma vez: nome, contexto (pai e secção) e
// descrição têm pesos distintos na pontuação.
const indexCache = new WeakMap()
function indexOf(entry) {
  let idx = indexCache.get(entry)
  if (!idx) {
    idx = {
      name: new Set(termsOf(entry.name)),
      // Nome completo normalizado, para coincidências exatas ("react native").
      fullName: termsOf(entry.name).join(' '),
      context: new Set(termsOf(`${entry.parent || ''} ${entry.section}`)),
      description: new Set(termsOf(entry.description)),
    }
    indexCache.set(entry, idx)
  }
  return idx
}

export function analyzeQuery(query) {
  const raw = tokenize(query)
  const hasIntent = raw.some(t => INTENT_WORDS.has(t))
  const terms = new Set()
  // A expressão consome as suas palavras: se "dados" de "base de dados"
  // também fosse traduzido sozinho, "Data Science" empataria com "Database".
  let joined = ` ${raw.join(' ')} `
  for (const [phrase, english] of Object.entries(PHRASES)) {
    if (joined.includes(` ${phrase} `)) {
      english.forEach(e => terms.add(stem(e)))
      joined = joined.replace(` ${phrase} `, ' ')
    }
  }
  for (const t of joined.split(' ').filter(Boolean)) {
    if (STOPWORDS.has(t)) continue
    // Termos do glossário são substituídos pela tradução. O glossário vem
    // antes do filtro de intenção porque algumas palavras são as duas coisas:
    // "livros" pede recursos e é também o tema ("book").
    if (t in GLOSSARY) GLOSSARY[t].forEach(e => terms.add(stem(e)))
    // Os restantes (nomes próprios, termos já em inglês) passam tal como
    // estão, exceto as palavras de intenção sem tradução ("onde", "lista").
    else if (!INTENT_WORDS.has(t) && t.length > 1) terms.add(stem(t))
  }
  return { hasIntent, terms: [...terms], raw: raw.filter(t => !STOPWORDS.has(t)).map(stem).join(' ') }
}

// Pesos: o nome da lista é o sinal mais fiável (quem pede "Python" quer a
// lista "Python"); o contexto ajuda a desempatar; a descrição, mais longa e
// genérica, conta pouco para não promover listas que só mencionam o termo.
const WEIGHTS = { name: 5, childName: 3, context: 2, description: 1, fullName: 5 }
// Abaixo disto a coincidência é só na descrição ou no contexto, fraca demais
// para a apresentar ao aluno como "a lista sobre X".
const MIN_SCORE = 5

export function findLists(catalog, query, { limit = 3 } = {}) {
  const q = analyzeQuery(query)
  if (!q.hasIntent || !q.terms.length) return []

  const scored = []
  for (const entry of catalog.entries) {
    const idx = indexOf(entry)
    let score = 0
    // Uma sublista só vale como "a lista sobre X" se o pai também coincidir.
    // Sem esta regra, "professores de física" devolvia "Swift › Education" e
    // "Laravel › Education", que falam de educação mas dentro de outro tema.
    const parentMatched = entry.parent && q.terms.some(t => idx.context.has(t))
    const nameWeight = entry.parent && !parentMatched ? WEIGHTS.childName : WEIGHTS.name
    for (const term of q.terms) {
      if (idx.name.has(term)) score += nameWeight
      else if (idx.context.has(term)) score += WEIGHTS.context
      else if (idx.description.has(term)) score += WEIGHTS.description
    }
    // Nome com várias palavras contido literalmente na pergunta.
    if (idx.fullName.includes(' ') && q.raw.includes(idx.fullName)) score += WEIGHTS.fullName
    if (score >= MIN_SCORE) scored.push({ entry, score })
  }

  // Em empate, as listas de topo (sem pai) primeiro: "Python" antes de uma
  // sublista específica como "Python > Asyncio".
  scored.sort((a, b) => b.score - a.score || (a.entry.parent ? 1 : 0) - (b.entry.parent ? 1 : 0))
  return scored.slice(0, limit).map(s => s.entry)
}

export function displayName(entry) {
  return entry.parent ? `${entry.parent} › ${entry.name}` : entry.name
}

// Bloco de contexto para o modelo, sem URLs pelas mesmas razões de byox.js.
export function buildContext(lists) {
  if (!lists.length) return ''
  const lines = lists.map((l, i) =>
    `${String.fromCharCode(65 + i)}. Lista "${displayName(l)}"${l.description ? ` (${l.description})` : ''}`)
  return [
    'Listas curadas verificadas do catálogo "awesome" (coleções de recursos, em inglês):',
    ...lines,
    'Se forem úteis, recomenda estas listas pela letra e nome. Não escrevas links nem inventes outras listas; os links aparecem automaticamente abaixo da tua resposta.',
  ].join('\n')
}

export function listSections(catalog) {
  const counts = new Map()
  for (const e of catalog.entries) counts.set(e.sectionId, (counts.get(e.sectionId) || 0) + 1)
  return [...counts].map(([id, count]) => ({ id, label: SECTION_LABELS[id] || id, count }))
}
