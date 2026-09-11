import {
  Activity, Amphora, Apple, Ban, Bean, Beef, Beer, Blend, Cake, Candy, Cherry, ChefHat,
  Citrus, Cloud, Container, CookingPot, Croissant, Drumstick, Droplets, Dumbbell, Egg,
  Fan, Feather, Fish, Flame, Flower, Gauge, Ham, Heater, HeartPulse, Hourglass, Layers,
  Leaf, Lightbulb, Microwave, Milk, Mountain, Nut, Palette, Pizza, Popcorn, Refrigerator,
  RefreshCw, Salad, Sandwich, Scale, ShieldCheck, Shrimp, Slice, Snowflake, Soup, Sparkles,
  Sprout, Sun, Thermometer, Timer, Torus, UtensilsCrossed, Utensils, Vegan, Wheat, Zap,
  Wine, Coffee, Carrot, Grape, Banana, Wind,
  type LucideIcon,
} from "lucide-react";
import type { SegmentKind } from "@/lib/types";
import { createElement } from "react";
import type { LucideProps } from "lucide-react";
import { Globe, Eye, HeartPulse as HeartPulseIcon, Utensils as UtensilsIcon } from "lucide-react";
import { CUISINES, findCatalogItem } from "@/lib/catalog";

/**
 * Iconography taxonomy.
 *
 * Two jobs: (1) turn the string icon names in lib/catalog into components,
 * and (2) give every tagged recipe segment (ingredient, equipment,
 * temperature, time, technique, tip) a consistent glyph and color so the eye
 * can sort a step at a glance.
 */

export const ICONS: Record<string, LucideIcon> = {
  Activity, Amphora, Apple, Ban, Bean, Beef, Beer, Blend, Cake, Candy, Cherry, ChefHat,
  Citrus, Cloud, Container, CookingPot, Croissant, Drumstick, Droplets, Dumbbell, Egg,
  Fan, Feather, Fish, Flame, Flower, Gauge, Ham, Heater, HeartPulse, Hourglass, Layers,
  Leaf, Lightbulb, Microwave, Milk, Mountain, Nut, Palette, Pizza, Popcorn, Refrigerator,
  RefreshCw, Salad, Sandwich, Scale, ShieldCheck, Shrimp, Slice, Snowflake, Soup, Sparkles,
  Sprout, Sun, Thermometer, Timer, Torus, UtensilsCrossed, Utensils, Vegan, Wheat, Zap,
  Wine, Coffee, Carrot, Grape, Banana, Wind,
};

export function iconByName(name: string): LucideIcon {
  return ICONS[name] ?? Sparkles;
}

export interface SegmentStyle {
  icon: LucideIcon;
  label: string;
  /** CSS custom property names defined in globals.css. */
  fg: string;
  bg: string;
}

/** Visual language for every step segment kind. "text" has no glyph. */
export const SEGMENT_STYLES: Record<Exclude<SegmentKind, "text">, SegmentStyle> = {
  ingredient: { icon: Carrot, label: "Ingredient", fg: "var(--seg-ingredient)", bg: "var(--seg-ingredient-bg)" },
  equipment: { icon: CookingPot, label: "Equipment", fg: "var(--seg-equipment)", bg: "var(--seg-equipment-bg)" },
  temperature: { icon: Thermometer, label: "Temperature", fg: "var(--seg-temperature)", bg: "var(--seg-temperature-bg)" },
  time: { icon: Timer, label: "Time", fg: "var(--seg-time)", bg: "var(--seg-time-bg)" },
  technique: { icon: Slice, label: "Technique", fg: "var(--seg-technique)", bg: "var(--seg-technique-bg)" },
  tip: { icon: Lightbulb, label: "Tip", fg: "var(--seg-tip)", bg: "var(--seg-tip-bg)" },
};

/**
 * Equipment glyphs keyed by the normalized `key` the model emits. Unknown
 * keys fall back to a generic pot; the list grows as real output shows what
 * the model actually names.
 */
const EQUIPMENT_ICONS: Array<[RegExp, LucideIcon]> = [
  [/oven|roast|bake/, Heater],
  [/grill|bbq|barbecue|kamado/, Heater],
  [/wok/, Blend],
  [/skillet|pan|saute|frying/, Container],
  [/dutch|pot|stock|sauce_?pan|braiser/, CookingPot],
  [/pizza/, Pizza],
  [/air_?fryer|fan/, Fan],
  [/slow_?cooker|crock/, Timer],
  [/pressure|instant/, Gauge],
  [/sous|thermometer|probe/, Thermometer],
  [/mixer|whisk/, RefreshCw],
  [/blender|processor/, Blend],
  [/knife|mandoline|peeler|grater|microplane/, Slice],
  [/board/, Layers],
  [/microwave/, Microwave],
  [/fridge|freezer|chill/, Refrigerator],
  [/mortar|pestle/, Amphora],
  [/bowl|colander|sieve|strainer/, Soup],
  [/scale/, Scale],
  [/sheet|tray|rack/, Layers],
  [/torch|flame|burner/, Flame],
];

export function equipmentIcon(key: string): LucideIcon {
  const k = key.toLowerCase();
  for (const [pattern, icon] of EQUIPMENT_ICONS) if (pattern.test(k)) return icon;
  return CookingPot;
}

