/**
 * Static preference catalog shown by the profile wizard.
 *
 * Everything the user can toggle lives here so the wizard, the "revisit" view,
 * the recipe filters and the model context all read the same vocabulary.
 * Keys are stable identifiers stored in profile_selections.key; labels and
 * descriptions can change freely.
 */

export interface CatalogItem {
  key: string;
  label: string;
  description: string;
  /** Name of an icon in lib/icons.ts (kept as a string so this file stays server-safe). */
  icon: string;
  /** Tailwind-free accent, used for the illustrated tile background. */
  hue: number;
}

export interface FlavorProfile extends CatalogItem {
  /** Short sensory cue shown under the label, e.g. "bright, sharp, mouth-watering". */
  cue: string;
}

export interface Cuisine extends CatalogItem {
  /** Flavor profile keys typical of the cuisine, in rough order of prominence. */
  flavors: string[];
}

export const FLAVORS: FlavorProfile[] = [
  { key: "umami", label: "Umami depth", cue: "savory, brothy, satisfying", description: "The deep savory note of aged, fermented or slow-cooked things: miso, parmesan, soy, mushrooms, stock.", icon: "Soup", hue: 28 },
  { key: "bright_acid", label: "Bright acidity", cue: "sharp, citrusy, mouth-watering", description: "Lime, vinegar, tamarind and sour fruit lifting a dish and cutting through richness.", icon: "Citrus", hue: 52 },
  { key: "chili_heat", label: "Chili heat", cue: "warming to fiery", description: "Fresh or dried chilies, chili oils and pastes, from a gentle glow to a real burn.", icon: "Flame", hue: 8 },
  { key: "aromatic_spice", label: "Warm aromatic spice", cue: "cumin, cinnamon, cardamom", description: "Toasted whole and ground spices that perfume a dish rather than burn.", icon: "Sparkles", hue: 32 },
  { key: "fresh_herb", label: "Fresh herbs", cue: "green, grassy, perfumed", description: "Handfuls of cilantro, basil, mint, dill or parsley added at the end for lift.", icon: "Leaf", hue: 110 },
  { key: "smoke_char", label: "Smoke and char", cue: "grilled, blistered, wood-fired", description: "Flavor from fire: charred edges, smoky paprika, grilled peppers, wood ovens.", icon: "Heater", hue: 18 },
  { key: "rich_butter", label: "Butter and cream", cue: "silky, rich, rounded", description: "Emulsified sauces, browned butter, cream reductions and the comfort they bring.", icon: "Milk", hue: 44 },
  { key: "sweet_savory", label: "Sweet meets savory", cue: "glazed, caramelized, balanced", description: "Honey, palm sugar, mirin or fruit balanced against salt and acid.", icon: "Candy", hue: 340 },
  { key: "fermented_funk", label: "Fermented funk", cue: "tangy, pungent, alive", description: "Kimchi, fish sauce, shrimp paste, aged cheese and sourdough tang.", icon: "Blend", hue: 300 },
  { key: "garlic_allium", label: "Garlic and alliums", cue: "pungent, sweet when cooked", description: "Garlic, shallots, leeks and onions as the backbone of a dish.", icon: "Sprout", hue: 70 },
  { key: "nutty_toasted", label: "Nutty and toasted", cue: "sesame, browned, roasted", description: "Toasted nuts and seeds, tahini, brown butter and roasted grains.", icon: "Nut", hue: 36 },
  { key: "seafood_brine", label: "Sea and brine", cue: "clean, mineral, oceanic", description: "Shellfish, cured fish, seaweed and the saline snap of the sea.", icon: "Fish", hue: 200 },
  { key: "earthy_root", label: "Earthy and rooted", cue: "mushroom, beet, lentil", description: "Root vegetables, legumes, mushrooms and grains with a grounded flavor.", icon: "Mountain", hue: 24 },
  { key: "tomato_sun", label: "Sun-ripened tomato", cue: "sweet, tangy, cooked-down", description: "Tomato in every form: raw and bright, slow-simmered, roasted or sun-dried.", icon: "Sun", hue: 12 },
  { key: "coconut_tropical", label: "Coconut and tropical", cue: "creamy, sweet, floral", description: "Coconut milk, pineapple, mango and lemongrass in curries and salads.", icon: "Cloud", hue: 160 },
  { key: "pickled_tang", label: "Pickled tang", cue: "crunchy, sour, refreshing", description: "Quick pickles, preserved lemon and vinegared vegetables as contrast.", icon: "Droplets", hue: 84 },
  { key: "bitter_greens", label: "Bitter edge", cue: "radicchio, charred, coffee", description: "Deliberate bitterness from greens, char, cocoa or citrus peel that keeps a dish honest.", icon: "Feather", hue: 130 },
  { key: "slow_braise", label: "Slow-braised depth", cue: "falling apart, glossy", description: "Hours of gentle heat turning tough cuts and beans into something glossy and deep.", icon: "CookingPot", hue: 20 },
  { key: "crisp_fried", label: "Crisp and fried", cue: "shattering, golden", description: "Tempura, katsu, fritters and skin rendered to glass.", icon: "Popcorn", hue: 46 },
  { key: "floral_delicate", label: "Floral and delicate", cue: "rose, saffron, orange blossom", description: "Subtle perfumed notes that lift rice, pastry and sweets.", icon: "Flower", hue: 320 },
  { key: "cheese_aged", label: "Aged cheese", cue: "salty, crystalline, sharp", description: "Parmesan, pecorino, manchego and feta as a finishing punctuation.", icon: "Torus", hue: 48 },
  { key: "raw_clean", label: "Raw and clean", cue: "crunchy, cold, unadorned", description: "Crudo, ceviche, salads and dishes that taste of the ingredient itself.", icon: "Snowflake", hue: 190 },
];

