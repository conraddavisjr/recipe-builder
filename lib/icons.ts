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

import { createElement } from "react";
import type { LucideProps } from "lucide-react";

/** Render a catalog icon by name without creating a component during render. */
export function CatalogIcon({ name, ...props }: { name: string } & LucideProps) {
  return createElement(iconByName(name), props);
}
