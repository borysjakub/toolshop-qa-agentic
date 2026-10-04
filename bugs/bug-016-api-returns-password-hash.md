# BUG-016: API vrací hash hesla a interní pole uživatele

| | |
|---|---|
| **Stav** | Otevřená |
| **Nalezeno** | 3. 10. 2026 (poprvé zahlédnuto u TQA-1 jako postřeh) |
| **Oblast** | API uživatelů (`POST /users/register`, `GET /users/me`), bezpečnost |
| **Závažnost** | Vysoká (návrh, zdůvodnění níže) |
| **Automatizovaný test** | [`tests/api/users.spec.ts`](../tests/api/users.spec.ts) (API-15), označený `test.fail()` |
| **Jira** | TQA-17 (souvisí s TQA-1) |

## Prostředí

- API: https://api-with-bugs.practicesoftwaretesting.com (verze 5.0 with bugs), totéž na lokální kopii
- Klient: Playwright 1.63.0 (`request`), Windows 11

## Kroky k reprodukci

1. `POST /users/register` s daty nového zákazníka (viz `newUserPayload()` v `tests/helpers/users.ts`).
2. `POST /users/login` se stejným e-mailem a heslem, ulož `access_token`.
3. `GET /users/me` s hlavičkou `Authorization: Bearer <token>`.

## Očekávaný výsledek

Odpovědi obsahují jen veřejné údaje zákazníka. Hash hesla a interní pole (`role`, `enabled`,
`failed_login_attempts`, `totp_secret`) se z backendu nikdy nevracejí. Referenční verze bez chyb
je má v modelu `User` mezi skrytými poli (`$hidden`).

## Skutečný výsledek

| Endpoint | Interní pole v odpovědi |
|---|---|
| `POST /users/register` (201) | `password` (hash), `role` |
| `GET /users/me` (200) | `password` (hash), `role`, `enabled`, `failed_login_attempts` |

## Důkaz

- Test: `tests/api/users.spec.ts` API-15, výstup před označením `test.fail()`:
  ```
  Error: internal fields in POST /users/register
  + "password",
  + "role",
  ```
  S dočasně chybným očekáváním (odpovědi obsahují `password`) test projde.
- Screenshot: není, chyba je v odpovědi API.

## Dopad

- Hash hesla je dostupný každému, kdo vidí odpověď (rozšíření prohlížeče, proxy, logy, sdílený
  počítač). Hash jde zkoušet prolomit offline, bez omezení počtu pokusů (to u přihlášení stejně
  nefunguje, viz BUG-003).
- `failed_login_attempts` a `enabled` prozrazují interní stav bezpečnostních mechanismů.

## Zdůvodnění závažnosti

Vysoká: únik citlivých dat u každého zákazníka, bez zvláštních znalostí. Není to přímé převzetí
účtu (hash se musí prolomit), proto ne Kritická.

## Návrh opravy

Skrýt pole v serializaci modelu `User` (jako referenční verze, `$hidden`), případně vracet
z API jen výslovně vyjmenovaná veřejná pole.

## Co nebylo ověřeno

- Ostatní endpointy s uživatelem (`GET /users`, `GET /users/{id}`, faktury s uživatelem).
- Jaký algoritmus hash používá (netýká se rozsahu testu).
