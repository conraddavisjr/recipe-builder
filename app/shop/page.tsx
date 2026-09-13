import { PageHeader } from "@/components/ui/PageHeader";
import { ShopPage } from "@/components/shopping/ShopPage";

export const metadata = { title: "Shopping" };

export default function Page() {
  return (
    <main className="mx-auto max-w-[90rem] px-[5%] py-12">
      <PageHeader
        eyebrow="Groceries"
        title="Gather the dishes."
        titleEm="Let the agent shop."
        description="Add recipes to the cart, press Shop for me, and the agent fills your Whole Foods cart on Amazon. You review and check out."
      />
      <ShopPage />
    </main>
  );
}
