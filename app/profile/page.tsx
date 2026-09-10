import { PageHeader } from "@/components/ui/PageHeader";
import { ProfileWizard } from "@/components/profile/ProfileWizard";

export const metadata = { title: "Taste profile" };

export default function ProfilePage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader
        eyebrow="Profile"
        title="Your taste profile"
        description="Walk through once, then come back any time. Click any card to switch it on or off; the agent reads the current state before every run."
      />
      <ProfileWizard />
    </main>
  );
}
