# toolshop-qa-agentic

Automatizované end-to-end testy cvičného e-shopu
[Toolshop](https://with-bugs.practicesoftwaretesting.com), napsané v
[Playwright](https://playwright.dev) a TypeScriptu.

Testovaná verze aplikace obsahuje záměrně zanesené chyby. Projekt slouží k učení
QA automatizace a jako portfolio.

## Požadavky

- [Node.js](https://nodejs.org) 20 nebo novější
- Git

## Instalace

```bash
git clone https://github.com/svobodaprojevu/toolshop-qa-agentic.git
cd toolshop-qa-agentic
npm install
npx playwright install chromium
```

## Spuštění testů

```bash
npx playwright test
```

- `npx playwright test --ui` — interaktivní režim s náhledem běhu testů
- `npx playwright show-report` — HTML report posledního běhu

Testy, které odhalily známou chybu aplikace, jsou označené `test.fail()`. Dokud chyba trvá,
test selže a ve výsledcích se počítá jako prošlý. Až chybu někdo opraví, Playwright to nahlásí.

## Struktura

- `tests/smoke/` — rychlé ověření, že základní části webu fungují
- `tests/accessibility/` — testy přístupnosti
- `tests/auth/` — přihlášení a odhlášení
- `tests/helpers/` — sdílené pomocné funkce (např. registrace testovacího účtu přes API)
- `tests/seed/` — výchozí stav stránky pro Playwright Test Agents (planner, generator)
- `specs/` — testovací plány, které napsal agent planner
- `tasks/` — simulované pracovní úkoly z Jiry: analýza zadání, testovací případy, výsledky
- `bugs/` — bug reporty nalezených chyb aplikace
- [ROADMAP.md](ROADMAP.md) — plán dalších kroků
- `CLAUDE.md`, `.claude/` — pravidla a nastavení pro AI agenta Claude Code
