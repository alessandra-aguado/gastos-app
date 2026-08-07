import Link from "next/link";
import { Flame, ChevronLeft, ChevronRight } from "lucide-react";
import { getRachaData, getDiasVencimiento } from "@/lib/queries";

export const dynamic = "force-dynamic";

function claveDia(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function mesActualKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default async function RachaPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes } = await searchParams;
  const mesKey = mes && /^\d{4}-\d{2}$/.test(mes) ? mes : mesActualKey();
  const [y, m] = mesKey.split("-").map(Number);

  const [racha, diasVencimiento] = await Promise.all([getRachaData(), getDiasVencimiento()]);

  const gastoSet = new Set(racha.diasConGasto);
  const vencSet = new Set(diasVencimiento);
  const hoy = new Date();
  const hoyKey = claveDia(hoy);

  const primerDia = new Date(y, m - 1, 1);
  const diasEnMes = new Date(y, m, 0).getDate();
  const offset = (primerDia.getDay() + 6) % 7;
  const esMesActual = mesKey === mesActualKey();

  const mesAnterior = new Date(y, m - 2, 1);
  const mesSiguiente = new Date(y, m, 1);
  const keyMesAnterior = `${mesAnterior.getFullYear()}-${String(mesAnterior.getMonth() + 1).padStart(2, "0")}`;
  const keyMesSiguiente = `${mesSiguiente.getFullYear()}-${String(mesSiguiente.getMonth() + 1).padStart(2, "0")}`;

  const nombreMes = primerDia.toLocaleDateString("es-PE", { month: "long", year: "numeric" });

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold flex items-center gap-2">
        <Flame size={22} strokeWidth={1.75} className="text-accent" />Racha
      </h1>
      <p className="text-muted text-sm mt-1">Los días en que registraste al menos un gasto, uno tras otro.</p>

      <div className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-5 mt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium flex items-center gap-1.5">
              <Flame size={16} strokeWidth={1.75} className="text-accent" />
              {racha.rachaActual} {racha.rachaActual === 1 ? "día" : "días"} registrando
            </p>
            <p className="text-xs text-muted mt-0.5">Mejor racha: {racha.mejorRacha} {racha.mejorRacha === 1 ? "día" : "días"}</p>
          </div>
          <div className="flex items-center gap-1">
            <Link
              href={`/racha?mes=${keyMesAnterior}`}
              aria-label="Mes anterior"
              className="w-7 h-7 flex items-center justify-center rounded-lg text-muted hover:bg-hover transition-colors"
            >
              <ChevronLeft size={16} strokeWidth={1.75} />
            </Link>
            <span className="text-sm capitalize w-32 text-center">{nombreMes}</span>
            {esMesActual ? (
              <span className="w-7 h-7 flex items-center justify-center rounded-lg text-muted opacity-30">
                <ChevronRight size={16} strokeWidth={1.75} />
              </span>
            ) : (
              <Link
                href={`/racha?mes=${keyMesSiguiente}`}
                aria-label="Mes siguiente"
                className="w-7 h-7 flex items-center justify-center rounded-lg text-muted hover:bg-hover transition-colors"
              >
                <ChevronRight size={16} strokeWidth={1.75} />
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5 text-center mb-1.5">
          {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
            <span key={i} className="text-[10px] text-muted">{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: offset }, (_, i) => <div key={`vacio-${i}`} />)}
          {Array.from({ length: diasEnMes }, (_, i) => {
            const dayNum = i + 1;
            const fecha = new Date(y, m - 1, dayNum);
            const key = claveDia(fecha);
            const tieneGasto = gastoSet.has(key);
            const esFuturo = key > hoyKey;
            const esHoy = key === hoyKey;
            const tieneVencimiento = vencSet.has(dayNum);

            return (
              <div
                key={key}
                className="aspect-square rounded-md flex items-center justify-center relative text-[10px]"
                style={{
                  background: tieneGasto ? "var(--positive)" : esFuturo ? "transparent" : "var(--border)",
                  border: esHoy ? "1.5px solid var(--accent)" : esFuturo ? "1px dashed var(--border)" : "none",
                  color: tieneGasto ? "#fff" : "var(--muted)",
                }}
                title={tieneVencimiento ? "Pago próximo a vencer" : undefined}
              >
                {dayNum}
                {tieneVencimiento && (
                  <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full" style={{ background: "var(--warning)" }} />
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-4 mt-3 text-[11px] text-muted">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: "var(--positive)" }} />Con gasto registrado</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--warning)" }} />Pago por vencer ese día del mes</span>
        </div>
      </div>
    </div>
  );
}
