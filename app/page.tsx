import { PageHeader } from "@/components/ui/PageHeader";
import { RecipeGrid } from "@/components/recipes/RecipeGrid";

export default function RecipesPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader eyebrow="Library" title="Recipes" description="Everything the agent has cooked up for you, searchable and filterable." />
      <RecipeGrid />
    </main>
  );
}
