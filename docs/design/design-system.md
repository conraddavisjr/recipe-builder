# Palate design system, derived from Savour

This document reverse-engineers the Savour UI (`~/Projects/food-recommendation`) into a reusable system and maps it onto Palate's existing tokens and primitives.
Every value below is copied from Savour's code unless it is explicitly marked "derived" or "proposed".
Source files studied: `app/globals.css`, `app/Savour.tsx`, `app/IngredientArt.tsx`, `app/layout.tsx`, `lib/model.ts`, `lib/seeds.ts`, `docs/asset-prompts.md`, `README.md`, `public/ingredients.png`, `public/og.png`.

Sections 1 through 8 describe Savour as built.
Section 9 is the translation guide and contains the drop-in CSS for Palate.

---

## 1. Brand feel

Savour reads as a printed culinary journal rather than a software dashboard.
The page is warm ivory paper (`#f9f8f3`), the ink is a deep forest green (`#263c30`) instead of black, and every "grey" is actually a desaturated green, so the whole screen sits in one temperature.
Headlines are a large, tightly tracked serif (Georgia, 64px, letter-spacing -2px) with a single italic phrase colored olive (`#788444`), which gives each page a spoken, editorial voice ("Good food. *Your kind of good.*").
Body copy is small, quiet, and generously leaded (11 to 15px at line-height 1.6 to 1.8) in a plain sans, so the serif headlines carry all the personality.
Whitespace does the structuring: a 100px header, 58px of top padding, 54px before the toolbar, 42px gutters in the detail layout, and 25px gaps in the card grid.
Surfaces are flat white cards with a hairline border (`#e1e4db`) and no resting shadow; depth only appears on hover (`0 12px 28px #263c3010`) and on dialogs.
Accents are used sparingly and always in the olive family: the brand star `✳` (`#879443`), eyebrows (`#798166`), step numbers (`#8b995c`), the focus ring (`#879443`), and the lime bookmark fill (`#e4ecb2`).
Imagery is real food photography cropped to fixed heights with 16px rounding and no gradient overlays, plus a hand-painted watercolor ingredient sheet on ivory that blends into the page with `mix-blend-mode: multiply`.
Motion is minimal and soft: 180 to 250ms transitions, a 4px card lift, a 600ms 1.03x image zoom, and a slide-in drawer.
The result is fresh (green-on-ivory, lots of air), warm (paper tint, serif voice, watercolor), and inviting (short poetic copy, tiny caps eyebrows, pill buttons).

Devices to keep, in priority order:

1. The ivory-and-forest palette with olive as the only accent.
2. The serif display with an olive italic phrase on every page heading.
3. Flat white bordered cards with hover-only shadows.
4. Uppercase tracked eyebrows above headings and above card titles.
5. Pill buttons where "primary" means ink-filled, not colored.
6. Watercolor ingredient illustrations at 36px in ingredient rows.
7. Generous vertical rhythm (roughly 24 / 30 / 42 / 58px steps).

---

## 2. Color system

Savour ships light mode only.
There is no `@theme` block; Savour uses five custom properties and many hard-coded hex values.
Both are catalogued below so nothing is lost.

### 2.1 Declared tokens (`:root` in `app/globals.css`)

| Token | Value | Role |
| --- | --- | --- |
| `--cream` | `#f9f8f3` | Page background, dialog background, primary pill on tinted banners |
| `--ink` | `#263c30` | Text, primary button fill, active chip fill, toast fill, nav underline |
| `--muted` | `#758075` | Secondary text, card descriptions, captions, form helper text |
| `--line` | `#e1e4db` | All hairline borders: header, cards, inputs, dividers |
| `--lime` | `#e4ecb2` | Saved bookmark button fill only |

### 2.2 Hard-coded olive accent family

These are the "accent" in Savour.
They all sit within a few degrees of each other, so the eye reads them as one olive.

| Value | Where used | Recommended single token |
| --- | --- | --- |
| `#879443` | Brand star, focus-visible outline | `--olive` (canonical) |
| `#788444` | `h1 em` italic phrase | `--olive` |
| `#798166` | `.eyebrow` | `--olive-muted` |
| `#7a854d` | `small` (card eyebrow) | `--olive` |
| `#8b995c` | `.step-number` | `--olive-soft` |
| `#8a995c` | `.chosen` border | `--olive-soft` |
| `#89954e` | `.note-star` | `--olive` |
| `#83915a` | `.empty-state > svg` | `--olive-soft` |
| `#8c946e` | `.card-foot` | `--olive-muted` |
| `#718047` | `.ingredient input` `accent-color` | `--olive-deep` |
| `#7e8d4c` | `.text-button:hover` | `--olive` |
| `#41563d` | `.primary:hover`, `.generation-status` text | `--ink-hover` |
| `#a9af96` | `.hero-link` underline | `--line-strong` |
| `#b7bfa8` | `.wizard-steps span` circle border | `--line-strong` |
| `#cdd3bf` | `.empty-state` dashed border | `--line-strong` |
| `#a8b58c` | `.upload-zone` dashed border | `--olive-soft` |

### 2.3 Hard-coded tinted surfaces (green-cream)

Savour uses eleven near-identical green tints.
They should collapse to two.

| Value | Border | Where used | Collapse to |
| --- | --- | --- | --- |
| `#edf0e5` | none | `button:hover` | `--tint` |
| `#e9ecdf` | none | `.count` bubble | `--tint` |
| `#eaf0da` | `#8a995c` | `.chosen` (selected tile / tier) | `--tint-active` |
| `#ecf0df` | `#e1e6d2` | `.why` details panel | `--tint` |
| `#eef0e3` | none | `.aside-note` | `--tint` |
| `#eff0e4` | `#e3e5d7` | `.bottom-banner` | `--tint` |
| `#edf0e1` | none | `.info-box` | `--tint` |
| `#f0f0e3` | `#e5e5d7` | `.hero-note` | `--tint` |
| `#f4f5ed` | none | `.tags span`, `.step-tags span` | `--tint` |
| `#ecedde` | none | `.empty-image` placeholder | `--tint` |
| `#edf0e4` | `#a8b58c` dashed | `.upload-zone` | `--tint` |
| `#eff0e5` | none | `.analysis` | `--tint` |
| `#edf3e9` | `#cfdcc8` | `.generation-status` | `--tint-active` |

### 2.4 Hard-coded status colors

| Role | Background | Border | Text | Where |
| --- | --- | --- | --- | --- |
| Avoid / negative chip | `#f2e1d7` | `#c89e84` | `#805238` | `.chips .avoid` |
| Warning note | `#f2eddd` | none | `#8d7147` | `.connection-note` |
| Error | `#f9ebe7` | `#e5c2ba` | `#7b3228` | `.generation-error` |
| Working / success | `#edf3e9` | `#cfdcc8` | `#41563d` | `.generation-status` |

### 2.5 Overlays and shadows

| Value | Where |
| --- | --- |
| `#f9f8f3ef` | `.image-badge` (cream at 94% over photos) |
| `#fafaf5ee` | `.save-btn` (cream at 93% over photos) |
| `#1b2b2566` + `backdrop-filter: blur(4px)` | `.dialog::backdrop` |
| `0 12px 28px #263c3010` | `.recipe-card:hover` |
| `0 20px 100px #17261935` | `.dialog` |
| `0 8px 35px #0002` | `.toast` |
| `inset 0 -2px var(--ink)` | `.nav-active` underline |

### 2.6 How accents are used sparingly

Primary actions are ink-filled (`background: var(--ink); color: white`), never olive.
Olive appears only at small sizes: a 40px star glyph, 10px eyebrows, 23px step numerals, 2px focus rings, 12px checkbox accents, and one italic phrase per page.
Lime appears only as the 33px saved-bookmark fill.
Warm terracotta appears only on the "avoid" chips and the warning note, so it always means "no" or "caution".
There is no colored badge system on cards; the card eyebrow (`Mediterranean · Bowl`) is olive text at 9px, not a filled chip.

---

## 3. Typography

### 3.1 Families and loading

| Role | Family as coded | Loaded from | Note |
| --- | --- | --- | --- |
| Display (brand, h1, h2, h3, step numbers, tile titles, related titles, generator textarea) | `Georgia, serif` | System font, not loaded | Georgia at regular weight with negative tracking |
| Body | `Arial, sans-serif` | System font, not loaded | `layout.tsx` loads Geist and Geist Mono via `next/font/google` into `--font-geist-sans` and `--font-geist-mono`, but `body` never references them |
| Count bubble | `11px Arial` | System | Only explicit Arial reference |

Savour's serif voice comes from Georgia's shape: moderate contrast, soft ball terminals, regular weight, tight tracking.
Palate already loads Fraunces with `opsz` and `SOFT` axes, which is the better version of this idea.
Keep Fraunces, use weight 400 to 500 and `"SOFT" 50` to approximate Georgia's warmth, and use Geist for body.

### 3.2 Scale as coded

Sizes are in px because Savour codes them in px.

