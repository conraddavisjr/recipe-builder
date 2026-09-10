import { PageHeader } from "@/components/ui/PageHeader";
import { InstructionsPage } from "@/components/instructions/InstructionsPage";

export const metadata = { title: "Instructions" };

export default function Page() {
  return (
    <main className="mx-auto max-w-[90rem] px-[5%] py-12">
      <PageHeader
        eyebrow="Kitchen notes"
        title="A word with"
        titleEm="your agent."
        description="Everything you have told the agent, in two tiers. Truths are permanent; preferences cascade, newest first."
      />
      <InstructionsPage />
    </main>
  );
}
