# Roadmap

Plán dalších kroků projektu. Každý krok je samostatný malý úkol: udělat, zkontrolovat, commitnout.

## Hotovo

- [x] Playwright + TypeScript, prohlížeč Chromium, `baseURL`, `testIdAttribute: 'data-test'`
- [x] Smoke test domovské stránky: `tests/smoke/homepage.spec.ts`
- [x] Test přístupnosti `alt` u obrázků produktů: `tests/accessibility/product-images.spec.ts`,
      známá chyba [BUG-001](bugs/bug-001-product-images-missing-alt.md), označeno `test.fail()`
- [x] `CLAUDE.md` s pravidly projektu a konvencí pro známé chyby
- [x] `.claude/settings.json`: testy bez ptaní, `git commit` a `git push` vždy s potvrzením

## Další kroky

1. **Skill `bug-report`** (`.claude/skills/bug-report/SKILL.md`): postup a šablona podle BUG-001,
   aby každý bug report vypadal stejně.
2. **Subagent `test-reviewer`** (`.claude/agents/test-reviewer.md`): smí jen číst (Read, Grep, Glob)
   a kontroluje testy proti pravidlům z `CLAUDE.md`.
3. **Hook proti `waitForTimeout`** (`.claude/settings.json`): automaticky zablokuje test,
   který ho obsahuje. Pravidlo v `CLAUDE.md` je jen prosba, hook je zámek.
4. **Playwright Test Agents** (`npx playwright init-agents --loop=claude`): vyzkoušet
   planner (napíše testovací plán) a generator (z plánu napíše testy) na jedné oblasti,
   např. vyhledávání.
   - ⚠️ **Healer nepoužívat, nebo mu přepsat instrukce.** Podle svých instrukcí se nemá ptát
     a má udělat cokoli, aby test prošel; když to nejde, označí ho `test.fixme()`. Na e-shopu
     se záměrnými chybami by schovával skutečné chyby aplikace, což je v rozporu s `CLAUDE.md`.
   - Příkaz vytvoří i `.mcp.json` a další soubory. Před spuštěním zjistit, které přesně.

## Nápady na další testy

- Nadpis řazení na domovské stránce zní „Sorth“ místo „Sort“ (nejspíš záměrná chyba).
- `alt` u obrázků i na dalších stránkách: stránkování, kategorie, detail produktu.
