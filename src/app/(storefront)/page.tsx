import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";

// --- Reason icons ---
function IconCertified() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-.723 3.065 3.745 3.745 0 01-3.065.723 3.745 3.745 0 01-3.068 1.593 3.745 3.745 0 01-3.068-1.593 3.745 3.745 0 01-3.065-.723 3.745 3.745 0 01-.723-3.065A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 01.723-3.065 3.745 3.745 0 013.065-.723A3.745 3.745 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.745 3.745 0 013.065.723 3.745 3.745 0 01.723 3.065A3.745 3.745 0 0121 12z" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconPriceTag() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185zM9.75 9h.008v.008H9.75V9zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 4.5h.008v.008h-.008V13.5zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}

// --- Service icons ---
function WrenchIcon() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
    </svg>
  );
}

function OilIcon() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
  );
}

function CarIcon() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  );
}

function DiagIcon() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" />
    </svg>
  );
}

function AlignIcon() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
    </svg>
  );
}

function ElecIcon() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  );
}

// --- Data ---
const services = [
  { icon: <OilIcon />, title: "Cambio de Aceite", desc: "Aceite sintético o convencional con revisión de 21 puntos incluida." },
  { icon: <DiagIcon />, title: "Diagnóstico Computarizado", desc: "Escáner OBD2 de última generación para detectar fallas con precisión." },
  { icon: <WrenchIcon />, title: "Reparación General", desc: "Motor, transmisión, frenos, suspensión y más. Mano de obra garantizada." },
  { icon: <AlignIcon />, title: "Alineación y Balanceo", desc: "Equipo de última generación para prolongar la vida de tus neumáticos." },
  { icon: <ElecIcon />, title: "Sistema Eléctrico", desc: "Diagnóstico y reparación de fallas eléctricas, batería y alternador." },
  { icon: <CarIcon />, title: "Mantenimiento Preventivo", desc: "Planes de mantenimiento personalizados según marca, modelo y kilometraje." },
];


const reasons = [
  { icon: <IconCertified />, title: "Técnicos Certificados", desc: "Más de 15 años de experiencia. Nuestro equipo está certificado por los principales fabricantes." },
  { icon: <IconClock />, title: "Entrega a Tiempo", desc: "Cumplimos los plazos prometidos. Si nos demoramos más, el servicio tiene descuento." },
  { icon: <IconPriceTag />, title: "Precios Transparentes", desc: "Cotización detallada antes de empezar. Sin sorpresas ni cargos ocultos." },
  { icon: <IconShield />, title: "Garantía de Servicio", desc: "Todos nuestros trabajos tienen garantía de 6 meses o 10.000 km, lo que ocurra primero." },
];

