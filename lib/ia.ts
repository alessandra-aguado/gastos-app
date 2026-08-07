"use server";

import { getCategories, getPaymentMethods } from "./queries";

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
        responseFormat: {
          text: {
            mimeType: "application/json",
            schema: RESPONSE_SCHEMA,
          },
        },
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
