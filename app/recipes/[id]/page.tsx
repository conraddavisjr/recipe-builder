import { RecipeDetail } from "@/components/recipes/RecipeDetail";

export default async function RecipeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <RecipeDetail id={id} />
    </main>
  );
}
