import { PageHeader } from "@/components/ui/PageHeader";
import { InspirationList } from "@/components/inspirations/InspirationList";

export const metadata = { title: "Inspirations" };

export default function InspirationsPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader
        eyebrow="Out in the world"
        title="Inspirations"
        description="Dishes you loved at restaurants. The agent researches each one, works out what was in it, and learns from your corrections."
      />
      <InspirationList />
    </main>
  );
}
