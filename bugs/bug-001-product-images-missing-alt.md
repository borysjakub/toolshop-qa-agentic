# BUG-001: Obrázky produktů na domovské stránce nemají atribut `alt`

| | |
|---|---|
| **Stav** | Otevřená |
| **Nalezeno** | 28. 9. 2026 |
| **Oblast** | Přístupnost (a11y) |
| **Závažnost** | Střední (návrh, zdůvodnění níže) |
| **Automatizovaný test** | [`tests/accessibility/product-images.spec.ts`](../tests/accessibility/product-images.spec.ts), označený `test.fail()` |

## Prostředí

- Aplikace: https://with-bugs.practicesoftwaretesting.com (titulek stránky „Practice Software Testing - Toolshop - v5.0 with bugs“)
- Prohlížeč: Chromium 153.0.8010.12 (Chrome for Testing z Playwright 1.63.0)
- OS: Windows 11

## Kroky k reprodukci

1. Otevři https://with-bugs.practicesoftwaretesting.com.
2. Počkej, až se načte seznam produktů.
3. Na obrázek libovolného produktu klikni pravým tlačítkem → **Prozkoumat** (otevřou se DevTools).
4. Podívej se na atributy elementu `<img>`.

## Očekávaný výsledek

Každý obrázek produktu má atribut `alt`: buď s popisem (např. název produktu), nebo prázdný `alt=""`,
pokud je obrázek brán jako dekorativní (název produktu je hned vedle ve stejné kartě).

## Skutečný výsledek

Atribut `alt` chybí u všech 9 obrázků produktů na první stránce:

```html
<img loading="lazy" class="card-img-top" src="assets/img/products/pliers01.jpeg">
```

Dotčené obrázky: `pliers01.jpeg` až `pliers05.jpeg`, `hammer01.jpeg` až `hammer04.jpeg`
(vše ve složce `assets/img/products/`).

## Dopad

- **Uživatelé čteček obrazovky:** čtečka může místo popisu přečíst název souboru (např. „pliers01.jpeg“)
  nebo jen oznámit neoznačený obrázek.
- **WCAG 2.1:** porušuje kritérium 1.1.1 Netextový obsah (úroveň A). Odpovídá známé chybě F65
  (chybějící atribut `alt` u elementu `img`).
- **SEO:** vyhledávače nemají k obrázkům textový popis.

## Zdůvodnění závažnosti

Střední: název a cena produktu jsou v kartě i jako text, takže uživatel čtečky o informaci nepřijde
a nákup to neblokuje. Jde ale o porušení nejnižší úrovně přístupnosti (A) na hlavní stránce e-shopu.

## Návrh opravy

Doplnit do šablony karty produktu atribut `alt`, ideálně s názvem produktu.

## Co nebylo ověřeno

- Zkontrolována jen první stránka produktů na domovské stránce. Stránkování, kategorie a detail produktu ne.
- Není známo, jestli jde o záměrnou chybu verze „with bugs“.
