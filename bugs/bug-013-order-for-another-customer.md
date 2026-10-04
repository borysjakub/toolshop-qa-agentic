# BUG-013: Zákazník může vytvořit objednávku na účet jiného zákazníka

| | |
|---|---|
| **Stav** | Otevřená |
| **Nalezeno** | 3. 10. 2026 |
| **Oblast** | Objednávky (API `POST /invoices`), bezpečnost (řízení přístupu) |
| **Závažnost** | Kritická (návrh, zdůvodnění níže) |
| **Automatizovaný test** | [`tests/db/order-persistence.spec.ts`](../tests/db/order-persistence.spec.ts) („a customer cannot place an order for another customer“), označený `test.fail()` |
| **Jira** | TQA-14 |

## Prostředí

- Aplikace: lokální kopie Toolshopu `sprint5-with-bugs` (oficiální repozitář testsmith-io/practice-software-testing,
  obrazy z Docker Hubu), spuštěná přes [`local-toolshop/start.ps1`](../local-toolshop/start.ps1)
- API: http://localhost:8091 (`/status`: verze 5.0), databáze MariaDB 10.6
- Klient: Playwright 1.63.0 (`request`), mysql2 3.24, Windows 11

## Kroky k reprodukci

1. Zaregistruj dva zákazníky A (oběť) a B (útočník). Přihlas se jako B a ulož si jeho `access_token`.
2. Pošli `POST /invoices` s tokenem zákazníka B, ale s `"user_id": <id zákazníka A>`
   (zbytek jako běžná objednávka).
3. Zkontroluj databázi:
   ```sql
   SELECT id, user_id, total FROM invoices WHERE user_id = <id zákazníka A>;
   ```

## Očekávaný výsledek

Server objednávku odmítne (403/422), nebo `user_id` z požadavku ignoruje a objednávku přiřadí
přihlášenému zákazníkovi. Na účtu zákazníka A žádná objednávka nevznikne.

## Skutečný výsledek

API vrátí `201 Created` a objednávka se uloží na účet zákazníka A. Ověřeno i s `user_id = 1`,
což je v seed datech administrátor (`role = admin`).

API tedy nekontroluje, že `user_id` z požadavku patří přihlášenému uživateli. V bezpečnosti se
tomu říká IDOR (Insecure Direct Object Reference), OWASP API Security Top 10:
API1 Broken Object Level Authorization.

Pozn. k postupu: při přípravě testů byl (v rozporu s pravidlem testovat naslepo) přečten kód API
verze s chybami, který `user_id` bere z požadavku. Chyba je ale doložená chováním (odpověď API
a data v databázi). Referenční verze bez chyb (`sprint5/`) vytváří objednávku ze serverového
košíku (`cart_id`).

## Důkaz

- Test: `tests/db/order-persistence.spec.ts`, výstup před označením `test.fail()`:
  `expect([403, 422]).toContain(...)` → `Expected value: 201`.
  S dočasně chybným očekáváním (201 a 1 objednávka na účtu oběti) test projde.
- Screenshot: není, chyba je v API a v datech.

## Dopad

- Útočník může zákazníkům vytvářet objednávky (a faktury) na jejich jméno, např. s dobírkou
  na jejich adresu.
- Data objednávek v účtu zákazníka nejsou důvěryhodná.

## Zdůvodnění závažnosti

Kritická: porušení řízení přístupu u hlavní funkce e-shopu, zneužitelné každým registrovaným
zákazníkem, zasahuje cizí účty.

## Návrh opravy

`user_id` z požadavku nepřijímat, brát ho z přihlášení (`auth()->id()`).
Totéž zkontrolovat u ostatních endpointů, které přijímají ID uživatele.

## Co nebylo ověřeno

- Veřejná instance with-bugs.practicesoftwaretesting.com (záměrně: objednávky na cizí účty
  sdíleného dema by poškodily ostatní uživatele).
- Jestli útočník vidí objednávky jiných zákazníků (`GET /invoices/{id}`).
