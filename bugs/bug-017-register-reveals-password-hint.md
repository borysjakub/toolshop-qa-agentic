# BUG-017: Registrace s použitým e-mailem odpoví „Your password hint is …“

| | |
|---|---|
| **Stav** | Otevřená |
| **Nalezeno** | 3. 10. 2026 |
| **Oblast** | API registrace (`POST /users/register`), bezpečnost |
| **Závažnost** | Nízká (návrh, zdůvodnění níže) |
| **Automatizovaný test** | [`tests/api/users.spec.ts`](../tests/api/users.spec.ts) (API-10), označený `test.fail()` |
| **Jira** | TQA-18 |

## Prostředí

- API: https://api-with-bugs.practicesoftwaretesting.com (verze 5.0 with bugs), totéž na lokální kopii
- Klient: Playwright 1.63.0 (`request`), Windows 11

## Kroky k reprodukci

1. Zaregistruj nového zákazníka (`POST /users/register`).
2. Pošli `POST /users/register` znovu se stejným e-mailem.

## Očekávaný výsledek

Registrace je odmítnutá (409) s neutrální hláškou, jako v referenční verzi bez chyb:
„A customer with this email address already exists.“ Odpověď neobsahuje nic o hesle.

## Skutečný výsledek

`409` s tělem:

```json
{"email":["User already registered - Your password hint is: Name of your cat!"]}
```

Text nápovědy je stejný pro každý účet, i pro účet založený testem, který žádnou nápovědu
nezadal. Skutečná data tedy neunikají, ale hláška tvrdí, že aplikace prozrazuje nápovědu k heslu
cizího účtu.

## Důkaz

- Test: `tests/api/users.spec.ts` API-10, výstup před označením `test.fail()`:
  `Expected pattern: not /hint|password/i`,
  `Received string: "{\"email\":[\"User already registered - Your password hint is: Name of your cat!\"]}"`.
  S dočasně chybným očekáváním (odpověď obsahuje „password hint“) test projde.
- Screenshot: není, chyba je v odpovědi API.

## Dopad

- Útočníkovi to ukazuje směr útoku (sociální inženýrství) a zákazník, který hlášku uvidí,
  ztrácí důvěru v bezpečnost obchodu.
- Kdyby se text někdy začal plnit skutečnou nápovědou, šlo by o vážný únik.

## Zdůvodnění závažnosti

Nízká: dnes neuniká žádný skutečný údaj (text je pevný). Že e-mail už existuje, prozrazuje
i referenční verze záměrně.

## Návrh opravy

Vrátit neutrální hlášku jako referenční verze, bez zmínky o hesle.

## Co nebylo ověřeno

- Jestli se text liší podle účtu (u účtů z demo dat netestováno, nechceme sahat na sdílené účty).
