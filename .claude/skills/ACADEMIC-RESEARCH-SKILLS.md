# academic-research-skills (cópia de projeto)

As quatro pastas `deep-research/`, `academic-paper/`, `academic-paper-reviewer/`
e `academic-pipeline/` são uma cópia **sem alterações** do repositório
[Imbad0202/academic-research-skills](https://github.com/Imbad0202/academic-research-skills),
de Cheng-I Wu, no commit `e79085d0d38609984ef8cfe0faf2d254aac9e0a9`
(versão 3.22.2, 25-09-2026).

O Claude Code carrega-as automaticamente em qualquer sessão aberta sobre este
repositório. Cada skill ativa-se pelas frases de gatilho da sua descrição
(p.ex. "literature review", "peer review") ou pelo nome: `/deep-research`,
`/academic-paper`, `/academic-paper-reviewer`, `/academic-pipeline`.

## Licença

CC BY-NC 4.0 (texto completo em `LICENSE-academic-research-skills`). Permite
copiar e adaptar com atribuição, **só para fins não comerciais**, que a licença
define como uso "not primarily intended for or directed towards commercial
advantage or monetary compensation" (secção 1.i). Consultoria paga, formação
faturada ou produtos vendidos que dependam destas skills caem, à partida, fora
dessa definição; nesses casos convém pedir autorização ao autor. Isto é uma
leitura do texto da licença, não aconselhamento jurídico.

## O que ficou de fora, e porquê

Segue-se o método 1 ("project skills") da documentação do autor
(`docs/SETUP.md`), que copia só as quatro pastas. Fica de fora:

- **`shared/` e `scripts/`** (na raiz do repositório original). Várias
  instruções remetem para ficheiros como `shared/handoff_schemas.md` ou
  `scripts/check_pipeline_integrity.py`. Nesta cópia esses caminhos não
  existem, por isso as verificações determinísticas em Python (integridade do
  pipeline, citações, acrónimos) não correm; a metodologia escrita nos
  `SKILL.md`, agentes e referências continua disponível. Copiá-los para a raiz
  colidiria com a pasta `scripts/` deste projeto.
- **Comandos `/ars-*`, hooks e agentes de plugin.** Só existem na instalação
  como plugin (`/plugin install`), que é por utilizador e não por repositório.
  Os hooks do plugin interceptam `Write`/`Edit`/`Bash`; incluí-los aqui
  afetaria todo o trabalho neste repositório, incluindo o da aplicação Vue.
- **`.claude/CLAUDE.md` do autor** (405 linhas de regras de encaminhamento). O
  autor repete o núcleo dessas regras dentro de `academic-pipeline/SKILL.md`
  para instalações por cópia, e carregá-lo em todas as sessões deste
  repositório pesaria em tarefas sem relação com investigação.

As frases de gatilho existem em inglês, chinês, coreano e espanhol, mas não
em português. Em português, a forma fiável é chamar a skill pelo nome.

## Atualizar

```bash
git clone --depth 1 https://github.com/Imbad0202/academic-research-skills.git /tmp/ars
for d in deep-research academic-paper academic-paper-reviewer academic-pipeline; do
  rm -rf .claude/skills/$d && cp -R /tmp/ars/$d .claude/skills/$d
done
cp /tmp/ars/LICENSE .claude/skills/LICENSE-academic-research-skills
```

Atualiza depois o commit e a versão indicados no topo deste ficheiro.
