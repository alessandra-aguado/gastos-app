import { getDeudas, getMetas, getPaymentMethods, getSettings } from "@/lib/queries";
import { formatMonto } from "@/lib/format";
import { CreditCard, Shield } from "lucide-react";
import { TarjetaCredito, PrestamoPersonal } from "./DeudaCard";
import DeudaModal from "./DeudaModal";
import DescargarCSV from "../components/DescargarCSV";

export const dynamic = "force-dynamic";

export default async function DeboPage() {
  const [deudas, metas, medios, settings] = await Promise.all([getDeudas(), getMetas(), getPaymentMethods(), getSettings()]);
  const decimales = settings?.decimales ?? 0;
  const mediosCredito = medios.filter((m) => m.type === "credito");

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
          <h1 className="text-2xl font-semibold flex items-center gap-2"><CreditCard size={22} strokeWidth={1.75} />Deuda</h1>
          <p className="text-muted text-sm mt-1">Debes S/ {formatMonto(debes, decimales)} · te deben S/ {formatMonto(meDeben, decimales)}</p>
        </div>
        <div className="flex items-center gap-2">
          <DescargarCSV
            filename="deudas.csv"
            headers={["Tipo", "Contraparte", "Dirección", "Saldo", "Línea de crédito", "Cuota mínima", "Vence el día", "Desde"]}
            rows={activas.map((d) => [
              d.type === "tarjeta_credito" ? "Tarjeta de crédito" : "Préstamo personal",
              d.counterpartName || "",
              d.direction === "yo_debo" ? "Yo debo" : d.direction === "me_deben" ? "Me deben" : "",
              d.balance.toFixed(2),
              d.creditLimit ?? "",
              d.minPayment ?? "",
              d.dueDay ?? "",
              d.startDate ? new Date(d.startDate).toLocaleDateString("es-PE") : "",
            ])}
          />
          <DeudaModal medios={mediosCredito} />
        </div>
      </div>

      <p className="text-xs text-muted mb-2">Tarjetas de crédito</p>
      <div className="space-y-2.5 mb-6">
        {tarjetas.length === 0 ? (
          <div className="border border-dashed border-border rounded-xl p-6 text-center text-muted text-xs">Sin tarjetas registradas.</div>
        ) : (
          tarjetas.map((d) => <TarjetaCredito key={d.id} deuda={d} medios={mediosCredito} />)
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
            Tu fondo de emergencia ({fondoEmergencia.name}) tiene S/ {formatMonto(fondoEmergencia.currentAmount, decimales)}
            {mesesCobertura !== null ? ` — cubre ${mesesCobertura.toFixed(1)} meses de tus cuotas actuales (S/ ${formatMonto(cuotasMensuales, decimales)}/mes).` : "."}
          </p>
        </div>
      )}
    </div>
  );
}
