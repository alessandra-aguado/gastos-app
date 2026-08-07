export default function DeboPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-semibold">💳 Debo</h1>
          <p className="text-muted text-sm mt-1">Debes S/ 2,890 · te deben S/ 200</p>
        </div>
        <button className="text-sm px-4 py-2 rounded-full border border-border hover:border-accent transition-colors">+ Nueva deuda</button>
      </div>

      <p className="text-xs text-muted mb-2">Tarjetas de crédito</p>
      <div className="space-y-2.5 mb-6">
        <div className="bg-surface border border-border rounded-2xl p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-sm font-medium">Interbank</p>
              <p className="text-xs text-muted">Cuota S/ 230 · vence el 20</p>
            </div>
            <button className="text-xs px-2.5 py-1.5 rounded-lg border border-border hover:border-accent transition-colors">Registrar pago</button>
          </div>
          <div className="h-1.5 rounded-full bg-background overflow-hidden mb-1.5">
            <div className="h-full rounded-full bg-accent" style={{ width: "46%" }} />
          </div>
          <div className="flex justify-between text-xs text-muted">
            <span><span className="text-foreground font-medium">S/ 2,300</span> de línea S/ 5,000</span>
            <span>46% usado</span>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-sm font-medium">Falabella</p>
              <p className="text-xs text-muted">Cuota S/ 90 · vence el 15</p>
            </div>
            <button className="text-xs px-2.5 py-1.5 rounded-lg border border-border hover:border-accent transition-colors">Registrar pago</button>
          </div>
          <div className="h-1.5 rounded-full bg-background overflow-hidden mb-1.5">
            <div className="h-full rounded-full bg-accent" style={{ width: "18%" }} />
          </div>
          <div className="flex justify-between text-xs text-muted">
            <span><span className="text-foreground font-medium">S/ 540</span> de línea S/ 3,000</span>
            <span>18% usado</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted mb-2">Préstamos personales</p>
      <div className="space-y-2.5 mb-6">
        <div className="bg-surface border border-border rounded-2xl p-4 flex justify-between items-center">
          <div>
            <p className="text-sm font-medium">Juan <span className="text-xs text-muted font-normal">· almuerzo prestado</span></p>
            <p className="text-xs text-muted">Yo debo</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">S/ 50</span>
            <button className="text-xs px-2.5 py-1.5 rounded-lg border border-border hover:border-accent transition-colors">Pagar</button>
          </div>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-4 flex justify-between items-center">
          <div>
            <p className="text-sm font-medium">Sofía <span className="text-xs text-muted font-normal">· le presté para su matrícula</span></p>
            <p className="text-xs text-positive">Me deben</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">S/ 200</span>
            <button className="text-xs px-2.5 py-1.5 rounded-lg border border-border hover:border-accent transition-colors">Marcar cobrado</button>
          </div>
        </div>
      </div>

      <div className="bg-accent-soft rounded-2xl p-4 flex gap-2.5 items-center">
        <span className="text-lg">🛡️</span>
        <p className="text-xs text-accent leading-relaxed">Tu fondo de emergencia tiene S/ 1,200 — cubre 3.9 meses de tus cuotas actuales (S/ 310/mes).</p>
      </div>
    </div>
  );
}
