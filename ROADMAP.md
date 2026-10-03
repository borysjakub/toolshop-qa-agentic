# Roadmap

Plán dalších kroků projektu. Každý krok je samostatný malý úkol: udělat, zkontrolovat, commitnout.

## ▶ Kde pokračovat (stav k 3. 10. 2026)

Všechno je na GitHubu, CI zelené (59 testů proti lokální kopii v Dockeru). Zbývá jen Jira:

1. Spustit Claude Code (`claude --continue`) a ověřit `/mcp` → **atlassian = connected**.
   V minulé session se nástroje Jiry po přihlášení nenačetly, pomáhá restart Claude Code.
2. Zapsat do Jiry vše z [tasks/jira-pending.md](tasks/jira-pending.md): 6 chyb BUG-012 až
   BUG-017 (vazby Blocks na TQA-5), komentář a uzavření TQA-12, shrnutí do TQA-5.
3. Doplnit klíče ticketů do `bugs/bug-012` až `bug-017` (řádek **Jira**), smazat
   `tasks/jira-pending.md`, commit a push.

Pro databázové testy lokálně: Docker Desktop, `.\local-toolshop\start.ps1`, v `.env` `LOCAL_TOOLSHOP=1`.
Kontejnery nechat běžet není nutné: `.\local-toolshop\stop.ps1`.

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

- [x] **SQL testy** (`tests/db/`): Toolshop `sprint5-with-bugs` lokálně v Dockeru
      (`local-toolshop/start.ps1`), objednávka přes API a kontrola v databázi (mysql2).
      Chyby [BUG-012](bugs/bug-012-order-price-from-client.md) a [BUG-013](bugs/bug-013-order-for-another-customer.md) (Kritická).
      - Poučení: testy měnící sdílená data (sklad) si data připraví samy (`beforeAll` přes SQL)
        a běží jedním workerem (`workers: 1` v projektu `local-db`).
      - Při přípravě se omylem četl kód verze s chybami. Od té doby to blokuje hook
        `block-with-bugs-source.mts` (testujeme naslepo, specifikace je `sprint5/`).
- [x] **CI** (`.github/workflows/playwright.yml`): push, PR, denně. Běží proti lokální kopii
      v Dockeru na runneru, protože veřejné demo za Cloudflare občas zastaví CI („Performing
      security verification“) a testy `test.fail()` by pak „procházely“ ze špatného důvodu.
      Ověřeno: všechny testy se známou chybou selhávají lokálně ze stejného důvodu jako na veřejném webu.
- [x] **Košík** (Jira TQA-5) přes postup skillu `jira-ticket`: [výsledky](tasks/tqa-5-cart.md),
      chyby [BUG-014](bugs/bug-014-cart-line-total-zero.md) a [BUG-015](bugs/bug-015-cart-remove-does-nothing.md).
- [x] **TQA-12** rozhodnuto vedoucím QA (A): prázdné hledání po hledání se ignoruje.

- [x] **API testy** (`tests/api/`, 15 testů bez prohlížeče) a **Postman kolekce** (`postman/`,
      ověřená Newmanem na veřejném i lokálním API). Chyby [BUG-016](bugs/bug-016-api-returns-password-hash.md)
      (hash hesla v odpovědích) a [BUG-017](bugs/bug-017-register-reveals-password-hint.md).

- [x] **Hlídač známých chyb** (`reporters/known-bug-guard.ts`, helper `knownBug()`): test
      `test.fail()` musí selhat s očekávaným textem chyby, jinak běh selže. Ověřeno simulací
      výpadku: Playwright hlásil „2 passed“, hlídač běh správně shodil.

## Další kroky

1. **Jira**: založit tickety pro BUG-012 až BUG-017, okomentovat a uzavřít TQA-12,
   výsledek TQA-5 do komentáře (spojení s Jirou vyžaduje přihlášení).

## Historie: Playwright Test Agents

