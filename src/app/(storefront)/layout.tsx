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
  let primaryColor: string | null = null;
  let secondaryColor: string | null = null;

  try {
    const supabase = await createClient();
    const { data: config } = await supabase
      .from("shop_config")
      .select("name, logo_url, phone, address, schedule, primary_color, secondary_color")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (config) {
      shopName = config.name || shopName;
      logoUrl = config.logo_url || null;
      phone = config.phone || null;
      address = config.address || null;
      schedule = config.schedule || null;
      primaryColor = config.primary_color || null;
      secondaryColor = config.secondary_color || null;
    }
  } catch {
  }

  const themeVars: Record<string, string> = {};
  if (primaryColor) {
    themeVars["--color-primary"] = primaryColor;
    const r = parseInt(primaryColor.slice(1, 3), 16);
    const g = parseInt(primaryColor.slice(3, 5), 16);
    const b = parseInt(primaryColor.slice(5, 7), 16);
    themeVars["--color-primary-hover"] = `#${Math.max(0, r - 30).toString(16).padStart(2, "0")}${Math.max(0, g - 19).toString(16).padStart(2, "0")}${Math.max(0, b - 14).toString(16).padStart(2, "0")}`;
  }
  if (secondaryColor) {
    themeVars["--color-secondary"] = secondaryColor;
    // Derive a darker surface color from the secondary
    const sr = parseInt(secondaryColor.slice(1, 3), 16);
    const sg = parseInt(secondaryColor.slice(3, 5), 16);
    const sb = parseInt(secondaryColor.slice(5, 7), 16);
    themeVars["--color-surface"] = `#${Math.max(0, sr - 4).toString(16).padStart(2, "0")}${Math.max(0, sg - 7).toString(16).padStart(2, "0")}${Math.max(0, sb - 16).toString(16).padStart(2, "0")}`;
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface print:bg-white print:block" style={themeVars}>
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