/** Ingredient glyphs used as the placeholder while illustration art is pending. */
const INGREDIENT_ICONS: Array<[RegExp, LucideIcon]> = [
  [/beef|steak|brisket|lamb|veal/, Beef],
  [/chicken|turkey|duck|poultry|thigh|breast|wing/, Drumstick],
  [/pork|bacon|ham|prosciutto|pancetta|sausage/, Ham],
  [/shrimp|prawn|crab|lobster|scallop|clam|mussel|squid|octopus/, Shrimp],
  [/fish|salmon|tuna|cod|anchov|sardine|trout|halibut|snapper/, Fish],
  [/egg/, Egg],
  [/milk|cream|butter|yogurt|yoghurt|ghee/, Milk],
  [/cheese|parmesan|pecorino|feta|mozzarella|cheddar|ricotta/, Torus],
  [/flour|bread|wheat|pasta|noodle|dough|rice|grain|couscous|barley|oat/, Wheat],
  [/lemon|lime|orange|citrus|grapefruit|yuzu/, Citrus],
  [/apple|pear/, Apple],
  [/cherry|berry|strawberr|raspberr|blueberr/, Cherry],
  [/grape|raisin|wine|vinegar/, Grape],
  [/banana|plantain|mango|pineapple|coconut/, Banana],
  [/carrot|parsnip|beet|radish|turnip|potato|yam|root/, Carrot],
  [/onion|garlic|shallot|leek|scallion|chive/, Sprout],
  [/chili|chile|pepper|paprika|cayenne|harissa|gochujang|sriracha/, Flame],
  [/herb|basil|cilantro|coriander|parsley|mint|dill|thyme|rosemary|oregano|sage|lettuce|spinach|kale|greens|cabbage|arugula/, Leaf],
  [/bean|lentil|chickpea|pea|tofu|edamame|soy/, Bean],
  [/nut|almond|peanut|cashew|walnut|pistachio|sesame|tahini|seed/, Nut],
  [/sugar|honey|syrup|caramel|chocolate|cocoa|vanilla/, Candy],
  [/coffee|espresso|tea/, Coffee],
  [/salt|stock|broth|dashi|miso|soy_sauce|fish_sauce|oil|water/, Droplets],
  [/mushroom|truffle/, Mountain],
  [/tomato/, Sun],
  [/spice|cumin|cinnamon|cardamom|clove|turmeric|curry|masala|za.?atar|sumac|saffron/, Sparkles],
  [/ice|frozen/, Snowflake],
];

export function ingredientIcon(key: string): LucideIcon {
  const k = key.toLowerCase();
  for (const [pattern, icon] of INGREDIENT_ICONS) if (pattern.test(k)) return icon;
  return Salad;
}

export { ChefHat, Utensils, UtensilsCrossed, Wind, Wine, Vegan, Feather, Flower, Cloud, Hourglass, Palette, Sandwich, Croissant, Cake, Beer, Dumbbell, HeartPulse, Activity, Ban, ShieldCheck, Popcorn, Zap, Sun, Snowflake, Nut, Torus, Amphora, Mountain };


/** Render a catalog icon by name without creating a component during render. */
export function CatalogIcon({ name, ...props }: { name: string } & LucideProps) {
  return createElement(iconByName(name), props);
}


/** Glyph for each library filter group. */
export const FILTER_GROUP_ICONS: Record<"cuisine" | "dish_type" | "health_profile" | "presentation", LucideIcon> = {
  cuisine: Globe,
  dish_type: UtensilsIcon,
  health_profile: HeartPulseIcon,
  presentation: Eye,
};

/**
 * Cuisine values on recipes are free text ("Thai", "Modern American / Texas
 * brunch"). Match them to the catalog by label or key stem; fall back to a
 * globe so every option still gets a glyph.
 */
export function cuisineIcon(value: string): LucideIcon {
  const v = value.toLowerCase();
  const hit = CUISINES.find((c) => v.includes(c.label.toLowerCase()) || v.includes(c.key.split("_")[0]));
  return hit ? iconByName(hit.icon) : Globe;
}

const DISH_ICONS: Array<[RegExp, LucideIcon]> = [
  [/soup|broth|stew|hot ?pot|chowder|ramen|pho|nabe|jjigae|curry|braise/, Soup],
  [/pizza|flatbread|pide|calzone/, Pizza],
  [/salad|slaw|crudo|ceviche|poke/, Salad],
  [/sandwich|burger|toast|wrap|taco|burrito|banh ?mi/, Sandwich],
  [/pancake|waffle|crepe|cake|pie|tart|dessert|pudding|cookie|brownie/, Cake],
  [/pastry|croissant|bread|bun|biscuit|scone/, Croissant],
  [/noodle|pasta|rice|bowl|risotto|fried rice|grain|pilaf|congee/, Wheat],
  [/roast|bake|casserole|gratin|sheet ?pan|traybake/, Heater],
  [/grill|skewer|kebab|bbq|barbecue|satay/, Flame],
  [/fish|seafood|shellfish/, Fish],
  [/chicken|poultry|wing/, Drumstick],
  [/steak|beef|lamb|pork|chop|ribs?/, Beef],
  [/egg|omelet|frittata|shakshuka/, Egg],
  [/drink|smoothie|cocktail|tea|coffee/, Coffee],
  [/snack|popcorn|fritter|fried/, Popcorn],
];

/** Glyph for a free-text dish type. */
export function dishTypeIcon(value: string): LucideIcon {
  const v = value.toLowerCase();
  for (const [pattern, icon] of DISH_ICONS) if (pattern.test(v)) return icon;
  return UtensilsIcon;
}

/** Glyph for a filter option, by group. */
export function filterOptionIcon(group: keyof typeof FILTER_GROUP_ICONS, value: string): LucideIcon {
  switch (group) {
    case "cuisine": return cuisineIcon(value);
    case "dish_type": return dishTypeIcon(value);
    case "health_profile": return iconByName(findCatalogItem("health", value)?.icon ?? "HeartPulse");
    case "presentation": return iconByName(findCatalogItem("presentation", value)?.icon ?? "Eye");
  }
}
