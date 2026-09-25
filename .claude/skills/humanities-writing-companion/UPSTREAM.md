# Proveniência

Cópia vendorizada da skill **Humanities Writing Companion**, de Cong Shen (tizzy916).

- Repositório de origem: https://github.com/tizzy916/humanities-writing-companion
- Versão: 5.1.0 (commit `e097ff629f6575af1b2ec129afa7b23f30d2a39c`, 2026-09-22)
- Licença: CC BY-NC 4.0 (ver `LICENSE`). Uso não comercial, com atribuição.
- Como citar: ver `CITATION.cff`.

Ficheiros copiados sem alterações: `SKILL.md`, `SKILL.zh.md`, `LICENSE`,
`CITATION.cff`, `references/` e `scripts/` (incluindo `scripts/tests/`).
Ficaram de fora a documentação do projeto de origem (`README*`, `docs/`,
`CONTRIBUTING*`, `CHANGELOG.md`) e a configuração de CI (`.github/`), que
não são lidas pela skill.

## Atualizar

```bash
git clone --depth 1 https://github.com/tizzy916/humanities-writing-companion /tmp/hwc
cp -r /tmp/hwc/{SKILL.md,SKILL.zh.md,LICENSE,CITATION.cff,references,scripts} \
  .claude/skills/humanities-writing-companion/
```

Depois, atualizar a versão e o commit acima e correr os testes:

```bash
cd .claude/skills/humanities-writing-companion
SKIP_NETWORK=1 zsh scripts/tests/run_tests.sh
python3 scripts/tests/test_regressions.py
```

Os scripts `.sh` exigem **zsh**; os `.py` exigem Python 3.
`citation-verify.py` envia metadados de citações para Crossref/OpenAlex.
