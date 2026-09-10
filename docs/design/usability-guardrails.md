# Usability guardrails for the Savour restyle

Palate is about to adopt the look of Savour (`/Users/conraddavis/Projects/food-recommendation/app/Savour.tsx` and its `globals.css`).
This document is the contract for that restyle.
It lists what must survive, diagnoses what is overwhelming today, and specifies the calmer treatments to build instead.
All paths below are relative to `/Users/conraddavis/Projects/temp-recipie-gen` unless stated otherwise.
The owner's brief, verbatim: "Yours is too information-dense. I love that you're showing different things inside of the text, but showing all of those different card bubbles is overwhelming. Yours is ultimately more useful and usable, so be sure to keep that aspect."

## 1. Keep list

Everything in this section is a behavior, affordance or piece of information that must exist after the restyle, even if its pixels change completely.
Each item names the file it lives in today so the person doing the restyle can find it and re-verify it.

### Shell

- `components/shell/TopBar.tsx`: a sticky, translucent top bar with the hamburger on the left, the brand as a link to `/`, and two icon buttons on the right that open the instruction drawer with no context and the settings modal.
- `components/shell/TopBar.tsx`: the chat button carries `aria-label="Talk to the agent"` and a `title` tooltip so the icon-only button is discoverable.
- `components/shell/NavMenu.tsx`: a left slide-in menu with six destinations, each with a label and a one-line hint, the active route highlighted by pathname, and a Settings button pinned to the foot.
- `components/shell/NavMenu.tsx`: clicking a link or the backdrop closes the menu.
- `components/shell/InstructionDrawer.tsx`: a right-hand drawer (460px, capped at 95vw) with a header that says "About "{recipe title}"" when opened from a card or detail page and "General guidance" otherwise.
- `components/shell/InstructionDrawer.tsx`: the composer autofocuses on open, and a newly saved instruction is prepended to the "What the agent already knows" list without a reload.
- `components/shell/InstructionDrawer.tsx`: the drawer shows the five most recent instructions with inline edit, mute and delete, plus a "See all" link to `/instructions` that also closes the drawer.
- `components/shell/SettingsModal.tsx`: a centered modal that scrolls internally, closes on backdrop click, and on "Run now" closes itself, routes to `/` and refreshes so the cooking banner appears immediately.
- `components/shell/ShellProvider.tsx`: opening the drawer from anywhere closes the nav menu, and drawer context (`recipeId`, `recipeTitle`) flows to the composer without prop drilling.
- `components/shell/AppShell.tsx`: `/login` renders with no chrome at all.

### Library grid

- `components/recipes/RecipeGrid.tsx`: keyword search over titles, cuisines and dish types with a 200ms debounce.
- `components/recipes/RecipeGrid.tsx`: sort with four orders (newest, oldest, title, quickest).
- `components/recipes/RecipeGrid.tsx`: a Favorites toggle.
- `components/recipes/RecipeGrid.tsx`: filter vocabularies for cuisine, dish type, health profile and presentation are derived from the unfiltered library, so only values that actually exist are offered and options never vanish mid-filter.
- `components/recipes/RecipeGrid.tsx`: one value per filter group, clicking the active value again clears it, and health and presentation values display their catalog labels via `findCatalogItem`.
- `components/recipes/RecipeGrid.tsx`: a Clear control appears only when a search, filter or favorites toggle is active.
- `components/recipes/RecipeGrid.tsx`: while any run is live the grid polls every 4 seconds so recipes and photos stream in.
- `components/recipes/RecipeGrid.tsx`: the cooking banner shows three distinct messages for queued, generating and rendering, includes the `done/total` render progress, and links to `/history` for details.
- `components/recipes/RecipeGrid.tsx`: three empty states (nothing matches, first batch on its way, library empty) with "Build profile" and "Run now" calls to action on the last one.
- `components/recipes/RecipeGrid.tsx`: an eight-tile shimmer skeleton while loading and an inline error line on failure.

### Recipe card

- `components/recipes/RecipeCard.tsx`: image first, with a shimmer while the photo is pending and a "No image" fallback.
- `components/recipes/RecipeCard.tsx`: the favorite heart overlay on the image and the "Draft" badge for `status === "candidate"`.
- `components/recipes/RecipeCard.tsx`: cuisine and dish type visible on the card.
- `components/recipes/RecipeCard.tsx`: title, two-line poetic summary, total minutes, servings and the rating if set.
- `components/recipes/RecipeCard.tsx`: both the image and the title link to `/recipes/[id]`.
- `components/recipes/RecipeCard.tsx`: a chat icon that appears on hover and on keyboard focus (`focus:opacity-100`) and opens the drawer scoped to this recipe, with `aria-label` and `title` naming the recipe.

