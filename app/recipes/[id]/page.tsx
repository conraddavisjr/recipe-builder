import { PageHeader } from "@/components/ui/PageHeader";

export default async function RecipeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader eyebrow="Recipe" title={`Recipe ${id}`} />
      <p className="text-sm text-muted">Detail page arrives in chunk 3.</p>
    </main>
  );
}