| Level | Size / line-height | Weight | Tracking | Family | Selector | Responsive |
| --- | --- | --- | --- | --- | --- | --- |
| Brand wordmark | 40px | bold | -2px | Georgia | `.brand` | 35px at <=450px, 27px in footer |
| Hero display | 68px / 1.08 | normal | -2px | Georgia | `.hero h1` | 48px at <=750px |
| Page h1 | 64px / 1.08 | normal | -2px | Georgia | `h1` | 48px at <=750px |
| Detail h1 | 53px / 1.08 | normal | -2px | Georgia | `.detail-heading h1` | 40px at <=750px, 35px at <=450px |
| h1 italic phrase | inherits | normal | inherits | Georgia italic | `h1 em`, color `#788444` | |
| Wizard h2 | 34px | normal | 0 | Georgia | `.wizard h2` | 29px at <=750px |
| Section h2 | 30px | normal | 0 | Georgia | `h2` | 27px toolbar at <=750px |
| Dialog h2 | 28px | normal | 0 | Georgia | `.dialog-head h2` | 25px at <=750px |
| Card / section h2 | 27px | normal | 0 | Georgia | `.section-card h2`, `.related h2` | 25px at <=750px |
| Banner h3 | 26px | normal | 0 | Georgia | `.bottom-banner h3` | 24px at <=750px |
| h3 | 25px / 1.2 | normal | 0 | Georgia | `h3`, `.hero-note h3` (1.3) | |
| Card title | 24px / 1.2 | normal | 0 | Georgia | `.card-body h3`, `min-height: 58px` | 22px at <=1100px, 27px at <=450px |
| Step number / step title | 23px | normal | 0 | Georgia | `.step-number` (color `#8b995c`), `.cooking-step h3`, `.aside-note h3` (1.3) | |
| Generator prompt | 22px / 1.6 | normal | 0 | Georgia | `.generator-box textarea` | 21px at <=750px |
| Tile title | 21px | normal | 0 | Georgia | `.choice b` | 18px compact, 19px at <=450px |
| Tier title | 18px | normal | 0 | Georgia | `.tier-options b` | |
| Related title | 17px / 1.3 | normal | 0 | Georgia | `.related-card b` | 21px at <=750px |
| Intro / lead | 15px / 1.8 | normal | 0 | Arial | `.intro`, color `#788075` | |
| Nav | 14px | normal | 0 | Arial | `nav` | buttons 13px, color `#7a8178` |
| Body text | 13px / 1.8 | normal | 0 | Arial | `.dialog p`, `.section-card p`, `.why p`, `.empty-state p`, `.wizard > p` | |
| Stat value | 13px | 500 | 0 | Arial | `.recipe-stats b` | |
| Button label | 12px | normal (500 on `.primary`) | 0 | Arial | `.primary`, `.wizard-footer button`, `.text-button` | |
| Field label | 12px | normal | 0 | Arial | `.field` | |
| Small body | 12px / 1.7 | normal | 0 | Arial | `.info-box p`, `.aside-note p`, `.toolbar p` | |
| Chip | 11px | normal | 0 | Arial | `.chips button` | |
| Card description | 11px / 1.7 | normal | 0 | Arial | `.card-body p`, clamp 2, `min-height: 37px` | 12px at <=450px |
| Ingredient name | 11px | 500 | 0 | Arial | `.ingredient b` | 10px at <=750px |
| Eyebrow | 10px | 600 | 2.5px | Arial | `.eyebrow`, color `#798166`, uppercase in markup | |
| Card meta | 10px | normal | 0 | Arial | `.card-body .meta` | 9px at <=750px, 11px at <=450px |
| Caption | 10px / 1.7 | normal | 0 | Arial | `.caption`, color `#8a9284` | |
| Tag pill | 10px | normal | 0 | Arial | `.tags span` | |
| Card eyebrow | 9px | normal | 1.5px | Arial | `small`, color `#7a854d`, uppercase in markup | |
| Card foot | 9px | normal | 0 | Arial | `.card-foot`, color `#8c946e` | |
| Step tag | 9px | normal | 0 | Arial | `.step-tags span` | |
| Hero-note eyebrow | 8px | normal | 1.8px | Arial | `.hero-note small` | |
| Saved-note eyebrow | 8px | normal | 1px | Arial | `.saved-note small` | |

### 3.3 Treatment rules

Headlines are always regular weight serif; weight never signals hierarchy, size and color do.
Every page heading is two lines with a `<br />` and the second line wrapped in `<em>` colored olive.
Every heading is preceded by an uppercase eyebrow in olive with wide tracking.
Body text is never larger than 15px and never darker than `--muted` unless it is a title or a value.
Labels on values (stats, meta) are muted and 10 to 11px; the value itself is `--ink` at 500.
Measure is capped explicitly: `.detail-heading h1` at 770px, `.intro` at 750px, `.wizard` at 1050px.
Tracking is negative only on the serif display (-2px at 64px, which is about -0.03em) and positive only on eyebrows (1.5 to 2.5px, about 0.15 to 0.25em).

---

## 4. Layout

### 4.1 Containers

| Element | Max width | Horizontal padding | Vertical |
| --- | --- | --- | --- |
| `header` | 1440px (1520px at >=1600px) | `0 6%` (4% at <=1100px) | height 100px (80px at <=750px), `border-bottom: 1px solid var(--line)` |
| `main` | 1440px (1520px at >=1600px) | `58px 6%` (4% sides at <=1100px, `35px 5%` at <=750px) | |
| `footer` | 1268px | `0 4%` margin at <=1100px, `0 5%` at <=750px | `28px 0 40px`, `border-top: 1px solid var(--line)` |
| `.wizard` | 1050px | | |
| `.dialog` | 640px, `width: calc(100% - 32px)` (16px at <=450px) | inner 30px (25px at <=750px) | `max-height: 90vh` |
| `.drawer` | 490px (100% at <=450px) | inner `35px 30px` | `height: 100dvh` |

### 4.2 Grids

| Grid | Columns | Gap | Breakpoints |
| --- | --- | --- | --- |
| `.grid` (recipe cards) | `repeat(3, 1fr)` | 25px | 2 cols gap 14px at <=750px, 1 col at <=450px |
| `.choice-grid` (wizard tiles) | `repeat(4, 1fr)` | 15px | 3 cols at <=1100px, 2 cols at <=750px |
| `.detail-layout` | `minmax(0, 1fr) 290px` | 42px | `1fr 250px` gap 25px at <=1100px, 1 col at <=750px |
| `.ingredient-grid` | `1fr 1fr` | 10px | 8px at <=750px, 1 col at <=450px |
| `.recipe-stats` | `repeat(3, 1fr)` | 15px | 8px at <=450px |
| `.tier-options` | `1fr 1fr` | 10px | |
| `.form-columns` | `1fr 1fr` | 15px | 1 col gap 0 at <=450px |
| `.ingredient-edit` | `1fr 65px 65px 25px` | 7px | `1fr 52px 52px 20px` at <=750px |

### 4.3 Breakpoints

| Query | Intent |
| --- | --- |
| `min-width: 1600px` | Widen containers to 1520px |
| `max-width: 1100px` | Tighten gutters to 4%, 3-col tiles, narrower sidebar, always show card chat button |
| `max-width: 750px` | Tablet / phone: hide nav, 80px header, 2-col cards, hide hero note, stack detail |
| `max-width: 450px` | Phone: 1-col cards, full-width drawer, stacked form columns |

### 4.4 Vertical rhythm

| Gap | Where |
| --- | --- |
| 58px | `main` top padding |
| 54px | `.toolbar` margin-top after hero (overridden to 20px on discover) |
| 45px | `.bottom-banner` margin-top |
| 42px | `.detail-layout` column gap |
| 35px | `.wizard-steps` margin-top, `.back` margin-bottom, `.choice-grid` margin-bottom |
| 30px | `.detail-layout` margin-top, `.generator-box` margin-top, `.wizard-footer` margin-top, `.aside-note` margin-top |
| 25px | `.why` margin, `.choice-grid` margin-top, `.cooking-step` padding, `.sources` margin |
| 22px | `h1` margin, `.field` margin, `.card-body` padding |
| 20px | `.section-card h2` margin-bottom, `.info-box` margin, `.meta` margin-top |
| 12px | `.chips` margin-top, `h3` margin, `.gallery` margin-top |

### 4.5 Hero and lead treatments

Discover hero is `display: flex; justify-content: space-between; align-items: center; padding: 0 0 26px`.
Left: eyebrow, 68px two-line h1 with olive italic, 15px intro, and a `.hero-link` text button with a 1px bottom border (`#a9af96`).
Right: `.hero-note`, a 270px card with `border-radius: 50% 50% 12px 12px` (arched top), `transform: rotate(3deg)`, tint `#f0f0e3`, border `#e5e5d7`, a 35px olive `✳`, an 8px eyebrow, a 25px serif h3, an 11px paragraph, and three emoji at 30px with 9px letter-spacing, the middle one rotated -25deg.
The hero note is hidden at <=750px and narrowed to 230px at <=1100px.
Other pages (profile, inspiration, generator) use the same eyebrow + h1 + intro stack without the note, and inspiration adds a primary button on the right via `.page-heading`.

### 4.6 Sidebar pattern

Recipe detail uses a 290px right aside (`.related`).
It contains an eyebrow, a 27px h2, a list of `.related-card` rows (75px square thumbnail, 17px serif title, 9px meta, arrow icon, divided by 1px lines), a full-width secondary button, and an `.aside-note` tinted card with a Leaf icon, a 23px serif h3, 12px copy, and a text button.

---

## 5. Components

Each recipe lists the exact CSS from Savour, then a Tailwind v4 equivalent for Palate.

### 5.1 Top bar

```css
header { height: 100px; display: flex; align-items: center; justify-content: space-between; max-width: 1440px; margin: auto; padding: 0 6%; border-bottom: 1px solid var(--line); }
.brand { font: bold 40px Georgia, serif; letter-spacing: -2px; }
.brand span { color: #879443; padding-left: 4px; }        /* the ✳ star */
nav { display: flex; gap: 32px; font-size: 14px; }
header nav button { border: 0; border-radius: 0; padding: 39px 0; color: #7a8178; font-size: 13px; }
header nav button:hover { background: none; color: var(--ink); }
header nav .nav-active { color: var(--ink); box-shadow: inset 0 -2px var(--ink); }
.header-actions { display: flex; gap: 14px; align-items: center; }
.kitchen-button { font-size: 12px; }                      /* pill with ChefHat + ArrowUpRight */
.icon-btn { border: 0; padding: 9px; border-radius: 50%; flex-shrink: 0; }
```

Anatomy: wordmark left (lowercase "savour" plus olive star), four text nav items center-left with a 2px inset underline on the active item, then a bordered pill "Your kitchen" and a round Menu icon button on the right.
Not sticky, no blur, no shadow.
Tailwind for Palate: `h-[100px] max-md:h-20 border-b border-line`, nav links `text-[13px] text-muted hover:text-ink py-[39px] aria-[current=page]:text-ink aria-[current=page]:shadow-[inset_0_-2px_var(--ink)]`.

### 5.2 Buttons

