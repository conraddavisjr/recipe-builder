import { RecipeDetail } from "@/components/recipes/RecipeDetail";

export default async function RecipeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="mx-auto max-w-[90rem] px-[5%] py-12">
      <RecipeDetail id={id} />
    </main>
  );
}
