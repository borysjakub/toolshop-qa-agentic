# BUG-012: Objednávka se uloží s cenou, kterou pošle klient

| | |
|---|---|
| **Stav** | Otevřená |
| **Nalezeno** | 3. 10. 2026 |
| **Oblast** | Objednávky (API `POST /invoices`), bezpečnost |
| **Závažnost** | Kritická (návrh, zdůvodnění níže) |
| **Automatizovaný test** | [`tests/db/order-persistence.spec.ts`](../tests/db/order-persistence.spec.ts) („stored prices come from the catalogue…“), označený `test.fail()` |
| **Jira** | TQA-13 |

## Prostředí

- Aplikace: lokální kopie Toolshopu `sprint5-with-bugs` (oficiální repozitář testsmith-io/practice-software-testing,
  obrazy z Docker Hubu), spuštěná přes [`local-toolshop/start.ps1`](../local-toolshop/start.ps1)
- API: http://localhost:8091 (`/status`: verze 5.0), databáze MariaDB 10.6
- Klient: Playwright 1.63.0 (`request`), mysql2 3.24, Windows 11

## Kroky k reprodukci

1. Zaregistruj zákazníka (`POST /users/register`) a přihlas se (`POST /users/login`), ulož si `access_token`.
2. Pošli `POST /invoices` s tokenem a s produktem z katalogu, ale s vlastní cenou:
   ```json
   {
     "user_id": <id zákazníka>, "billing_address": "Test street 1", "billing_city": "Testville",
     "billing_country": "CZ", "payment_method": "cash-on-delivery",
     "total": 0.01,
     "invoice_items": [{ "product_id": <id>, "unit_price": 0.01, "quantity": 2 }]
   }
   ```
3. Podívej se do databáze na uloženou objednávku:
   ```sql
   SELECT i.total, ii.unit_price, ii.quantity, p.price AS catalogue_price
   FROM invoices i
   JOIN invoice_items ii ON ii.invoice_id = i.id
   JOIN products p ON p.id = ii.product_id
   WHERE i.id = <id objednávky>;
   ```

## Očekávaný výsledek

Server ceny od klienta nepřebírá: cenu položky vezme z katalogu (`products.price`) a celkovou částku
spočítá sám. Případně objednávku s nesouhlasnou cenou odmítne (422).

## Skutečný výsledek

API vrátí `201 Created` a do databáze uloží ceny od klienta:

| total | unit_price | quantity | catalogue_price |
|---|---|---|---|
| 0.01 | 0.01 | 2 | 9.17 |

Uložený `total` (0,01) navíc neodpovídá ani položkám (2 × 0,01 = 0,02).

Pozn. k postupu: při přípravě testů byl (v rozporu s pravidlem testovat naslepo) přečten kód API
verze s chybami. Ukazuje, že `total` a `unit_price` se berou z požadavku. Chyba je ale doložená
chováním (odpověď API a data v databázi), ne kódem. Referenční verze bez chyb (`sprint5/`)
vytváří objednávku ze serverového košíku (`cart_id`), ceny od klienta nepřijímá.

## Důkaz

- Test: `tests/db/order-persistence.spec.ts`, výstup před označením `test.fail()`:
  ```
  Error: stored items with a price different from the catalogue
  + "catalogue_price": 9.17, "quantity": 2, "total": 0.01, "unit_price": 0.01
  ```
  S dočasně chybným očekáváním (uložená cena 0,01) test projde, selhává tedy jen kvůli této chybě.
- Screenshot: není, chyba je v API a v datech (výstup SQL výše).

## Dopad

- Kdokoli s účtem si může „koupit“ libovolné zboží za libovolnou cenu (stačí upravit požadavek
  v nástrojích prohlížeče nebo v Postmanu). Přímá finanční ztráta.
- Účetní data (faktury) neodpovídají katalogu ani sama sobě.

## Zdůvodnění závažnosti

Kritická: přímá ztráta peněz, zneužitelné každým registrovaným zákazníkem bez zvláštních znalostí,
nejde o okrajový případ.

## Návrh opravy

V `POST /invoices` ignorovat `total` a `unit_price` od klienta: cenu brát z `products`, celkovou
částku počítat na serveru (ideálně z košíku uloženého na serveru, ne z položek v požadavku).

## Co nebylo ověřeno

- Veřejná instance with-bugs.practicesoftwaretesting.com (záměrně: objednávky s podvrženou cenou
  na sdíleném demu by zatěžovaly ostatní uživatele). Kód API je ale stejná verze.
- Jestli totéž platí pro `PUT /invoices/{id}`.
- Záporné ceny a množství.
