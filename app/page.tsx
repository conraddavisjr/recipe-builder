import { PageHeader } from "@/components/ui/PageHeader";

export default function RecipesPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader eyebrow="Library" title="Recipes" description="Everything the agent has cooked up for you, searchable and filterable." />
      <p className="text-sm text-muted">Recipe grid arrives in chunk 3.</p>
    </main>
  );
}
