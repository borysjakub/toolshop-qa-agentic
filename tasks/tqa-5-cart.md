# TQA-5: Otestovat nákupní košík

Jira: [TQA-5](https://borysjakub.atlassian.net/browse/TQA-5) · Testy: [`tests/cart/cart.spec.ts`](../tests/cart/cart.spec.ts)
· Stav: otestováno, AC2 a AC4 nesplněné (BUG-014, BUG-015)

## 1. Analýza zadání

### Co přesně kritéria požadují

| AC | Kritérium | Jak poznám, že prošlo |
|---|---|---|
| AC1 | Přidání z detailu produktu, v hlavičce se aktualizuje počet položek | po **Add to cart** ukazuje počítadlo v hlavičce (`cart-quantity`) přidané množství |
| AC2 | U položky název, cena za kus, množství a mezisoučet; dole celková cena | v řádku košíku správné hodnoty, mezisoučet = množství × cena, celkem = součet řádků |
| AC3 | Změna množství správně přepočítá ceny | po změně množství v košíku se přepočítá celková cena i počítadlo |
| AC4 | Položku jde z košíku odebrat | po kliknutí na odebrat položka zmizí, prázdný košík ukáže hlášku, počítadlo se aktualizuje |
| AC5 | Obsah košíku se neztratí | košík zůstane po obnovení stránky a po přechodu na jiné stránky |

### Nejasnosti a jak jsem je vyřešil

| Otázka | Předpoklad | Zdroj |
|---|---|---|
| Kdy se obsah košíku „neztratí“ (AC5)? Reload, jiná záložka, po přihlášení? | **Ve stejné záložce prohlížeče**: po obnovení stránky a při procházení webu. Jiná záložka ani přihlášení na jiném zařízení se nepožaduje. | Referenční verze bez chyb (`sprint5/UI/src/app/_services/cart.service.ts`) drží košík v `sessionStorage`, ten platí pro jednu záložku. **K potvrzení v Jiře.** |
| Počítá hlavička počet produktů, nebo kusů? | **Kusy** (3 kusy jednoho produktu = 3) | Chování referenční verze (`cart_quantity` se zvyšuje o množství). |
| Jaký text má prázdný košík? | „The cart is empty. Nothing to display.“ | Překlady referenční verze (`sprint5/UI/src/assets/i18n/en.json`). |
| Smí jít množství v košíku nastavit na 0? | Netestováno, **otázka do Jiry**: verze s chybami povolí `min="0"`, referenční `min="1"`. | Atributy pole na stránce a v referenční verzi. |

### Testovací data

Košík je u nepřihlášeného zákazníka jen v prohlížeči (`sessionStorage`), každý test má vlastní
čistý prohlížeč, takže testy na sobě nezávisí a nepotřebují účet. Produkty: první dva produkty
skladem z API (`productsInStock()` v `tests/helpers/cart.ts`), název i cena se berou z API.
Původně byly napevno Combination Pliers a Pliers. 5. 10. 2026 je na sdíleném demu někdo vyprodal
a všechny testy košíku selhaly na zakázaném „Add to cart“.

## 2. Testovací případy

| ID | Scénář | Typ | AC | Výsledek |
|---|---|---|---|---|
| TC-01 | Přidání produktu aktualizuje počítadlo v hlavičce | pozitivní | AC1 | ✅ prošel |
| TC-02 | Počítadlo ukazuje přidané množství (3 kusy) | hraniční | AC1 | ✅ prošel |
| TC-03 | Řádek košíku: název, cena, množství, mezisoučet | pozitivní | AC2 | ❌ **chyba** (BUG-014) |
| TC-04 | Celková cena = součet řádků (2 produkty) | pozitivní | AC2 | ✅ prošel |
| TC-05 | Změna množství přepočítá celkovou cenu a počítadlo | pozitivní | AC3 | ✅ prošel |
| TC-06 | Odebrání jediného produktu vyprázdní košík | pozitivní | AC4 | ❌ **chyba** (BUG-015) |
| TC-07 | Odebrání jednoho ze dvou produktů nechá druhý | pozitivní | AC4 | ❌ **chyba** (BUG-015) |
| TC-08 | Košík přežije obnovení stránky | pozitivní | AC5 | ✅ prošel |
| TC-09 | Košík přežije procházení webu | pozitivní | AC5 | ✅ prošel |

Každý test je ověřený oběma směry (dočasná kopie `cart-mutation.spec.ts`, smazaná): 6 úspěšných
testů s chybným očekáváním selhalo, 3 neúspěšné s očekáváním podle chybného chování prošly.

## 3. Nalezené chyby (potvrzené)

| Bug report | Chyba | Test | Závažnost |
|---|---|---|---|
| [BUG-014](../bugs/bug-014-cart-line-total-zero.md) | **Mezisoučet položky je vždy $00.00**, celková cena je správně. | TC-03 | Střední |
| [BUG-015](../bugs/bug-015-cart-remove-does-nothing.md) | **Odebrání položky nic neudělá**, ani po obnovení stránky. | TC-06, TC-07 | Vysoká |

## 4. Další postřehy (mimo zadání, netestováno automaticky)

- Tlačítko odebrání položky je `<a>` bez textu, `href` i přístupného názvu: čtečka obrazovky ho
  nepojmenuje a z klávesnice na něj nejde přejít (stejné i v referenční verzi).
- Tabulka košíku má v hlavičce sloupec „Total“ dvakrát (poslední sloupec s tlačítkem má být bez nadpisu).
- Košík nepřihlášeného zákazníka verze s chybami vůbec neposílá na server (`sessionStorage` `cart`
  s cenami), referenční verze vede košík na serveru (`cart_id`). Souvisí s BUG-012: cenu objednávky určuje klient.
- Odkaz „Home“ v menu vede na `#/contact` (známé z TQA-1, testy se vracejí přes logo).

## 5. Co nebylo otestováno

- Pokladna a platba (mimo zadání).
- Košík přihlášeného zákazníka, sloučení košíku po přihlášení, jiná záložka.
- Množství 0 a záporné, maximum (pole povoluje 10), produkty se slevou a půjčovna.
- Jiné prohlížeče než Chromium, mobilní zobrazení.