```css
button { cursor: pointer; font: inherit; border: 1px solid var(--line); border-radius: 30px; padding: 12px 20px; color: inherit; background: transparent; display: inline-flex; align-items: center; justify-content: center; gap: 8px; transition: background 0.18s, transform 0.18s; }
button:hover { background: #edf0e5; }
button:disabled { opacity: 0.45; cursor: not-allowed; }
.primary { background: var(--ink) !important; color: white !important; border-color: var(--ink) !important; font-size: 12px; font-weight: 500; padding: 13px 20px; }
.primary:hover { background: #41563d !important; transform: translateY(-1px); }
.full { width: 100%; margin-top: 14px; }
.text-button { border: 0; border-radius: 0; padding: 7px 0; font-size: 12px; gap: 7px; }
.text-button:hover { background: transparent; color: #7e8d4c; }
.hero-link { border: 0; border-bottom: 1px solid #a9af96; padding: 0 0 7px; border-radius: 0; font-size: 12px; margin-top: 16px; }
.round { width: 49px; height: 49px; border-radius: 50%; padding: 0; }   /* 39px at <=450px */
.icon-btn { border: 0; padding: 9px; border-radius: 50%; }
.serving-control button { padding: 0; width: 26px; height: 26px; }
```

| Variant | Fill | Border | Text | Hover |
| --- | --- | --- | --- | --- |
| Secondary (default) | transparent | `1px var(--line)` | ink, 12px | `#edf0e5` fill |
| Primary | `var(--ink)` | ink | white, 12px, 500 | `#41563d` fill, `translateY(-1px)` |
| Text | none | none | ink, 12px | olive `#7e8d4c` text |
| Underline link | none | bottom 1px `#a9af96` | ink, 12px | none |
| Icon | none | none | ink | `#edf0e5` circle |
| Active toggle (`.active`) | `var(--ink)` | ink | white | |
| Chosen tile (`.chosen`) | `#eaf0da` | `#8a995c` | ink | |

Icons inside buttons: lucide at 14 to 17px, gap 8px, arrow icons (`ArrowUpRight`, `ArrowRight`) trail the label.

### 5.3 Chips and filters

```css
.chips { display: flex; gap: 10px; margin: 12px 0 28px; }          /* overflow: auto at <=750px */
.filter-bar .chips { margin: 0; gap: 6px; }
.chips button { background: transparent !important; color: var(--ink) !important; white-space: nowrap; padding: 10px 15px; font-size: 11px; }   /* 9px 13px at <=750px */
.chips button.active { background: var(--ink) !important; color: #fff !important; border-color: var(--ink) !important; }
.chips .avoid { background: #f2e1d7 !important; border-color: #c89e84; color: #805238 !important; }
.wrap { flex-wrap: wrap; overflow: visible; }
.search-box { display: flex; align-items: center; gap: 9px; border-bottom: 1px solid var(--line); min-width: 210px; color: #818878; }
.search-box input { background: none; border: 0; padding: 10px 0; font-size: 11px; width: 190px; }
.list-controls { display: flex; justify-content: space-between; align-items: center; margin: 24px 0 17px; font-size: 10px; color: #879080; }
.list-controls select { border: none; padding: 5px; font-size: 10px; }
```

Filter chips are bordered pills; the active one inverts to ink.
The "avoid" variant is the only warm-colored chip and prefixes the label with `× `.
Search is an underline-only input with a 17px Search icon, sitting right of the chips in `.filter-bar` (`justify-content: space-between; gap: 15px; margin: 20px 0 0`, stacks at <=1100px).
Sort and cuisine selects are borderless 10px text in `.list-controls` beneath the filter bar.

### 5.4 Badges and tags

```css
small { font-size: 9px; letter-spacing: 1.5px; color: #7a854d; }               /* card eyebrow, uppercase in markup */
.card-body small span { padding: 0 6px; }                                        /* the · separator */
.image-badge { position: absolute; left: 15px; bottom: 15px; font-size: 9px; background: #f9f8f3ef; padding: 7px 11px; border-radius: 20px; }
.tags span, .step-tags span { display: inline-flex; align-items: center; gap: 7px; background: #f4f5ed; border-radius: 6px; padding: 9px 11px; font-size: 10px; }
.step-tags span { font-size: 9px; padding: 7px 9px; }
.count { font: 11px Arial; background: #e9ecdf; display: inline-flex; align-items: center; justify-content: center; width: 25px; height: 25px; border-radius: 50%; }
```

Savour has three badge shapes: the tracked-caps text eyebrow (no fill), the cream pill over photos (`.image-badge`), and the soft square tag with a 13 to 14px icon (`.tags span`).
None are saturated; category is conveyed by text, not color.

### 5.5 Recipe card

```css
article { border: 1px solid var(--line); border-radius: 16px; overflow: hidden; background: #fff; }
.recipe-card { transition: transform 0.2s, box-shadow 0.2s; }
.recipe-card:hover { transform: translateY(-4px); box-shadow: 0 12px 28px #263c3010; }
.card-image { position: relative; height: 235px; overflow: hidden; }            /* 210px <=1100, 190px <=750, 245px <=450 */
.image-link { padding: 0; border: 0; border-radius: 0; width: 100%; height: 100%; display: block; }
.card-image img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s; }
.recipe-card:hover .card-image img { transform: scale(1.03); }
.image-badge { position: absolute; left: 15px; bottom: 15px; font-size: 9px; background: #f9f8f3ef; padding: 7px 11px; border-radius: 20px; }
.save-btn { position: absolute; right: 14px; top: 14px; width: 33px; height: 33px; padding: 0; background: #fafaf5ee; border: 0; }
.save-btn.saved { background: var(--lime); }
.card-body { padding: 21px; }                                                    /* 15px <=750, 21px <=450 */
.card-body small { font-size: 9px; letter-spacing: 1.5px; color: #7a854d; }
.title-link { padding: 0; border: 0; border-radius: 0; text-align: left; display: block; }
.card-body h3 { font: 24px/1.2 Georgia, serif; min-height: 58px; margin-top: 13px; }
.card-body p { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; font-size: 11px; line-height: 1.7; margin-top: 8px; min-height: 37px; color: var(--muted); }
.card-body .meta { display: flex; align-items: center; gap: 20px; font-size: 10px; border-top: 1px solid var(--line); padding: 15px 0 0; margin-top: 20px; }
.meta span { display: flex; align-items: center; gap: 6px; }                    /* Clock3 14px, Utensils 14px */
.card-chat { padding: 0; border: 0; margin-left: auto; opacity: 0; }
.recipe-card:hover .card-chat, .card-chat:focus-visible { opacity: 1; }
.card-foot { display: flex; align-items: center; gap: 6px; font-size: 9px; color: #8c946e; margin-top: 15px; }   /* Sparkles 12px + "Inspired by your taste" */
```

Anatomy, top to bottom: photo (fixed height, cover) with a cream pill badge bottom-left showing `tags[0]` and a round bookmark top-right; body with olive caps eyebrow `Cuisine · Type`; 24px serif title; 2-line muted description; hairline; meta row of time and servings with a hover-only chat icon pushed right; a 9px olive "Inspired by your taste" foot with a Sparkles icon.
Candidate cards swap the foot for a full-width `.primary` "Keep this recipe" button.

### 5.6 Recipe detail hero

```css
.back { padding: 0; border: 0; font-size: 11px; color: var(--muted); margin: 0 0 35px; }   /* ArrowLeft 16px + "Back to recipes" */
.detail-heading { display: flex; justify-content: space-between; align-items: center; }
.detail-heading h1 { max-width: 770px; font-size: 53px; }
.detail-heading .intro { max-width: 750px; }
.round { width: 49px; height: 49px; border-radius: 50%; padding: 0; }                     /* bookmark, right side */
.detail-layout { display: grid; grid-template-columns: minmax(0, 1fr) 290px; gap: 42px; margin-top: 30px; }
.detail-photo { width: 100%; max-height: 470px; object-fit: cover; border-radius: 16px; }  /* 400px <=750 */
.gallery { display: flex; gap: 10px; margin-top: 12px; }
.gallery img { width: calc(50% - 5px); height: 160px; object-fit: cover; border-radius: 9px; }
.caption { font-size: 10px; color: #8a9284; line-height: 1.7; }
.recipe-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; border-bottom: 1px solid var(--line); padding: 24px 0; }
.recipe-stats span { display: flex; flex-direction: column; align-items: center; gap: 7px; font-size: 10px; color: var(--muted); }
.recipe-stats svg { width: 21px; color: var(--ink); }
.recipe-stats b { font-size: 13px; color: var(--ink); font-weight: 500; }
.why { background: #ecf0df; border: 1px solid #e1e6d2; padding: 20px; border-radius: 11px; margin: 25px 0; }
.why summary { display: flex; gap: 10px; align-items: center; cursor: pointer; font-size: 13px; list-style: none; }   /* Sparkles 17px, "Why this recipe?", Plus 16px pushed right */
.why p { font-size: 13px; line-height: 1.8; margin: 15px 0 0; }
```

Order: back link, eyebrow `Cuisine / Type`, 53px h1, 15px intro, round bookmark on the right; then the two-column layout with the photo, optional 2-up gallery, caption, three centered stats (icon, bold value, muted label), a collapsible tinted "Why this recipe?" panel, and stacked section cards.

### 5.7 Section card, ingredient rows, step list

```css
.section-card { padding: 26px; background: #fff; border: 1px solid var(--line); border-radius: 14px; margin: 23px 0; }   /* 20px <=750 */
.section-card h2 { display: flex; align-items: center; gap: 10px; font-size: 27px; margin: 0 0 20px; }          /* lucide 21px icon before label */
.section-card p { font-size: 13px; line-height: 1.8; color: var(--muted); }
.section-top { display: flex; align-items: center; justify-content: space-between; gap: 15px; }
.serving-control { display: flex; align-items: center; gap: 10px; font-size: 11px; margin: 20px 0; }
.serving-control button { padding: 0; width: 26px; height: 26px; }

.ingredient-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 5px 0 22px; }
.ingredient { display: flex; align-items: center; gap: 10px; border: 1px solid #edf0e6; border-radius: 9px; padding: 12px 10px; cursor: pointer; }
.ingredient input { accent-color: #718047; width: 12px; height: 12px; }
.ingredient-art { display: block; width: 45px; height: 45px; flex-shrink: 0; font-size: 27px; min-width: 34px; text-align: center; }
.ingredient-art img { width: 36px; height: 36px; object-fit: contain; }
.ingredient b { font-size: 11px; font-weight: 500; display: block; }
.ingredient small { display: block; letter-spacing: 0; font-size: 10px; color: var(--muted); margin-top: 5px; }
.ingredient.checked { opacity: 0.45; }
.ingredient.checked b { text-decoration: line-through; }

.cooking-step { display: flex; align-items: flex-start; gap: 20px; border-top: 1px solid var(--line); padding: 25px 0; }
.cooking-step:last-child { padding-bottom: 0; }
.step-number { font: 23px Georgia; color: #8b995c; margin-top: 6px; }     /* zero-padded "01", "02" */
.cooking-step h3 { font-size: 23px; margin: 4px 0 10px; }
.cooking-step p { margin-bottom: 15px; }
.step-tags span { font-size: 9px; padding: 7px 9px; }                      /* Clock3, Thermometer, Flame at 13px */
```

