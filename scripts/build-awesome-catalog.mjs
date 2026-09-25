#!/usr/bin/env node
// Converte o readme de sindresorhus/awesome (a "lista de listas awesome") num
// catálogo JSON (src/data/awesome-catalog.json).
//
// Porquê um parser próprio e não o de build-your-own-x: aqui cada entrada é
// uma lista curada sobre um tema (não um tutorial), tem descrição opcional e
// pode estar aninhada sob um "pai" (p.ex. "Linux" > "Containers"). Sem o pai,
// um item chamado "Containers" ou "Apps" ficaria sem significado.
//
// Uso:
//   node scripts/build-awesome-catalog.mjs                  # versão fixada
//   node scripts/build-awesome-catalog.mjs --ref main       # outra ref
//   node scripts/build-awesome-catalog.mjs --file readme.md # ficheiro local

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO = 'sindresorhus/awesome'
// Fixado para que o catálogo seja reprodutível e rastreável até à fonte.
const DEFAULT_REF = 'bc98e517ddca672f55f9857d714fc3ea3c3540b2'

// Secções que não são temas: o índice repete os títulos e "Related" aponta
// para ferramentas sobre as próprias listas, não para conteúdo de estudo.
const EXCLUDED_SECTIONS = new Set(['Contents', 'Related'])

const here = dirname(fileURLToPath(import.meta.url))
const OUTPUT = resolve(here, '../src/data/awesome-catalog.json')

function parseArgs(argv) {
  const args = { ref: DEFAULT_REF, file: null }
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--ref') args.ref = argv[++i]
    else if (argv[i] === '--file') args.file = argv[++i]
  }
  return args
}

async function loadReadme({ ref, file }) {
  if (file) return readFile(file, 'utf8')
  const url = `https://raw.githubusercontent.com/${REPO}/${ref}/readme.md`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Falha ao descarregar ${url}: HTTP ${res.status}`)
  return res.text()
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// "- [Nome](url) - Descrição." com indentação por tabs (ou espaços) e
// descrição opcional. O nome pode conter parênteses retos escapados raros,
// por isso aceitamos tudo até "](".
// O separador é normalmente "-", mas há contribuições com "–" ou "—".
const LINK_ITEM_RE = /^([\t ]*)- \[(.+?)\]\((\S+?)\)(?:\s+[-–—]\s+(.+?))?\s*$/
// "- Linux" ou "- macOS - Descrição.": agrupador sem link próprio.
const GROUP_ITEM_RE = /^([\t ]*)- ([^[\]()]+?)(?:\s+[-–—]\s+(.+?))?\s*$/

// Profundidade da indentação. O readme usa tabs; tratamos 2 espaços como um
// nível para tolerar contribuições que usem espaços.
function depthOf(indent) {
  return (indent.match(/\t/g) || []).length + Math.floor(indent.replace(/\t/g, '').length / 2)
}

export function parseReadme(markdown) {
  const entries = []
  const skipped = []
  let section = null
  // Pilha de nomes por nível de indentação, para reconstruir o caminho
  // "Linux > Containers" de cada item aninhado.
  let stack = []

  for (const line of markdown.split(/\r?\n/)) {
    const h = line.match(/^##\s+(.+?)\s*$/)
    if (h) { section = h[1]; stack = []; continue }
    if (!section || EXCLUDED_SECTIONS.has(section)) continue
    if (!/^[\t ]*- /.test(line)) continue

    const link = line.match(LINK_ITEM_RE)
    const group = link ? null : line.match(GROUP_ITEM_RE)
    if (!link && !group) { skipped.push(line); continue }

    const depth = depthOf((link || group)[1])
    const name = (link ? link[2] : group[2]).trim()
    stack = stack.slice(0, depth)
    const parent = stack.length ? stack.join(' › ') : null
    stack[depth] = name

    // Agrupadores sem link não são entradas navegáveis; servem só de contexto.
    if (!link) continue

    entries.push({
      section,
      sectionId: slugify(section),
      parent,
      name,
      url: link[3],
      // Remove o ponto final para a descrição poder ser composta noutras frases.
      description: (link[4] || '').replace(/\.$/, ''),
    })
  }
  return { entries, skipped }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const { entries, skipped } = parseReadme(await loadReadme(args))

  // Tornar visível qualquer mudança de formato, em vez de perder entradas.
  if (skipped.length) {
    console.warn(`Aviso: ${skipped.length} linha(s) não reconhecida(s):`)
    for (const s of skipped) console.warn('  ' + s)
  }

  const catalog = {
    source: {
      repository: `https://github.com/${REPO}`,
      ref: args.file ? `file:${args.file}` : args.ref,
      license: 'CC0-1.0',
      attribution: 'Lista curada por Sindre Sorhus e contribuidores de sindresorhus/awesome.',
    },
    count: entries.length,
    entries,
  }

  await mkdir(dirname(OUTPUT), { recursive: true })
  await writeFile(OUTPUT, JSON.stringify(catalog, null, 2) + '\n')
  console.log(`Catálogo escrito em ${OUTPUT} (${entries.length} listas).`)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(err => { console.error(err); process.exit(1) })
}
