import { PageHeader } from "@/components/ui/PageHeader";
import { RecipeGrid } from "@/components/recipes/RecipeGrid";

export default function RecipesPage() {
  return (
    <main className="mx-auto max-w-[90rem] px-[5%] py-12">
      <PageHeader eyebrow="A little inspiration, made personal" title="Good food." titleEm="Your kind of good." description="Everything the agent has cooked up for you, shaped by your taste. A little familiar. A little unexpected. Entirely you." />
      <RecipeGrid />
    </main>
  );
}