Ingredient row anatomy: 12px checkbox, 36px watercolor illustration, name at 11px/500 with quantity beneath at 10px muted.
Rows are two per line inside a white section card, with a lighter-than-line border (`#edf0e6`).
Steps are divided by hairlines, led by an olive serif numeral, and end with three soft square tags for time, temperature, and technique.

### 5.8 Forms

```css
input, textarea, select { font: inherit; color: inherit; }
input, textarea { background: #fff; border: 1px solid var(--line); border-radius: 9px; padding: 13px 15px; outline: none; }
textarea { width: 100%; resize: vertical; min-height: 120px; line-height: 1.6; margin: 10px 0 20px; }
select { background: transparent; border: 1px solid var(--line); border-radius: 8px; padding: 10px; }
button:focus-visible, a:focus-visible, input:focus-visible, textarea:focus-visible, select:focus-visible { outline: 2px solid #879443; outline-offset: 4px; }
.field { display: flex; flex-direction: column; gap: 10px; font-size: 12px; margin: 22px 0; }
.field small { font-size: 10px; letter-spacing: 0; color: var(--muted); }
.form-columns { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
.info-box { display: flex; align-items: flex-start; gap: 13px; background: #edf0e1; border-radius: 10px; padding: 15px; margin: 20px 0; }
.info-box p { margin: 0; font-size: 12px; line-height: 1.7; }
.upload-zone { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; min-height: 180px; background: #edf0e4; border: 1px dashed #a8b58c; border-radius: 12px; padding: 20px; text-align: center; font-size: 12px; cursor: pointer; }
.tier-options { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 25px 0; }
.tier-options button { display: flex; flex-direction: column; text-align: left; align-items: flex-start; border-radius: 12px; padding: 18px 15px; }
.tier-options b { font: 18px Georgia; }
.tier-options span { font-size: 11px; line-height: 1.6; color: var(--muted); margin-top: 7px; }
.chosen { background: #eaf0da !important; border-color: #8a995c !important; }
.generator-box { background: white; border: 1px solid var(--line); border-radius: 16px; margin: 30px 0 20px; padding: 24px; }
.generator-box textarea { border: 0; min-height: 130px; font: 22px/1.6 Georgia; padding: 5px; }
```

Inputs have no focus ring of their own; the global 2px olive `outline` with 4px offset does that work.
Labels wrap the control (`<label class="field">`) at 12px with a 10px helper line.
Savour has no toggle switch; boolean choices are two-up `.tier-options` cards or `.chips`.
The generator prompt is a borderless 22px serif textarea inside a white card, which makes typing feel like writing in a journal.

### 5.9 Dialog and drawer

```css
.dialog { padding: 0; border: 1px solid var(--line); border-radius: 20px; background: var(--cream); color: var(--ink); max-width: 640px; width: calc(100% - 32px); max-height: 90vh; margin: auto; box-shadow: 0 20px 100px #17261935; }
.dialog::backdrop { background: #1b2b2566; backdrop-filter: blur(4px); }
.dialog-inner { padding: 30px; }
.dialog-head { display: flex; justify-content: space-between; align-items: center; gap: 20px; margin-bottom: 20px; }
.dialog-head h2 { font-size: 28px; margin: 0; }
.dialog p { font-size: 13px; line-height: 1.8; color: var(--muted); }
.drawer { margin: 0 0 0 auto; max-height: 100dvh; height: 100dvh; max-width: 490px; border-radius: 18px 0 0 18px; }
.drawer .dialog-inner { padding: 35px 30px; }
@media (prefers-reduced-motion: no-preference) { .drawer[open] { animation: slide-in 0.25s ease-out; } }
@keyframes slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
.menu-item { width: 100%; display: flex; justify-content: space-between; border: 0; border-bottom: 1px solid var(--line); border-radius: 0; padding: 22px 0; }
.saved-note { display: flex; justify-content: space-between; gap: 8px; border-top: 1px solid var(--line); padding: 18px 0; }
.saved-note small { font-size: 8px; letter-spacing: 1px; }
```

Dialogs are native `<dialog>` elements with `showModal()`, cream not white, 20px radius, a 28px serif title, and a round X icon button.
The drawer is the same element pinned right at 490px with left-only rounding.
Menu items are full-width text rows with trailing icons and hairline dividers.

### 5.10 Empty state, toast, loading

```css
.empty-state { text-align: center; border: 1px dashed #cdd3bf; padding: 65px 20px; border-radius: 15px; margin-top: 25px; }
.empty-state > svg { margin: auto; color: #83915a; }         /* lucide 32 to 35px */
.empty-state h2 { margin-top: 20px; }
.empty-state p { font-size: 13px; line-height: 1.8; color: var(--muted); margin: 16px 0 25px; }
.empty-image { height: 220px; background: #ecedde; display: grid; place-items: center; color: #a4ae85; }   /* Utensils 50px */
.toast { position: fixed; bottom: 25px; left: 50%; transform: translateX(-50%); background: var(--ink); color: white; border-radius: 12px; padding: 12px 15px 12px 22px; box-shadow: 0 8px 35px #0002; display: flex; align-items: center; gap: 15px; font-size: 12px; line-height: 1.6; z-index: 1000; width: max-content; max-width: 90vw; }
.generation-status { display: flex; align-items: flex-start; gap: 9px; font-size: 12px; line-height: 1.6; color: #41563d; background: #edf3e9; border: 1px solid #cfdcc8; border-radius: 9px; padding: 14px 16px; }
.generation-status svg { animation: generation-pulse 1.2s ease-in-out infinite; }
@keyframes generation-pulse { 50% { opacity: .35; transform: scale(.86); } }
.generation-error { font-size: 12px; line-height: 1.6; color: #7b3228; background: #f9ebe7; border: 1px solid #e5c2ba; border-radius: 9px; padding: 14px 16px; }
.connection-note { font-size: 12px; line-height: 1.7; color: #8d7147; background: #f2eddd; border-radius: 9px; padding: 15px 18px; }
.loading-indicator { position: fixed; bottom: 10px; right: 15px; font-size: 10px; color: #788075; }
```

Empty states are dashed olive-bordered panels with an olive icon, a serif heading, muted copy, and a secondary pill.
Loading is a pulsing Sparkles icon inside a soft green status strip, not a spinner.
Toasts are ink pills at the bottom center with a white X icon.

### 5.11 Illustrated preference tiles (wizard)

```css
.wizard-steps { display: flex; gap: 5px; border-bottom: 1px solid var(--line); margin: 35px 0 30px; overflow: auto; padding-bottom: 15px; }
.wizard-steps button { border: 0; font-size: 11px; white-space: nowrap; padding: 10px 14px; }
.wizard-steps span { display: grid; place-items: center; border: 1px solid #b7bfa8; width: 20px; height: 20px; border-radius: 50%; font-size: 9px; }
.wizard { max-width: 1050px; }
.wizard h2 { margin: 18px 0 10px; font-size: 34px; }
.wizard > p { font-size: 13px; color: var(--muted); line-height: 1.8; margin-bottom: 30px; }
.choice-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 25px 0 35px; }
.choice { position: relative; display: flex; flex-direction: column; align-items: flex-start; justify-content: flex-start; text-align: left; border-radius: 13px; background: #fff; padding: 23px 19px; }
.choice-art { width: 62px; height: 62px; display: grid; place-items: center; font-size: 43px; margin-bottom: 12px; filter: saturate(0.75); }
.choice b { font: 21px Georgia; }
.choice p { font-size: 11px; line-height: 1.7; color: var(--muted); margin: 4px 0 0; }
.choice small { font-size: 8px; letter-spacing: 0.2px; margin-top: 8px; }
.choice-check { position: absolute; right: 15px; top: 15px; }             /* lucide Check 16px, only when chosen */
.choice.compact { gap: 15px; min-height: 130px; }
.choice.compact b { font-size: 18px; }
.chosen { background: #eaf0da !important; border-color: #8a995c !important; }
.wizard-footer { display: flex; justify-content: space-between; border-top: 1px solid var(--line); padding-top: 25px; margin-top: 30px; }
```

Tile anatomy: 62px art slot top-left (a watercolor sprite cell, or an emoji at 43px desaturated to 75% as fallback), 21px serif title, 11px muted description, optional 8px cue line, and a Check icon in the top-right corner only when selected.
Selection is one olive tint (`#eaf0da`) with one olive border (`#8a995c`), not a per-item hue.
The step rail is a row of borderless text buttons with 20px numbered circles, the active one inverted to ink, under a hairline.
Step copy is written as a question ("Where does your appetite wander?") with a one-line instruction beneath.

---

## 6. Imagery

### 6.1 Photography

| Context | Ratio / size | Rounding | Overlay |
| --- | --- | --- | --- |
| Recipe card | fixed height 235px (210 / 190 / 245 responsive), `object-fit: cover` | inherits card 16px via `overflow: hidden` | none; cream pill badge and cream round button float on top |
| Detail hero | `max-height: 470px` (400 mobile), width 100%, cover | 16px | none |
| Gallery | 2-up, `calc(50% - 5px)` by 160px, cover | 9px | none |
| Related thumb | 75px square (90 by 80 at <=750px), cover | 9px | none |
| Upload preview | `max-height: 220px` | 10px | none |
| Missing image | 220px tint `#ecedde` with a 50px Utensils icon in `#a4ae85` | inherits | none |

Photos are shown clean.
There are no gradient scrims, no dark overlays, no text on photos other than the small cream pill.
The seed images are bright, top-down or three-quarter editorial food shots with a lot of natural light, and the OG card (`public/og.png`) is a painterly bowl of roasted vegetables, basil, lemon, and olive oil on ivory linen.

### 6.2 Ingredient illustration sheet

