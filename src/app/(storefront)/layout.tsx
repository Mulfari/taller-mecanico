import StorefrontNav from "@/components/storefront/StorefrontNav";
import StorefrontFooter from "@/components/storefront/StorefrontFooter";

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#1a1a2e]">
      <StorefrontNav />
      <main className="flex-1">{children}</main>
      <StorefrontFooter />
    </div>
  );
}