### Recipe detail

- `components/recipes/RecipeDetail.tsx`: a back link to the library.
- `components/recipes/RecipeDetail.tsx`: a gallery with a hero image and thumbnail switcher, the active thumbnail outlined, and "Photographing..." while pending.
- `components/recipes/RecipeDetail.tsx`: cuisine, dish type, health profile, presentation and difficulty are all readable somewhere on the page.
- `components/recipes/RecipeDetail.tsx`: the poetic summary, active minutes, total minutes and servings.
- `components/recipes/RecipeDetail.tsx`: a favorite toggle with `aria-pressed` and a "Tell the agent" button that opens the drawer with this recipe's context.
- `components/recipes/RecipeDetail.tsx`: the rationale ("Why the agent chose this for you") as a disclosure with `aria-expanded`, closed by default.
- `components/recipes/RecipeDetail.tsx`: the serving scaler (minus, count, plus) that rescales every ingredient quantity, never drops below a quarter of the original and renders fractions (`¼ ⅓ ½ ⅔ ¾`) via `components/recipes/IngredientRow.tsx`.
- `components/recipes/IngredientRow.tsx`: ingredient illustration when done, shimmer while pending, and a keyed Lucide placeholder from `ingredientIcon` otherwise, plus the preparation and "optional" line.
- `components/recipes/RecipeDetail.tsx`: an equipment list with a glyph from `equipmentIcon` and an "optional" marker for non-essential items.
- `components/recipes/RecipeDetail.tsx`: numbered steps, each with a title and prose built from the segment list in order.
- `components/recipes/Segment.tsx`: the concatenation rule, where a text run that ends in whitespace is left alone and every other run gets a single trailing space, so punctuation after a tagged phrase hugs it.
- `components/recipes/Segment.tsx`: every tagged segment exposes its kind and machine value (`title="Time: 12 min"`), and the glyph has an `aria-label` naming the kind.
- `components/recipes/Segment.tsx`: a way to see the full semantic tagging (this becomes an opt-in, see section 3, but it must not disappear).
- `components/recipes/RecipeDetail.tsx`: the feedback block with a five-star radiogroup where clicking the current rating clears it, a feedback textarea, and a Save button disabled until the draft differs from what is stored.
- `components/recipes/RecipeDetail.tsx`: the "See more like this" column populated from structured similarity, sticky on wide screens, with the generate-similar entry point in both the populated and empty states.
- `components/recipes/RecipeDetail.tsx`: polling every 4 seconds while photos, ingredient art or a similar run are still cooking, and the "Generating similar recipes..." indicator while that run is live.
- `components/recipes/SimilarModal.tsx`: five similarity axes with one-line hints, taste and cuisine preselected, a count of 1 to 5, and Generate disabled when no axis is chosen.

### Taste profile wizard

- `components/profile/ProfileWizard.tsx`: seven steps in this order: cuisines loved, cuisines avoided, flavors, presentation, health profiles, hard rules, cookware.
- `components/profile/ProfileWizard.tsx`: the stepper is clickable to any step, shows a check when the step has selections, and shows "N selected" or "Nothing yet".
- `components/profile/ProfileWizard.tsx`: every tile persists on click (optimistic `PUT /api/profile`, rolled back on failure, tile disabled while its own request is in flight).
- `components/profile/ProfileWizard.tsx`: the footer shows a "Saving" spinner while requests are pending and otherwise "N preferences saved. Every click is saved instantly." in some form.
- `components/profile/ProfileWizard.tsx`: step 3 derives its flavor tiles from loved cuisines via `flavorsForCuisines` and shows the empty hint when no cuisine is loved.
- `components/profile/ProfileWizard.tsx`: direction-aware step transitions, Back and Next, and Done on the last step linking to `/`.
- `components/profile/ProfileWizard.tsx`: the same component is the first-run wizard and the revisit view, so there is no separate edit mode.
- `components/ui/Tile.tsx`: tiles are `<button aria-pressed>` with a visible check, an icon from the catalog, the label, the optional flavor cue and the description available.
- `lib/catalog/index.ts`: the vocabulary (32 cuisines, 22 flavors, 7 presentations, 8 health profiles, 12 diet absolutes, 20 cookware items) and its keys are untouched by the restyle.

