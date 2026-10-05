# BUG-025: Změna cizí faktury (PUT) vrátí HTTP 200 s „success: false“ místo 404

| | |
|---|---|
| **Stav** | Otevřená |
| **Nalezeno** | 5. 10. 2026 |
| **Oblast** | Objednávky (API `PUT /invoices/{id}`) |
| **Závažnost** | Nízká (návrh, zdůvodnění níže) |
| **Automatizovaný test** | [`tests/db/order-access.spec.ts`](../tests/db/order-access.spec.ts) („PUT on another customer's invoice is rejected“), označený `test.fail()` |
| **Jira** | TQA-26 (souvisí s TQA-19, dotaz TQA-28) |

## Prostředí

- Aplikace: lokální kopie Toolshopu `sprint5-with-bugs` (oficiální repozitář testsmith-io/practice-software-testing,
  obrazy z Docker Hubu), spuštěná přes [`local-toolshop/start.ps1`](../local-toolshop/start.ps1)
- API: http://localhost:8091 (`/status`: verze 5.0), databáze MariaDB 10.6
- Klient: Playwright 1.63.0 (`request`), mysql2 3.24, ručně ověřeno v PowerShellu a v Google Chrome, Windows 11
- Srovnání: referenční verze bez chyb `sprint5` spuštěná lokálně v Dockeru

## Kroky k reprodukci

1. Zaregistruj a přihlas dva zákazníky A a B.
2. Jako A vytvoř objednávku (`POST /invoices`), ulož si `id` faktury.
3. S tokenem B pošli `PUT /invoices/{id faktury A}` s platným tělem (fakturační údaje, `total`, jiné `billing_city`).
4. Zkontroluj fakturu v databázi.

## Očekávaný výsledek

Požadavek je odmítnutý chybou klienta. Referenční verze vrací **404** („Requested item not found“),
vlastník stejným požadavkem fakturu změní (200).

## Skutečný výsledek

API vrátí **HTTP 200** s tělem `{"success": false}`. Faktura se nezmění (ověřeno v databázi,
i když B pošle v těle svoje `user_id`). Vlastník fakturu změní normálně (200, `{"success": true}`).

Data jsou tedy chráněná, chybný je jen stavový kód: neúspěch se tváří jako úspěch.

## Důkaz

- Test: `tests/db/order-access.spec.ts`, výstup před označením `test.fail()`:
  ```
  Error: status of a rejected change
  Expected: >= 400
  Received:    200
  ```
  Test „PUT does not change another customer's invoice“ (kontrola v databázi) prochází.
- Referenční verze: cizí `PUT` → 404 `{"message":"Requested item not found"}`, vlastník → 200.
- Screenshot: není, chyba je v odpovědi API.

## Dopad

- Klient (frontend, integrace) podle stavového kódu nepozná, že změna neproběhla, a může uživateli
  ukázat „uloženo“.
- Monitoring a logy nevidí pokusy o změnu cizích faktur jako chyby (4xx).

## Zdůvodnění závažnosti

Nízká: data jsou chráněná, chyba je v kontraktu API (stavový kód).

## Návrh opravy

Když faktura nepatří přihlášenému uživateli, vrátit 404 jako referenční verze (`firstOrFail`).

## Co nebylo ověřeno

- Veřejná instance (záměrně: změny faktur na sdíleném demu).
- `PUT /invoices/{id}/status` (změnu stavu nechrání ani referenční verze, viz dotaz v Jiře).
