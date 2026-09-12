import { PageHeader } from "@/components/ui/PageHeader";
import { GroupList } from "@/components/groups/GroupList";

export const metadata = { title: "Groups" };

export default function GroupsPage() {
  return (
    <main className="mx-auto max-w-[90rem] px-[5%] py-12">
      <PageHeader
        eyebrow="Collections"
        title="A table,"
        titleEm="planned."
        description="Group recipes for an occasion and get one shopping list with the quantities combined."
      />
      <GroupList />
    </main>
  );
}
