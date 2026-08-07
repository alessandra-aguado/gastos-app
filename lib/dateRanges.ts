export type Preset = "semana" | "15dias" | "mes" | "3meses" | "personalizado";

export const PRESETS: Preset[] = ["semana", "15dias", "mes", "3meses"];

export const PRESET_LABELS: Record<Preset, string> = {
  semana: "Esta semana",
  "15dias": "Últimos 15 días",
  mes: "Último mes",
  "3meses": "Últimos 3 meses",
  personalizado: "Personalizado",
};

const DIAS_POR_PRESET: Record<"semana" | "15dias" | "mes" | "3meses", number> = {
  semana: 7,
  "15dias": 15,
  mes: 30,
  "3meses": 90,
};

function fechaLocal(str: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str);
  if (!m) return null;
  const [, y, mo, d] = m;
  return new Date(Number(y), Number(mo) - 1, Number(d));
}

export function rangeForPreset(preset: Preset, desde?: string, hasta?: string): { start: Date; end: Date } {
  const now = new Date();
  const manana = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  if (preset === "personalizado") {
    const start = desde ? fechaLocal(desde) : null;
    const finRaw = hasta ? fechaLocal(hasta) : null;
    if (start && finRaw) {
      const end = new Date(finRaw.getFullYear(), finRaw.getMonth(), finRaw.getDate() + 1);
      return { start, end };
    }
    // Sin fechas válidas, cae a últimos 30 días.
    return { start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29), end: manana };
  }

  const dias = DIAS_POR_PRESET[preset];
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (dias - 1));
  return { start, end: manana };
}

export function parsePreset(v: string | undefined): Preset {
  if (v === "semana" || v === "15dias" || v === "mes" || v === "3meses" || v === "personalizado") return v;
  return "mes";
}

export function formatRangeLabel(preset: Preset, start: Date, end: Date): string {
  if (preset !== "personalizado") return PRESET_LABELS[preset];
  const fin = new Date(end.getFullYear(), end.getMonth(), end.getDate() - 1);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  return `${start.toLocaleDateString("es-PE", opts)} – ${fin.toLocaleDateString("es-PE", opts)}`;
}

export function toDateInputValue(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
