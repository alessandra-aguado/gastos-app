"use client";

import { useState, useRef, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Camera, Mic, MessageSquare, PenLine, Square, X, type LucideIcon } from "lucide-react";
import { interpretarFoto, interpretarTexto, type ParsedGasto } from "@/lib/ia";
import { createTransaction } from "@/lib/actions";

type Categoria = { id: string; name: string };
type Medio = { id: string; name: string; type: string };

type Campos = {
  comercio: string;
  monto: string;
  fecha: string;
  categoryId: string;
  paymentMethodId: string;
  notas: string;
  confianza: number | null;
  items: { productName: string; quantity: number; unitPrice: number }[];
};

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

function camposVacios(): Campos {
  return { comercio: "", monto: "", fecha: hoyISO(), categoryId: "", paymentMethodId: "", notas: "", confianza: null, items: [] };
}

function desdeIA(r: ParsedGasto): Campos {
  return {
    comercio: r.comercio || "",
    monto: r.monto ? String(r.monto) : "",
    fecha: r.fecha || hoyISO(),
    categoryId: r.categoryId || "",
    paymentMethodId: r.paymentMethodId || "",
    notas: r.notas || "",
    confianza: r.confianza,
    items: r.items,
  };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      resolve(result.split(",")[1] || "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function CamposEditables({
  campos,
  setCampos,
  categorias,
  medios,
}: {
  campos: Campos;
  setCampos: (c: Campos) => void;
  categorias: Categoria[];
  medios: Medio[];
}) {
  return (
    <div>
      <div className="flex gap-2 mb-2.5">
        <div className="flex-1">
          <label className="text-xs text-muted block mb-1">Comercio</label>
          <input
            value={campos.comercio}
            onChange={(e) => setCampos({ ...campos, comercio: e.target.value })}
            className="w-full border border-border rounded-lg px-3 py-2 bg-surface text-sm"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs text-muted block mb-1">Monto total (S/)</label>
          <input
            type="number"
            step="any"
            value={campos.monto}
            onChange={(e) => setCampos({ ...campos, monto: e.target.value })}
            className="w-full border border-border rounded-lg px-3 py-2 bg-surface text-sm"
          />
        </div>
      </div>
      <div className="flex gap-2 mb-2.5">
        <div className="flex-1">
          <label className="text-xs text-muted block mb-1">Categoría</label>
          <select
            value={campos.categoryId}
            onChange={(e) => setCampos({ ...campos, categoryId: e.target.value })}
            className="w-full border border-border rounded-lg px-3 py-2 bg-surface text-sm"
          >
            <option value="">Selecciona categoría</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="text-xs text-muted block mb-1">Medio de pago</label>
          <select
            value={campos.paymentMethodId}
            onChange={(e) => setCampos({ ...campos, paymentMethodId: e.target.value })}
            className="w-full border border-border rounded-lg px-3 py-2 bg-surface text-sm"
          >
            <option value="">Selecciona medio</option>
            {medios.map((m) => (
              <option key={m.id} value={m.id}>{m.name} · {m.type.replace("_", " ")}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex gap-2 mb-3">
        <div className="flex-1">
          <label className="text-xs text-muted block mb-1">Fecha</label>
          <input
            type="date"
            value={campos.fecha}
            onChange={(e) => setCampos({ ...campos, fecha: e.target.value })}
            className="w-full border border-border rounded-lg px-3 py-2 bg-surface text-sm"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs text-muted block mb-1">Notas</label>
          <input
            value={campos.notas}
            onChange={(e) => setCampos({ ...campos, notas: e.target.value })}
            className="w-full border border-border rounded-lg px-3 py-2 bg-surface text-sm"
          />
        </div>
      </div>

      {campos.items.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-muted mb-1.5">Productos detectados</p>
          <div className="bg-surface border border-border rounded-xl px-3">
            {campos.items.map((it, i) => (
              <div key={i} className={`flex justify-between items-center text-sm py-2 ${i < campos.items.length - 1 ? "border-b border-border" : ""}`}>
                <span>{it.productName}{it.quantity !== 1 ? ` ×${it.quantity}` : ""}</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted">S/ {it.unitPrice.toFixed(2)}</span>
                  <button
                    type="button"
                    onClick={() => setCampos({ ...campos, items: campos.items.filter((_, idx) => idx !== i) })}
                    className="text-muted hover:text-accent"
                  >
                    <X size={13} strokeWidth={1.75} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {campos.confianza !== null && (
        <p className="text-xs text-muted mb-3">
          Confianza de la IA: {campos.confianza}%. Corrige lo que haga falta antes de guardar.
        </p>
      )}
    </div>
  );
}

export default function MetodoSelector({ manual, categorias, medios }: { manual: ReactNode; categorias: Categoria[]; medios: Medio[] }) {
  const router = useRouter();
  const [metodo, setMetodo] = useState<"foto" | "voz" | "texto" | "manual">("manual");

  const [campos, setCampos] = useState<Campos>(camposVacios());
  const [estado, setEstado] = useState<"idle" | "cargando" | "listo" | "error" | "guardando" | "guardado">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [textoLibre, setTextoLibre] = useState("");
  const [transcript, setTranscript] = useState("");
  const [escuchando, setEscuchando] = useState(false);
  const [vozSoportada, setVozSoportada] = useState(true);
  const recognitionRef = useRef<{ start: () => void; stop: () => void } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function cambiarMetodo(m: "foto" | "voz" | "texto" | "manual") {
    setMetodo(m);
    setEstado("idle");
    setErrorMsg(null);
    setCampos(camposVacios());
    setTranscript("");
    setTextoLibre("");
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setEstado("cargando");
    setErrorMsg(null);
    try {
      const base64 = await fileToBase64(file);
      const resultado = await interpretarFoto(base64, file.type || "image/jpeg");
      setCampos(desdeIA(resultado));
      setEstado("listo");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "No se pudo leer la foto.");
      setEstado("error");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function interpretarYPoblar(texto: string) {
    setEstado("cargando");
    setErrorMsg(null);
    try {
      const resultado = await interpretarTexto(texto);
      setCampos(desdeIA(resultado));
      setEstado("listo");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "No se pudo interpretar el texto.");
      setEstado("error");
    }
  }

  function iniciarEscucha() {
    type SpeechRecognitionLike = {
      lang: string;
      interimResults: boolean;
      maxAlternatives: number;
      onresult: ((e: { results: { [i: number]: { [j: number]: { transcript: string } } }; length: number }) => void) | null;
      onerror: (() => void) | null;
      onend: (() => void) | null;
      start: () => void;
      stop: () => void;
    };
    const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) {
      setVozSoportada(false);
      return;
    }
    const r = new SR();
    r.lang = "es-PE";
    r.interimResults = false;
    r.maxAlternatives = 1;
    r.onresult = (e) => {
      let texto = "";
      for (let i = 0; i < e.length; i++) texto += e.results[i][0].transcript + " ";
      texto = texto.trim();
      setTranscript(texto);
      setEscuchando(false);
      if (texto) void interpretarYPoblar(texto);
    };
    r.onerror = () => {
      setEscuchando(false);
      setErrorMsg("No se pudo escuchar. Intenta de nuevo o usa Texto.");
      setEstado("error");
    };
    r.onend = () => setEscuchando(false);
    recognitionRef.current = r;
    setTranscript("");
    setEstado("idle");
    setEscuchando(true);
    r.start();
  }

  function detenerEscucha() {
    recognitionRef.current?.stop();
    setEscuchando(false);
  }

  async function guardar() {
    if (!campos.monto || parseFloat(campos.monto) <= 0) {
      setErrorMsg("Falta el monto.");
      return;
    }
    if (!campos.categoryId || !campos.paymentMethodId) {
      setErrorMsg("Falta elegir categoría y/o medio de pago.");
      return;
    }
    setEstado("guardando");
    setErrorMsg(null);
    const fd = new FormData();
    fd.set("amount", campos.monto);
    fd.set("date", campos.fecha || hoyISO());
    fd.set("categoryId", campos.categoryId);
    fd.set("paymentMethodId", campos.paymentMethodId);
    fd.set("merchant", campos.comercio);
    fd.set("notes", campos.notas);
    fd.set("source", metodo === "manual" ? "manual" : metodo);
    if (campos.items.length > 0) fd.set("items", JSON.stringify(campos.items));
    if (campos.confianza !== null) fd.set("aiConfidence", String(campos.confianza));
    try {
      await createTransaction(fd);
      setEstado("guardado");
      setCampos(camposVacios());
      setTranscript("");
      setTextoLibre("");
      router.refresh();
      setTimeout(() => setEstado("idle"), 2500);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "No se pudo guardar.");
      setEstado("error");
    }
  }

  const metodos: { id: "foto" | "voz" | "texto" | "manual"; label: string; Icon: LucideIcon }[] = [
    { id: "foto", label: "Foto", Icon: Camera },
    { id: "voz", label: "Voz", Icon: Mic },
    { id: "texto", label: "Texto", Icon: MessageSquare },
    { id: "manual", label: "Manual", Icon: PenLine },
  ];

  const cats = categorias;
  const meds = medios;

  return (
    <div>
      <div className="flex gap-2 mb-6">
        {metodos.map((m) => (
          <button
            key={m.id}
            onClick={() => cambiarMetodo(m.id)}
            className={`flex-1 text-xs py-2.5 rounded-xl border flex flex-col items-center gap-1 ${
              metodo === m.id ? "bg-accent-soft text-accent border-accent" : "border-border text-muted"
            }`}
          >
            <m.Icon size={18} strokeWidth={1.75} />
            {m.label}
          </button>
        ))}
      </div>

      {metodo === "foto" && (
        <div>
          {estado === "idle" && (
            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl py-8 mb-3 cursor-pointer text-muted hover:border-accent hover:text-accent transition-colors">
              <Camera size={22} strokeWidth={1.5} />
              <span className="text-sm">Toma o sube una foto del recibo</span>
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
            </label>
          )}
          {estado === "cargando" && (
            <div className="flex flex-col items-center justify-center gap-2 py-8 mb-3 text-muted">
              <span className="text-sm">Leyendo el recibo con IA...</span>
            </div>
          )}
          {(estado === "listo" || estado === "guardando" || estado === "error") && (
            <>
              {estado !== "error" && (
                <div className="bg-positive-soft rounded-xl px-3 py-2.5 flex items-center gap-2 mb-4">
                  <span className="text-positive">✓</span>
                  <span className="text-xs text-positive">Leído con IA{campos.confianza !== null ? `, confianza ${campos.confianza}%` : ""}</span>
                </div>
              )}
              <CamposEditables campos={campos} setCampos={setCampos} categorias={cats} medios={meds} />
              {errorMsg && <p className="text-xs text-accent mb-2">{errorMsg}</p>}
              <button onClick={guardar} disabled={estado === "guardando"} className="w-full py-2.5 bg-accent text-white rounded-lg text-sm font-medium disabled:opacity-60">
                {estado === "guardando" ? "Guardando..." : "Guardar"}
              </button>
              <button onClick={() => cambiarMetodo("foto")} className="w-full py-2 text-xs text-muted mt-2">Tomar otra foto</button>
            </>
          )}
          {estado === "guardado" && <p className="text-sm text-positive text-center py-3">✓ Gasto guardado</p>}
        </div>
      )}

      {metodo === "voz" && (
        <div>
          {!vozSoportada && (
            <p className="text-xs text-muted mb-3">Tu navegador no soporta reconocimiento de voz. Prueba con &quot;Texto&quot; en su lugar.</p>
          )}
          {vozSoportada && (estado === "idle" || estado === "cargando") && (
            <div className="flex flex-col items-center py-4 mb-3">
              <button
                onClick={escuchando ? detenerEscucha : iniciarEscucha}
                disabled={estado === "cargando"}
                className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 text-white ${escuchando ? "bg-accent animate-pulse" : "bg-accent"}`}
              >
                {escuchando ? <Square size={18} strokeWidth={1.75} /> : <Mic size={20} strokeWidth={1.75} />}
              </button>
              <p className="text-xs text-muted">
                {estado === "cargando" ? "Interpretando..." : escuchando ? "Escuchando... toca para detener" : "Toca para hablar"}
              </p>
              {transcript && <div className="bg-background rounded-xl px-3 py-2.5 text-sm italic mt-3 w-full">&quot;{transcript}&quot;</div>}
            </div>
          )}
          {(estado === "listo" || estado === "guardando" || estado === "error") && (
            <>
              {transcript && <div className="bg-background rounded-xl px-3 py-2.5 text-sm italic mb-3.5">&quot;{transcript}&quot;</div>}
              <CamposEditables campos={campos} setCampos={setCampos} categorias={cats} medios={meds} />
              {errorMsg && <p className="text-xs text-accent mb-2">{errorMsg}</p>}
              <button onClick={guardar} disabled={estado === "guardando"} className="w-full py-2.5 bg-accent text-white rounded-full text-sm font-medium disabled:opacity-60">
                {estado === "guardando" ? "Guardando..." : "Guardar"}
              </button>
              <button onClick={() => cambiarMetodo("voz")} className="w-full py-2 text-xs text-muted mt-2">Grabar de nuevo</button>
            </>
          )}
          {estado === "guardado" && <p className="text-sm text-positive text-center py-3">✓ Gasto guardado</p>}
        </div>
      )}

      {metodo === "texto" && (
        <div>
          {(estado === "idle" || estado === "cargando") && (
            <>
              <label className="text-xs text-muted block mb-1">Escribe qué gastaste</label>
              <textarea
                value={textoLibre}
                onChange={(e) => setTextoLibre(e.target.value)}
                placeholder="Compré pan y leche en Tottus por 18 soles"
                className="w-full border border-border rounded-lg px-3 py-2 bg-surface text-sm mb-3 h-16"
              />
              <p className="text-xs text-muted mb-3">La IA lo lee y te pre-llena los campos. Revisas y guardas.</p>
              <button
                onClick={() => textoLibre.trim() && interpretarYPoblar(textoLibre.trim())}
                disabled={estado === "cargando" || !textoLibre.trim()}
                className="w-full py-2.5 bg-accent text-white rounded-full text-sm font-medium disabled:opacity-60"
              >
                {estado === "cargando" ? "Interpretando..." : "Interpretar"}
              </button>
            </>
          )}
          {(estado === "listo" || estado === "guardando" || estado === "error") && (
            <>
              <CamposEditables campos={campos} setCampos={setCampos} categorias={cats} medios={meds} />
              {errorMsg && <p className="text-xs text-accent mb-2">{errorMsg}</p>}
              <button onClick={guardar} disabled={estado === "guardando"} className="w-full py-2.5 bg-accent text-white rounded-full text-sm font-medium disabled:opacity-60">
                {estado === "guardando" ? "Guardando..." : "Guardar"}
              </button>
              <button onClick={() => cambiarMetodo("texto")} className="w-full py-2 text-xs text-muted mt-2">Escribir otro</button>
            </>
          )}
          {estado === "guardado" && <p className="text-sm text-positive text-center py-3">✓ Gasto guardado</p>}
        </div>
      )}

      {metodo === "manual" && manual}
    </div>
  );
}
