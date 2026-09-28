# CLAUDE.md — toolshop-qa-agentic

Automatizované testy cvičného e-shopu Toolshop (Playwright + TypeScript, prohlížeč Chromium).
Testovaná aplikace: https://with-bugs.practicesoftwaretesting.com (obsahuje záměrné chyby).

## Příkazy

- Spuštění testů: `npx playwright test`
- HTML report posledního běhu: `npx playwright show-report`

## Pravidla

- Testujeme pouze with-bugs.practicesoftwaretesting.com, nikdy jiné weby.
- Žádné skutečné osobní údaje ani hesla, jen testovací data.
- Lokátory: preferuj `getByRole` a `data-test` atributy, ne křehké CSS selektory.
  `getByTestId()` je v `playwright.config.ts` nastavené na atribut `data-test`.
- Žádné pevné čekání (`waitForTimeout`).
- Když test selže, NEUPRAVUJ ho, aby prošel. Nejdřív zjisti, jestli je chyba v testu,
  nebo v aplikaci, a řekni mi to.
- Nikdy necommituj ani nepushuj bez mého výslovného souhlasu.