### Inspirations

- `components/inspirations/InspirationForm.tsx`: dish (required), restaurant, city, notes, photo picker with preview and remove, direct-to-storage upload, and "Save and research".
- `components/inspirations/InspirationList.tsx`: sticky form beside the list, list rows with photo, dish, restaurant, city, cuisine plus ingredient count, and the status badge, polling every 4 seconds while any item is live.
- `components/inspirations/StatusBadge.tsx`: five statuses (queued, researching, researched, stale, failed) with a spinner while live and distinct colors for done, failed and stale.
- `components/inspirations/InspirationDetail.tsx`: restaurant verified and dish verified indicators, the restaurant summary, the menu quote as a blockquote, the photo observations, flavor notes, techniques, caveats and sources with external links.
- `components/inspirations/InspirationDetail.tsx`: the ingredient list with role, note, a confidence bar and the provenance label (Verified, Inferred, "You said so").
- `components/inspirations/InspirationDetail.tsx`: the corrections editor (name and note per row, add, remove, Save disabled until dirty) and the guarantee that the poller never overwrites in-progress edits.
- `components/inspirations/InspirationDetail.tsx`: "Re-analyze with my corrections", "Research again from scratch", "Cook this at home" and "Delete inspiration", all disabled while busy or live.

### Generator, history, instructions, settings

- `components/generator/Generator.tsx`: prompt textarea, draft count 1 to 6, Generate disabled under three characters or while a run is live, and resuming an unfinished generator run on load with its prompt restored.
- `components/generator/Generator.tsx`: five status messages (queued, generating, rendering with progress, done, failed) and candidate cards with a Keep toggle, the "n of m selected. Unselected drafts are deleted" sentence, and the "Saved n recipes" confirmation with a link.
- `components/history/RunList.tsx`: status dot, trigger label, requested count, truncated prompt, timestamp, task progress, live spinner, and 5 second polling.
- `components/history/RunList.tsx`: expanded row shows the error, produced recipes as links, review outcome, token usage with cache reads and model name, the issue list, and "What the agent was shown" as a collapsible `<pre>`.
- `components/instructions/InstructionComposer.tsx`: the two-tier radiogroup (Preference, Absolute truth) with hints, the context-aware placeholder, Cmd or Ctrl plus Enter to submit, the "Cmd+Enter to send" hint, and the submit disabled when empty.
- `components/instructions/InstructionList.tsx`: truths visually distinct from preferences, inactive rows dimmed, inline edit with save and cancel, Mute and Unmute, Delete, and the "said while viewing a recipe" note.
- `components/instructions/InstructionsPage.tsx`: truths and preferences in separate sections with the one-line explanation of cascade order.
- `components/settings/SettingsForm.tsx`: every control saves on change with optimistic update and rollback, clamped numeric inputs, the autonomous toggle with cadence and hour, "Last run", the ingredient art toggle, the "Changes save as you make them" line and "Run now".
- `components/ui/Toggle.tsx`: `role="switch"` with `aria-checked`.

### Global

