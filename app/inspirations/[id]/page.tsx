import { InspirationDetail } from "@/components/inspirations/InspirationDetail";

export default async function InspirationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="mx-auto max-w-[90rem] px-[5%] py-12">
      <InspirationDetail id={id} />
    </main>
  );
}
