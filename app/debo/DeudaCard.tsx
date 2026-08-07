"use client";

import { useState } from "react";
import { registrarPagoDeuda, marcarCobrado, eliminarDeuda } from "@/lib/actions";
import DeleteButton from "../components/DeleteButton";

type Deuda = {
  id: string;
  type: string;
  counterpartName: string | null;
  direction: string | null;
  balance: number;
  creditLimit: number | null;
  minPayment: number | null;
  dueDay: number | null;
};

export function TarjetaCredito({ deuda }: { deuda: Deuda }) {
  const [pagando, setPagando] = useState(false);
  const pct = deuda.creditLimit ? Math.min(100, Math.round((deuda.balance / deuda.creditLimit) * 100)) : 0;

  return (
    <div className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-4">
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="text-sm font-medium">{deuda.counterpartName}</p>
          <p className="text-xs text-muted">
            {deuda.minPayment ? `Cuota S/ ${deuda.minPayment.toFixed(0)}` : ""}
            {deuda.dueDay ? ` · vence el ${deuda.dueDay}` : ""}
          </p>
        </div>
        {!pagando && (
          <div className="flex items-center gap-2">
            <button onClick={() => setPagando(true)} className="text-xs px-2.5 py-1.5 rounded-lg border border-border hover:border-accent transition-colors">
              Registrar pago
            </button>
            <DeleteButton id={deuda.id} action={eliminarDeuda} label="✕" confirmText={`¿Eliminar la deuda de "${deuda.counterpartName}"?`} />
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
            <span><span className="text-foreground font-medium">S/ {deuda.balance.toFixed(0)}</span>{deuda.creditLimit ? ` de línea S/ ${deuda.creditLimit.toFixed(0)}` : ""}</span>
            <span>{pct}% usado</span>
          </div>
        </>
      )}
    </div>
  );
}

export function PrestamoPersonal({ deuda }: { deuda: Deuda }) {
  const [pagando, setPagando] = useState(false);
  const meDeben = deuda.direction === "me_deben";

  return (
    <div className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-4 flex justify-between items-center">
      <div>
        <p className="text-sm font-medium">{deuda.counterpartName}</p>
        <p className={`text-xs ${meDeben ? "text-positive" : "text-muted"}`}>{meDeben ? "Me deben" : "Yo debo"}</p>
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
          <span className="text-sm">S/ {deuda.balance.toFixed(0)}</span>
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
          <DeleteButton id={deuda.id} action={eliminarDeuda} label="✕" confirmText={`¿Eliminar el registro de "${deuda.counterpartName}"?`} />
        </div>
      )}
    </div>
  );
}
