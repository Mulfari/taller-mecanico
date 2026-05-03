import { createClient } from "@/lib/supabase/server";
import StorefrontNav from "@/components/storefront/StorefrontNav";
import StorefrontFooter from "@/components/storefront/StorefrontFooter";

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  let shopName = "TallerPro";
  let logoUrl: string | null = null;
  let phone: string | null = null;
  let address: string | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let schedule: any = null;

  try {
    const supabase = await createClient();
    const { data: config } = await supabase
      .from("shop_config")
      .select("name, logo_url, phone, address, schedule")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (config) {
      shopName = config.name || shopName;
      logoUrl = config.logo_url || null;
      phone = config.phone || null;
      address = config.address || null;
      schedule = config.schedule || null;
    }
  } catch {
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#1a1a2e] print:bg-white print:block">
      <div className="print:hidden">
        <StorefrontNav shopName={shopName} logoUrl={logoUrl} />
      </div>
      <main className="flex-1 print:bg-white">{children}</main>
      <div className="print:hidden">
        <StorefrontFooter shopName={shopName} phone={phone} address={address} schedule={schedule} />
      </div>
    </div>
  );
}
