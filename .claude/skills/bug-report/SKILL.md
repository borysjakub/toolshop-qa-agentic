---
name: bug-report
description: Napíše bug report chyby aplikace do bugs/bug-NNN-kratky-popis.md podle vzoru BUG-001. Použij, když test odhalil chybu aplikace (ne chybu testu) a uživatel ji potvrdil, nebo když uživatel výslovně požádá o bug report.
---

# Bug report

Vzor formátu: [BUG-001](../../../bugs/bug-001-product-images-missing-alt.md).
Nové reporty mají navíc sekci **Důkaz**.

## Kdy skill použít

- Test nebo ruční kontrola odhalily **chybu aplikace** a uživatel potvrdil, že to není chyba testu.
- Uživatel výslovně požádá o bug report.

Nepoužívej, když chyba je v testu (špatný lokátor, chybějící čekání, špatné očekávání).
Tu oprav v testu, report nepiš. Když si nejsi jistý, čí je chyba, zeptej se uživatele.

## Pravidla

1. **Nejdřív reprodukuj.** Spusť test (`npx playwright test <soubor> --reporter=list`)
   nebo projdi kroky na stránce. Když se chyba neprojeví, report nepiš a řekni to uživateli.
2. **Nevymýšlej kroky.** Do „Kroky k reprodukci“ patří jen kroky, které jsi opravdu ověřil.
   Co ověřené není, patří do sekce „Co nebylo ověřeno“.
3. **Nevymýšlej prostředí.** Verze zjisti (`npx playwright --version`, verze Chromia z běhu testu,
   titulek stránky). Co zjistit nejde, označ `TODO:` a zeptej se.
4. **Závažnost jen navrhni.** V tabulce vždy napiš „(návrh, zdůvodnění níže)“.
   Konečné rozhodnutí je na uživateli.
5. **Číslování.** Najdi nejvyšší číslo v `bugs/` a přičti 1. Číslo má vždy tři číslice:
   `BUG-002`, soubor `bugs/bug-002-kratky-popis.md` (anglicky, malými písmeny, bez diakritiky).
6. **Žádné osobní údaje.** Žádná skutečná jména, e-maily, hesla, tokeny ani lokální cesty
   (`C:\Users\...`). Jen testovací data.

## Postup

1. Reprodukuj chybu (pravidlo 1).
2. Zjisti další číslo (pravidlo 5).
3. Posbírej prostředí a důkaz:
   - automatizovaný test, který chybu ukazuje,
   - případně screenshot uložený do `bugs/img/bug-NNN-X.png` (`X` = pořadí obrázku: 1, 2, …).
     Neodkazuj na soubory v `test-results/`, ta složka je v `.gitignore` a na GitHub se nedostane,
   - případně úryvek HTML nebo výstup testu.
4. Napiš report podle šablony níže. Žádnou sekci nevynechávej. Když k ní nemáš co napsat, napiš proč.
5. Projdi kontrolu na konci a ukaž report uživateli.
6. Než test označíš `test.fail()`, ověř ho oběma směry. Test se známou chybou se počítá
   jako prošlý, i když selže ze špatného důvodu (rozbitý lokátor, timeout), takže by to nikdo nepoznal.
   - **Selže ze správného důvodu:** spusť ho bez `test.fail()`. V hlášce musí být skutečná
     chybná hodnota (např. `Received: "Sorth"`), ne timeout ani „element not found“.
   - **Projde bez chyby:** dočasně nastav očekávanou hodnotu na tu chybnou a spusť ho znovu.
     Musí projít. Pak změnu vrať.
7. Pokračuj krokem 2 v sekci „Známé chyby aplikace“ v `CLAUDE.md` (`test.fail()` s anotací `issue`).

## Stupnice závažnosti

| Stupeň | Kdy |
|---|---|
| **Kritická** | Znemožní hlavní funkci e-shopu (nákup, přihlášení, košík) a nejde to obejít, nebo přijde o data či peníze. |
| **Vysoká** | Hlavní funkce nefunguje správně, ale dá se obejít, nebo chyba potká většinu uživatelů. |
| **Střední** | Funkci jde použít, ale je porušený standard (např. přístupnost WCAG) nebo je zhoršený zážitek. Příklad: BUG-001. |
| **Nízká** | Kosmetická vada (překlep, zarovnání), která nemá vliv na funkci. |

Zdůvodnění má vždy říct, **koho** chyba zasáhne a **jestli** blokuje úkol uživatele.

## Šablona

````markdown
# BUG-NNN: TODO: krátký, konkrétní název (co je špatně a kde)

| | |
|---|---|
| **Stav** | Otevřená |
| **Nalezeno** | TODO: D. M. RRRR |
| **Oblast** | TODO: např. Přístupnost (a11y), Košík, Vyhledávání |
| **Závažnost** | TODO: stupeň (návrh, zdůvodnění níže) |
| **Automatizovaný test** | TODO: [`tests/.../soubor.spec.ts`](../tests/.../soubor.spec.ts), označený `test.fail()` |

## Prostředí

- Aplikace: https://with-bugs.practicesoftwaretesting.com (titulek stránky „TODO:“)
- Prohlížeč: TODO: Chromium X (Chrome for Testing z Playwright X)
- OS: TODO:

## Kroky k reprodukci

1. TODO: jen ověřené kroky

## Očekávaný výsledek

TODO: jak se aplikace má chovat, případně podle jakého pravidla nebo standardu.

## Skutečný výsledek

TODO: co se stalo doopravdy, co nejkonkrétněji (počty, hodnoty, úryvek HTML).

## Důkaz

- Test: TODO: `tests/.../soubor.spec.ts`, výstup `TODO:`
- Screenshot: TODO: `![popis](img/bug-NNN-1.png)`, nebo „není“

## Dopad

- TODO: koho chyba zasáhne a jak

## Zdůvodnění závažnosti

TODO: proč navrhovaný stupeň podle stupnice (koho zasáhne, jestli blokuje úkol).

## Návrh opravy

TODO: stručně, nebo „Neznámý, řeší vývoj.“

## Co nebylo ověřeno

- TODO: co jsi nezkoušel (další stránky, prohlížeče, …)
````

## Kontrola před odevzdáním

- [ ] Název říká co a kde.
- [ ] Prostředí je vyplněné a žádná verze není vymyšlená.
- [ ] Kroky k reprodukci jsou ověřené a jde je zopakovat.
- [ ] Očekávaný a skutečný výsledek jsou oddělené a konkrétní.
- [ ] Závažnost je označená jako návrh a má zdůvodnění.
- [ ] Důkaz je vyplněný (test, screenshot v `bugs/img/`, nebo úryvek).
- [ ] V reportu nezůstalo žádné `TODO:`, nebo o něm uživatel ví.
- [ ] Žádné osobní údaje, hesla ani lokální cesty.
