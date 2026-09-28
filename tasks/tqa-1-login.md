# TQA-1: Otestovat přihlášení zákazníka

Jira: [TQA-1](https://borysjakub.atlassian.net/browse/TQA-1) · Testy: [`tests/auth/login.spec.ts`](../tests/auth/login.spec.ts)
· Stav: otestováno, shrnutí v komentáři TQA-1, AC3 nesplněné (TQA-2)

## 1. Analýza zadání

### Co přesně kritéria požadují

| AC | Kritérium | Jak poznám, že prošlo |
|---|---|---|
| AC1 | Přihlášení e-mailem a heslem, zákazník vidí svůj účet | přesměrování na `#/account`, nadpis „My account“, v menu jméno zákazníka |
| AC2 | Špatné heslo → srozumitelná hláška | hláška se zobrazí, uživatel zůstane na přihlášení |
| AC3 | Po několika neúspěšných pokusech se účet zablokuje | po N špatných pokusech nepustí ani správné heslo a řekne proč |
| AC4 | Zákazník se může odhlásit | po odhlášení je v menu „Sign in“ a stránka účtu není přístupná |

### Nejasnosti a jak jsem je vyřešil

| Otázka | Odpověď | Zdroj |
|---|---|---|
| Kolik je „několik“ pokusů (AC3)? | **3** | Potvrdil vedoucí QA v komentáři TQA-1 (28. 9. 2026). Původní předpoklad vycházel z referenční verze aplikace bez chyb (`sprint5/API/app/Services/UserService.php`, `MAX_LOGIN_ATTEMPTS = 3`). |
| Jak má hláška o zablokování znít? | Musí obsahovat „locked“ | Tamtéž: „Account locked, too many failed attempts. Please contact the administrator.“ |
| Má se u neznámého e-mailu a u špatného hesla ukázat stejná hláška? | Ano | Bezpečnostní praxe: jiná hláška by prozradila, které e-maily jsou registrované. |
| Jde o zákazníka, nebo i o admina? | Jen zákazník | Zadání mluví o zákazníkovi. Admin je v referenční verzi ze zablokování vyjmutý, netestováno. |

### Testovací data

Každý test si přes API (`POST /users/register`) založí vlastní nový účet s náhodným e-mailem
(`tests/helpers/users.ts`). Proč:

- Demo účty z dokumentace sdílí všichni, kdo aplikaci používají. Test zablokování by je mohl zablokovat ostatním.
- Testy na sobě nezávisí a můžou běžet paralelně.

## 2. Testovací případy

| ID | Scénář | Typ | AC | Výsledek |
|---|---|---|---|---|
| TC-01 | Platné údaje otevřou stránku účtu | pozitivní | AC1 | ✅ prošel |
| TC-02 | Menu ukazuje jméno přihlášeného zákazníka | pozitivní | AC1 | ❌ **chyba** |
| TC-03 | Špatné heslo → hláška, zůstane na přihlášení | negativní | AC2 | ✅ prošel |
| TC-04 | Neznámý e-mail → stejná hláška jako špatné heslo | negativní, bezpečnost | AC2 | ✅ prošel |
| TC-05 | Prázdný formulář → chyby u polí | negativní, validace | mimo AC | ❌ **chyba** |
| TC-06 | Jeden špatný pokus účet nezablokuje | hraniční | AC3 | ✅ prošel |
| TC-07 | Po 3 špatných pokusech je účet zablokovaný | negativní, bezpečnost | AC3 | ❌ **chyba** |
| TC-08 | Odhlášení odhlásí zákazníka | pozitivní | AC4 | ✅ prošel |
| TC-09 | Po odhlášení není stránka účtu přístupná | negativní, bezpečnost | AC4 | ✅ prošel |

Každý test je ověřený oběma směry: úspěšné testy v dočasně pozměněné kopii selhaly,
neúspěšné v obrácené verzi prošly (postup ze skillu `bug-report`).

## 3. Nalezené chyby (potvrzené)

| Bug report | Jira | Chyba | Test | Závažnost |
|---|---|---|---|---|
| [BUG-003](../bugs/bug-003-account-not-locked.md) | TQA-2 (blokuje TQA-1) | **Účet se nezablokuje ani po 10 špatných pokusech.** Hesla jde zkoušet donekonečna. | TC-07 | **Kritická** (návrh Vysoká, rozhodl vedoucí QA) |
| [BUG-004](../bugs/bug-004-user-menu-data-not-found.md) | TQA-3 | **Menu po přihlášení ukazuje „User Data not found“** místo jména zákazníka. | TC-02 | Střední |
| [BUG-005](../bugs/bug-005-login-form-no-validation.md) | TQA-4 | **Prázdný formulář se odešle na server** bez kontroly polí, ukáže se „Invalid email or password“. | TC-05 | Nízká (mimo AC) |

## 4. Další postřehy (mimo zadání, netestováno automaticky)

- Tlačítko pro zobrazení hesla nemá přístupný název (čtečka obrazovky přečte jen „tlačítko“).
- Chybová hláška přihlášení nemá `aria-live`, čtečka ji neoznámí.
- Odkaz „Home“ v menu vede na `#/contact`.
- Odpověď API na registraci vrací hash hesla (`"password": "b87f…"`). Hash hesla by nikdy neměl odejít z backendu.
- Hláška z předchozího špatného pokusu zůstává na stránce, dokud nepřijde další odpověď serveru.

## 5. Co nebylo otestováno

- Admin účet, „Forgot your Password?“, přihlášení přes Google a dvoufázové ověření (TOTP).
- Jiné prohlížeče než Chromium, mobilní zobrazení.
- Doba zablokování (odblokuje se účet sám po čase?). Zablokování vůbec nenastane, takže to nejde ověřit.
- Délka a formát hesla, SQL injection a podobné bezpečnostní testy.
