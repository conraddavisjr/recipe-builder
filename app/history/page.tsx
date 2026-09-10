import { PageHeader } from "@/components/ui/PageHeader";
import { RunList } from "@/components/history/RunList";

export const metadata = { title: "History" };

export default function HistoryPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <PageHeader
        eyebrow="Runs"
        title="History"
        description="Every batch the agent has produced, with its status, what it made, and exactly what it was shown when it decided."
      />
      <RunList />
    </main>
  );
}
