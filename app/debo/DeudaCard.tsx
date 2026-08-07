"use client";

import { useState } from "react";
import { registrarPagoDeuda, marcarCobrado, eliminarDeuda } from "@/lib/actions";
import RowMenu from "../components/RowMenu";
import { useDecimales } from "../components/DecimalesProvider";
import { formatMonto } from "@/lib/format";
import DeudaModal from "./DeudaModal";

type Deuda = {
  id: string;
  type: string;
  counterpartName: string | null;
  direction: string | null;
  balance: number;
  creditLimit: number | null;
  minPayment: number | null;
  dueDay: number | null;
  interestRate: number | null;
  startDate: Date | null;
  paymentMethodId: string | null;
};

type Medio = { id: string; name: string };

function formatFecha(d: Date | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" });
}

function borrarConConfirmacion(id: string, nombre: string) {
  if (!window.confirm(`¿Eliminar la deuda de "${nombre}"? Esta acción no se puede deshacer.`)) return;
  const fd = new FormData();
  fd.set("id", id);
  void eliminarDeuda(fd);
}

export function TarjetaCredito({ deuda, medios }: { deuda: Deuda; medios?: Medio[] }) {
  const [pagando, setPagando] = useState(false);
  const [editando, setEditando] = useState(false);
  const decimales = useDecimales();
  const pct = deuda.creditLimit ? Math.min(100, Math.round((deuda.balance / deuda.creditLimit) * 100)) : 0;
  const medioVinculado = medios?.find((m) => m.id === deuda.paymentMethodId);

  return (
    <div className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-4">
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="text-sm font-medium">{deuda.counterpartName}</p>
          <p className="text-xs text-muted">
            {deuda.minPayment ? `Cuota S/ ${formatMonto(deuda.minPayment, decimales)}` : ""}
            {deuda.dueDay ? ` · vence el ${deuda.dueDay}` : ""}
            {formatFecha(deuda.startDate) ? ` · desde ${formatFecha(deuda.startDate)}` : ""}
          </p>
          {medioVinculado ? (
            <p className="text-[11px] text-positive mt-0.5">Sincronizada con gastos en &quot;{medioVinculado.name}&quot;</p>
          ) : (
            <p className="text-[11px] text-muted mt-0.5">Sin vincular a un medio de pago</p>
          )}
        </div>
        {!pagando && (
          <div className="flex items-center gap-1.5">
            <button onClick={() => setPagando(true)} className="text-xs px-2.5 py-1.5 rounded-lg border border-border hover:border-accent transition-colors">
              Registrar pago
            </button>
            <RowMenu onEdit={() => setEditando(true)} onDelete={() => borrarConConfirmacion(deuda.id, deuda.counterpartName || "")} />
          </div>
        )}
      </div>

      {pagando ? (
        <form
          action={async (fd) => {
            await registrarPagoDeuda(fd);
            setPagando(false);
          }}
          className="flex gap-1.5 mb-1"
        >
          <input type="hidden" name="debtId" value={deuda.id} />
          <input name="amount" type="number" autoFocus placeholder="Monto pagado" className="flex-1 border border-border rounded-lg px-2 py-1.5 bg-background text-xs" />
          <button className="text-xs px-3 py-1.5 rounded-lg bg-accent text-white">Pagar</button>
          <button type="button" onClick={() => setPagando(false)} className="text-xs px-2 py-1.5 rounded-lg border border-border">✕</button>
        </form>
      ) : (
        <>
          <div className="h-1.5 rounded-full bg-background overflow-hidden mb-1.5">
            <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex justify-between text-xs text-muted">
            <span><span className="text-foreground font-medium">S/ {formatMonto(deuda.balance, decimales)}</span>{deuda.creditLimit ? ` de línea S/ ${formatMonto(deuda.creditLimit, decimales)}` : ""}</span>
            <span>{pct}% usado</span>
          </div>
        </>
      )}
      {editando && <DeudaModal deuda={deuda} medios={medios} onClose={() => setEditando(false)} />}
    </div>
  );
}

export function PrestamoPersonal({ deuda }: { deuda: Deuda }) {
  const [pagando, setPagando] = useState(false);
  const [editando, setEditando] = useState(false);
  const decimales = useDecimales();
  const meDeben = deuda.direction === "me_deben";

  return (
    <div className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-4 flex justify-between items-center">
      <div>
        <p className="text-sm font-medium">{deuda.counterpartName}</p>
        <p className={`text-xs ${meDeben ? "text-positive" : "text-muted"}`}>
          {meDeben ? "Me deben" : "Yo debo"}
          {formatFecha(deuda.startDate) ? ` · desde ${formatFecha(deuda.startDate)}` : ""}
          {deuda.interestRate ? ` · ${deuda.interestRate}% interés` : ""}
        </p>
      </div>
      {pagando ? (
        <form
          action={async (fd) => {
            await registrarPagoDeuda(fd);
            setPagando(false);
          }}
          className="flex gap-1.5 items-center"
        >
          <input type="hidden" name="debtId" value={deuda.id} />
          <input name="amount" type="number" autoFocus defaultValue={deuda.balance} className="w-20 border border-border rounded-lg px-2 py-1 bg-background text-xs" />
          <button className="text-xs px-2.5 py-1.5 rounded-lg bg-accent text-white">Confirmar</button>
        </form>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-sm">S/ {formatMonto(deuda.balance, decimales)}</span>
          {meDeben ? (
            <form action={marcarCobrado}>
              <input type="hidden" name="id" value={deuda.id} />
              <button className="text-xs px-2.5 py-1.5 rounded-lg border border-border hover:border-accent transition-colors">Marcar cobrado</button>
            </form>
          ) : (
            <button onClick={() => setPagando(true)} className="text-xs px-2.5 py-1.5 rounded-lg border border-border hover:border-accent transition-colors">
              Pagar
            </button>
          )}
          <RowMenu onEdit={() => setEditando(true)} onDelete={() => borrarConConfirmacion(deuda.id, deuda.counterpartName || "")} />
        </div>
      )}
      {editando && <DeudaModal deuda={deuda} onClose={() => setEditando(false)} />}
    </div>
  );
}
