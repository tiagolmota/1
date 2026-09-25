// Normalização de texto partilhada pelas bases de conhecimento.
//
// Vive num módulo próprio porque as duas pesquisas (build-your-own-x e
// awesome) têm de tokenizar a pergunta exatamente da mesma forma; se uma
// tratasse "c++" ou os acentos de maneira diferente, a mesma pergunta daria
// resultados incoerentes entre os dois blocos de referências.

// Minúsculas e sem acentos (as perguntas chegam com e sem acentuação),
// preservando "+", "#" e "." dentro de palavras para não confundir "c++" ou
// "c#" com "c".
export function normalize(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

export function tokenize(text) {
  return normalize(text)
    .split(/[^a-z0-9+#.]+/)
    .map(t => t.replace(/^\.+|\.+$/g, ''))
    .filter(Boolean)
}