- `app/globals.css`: light and dark schemes driven by tokens, so the restyle must land as a token swap plus primitive edits rather than hard-coded colors (Savour's stylesheet hard-codes many hex values and has no dark scheme, so port its palette into the token block).
- `app/globals.css`: the `--seg-*` tokens stay defined in both schemes because the tagged mode and the step facts strip use them.
- `app/globals.css`: primitives live in `@layer components` so utilities can override them, and that must remain true after the port.
- `lib/ai/claude.ts` line 42: the generation prompt asks for every ingredient, equipment, temperature, time, technique and tip to be tagged, and it must not be loosened to fix a rendering problem, since the data is the asset and the rendering is the problem.

## 2. Density diagnosis

### Library page (`app/page.tsx`, `components/recipes/RecipeGrid.tsx`, `components/recipes/RecipeCard.tsx`)

- The toolbar is one row (search, sort select, Favorites chip, Clear) followed by up to four `FilterRow` rows, each a label plus every distinct value in the library as a bordered, bold pill.
- With a mature library that is 20 to 40 pills stacked above the first recipe, all in the same weight as the Favorites toggle, so nothing signals "this is the main filter" versus "this is a rarely used one".
- Every card carries four `.badge` pills above the title (cuisine, dish type, health in accent tint, presentation), so a four-column grid shows sixteen pills per row before a single title is read.
- The health badge uses `--accent-soft` and `--accent`, so every card shows a terracotta element and the accent stops meaning "primary action".
- The card stacks pills, a display title, a two-line summary, a meta line, a rating string of up to five stars, an overlaid heart, an overlaid Draft badge and a hover chat button, which is eight visual systems in a 300px column.
- The cooking banner uses an accent spinner and an accent link, competing with the accent health badges directly beneath it.
- The grid goes to four columns at `xl`, which increases how many of the above are on screen at once.

### Recipe detail (`components/recipes/RecipeDetail.tsx`, `components/recipes/Segment.tsx`, `components/recipes/IngredientRow.tsx`)

- The title block puts five pills above the H1 (cuisine, dish type, health, presentation, difficulty), then the summary, then a meta row, then two buttons, then the rationale box, all stacked under a 3:2 photo, so the title is the fourth thing the eye lands on.
- The Method header places the six-swatch `SegmentLegend` next to the H2, which is itself a row of six colored chips before any step is read.
- Every non-text segment is rendered as a tinted, iconed chip, and the prompt in `lib/ai/claude.ts` guarantees that every ingredient, tool, temperature, time, technique and tip is tagged, so a normal step sentence has four to ten chips in six hues.
- Ingredient chips are the most numerous and the least valuable inside a sentence, because the full ingredient list with quantities sits in the aside immediately to the left.
- Line height is pushed to 1.9 to make room for chip padding, which makes the paragraph look like a form rather than instructions.
- `IngredientRow` colors every quantity in `--seg-ingredient` green, the step chips use the same green, and the inspiration provenance and instruction truths use `--sage`, so three greens carry three unrelated meanings.
- Equipment rows each get a tinted blue icon tile, adding a third tinted system (badges, chips, tiles) to the same viewport.
- The similar column reuses the full `RecipeCard`, so the four-pill badge row repeats in the sidebar while the main column already shows five of the same pills.
- On one detail viewport the page can show terracotta, sage, gold, and all six segment hues, which is nine competing accents.

### Taste profile (`components/profile/ProfileWizard.tsx`, `components/ui/Tile.tsx`)

- Step 1 renders 32 tiles in three columns and each tile has an icon tile, a check ring, a bold label and a description, so the screen holds roughly a hundred lines of small text.
- Step 3 adds the colored cue line under the label, so flavor tiles have two secondary lines of text.
- `.tile-art` is always painted with the item's hue even when inactive, so the grid is a rainbow before the user has chosen anything and selection adds no contrast.
- The left stepper repeats each step's full title plus a count line, which is fine, but the page header above it also repeats "Click any card to switch it on or off", and the footer repeats "Every click is saved instantly", which is three explanations of one behavior.

### Inspiration detail (`components/inspirations/InspirationDetail.tsx`)

- The research card opens with three pills, then prose, a quote, more prose, then two pill groups (flavor notes as neutral badges, techniques in the purple step palette), then caveats and sources, so it is a wall of chips and paragraphs with no hierarchy.
- The ingredient list gives every row a confidence bar and a provenance pill, so ten rows show ten bars and ten pills for information the user only needs when something looks wrong.
- Techniques borrow `--seg-technique`, tying an inspiration attribute to the step tag palette for no reason.

### Instructions and drawer (`components/instructions/*.tsx`, `components/shell/InstructionDrawer.tsx`)

- Each list row shows an icon circle, the body, a meta line and three always-visible action buttons, and the drawer stacks five of these under a composer that itself has two bordered tier cards, so the drawer shows around twenty interactive targets at once.

### Settings (`components/settings/SettingsForm.tsx`)

- Two bordered boxes inside a bordered card inside a modal produce three nested outlines, which is mild but worth flattening while the primitives are being re-cut.

### History (`components/history/RunList.tsx`)

- Dense by design and appropriate for a log, so it needs no change beyond adopting the new type and surface tokens.

## 3. Step segment redesign

This is the centerpiece.
The semantic tagging is the thing the owner loves and the chips are the thing the owner hates, so the goal is to separate the data from the rendering and make the calm rendering the default.

### Options considered

**Option A: prose with quantitative marks only.**
Render every segment as plain text except time and temperature, which become small inline marks.
Ingredient, equipment, technique and tip all disappear into the prose.
Pro: the calmest possible paragraph, and it matches the "at most 2 inline marks per line" test trivially.
Con: it throws away the scannability of technique and equipment, which is exactly the "different things inside the text" the owner said he loves, and tips lose their why-it-matters voice.

**Option B: per-step facts strip with plain prose beneath.**
Each step gets a header strip that lists time, temperature, equipment and technique as small monochrome icon-plus-text facts, and the sentence below is plain prose.
This is exactly Savour's `.cooking-step` plus `.step-tags` layout, so it adopts the target look with no invention.
Pro: the scan question ("what heat, how long, which pan, what motion") is answered at the top of every step without reading, and the prose reads as prose.
Con: on its own it loses the in-sentence location of the tagged phrase, and the strip and the sentence say the same numbers twice.

**Option C: typographic weight only, no boxes.**
Keep every segment in its sentence position but express the kind with type rather than chips: ingredients in medium weight, time and temperature in tabular figures with a colored hair underline, technique in italic, tips in muted color, equipment unstyled.
Pro: preserves in-sentence semantics and needs no new layout.
Con: four simultaneous type treatments in one sentence is the same problem at a lower volume, and italics plus underlines plus weight changes read as a marked-up manuscript.

**Option D: progressive disclosure toggle.**
Ship a calm default and a "Show tags" switch that restores the full chip rendering.
Pro: nothing is lost for the day the user actually wants the annotation.
Con: it is not a design on its own, because the default still has to be good.

### Recommendation: B plus a restrained slice of C, with D as the escape hatch

Adopt the facts strip from Option B as the primary carrier of the semantic tags.
Inside the prose, keep only two inline marks (time and temperature) and one weight change (ingredient), which is the restrained slice of Option C.
Keep the current chip rendering behind a "Show tags" toggle (Option D) so the annotation the owner loves is one click away and nothing in the data model or prompt changes.

### Rendering spec by segment kind (default "calm" mode)

| kind | In the facts strip | In the prose |
| --- | --- | --- |
| `text` | never | plain body text, unchanged concatenation rule from `Segment.tsx` |
| `time` | yes, first, `Timer` glyph plus `value` or `text` | inline mark: tabular figures, weight 600, ink color, 1px underline in `--seg-time` via `text-decoration-color`, `title="Time: 12 min"` |
| `temperature` | yes, second, `Thermometer` glyph plus `value` or `text` | inline mark: same treatment as time but underline in `--seg-temperature`, `title="Temperature: 220C"` |
| `equipment` | yes, third, glyph from `equipmentIcon(value ?? text)` plus text, up to two entries | plain body text, no styling, `title="Equipment"` |
| `technique` | yes, fourth, `Slice` glyph plus `value` or `text`, up to two entries | plain body text, no styling, `title="Technique: sear"` |
| `ingredient` | never (the ingredient list is beside the steps) | weight 500 in ink, no color, no underline, `title="Ingredient"` |
| `tip` | never | inline, `--muted` color, so it reads as a parenthetical aside while staying inside the sentence |

Rules for the strip:

- Facts are derived from the step's segments, deduplicated by `value ?? text` (case-insensitive), and ordered time, temperature, equipment, technique regardless of sentence order.
- If a step has no time segment but `step.duration_minutes` is set, the strip shows that number, and the same fallback applies to `step.temperature`.
- The strip is capped at six facts (one time, one temperature, up to two equipment, up to two technique), and anything beyond the cap is still in the prose and visible in tagged mode.
- A fact is a 13px Lucide glyph in `--muted` followed by 12px text in `--ink`, no background, no border, no pill, separated by 14px gaps, matching Savour's `.step-tags` geometry but without its `#f4f5ed` fill.
- The strip sits directly under the step title and above the prose, and wraps on narrow screens.
- Each fact has a `title` naming its kind and an `aria-label` on the glyph, so the meaning of a glyph is one hover away without a legend.
- A step with zero derivable facts renders no strip and no empty spacing.

Rules for the prose:

- Body text at 15 to 16px with line height 1.7 (down from 1.9, which only existed to fit chips).
- No step sentence has more than two inline marks per rendered line in practice, because only time and temperature qualify and a step rarely has more than one of each.
- The `title` tooltip on every tagged span is kept in both modes, so the full annotation remains discoverable by hover in calm mode.
- The concatenation property is preserved because the prose still renders the complete ordered segment list, the strip is derived data rendered in addition, and the whitespace rule in `Segment.tsx` is untouched.

### Legend and toggle

- Remove `SegmentLegend` from the Method header in calm mode.
- Replace it with a single `chip`-style toggle labelled "Show tags" with `aria-pressed`, placed where the legend is now.
- When the toggle is on, `Segment` renders its current chip treatment for every non-text kind and the six-swatch legend appears as one muted line under the Method header, so tagged mode is the existing UI, not a new one.
- Persist the toggle in `localStorage` under `palate.stepTags` so a user who prefers the annotation gets it on every recipe.
- The toggle lives in `RecipeDetail.tsx` and is passed to `Segment` as `mode: "calm" | "tagged"`, with a new `StepFacts` component (sibling of `Segment` in `components/recipes/Segment.tsx` or a new `components/recipes/StepFacts.tsx`) deriving the strip.
- `SEGMENT_STYLES` in `lib/icons.ts` remains the single source of glyph and color for both the strip and tagged mode.

### Related calm-downs in the same viewport

- `IngredientRow.tsx`: quantities in ink, not `--seg-ingredient`, so green means nothing in the aside.
- `RecipeDetail.tsx` equipment section: glyph in `--muted` with no tinted tile, rendered as Savour's `.tags` row rather than a vertical list.
- The step number keeps a filled circle in ink, because it is the only anchor that must be loud in the Method section.

### ASCII mockup of one step in the recommended treatment

```
 (3)  Sear the thighs
      ⏱ 6 min   🌡 high heat   🍳 cast iron skillet   ✂ sear

      Lay the chicken thighs skin side down in the hot cast iron skillet
      and leave them alone for 6 min, until the skin releases on its own,
      then flip and sear the other side for 2 min. Resist moving them
      early, the skin only crisps once the fat has rendered.
```

Reading key for the mockup: "chicken thighs" is weight 500, "6 min" and "2 min" are tabular with a gold hair underline, "high heat" carries a terracotta hair underline, "cast iron skillet" and "sear" are plain, and the final clause is a tip in muted color.
The glyphs in the strip are 13px Lucide icons (`Timer`, `Thermometer`, `Container`, `Slice`) drawn from `SEGMENT_STYLES` and `equipmentIcon`, shown here as emoji only because this is plain text.

## 4. Card and grid calm-down

### The card

- Show exactly two taxonomy values on the card as a single eyebrow line, "Cuisine · Dish type", set as Savour's `small` caps eyebrow, replacing the four-pill row in `RecipeCard.tsx`.
- Health profile and presentation leave the card, and they remain reachable through the filter popover and the detail page stats strip.
- Keep the favorite heart overlay and the Draft badge, because they are state, not taxonomy.
- Keep title, two-line summary, and a meta row with minutes and servings, and collapse the rating from a string of stars to one star glyph plus the number ("★ 4") at the end of the meta row.
- Move the chat button into the meta row, right-aligned, as Savour's `.card-chat` does, so it never overlaps the summary and has a predictable place.
- Keep the hover reveal (`group-hover:opacity-100`) and keyboard reveal (`focus:opacity-100`), and add `@media (hover: none) { .card-chat { opacity: 1 } }` so touch users are not locked out of the affordance.
- Keep the `aria-label` and `title` on the chat button naming the recipe.
- The grid stops at three columns (`lg:grid-cols-3`), matching Savour's `.grid`, which lowers on-screen density and gives the photo room.

### Filters

- One toolbar row: search on the left, then a "Filters" button with a count pill ("Filters · 2") that opens a popover, then the sort select, then the Favorites toggle.
- The popover contains the four groups (Cuisine, Dish, Health, Look) as chip rows with the same single-select and click-again-to-clear semantics from `FilterRow`, so nothing about `RecipeGrid.tsx`'s filter state changes.
- Active filters render as removable pills in a second row that only exists when at least one filter is set, with the Clear control at its end.
- The vocabulary stays derived from the unfiltered library, and the popover groups are hidden when their vocabulary is empty, exactly as `FilterRow` returns `null` today.
- Do not use Savour's fixed-list chips ("Quick & easy", "Comfort food"), because those are hard-coded taxonomies that Palate's derived vocabulary makes unnecessary.
- Savour's cuisine `<select>` is an acceptable alternative for cuisine alone if the popover is too much work, but health and presentation must still be reachable.

### Cooking banner, generator candidates, similar column

- The cooking banner becomes a single muted line under the toolbar with a muted spinner, keeping the three messages, the progress count and the Details link.
- Generator candidate cards keep the Keep toggle in the top-left of the image (`Generator.tsx`), which now has room because the badge row is gone.
- The similar column on the detail page uses a compact row (thumbnail, title, "Cuisine · N min") in the style of Savour's `.related-card` instead of a full `RecipeCard`, with the Generate similar button beneath, so pills never repeat in the sidebar.

## 5. Detail page hierarchy

Reading order, top to bottom, with loudness:

1. Back link, quiet.
2. Eyebrow "Cuisine / Dish type", quiet, as Savour's `.eyebrow`.
3. Title, loud, display face at Savour's `.detail-heading h1` scale.
4. Poetic summary, medium, one paragraph at `.intro` size.
5. Favorite and "Tell the agent" actions, medium, right of the title on wide screens (Savour's `.round` for favorite, a text button for the agent).
6. Photo and thumbnail gallery, loud, full column width.
7. Stats strip, quiet, in the style of Savour's `.recipe-stats`: active minutes, total minutes, servings, difficulty, plus health profile and presentation as two more text cells, so all five taxonomy values are on the page without a single pill.
8. Rationale disclosure, quiet, as Savour's `.why` details block, closed by default, still with `aria-expanded`.
9. Ingredients section card, medium, with the serving scaler in its header exactly as today and the illustrated rows.
10. Equipment as a quiet single row of glyph-plus-name inside the Ingredients card footer, styled like Savour's `.tags`, with optional items in `--muted`.
11. Method section card, medium, with the "Show tags" toggle in its header and the steps from section 3.
12. Feedback section card, quiet header, five stars in gold at a smaller size, the textarea and the Save button, placed last in the main column so it is reached after cooking.
13. Similar column, quiet, sticky at `top-20` on `lg` and above as today, with compact rows.

Sticky behaviors to keep or add:

- The similar column stays `lg:sticky lg:top-20 lg:self-start`.
- The top bar stays sticky and translucent, and nothing else is sticky, so the page never has two competing sticky regions.

Where the feedback block goes:

- At the end of the main column, after Method, as the last section card, because feedback is written after cooking and should not interrupt the ingredient-to-method flow.
- Savour's "Leave a note" aside can be adopted as a small quiet call to action in the similar column that opens the drawer with recipe context, which is a second entry to the existing "Tell the agent" behavior, not a new one.

## 6. Wizard and forms

### Tiles

- `Tile.tsx` stays a `<button aria-pressed>` with the check indicator, but the check moves to the top-right corner as Savour's `.choice-check` and only renders when active.
- Inactive tiles lose their hue: `.tile-art` background becomes `--surface-2` and the glyph `--muted`, and the hue paints only the active state (`data-active="true"`), so selection is the only color on the grid.
- Each tile shows the label plus one secondary line: the cue for flavor tiles, and the description for everything else, clamped to one line with `line-clamp-1` and the full description in a `title` tooltip.
- On `:hover` and `:focus-visible` the clamp is released so the full description shows for the tile under the pointer, and active tiles always show the full description.
- Descriptions in `lib/catalog/index.ts` are already one short sentence, so the clamp rarely truncates on desktop and mostly matters at two-column widths.
- Steps 2 (avoid) and 7 (cookware) use a compact tile (glyph plus label, no description) in the style of Savour's `.choice.compact`, because the user has just read the cuisine descriptions in step 1 and cookware names are self-explanatory.
- The grid goes to four columns at `xl` (`xl:grid-cols-4`), matching Savour's `.choice-grid`, and the tile art shrinks from 48px to 40px.

### Stepper

- The stepper becomes a horizontal row at the top at all widths, in the style of Savour's `.wizard-steps`, freeing the left column so tiles get the full width.
- Each stepper item keeps the numbered circle that turns into a check when the step has selections, and shows a small count next to the label ("Cuisines 6"), so the "N selected" information survives in fewer words.
- Every stepper item stays clickable to jump directly to that step.
- The page header description in `app/profile/page.tsx` shrinks to one sentence, and the footer status becomes "Saved · 23 preferences" with the spinner replacing the dot while pending, so the instant-save promise is stated once.
- Back, Next and Done stay in the footer as they are.

### Forms

- `SettingsForm.tsx` drops the two nested bordered boxes and uses headings ("Autonomous runs", "Ingredient illustrations") with a hairline separator, keeping save-on-change, the toggles, the "Last run" line and the status line.
- `InstructionComposer.tsx` keeps the tier radiogroup but styles it as Savour's `.tier-options` (two flat options with a filled active state), keeps the Cmd+Enter hint, and keeps the context-aware placeholder.
- `InstructionList.tsx` shows the Edit, Mute and Delete controls on hover and focus-within of the row (always visible on touch via `@media (hover: none)`), and the row's meta line stays.
- `InspirationDetail.tsx` moves the confidence bar and provenance pill into a hover reveal per row and shows a single small provenance glyph by default (check for verified, tilde for inferred, pencil for user provided) with the label in `title`, so the list reads as a list first.
- `InspirationDetail.tsx` techniques use the neutral badge, not `--seg-technique`.

## 7. Acceptance checklist

Verify each of these in the browser after the restyle, on the local Supabase stack with at least one generated recipe.

1. On `/recipes/[id]` a step sentence reads as continuous prose, and no rendered line contains more than two inline marks (underlined time or temperature phrases).
2. On `/recipes/[id]` every step with a tagged time, temperature, equipment or technique shows a facts strip under its title, in the order time, temperature, equipment, technique, with no background fills.
3. Hovering any tagged phrase in a step shows a tooltip naming its kind and value (for example "Time: 12 min").
4. Clicking "Show tags" in the Method header restores colored chips for every non-text segment, shows the six-swatch legend, and the choice survives a reload.
5. With "Show tags" off, no segment legend is visible anywhere on the detail page.
6. Concatenating the visible step text in reading order yields the same sentence in both modes, with punctuation hugging the preceding phrase.
7. A recipe card in the library shows exactly one eyebrow line for cuisine and dish type and zero pill badges, while the favorite heart and Draft badge still appear when applicable.
8. Hovering a recipe card reveals the chat icon in the meta row, tabbing to it reveals it too, and clicking it opens the drawer with the header "About "{recipe title}"".
9. The library toolbar is one row (search, Filters, sort, Favorites), and the Filters popover offers only values that exist in the library.
10. Selecting a cuisine filter shows it as a removable pill in an active-filters row, clicking it again in the popover clears it, and Clear removes everything including the search text.
11. While a run is live the library shows the cooking line with the correct message and progress count, and new recipes appear without a manual refresh.
12. On `/recipes/[id]` the reading order is title, summary, photo, stats strip, rationale, ingredients, method, feedback, and the stats strip contains active minutes, total minutes, servings, difficulty, health profile and presentation as text.
13. The rationale disclosure is closed by default, toggles with `aria-expanded`, and reveals the full rationale text.
14. Pressing plus or minus in the Ingredients header rescales every quantity, shows fractions for non-integers, and never goes below a quarter of the original servings.
15. Ingredient quantities are in the ink color, and the equipment row uses muted glyphs with no tinted tiles.
16. The similar column uses compact rows (thumbnail, title, cuisine and minutes) with no pills, stays sticky on wide screens, and the Generate similar button opens the axes modal with taste and cuisine preselected.
17. Rating a recipe, clicking the same star again to clear it, and saving feedback all persist across a reload, and the Save button is disabled until the text changes.
18. On `/profile` the stepper is a horizontal row, each step is clickable, and a step with selections shows a check and a count.
19. On `/profile` inactive tiles are neutral (no hue) and only active tiles are colored, and clicking a tile toggles it with the change persisted after a reload.
20. On `/profile` step 1 tiles show the label plus one clamped line, the full description appears on hover and focus, and steps 2 and 7 show compact glyph-plus-label tiles.
21. On `/profile` step 3 shows only flavors derived from loved cuisines, and shows the empty hint when no cuisine is loved.
22. In the instruction drawer, Cmd+Enter (or Ctrl+Enter) submits, the new instruction appears at the top of the list, and the tier radiogroup and Edit, Mute and Delete controls work on each row.
23. In Settings, changing any control shows the "Saving" indicator and the value persists after closing and reopening the modal, and "Run now" closes the modal and lands on the library with the cooking line visible.
24. On `/inspirations/[id]` each ingredient row shows a provenance glyph by default, and hovering the row reveals the confidence bar and the provenance label.
25. Toggling the OS to dark mode leaves every screen readable, including the underline colors on time and temperature marks and the facts strip glyphs.