`public/ingredients.png` is a 1254 by 1254px PNG, a 6 by 6 grid of 36 equal cells, about 209px per cell, on plain ivory `#f9f8f3`.
Style: hand-painted watercolor and gouache with fine ink detail, realistic shapes, muted natural color, soft shadow directly beneath each item, generous padding, one centered subject per cell.
Cells in row-major order: quinoa bowl, water glass, cucumber, avocado halves, lettuce, chickpea bowl; yogurt bowl, lemon, parsley, olive oil bottle, salt bowl, linguine nest; basil, Parmesan wedge, garlic bulb, peppercorns, tomatoes, red cabbage; tahini jar, salmon fillet, miso bowl, soy sauce bottle, honey jar, rice bowl; edamame, carrot, sesame bowl, sourdough slice, burrata, red chili; mushroom, ginger, butter, coconut, green olives, potato.

Presentation:

```css
.ingredient-sprite { display: inline-block; width: 100%; height: 100%; min-width: 36px; min-height: 36px; background-repeat: no-repeat; vertical-align: middle; border-radius: 8px; mix-blend-mode: multiply; }
/* inline: background-image: url(/ingredients.png); background-size: 600% 600%; background-position: calc((cell % 6) * 20%) calc(floor(cell / 6) * 20%); */
```

`mix-blend-mode: multiply` makes the sheet's ivory background disappear against the cream page and against white cards, so the illustration appears to sit directly on paper.
The sprite renders at 36px in ingredient rows and 62px in wizard tiles.
AI-generated per-ingredient images (`ingredient.image`) render as `<img class="ingredient-illustration">` with `object-fit: contain` inside the same box.
When neither exists, the emoji from `ingredient.icon` renders at 27px (43px in tiles) with `filter: saturate(0.75)`.

Prompt recipe for new cells (from `docs/asset-prompts.md`): "Warm ivory plain background #f9f8f3. One centered hand-painted botanical cookbook illustration per cell with generous padding. Consistent watercolor-gouache editorial illustration, realistic recognizable ingredient shapes, muted natural colors, beautifully simple."

### 6.3 Icons

Library: `lucide-react` at default 2px stroke.
Sizes used: 12px (card foot), 13px (chip leaf, step tags), 14px (meta, tags, text buttons), 15 to 17px (button leading icons, search), 18 to 21px (icon buttons, section h2, stats), 25 to 35px (aside note, empty state), 50px (empty image).
Set: `ArrowUpRight`, `ArrowLeft`, `ArrowRight`, `Bookmark`, `Check`, `ChefHat`, `Clock3`, `Flame`, `Leaf`, `Menu`, `MessageCircle`, `Plus`, `Search`, `Settings2`, `SlidersHorizontal`, `Sparkles`, `Thermometer`, `Trash2`, `Upload`, `Users`, `Utensils`, `X`.
Icons are always `currentColor`; the only colored icon is the empty-state icon in olive and stats icons in ink.
The brand mark is the Unicode `✳` glyph, not an icon.

---

## 7. Motion

| Element | Property | Duration / easing | Effect |
| --- | --- | --- | --- |
| All buttons | `background, transform` | 0.18s, default ease | hover tint, primary `translateY(-1px)` |
| `.recipe-card` | `transform, box-shadow` | 0.2s | hover `translateY(-4px)` + `0 12px 28px #263c3010` |
| `.card-image img` | `transform` | 0.6s | hover `scale(1.03)` |
| `.card-chat` | `opacity` | none (instant) | 0 to 1 on card hover or focus |
| `.drawer[open]` | `animation: slide-in` | 0.25s ease-out | `translateX(100%)` to `0`, only under `prefers-reduced-motion: no-preference` |
| `.generation-status svg` | `animation: generation-pulse` | 1.2s ease-in-out infinite | 50%: `opacity .35; transform: scale(.86)` |
| `.dialog::backdrop` | | | `blur(4px)` over `#1b2b2566` |
| Focus | | | `outline: 2px solid #879443; outline-offset: 4px` |

No page transitions, no skeleton shimmer, no spring physics.
Hover feedback is a tint change plus a small lift; the lift is reserved for cards (4px) and the primary button (1px).

---

## 8. What to avoid from Savour

Savour's beauty comes from its palette, type pairing, and whitespace.
The following are implementation choices that should not be carried over.

1. Sub-11px text everywhere: 8px and 9px eyebrows, 10px meta, 10px sort controls, 11px chips and card descriptions are below comfortable reading size and fail WCAG size expectations; keep the proportions but floor body at 13px, captions at 12px, and eyebrows at 11px.
2. Twelve near-identical green tints: collapse to `--tint` and `--tint-active`.
3. Six olive hexes for one accent: collapse to `--olive`, `--olive-soft`, `--olive-deep`.
4. `!important` chains (`.primary`, `.chips button`, `.chosen`, `.card-body`) that exist only because global `button` styles fight component styles; use `@layer components` instead.
5. Fixed-height card images (`height: 235px`) that change at four breakpoints; use `aspect-ratio: 4 / 3` once.
6. `min-height` hacks on card titles and descriptions (`58px`, `37px`) to fake alignment; use grid `align-items: stretch` with `mt-auto` on the meta row, which Palate already does.
7. `.chips button:first-child` styling by position rather than by state.
8. Global element selectors (`button`, `h1`, `h2`, `h3`, `small`, `article`) that make every `<small>` olive and every `<article>` a card; scope everything to classes.
9. The `.hero-note` rotated arched card: charming on the marketing hero, but it is decoration with emoji and 8px text; treat it as optional and drop it if the discover page has real content.
10. Emoji fallbacks with `filter: saturate(0.75)`: Palate already has a consistent lucide catalog icon set; keep icons or the watercolor sprite, never emoji.
11. Arial body copy: Savour loads Geist and never uses it; Palate should keep Geist.
12. `.toolbar .primary { font-size: 0 }` to hide labels on mobile; use an explicit icon-only variant.
13. Non-sticky 100px header: elegant on a five-recipe demo, but Palate is a working app with a drawer, settings, and instructions; keep a 72 to 80px header and let it stick with the current blur.
14. A 3-column card grid at 1440px produces 430px-wide cards with 24px titles that look oversized; use `repeat(auto-fill, minmax(300px, 1fr))` so wide screens get 4 columns.
15. No dark mode: Palate already supports `prefers-color-scheme: dark`; the derived dark palette below keeps the forest-green temperature instead of falling back to neutral black.

---

## 9. Translation guide for Palate

Palate currently has: cream `#f6f1e8`, near-black ink `#1f1a16`, terracotta accent `#c2542d` used for primary buttons, hearts, focus, toggles, and the health badge, plus sage and gold supporting notes, six saturated segment hues, hue-tinted wizard tiles, and shadows on every card at rest.
The move is: cooler ivory, forest-green ink, ink-filled primaries, olive as the single small-signal accent, terracotta demoted to "avoid" only, flat cards, and desaturated segment hues that all live in the same green-warm neighborhood.

### 9.1 Token mapping

| Palate token | Current | Proposed | Source in Savour |
| --- | --- | --- | --- |
| `--bg` | `#f6f1e8` | `#f9f8f3` | `--cream` |
| `--surface` | `#fffdf8` | `#ffffff` | `article`, `.section-card`, `input` |
| `--surface-2` | `#f1eadf` | `#edf0e5` | `button:hover`, collapsed tints (`--tint`) |
| `--ink` | `#1f1a16` | `#263c30` | `--ink` |
| `--muted` | `#6f655c` | `#758075` | `--muted` |
| `--line` | `#e4dbcd` | `#e1e4db` | `--line` |
| `--accent` | `#c2542d` | `#879443` | brand star, focus ring (olive) |
| `--accent-soft` | `#f5dfd3` | `#eaf0da` | `.chosen` fill |
| `--accent-ink` | `#ffffff` | `#ffffff` | unchanged |
| `--sage` | `#6c8062` | `#41563d` | `.primary:hover`, status text (deep green) |
| `--gold` | `#c69a3b` | `#8d7147` | `.connection-note` (warm note, demoted) |
| `--shadow` | 2-layer resting shadow | `none` | cards are flat at rest |
| `--shadow-lg` | 2-layer | `0 12px 28px rgb(38 60 48 / 0.06)` | `.recipe-card:hover` |
| `--radius` | `14px` | `16px` | `article`, `.generator-box` |
| new `--radius-sm` | | `9px` | `input`, `.ingredient`, `.gallery img` |
| new `--radius-lg` | | `20px` | `.dialog` |
| new `--tint` | | `#edf0e5` | collapsed green tints |
| new `--tint-active` | | `#eaf0da` | `.chosen` |
| new `--line-strong` | | `#cdd3bf` | dashed empty state, step circles |
| new `--olive-soft` | | `#8b995c` | step numbers, chosen border |
| new `--olive-deep` | | `#718047` | checkbox accent |
| new `--lime` | | `#e4ecb2` | saved bookmark |
| new `--ink-hover` | | `#41563d` | `.primary:hover` |
| new `--shadow-dialog` | | `0 20px 100px rgb(23 38 25 / 0.21)` | `.dialog` |
| new `--backdrop` | | `rgb(27 43 37 / 0.4)` | `.dialog::backdrop` |
| `--font-display` | Fraunces | Fraunces, weight 400 to 500, `"SOFT" 50` | Georgia regular, tight tracking |
| `--font-sans` | Geist | Geist (unchanged) | Savour loads Geist but uses Arial; Geist is the intended body |

Segment colors, retuned so every hue is muted and reads as one family.
Terracotta stays only on temperature, which matches Savour's rule that warm color means heat or caution.

| Token | Current fg / bg | Proposed fg / bg | Rationale |
| --- | --- | --- | --- |
| `--seg-ingredient` | `#3f7a4b` / `#e3f0e4` | `#5f7a3a` / `#eaf0da` | olive, matches `.chosen` |
| `--seg-equipment` | `#4a5f9c` / `#e4e9f7` | `#4f6270` / `#e6ecee` | slate-green instead of blue |
| `--seg-temperature` | `#c2542d` / `#f9e2d8` | `#9c4b2f` / `#f2e1d7` | Savour's avoid-chip warm tint |
| `--seg-time` | `#8a6a1f` / `#f6ecd2` | `#8d7147` / `#f2eddd` | Savour's connection-note |
| `--seg-technique` | `#7a4e8c` / `#efe4f4` | `#6b5b7b` / `#ece7f0` | desaturated plum |
| `--seg-tip` | `#2f7d86` / `#dcf0f2` | `#41563d` / `#edf3e9` | Savour's generation-status |

