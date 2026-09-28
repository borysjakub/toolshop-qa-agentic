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
