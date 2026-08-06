import { createTransaction } from "@/lib/actions";
import { getTopCategories, getPaymentMethods } from "@/lib/queries";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function RegistrarPage() {
  const categories = await getTopCategories();
  const paymentMethods = await getPaymentMethods();
  const today = new Date().toISOString().slice(0, 10);

  async function action(formData: FormData) {
    "use server";
    await createTransaction(formData);
    redirect("/");
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold">+ Registrar gasto</h1>
      <p className="text-muted text-sm mt-1">
        Entrada manual (Fase 1). Foto, voz y texto libre llegan en fases siguientes.
      </p>

      <form action={action} className="mt-8 space-y-5">
        <div>
          <label className="text-sm font-medium block mb-1">Monto (S/)</label>
          <input
            name="amount"
            type="number"
            step="0.01"
            required
            className="w-full border border-border rounded-xl px-4 py-2.5 bg-surface"
            placeholder="45.00"
          />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Fecha</label>
          <input
            name="date"
            type="date"
            required
            defaultValue={today}
            className="w-full border border-border rounded-xl px-4 py-2.5 bg-surface"
          />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Categoría</label>
          <select
            name="categoryId"
            required
            className="w-full border border-border rounded-xl px-4 py-2.5 bg-surface"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Medio de pago</label>
          <select
            name="paymentMethodId"
            required
            className="w-full border border-border rounded-xl px-4 py-2.5 bg-surface"
          >
            {paymentMethods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Comercio (opcional)</label>
          <input
            name="merchant"
            type="text"
            className="w-full border border-border rounded-xl px-4 py-2.5 bg-surface"
            placeholder="Candy, Metro, Uber..."
          />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Notas (opcional)</label>
          <textarea
            name="notes"
            className="w-full border border-border rounded-xl px-4 py-2.5 bg-surface"
            rows={2}
          />
        </div>

        <button
          type="submit"
          className="w-full bg-accent text-white font-medium py-3 rounded-full hover:opacity-90 transition-opacity"
        >
          Guardar gasto
        </button>
      </form>
    </div>
  );
}