### 9.2 Class mapping

| Palate class | Current recipe | New recipe (from Savour) |
| --- | --- | --- |
| `.display` | Fraunces 500, -0.01em, 1.1 | Fraunces 400, `-0.02em` (`-0.03em` at 48px+), line-height 1.08, `"SOFT" 50`; add `.display em { font-style: italic; color: var(--accent); }` for the olive phrase |
| `.eyebrow` | 0.7rem, 0.14em, muted, 600 | `0.6875rem` (11px), `0.22em`, uppercase, color `#798166` (`--olive-muted`), 600 |
| `.label` | 0.8rem 600 muted | `0.75rem` (12px) 500 `--ink`, with helper `<small>` at 12px muted, from `.field` |
| `.text-muted` | muted | unchanged |
| `.card` | surface + line + radius + resting shadow | white, `1px solid var(--line)`, `border-radius: 16px`, no shadow; add `.card-hover` for `translateY(-4px)` + `--shadow-lg` over 0.2s |
| `.btn` | pill, 0.55rem 1rem, 600, 0.875rem, surface fill | pill (30px), `12px 20px`, 500, `0.8125rem` (13px), transparent fill, `1px solid var(--line)`, hover `--tint`, transition 0.18s |
| `.btn-primary` | terracotta fill | `background: var(--ink); color: #fff; border-color: var(--ink)`; hover `--ink-hover` + `translateY(-1px)` |
| `.btn-ghost` | transparent, hover surface-2 | unchanged shape, hover `--tint`; add `.btn-text` (no padding sides, olive on hover) from `.text-button` |
| `.btn-sm` | 0.35rem 0.7rem, 0.8rem | `10px 15px`, `0.75rem` from `.chips button` |
| `.btn-icon` | 0.5rem pad, pill | `padding: 9px`, `border-radius: 50%`, no border, from `.icon-btn`; add `.btn-round` at 49px for the detail bookmark |
| `.chip` | pill, surface fill, 600, 0.78rem | pill, transparent, `10px 15px`, 400, `0.75rem`, `1px solid var(--line)`; active inverts to ink (already `data-active`); add `.chip-avoid` in `#f2e1d7 / #c89e84 / #805238` |
| `.badge` | pill, surface-2, 600, 0.7rem | Two variants: `.badge` becomes the soft square tag (`--tint`, `border-radius: 6px`, `9px 11px`, 400, `0.75rem`) from `.tags span`; new `.badge-photo` is the cream pill over images (`rgb(249 248 243 / 0.94)`, `7px 11px`, `border-radius: 20px`, `0.6875rem`) from `.image-badge`; new `.card-eyebrow` is the tracked olive caps text for `Cuisine · Type` |
| `.tile` | hue-tinted, shadowed, 1rem pad | white, `1px solid var(--line)`, `border-radius: 13px`, `23px 19px`, no shadow; `data-active` sets `--tint-active` fill and `--olive-soft` border; ignore `--hue` |
| `.tile-art` | 3rem hue box | `62px` square, transparent background, no rounding, sprite or lucide at 28px; active state keeps olive |
| `.input` `.textarea` `.select` | 0.6rem 0.8rem, radius 10, accent focus ring | white, `13px 15px`, `border-radius: 9px`; select `10px` pad, `8px` radius; focus uses global `outline: 2px solid var(--accent); outline-offset: 4px` and no box-shadow |
| `.textarea` | min 7rem, 1.5 | `min-height: 120px`, `line-height: 1.6` |
| `.shimmer` | grey shimmer | keep, retinted to `--tint` and `--line` (Savour has no shimmer; Palate needs one for pending images) |
| `.scroll-quiet` | thin scrollbar | unchanged |
| `Toggle.tsx` inline colors | `--accent` on, `--line` off | `--ink` on, `--line` off (primary state is ink, not olive) |
| `RecipeCard.tsx` favorite | terracotta Heart | `Bookmark` in a 33px round `rgb(250 250 245 / 0.93)` button top-right; saved state fills `--lime` |
| `RecipeCard.tsx` badge row | four filled badges | one `.card-eyebrow` line `Cuisine · Dish type`, and at most one `.badge-photo` on the image for the health profile |
| `TopBar.tsx` | 56px sticky blur | 80px, sticky blur kept, wordmark as `.display text-[28px] tracking-[-0.04em]` with an olive `✳` |

### 9.3 Drop-in CSS for `app/globals.css`

This replaces the `:root` block, the dark block, the `@theme inline` block, `body`, and the whole `@layer components` block.
Keep the `@import "tailwindcss";` line and the `html { color-scheme }` line.
The dark palette is derived, not copied; it keeps the forest temperature by tinting every neutral toward `#263c30`.

