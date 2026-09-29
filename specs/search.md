# Toolshop Product Search Test Plan

## Application Overview

Test plan for the product search on the Toolshop homepage (https://with-bugs.practicesoftwaretesting.com/#/). Scope: search input, search button, reset (X) button, results list and the result heading/count. Expected results describe CORRECT behaviour; deviations seen on the with-bugs build are listed in the final section.

Common locators (seen on page): input getByTestId('search-query') (textbox has no accessible name); reset getByTestId('search-reset') (accessible name "X"); submit getByTestId('search-submit') (accessible name "Serch", a typo, so prefer the test id); heading getByTestId('search-caption') (h3 "Searched for: <term>"), getByTestId('search-term'); count getByTestId('search-result-count') (text "N products found for '<term>'", "1 product found for ..." in singular); result cards getByTestId('product-name') within links with data-test product-<id>; pagination is ul.pagination (role navigation "Pagination"). API called: GET api-with-bugs.practicesoftwaretesting.com/products/search?q=<term>. Seed: tests/seed/seed.spec.ts. Wait for the caption/count to update after clicking (use web-first assertions, no waitForTimeout). Unfiltered homepage shows 9 products per page with 3 pages.

## Test Scenarios

### 1. Product search

**Seed:** `tests/seed/seed.spec.ts`

#### 1.1. Search by exact product name

**File:** `tests/search/exact-name.spec.ts`

**Steps:**
  1. Open homepage (seed). Type 'Sledgehammer' into search-query and click search-submit.
    - expect: search-caption shows 'Searched for: Sledgehammer'
    - expect: search-result-count reads '1 product found for 'Sledgehammer''
    - expect: Exactly one product-name card with text 'Sledgehammer'
    - expect: Pagination is not shown

#### 1.2. Search by partial name returns all matches

**File:** `tests/search/partial-name.spec.ts`

**Steps:**
  1. Type 'ham' and click search-submit.
    - expect: Count reads '7 products found for 'ham''
    - expect: Results: Claw Hammer, Claw Hammer with Fiberglass Handle, Claw Hammer with Shock Reduction Grip, Court Hammer, Hammer, Sledgehammer, Thor Hammer (order not asserted)
    - expect: Number of product cards equals the number in the count text
  2. Search for 'Pliers'.
    - expect: 4 products: Combination Pliers, Long Nose Pliers, Pliers, Slip Joint Pliers

#### 1.3. Search is case-insensitive

**File:** `tests/search/case-insensitive.spec.ts`

**Steps:**
  1. Search 'Hammer', record the product names. Then search 'hammer', then 'HAMMER'.
    - expect: All three searches return the same set of products and same count
    - expect: Heading echoes the term as typed (Hammer / hammer / HAMMER)
    - expect: Set includes Sledgehammer, since it contains 'hammer' (see deviation 1)

#### 1.4. Search by alphanumeric term

**File:** `tests/search/alphanumeric.spec.ts`

**Steps:**
  1. Search '12V'.
    - expect: Count reads '1 product found for '12V'' (singular 'product')
    - expect: Only 'Cordless Drill 12V' is shown
  2. Search 'Drill'.
    - expect: 4 products: Cordless Drill 12V, 18V, 20V, 24V

#### 1.5. Search with no results

**File:** `tests/search/no-results.spec.ts`

**Steps:**
  1. Search 'zzzxqy'.
    - expect: Heading 'Searched for: zzzxqy'
    - expect: Count reads '0 products found for 'zzzxqy''
    - expect: No product cards, no pagination
    - expect: Ideally a friendly 'no products found' message (currently only the count line; see notes)
    - expect: Page does not crash and search controls stay usable
  2. Search 'Hammer' right after the no-results search.
    - expect: Results appear normally, stale empty state is replaced

#### 1.6. Empty search restores the full listing

**File:** `tests/search/empty-search.spec.ts`

**Steps:**
  1. With empty input click search-submit.
    - expect: No error, no 'Searched for' heading with blank term
    - expect: Normal listing remains (9 products on page 1, pagination present)
  2. Search 'Saw' and then, with empty input, click search-submit again.
    - expect: Full unfiltered listing is displayed again and the search heading is gone

#### 1.7. Reset button clears search and restores listing

**File:** `tests/search/reset.spec.ts`

**Steps:**
  1. Search 'zzzxqy' (0 results), then click search-reset (X).
    - expect: Input is empty
    - expect: search-caption and search-result-count are gone
    - expect: 9 products on page 1 with pagination 1-3
  2. Search 'Hammer', then click search-reset.
    - expect: Same restored state as above
    - expect: Input value is '' (also assert it holds the typed text before clicking submit)

#### 1.8. Whitespace handling

**File:** `tests/search/whitespace.spec.ts`

**Steps:**
  1. Type '   ' (3 spaces) and click search-submit.
    - expect: Treated like empty search: full listing shown, NOT '0 products found'
  2. Type '  Pliers  ' (leading/trailing spaces) and click search-submit.
    - expect: Same 4 results as 'Pliers'
    - expect: Heading/count should ideally show trimmed term 'Pliers'

#### 1.9. Special characters are handled safely

**File:** `tests/search/special-characters.spec.ts`

**Steps:**
  1. Search the string <script>alert(1)</script> % _ ' "
    - expect: No JavaScript dialog, no script element injected into search-caption (text is escaped and shown literally)
    - expect: 0 results, count text reflects the query
    - expect: App stays functional (no error page)
  2. Search '%' and then '_'.
    - expect: Characters are treated literally (not as SQL wildcards): 0 products, and NOT the whole catalogue
    - expect: Heading/count update to reflect the query (see deviation 3)
  3. Search a 200-character string and a term with unicode, e.g. 'młotek'.
    - expect: No crash; 0 products found with a matching count line

#### 1.10. Search heading and count reflect the query

**File:** `tests/search/heading-count.spec.ts`

**Steps:**
  1. Search 'Hammer', then 'Saw', then 'zzzxqy' in sequence.
    - expect: After each search caption term and count term equal the latest query
    - expect: Count number equals the number of product-name cards
    - expect: Singular 'product' for exactly 1 result, plural otherwise (including 0)
    - expect: Previous query text does not linger

#### 1.11. Submit search with the Enter key

**File:** `tests/search/enter-key.spec.ts`

**Steps:**
  1. Type 'Saw' in search-query and press Enter (without clicking the button).
    - expect: Search executes exactly as with the button: caption 'Searched for: Saw', results shown

#### 1.12. Search input behaviour after submit

**File:** `tests/search/input-state.spec.ts`

**Steps:**
  1. Search 'Drill' and check the input value afterwards.
    - expect: Input keeps the submitted term 'Drill' so the user can refine it (see deviation 4)

#### 1.13. Search from a paginated listing

**File:** `tests/search/from-page-2.spec.ts`

**Steps:**
  1. On the homepage go to page 2 in pagination, then search 'Hammer'.
    - expect: Results come from the full catalogue, starting on page 1, not limited to page 2
    - expect: Pagination hidden if fewer than 10 results

## Observed deviations (possible app bugs)

Seen by the planner on the with-bugs build. Not yet confirmed as app bugs; each needs a failing
test and a human decision before it becomes a bug report.

1. **Partial match misses Sledgehammer.** 'hammer' / 'Hammer' returns 6 products without
   Sledgehammer, 'ham' returns 7 including it. Confirmed directly on the API
   (`GET /products/search?q=hammer` → total 6, `?q=ham` → total 7), so it is a backend issue.
2. **Whitespace-only search.** '   ' shows "Searched for:    " and "0 products found for '   '"
   instead of the full listing.
3. **'%' search does nothing.** No API request is sent; caption and count keep the previous query.
   '_' alone not tried.
4. **Input cleared after submit (unconfirmed, possibly timing-dependent).** After searching 'Saw'
   or 'Drill' the input value read back as ''. The '%' search (no request) kept its value.
5. **Label typos.** Search button accessible name "Serch" (use the test id). Outside search scope:
   "Sorth" (BUG-002), "Contakt", and "Home" linking to `#/contact`.
6. **No-results state** shows only the count line, no friendly message. UX note, not a definite bug.
7. **Console errors.** 4 errors logged on page load, before any search. Not investigated.

Other notes: the first Enter-key search in the session ('Hammer') sent no request, later Enter
searches worked; padded '  Pliers  ' returns correct results but the heading shows the untrimmed
term; the input and the reset button have no meaningful accessible name (textbox without name, "X").
