import { PageHeader } from "@/components/ui/PageHeader";
import { InspirationList } from "@/components/inspirations/InspirationList";

export const metadata = { title: "Inspirations" };

export default function InspirationsPage() {
  return (
    <main className="mx-auto max-w-[90rem] px-[5%] py-12">
      <PageHeader
        eyebrow="The meals that stay with you"
        title="A little outside"
        titleEm="inspiration."
        description="That unforgettable restaurant dish. The agent researches it, works out what was in it, and learns from your corrections."
      />
      <InspirationList />
    </main>
  );
}
