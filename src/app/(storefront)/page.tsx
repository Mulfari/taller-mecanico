export default function HomePage() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
      <h1 className="text-5xl font-bold text-white mb-4">
        Tu taller de <span className="text-[#e94560]">confianza</span>
      </h1>
      <p className="text-gray-400 text-lg max-w-xl mx-auto mb-8">
        Diagnóstico preciso, reparación profesional y atención personalizada para tu vehículo.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <a
          href="/citas"
          className="bg-[#e94560] hover:bg-[#c73652] text-white font-semibold px-8 py-3 rounded-lg transition-colors"
        >
          Agendar Cita
        </a>
        <a
          href="/seguimiento"
          className="border border-[#e94560]/50 hover:border-[#e94560] text-gray-300 hover:text-white font-semibold px-8 py-3 rounded-lg transition-colors"
        >
          Estado de mi Vehículo
        </a>
      </div>
    </section>
  );
}
