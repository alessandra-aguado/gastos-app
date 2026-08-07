import { getCuentas, getReconciliacionCuentas } from "@/lib/queries";
import { Wallet, Users } from "lucide-react";
import CuentaRow from "./CuentaRow";
import NuevaCuentaModal from "./NuevaCuentaModal";
import NuevaCuentaCustodiaModal from "./NuevaCuentaCustodiaModal";
import ReconciliacionCard from "./ReconciliacionCard";

export const dynamic = "force-dynamic";

type CuentaConDatos = Awaited<ReturnType<typeof getCuentas>>[number];

function agruparPorBanco(cuentas: CuentaConDatos[]) {
  const grupos = new Map<string, CuentaConDatos[]>();
  for (const c of cuentas) {
    if (!grupos.has(c.bank)) grupos.set(c.bank, []);
    grupos.get(c.bank)!.push(c);
  }
  return Array.from(grupos.entries());
}

function ListaCuentas({ cuentas }: { cuentas: CuentaConDatos[] }) {
  return (
    <>
      {agruparPorBanco(cuentas).map(([bank, items]) => (
        <div key={bank}>
          <p className="text-xs text-muted mb-2">{bank}</p>
          <div className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] overflow-hidden mb-4">
            {items.map((c, i) => {
              const dias = c.lastCheckIn ? Math.floor((Date.now() - new Date(c.lastCheckIn).getTime()) / 86400000) : null;
              return <CuentaRow key={c.id} cuenta={c} ultimo={i === items.length - 1} dias={dias} />;
            })}
          </div>
        </div>
      ))}
    </>
  );
}

export default async function CuentasPage() {
  const [cuentas, recon] = await Promise.all([getCuentas(), getReconciliacionCuentas()]);
  const propias = cuentas.filter((c) => c.type !== "custodia");
  const custodia = cuentas.filter((c) => c.type === "custodia");
  const total = propias.filter((c) => c.type !== "puntos").reduce((s, c) => s + c.balance, 0);

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><Wallet size={22} strokeWidth={1.75} />Cuentas</h1>
          <p className="text-muted text-sm mt-1">S/ {total.toLocaleString("es-PE")} en total · sin contar deudas</p>
        </div>
        <NuevaCuentaModal />
      </div>

      {cuentas.length > 0 && <ReconciliacionCard recon={recon} />}

      {cuentas.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-10 text-center text-muted text-sm">
          Aún no registras cuentas. Agrega la primera con &quot;+ Agregar cuenta&quot;.
        </div>
      ) : (
        <>
          {propias.length > 0 && <ListaCuentas cuentas={propias} />}

          <div className="mt-2">
            <div className="flex justify-between items-center mb-1">
              <p className="text-sm font-medium flex items-center gap-1.5">
                <Users size={15} strokeWidth={2} className="text-muted" />
                Dinero que administras para otros
              </p>
              <NuevaCuentaCustodiaModal />
            </div>
            <p className="text-xs text-muted mb-3">
              No se suma a tu patrimonio ni a tu reconciliación mensual, porque no es tuyo.
            </p>
            {custodia.length > 0 ? (
              <ListaCuentas cuentas={custodia} />
            ) : (
              <div className="border border-dashed border-border rounded-xl p-6 text-center text-muted text-xs">
                Aún no registras fondos de terceros.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
