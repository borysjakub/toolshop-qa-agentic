# Čeká na zápis do Jiry

Spojení s Jirou (MCP server Atlassian) se 3. 10. 2026 nepodařilo obnovit. Tyto změny se zapíšou,
jakmile spojení půjde (`/mcp` → atlassian → přihlásit). Po zápisu doplnit klíče do bug reportů
a tento soubor smazat.

## Nové tickety typu Chyba (prostor TQA, štítek `qa-simulace`)

Popis vždy podle bug reportu (závažnost na prvním řádku, odkaz na report na GitHubu, test,
prostředí, kroky, očekávaný a skutečný výsledek, dopad), jako TQA-6 až TQA-11.

| Bug report | Shrnutí | Priorita | Štítky | Vazba |
|---|---|---|---|---|
| [BUG-012](../bugs/bug-012-order-price-from-client.md) | Objednávka se uloží s cenou, kterou pošle klient | Highest | orders, security | – |
| [BUG-013](../bugs/bug-013-order-for-another-customer.md) | Zákazník může vytvořit objednávku na účet jiného zákazníka | Highest | orders, security | – |
| [BUG-014](../bugs/bug-014-cart-line-total-zero.md) | Mezisoučet položky v košíku je vždy $00.00 | Medium | cart | Blocks TQA-5 (AC2) |
| [BUG-015](../bugs/bug-015-cart-remove-does-nothing.md) | Tlačítko pro odebrání položky z košíku nic neudělá | High | cart | Blocks TQA-5 (AC4) |
| [BUG-016](../bugs/bug-016-api-returns-password-hash.md) | API vrací hash hesla a interní pole uživatele | High | api, security | Relates TQA-1 |
| [BUG-017](../bugs/bug-017-register-reveals-password-hint.md) | Registrace s použitým e-mailem odpoví „Your password hint is …“ | Low | api, security | – |

## TQA-12 (dotaz k prázdnému hledání)

Komentář: „Rozhodnutí vedoucího QA: varianta A. Prázdné odeslání se ignoruje, předchozí výsledky
zůstanou, celý výpis vrací tlačítko X. Test `tests/search/empty-search.spec.ts` upraven.“
Stav: Hotovo.

## TQA-5 (košík)

Komentář se shrnutím podle [tasks/tqa-5-cart.md](tqa-5-cart.md): AC1, AC3, AC5 prošly,
AC2 (BUG-014) a AC4 (BUG-015) ne. K potvrzení: AC5 platí ve stejné záložce prohlížeče
(předpoklad podle referenční verze); smí jít množství v košíku nastavit na 0?
Stav: nechat Probíhající (blokují chyby).
