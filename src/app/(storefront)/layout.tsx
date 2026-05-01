import { createClient } from "@/lib/supabase/server";
import StorefrontNav from "@/components/storefront/StorefrontNav";
import StorefrontFooter from "@/components/storefront/StorefrontFooter";

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: config } = await supabase
    .from("shop_config")
    .select("name, logo_url, phone, address, schedule")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const shopName = config?.name || "TallerPro";
  const logoUrl = config?.logo_url || null;
  const phone = config?.phone || null;
  const address = config?.address || null;
  const schedule = config?.schedule || null;

  return (
    <div className="min-h-screen flex flex-col bg-[#1a1a2e]">
      <StorefrontNav shopName={shopName} logoUrl={logoUrl} />
      <main className="flex-1">{children}</main>
      <StorefrontFooter shopName={shopName} phone={phone} address={address} schedule={schedule} />
    </div>
  );
}