export const CUISINES: Cuisine[] = [
  { key: "japanese", label: "Japanese", description: "Precision, seasonality and dashi-driven umami.", icon: "Fish", hue: 350, flavors: ["umami", "seafood_brine", "fermented_funk", "raw_clean", "crisp_fried", "sweet_savory"] },
  { key: "korean", label: "Korean", description: "Fermented heat, grilled meats and banchan variety.", icon: "Flame", hue: 4, flavors: ["fermented_funk", "chili_heat", "garlic_allium", "smoke_char", "sweet_savory", "pickled_tang"] },
  { key: "chinese_sichuan", label: "Sichuan", description: "Numbing peppercorn, chili oil and bold aromatics.", icon: "Zap", hue: 10, flavors: ["chili_heat", "aromatic_spice", "garlic_allium", "umami", "nutty_toasted"] },
  { key: "chinese_cantonese", label: "Cantonese", description: "Clean flavors, wok breath, roasted meats and dim sum.", icon: "Soup", hue: 30, flavors: ["umami", "smoke_char", "seafood_brine", "garlic_allium", "sweet_savory"] },
  { key: "thai", label: "Thai", description: "Hot, sour, sweet and salty in constant balance.", icon: "Citrus", hue: 60, flavors: ["bright_acid", "chili_heat", "coconut_tropical", "fresh_herb", "sweet_savory", "fermented_funk"] },
  { key: "vietnamese", label: "Vietnamese", description: "Fresh herbs, light broths and fish-sauce brightness.", icon: "Leaf", hue: 120, flavors: ["fresh_herb", "bright_acid", "umami", "pickled_tang", "seafood_brine"] },
  { key: "indian_north", label: "North Indian", description: "Tandoor, ghee, cream and layered garam masala.", icon: "Sparkles", hue: 34, flavors: ["aromatic_spice", "rich_butter", "smoke_char", "garlic_allium", "slow_braise"] },
  { key: "indian_south", label: "South Indian", description: "Curry leaf, coconut, tamarind and fermented batters.", icon: "Cloud", hue: 150, flavors: ["aromatic_spice", "coconut_tropical", "bright_acid", "fermented_funk", "chili_heat"] },
  { key: "middle_eastern", label: "Middle Eastern", description: "Grilled meats, tahini, sumac and pomegranate.", icon: "Amphora", hue: 26, flavors: ["nutty_toasted", "smoke_char", "bright_acid", "aromatic_spice", "fresh_herb"] },
  { key: "north_african", label: "North African", description: "Tagines, preserved lemon, harissa and couscous.", icon: "Sun", hue: 22, flavors: ["aromatic_spice", "slow_braise", "pickled_tang", "chili_heat", "sweet_savory"] },
  { key: "italian", label: "Italian", description: "Few ingredients, treated with respect.", icon: "Pizza", hue: 14, flavors: ["tomato_sun", "cheese_aged", "garlic_allium", "fresh_herb", "bitter_greens", "slow_braise"] },
  { key: "french", label: "French", description: "Technique, stock, butter and sauce.", icon: "Croissant", hue: 42, flavors: ["rich_butter", "slow_braise", "garlic_allium", "cheese_aged", "earthy_root"] },
  { key: "spanish", label: "Spanish", description: "Smoked paprika, olive oil, seafood and rice.", icon: "Shrimp", hue: 16, flavors: ["smoke_char", "seafood_brine", "garlic_allium", "tomato_sun", "cheese_aged"] },
  { key: "greek", label: "Greek", description: "Lemon, oregano, olive oil and feta.", icon: "Torus", hue: 210, flavors: ["bright_acid", "fresh_herb", "cheese_aged", "smoke_char", "raw_clean"] },
  { key: "mexican", label: "Mexican", description: "Dried chilies, masa, lime and charred salsa.", icon: "Flame", hue: 6, flavors: ["chili_heat", "smoke_char", "bright_acid", "fresh_herb", "earthy_root", "slow_braise"] },
  { key: "tex_mex", label: "Tex-Mex", description: "Smoky, cheesy, generous border cooking.", icon: "Beef", hue: 20, flavors: ["smoke_char", "chili_heat", "cheese_aged", "rich_butter"] },
  { key: "peruvian", label: "Peruvian", description: "Ceviche, aji peppers and Japanese influence.", icon: "Citrus", hue: 56, flavors: ["raw_clean", "bright_acid", "chili_heat", "seafood_brine", "earthy_root"] },
  { key: "brazilian", label: "Brazilian", description: "Churrasco, black beans, coconut and lime.", icon: "Drumstick", hue: 100, flavors: ["smoke_char", "slow_braise", "coconut_tropical", "bright_acid"] },
  { key: "caribbean", label: "Caribbean", description: "Jerk spice, scotch bonnet, plantain and rice.", icon: "Banana", hue: 48, flavors: ["chili_heat", "aromatic_spice", "smoke_char", "coconut_tropical", "sweet_savory"] },
  { key: "american_south", label: "Southern US", description: "Fried chicken, greens, cornbread and smoke.", icon: "Ham", hue: 24, flavors: ["crisp_fried", "smoke_char", "rich_butter", "slow_braise", "sweet_savory"] },
  { key: "american_bbq", label: "American BBQ", description: "Low and slow over wood, with bark and sauce.", icon: "Heater", hue: 12, flavors: ["smoke_char", "slow_braise", "sweet_savory", "chili_heat"] },
  { key: "american_diner", label: "American comfort", description: "Burgers, mac and cheese, pot pie, pancakes.", icon: "Sandwich", hue: 38, flavors: ["rich_butter", "cheese_aged", "crisp_fried", "sweet_savory"] },
  { key: "cajun_creole", label: "Cajun and Creole", description: "Roux, the trinity, seafood and heat.", icon: "Shrimp", hue: 18, flavors: ["slow_braise", "chili_heat", "seafood_brine", "smoke_char", "aromatic_spice"] },
  { key: "ethiopian", label: "Ethiopian", description: "Berbere, injera and slow-cooked wats.", icon: "Sun", hue: 28, flavors: ["aromatic_spice", "chili_heat", "slow_braise", "fermented_funk", "earthy_root"] },
  { key: "west_african", label: "West African", description: "Jollof, groundnut stew, scotch bonnet and smoke.", icon: "Bean", hue: 30, flavors: ["chili_heat", "tomato_sun", "nutty_toasted", "slow_braise", "smoke_char"] },
  { key: "turkish", label: "Turkish", description: "Kebabs, pide, yogurt and pepper paste.", icon: "Flame", hue: 2, flavors: ["smoke_char", "aromatic_spice", "fresh_herb", "rich_butter", "pickled_tang"] },
  { key: "persian", label: "Persian", description: "Saffron rice, herbs, dried lime and pomegranate.", icon: "Flower", hue: 330, flavors: ["floral_delicate", "fresh_herb", "bright_acid", "nutty_toasted", "slow_braise"] },
  { key: "british", label: "British", description: "Roasts, pies, puddings and proper gravy.", icon: "CookingPot", hue: 200, flavors: ["slow_braise", "rich_butter", "earthy_root", "crisp_fried"] },
  { key: "german_central", label: "German and Central European", description: "Sausage, schnitzel, kraut and dumplings.", icon: "Beer", hue: 40, flavors: ["crisp_fried", "pickled_tang", "earthy_root", "rich_butter"] },
  { key: "scandinavian", label: "Scandinavian", description: "Cured fish, rye, dill and foraged sourness.", icon: "Snowflake", hue: 205, flavors: ["seafood_brine", "pickled_tang", "fresh_herb", "raw_clean", "earthy_root"] },
  { key: "filipino", label: "Filipino", description: "Adobo sourness, sweet-savory glazes and comfort.", icon: "Sun", hue: 44, flavors: ["bright_acid", "sweet_savory", "garlic_allium", "slow_braise", "coconut_tropical"] },
  { key: "indonesian_malay", label: "Indonesian and Malaysian", description: "Sambal, rendang, satay and coconut.", icon: "Cloud", hue: 140, flavors: ["chili_heat", "coconut_tropical", "sweet_savory", "nutty_toasted", "aromatic_spice"] },
];