// --- Page ---
export default async function HomePage() {
  const supabase = await createClient();

  const [
    { data: shopConfig },
    { count: clientCount },
    { count: deliveredCount },
    { count: vehicleCount },
    { data: testimonialRows },
    { count: totalRatings },
  ] = await Promise.all([
    supabase
      .from("shop_config")
      .select("name, address, created_at")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "client"),
    supabase
      .from("work_orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "delivered"),
    supabase
      .from("work_orders")
      .select("vehicle_id", { count: "exact", head: true }),
    supabase
      .from("work_order_ratings")
      .select("id, rating, comment, created_at, profiles:profiles!work_order_ratings_client_id_fkey(full_name)")
      .gte("rating", 4)
      .not("comment", "is", null)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("work_order_ratings")
      .select("*", { count: "exact", head: true }),
  ]);

  const shopName = shopConfig?.name || "TallerPro";
  const shopAddress = shopConfig?.address || null;

  const yearsActive = shopConfig?.created_at
    ? Math.max(1, new Date().getFullYear() - new Date(shopConfig.created_at).getFullYear())
    : null;

  function formatCount(n: number): string {
    if (n >= 1000) return `+${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
    return n > 0 ? `+${n}` : "0";
  }

  const heroStats = [
    {
      value: formatCount(clientCount ?? 0),
      label: "Clientes atendidos",
    },
    {
      value: deliveredCount != null && deliveredCount > 0
        ? formatCount(deliveredCount)
        : formatCount(vehicleCount ?? 0),
      label: deliveredCount != null && deliveredCount > 0
        ? "Servicios completados"
        : "Vehículos atendidos",
    },
    {
      value: yearsActive != null
        ? `${yearsActive} ${yearsActive === 1 ? "año" : "años"}`
        : "Expertos",
      label: yearsActive != null ? "De experiencia" : "En mecánica automotriz",
    },
  ];

  const { data: featuredVehicles } = await supabase
    .from("vehicles_for_sale")
    .select("id, brand, model, year, price, mileage, fuel_type, transmission, color")
    .eq("status", "available")
    .order("created_at", { ascending: false })
    .limit(3);

  const vehicleIds = featuredVehicles?.map((v) => v.id) ?? [];
  const { data: photos } = vehicleIds.length
    ? await supabase
        .from("vehicle_photos")
        .select("vehicle_sale_id, url, order")
        .in("vehicle_sale_id", vehicleIds)
        .order("order")
    : { data: [] };

  const photoByVehicle: Record<string, string> = {};
  for (const p of photos ?? []) {
    if (p.vehicle_sale_id && !photoByVehicle[p.vehicle_sale_id]) {
      photoByVehicle[p.vehicle_sale_id] = p.url;
    }
  }

  const testimonials = (testimonialRows ?? []).map((r) => {
    const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
    const fullName = (profile as { full_name: string | null } | null)?.full_name ?? "Cliente";
    const nameParts = fullName.split(" ");
    const displayName = nameParts.length >= 2
      ? `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.`
      : fullName;
    return {
      id: r.id as string,
      rating: r.rating as number,
      comment: r.comment as string,
      displayName,
      date: new Date(r.created_at as string).toLocaleDateString("es-MX", { month: "short", year: "numeric" }),
    };
  });

  const avgRating = (totalRatings ?? 0) > 0 && testimonialRows && testimonialRows.length > 0
    ? (() => {
        const sum = testimonials.reduce((s, t) => s + t.rating, 0);
        return (sum / testimonials.length).toFixed(1);
      })()
    : null;

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-surface">
        {/* Background grid pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: "linear-gradient(var(--color-primary) 1px, transparent 1px), linear-gradient(90deg, var(--color-primary) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-surface via-secondary/80 to-surface" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-primary text-sm font-medium">
                {shopName}{shopAddress ? ` · ${shopAddress}` : ""}
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
              Tu vehículo merece{" "}
              <span className="text-primary">el mejor cuidado</span>
            </h1>

            <p className="text-gray-400 text-lg md:text-xl leading-relaxed mb-8 max-w-xl">
              Diagnóstico preciso, reparación profesional y atención personalizada. Más de 15 años cuidando los vehículos de nuestra comunidad.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/citas"
                className="bg-primary hover:bg-primary-hover text-white font-semibold px-8 py-3.5 rounded-lg transition-colors text-center"
              >
                Agendar Cita
              </Link>
              <Link
                href="/mi-vehiculo"
                className="border border-primary/40 hover:border-primary text-gray-300 hover:text-white font-semibold px-8 py-3.5 rounded-lg transition-colors text-center"
              >
                Estado de mi Vehículo
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 sm:gap-6 mt-12 pt-10 border-t border-white/10">
              {heroStats.map((stat) => (
                <div key={stat.label}>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{stat.value}</p>
                  <p className="text-gray-500 text-xs sm:text-sm mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="bg-secondary py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Nuestros <span className="text-primary">Servicios</span>
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Equipos de diagnóstico de última generación y técnicos certificados para cualquier marca y modelo.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <div
                key={service.title}
                className="bg-surface border border-white/5 rounded-xl p-6 hover:border-primary/30 transition-colors group"
              >
                <div className="text-primary mb-4 group-hover:scale-110 transition-transform inline-block">
                  {service.icon}
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{service.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{service.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/servicios" className="inline-flex items-center gap-2 text-primary hover:text-white font-medium transition-colors">
              Ver todos los servicios
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURED VEHICLES */}
      <section className="bg-surface py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Vehículos <span className="text-primary">Destacados</span>
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Revisados y certificados por nuestros técnicos. Garantía incluida en todos los modelos.
            </p>
          </div>
          {(featuredVehicles ?? []).length === 0 ? (
            <div className="col-span-3 text-center py-12">
              <p className="text-gray-500 text-sm">No hay vehículos disponibles en este momento.</p>
            </div>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(featuredVehicles ?? []).map((v) => {
              const mainPhoto = photoByVehicle[v.id];
              return (
              <Link
                key={v.id}
                href={`/vehiculos/${v.id}`}
                className="bg-secondary border border-white/5 rounded-xl overflow-hidden hover:border-primary/30 transition-colors group"
              >
                <div className="relative h-48 bg-gradient-to-br from-secondary to-[#0d1117] flex items-center justify-center border-b border-white/5 overflow-hidden">
                  {mainPhoto ? (
                    <Image
                      src={mainPhoto}
                      alt={`${v.brand} ${v.model} ${v.year}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <svg className="w-20 h-20 text-gray-700 group-hover:text-primary/30 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                    </svg>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-white font-bold text-lg group-hover:text-primary transition-colors">{v.brand} {v.model}</h3>
                      <p className="text-gray-500 text-sm">{v.year}{v.color ? ` · ${v.color}` : ""}</p>
                    </div>
                    {v.price != null && (
                      <span className="text-primary font-bold text-lg">${v.price.toLocaleString("es-MX")}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {[
                      v.transmission,
                      v.fuel_type,
                      v.mileage != null ? `${(v.mileage / 1000).toFixed(0)}k km` : null,
                    ]
                      .filter(Boolean)
                      .map((tag) => (
                        <span key={tag} className="bg-surface text-gray-400 text-xs px-2.5 py-1 rounded-full border border-white/5">
                          {tag}
                        </span>
                      ))}
                  </div>
                  <div className="block text-center border border-primary/40 group-hover:border-primary group-hover:bg-primary/10 text-gray-300 group-hover:text-white text-sm font-medium py-2 rounded-lg transition-colors">
                    Ver detalles
                  </div>
                </div>
              </Link>
              );
            })}
          </div>
          )}
          <div className="text-center mt-10">
            <Link href="/vehiculos" className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold px-8 py-3 rounded-lg transition-colors">
              Ver todos los vehículos
            </Link>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="bg-secondary py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              ¿Por qué <span className="text-primary">elegirnos</span>?
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Calidad, transparencia y respeto por tu tiempo. Eso es lo que nos diferencia.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {reasons.map((r) => (
              <div key={r.title} className="bg-surface border border-white/5 rounded-xl p-6 text-center hover:border-primary/30 transition-colors group">
                <div className="text-primary mb-4 flex justify-center group-hover:scale-110 transition-transform">{r.icon}</div>
                <h3 className="text-white font-semibold text-base mb-2">{r.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      {testimonials.length > 0 && (
        <section className="bg-surface py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Lo que dicen nuestros <span className="text-primary">clientes</span>
              </h2>
              <p className="text-gray-400 max-w-xl mx-auto">
                Opiniones reales de quienes confían en nosotros para el cuidado de sus vehículos.
              </p>
              {avgRating && (totalRatings ?? 0) > 0 && (
                <div className="flex items-center justify-center gap-3 mt-6">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-5 h-5 ${star <= Math.round(Number(avgRating)) ? "text-yellow-400" : "text-gray-600"}`}
                        fill={star <= Math.round(Number(avgRating)) ? "currentColor" : "none"}
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                        />
                      </svg>
                    ))}
                  </div>
                  <span className="text-yellow-400 font-bold text-lg">{avgRating}</span>
                  <span className="text-gray-500 text-sm">
                    de {totalRatings} calificacion{(totalRatings ?? 0) !== 1 ? "es" : ""}
                  </span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map((t) => (
                <div
                  key={t.id}
                  className="bg-secondary border border-white/5 rounded-xl p-6 flex flex-col hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-4 h-4 ${star <= t.rating ? "text-yellow-400" : "text-gray-600"}`}
                        fill={star <= t.rating ? "currentColor" : "none"}
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                        />
                      </svg>
                    ))}
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed flex-1">
                    &ldquo;{t.comment}&rdquo;
                  </p>
                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/5">
                    <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-sm font-bold">
                      {t.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{t.displayName}</p>
                      <p className="text-gray-500 text-xs">{t.date}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA BANNER */}
      <section className="bg-primary py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            ¿Listo para agendar tu próxima visita?
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            Reserva tu cita en minutos y recibe confirmación inmediata. Sin esperas, sin complicaciones.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/citas" className="bg-white text-primary hover:bg-gray-100 font-semibold px-8 py-3.5 rounded-lg transition-colors">
              Agendar Cita Ahora
            </Link>
            <Link href="/cotizacion" className="border-2 border-white/60 hover:border-white text-white font-semibold px-8 py-3.5 rounded-lg transition-colors">
              Solicitar Cotización
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
