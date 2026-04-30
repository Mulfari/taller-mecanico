export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Panel Principal</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Órdenes Activas", value: "—", icon: "🔧", color: "text-[#e94560]" },
          { label: "Citas Hoy", value: "—", icon: "📅", color: "text-blue-400" },
          { label: "Vehículos en Taller", value: "—", icon: "🚗", color: "text-yellow-400" },
          { label: "Ingresos del Mes", value: "—", icon: "📊", color: "text-green-400" },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-[#16213e] border border-white/10 rounded-xl p-5 flex items-center gap-4"
          >
            <span className="text-3xl">{card.icon}</span>
            <div>
              <p className="text-gray-400 text-sm">{card.label}</p>
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