export const PRESENTATIONS: CatalogItem[] = [
  { key: "refined", label: "Refined", description: "Composed plates, negative space, careful sauce work.", icon: "Sparkles", hue: 260 },
  { key: "rustic", label: "Rustic", description: "Sharing platters, crusty edges, served in the pan.", icon: "Wheat", hue: 32 },
  { key: "comfort", label: "Comfort", description: "Bowls, generous portions, melted and gooey.", icon: "Soup", hue: 24 },
  { key: "vibrant", label: "Vibrant", description: "Color-forward, fresh herbs, contrast on the plate.", icon: "Palette", hue: 320 },
  { key: "minimal", label: "Minimal", description: "Two or three ingredients shown off plainly.", icon: "Layers", hue: 190 },
  { key: "family_style", label: "Family style", description: "Big bowls to pass, everyone builds their own plate.", icon: "UtensilsCrossed", hue: 48 },
  { key: "street", label: "Street food", description: "Handheld, wrapped in paper, eaten standing up.", icon: "Sandwich", hue: 14 },
];

export const HEALTH_PROFILES: CatalogItem[] = [
  { key: "decadent", label: "Decadent", description: "Butter, cream, cheese and no apologies.", icon: "Cake", hue: 340 },
  { key: "balanced", label: "Balanced", description: "Protein, vegetables and a starch in sane proportions.", icon: "Scale", hue: 150 },
  { key: "light_fresh", label: "Light and fresh", description: "Salads, broths, grilled fish; leaves you energized.", icon: "Leaf", hue: 110 },
  { key: "raw", label: "Raw", description: "Crudo, ceviche, slaws and uncooked bowls.", icon: "Snowflake", hue: 195 },
  { key: "high_protein", label: "High protein", description: "Built around a serious protein portion.", icon: "Dumbbell", hue: 220 },
  { key: "plant_forward", label: "Plant forward", description: "Vegetables lead; meat is a seasoning if present.", icon: "Sprout", hue: 90 },
  { key: "low_carb", label: "Low carb", description: "Skips the bread, rice and pasta.", icon: "Activity", hue: 250 },
  { key: "hearty_fuel", label: "Hearty fuel", description: "Big, warming, carb-rich plates for hungry days.", icon: "HeartPulse", hue: 20 },
];

