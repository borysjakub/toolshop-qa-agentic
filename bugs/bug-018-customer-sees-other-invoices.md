# BUG-018: Zákazník vidí faktury jiných zákazníků (výpis i detail faktury)

| | |
|---|---|
| **Stav** | Otevřená |
| **Nalezeno** | 4. 10. 2026 |
| **Oblast** | Objednávky (API `GET /invoices`, `GET /invoices/{id}`), bezpečnost (řízení přístupu) |
| **Závažnost** | Kritická (návrh, zdůvodnění níže) |
| **Automatizovaný test** | [`tests/db/order-access.spec.ts`](../tests/db/order-access.spec.ts) („a customer cannot read another customer's invoice“, „the invoice list contains only the customer's own invoices“), označené `test.fail()` |
| **Jira** | TQA-19 (souvisí s TQA-14) |

## Prostředí

- Aplikace: lokální kopie Toolshopu `sprint5-with-bugs` (oficiální repozitář testsmith-io/practice-software-testing,
  obrazy z Docker Hubu), spuštěná přes [`local-toolshop/start.ps1`](../local-toolshop/start.ps1)
- API: http://localhost:8091 (`/status`: verze 5.0), databáze MariaDB 10.6
- Klient: Playwright 1.63.0 (`request`), ručně ověřeno i v PowerShellu, Postmanu a Newmanu, Windows 11
- Srovnání: referenční verze bez chyb `sprint5` spuštěná lokálně v Dockeru se stejnými seed daty

## Kroky k reprodukci

1. Zaregistruj dva zákazníky A a B (`POST /users/register`) a oba přihlas (`POST /users/login`).
2. Jako zákazník A vytvoř objednávku (`POST /invoices`), ulož si `id` faktury.
3. S tokenem zákazníka B zavolej `GET /invoices/{id faktury zákazníka A}`.
4. S tokenem zákazníka B zavolej `GET /invoices`.

Token zákazníka B patří opravdu jemu: `GET /users/me` vrací jeho `id` a `role: "user"`.

## Očekávaný výsledek

Zákazník, který není administrátor, vidí jen svoje faktury, jako v referenční verzi bez chyb
(`InvoiceService`: `getInvoice` a `getInvoices` filtrují `forUser(...)` přihlášeného uživatele):

- `GET /invoices/{id}` cizí faktury vrátí **404**,
- `GET /invoices` vrátí jen vlastní faktury (nový zákazník bez objednávek: `total=0`).

## Skutečný výsledek

| Verze | Endpoint (token zákazníka B) | Status | Cizí data |
|---|---|---|---|
| with-bugs | `GET /invoices/{id}` faktury zákazníka A | **200** | ano: celá faktura (`user_id` zákazníka A, adresa, položky, částka, `invoice_number`, `payment_account_name`, `payment_account_number`) |
| with-bugs | `GET /invoices` | 200 | ano: 18 faktur od 10 různých `user_id`, žádná vlastní |
| bez chyb `sprint5` | `GET /invoices/{id}` faktury jiného zákazníka | **404** | ne |
| bez chyb `sprint5` | `GET /invoices` | 200 | ne (`total=0`) |

Kontrola: vlastník si svou fakturu načte v obou verzích (200), 404 v referenční verzi tedy
znamená „nemáš přístup“, ne „faktura neexistuje“.

Jde o IDOR (Insecure Direct Object Reference), OWASP API Security Top 10:
API1 Broken Object Level Authorization. Stejný typ chyby jako [BUG-013](bug-013-order-for-another-customer.md)
(zápis objednávky na cizí účet), tady při čtení.

## Důkaz

- Test: `tests/db/order-access.spec.ts`, výstup před označením `test.fail()`:
  ```
  Error: another customer's invoice is not returned
  expect(received).not.toBe(expected)
  Expected: not 20

  Error: invoices of other customers in the list
  expect(received).toEqual(expected)
  - Expected  -  1
  + Received  + 16
  ```
  Kontrolní test „a customer can read their own invoice“ prochází (prostředí funguje).
- Screenshot: není, chyba je v odpovědi API.

## Dopad

- Kterýkoli registrovaný zákazník si stáhne faktury všech zákazníků: jména, fakturační adresy,
  co kdo koupil a za kolik, u plateb převodem i údaje o účtu (`payment_account_name`,
  `payment_account_number`). Výpis nevyžaduje ani hádání čísel faktur.
- Únik osobních údajů všech zákazníků (z pohledu GDPR povinnost hlásit incident).

## Zdůvodnění závažnosti

Kritická: únik osobních a platebních údajů všech zákazníků, zneužitelné každým registrovaným
zákazníkem jedním požadavkem, bez zvláštních znalostí.

## Návrh opravy

V `GET /invoices` i `GET /invoices/{id}` omezit dotaz na přihlášeného zákazníka (kromě role admin),
jako referenční verze (`forUser(Auth::id())`). Cizí faktura vrátí 404. Totéž zkontrolovat
u `GET /invoices/{id}/download-pdf` a vyhledávání `GET /invoices/search`.

## Co nebylo ověřeno

- Veřejná instance with-bugs.practicesoftwaretesting.com (záměrně: čtení cizích faktur na sdíleném
  demu by sahalo na data ostatních uživatelů). Kód API je stejná verze.
- `GET /invoices/search`, `GET /invoices/{id}/download-pdf` a změny cizích faktur (`PUT`, `PATCH`).
- Faktury s platbou převodem (ověřené faktury byly na dobírku, platební pole byla `null`).
