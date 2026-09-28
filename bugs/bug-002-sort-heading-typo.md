# BUG-002: Nadpis řazení na domovské stránce zní „Sorth“ místo „Sort“

| | |
|---|---|
| **Stav** | Otevřená |
| **Nalezeno** | 28. 9. 2026 |
| **Oblast** | Texty rozhraní (UI) |
| **Závažnost** | Nízká (návrh, zdůvodnění níže) |
| **Automatizovaný test** | [`tests/smoke/sort-heading.spec.ts`](../tests/smoke/sort-heading.spec.ts), označený `test.fail()` |

## Prostředí

- Aplikace: https://with-bugs.practicesoftwaretesting.com (titulek stránky „Practice Software Testing - Toolshop - v5.0 with bugs“)
- Prohlížeč: Chromium 153.0.8010.12 (Chrome for Testing z Playwright 1.63.0)
- OS: Windows 11

## Kroky k reprodukci

1. Otevři https://with-bugs.practicesoftwaretesting.com.
2. Počkej, až se načte seznam produktů.
3. Podívej se na nadpis nad rozbalovacím seznamem řazení v levém panelu.

## Očekávaný výsledek

Nadpis zní „Sort“ (anglicky „řadit“), stejně jako ostatní nadpisy panelu jsou správná anglická slova
(„Price Range“, „Search“, „Filters“).

## Skutečný výsledek

Nadpis zní „Sorth“:

```html
<h4 class="grid-title"><i class="fa fa-arrows-up-down"></i> Sorth</h4>
```

## Důkaz

- Test: `tests/smoke/sort-heading.spec.ts`, výstup před označením `test.fail()`:
  `Expected: "Sort"`, `Received: " Sorth"`
- Screenshot: ![Nadpis „Sorth“ nad výběrem řazení](img/bug-002-1.png)

## Dopad

- **Všichni uživatelé** domovské stránky vidí překlep. Působí to neprofesionálně a snižuje důvěru v e-shop.
- **Uživatelé čteček obrazovky:** čtečka přečte nesmyslné slovo „Sorth“. Nadpis je ale u výběru řazení,
  takže smysl se dá odvodit z okolí.

## Zdůvodnění závažnosti

Nízká: kosmetická vada textu. Řazení funguje dál a nadpis neblokuje žádný úkol uživatele.
Chyba je ale vidět na hlavní stránce, proto stojí za rychlou opravu.

## Návrh opravy

Opravit text nadpisu v šabloně levého panelu z „Sorth“ na „Sort“.

## Co nebylo ověřeno

- Jestli řazení samotné funguje. Report se týká jen textu nadpisu.
- Jiné stránky se stejným panelem (kategorie, vyhledávání) a jiné jazykové verze webu.
- Jiné prohlížeče než Chromium.
- Není známo, jestli jde o záměrnou chybu verze „with bugs“.