export const DIET_ABSOLUTES: CatalogItem[] = [
  { key: "vegetarian", label: "Vegetarian", description: "No meat, poultry or fish, ever.", icon: "Leaf", hue: 110 },
  { key: "vegan", label: "Vegan", description: "No animal products of any kind.", icon: "Vegan", hue: 120 },
  { key: "pescatarian", label: "Pescatarian", description: "Fish and seafood, but no meat or poultry.", icon: "Fish", hue: 200 },
  { key: "no_pork", label: "No pork", description: "Never pork or pork products.", icon: "Ban", hue: 0 },
  { key: "no_beef", label: "No beef", description: "Never beef.", icon: "Ban", hue: 10 },
  { key: "no_shellfish", label: "No shellfish", description: "Never shrimp, crab, lobster or molluscs.", icon: "Ban", hue: 20 },
  { key: "nut_free", label: "Nut free", description: "No tree nuts or peanuts anywhere in the recipe.", icon: "ShieldCheck", hue: 36 },
  { key: "dairy_free", label: "Dairy free", description: "No milk, butter, cream or cheese.", icon: "ShieldCheck", hue: 44 },
  { key: "gluten_free", label: "Gluten free", description: "No wheat, barley, rye or hidden gluten.", icon: "ShieldCheck", hue: 52 },
  { key: "no_alcohol", label: "No alcohol", description: "No wine, beer or spirits in cooking.", icon: "Ban", hue: 280 },
  { key: "halal", label: "Halal", description: "Halal ingredients and methods only.", icon: "ShieldCheck", hue: 140 },
  { key: "kosher", label: "Kosher", description: "Kosher ingredients and pairings only.", icon: "ShieldCheck", hue: 230 },
  {
    key: "pregnancy_safe",
    label: "Pregnancy safe",
    description:
      "Every recipe must be safe in pregnancy: no raw or undercooked eggs (no jammy, soft-boiled, runny or poached eggs, no homemade mayonnaise, aioli or hollandaise); no raw or undercooked meat, poultry or fish (no sushi, sashimi, crudo, ceviche, tartare, carpaccio, rare steak); fish cooked through and only low-mercury species (no swordfish, king mackerel, tilefish, shark, marlin or bigeye tuna); no unpasteurized milk, juice or cheese and no soft or blue cheeses unless cooked until bubbling; no cured or deli meats unless cooked through; no pâté or liver; no raw sprouts; no alcohol in cooking; limited caffeine.",
    icon: "Baby",
    hue: 330,
  },
];

