#!/usr/bin/env node
// Converte o README do repositório codecrafters-io/build-your-own-x num
// catálogo JSON estruturado (src/data/byox-catalog.json).
//
// Porquê um script e não uma cópia manual: o README é mantido pela comunidade
// e muda com frequência. Um parser determinístico permite regenerar o catálogo
// sempre que quisermos atualizar, e o commit de origem fica registado no JSON,
// o que torna cada versão do catálogo rastreável até à fonte.
//
// Uso:
//   node scripts/build-byox-catalog.mjs                  # descarrega a versão fixada
//   node scripts/build-byox-catalog.mjs --ref main       # descarrega outra ref
//   node scripts/build-byox-catalog.mjs --file README.md # usa um ficheiro local

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO = 'codecrafters-io/build-your-own-x'
// Commit fixado por omissão: garante que duas execuções produzem o mesmo
// resultado, em vez de dependerem do estado momentâneo do ramo principal.
const DEFAULT_REF = 'aa17439b62f384511a5561ce308e9598b94d8989'

const here = dirname(fileURLToPath(import.meta.url))
const OUTPUT = resolve(here, '../src/data/byox-catalog.json')

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
  const url = `https://raw.githubusercontent.com/${REPO}/${ref}/README.md`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Falha ao descarregar ${url}: HTTP ${res.status}`)
  return res.text()
}

// Formato canónico de uma entrada no README:
//   * [**Linguagem**: _Título_](url) [video]
// Há variações reais no ficheiro (título sem itálico, espaço antes de "]",
// marcador [video] na linha seguinte), por isso o padrão é tolerante: o
// itálico e o espaço são opcionais e o marcador é tratado à parte.
const ENTRY_RE = /^\*\s+\[\*\*(.+?)\*\*:\s*(.+?)\s*\]\((\S+?)\)\s*(?:\[(video|pdf)\])?\s*$/
const CATEGORY_RE = /^####\s+Build your own `(.+)`\s*$/
const UNCATEGORIZED_RE = /^####\s+Uncategorized\s*$/
const MEDIA_ONLY_RE = /^\s+\[(video|pdf)\]\s*$/

// Gera um identificador estável para a categoria, usado no filtro da
// interface e nas palavras-chave de pesquisa (ver src/knowledge/byox.js).
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function parseReadme(markdown) {
  const lines = markdown.split(/\r?\n/)
  const entries = []
  const skipped = []
  let category = null
  let inTutorials = false

  for (const line of lines) {
    // Só interessa a secção "## Tutorials"; o índice do topo e as secções
    // "Contribute"/"License" também têm listas com links que não são tutoriais.
    if (/^##\s+Tutorials/.test(line)) { inTutorials = true; continue }
    if (/^##\s+/.test(line) && inTutorials) { inTutorials = false; continue }
    if (!inTutorials) continue

    const cat = line.match(CATEGORY_RE)
    if (cat) { category = cat[1].trim(); continue }
    if (UNCATEGORIZED_RE.test(line)) { category = 'Uncategorized'; continue }

    // Marcador de media isolado: pertence à entrada imediatamente anterior.
    const media = line.match(MEDIA_ONLY_RE)
    if (media && entries.length) { entries[entries.length - 1].format = media[1]; continue }

    if (!line.startsWith('*')) continue
    const m = line.match(ENTRY_RE)
    if (!m || !category) { skipped.push(line); continue }

    const [, langRaw, titleRaw, url, format] = m
    entries.push({
      category,
      categoryId: slugify(category),
      // "C# / TypeScript / JavaScript" -> três linguagens; "(any)" -> qualquer.
      languages: langRaw.split('/').map(s => s.trim()).filter(Boolean),
      // Remove os sublinhados do itálico Markdown quando existem.
      title: titleRaw.replace(/^_+|_+$/g, '').trim(),
      url,
      format: format || 'text',
    })
  }
  return { entries, skipped }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const markdown = await loadReadme(args)
  const { entries, skipped } = parseReadme(markdown)

  // Linhas não reconhecidas são reportadas em vez de descartadas em silêncio:
  // uma mudança de formato no README deve ser visível, não perder dados.
  if (skipped.length) {
    console.warn(`Aviso: ${skipped.length} linha(s) não reconhecida(s):`)
    for (const s of skipped) console.warn('  ' + s)
  }

  const catalog = {
    source: {
      repository: `https://github.com/${REPO}`,
      ref: args.file ? `file:${args.file}` : args.ref,
      license: 'CC0-1.0',
      attribution: 'Compilado por CodeCrafters, Inc. e contribuidores de build-your-own-x.',
    },
    count: entries.length,
    entries,
  }

  await mkdir(dirname(OUTPUT), { recursive: true })
  await writeFile(OUTPUT, JSON.stringify(catalog, null, 2) + '\n')
  console.log(`Catálogo escrito em ${OUTPUT} (${entries.length} tutoriais).`)
}

// Permite importar parseReadme nos testes sem executar o download.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(err => { console.error(err); process.exit(1) })
}
