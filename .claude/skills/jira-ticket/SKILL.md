---
name: jira-ticket
description: Zpracuje testovací úkol z Jiry (prostor TQA) od analýzy zadání po výsledek v Jiře – testovací případy, Playwright testy, bug reporty a shrnutí. Spouští se jen ručně příkazem /jira-ticket TQA-N.
disable-model-invocation: true
---

# Zpracování Jira ticketu

Postup podle vzoru [TQA-1](../../../tasks/tqa-1-login.md). Klíč ticketu je v argumentu (např. `TQA-5`).
Když chybí, zeptej se.

## Jira

| Co | Hodnota |
|---|---|
| Web (`cloudId`) | `borysjakub.atlassian.net` |
| Prostor | `TQA` |
| Typy | `Scénář` (zadání), `Chyba` (bug), `Úkol` |
| Stavy | `Dodělat` → `Probíhající` → `Hotovo` |
| Vazby | `Blocks` (chyba blokuje splnění AC), `Relates` (ostatní) |

Priorita chyby podle závažnosti: Kritická → `Highest`, Vysoká → `High`, Střední → `Medium`, Nízká → `Low`.
Jira nemá pole závažnost, proto ji vždy napiš i na první řádek popisu.

Všechno v Jiře se zapisuje pod účtem uživatele. Piš tak, aby text obstál, i když ho čte někdo jiný.

## Zastávky (bez souhlasu uživatele nepokračuj)

1. **Potvrzení chyb** (krok 6): před bug reporty, `test.fail()` a zápisem chyb do Jiry.
2. **Commit a push** (krok 9): podle `CLAUDE.md`.

Všechno ostatní dělej samostatně a na konci ukaž, co a proč jsi rozhodl.

## Postup

### 1. Převzetí ticketu
- Načti ticket včetně komentářů (`getJiraIssue`, pole `comment`).
- Přesuň ho do `Probíhající`.

### 2. Analýza zadání
- Ke každému akceptačnímu kritériu (AC) napiš: „Jak poznám, že prošlo?“
- Co nejde změřit, je nejasnost. Zapiš otázku, svůj předpoklad a zdroj předpokladu.
- Zdroje, které smíš použít: dokumentace aplikace a referenční verze **bez chyb**
  (`sprint5/` v repozitáři `testsmith-io/practice-software-testing`) jako specifikace.
- **Nikdy neotvírej** kód verze s chybami (`sprint5-with-bugs/`) ani seznam záměrných chyb
  (`listOfBugs.md`). Testuje se naslepo, jako v práci.
- Otázky polož v závěrečném komentáři (krok 8) s prosbou o potvrzení. Když nejasnost zásadně
  mění, co se bude testovat, zeptej se uživatele hned.

### 3. Průzkum aplikace
- Pomocné skripty patří do scratchpadu, ne do repozitáře.
- Mimo testy se nenačte `playwright.config.ts`: nastav `selectors.setTestIdAttribute('data-test')`.
- **Průzkum je jen nápověda, ne důkaz.** Jednorázový skript snadno čte stránku dřív, než se
  dokončí akce (u TQA-1 to vedlo k mylnému závěru). Každý závěr potvrď testem s `expect`.
- Lokátory ověř na skutečné stránce (`ariaSnapshot()`, seznam `[data-test]`).

### 4. Testovací případy a testy
- Soubor `tests/<oblast>/<nazev>.spec.ts`, na začátku komentář s klíčem ticketu.
- Názvy testů `TC-01 …`, každý pokrývá jedno chování. Mysli na pozitivní, negativní i hraniční případy.
- Testovací účty: `registerUser()` z `tests/helpers/users.ts`. Každý test si založí vlastní účet.
  **Na demo účtech z dokumentace nikdy nezkoušej špatné heslo**, sdílí je všichni.
- Známé pasti:
  - `toHaveURL(/login/)` hned po kliknutí na Login projde dřív, než odpoví server.
    Nejdřív počkej na něco, co vznikne až po odpovědi (hláška, nadpis).
  - `page.goto` na stejnou adresu s `#` stránku znovu nenačte, stará hláška na ní zůstane.

### 5. Spuštění a ověření oběma směry
- `npx playwright test <soubor> --reporter=list`.
- Ověř **každý** test oběma směry v dočasné kopii souboru (`*-mutation.spec.ts`, po použití smaž):
  - test, který prošel, musí po změně očekávání nebo vstupu selhat,
  - test, který selhal, musí s očekáváním nastaveným na chybné chování projít.
- Když obrácená verze nedělá, co má, zjisti proč. Chyba může být v obrácené verzi, ne v testu.
- Když test selže, nejdřív rozhodni: chyba testu, nebo aplikace? Test neupravuj, aby prošel.

### 6. Vyhodnocení → ZASTÁVKA
Ukaž uživateli:
- tabulku AC → výsledek,
- kandidáty na chyby: popis, test, navrženou závažnost podle stupnice ze skillu `bug-report`,
- co jsi rozhodl sám (předpoklady, zdroje) a co mimo zadání jsi zahlédl.

Počkej na potvrzení chyb a závažností.

### 7. Chyby
Pro každou potvrzenou chybu:
1. Bug report přes skill `bug-report` (screenshot do `bugs/img/`, test označit `test.fail()`).
2. Ticket typu `Chyba` v Jiře: priorita podle tabulky výše, štítky podle oblasti a `qa-simulace`,
   v popisu závažnost, odkaz na bug report na GitHubu, test, prostředí, kroky, očekávaný
   a skutečný výsledek, dopad.
3. Vazba na ticket: `Blocks`, když kvůli chybě neprojde AC (inwardIssue = chyba), jinak `Relates`.

Postřehy mimo zadání nezakládej jako chyby. Dej je do dokumentace a do nápadů v `ROADMAP.md`.

### 8. Výsledek
- `tasks/<klic>-<kratky-popis>.md` (např. `tasks/tqa-5-cart.md`) se sekcemi podle vzoru TQA-1:
  1. Analýza zadání (AC tabulka, nejasnosti, testovací data),
  2. Testovací případy s výsledky,
  3. Nalezené chyby (bug report, Jira, závažnost),
  4. Další postřehy mimo zadání,
  5. Co nebylo otestováno.
- Komentář do ticketu: shrnutí a doporučení, tabulka AC → výsledek, upřesnění zadání k potvrzení,
  chyby s klíči, automatizace, co netestováno, postřehy mimo rozsah, odkaz na `tasks/…`.
- Stav ticketu: nech `Probíhající`, když ho blokuje chyba. `Hotovo` jen když prošla všechna AC,
  a to až po souhlasu uživatele.
- Doplň `ROADMAP.md` (Hotovo, nápady) a `README.md`, pokud vznikla nová složka.
- Spusť celou sadu testů.

### 9. Commit → ZASTÁVKA
Navrhni jeden commit `test: <klíč> <co>, BUG-00X až BUG-00Y` se seznamem souborů a počkej na souhlas.
Zprávu commitu předej přes `git commit -F <soubor>` (PowerShell 5.1 kazí české uvozovky v `-m`).

## Kontrola na konci

- [ ] Každé AC má výsledek a každá nejasnost předpoklad se zdrojem.
- [ ] Každý test je ověřený oběma směry a dočasné kopie jsou smazané.
- [ ] Demo účty nebyly použity se špatným heslem.
- [ ] Chyby mají bug report, `test.fail()`, ticket v Jiře a vazbu.
- [ ] Ticket má komentář se shrnutím a správný stav.
- [ ] `tasks/…`, `ROADMAP.md`, `README.md` jsou aktuální, celá sada prochází.