```css
/*
 * Palate design tokens, derived from Savour.
 *
 * Ivory paper, forest-green ink, olive as the only accent. Primary actions
 * are ink-filled; olive is reserved for small signals (eyebrows, focus,
 * step numerals, the brand star, selected tiles). Terracotta means "avoid"
 * or "heat", nothing else. Cards are flat at rest and lift on hover.
 */
:root {
  --bg: #f9f8f3;
  --surface: #ffffff;
  --surface-2: #edf0e5;
  --tint: #edf0e5;
  --tint-active: #eaf0da;
  --ink: #263c30;
  --ink-hover: #41563d;
  --muted: #758075;
  --line: #e1e4db;
  --line-strong: #cdd3bf;
  --accent: #879443;
  --accent-soft: #eaf0da;
  --accent-ink: #ffffff;
  --olive-muted: #798166;
  --olive-soft: #8b995c;
  --olive-deep: #718047;
  --lime: #e4ecb2;
  --sage: #41563d;
  --gold: #8d7147;
  --warn-bg: #f2eddd;
  --warn-fg: #8d7147;
  --danger-bg: #f9ebe7;
  --danger-line: #e5c2ba;
  --danger-fg: #7b3228;
  --avoid-bg: #f2e1d7;
  --avoid-line: #c89e84;
  --avoid-fg: #805238;
  --shadow: none;
  --shadow-lg: 0 12px 28px rgb(38 60 48 / 0.06);
  --shadow-dialog: 0 20px 100px rgb(23 38 25 / 0.21);
  --shadow-toast: 0 8px 35px rgb(0 0 0 / 0.13);
  --backdrop: rgb(27 43 37 / 0.4);
  --radius: 16px;
  --radius-sm: 9px;
  --radius-md: 13px;
  --radius-lg: 20px;
  --radius-pill: 30px;

  --seg-ingredient: #5f7a3a;   --seg-ingredient-bg: #eaf0da;
  --seg-equipment: #4f6270;    --seg-equipment-bg: #e6ecee;
  --seg-temperature: #9c4b2f;  --seg-temperature-bg: #f2e1d7;
  --seg-time: #8d7147;         --seg-time-bg: #f2eddd;
  --seg-technique: #6b5b7b;    --seg-technique-bg: #ece7f0;
  --seg-tip: #41563d;          --seg-tip-bg: #edf3e9;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #171f1a;
    --surface: #1e2821;
    --surface-2: #26312a;
    --tint: #26312a;
    --tint-active: #2c3a2c;
    --ink: #edf0e5;
    --ink-hover: #d9dfcf;
    --muted: #9ba79a;
    --line: #2f3a32;
    --line-strong: #46534a;
    --accent: #b5c26a;
    --accent-soft: #2c3a2c;
    --accent-ink: #171f1a;
    --olive-muted: #9aa483;
    --olive-soft: #aab876;
    --olive-deep: #b5c26a;
    --lime: #4b5a2f;
    --sage: #c6d1b8;
    --gold: #d2b98a;
    --warn-bg: #2f2a1f;
    --warn-fg: #d2b98a;
    --danger-bg: #3a2320;
    --danger-line: #5a3630;
    --danger-fg: #e6a79b;
    --avoid-bg: #3a2a22;
    --avoid-line: #6a4a38;
    --avoid-fg: #e0b79f;
    --shadow: none;
    --shadow-lg: 0 12px 28px rgb(0 0 0 / 0.35);
    --shadow-dialog: 0 20px 100px rgb(0 0 0 / 0.6);
    --shadow-toast: 0 8px 35px rgb(0 0 0 / 0.5);
    --backdrop: rgb(0 0 0 / 0.55);

    --seg-ingredient: #b5c26a;  --seg-ingredient-bg: #2c3a2c;
    --seg-equipment: #a9bcc6;   --seg-equipment-bg: #26333a;
    --seg-temperature: #e8a084; --seg-temperature-bg: #3d2820;
    --seg-time: #d2b98a;        --seg-time-bg: #33301f;
    --seg-technique: #c3b3d1;   --seg-technique-bg: #302a38;
    --seg-tip: #c6d1b8;         --seg-tip-bg: #243328;
  }
}

@theme inline {
  --color-bg: var(--bg);
  --color-surface: var(--surface);
  --color-surface-2: var(--surface-2);
  --color-tint: var(--tint);
  --color-tint-active: var(--tint-active);
  --color-ink: var(--ink);
  --color-muted: var(--muted);
  --color-line: var(--line);
  --color-line-strong: var(--line-strong);
  --color-accent: var(--accent);
  --color-accent-soft: var(--accent-soft);
  --color-accent-ink: var(--accent-ink);
  --color-olive-muted: var(--olive-muted);
  --color-olive-soft: var(--olive-soft);
  --color-lime: var(--lime);
  --color-sage: var(--sage);
  --color-gold: var(--gold);
  --font-sans: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
  --font-display: var(--font-fraunces), Georgia, "Times New Roman", serif;
  --radius-card: var(--radius);
  --radius-field: var(--radius-sm);
  --shadow-card-hover: var(--shadow-lg);
  --shadow-dialog: var(--shadow-dialog);
}

html { color-scheme: light dark; }

body {
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font-sans);
  font-size: 0.9375rem;      /* 15px, Savour .intro */
  line-height: 1.7;
  -webkit-font-smoothing: antialiased;
  -webkit-tap-highlight-color: transparent;
}

/* One focus treatment for everything, from Savour. */
:where(button, a, input, textarea, select, [tabindex]):focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 4px;
}

/* Reusable primitives live in the components layer so Tailwind utilities
   (a later layer) can override them: `select w-auto`, `input pl-9`. */
@layer components {

/* ---------- Type ---------- */
.display {
  font-family: var(--font-display);
  font-weight: 400;
  font-variation-settings: "SOFT" 50;
  letter-spacing: -0.02em;
  line-height: 1.08;
}
.display em { font-style: italic; font-weight: 400; color: var(--accent); }
.display-xl { font-size: clamp(2.75rem, 5.5vw, 4rem); letter-spacing: -0.03em; }   /* 44 to 64px, Savour h1 */
.display-lg { font-size: clamp(2.25rem, 4vw, 3.3125rem); letter-spacing: -0.03em; } /* 36 to 53px, detail h1 */
.display-md { font-size: clamp(1.625rem, 2.5vw, 1.875rem); }                       /* 26 to 30px, h2 */
.display-sm { font-size: 1.5rem; line-height: 1.2; }                                /* 24px, card h3 */
.display-xs { font-size: 1.3125rem; line-height: 1.3; }                             /* 21px, tile title */
.eyebrow {
  font-size: 0.6875rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--olive-muted);
  font-weight: 600;
}
.card-eyebrow {
  font-size: 0.6875rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--accent);
  font-weight: 500;
}
.lead { font-size: 0.9375rem; line-height: 1.8; color: var(--muted); max-width: 46rem; }
.label { font-size: 0.75rem; font-weight: 500; color: var(--ink); }
.label small, .helper { font-size: 0.75rem; font-weight: 400; color: var(--muted); letter-spacing: 0; }
.caption { font-size: 0.75rem; line-height: 1.7; color: var(--muted); }
.text-muted { color: var(--muted); }
.step-number {
  font-family: var(--font-display);
  font-size: 1.4375rem;
  color: var(--olive-soft);
  font-variant-numeric: tabular-nums;
}

/* ---------- Surfaces ---------- */
.card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}
.card-hover { transition: transform 0.2s, box-shadow 0.2s; }
.card-hover:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }
.section-card { padding: 1.625rem; border-radius: 14px; }
@media (max-width: 750px) { .section-card { padding: 1.25rem; } }
.tint-panel { background: var(--tint); border-radius: 12px; padding: 1.25rem; }
.info-box {
  display: flex; align-items: flex-start; gap: 0.8125rem;
  background: var(--tint); border-radius: 10px; padding: 0.9375rem;
  font-size: 0.8125rem; line-height: 1.7;
}
.info-box svg { flex-shrink: 0; margin-top: 3px; }
.note-warn { background: var(--warn-bg); color: var(--warn-fg); border-radius: var(--radius-sm); padding: 0.9375rem 1.125rem; font-size: 0.8125rem; line-height: 1.7; }
.note-danger { background: var(--danger-bg); color: var(--danger-fg); border: 1px solid var(--danger-line); border-radius: var(--radius-sm); padding: 0.875rem 1rem; font-size: 0.8125rem; line-height: 1.6; }
.note-status { display: flex; align-items: flex-start; gap: 0.5625rem; background: var(--seg-tip-bg); color: var(--seg-tip); border: 1px solid color-mix(in oklab, var(--seg-tip) 25%, var(--surface)); border-radius: var(--radius-sm); padding: 0.875rem 1rem; font-size: 0.8125rem; line-height: 1.6; }
.note-status svg { flex: 0 0 auto; margin-top: 2px; animation: pulse-soft 1.2s ease-in-out infinite; }
.empty-state {
  text-align: center; border: 1px dashed var(--line-strong); border-radius: 15px;
  padding: 4rem 1.25rem;
}
.empty-state > svg { margin: 0 auto; color: var(--olive-soft); }
.empty-state p { font-size: 0.8125rem; line-height: 1.8; color: var(--muted); margin: 1rem 0 1.5rem; }
.divider { border-top: 1px solid var(--line); }

/* ---------- Buttons ---------- */
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
  border-radius: var(--radius-pill); padding: 0.75rem 1.25rem;
  font-weight: 500; font-size: 0.8125rem; line-height: 1.2;
  border: 1px solid var(--line); background: transparent; color: var(--ink);
  cursor: pointer; white-space: nowrap;
  transition: background 0.18s, transform 0.18s, color 0.18s, border-color 0.18s;
}
.btn:hover { background: var(--tint); }
.btn:active { transform: translateY(1px); }
.btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }
.btn-primary { background: var(--ink); color: var(--accent-ink); border-color: var(--ink); }
.btn-primary:hover { background: var(--ink-hover); border-color: var(--ink-hover); transform: translateY(-1px); }
.btn-ghost { border-color: transparent; background: transparent; }
.btn-ghost:hover { background: var(--tint); }
.btn-text { border: 0; border-radius: 0; padding: 0.4375rem 0; background: transparent; }
.btn-text:hover { background: transparent; color: var(--accent); }
.btn-link { border: 0; border-bottom: 1px solid var(--line-strong); border-radius: 0; padding: 0 0 0.4375rem; background: transparent; }
.btn-link:hover { background: transparent; border-bottom-color: var(--accent); }
.btn-sm { padding: 0.625rem 0.9375rem; font-size: 0.75rem; }
.btn-icon { padding: 0.5625rem; border-radius: 50%; border-color: transparent; }
.btn-round { width: 3.0625rem; height: 3.0625rem; padding: 0; border-radius: 50%; }
.btn-full { width: 100%; }
.btn[data-active="true"], .btn.is-active { background: var(--ink); color: var(--accent-ink); border-color: var(--ink); }

/* Floating photo controls, from Savour .save-btn */
.btn-photo {
  width: 2.0625rem; height: 2.0625rem; padding: 0; border: 0; border-radius: 50%;
  background: rgb(250 250 245 / 0.93); color: #263c30;
}
.btn-photo[data-active="true"] { background: #e4ecb2; }

/* ---------- Chips, badges, tags ---------- */
.chip {
  display: inline-flex; align-items: center; gap: 0.375rem;
  border-radius: var(--radius-pill); padding: 0.625rem 0.9375rem;
  font-size: 0.75rem; font-weight: 400; white-space: nowrap;
  border: 1px solid var(--line); background: transparent; color: var(--ink);
  cursor: pointer; transition: background 0.18s, border-color 0.18s, color 0.18s;
}
.chip:hover { background: var(--tint); }
.chip[data-active="true"] { background: var(--ink); color: var(--accent-ink); border-color: var(--ink); }
.chip-avoid[data-active="true"] { background: var(--avoid-bg); color: var(--avoid-fg); border-color: var(--avoid-line); }

.badge {
  display: inline-flex; align-items: center; gap: 0.4375rem;
  border-radius: 6px; padding: 0.5rem 0.6875rem;
  font-size: 0.75rem; font-weight: 400; line-height: 1;
  background: var(--tint); color: var(--ink);
}
.badge-sm { padding: 0.4375rem 0.5625rem; font-size: 0.6875rem; }
.badge-photo {
  display: inline-flex; align-items: center; gap: 0.375rem;
  border-radius: 20px; padding: 0.4375rem 0.6875rem;
  font-size: 0.6875rem; font-weight: 500; letter-spacing: 0.04em;
  background: rgb(249 248 243 / 0.94); color: #263c30;
}
.count {
  display: inline-flex; align-items: center; justify-content: center;
  width: 1.5625rem; height: 1.5625rem; border-radius: 50%;
  background: var(--tint); font-family: var(--font-sans); font-size: 0.6875rem;
}

/* ---------- Wizard tile, from Savour .choice ---------- */
.tile {
  position: relative; display: flex; flex-direction: column; align-items: flex-start; gap: 0.25rem;
  text-align: left; padding: 1.4375rem 1.1875rem; border-radius: var(--radius-md);
  background: var(--surface); border: 1px solid var(--line); box-shadow: none;
  color: var(--ink); cursor: pointer;
  transition: background 0.18s, border-color 0.18s, transform 0.18s;
}
.tile:hover { background: var(--tint); }
.tile[data-active="true"] { background: var(--tint-active); border-color: var(--olive-soft); }
.tile:disabled { opacity: 0.45; cursor: not-allowed; }
.tile-art {
  width: 3.875rem; height: 3.875rem; display: grid; place-items: center;
  margin-bottom: 0.5rem; color: var(--olive-soft); background: transparent; border-radius: 0;
}
.tile[data-active="true"] .tile-art { color: var(--ink); }
.tile-title { font-family: var(--font-display); font-weight: 400; font-size: 1.3125rem; line-height: 1.2; letter-spacing: -0.01em; }
.tile-desc { font-size: 0.75rem; line-height: 1.7; color: var(--muted); }
.tile-check { position: absolute; right: 0.9375rem; top: 0.9375rem; color: var(--ink); }
.tile-compact { min-height: 8.125rem; gap: 0.9375rem; }
.tile-compact .tile-title { font-size: 1.125rem; }

/* ---------- Ingredient row and steps ---------- */
.ingredient {
  display: flex; align-items: center; gap: 0.625rem;
  border: 1px solid color-mix(in oklab, var(--line) 60%, var(--surface));
  border-radius: var(--radius-sm); padding: 0.75rem 0.625rem; cursor: pointer;
}
.ingredient input[type="checkbox"] { accent-color: var(--olive-deep); width: 0.75rem; height: 0.75rem; flex-shrink: 0; }
.ingredient-art { width: 2.8125rem; height: 2.8125rem; flex-shrink: 0; display: grid; place-items: center; }
.ingredient-art img, .ingredient-art svg { width: 2.25rem; height: 2.25rem; object-fit: contain; }
.ingredient-name { display: block; font-size: 0.8125rem; font-weight: 500; }
.ingredient-qty { display: block; font-size: 0.75rem; color: var(--muted); margin-top: 0.25rem; font-variant-numeric: tabular-nums; }
.ingredient[data-checked="true"] { opacity: 0.45; }
.ingredient[data-checked="true"] .ingredient-name { text-decoration: line-through; }
.step { display: flex; align-items: flex-start; gap: 1.25rem; border-top: 1px solid var(--line); padding: 1.5625rem 0; }
.step:last-child { padding-bottom: 0; }
.step-title { font-family: var(--font-display); font-weight: 400; font-size: 1.4375rem; line-height: 1.2; margin: 0.25rem 0 0.625rem; }
.stat { display: flex; flex-direction: column; align-items: center; gap: 0.4375rem; font-size: 0.75rem; color: var(--muted); }
.stat svg { width: 1.3125rem; height: 1.3125rem; color: var(--ink); }
.stat b { font-size: 0.8125rem; font-weight: 500; color: var(--ink); }

/* ---------- Forms ---------- */
.input, .textarea, .select {
  width: 100%;
  padding: 0.8125rem 0.9375rem;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  font: inherit;
  font-size: 0.875rem;
  color: var(--ink);
  outline: none;
  transition: border-color 0.18s;
}
.input:hover, .textarea:hover, .select:hover { border-color: var(--line-strong); }
.input::placeholder, .textarea::placeholder { color: var(--muted); opacity: 0.8; }
.textarea { min-height: 7.5rem; resize: vertical; line-height: 1.6; }
.select { padding: 0.625rem; border-radius: 8px; background: transparent; }
.select-quiet { border: 0; padding: 0.3125rem; font-size: 0.75rem; color: var(--muted); background: transparent; }
.input-underline { border: 0; border-bottom: 1px solid var(--line); border-radius: 0; padding: 0.625rem 0; background: transparent; font-size: 0.8125rem; }
.textarea-journal {
  border: 0; background: transparent; padding: 0.3125rem; min-height: 8.125rem;
  font-family: var(--font-display); font-size: 1.375rem; line-height: 1.6; font-variation-settings: "SOFT" 50;
}
.field { display: flex; flex-direction: column; gap: 0.625rem; font-size: 0.75rem; }
.upload-zone {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.75rem;
  min-height: 11.25rem; background: var(--tint); border: 1px dashed var(--olive-soft);
  border-radius: 12px; padding: 1.25rem; text-align: center; font-size: 0.8125rem; cursor: pointer;
}
.option-card {
  display: flex; flex-direction: column; align-items: flex-start; text-align: left;
  border: 1px solid var(--line); border-radius: 12px; padding: 1.125rem 0.9375rem;
  background: transparent; cursor: pointer; transition: background 0.18s, border-color 0.18s;
}
.option-card:hover { background: var(--tint); }
.option-card[data-active="true"] { background: var(--tint-active); border-color: var(--olive-soft); }
.option-card b { font-family: var(--font-display); font-weight: 400; font-size: 1.125rem; }
.option-card span { font-size: 0.75rem; line-height: 1.6; color: var(--muted); margin-top: 0.4375rem; }

/* ---------- Overlays ---------- */
.dialog {
  padding: 0; border: 1px solid var(--line); border-radius: var(--radius-lg);
  background: var(--bg); color: var(--ink);
  max-width: 40rem; width: calc(100% - 32px); max-height: 90vh; margin: auto;
  box-shadow: var(--shadow-dialog);
}
.dialog::backdrop { background: var(--backdrop); backdrop-filter: blur(4px); }
.dialog-inner { padding: 1.875rem; }
.dialog-head { display: flex; justify-content: space-between; align-items: center; gap: 1.25rem; margin-bottom: 1.25rem; }
.drawer { margin: 0 0 0 auto; height: 100dvh; max-height: 100dvh; max-width: 30.625rem; border-radius: 18px 0 0 18px; }
.drawer .dialog-inner { padding: 2.1875rem 1.875rem; }
@media (max-width: 750px) { .dialog-inner, .drawer .dialog-inner { padding: 1.5625rem; } }
@media (max-width: 450px) { .dialog { width: calc(100% - 16px); } .drawer { width: 100%; max-width: none; border-radius: 0; } }
.menu-item {
  width: 100%; display: flex; justify-content: space-between; align-items: center;
  border: 0; border-bottom: 1px solid var(--line); border-radius: 0; padding: 1.375rem 0;
  background: transparent; color: var(--ink); font-size: 0.9375rem; cursor: pointer;
}
.menu-item:hover { color: var(--accent); }
.toast {
  position: fixed; bottom: 1.5625rem; left: 50%; transform: translateX(-50%);
  background: var(--ink); color: var(--accent-ink); border-radius: 12px;
  padding: 0.75rem 0.9375rem 0.75rem 1.375rem; box-shadow: var(--shadow-toast);
  display: flex; align-items: center; gap: 0.9375rem;
  font-size: 0.8125rem; line-height: 1.6; z-index: 1000; width: max-content; max-width: 90vw;
}

/* ---------- Layout helpers ---------- */
.container-page { max-width: 90rem; margin-inline: auto; padding-inline: 6%; }
@media (max-width: 1100px) { .container-page { padding-inline: 4%; } }
@media (max-width: 750px) { .container-page { padding-inline: 5%; } }
.page-top { padding-top: 3.625rem; }
@media (max-width: 750px) { .page-top { padding-top: 2.1875rem; } }
.recipe-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(18.75rem, 1fr)); gap: 1.5625rem; }
@media (max-width: 750px) { .recipe-grid { gap: 0.875rem; } }
.tile-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.9375rem; }
@media (max-width: 1100px) { .tile-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 750px) { .tile-grid { grid-template-columns: repeat(2, 1fr); } }
.detail-layout { display: grid; grid-template-columns: minmax(0, 1fr) 18.125rem; gap: 2.625rem; }
@media (max-width: 1100px) { .detail-layout { grid-template-columns: minmax(0, 1fr) 15.625rem; gap: 1.5625rem; } }
@media (max-width: 750px) { .detail-layout { grid-template-columns: 1fr; } }
.nav-link { font-size: 0.8125rem; color: var(--muted); padding-block: 1.5rem; transition: color 0.18s; }
.nav-link:hover { color: var(--ink); }
.nav-link[aria-current="page"] { color: var(--ink); box-shadow: inset 0 -2px var(--ink); }
.brand { font-family: var(--font-display); font-weight: 600; font-size: 1.75rem; letter-spacing: -0.04em; line-height: 1; }
.brand-star { color: var(--accent); padding-left: 0.125rem; }
.photo-frame { position: relative; overflow: hidden; background: var(--tint); aspect-ratio: 4 / 3; }
.photo-frame img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s; }
.card-hover:hover .photo-frame img { transform: scale(1.03); }
.photo-hero { width: 100%; max-height: 29.375rem; object-fit: cover; border-radius: var(--radius); }
.thumb { width: 4.6875rem; height: 4.6875rem; object-fit: cover; border-radius: var(--radius-sm); }

/* Thin, quiet scrollbars for drawers and menus. */
.scroll-quiet { scrollbar-width: thin; scrollbar-color: var(--line) transparent; }

}

/* ---------- Motion ---------- */
@keyframes pulse-soft { 50% { opacity: 0.35; transform: scale(0.86); } }
@keyframes slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
@media (prefers-reduced-motion: no-preference) {
  .drawer[open] { animation: slide-in 0.25s ease-out; }
}
@media (prefers-reduced-motion: reduce) {
  .card-hover, .btn, .chip, .tile, .photo-frame img { transition: none; }
  .note-status svg { animation: none; }
}

/* Subtle shimmer for pending imagery. Savour has none; Palate needs it. */
@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
.shimmer {
  background: linear-gradient(90deg, var(--tint) 25%, var(--line) 50%, var(--tint) 75%);
  background-size: 200% 100%; animation: shimmer 1.6s linear infinite;
}

/* Watercolor ingredient sprite, from Savour IngredientArt. */
.ingredient-sprite {
  display: inline-block; width: 100%; height: 100%; min-width: 2.25rem; min-height: 2.25rem;
  background-repeat: no-repeat; background-size: 600% 600%;
  border-radius: 8px; mix-blend-mode: multiply; vertical-align: middle;
}
@media (prefers-color-scheme: dark) {
  .ingredient-sprite { mix-blend-mode: normal; border-radius: 50%; background-color: #f9f8f3; }
}
```

