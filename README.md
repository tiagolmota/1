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
- O botão "Ideias e recursos" abre um explorador por tema e linguagem, que
  funciona mesmo antes de o modelo ser carregado.

## Catálogo "awesome"

A segunda base de conhecimento é [sindresorhus/awesome](https://github.com/sindresorhus/awesome)
(CC0): 671 listas curadas de recursos por tema, de linguagens de programação a
matemática e segurança. Responde a pedidos de recursos ("onde posso aprender
Python?"), enquanto build-your-own-x responde a pedidos de projetos; as duas
pesquisas são independentes e podem aparecer na mesma resposta.

- `scripts/build-awesome-catalog.mjs` gera `src/data/awesome-catalog.json`,
  preservando a hierarquia (p.ex. "Linux › Containers"). Para atualizar:
  `npm run catalog:awesome -- --ref main`.
- `src/knowledge/awesome.js` traduz termos portugueses com um glossário e
  expressões fixas ("base de dados" → *database*). Um tema sem lista no catálogo
  (física, por exemplo) não devolve nada, em vez de um resultado aproximado.
- No explorador, o separador "Listas de recursos" tem pesquisa por texto (em
  inglês) e filtro por secção.

Testes: `npm test`.
