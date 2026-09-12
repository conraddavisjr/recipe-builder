import { GroupDetail } from "@/components/groups/GroupDetail";

export default async function GroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="mx-auto max-w-[90rem] px-[5%] py-12">
      <GroupDetail id={id} />
    </main>
  );
}
