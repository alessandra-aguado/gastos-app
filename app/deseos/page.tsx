export default function DeseosPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold">✨ Deseos</h1>
      <p className="text-muted text-sm mt-1 mb-6">3 deseos · S/ 4,450 en total</p>

      <div className="space-y-2.5 mb-6">
        <div className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] px-4 py-3 flex justify-between items-center">
          <div className="flex gap-2.5 items-center">
            <span className="text-lg">💻</span>
            <div><p className="text-sm font-medium">Laptop nueva</p><p className="text-xs text-muted">Tecnología · innecesario</p></div>
          </div>
          <span className="text-sm">S/ 3,500</span>
        </div>
        <div className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] px-4 py-3 flex justify-between items-center">
          <div className="flex gap-2.5 items-center">
            <span className="text-lg">🎧</span>
            <div><p className="text-sm font-medium">Audífonos</p><p className="text-xs text-muted">Tecnología · innecesario</p></div>
          </div>
          <span className="bg-positive-soft text-positive text-[10px] font-medium px-2 py-1 rounded-md">Meta creada</span>
        </div>
        <div className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] px-4 py-3 flex justify-between items-center">
          <div className="flex gap-2.5 items-center">
            <span className="text-lg">🩺</span>
            <div><p className="text-sm font-medium">Chequeo dental</p><p className="text-xs text-muted">Salud · necesario</p></div>
          </div>
          <span className="bg-positive-soft text-positive text-[10px] font-medium px-2 py-1 rounded-md">Meta creada</span>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-4">
        <div className="flex gap-2 items-center mb-3">
          <span className="text-lg">💻</span>
          <span className="text-sm font-medium">Laptop nueva · S/ 3,500</span>
        </div>

        <div className="flex gap-2 mb-3">
          <div className="w-6.5 h-6.5 w-[26px] h-[26px] rounded-full bg-accent flex items-center justify-center text-white text-xs shrink-0">🤖</div>
          <div className="bg-accent-soft rounded-xl px-3 py-2.5 text-xs text-accent leading-relaxed">
            Viendo tu ritmo de ahorro de los últimos 3 meses, te quedan ~S/ 300 libres al mes después de fijos y deudas. Tengo dos caminos:
          </div>
        </div>

        <div className="flex flex-col gap-2 ml-[34px] mb-3">
          <div className="border border-border rounded-xl px-3 py-2.5 flex justify-between items-center gap-2">
            <span className="text-xs">Ahorra 40% (S/ 1,400) y paga el resto sin cuotas al comprar.</span>
            <button className="text-xs px-2.5 py-1.5 rounded-lg border border-border shrink-0">Usar</button>
          </div>
          <div className="border border-border rounded-xl px-3 py-2.5 flex justify-between items-center gap-2">
            <span className="text-xs">A tu ritmo actual, la compras al 100% en marzo 2026.</span>
            <button className="text-xs px-2.5 py-1.5 rounded-lg border border-border shrink-0">Usar</button>
          </div>
        </div>

        <div className="ml-[34px]">
          <button className="text-xs px-3 py-1.5 rounded-lg border border-border">Prefiero ajustarlo yo</button>
        </div>
      </div>
    </div>
  );
}
