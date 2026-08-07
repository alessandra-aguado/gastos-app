import { getTopCategories, getPaymentMethods } from "@/lib/queries";
import { Settings } from "lucide-react";
import AjustesTabs from "./AjustesTabs";

export const dynamic = "force-dynamic";

export default async function AjustesPage() {
  const [categorias, medios] = await Promise.all([getTopCategories(), getPaymentMethods()]);

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold mb-4 flex items-center gap-2"><Settings size={22} strokeWidth={1.75} />Ajustes</h1>
      <AjustesTabs categorias={categorias} medios={medios} />
    </div>
  );
}
