# Proveniência: Academic Research Skills (ARS)

As pastas `deep-research/`, `academic-paper/`, `academic-paper-reviewer/` e
`academic-pipeline/` são cópias das skills de **Academic Research Skills**,
de Cheng-I Wu (Imbad0202).

- Repositório de origem: https://github.com/Imbad0202/academic-research-skills
- Versão: 3.22.2 (commit `e79085d0d38609984ef8cfe0faf2d254aac9e0a9`, 2026-09-25)
- Licença: CC BY-NC 4.0 (`LICENSE` em cada pasta). Uso não comercial, com atribuição.
- Método de instalação: "Method 1: As project skills" do `docs/SETUP.md` de origem,
  que copia apenas as quatro pastas. Nada foi alterado.

## O que fica de fora e o que isso implica

O projeto de origem é um plugin completo. Estas partes não foram copiadas:

- `shared/` (protocolos, contratos, esquemas) e `scripts/` (verificadores Python).
  Os `SKILL.md` citam caminhos como `shared/handoff_schemas.md` e
  `scripts/check_pipeline_integrity.py`, relativos à raiz do repositório de origem.
  Aqui não existem, pelo que as verificações determinísticas (gate de citações,
  integridade do pipeline, verificador de acrónimos) ficam inativas. As skills
  continuam a funcionar, porque são conduzidas por prompts.
- `commands/` (`/ars-*`), `agents/` e `hooks/`: só entram com a instalação como plugin.
- `.claude/CLAUDE.md` de origem (cerca de 77 KB, na maior parte changelog). O guia
  manda fundi-lo com o CLAUDE.md do projeto, mas isso carregaria esse volume em
  todas as sessões deste repositório de código.

Para ter o sistema completo, é preferível instalar o plugin no Claude Code:

```bash
/plugin marketplace add Imbad0202/academic-research-skills
/plugin install academic-research-skills
```

## Atualizar

```bash
git clone --depth 1 https://github.com/Imbad0202/academic-research-skills /tmp/ars
for s in deep-research academic-paper academic-paper-reviewer academic-pipeline; do
  rm -rf ".claude/skills/$s" && cp -R "/tmp/ars/$s" ".claude/skills/$s"
  cp /tmp/ars/LICENSE /tmp/ars/CITATION.cff ".claude/skills/$s/"
done
```
