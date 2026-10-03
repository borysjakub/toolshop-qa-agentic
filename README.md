# toolshop-qa-agentic

[![Playwright Tests](https://github.com/svobodaprojevu/toolshop-qa-agentic/actions/workflows/playwright.yml/badge.svg)](https://github.com/svobodaprojevu/toolshop-qa-agentic/actions/workflows/playwright.yml)

Automatizované testy cvičného e-shopu [Toolshop](https://with-bugs.practicesoftwaretesting.com)
v [Playwright](https://playwright.dev) a TypeScriptu: UI, API a databáze (SQL).
Testovaná verze aplikace obsahuje záměrně zanesené chyby, úkolem je je najít, doložit a nahlásit.

Projekt simuluje práci QA testera v týmu: zadání přichází jako tickety v Jiře, výsledkem jsou
testovací případy, automatizované testy, bug reporty a shrnutí v ticketu. Práci dělá
**AI agent (Claude Code) pod dohledem člověka** podle pravidel v repozitáři: projektová pravidla,
skilly, hooky a kontrolní subagent (viz [Jak tu pracuje AI](#jak-tu-pracuje-ai)).

## Výsledky

| Oblast | Testy | Nalezené chyby |
|---|---|---|
| Přihlášení ([TQA-1](tasks/tqa-1-login.md)) | `tests/auth/` | [BUG-003](bugs/bug-003-account-not-locked.md) účet se nezablokuje (Kritická), [BUG-004](bugs/bug-004-user-menu-data-not-found.md), [BUG-005](bugs/bug-005-login-form-no-validation.md) |
| Vyhledávání ([plán](specs/search.md)) | `tests/search/`, `tests/accessibility/search-validation.spec.ts` | [BUG-006](bugs/bug-006-search-hammer-misses-sledgehammer.md) až [BUG-011](bugs/bug-011-search-validation-not-announced.md), nejvážnější [BUG-007](bugs/bug-007-search-from-page-2-shows-no-products.md) hledání ze stránky 2 nic neukáže |
| Košík ([TQA-5](tasks/tqa-5-cart.md)) | `tests/cart/` | [BUG-014](bugs/bug-014-cart-line-total-zero.md) mezisoučet $00.00, [BUG-015](bugs/bug-015-cart-remove-does-nothing.md) položku nejde odebrat |
| Objednávky v databázi (SQL) | `tests/db/` | [BUG-012](bugs/bug-012-order-price-from-client.md) cenu objednávky určuje klient, [BUG-013](bugs/bug-013-order-for-another-customer.md) objednávka na cizí účet (obojí Kritická) |
| Přístupnost, smoke | `tests/accessibility/`, `tests/smoke/` | [BUG-001](bugs/bug-001-product-images-missing-alt.md) obrázky bez `alt`, [BUG-002](bugs/bug-002-sort-heading-typo.md) „Sorth“ |

Všechny bug reporty: [`bugs/`](bugs/). Každá chyba má automatizovaný test označený `test.fail()`:
dokud chyba trvá, test selže a počítá se jako prošlý. Až ji někdo opraví, test začne procházet
a CI zčervená, takže se bug report uzavře.

## Požadavky

- [Node.js](https://nodejs.org) 22 nebo novější, Git
- Pro databázové testy a CI-like běh: [Docker Desktop](https://www.docker.com/products/docker-desktop/), PowerShell

## Instalace a spuštění

```bash
git clone https://github.com/svobodaprojevu/toolshop-qa-agentic.git
cd toolshop-qa-agentic
npm install
npx playwright install chromium
npm test                 # testy proti veřejné aplikaci
npm run test:ui          # interaktivní režim
npm run report           # HTML report posledního běhu
```

### Lokální kopie aplikace a databázové testy

Databázové testy potřebují přístup do databáze, který veřejné demo nedává, a testují i útoky
(objednávky na cizí účty), které na sdíleném demu dělat nechceme. Proto běží proti stejné verzi
aplikace spuštěné lokálně v Dockeru:

```powershell
.\local-toolshop\start.ps1     # stáhne oficiální Toolshop, spustí ho a naplní databázi
copy .env.example .env         # v .env nastav LOCAL_TOOLSHOP=1
npx playwright test --project=local-db
.\local-toolshop\stop.ps1
```

Celou sadu jde pustit i proti lokální kopii: `BASE_URL=http://localhost:4200` a `API_URL=http://localhost:8091`.

## CI

[GitHub Actions](.github/workflows/playwright.yml) běží po každém pushi, pull requestu a denně.
Na runneru spustí Toolshop v Dockeru (veřejné demo má ochranu proti botům, která CI občas
zastaví) a pustí všechny testy včetně databázových. HTML report je v artefaktech běhu.
Ručně jde spustit i proti veřejnému demu (`workflow_dispatch`, volba `public`).

## Struktura

- `tests/smoke/` rychlé ověření hlavní stránky
- `tests/auth/` přihlášení a odhlášení (TQA-1)
- `tests/search/` vyhledávání (plán napsal agent planner, testy agent generator)
- `tests/cart/` košík (TQA-5)
- `tests/accessibility/` přístupnost (WCAG)
- `tests/db/` objednávky přes API + kontrola v databázi SQL dotazy (jen lokální kopie)
- `tests/helpers/` sdílené funkce: účty a přihlášení přes API, hledání, košík, databáze
- `tests/seed/` výchozí stav stránky pro Playwright Test Agents
- `specs/` testovací plány · `tasks/` výsledky Jira úkolů · `bugs/` bug reporty
- `local-toolshop/` spuštění aplikace v Dockeru · [ROADMAP.md](ROADMAP.md) plán a nápady

## Jak tu pracuje AI

| Prvek | Kde | Co dělá |
|---|---|---|
| Pravidla projektu | [`CLAUDE.md`](CLAUDE.md) | Lokátory, žádné pevné čekání, testy nesmí schovávat chyby, testování naslepo, postup u známých chyb |
| Skill `jira-ticket` | `.claude/skills/jira-ticket/` | Opakovatelný postup od Jira ticketu po výsledek (analýza, testy, ověření oběma směry, bug reporty, komentář) |
| Skill `bug-report` | `.claude/skills/bug-report/` | Jednotná šablona bug reportu a stupnice závažnosti |
| Subagent `test-reviewer` | `.claude/agents/test-reviewer.md` | Jen čte a kontroluje testy proti pravidlům, nic neopravuje |
| Playwright Test Agents | `.claude/agents/playwright-test-*.md`, `.mcp.json` | Planner (průzkum aplikace, plán) a generator (testy z plánu). Healer je záměrně vypnutý: chyby aplikace by schovával pomocí `test.fixme()` |
| Hook `block-wait-for-timeout` | `.claude/hooks/` | Zablokuje zápis kódu s `waitForTimeout` (i z generatoru) |
| Hook `block-with-bugs-source` | `.claude/hooks/` | Zablokuje čtení kódu testované verze: testuje se naslepo, jako v práci |
| Oprávnění | `.claude/settings.json` | `git commit` a `git push` vždy jen po potvrzení člověkem |

Pravidlo v textu je prosba, hook je zámek: co je důležité, hlídá kód, ne jen instrukce.