export const COOKWARE: CatalogItem[] = [
  { key: "conventional_oven", label: "Conventional oven", description: "Roasting, baking, braising.", icon: "Heater", hue: 20 },
  { key: "stovetop_gas", label: "Gas stovetop", description: "Responsive high heat for wok and sear work.", icon: "Flame", hue: 8 },
  { key: "stovetop_induction", label: "Induction or electric stovetop", description: "Steady, precise, no open flame.", icon: "Zap", hue: 220 },
  { key: "cast_iron", label: "Cast iron skillet", description: "Searing, cornbread, oven-to-table.", icon: "Container", hue: 24 },
  { key: "dutch_oven", label: "Dutch oven", description: "Braises, stews, no-knead bread.", icon: "CookingPot", hue: 30 },
  { key: "wok", label: "Wok", description: "Stir-fry with real wok breath.", icon: "Blend", hue: 16 },
  { key: "pizza_oven", label: "Pizza oven", description: "Very high heat for pizza, flatbreads, charred vegetables.", icon: "Pizza", hue: 12 },
  { key: "grill", label: "Outdoor grill", description: "Charcoal or gas, for anything that likes fire.", icon: "Heater", hue: 4 },
  { key: "smoker", label: "Smoker", description: "Low and slow with real wood smoke.", icon: "Cloud", hue: 26 },
  { key: "air_fryer", label: "Air fryer", description: "Fast crisping with little oil.", icon: "Fan", hue: 200 },
  { key: "slow_cooker", label: "Slow cooker", description: "Set-and-forget braises and stews.", icon: "Timer", hue: 40 },
  { key: "pressure_cooker", label: "Pressure cooker or Instant Pot", description: "Beans, stocks and braises in a fraction of the time.", icon: "Gauge", hue: 250 },
  { key: "sous_vide", label: "Sous vide", description: "Precise low-temperature water bath.", icon: "Thermometer", hue: 190 },
  { key: "stand_mixer", label: "Stand mixer", description: "Doughs, meringues and batters without the arm workout.", icon: "RefreshCw", hue: 300 },
  { key: "blender", label: "High-speed blender", description: "Silky soups, sauces and nut milks.", icon: "Blend", hue: 280 },
  { key: "food_processor", label: "Food processor", description: "Pastes, pestos, shredding and pastry.", icon: "Layers", hue: 260 },
  { key: "rice_cooker", label: "Rice cooker", description: "Perfect rice and steamed dishes on autopilot.", icon: "Soup", hue: 50 },
  { key: "mortar_pestle", label: "Mortar and pestle", description: "Curry pastes and spice blends with real texture.", icon: "Amphora", hue: 34 },
  { key: "microwave", label: "Microwave", description: "Steaming, melting, reheating.", icon: "Microwave", hue: 210 },
  { key: "bbq_kamado", label: "Kamado grill", description: "Ceramic egg for grilling, smoking and pizza.", icon: "Torus", hue: 130 },
];

