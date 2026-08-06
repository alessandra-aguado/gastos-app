const chips = [
  { icon: "📊", label: "Presupuesto", value: "65% usado" },
  { icon: "🎯", label: "Metas", value: "3 activas" },
  { icon: "💳", label: "Debo", value: "S/ 450" },
  { icon: "🔥", label: "Racha", value: "12 días" },
];

const dailySpend = [12, 34, 8, 51, 20, 63, 15]; // últimos 7 días, mock
const days = ["L", "M", "M", "J", "V", "S", "D"];
const maxSpend = Math.max(...dailySpend);

const categories = [
  { icon: "🛒", name: "Supermercado", amount: "S/ 210" },
  { icon: "🥬", name: "Mercado", amount: "S/ 95" },
  { icon: "🚌", name: "Transporte", amount: "S/ 120" },
  { icon: "🍽️", name: "Salidas a comer", amount: "S/ 180" },
  { icon: "🎬", name: "Entretenimiento", amount: "S/ 60" },
  { icon: "💊", name: "Salud", amount: "S/ 40" },
];

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Hola, Ale 👋</h1>
          <p className="text-muted text-sm mt-1">Así vas este mes de agosto</p>
        </div>
        <button className="bg-accent text-white text-sm font-medium px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity">
          + Registrar gasto
        </button>
      </header>

      {/* Resumen del mes */}
      <section className="bg-surface border border-border rounded-2xl p-6 flex flex-wrap items-center gap-8">
        <div>
          <p className="text-xs text-muted">Gastado este mes</p>
          <p className="text-3xl font-semibold mt-1">S/ 1,240</p>
        </div>
        <div>
          <p className="text-xs text-muted">Transacciones</p>
          <p className="text-3xl font-semibold mt-1">38</p>
        </div>
        <div>
          <p className="text-xs text-muted">Promedio por gasto</p>
          <p className="text-3xl font-semibold mt-1">S/ 33</p>
        </div>
        <div>
          <p className="text-xs text-muted">Pendientes por clasificar</p>
          <p className="text-3xl font-semibold mt-1 text-positive">0</p>
        </div>
      </section>

      {/* Chips de cada sección */}
      <section className="flex flex-wrap gap-3">
        {chips.map((c) => (
          <div
            key={c.label}
            className="flex items-center gap-2 bg-surface border border-border rounded-full px-4 py-2 text-sm"
          >
            <span>{c.icon}</span>
            <span className="text-muted">{c.label}</span>
            <span className="font-medium">{c.value}</span>
          </div>
        ))}
      </section>

      {/* Gasto diario */}
      <section className="bg-surface border border-border rounded-2xl p-6">
        <p className="text-sm font-medium mb-4">Gasto diario</p>
        <div className="flex items-end gap-4 h-32">
          {dailySpend.map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div
                className="w-full bg-accent-soft rounded-t-lg"
                style={{ height: `${(v / maxSpend) * 100}%`, background: "var(--accent)" }}
              />
              <span className="text-xs text-muted">{days[i]}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Categorías */}
      <section>
        <p className="text-sm font-medium mb-3">Por categoría</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {categories.map((c) => (
            <button
              key={c.name}
              className="bg-surface border border-border rounded-2xl p-4 text-left hover:border-accent transition-colors"
            >
              <span className="text-xl">{c.icon}</span>
              <p className="text-sm mt-2">{c.name}</p>
              <p className="text-lg font-semibold mt-0.5">{c.amount}</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
