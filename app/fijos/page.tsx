import { getFijos, currentMonthKey, getTopCategories, getPaymentMethods } from "@/lib/queries";
import FijoRow from "./FijoRow";
import NuevoFijoModal from "./NuevoFijoModal";

export const dynamic = "force-dynamic";

export default async function FijosPage() {
  const [fijos, categorias, medios] = await Promise.all([getFijos(), getTopCategories(), getPaymentMethods()]);
  const mesActual = currentMonthKey();

  const pagados = fijos.filter((f) => f.lastPaidMonth === mesActual).length;
  const total = fijos.reduce((s, f) => s + f.amount, 0);

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-semibold">🔁 Fijos</h1>
          <p className="text-muted text-sm mt-1">S/ {total.toFixed(0)} comprometidos este mes · {pagados} de {fijos.length} pagados</p>
        </div>
        <NuevoFijoModal categorias={categorias} medios={medios} />
      </div>

      {fijos.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-10 text-center text-muted text-sm">
          Aún no tienes gastos fijos. Agrega el primero con &quot;+ Nuevo fijo&quot;.
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] overflow-hidden">
          {fijos.map((f, i) => (
            <FijoRow key={f.id} fijo={f} ultimo={i === fijos.length - 1} mesActual={mesActual} />
          ))}
        </div>
      )}
    </div>
  );
}
