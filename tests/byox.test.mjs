// Testes do parser e da pesquisa. Correm com o runner nativo do Node
// (`npm test`), sem dependências extra, porque o projeto não tem framework de
// testes e a lógica aqui é pura (sem DOM nem Vue).

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parseReadme } from '../scripts/build-byox-catalog.mjs'
import { findTutorials, buildContext, analyzeQuery, listCategories, explorerQuestion } from '../src/knowledge/byox.js'

const catalog = JSON.parse(readFileSync(new URL('../src/data/byox-catalog.json', import.meta.url), 'utf8'))

test('parser aceita as variações reais do README', () => {
  const md = [
    '* [Ignorado](#indice)',
    '## Tutorials',
    '#### Build your own `Shell`',
    '* [**C**: _Tutorial - Write a Shell in C_](https://example.com/a)',
    '* [**C**: Write a shell in C](https://example.com/b)',
    '* [**Rust**: _Hecto_ ](https://example.com/c)',
    '* [**C**: _Video game_](https://example.com/d)',
    '  [video]',
    '#### Uncategorized',
    '* [**C# / TypeScript**: _Coisa_](https://example.com/e) [pdf]',
    '## Contribute',
    '* [create an issue](https://example.com/issue)',
  ].join('\n')
  const { entries, skipped } = parseReadme(md)
  assert.equal(skipped.length, 0)
  assert.equal(entries.length, 5)
  assert.equal(entries[1].title, 'Write a shell in C')
  assert.equal(entries[2].title, 'Hecto')
  assert.equal(entries[3].format, 'video')
  assert.deepEqual(entries[4].languages, ['C#', 'TypeScript'])
  assert.equal(entries[4].categoryId, 'uncategorized')
  assert.equal(entries[4].format, 'pdf')
})

test('catálogo gerado é consistente', () => {
  assert.equal(catalog.count, catalog.entries.length)
  assert.equal(catalog.source.license, 'CC0-1.0')
  for (const e of catalog.entries) {
    assert.match(e.url, /^https?:\/\//, `URL inválido em "${e.title}"`)
    assert.ok(e.languages.length > 0)
  }
})

test('pergunta em português encontra a categoria em inglês', () => {
  const r = findTutorials(catalog, 'Quero construir o meu próprio sistema operativo')
  assert.ok(r.length > 0)
  assert.ok(r.every(e => e.categoryId === 'operating-system'))
})

test('a linguagem pedida tem prioridade', () => {
  const r = findTutorials(catalog, 'Como criar um jogo em Python?')
  assert.ok(r.length > 0)
  assert.equal(r[0].categoryId, 'game')
  assert.ok(r[0].languages.includes('Python'))
})

test('tema nomeado exclui outros temas na mesma linguagem', () => {
  const r = findTutorials(catalog, 'tutorial para fazer um bot de discord em javascript')
  assert.ok(r.length > 0)
  assert.ok(r.every(e => e.categoryId === 'bot'))
  assert.match(r[0].title, /Discord/)
})

test('c++ e c# não são confundidos com c', () => {
  assert.deepEqual([...analyzeQuery('fazer em c++').languages], ['C++'])
  assert.deepEqual([...analyzeQuery('fazer em c#').languages], ['C#'])
  assert.deepEqual([...analyzeQuery('fazer em C').languages], ['C'])
})

test('palavra ambígua cede à categoria mais específica', () => {
  const r = findTutorials(catalog, 'quero programar uma rede neuronal')
  assert.ok(r.length > 0)
  assert.ok(r.every(e => e.categoryId === 'neural-network'))
})

test('perguntas sem intenção de construir não recebem tutoriais', () => {
  assert.deepEqual(findTutorials(catalog, 'O que é a inteligência artificial?'), [])
  assert.deepEqual(findTutorials(catalog, 'Explica a fotossíntese'), [])
})

test('o contexto para o modelo não expõe URLs', () => {
  const r = findTutorials(catalog, 'criar um servidor web em Go')
  assert.ok(r.length > 0)
  const ctx = buildContext(r, 'criar um servidor web em Go')
  assert.doesNotMatch(ctx, /https?:\/\//)
  // O catálogo não tem servidores web em Go: o contexto tem de o admitir.
  assert.match(ctx, /não tem tutoriais deste tema em Go/)
  assert.equal(buildContext([]), '')
})

test('todas as categorias têm nome em português', () => {
  for (const c of listCategories(catalog)) assert.notEqual(c.label, c.id, `sem tradução: ${c.id}`)
})

test('perguntas do explorador encontram o próprio tema', () => {
  for (const { id } of listCategories(catalog)) {
    if (id === 'uncategorized') continue
    const r = findTutorials(catalog, explorerQuestion(id))
    assert.ok(r.length > 0, `sem resultados: ${id}`)
    assert.ok(r.every(e => e.categoryId === id), `tema errado para ${id}: ${r.map(e => e.categoryId)}`)
  }
})
