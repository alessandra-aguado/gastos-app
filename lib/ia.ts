"use server";

import {
  getCategories,
  getPaymentMethods,
  getSettings,
  getMonthTransactions,
  monthRangeFromKey,
  currentMonthKey,
  getBudgets,
  getDeudas,
  getMetas,
  getFijos,
  getCuentas,
  getSavingsPlan,
  getDebtPaymentPlans,
  getAhorroSummary,
} from "./queries";

const GEMINI_MODEL = "gemini-3.6-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export type ParsedGasto = {
  comercio: string | null;
  monto: number;
  fecha: string | null;
  categoryId: string | null;
  paymentMethodId: string | null;
  notas: string | null;
  confianza: number;
  items: { productName: string; quantity: number; unitPrice: number }[];
};

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    comercio: { type: "string", description: "Nombre del comercio/negocio si se identifica. Cadena vacía si no aplica." },
    monto: { type: "number", description: "Monto TOTAL del gasto en soles (número positivo, sin el símbolo S/)." },
    fecha: { type: "string", description: "Fecha del gasto en formato YYYY-MM-DD si se menciona o aparece; cadena vacía si no se sabe." },
    categoryId: { type: "string", description: "El id exacto de la categoría más adecuada, tomado de la lista dada. Cadena vacía si ninguna aplica con certeza." },
    paymentMethodId: { type: "string", description: "El id exacto del medio de pago, tomado de la lista dada, SOLO si se menciona o es evidente. Cadena vacía si no se sabe." },
    notas: { type: "string", description: "Nota breve y útil (con quién, para qué, detalle relevante). Cadena vacía si no hay nada que anotar." },
    confianza: { type: "integer", minimum: 0, maximum: 100, description: "Qué tan seguro estás de la extracción en general, 0-100." },
    items: {
      type: "array",
      description: "Productos individuales detectados (solo si es un recibo/boleta detallado). Vacío si no aplica.",
      items: {
        type: "object",
        properties: {
          productName: { type: "string" },
          quantity: { type: "number" },
          unitPrice: { type: "number", description: "Precio unitario o precio de línea en soles." },
        },
        required: ["productName", "unitPrice"],
      },
    },
  },
  required: ["comercio", "monto", "fecha", "categoryId", "paymentMethodId", "notas", "confianza", "items"],
};

async function construirContexto() {
  const [categorias, medios] = await Promise.all([getCategories(), getPaymentMethods()]);

  const listaCategorias = categorias
    .map((c) => `- id="${c.id}": ${c.name}${c.description ? ` (${c.description})` : ""}`)
    .join("\n");

  const listaMedios = medios
    .map((m) => `- id="${m.id}": ${m.name} · ${m.type.replace("_", " ")}`)
    .join("\n");

  return { categorias, medios, listaCategorias, listaMedios };
}

function construirPrompt(listaCategorias: string, listaMedios: string, modo: "foto" | "texto") {
  const hoy = new Date().toISOString().slice(0, 10);
  const instruccionEntrada =
    modo === "foto"
      ? "Analiza la imagen adjunta de un recibo, boleta o factura de un gasto personal."
      : "Analiza el siguiente texto (puede venir de una transcripción de voz) donde alguien describe un gasto que hizo.";

  return `Eres un asistente que ayuda a Ale a registrar gastos personales en su app de finanzas. ${instruccionEntrada}
Hoy es ${hoy}.

Extrae los datos del GASTO (no de préstamos que da ni ingresos). Devuelve el monto TOTAL pagado, no subtotales.

Categorías disponibles (usa el id exacto, o cadena vacía si ninguna calza con certeza):
${listaCategorias}

Medios de pago disponibles (usa el id exacto SOLO si el texto/imagen lo menciona o es evidente por contexto; si no, cadena vacía):
${listaMedios}

Si el texto describe un préstamo que Ale da a otra persona (plata que se espera que regrese), NO lo trates como gasto normal: pon confianza baja (≤30) y explica brevemente en 'notas' que esto parece un préstamo y debería registrarse en la sección de Deuda, no aquí.`;
}

async function llamarGemini(parts: Record<string, unknown>[], prompt: string): Promise<ParsedGasto> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Falta configurar GEMINI_API_KEY en las variables de entorno.");
  }

  const res = await fetch(GEMINI_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }, ...parts] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    }),
  });

  if (!res.ok) {
    const detalle = await res.text().catch(() => "");
    throw new Error(`Gemini respondió ${res.status}: ${detalle.slice(0, 300)}`);
  }

  const data = await res.json();
  const texto = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!texto) {
    throw new Error("Gemini no devolvió contenido interpretable.");
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(texto);
  } catch {
    throw new Error("La respuesta de Gemini no fue un JSON válido.");
  }

  return normalizar(parsed);
}

