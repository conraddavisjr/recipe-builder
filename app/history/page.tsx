import { PageHeader } from "@/components/ui/PageHeader";
import { RunList } from "@/components/history/RunList";

export const metadata = { title: "History" };

export default function HistoryPage() {
  return (
    <main className="mx-auto max-w-[90rem] px-[5%] py-12">
      <PageHeader
        eyebrow="Every run, explained"
        title="What the agent"
        titleEm="was thinking."
        description="Every batch the agent has produced, with its status, what it made, and exactly what it was shown when it decided."
      />
      <RunList />
    </main>
  );
}
