import { PageHeader } from "@/components/ui/PageHeader";
import { Generator } from "@/components/generator/Generator";

export const metadata = { title: "Recipe generator" };

export default function GeneratorPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        eyebrow="On demand"
        title="Recipe generator"
        description="Describe a meal or a flavor you want. The agent drafts a few options against your profile; you decide which ones join the library."
      />
      <Generator />
    </main>
  );
}