function normalizar(raw: Record<string, unknown>): ParsedGasto {
  const itemsRaw = Array.isArray(raw.items) ? raw.items : [];
  return {
    comercio: typeof raw.comercio === "string" && raw.comercio.trim() ? raw.comercio.trim() : null,
    monto: typeof raw.monto === "number" && raw.monto > 0 ? raw.monto : 0,
    fecha: typeof raw.fecha === "string" && raw.fecha.trim() ? raw.fecha.trim() : null,
    categoryId: typeof raw.categoryId === "string" && raw.categoryId.trim() ? raw.categoryId.trim() : null,
    paymentMethodId: typeof raw.paymentMethodId === "string" && raw.paymentMethodId.trim() ? raw.paymentMethodId.trim() : null,
    notas: typeof raw.notas === "string" && raw.notas.trim() ? raw.notas.trim() : null,
    confianza: typeof raw.confianza === "number" ? Math.max(0, Math.min(100, Math.round(raw.confianza))) : 50,
    items: itemsRaw
      .filter((it): it is Record<string, unknown> => !!it && typeof it === "object")
      .map((it) => ({
        productName: typeof it.productName === "string" ? it.productName : "Producto",
        quantity: typeof it.quantity === "number" && it.quantity > 0 ? it.quantity : 1,
        unitPrice: typeof it.unitPrice === "number" ? it.unitPrice : 0,
      }))
      .filter((it) => it.unitPrice > 0),
  };
}

export async function interpretarFoto(imagenBase64: string, mimeType: string): Promise<ParsedGasto> {
  const { listaCategorias, listaMedios } = await construirContexto();
  const prompt = construirPrompt(listaCategorias, listaMedios, "foto");
  return llamarGemini([{ inlineData: { mimeType, data: imagenBase64 } }], prompt);
}

export async function interpretarTexto(texto: string): Promise<ParsedGasto> {
  const { listaCategorias, listaMedios } = await construirContexto();
  const prompt = construirPrompt(listaCategorias, listaMedios, "texto") + `\n\nTexto del usuario:\n"""${texto}"""`;
  return llamarGemini([], prompt);
}


// ================= Asistencia IA (chat conversacional) =================

