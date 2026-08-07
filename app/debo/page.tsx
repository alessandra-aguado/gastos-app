import { getDeudas, getMetas } from "@/lib/queries";
import { CreditCard, Shield } from "lucide-react";
import { TarjetaCredito, PrestamoPersonal } from "./DeudaCard";
import NuevaDeudaModal from "./NuevaDeudaModal";

export const dynamic = "force-dynamic";

export default async function DeboPage() {
  const [deudas, metas] = await Promise.all([getDeudas(), getMetas()]);

  const activas = deudas.filter((d) => d.status !== "pagada");
  const tarjetas = activas.filter((d) => d.type === "tarjeta_credito");
  const prestamos = activas.filter((d) => d.type === "prestamo_personal");

  const debes = tarjetas.reduce((s, d) => s + d.balance, 0) + prestamos.filter((d) => d.direction === "yo_debo").reduce((s, d) => s + d.balance, 0);
  const meDeben = prestamos.filter((d) => d.direction === "me_deben").reduce((s, d) => s + d.balance, 0);

  const fondoEmergencia = metas.find((m) => m.isEmergencyFund);
  const cuotasMensuales = tarjetas.reduce((s, d) => s + (d.minPayment || 0), 0);
  const mesesCobertura = fondoEmergencia && cuotasMensuales > 0 ? fondoEmergencia.currentAmount / cuotasMensuales : null;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><CreditCard size={22} strokeWidth={1.75} />Debo</h1>
          <p className="text-muted text-sm mt-1">Debes S/ {debes.toLocaleString("es-PE")} · te deben S/ {meDeben.toLocaleString("es-PE")}</p>
        </div>
        <NuevaDeudaModal />
      </div>

      <p className="text-xs text-muted mb-2">Tarjetas de crédito</p>
      <div className="space-y-2.5 mb-6">
        {tarjetas.length === 0 ? (
          <div className="border border-dashed border-border rounded-xl p-6 text-center text-muted text-xs">Sin tarjetas registradas.</div>
        ) : (
          tarjetas.map((d) => <TarjetaCredito key={d.id} deuda={d} />)
        )}
      </div>

      <p className="text-xs text-muted mb-2">Préstamos personales</p>
      <div className="space-y-2.5 mb-6">
        {prestamos.length === 0 ? (
          <div className="border border-dashed border-border rounded-xl p-6 text-center text-muted text-xs">Sin préstamos registrados.</div>
        ) : (
          prestamos.map((d) => <PrestamoPersonal key={d.id} deuda={d} />)
        )}
      </div>

      {fondoEmergencia && (
        <div className="bg-accent-soft rounded-xl p-4 flex gap-2.5 items-center">
          <Shield size={18} strokeWidth={1.75} className="text-accent" />
          <p className="text-xs text-accent leading-relaxed">
            Tu fondo de emergencia ({fondoEmergencia.name}) tiene S/ {fondoEmergencia.currentAmount.toLocaleString("es-PE")}
            {mesesCobertura !== null ? ` — cubre ${mesesCobertura.toFixed(1)} meses de tus cuotas actuales (S/ ${cuotasMensuales.toFixed(0)}/mes).` : "."}
          </p>
        </div>
      )}
    </div>
  );
}
