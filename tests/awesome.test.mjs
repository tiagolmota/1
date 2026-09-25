// Testes do parser e da pesquisa do catálogo sindresorhus/awesome.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parseReadme } from '../scripts/build-awesome-catalog.mjs'
import { findLists, buildContext, displayName, listSections } from '../src/knowledge/awesome.js'

const catalog = JSON.parse(readFileSync(new URL('../src/data/awesome-catalog.json', import.meta.url), 'utf8'))
const names = (q) => findLists(catalog, q).map(displayName)

test('parser reconstrói a hierarquia e ignora secções meta', () => {
  const md = [
    '## Contents',
    '- [Platforms](#platforms)',
    '## Platforms',
    '- [Node.js](https://example.com/node) - Runtime.',
    '\t- [Cross-Platform](https://example.com/cp) - Portable code.',
    '- Linux',
    '\t- [Containers](https://example.com/lc)',
    '- [Transit](https://example.com/t) – En dash separator.',
    '## Related',
    '- [All Awesome Lists](https://example.com/all) - Meta.',
  ].join('\n')
  const { entries, skipped } = parseReadme(md)
  assert.equal(skipped.length, 0)
  assert.deepEqual(entries.map(e => e.name), ['Node.js', 'Cross-Platform', 'Containers', 'Transit'])
  assert.equal(entries[1].parent, 'Node.js')
  // Agrupador sem link: não é entrada, mas dá contexto aos filhos.
  assert.equal(entries[2].parent, 'Linux')
  assert.equal(entries[2].description, '')
  assert.equal(entries[3].description, 'En dash separator')
})

test('catálogo gerado é consistente', () => {
  assert.equal(catalog.count, catalog.entries.length)
  assert.equal(catalog.source.license, 'CC0-1.0')
  for (const e of catalog.entries) assert.match(e.url, /^https?:\/\//, `URL inválido em "${e.name}"`)
})

test('nome de linguagem encontra a lista dessa linguagem', () => {
  assert.equal(names('Onde posso aprender Python?')[0], 'Python')
})

test('glossário português → inglês', () => {
  assert.equal(names('Recomendas materiais de matemática?')[0], 'Math')
  assert.ok(names('recursos sobre segurança').includes('Security'))
})

test('expressões de várias palavras não se partem', () => {
  assert.deepEqual(names('recursos de bases de dados'), ['Database', 'Database Tools'])
  assert.equal(names('onde aprender a programar')[0], 'Learn to Program')
})

test('sublistas de outros temas não respondem por palavras genéricas', () => {
  // O catálogo não tem lista de física; "Swift › Education" não serve.
  assert.deepEqual(names('ferramentas para professores de física'), [])
})

test('sem pedido de recursos não sugere listas', () => {
  assert.deepEqual(names('Explica a fotossíntese'), [])
  assert.deepEqual(names('Python é uma cobra?'), [])
})

test('contexto para o modelo não expõe URLs', () => {
  const ctx = buildContext(findLists(catalog, 'recursos para aprender javascript'))
  assert.match(ctx, /JavaScript/)
  assert.doesNotMatch(ctx, /https?:\/\//)
  assert.equal(buildContext([]), '')
})

test('todas as secções têm nome em português', () => {
  for (const s of listSections(catalog)) assert.notEqual(s.label, s.id, `sem tradução: ${s.id}`)
})
