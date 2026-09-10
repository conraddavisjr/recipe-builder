import { PageHeader } from "@/components/ui/PageHeader";
import { Generator } from "@/components/generator/Generator";

export const metadata = { title: "Recipe generator" };

export default function GeneratorPage() {
  return (
    <main className="mx-auto max-w-[90rem] px-[5%] py-12">
      <PageHeader
        eyebrow="On demand"
        title="Tell us the craving."
        titleEm="We'll draft the dish."
        description="Describe a meal or a flavor you want. The agent drafts a few options against your profile; you decide which ones join the library."
      />
      <Generator />
    </main>
  );
}
