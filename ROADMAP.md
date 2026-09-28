# Roadmap

Plán dalších kroků projektu. Každý krok je samostatný malý úkol: udělat, zkontrolovat, commitnout.

## Hotovo

- [x] Playwright + TypeScript, prohlížeč Chromium, `baseURL`, `testIdAttribute: 'data-test'`
- [x] Smoke test domovské stránky: `tests/smoke/homepage.spec.ts`
- [x] Test přístupnosti `alt` u obrázků produktů: `tests/accessibility/product-images.spec.ts`,
      známá chyba [BUG-001](bugs/bug-001-product-images-missing-alt.md), označeno `test.fail()`
- [x] `CLAUDE.md` s pravidly projektu a konvencí pro známé chyby
- [x] `.claude/settings.json`: testy bez ptaní, `git commit` a `git push` vždy s potvrzením
- [x] Skill `bug-report` (`.claude/skills/bug-report/SKILL.md`): postup a šablona podle BUG-001,
      aby každý bug report vypadal stejně
- [x] Test nadpisu řazení: `tests/smoke/sort-heading.spec.ts`,
      známá chyba [BUG-002](bugs/bug-002-sort-heading-typo.md) („Sorth“), označeno `test.fail()`
- [x] Simulace práce v Jiře (prostor TQA): úkol TQA-1 „Otestovat přihlášení zákazníka“,
      [analýza a výsledky](tasks/tqa-1-login.md), testy `tests/auth/login.spec.ts`,
      chyby BUG-003 až BUG-005 (Jira TQA-2 až TQA-4)
- [x] Skill `jira-ticket` (`.claude/skills/jira-ticket/SKILL.md`): postup z TQA-1 jako opakovatelný
      proces, spouští se ručně `/jira-ticket TQA-N`
- [x] Hook proti `waitForTimeout` (`.claude/hooks/block-wait-for-timeout.mts`, zapojený
      v `.claude/settings.json`): zablokuje Write/Edit, který by `waitForTimeout(` přidal do `.ts`/`.js`
      souboru. Pravidlo v `CLAUDE.md` je jen prosba, hook je zámek.
- [x] Subagent `test-reviewer` (`.claude/agents/test-reviewer.md`): jen čte (Read, Grep, Glob),
      kontroluje testy proti `CLAUDE.md` (nálezy) a obecným zvykům Playwrightu (doporučení).
      Ověřený na souboru se schválnými chybami (našel všech 8).

## Další kroky

1. **Playwright Test Agents** (`npx playwright init-agents --loop=claude`): vyzkoušet
   planner (napíše testovací plán) a generator (z plánu napíše testy) na jedné oblasti,
   např. vyhledávání.
   - ⚠️ **Healer nepoužívat, nebo mu přepsat instrukce.** Podle svých instrukcí se nemá ptát
     a má udělat cokoli, aby test prošel; když to nejde, označí ho `test.fixme()`. Na e-shopu
     se záměrnými chybami by schovával skutečné chyby aplikace, což je v rozporu s `CLAUDE.md`.
   - Příkaz vytvoří i `.mcp.json` a další soubory. Před spuštěním zjistit, které přesně.

2. **Vyzkoušet skill `jira-ticket`** na novém ticketu (např. košík nebo registrace)
   a podle výsledku ho doladit.

## Nápady na další testy

- Z `test-reviewer`: `tests/accessibility/product-images.spec.ts` čeká jen na první obrázek,
  pak kontroluje `alt` jednorázově. Když se zbytek produktů ještě vykresluje, může projít
  a `test.fail()` by hlásil falešné „opraveno“. Zvážit `expect.poll(...)`.

- `alt` u obrázků i na dalších stránkách: stránkování, kategorie, detail produktu.
- Položka menu zní „Contakt“ místo „Contact“.
- Logo v hlavičce se nenačte (rozbitý obrázek). Ověřit i `alt`, podobně jako BUG-001.
- Výběr řazení je po načtení prázdný. Ověřit, jestli je to chyba, nebo jen nevybraná výchozí hodnota.
- Z TQA-1 (viz [tasks/tqa-1-login.md](tasks/tqa-1-login.md), sekce 4): API registrace vrací hash hesla;
  tlačítko zobrazení hesla nemá přístupný název; hláška přihlášení nemá `aria-live`;
  odkaz „Home“ vede na `#/contact`.