/** Lookup by category, matching profile_selections.category. */
export const CATALOG = {
  cuisine_love: CUISINES,
  cuisine_avoid: CUISINES,
  flavor: FLAVORS,
  presentation: PRESENTATIONS,
  health: HEALTH_PROFILES,
  diet_absolute: DIET_ABSOLUTES,
  cookware: COOKWARE,
} as const;

export type CatalogCategory = keyof typeof CATALOG;

export function findCatalogItem(category: CatalogCategory, key: string): CatalogItem | undefined {
  return (CATALOG[category] as readonly CatalogItem[]).find((item) => item.key === key);
}

/**
 * Flavor profiles implied by a set of loved cuisines, most common first.
 * Drives step 3 of the wizard: the user sees only flavors that are typical of
 * what they already said they love, then emphasizes the ones that matter.
 */
export function flavorsForCuisines(cuisineKeys: string[]): FlavorProfile[] {
  const counts = new Map<string, number>();
  for (const cuisine of CUISINES) {
    if (!cuisineKeys.includes(cuisine.key)) continue;
    cuisine.flavors.forEach((flavor, index) => {
      // Earlier position in a cuisine's list = more characteristic.
      counts.set(flavor, (counts.get(flavor) ?? 0) + (cuisine.flavors.length - index));
    });
  }
  return FLAVORS.filter((f) => counts.has(f.key)).sort(
    (a, b) => (counts.get(b.key) ?? 0) - (counts.get(a.key) ?? 0),
  );
}
