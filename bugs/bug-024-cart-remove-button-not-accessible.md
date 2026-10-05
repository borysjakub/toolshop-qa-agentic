# BUG-024: Tlačítko pro odebrání položky z košíku nemá název ani roli a nejde ovládat klávesnicí

| | |
|---|---|
| **Stav** | Otevřená |
| **Nalezeno** | 5. 10. 2026 (poprvé zahlédnuto u TQA-5 jako postřeh) |
| **Oblast** | Přístupnost (a11y), košík |
| **Závažnost** | Střední (návrh, zdůvodnění níže) |
| **Automatizovaný test** | [`tests/accessibility/cart-remove-button.spec.ts`](../tests/accessibility/cart-remove-button.spec.ts) (3 testy), označené `test.fail()` |
| **Jira** | TQA-25 (souvisí s TQA-5 a TQA-16) |

## Prostředí

- Aplikace: https://with-bugs.practicesoftwaretesting.com (titulek stránky „Practice Software Testing - Toolshop - v5.0 with bugs“)
- Prohlížeč: Chromium 153.0.8010.12 (Chrome for Testing z Playwright 1.63.0), ručně ověřeno i v Google Chrome
- OS: Windows 11

## Kroky k reprodukci

1. Přidej do košíku produkt, který je skladem (např. Pliers, https://with-bugs.practicesoftwaretesting.com/#/product/2).
2. Otevři košík.
3. Klikni do pole množství a stiskni **Tab**.
4. Prohlédni červené tlačítko s křížkem nástrojem pro přístupnost (DevTools → Accessibility).

## Očekávaný výsledek

Podle WCAG 2.2: tlačítko má přístupný název a roli (4.1.2 Název, role, hodnota, úroveň A) a jde
na něj přejít a použít ho klávesnicí (2.1.1 Klávesnice, úroveň A). Např.
`<button type="button" aria-label="Remove Pliers">`.

## Skutečný výsledek

Tlačítko je `<a class="btn btn-danger"><i class="fa fa-remove"></i></a>`: bez `href`, bez textu
a bez `aria-label`. Nemá tedy roli tlačítka ani název a nejde na něj klávesou Tab:
z pole množství skočí fokus rovnou na „Proceed to checkout“.

Stejný kód má i referenční verze bez chyb. Nejde tedy o vloženou chybu, požadavek vychází z WCAG.

## Důkaz

- Test: `tests/accessibility/cart-remove-button.spec.ts`, výstup před označením `test.fail()`:
  ```
  toHaveAccessibleName  Expected pattern: /remove/i  Received string: ""
  toHaveRole            Expected: "button"           Received: ""
  toBeFocused           Expected: focused            Received: inactive
  ```
- Ručně v Google Chrome: po Tab z pole množství má fokus `BUTTON [data-test=proceed-1] Proceed to checkout`.
- Screenshot: ![Tlačítko odebrání v tabulce košíku](img/bug-023-1.png) (červený křížek vpravo)

## Dopad

- Zákazník, který ovládá web klávesnicí, nemůže odebrat položku z košíku.
- Čtečka obrazovky tlačítko nenajde nebo ho nepojmenuje.
- Funkce odebrání je navíc nefunkční i myší (BUG-015).

## Zdůvodnění závažnosti

Střední: porušení WCAG úrovně A u ovládacího prvku košíku, týká se uživatelů klávesnice a čteček.

## Návrh opravy

Použít `<button type="button" aria-label="Remove {název produktu}">` (nebo `<a href>` s `role="button"`
a názvem). Opravit spolu s BUG-015 (tlačítko nic nedělá).

## Co nebylo ověřeno

- Konkrétní čtečky obrazovky (NVDA, JAWS), ověřeno přes accessibility tree a Playwright.
