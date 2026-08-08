import { getTopCategories, getPaymentMethods, getActivityLog, getSettings } from "@/lib/queries";
import { Settings } from "lucide-react";
import AjustesTabs from "./AjustesTabs";

export const dynamic = "force-dynamic";

export default async function AjustesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; nuevo?: string }>;
}) {
  const { tab, nuevo } = await searchParams;
  const [categorias, medios, historial, settings] = await Promise.all([
    getTopCategories(),
    getPaymentMethods(),
    getActivityLog(),
    getSettings(),
  ]);

  const regla = {
    pctFijos: settings?.pctFijos ?? 60,
    pctVariable: settings?.pctVariable ?? 30,
    pctAhorro: settings?.pctAhorro ?? 10,
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold mb-4 flex items-center gap-2"><Settings size={22} strokeWidth={1.75} />Ajustes</h1>
      <AjustesTabs
        categorias={categorias}
        medios={medios}
        historial={historial}
        tabInicial={tab}
        abrirNuevoMedio={nuevo === "1"}
        regla={regla}
        decimales={settings?.decimales ?? 0}
        alertaTarjetaDefault={settings?.alertaTarjetaDefault ?? 30}
      />
    </div>
  );
}
