import { getTopCategories, getPaymentMethods, getActivityLog, getSettings } from "@/lib/queries";
import { Settings } from "lucide-react";
import AjustesTabs from "./AjustesTabs";
import ReglaIngresoField from "./ReglaIngresoField";
import FormatoMontoField from "./FormatoMontoField";
import AlertaTarjetaField from "./AlertaTarjetaField";

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
      <ReglaIngresoField regla={regla} />
      <FormatoMontoField decimales={settings?.decimales ?? 0} />
      <AlertaTarjetaField alertaTarjetaDefault={settings?.alertaTarjetaDefault ?? 30} />
      <AjustesTabs categorias={categorias} medios={medios} historial={historial} tabInicial={tab} abrirNuevoMedio={nuevo === "1"} />
    </div>
  );
}
