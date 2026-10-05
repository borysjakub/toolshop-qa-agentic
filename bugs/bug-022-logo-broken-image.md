# BUG-022: Logo v hlavičce se nenačte (broken.png) a nemá alternativní text

| | |
|---|---|
| **Stav** | Otevřená |
| **Nalezeno** | 5. 10. 2026 |
| **Oblast** | Přístupnost (a11y), hlavička |
| **Závažnost** | Střední (návrh, zdůvodnění níže) |
| **Automatizovaný test** | [`tests/accessibility/header-logo.spec.ts`](../tests/accessibility/header-logo.spec.ts) („every image in the logo link is loaded and has an alt text“), označený `test.fail()` |
| **Jira** | TQA-23 |

## Prostředí

- Aplikace: https://with-bugs.practicesoftwaretesting.com (titulek stránky „Practice Software Testing - Toolshop - v5.0 with bugs“)
- Prohlížeč: Chromium 153.0.8010.12 (Chrome for Testing z Playwright 1.63.0), ručně ověřeno i v Google Chrome
- OS: Windows 11

## Kroky k reprodukci

1. Otevři https://with-bugs.practicesoftwaretesting.com.
2. Podívej se do levého horního rohu hlavičky.

## Očekávaný výsledek

V hlavičce je logo Toolshopu. Referenční verze ho kreslí jako vložené SVG. Každý obrázek má alternativní
text (WCAG 2.2, 1.1.1 Netextový obsah, úroveň A).

## Skutečný výsledek

Místo loga je ikona rozbitého obrázku. Odkaz loga obsahuje `<img src="broken.png">`: soubor se nenačte
(`naturalWidth` 0) a obrázek nemá atribut `alt`. Odkaz má přístupný název z atributu `title`
(„Practice Software Testing - Toolshop“), ten test ověřuje zvlášť a prochází.

## Důkaz

- Test: `tests/accessibility/header-logo.spec.ts`, výstup před označením `test.fail()`:
  ```
  Error: logo images that are broken or have no alt
  + Array [
  +   "broken.png",
  + ]
  ```
- Screenshot: ![Hlavička: místo loga ikona rozbitého obrázku](img/bug-022-1.png)

## Dopad

- Zákazník nevidí značku obchodu, stránka působí rozbitě.
- Logo je zároveň odkaz na domovskou stránku. Protože odkaz „Home“ vede jinam (BUG-020),
  je to jediná cesta zpět na výpis produktů, a ta je skoro neviditelná.

## Zdůvodnění závažnosti

Střední: porušení WCAG (úroveň A) a viditelná vada na každé stránce. Funkce odkazu zůstává.

## Návrh opravy

Vrátit logo z referenční verze (vložené SVG), případně platný obrázek s `alt=""` (odkaz už má název z `title`).

## Co nebylo ověřeno

- Jiné obrázky v hlavičce na dalších stránkách (ikona u nadpisu „Search“ je taky rozbitý obrázek, viz ROADMAP).
