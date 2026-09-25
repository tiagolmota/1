# Vue 3 + Vite

This template should help get you started developing with Vue 3 in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about IDE Support for Vue in the [Vue Docs Scaling up Guide](https://vuejs.org/guide/scaling-up/tooling.html#ide-support).

## Catálogo "build-your-own-x"

O assistente usa como base de conhecimento o catálogo
[codecrafters-io/build-your-own-x](https://github.com/codecrafters-io/build-your-own-x)
(domínio público, CC0): 359 tutoriais para recriar tecnologias do zero, de
sistemas operativos a motores de jogo.

- `scripts/build-byox-catalog.mjs` converte o README do repositório original em
  `src/data/byox-catalog.json`, fixado num commit concreto para ser reprodutível.
  Para atualizar: `npm run catalog -- --ref main`.
- `src/knowledge/byox.js` faz a pesquisa lexical, com sinónimos em português,
  quando o aluno pede para construir algo ("quero criar um jogo em Python").
- O modelo recebe apenas os títulos encontrados; os links mostrados ao aluno vêm
  sempre do JSON, nunca do texto gerado, para evitar URLs inventados.
- O botão "Ideias de projetos" abre um explorador por tema e linguagem, que
  funciona mesmo antes de o modelo ser carregado.

Testes: `npm test`.