1. **Playwright Test Agents** (`npx playwright init-agents --loop=claude`): vyzkoušet
   planner (napíše testovací plán) a generator (z plánu napíše testy) na jedné oblasti,
   např. vyhledávání.
   - ⚠️ **Healer nepoužívat.** Podle svých instrukcí se nemá ptát a má udělat cokoli, aby test
     prošel; když to nejde, označí ho `test.fixme()`. Na e-shopu se záměrnými chybami by schovával
     skutečné chyby aplikace, což je v rozporu s `CLAUDE.md`.
   - **Průzkum hotový** (Playwright 1.63.0, zdroják `node_modules/playwright/lib/agents/generateAgents.js`).
     Příkaz vytvoří:
     - `.claude/agents/playwright-test-planner.md`, `…-generator.md`, `…-healer.md`
       (přepíše bez ptaní při každém spuštění; `test-reviewer` má jiný název, nevadí),
     - `.mcp.json` se serverem `playwright-test` (`cmd /c npx playwright run-test-mcp-server`),
       taky přepíše bez ptaní,
     - `specs/README.md` (jen když `specs/` neexistuje),
     - `tests/seed.spec.ts` (prázdný), jen když v `tests/` není žádný soubor s „seed“ v názvu.
   - **Postup:**
     1. [x] `tests/seed/seed.spec.ts`: otevře `/` a počká na vykreslení produktů.
        `init-agents` ho najde i v podsložce (hledá „seed“ v názvu všech testů projektu).
     2. [x] Hook proti `waitForTimeout` hlídá i `mcp__playwright-test__generator_write_test`
        (parametry `fileName`, `code`). Ověřeno simulovanými vstupy.
     3. [x] `init-agents` spuštěný, výstup zkontrolovaný, **healer smazaný**
        (další `init-agents` ho vrátí; po každém spuštění mazat znovu).
     4. [x] Planner napsal [plán vyhledávání](specs/search.md) (13 scénářů + odchylky),
        generator z něj 4 testy do `tests/search/` (1.1, 1.3, 1.5, 1.7).
        - Poučení: generator napsal souběh (četl starý seznam produktů), i když byl předem varovaný.
          Opraveno helperem `tests/helpers/search.ts` (`searchFor` čeká na odpověď API).
          Vygenerované testy vždy kontrolovat (`test-reviewer`, `--repeat-each=3`).
        - Planner nemá kam uložit vlastní sekce (`planner_save_plan`), odchylky se musí dopsat ručně.
        - Nalezená chyba [BUG-006](bugs/bug-006-search-hammer-misses-sledgehammer.md) (Jira TQA-6):
          „hammer“ nenajde Sledgehammer (chyba v API).
     5. [x] Zbylých 9 scénářů (1.2, 1.4, 1.6, 1.8–1.13) přes generator, s helperem v zadání.
        - Poučení: planner viděl jen příznaky („`%` nic neudělá“). Příčina (validace 3–40 znaků)
          se ukázala až při zkoumání, proč test selhává. Než chybu nahlásit, zjistit proč.
        - Rozdělení testu `special-characters` odhalilo další selhání, která zakrývalo první.
        - Nalezené chyby BUG-007 až BUG-011 (Jira TQA-7 až TQA-11), nejvážnější BUG-007:
          hledání ze stránky 2 nezobrazí nic.
        - Regulární výraz v `toHaveText` se neořezává: text prvků má mezery okolo, `^` selže.
        - `test-reviewer` a schválné rozbíjení nepouštět současně (reviewer pak hlásí rozbití).
   - [TQA-12](https://borysjakub.atlassian.net/browse/TQA-12) (prázdné hledání po hledání) rozhodnuto: A.

## Nápady na další testy

- Z `test-reviewer`: `tests/accessibility/product-images.spec.ts` čeká jen na první obrázek,
  pak kontroluje `alt` jednorázově. Když se zbytek produktů ještě vykresluje, může projít
  a `test.fail()` by hlásil falešné „opraveno“. Zvážit `expect.poll(...)`.

- Tlačítko hledání se jmenuje „Serch“ (překlep, podobně jako BUG-002).
- Košík (z TQA-5): tlačítko odebrání bez přístupného názvu a nedostupné z klávesnice;
  v hlavičce tabulky dvakrát „Total“; množství v košíku povolí 0 (`min="0"`, referenční verze 1).
- Objednávky (z SQL testů): `invoices` ukládá `payment_account_number` v čitelné podobě;
  ověřit, jestli zákazník vidí cizí objednávky (`GET /invoices/{id}`).
- Počítadlo výsledků na okamžik ukáže „26 products found“ a teprve pak správné číslo.
  Vysvětleno: 26 je `total` z `GET /products` (výpis bez půjčovny), stránka ho ukáže,
  než dorazí odpověď hledání. Drobná vada zobrazení, testy na to čekají (`searchFor`).
- Přístupnost vyhledávání: pole nemá přístupný název, reset se jmenuje jen „X“, po hledání
  zůstává prázdná navigace „Pagination“; ikona u nadpisu „Search“ je rozbitý obrázek.
- `alt` u obrázků i na dalších stránkách: stránkování, kategorie, detail produktu.
- Položka menu zní „Contakt“ místo „Contact“.
- Logo v hlavičce se nenačte (rozbitý obrázek). Ověřit i `alt`, podobně jako BUG-001.
- Výběr řazení je po načtení prázdný. Ověřit, jestli je to chyba, nebo jen nevybraná výchozí hodnota.
- Z TQA-1 (viz [tasks/tqa-1-login.md](tasks/tqa-1-login.md), sekce 4): API registrace vrací hash hesla;
  tlačítko zobrazení hesla nemá přístupný název; hláška přihlášení nemá `aria-live`;
  odkaz „Home“ vede na `#/contact`.
