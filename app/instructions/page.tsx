import { PageHeader } from "@/components/ui/PageHeader";
import { InstructionsPage } from "@/components/instructions/InstructionsPage";

export const metadata = { title: "Instructions" };

export default function Page() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader
        eyebrow="Agent"
        title="Instructions"
        description="Everything you have told the agent, in two tiers. Truths are permanent; preferences cascade, newest first."
      />
      <InstructionsPage />
    </main>
  );
}
