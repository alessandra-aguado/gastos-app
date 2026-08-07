"use client";

import { CheckCircle2, CircleDashed, TrendingDown, TrendingUp } from "lucide-react";
import { updateSaldoCuenta } from "@/lib/actions";
import { useDecimales } from "../components/DecimalesProvider";
import { formatMonto } from "@/lib/format";

type CuentaRecon = {
  id: string;
  name: string;
  bank: string;
  balance: number;
  confirmadoEsteMes: boolean;
  saldoAnterior: number | null;
};

type Recon = {
  month: string;
  prevMonth: string;
  cuentas: CuentaRecon[];
  totalActual: number;
  totalAnterior: number | null;
  delta: number | null;
  pendientes: number;
};

function confirmarSaldo(id: string, balance: number) {
  const fd = new FormData();
  fd.set("id", id);
  fd.set("balance", String(balance));
  void updateSaldoCuenta(fd);
}

export default function ReconciliacionCard({ recon }: { recon: Recon }) {
  const decimales = useDecimales();
  const [anio, mes] = recon.month.split("-");
  const nombreMes = new Date(Number(anio), Number(mes) - 1, 1).toLocaleDateString("es-PE", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-5 mb-6">
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="text-xs text-muted capitalize">Reconciliación · {nombreMes}</p>
          <p className="text-2xl font-bold mt-1">
            S/ {formatMonto(recon.totalActual, decimales)}
          </p>
        </div>
        {recon.delta !== null ? (
          <div className={`flex items-center gap-1 text-sm font-medium ${recon.delta >= 0 ? "text-positive" : "text-warning"}`}>
            {recon.delta >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            S/ {formatMonto(Math.abs(recon.delta), decimales)} vs mes anterior
          </div>
        ) : (
          <p className="text-xs text-muted">Aún no hay historial del mes anterior para comparar.</p>
        )}
      </div>

      {recon.pendientes > 0 ? (
        <div className="border-t border-border pt-3 mt-1">
          <p className="text-xs text-muted mb-2">
            {recon.pendientes} {recon.pendientes === 1 ? "cuenta sin confirmar" : "cuentas sin confirmar"} este mes:
          </p>
          <div className="flex flex-col gap-1.5">
            {recon.cuentas
              .filter((c) => !c.confirmadoEsteMes)
              .map((c) => (
                <div key={c.id} className="flex justify-between items-center text-sm">
                  <span className="flex items-center gap-1.5 text-muted">
                    <CircleDashed size={14} className="text-warning" />
                    {c.name} · {c.bank}
                  </span>
                  <button
                    onClick={() => confirmarSaldo(c.id, c.balance)}
                    className="text-xs px-2 py-1 rounded-lg border border-border hover:border-accent hover:text-accent transition-colors"
                  >
                    Confirmar S/ {formatMonto(c.balance, decimales)}
                  </button>
                </div>
              ))}
          </div>
        </div>
      ) : (
        <div className="border-t border-border pt-3 mt-1 flex items-center gap-1.5 text-xs text-positive">
          <CheckCircle2 size={14} />
          Todas tus cuentas están confirmadas este mes.
        </div>
      )}
    </div>
  );
}
