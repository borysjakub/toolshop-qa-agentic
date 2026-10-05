# BUG-026: Úprava faktury přes PATCH vrací 405 i vlastníkovi faktury

| | |
|---|---|
| **Stav** | Otevřená |
| **Nalezeno** | 5. 10. 2026 |
| **Oblast** | Objednávky (API `PATCH /invoices/{id}`) |
| **Závažnost** | Střední (návrh, zdůvodnění níže) |
| **Automatizovaný test** | [`tests/db/order-access.spec.ts`](../tests/db/order-access.spec.ts) („the owner can change the billing city with PATCH“), označený `test.fail()` |
| **Jira** | TQA-27 (souvisí s TQA-19) |

## Prostředí

- Aplikace: lokální kopie Toolshopu `sprint5-with-bugs` (oficiální repozitář testsmith-io/practice-software-testing,
  obrazy z Docker Hubu), spuštěná přes [`local-toolshop/start.ps1`](../local-toolshop/start.ps1)
- API: http://localhost:8091 (`/status`: verze 5.0), databáze MariaDB 10.6
- Klient: Playwright 1.63.0 (`request`), mysql2 3.24, ručně ověřeno v PowerShellu a v Google Chrome, Windows 11
- Srovnání: referenční verze bez chyb `sprint5` spuštěná lokálně v Dockeru

## Kroky k reprodukci

1. Zaregistruj a přihlas zákazníka, vytvoř objednávku (`POST /invoices`), ulož si `id` faktury.
2. Pošli `PATCH /invoices/{id}` s tokenem vlastníka a tělem `{"billing_city": "Patched by owner"}`.
3. Zkontroluj fakturu v databázi.

## Očekávaný výsledek

Vlastník změní jednotlivé fakturační údaje. Referenční verze vrací **200** `{"success": true}`
a uloží nové město. Cizí zákazník dostane 404.

## Skutečný výsledek

API vrátí **HTTP 405** (Method Not Allowed) i vlastníkovi a faktura se nezmění.
`OPTIONS /invoices/{id}` přitom odpoví 200.

## Důkaz

- Test: `tests/db/order-access.spec.ts`, výstup před označením `test.fail()`:
  ```
  Error: PATCH status
  Expected: 200
  Received: 405
  ```
- Referenční verze: vlastník → 200 a změna uložena, cizí zákazník → 404.
- Screenshot: není, chyba je v odpovědi API.

## Dopad

- Zákazník (nebo frontend) nemůže opravit jednotlivé fakturační údaje. Zbývá jen `PUT` s celou fakturou.
- Klienti napsaní podle dokumentace API (`PATCH`) nefungují.

## Zdůvodnění závažnosti

Střední: zdokumentovaná funkce API nefunguje pro nikoho, dá se obejít přes `PUT`.

## Návrh opravy

Doplnit route `PATCH /invoices/{id}` podle referenční verze (jen vlastník, `PatchInvoice` validace).

## Co nebylo ověřeno

- Veřejná instance (záměrně: změny faktur na sdíleném demu).
- Jestli `PATCH` používá frontend (stránka faktur v účtu zákazníka).