### 9.4 Component-level follow-ups (not CSS)

These are the markup changes the CSS above expects.
They are listed so the mapping is complete; they are not made here.

1. `components/shell/TopBar.tsx`: raise to `h-20`, render the wordmark as `<span class="brand">palate<span class="brand-star">✳</span></span>`, and give nav links `.nav-link` with `aria-current="page"`.
2. `components/recipes/RecipeCard.tsx`: wrap the image in `.photo-frame`, replace the four-badge row with one `.card-eyebrow` (`Cuisine · Dish type`), move the health profile to a single `.badge-photo` bottom-left, swap the Heart for a `Bookmark` inside `.btn-photo` top-right, set the title to `.display .display-sm`, and add `.card-hover` to the article.
3. `components/ui/Tile.tsx`: use `.tile-title`, `.tile-desc`, `.tile-check`, and drop the inline `--hue` and the inline check-circle colors; the Check icon should render only when active.
4. `components/ui/Toggle.tsx`: on state uses `var(--ink)`, off state `var(--line)`; the knob stays white in light and `var(--bg)` in dark.
5. `components/recipes/RecipeDetail.tsx`: back link as `.btn-text`, eyebrow `Cuisine / Dish type`, title `.display .display-lg`, lead `.lead`, bookmark `.btn .btn-round`, stats row of three `.stat`, "Why this recipe?" as a `<details class="tint-panel">`, sections as `.card .section-card`, ingredients in a two-column grid of `.ingredient`, steps as `.step` with `.step-number` zero-padded.
6. `components/profile/ProfileWizard.tsx`: heading as a question in `.display .display-md`, one-line instruction in `.lead`, `.tile-grid`, footer with `.divider` and `.btn-primary` "Continue".
7. `components/generator/Generator.tsx`: prompt textarea as `.textarea-journal` inside a `.card` with `p-6`, and the busy state as `.note-status` with a pulsing Sparkles icon.
8. `components/shell/InstructionDrawer.tsx` and `SettingsModal.tsx`: render as `<dialog class="dialog drawer">` and `<dialog class="dialog">` with `.dialog-inner`, `.dialog-head`, and a `.btn-icon` close.
9. Every page heading: two lines with the second wrapped in `<em>` inside `.display`, preceded by `.eyebrow`.
10. Fonts in `app/layout.tsx`: keep Fraunces and Geist; optionally add `weight: ["400", "500", "600"]` to Fraunces so the wordmark can be 600 while headings stay 400.
