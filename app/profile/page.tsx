import { PageHeader } from "@/components/ui/PageHeader";
import { ProfileWizard } from "@/components/profile/ProfileWizard";

export const metadata = { title: "Taste profile" };

export default function ProfilePage() {
  return (
    <main className="mx-auto max-w-[90rem] px-[5%] py-12">
      <PageHeader
        eyebrow="A recipe for your taste"
        title="Let's get to know"
        titleEm="your kind of good."
        description="A few small choices. Click any card to switch it on or off; revisit these anytime."
      />
      <ProfileWizard />
    </main>
  );
}
