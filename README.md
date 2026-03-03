# Cursor Skills

Repositório de skills para assistentes de código (Cursor, Claude Code, Gemini CLI, etc.). Inclui scripts para fazer deploy das pastas de skills mantidas pelo time para as pastas corretas de cada IDE.

## Compatibilidade

As skills seguem o formato **SKILL.md** e funcionam em qualquer IDE/CLI que suporte agentic skills.

| IDE / CLI       | Caminho (global)                    |
| :-------------- | :---------------------------------- |
| **Cursor**     | `~/.cursor/skills/`                |
| **Claude Code**| `~/.claude/skills/`                 |
| **Gemini CLI** | `~/.gemini/skills/`                 |
| **Codex CLI**  | `$CODEX_HOME/skills/` ou `~/.codex/skills/` |
| **Kiro**       | `~/.kiro/skills/`                   |
| **Antigravity**| `~/.gemini/antigravity/skills/`    |
| **OpenCode**   | `~/.agents/skills/`                 |
| **AdaL CLI**   | `~/.adal/skills/`                   |

---

## Deploy de skills (nosso time)

Três scripts npm copiam as skills das pastas locais para os destinos corretos.

### 1. Deploy contraktor (skills gerais)

Copia o conteúdo de **`skills-contraktor/`** para as pastas globais dos IDEs. Sem argumentos, copia apenas para **Cursor** (`~/.cursor/skills/`).

```bash
# Apenas Cursor (padrão)
npm run deploy:contraktor

# Outros IDEs (flags)
npm run deploy:contraktor -- --claude --gemini

# Todos os IDEs
npm run deploy:contraktor -- --all

# Ajuda
npm run deploy:contraktor -- --help
```

Flags disponíveis: `--cursor`, `--claude`, `--gemini`, `--codex`, `--kiro`, `--antigravity`, `--opencode`, `--adal`, `--all`.

### 2. Deploy shuri-api (skills do projeto Shuri)

Copia o conteúdo de **`skills-contraktor-shuri-api/`** para **`<basePath>/.cursor/skills/`**. Use quando for trabalhar em um projeto específico (ex.: shuri-api) e quiser as skills disponíveis no Cursor daquele projeto.

```bash
# Exemplo: deploy para o projeto shuri-api
npm run deploy:shuri-api -- /opt/projetos/shuri/shuri-api

# Ajuda
npm run deploy:shuri-api -- --help
```

O script cria `basePath/.cursor/skills/` se não existir e copia todas as skills de `skills-contraktor-shuri-api/` para lá.

### 3. Deploy shuri-front (skills do front Shuri)

Copia o conteúdo de **`skills-contraktor-shuri-front/`** para **`<basePath>/.cursor/skills/`**. Use para o projeto front do Shuri.

```bash
# Exemplo: deploy para o projeto shuri-front
npm run deploy:shuri-front -- /opt/projetos/shuri/shuri-front

# Ajuda
npm run deploy:shuri-front -- --help
```

O script cria `basePath/.cursor/skills/` se não existir e copia todas as skills de `skills-contraktor-shuri-front/` para lá.

---

## Licença

MIT. Ver [LICENSE](LICENSE).
