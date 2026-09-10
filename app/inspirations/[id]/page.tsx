import { InspirationDetail } from "@/components/inspirations/InspirationDetail";

export default async function InspirationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <InspirationDetail id={id} />
    </main>
  );
}