function fmt(n: number) {
  return n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function construirContextoFinanciero(): Promise<string> {
  const mesActual = currentMonthKey();
  const monthRange = monthRangeFromKey(mesActual);

  const [
    settings,
    transacciones,
    budgets,
    categorias,
    deudas,
    metas,
    fijos,
    cuentas,
    savingsPlan,
    planesPago,
    ahorroSummary,
  ] = await Promise.all([
    getSettings(),
    getMonthTransactions(monthRange),
    getBudgets(),
    getCategories(),
    getDeudas(),
    getMetas(),
    getFijos(),
    getCuentas(),
    getSavingsPlan(mesActual),
    getDebtPaymentPlans([mesActual]),
    getAhorroSummary(),
  ]);
  const nombreCategoriaPorId: Record<string, string> = {};
  for (const c of categorias) nombreCategoriaPorId[c.id] = c.name;

  const totalGastado = transacciones.reduce((s, t) => s + t.amount, 0);
  const porCategoria: Record<string, number> = {};
  for (const t of transacciones) {
    const nombre = t.category?.name || "Sin categoría";
    porCategoria[nombre] = (porCategoria[nombre] || 0) + t.amount;
  }
  const categoriasTexto = Object.entries(porCategoria)
    .sort((a, b) => b[1] - a[1])
    .map(([nombre, monto]) => `  - ${nombre}: S/ ${fmt(monto)}`)
    .join("\n") || "  (sin gastos registrados este mes)";

  const topGastos = [...transacciones]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map((t) => `  - S/ ${fmt(t.amount)} en ${t.merchant || t.category?.name || "gasto"} (${t.category?.name || "sin categoría"}), ${new Date(t.date).toLocaleDateString("es-PE")}, pagado con ${t.paymentMethod?.name || "medio no indicado"}`)
    .join("\n") || "  (ninguno)";

  const limitesTexto = budgets.length
    ? budgets
        .map((b) => {
          const nombreCat = nombreCategoriaPorId[b.categoryId] || "categoría";
          const gastado = porCategoria[nombreCat] ?? 0;
          return `  - ${nombreCat}: límite S/ ${fmt(b.amountLimit)}, gastado hasta ahora S/ ${fmt(gastado)}`;
        })
        .join("\n")
    : "  (sin límites de presupuesto definidos)";

  const planPorDeuda: Record<string, number> = {};
  for (const p of planesPago) planPorDeuda[p.debtId] = p.amount;
  const deudasActivas = deudas.filter((d) => d.status !== "pagada");
  const deudasTexto = deudasActivas.length
    ? deudasActivas
        .map((d) => {
          const pago = planPorDeuda[d.id] ?? d.minPayment ?? 0;
          const tipo = d.type === "tarjeta_credito" ? "tarjeta de crédito" : "préstamo personal";
          const limite = d.creditLimit ? `, línea de crédito S/ ${fmt(d.creditLimit)}` : "";
          return `  - ${d.counterpartName || tipo} (${tipo}): debe S/ ${fmt(d.balance)}${limite}, pago previsto este mes S/ ${fmt(pago)}`;
        })
        .join("\n")
    : "  (sin deudas activas)";

  const metasTexto = metas.length
    ? metas
        .map((m) => `  - "${m.name}": S/ ${fmt(m.currentAmount)} de S/ ${fmt(m.targetAmount)} (${Math.round((m.currentAmount / m.targetAmount) * 100)}%)${m.status === "completada" ? " · cumplida" : ""}`)
        .join("\n")
    : "  (sin metas de ahorro creadas)";

  const fijosTexto = fijos.length
    ? fijos.map((f) => `  - ${f.name || f.category?.name || "fijo"}: S/ ${fmt(f.amount)}/mes`).join("\n")
    : "  (sin gastos fijos registrados)";
  const totalFijos = fijos.reduce((s, f) => s + f.amount, 0);

  const cuentasTexto = cuentas.length
    ? cuentas.map((c) => `  - ${c.name} (${c.bank || c.type}): S/ ${fmt(c.balance)}`).join("\n")
    : "  (sin cuentas registradas)";
  const totalCuentas = cuentas.filter((c) => c.type !== "puntos" && c.type !== "custodia").reduce((s, c) => s + c.balance, 0);

  const ingresoMensual = settings?.monthlyIncome ?? null;
  const disponible = ingresoMensual !== null ? ingresoMensual - totalFijos - Object.values(planPorDeuda).reduce((s, v) => s + v, 0) : null;

  return `Fecha de hoy: ${new Date().toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" })}
Mes actual: ${mesActual}

INGRESO Y DISPONIBLE:
  - Ingreso mensual configurado: ${ingresoMensual !== null ? `S/ ${fmt(ingresoMensual)}` : "no está definido"}
  - Disponible estimado (ingreso menos fijos y cuotas de deuda de este mes): ${disponible !== null ? `S/ ${fmt(disponible)}` : "no se puede calcular sin ingreso mensual"}

GASTOS DE ESTE MES (total S/ ${fmt(totalGastado)}, ${transacciones.length} transacciones):
Por categoría:
${categoriasTexto}
Los 5 gastos más caros del mes:
${topGastos}

LÍMITES DE PRESUPUESTO POR CATEGORÍA ESTE MES:
${limitesTexto}

GASTOS FIJOS MENSUALES (total S/ ${fmt(totalFijos)}):
${fijosTexto}

DEUDAS ACTIVAS:
${deudasTexto}

METAS DE AHORRO:
${metasTexto}

RESUMEN DE AHORRO E INVERSIÓN ACUMULADO: colchón de emergencia S/ ${fmt(ahorroSummary.colchon)}, metas S/ ${fmt(ahorroSummary.totalMetas)}, inversiones S/ ${fmt(ahorroSummary.totalInversiones)}
Plan de ahorro/inversión para este mes: ${savingsPlan ? `S/ ${fmt(savingsPlan.totalAmount)}` : "no definido"}

CUENTAS Y SALDOS (patrimonio líquido total S/ ${fmt(totalCuentas)}):
${cuentasTexto}`;
}

export type MensajeChat = { rol: "usuario" | "ia"; texto: string };

export async function preguntarAsistente(pregunta: string, historial: MensajeChat[]): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Falta configurar GEMINI_API_KEY en las variables de entorno.");
  }

  const contexto = await construirContextoFinanciero();

  const systemPrompt = `Eres el asistente financiero personal de Ale, integrado dentro de su app de finanzas personales "miga". Tu trabajo es responder sus preguntas sobre SU dinero usando exclusivamente los datos reales de abajo — nunca inventes cifras que no estén ahí.

${contexto}

Instrucciones de estilo:
- Responde en español, tuteando a Ale, de forma breve y directa (2-4 oraciones normalmente, salvo que la pregunta pida un desglose).
- Basa cada número que des en los datos de arriba. Si no tienes el dato para responder con certeza, dilo claramente en vez de inventar o asumir.
- Si la pregunta es sobre si "le alcanza" para algo, usa el disponible estimado y sé realista, mencionando supuestos si los hay.
- No repitas de vuelta toda la lista de datos — ve directo a responder.`;

  const contents = [
    ...historial.map((m) => ({ role: m.rol === "usuario" ? "user" : "model", parts: [{ text: m.texto }] })),
    { role: "user", parts: [{ text: pregunta }] },
  ];

  const res = await fetch(GEMINI_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: { temperature: 0.4 },
    }),
  });

  if (!res.ok) {
    const detalle = await res.text().catch(() => "");
    throw new Error(`Gemini respondió ${res.status}: ${detalle.slice(0, 300)}`);
  }

  const data = await res.json();
  const texto = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!texto || typeof texto !== "string") {
    throw new Error("Gemini no devolvió una respuesta interpretable.");
  }
  return texto.trim();
}
