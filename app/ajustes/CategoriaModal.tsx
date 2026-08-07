"use client";

import { useMemo, useRef, useState } from "react";
import { createCategoria, updateCategoria } from "@/lib/actions";
import { CATEGORY_ICONS } from "@/lib/categoryIcons";
import { PASTEL_PRESETS } from "@/lib/categoryColors";

type Categoria = { id: string; name: string; icon: string | null; color: string | null; description: string | null };

export default function CategoriaModal({
  categoria,
  onClose,
}: {
  categoria: Categoria | null;
  onClose: () => void;
}) {
  const esEdicion = !!categoria;
  const [nombre, setNombre] = useState(categoria?.name || "");
  const [busqueda, setBusqueda] = useState("");
  const [iconoSeleccionado, setIconoSeleccionado] = useState(categoria?.icon || "utensils");
  const [color, setColor] = useState(categoria?.color || PASTEL_PRESETS[0].hex);
  const esPresetInicial = PASTEL_PRESETS.some((p) => p.hex === categoria?.color);
  const [colorPersonalizado, setColorPersonalizado] = useState<string | null>(
    categoria?.color && !esPresetInicial ? categoria.color : null
  );
  const colorInputRef = useRef<HTMLInputElement>(null);

  const normalizar = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const iconosFiltrados = useMemo(() => {
    const q = normalizar(busqueda.trim());
    if (!q) return CATEGORY_ICONS;
    return CATEGORY_ICONS.filter((i) => normalizar(i.label).includes(q) || i.name.includes(q));
  }, [busqueda]);

  const IconoPreview = CATEGORY_ICONS.find((i) => i.name === iconoSeleccionado)?.Icon;

  return (
    <div className="fixed inset-0 bg-black/45 flex items-center justify-center p-5 z-50" onClick={onClose}>
      <form
        action={async (fd) => {
          if (esEdicion) {
            fd.set("id", categoria!.id);
            await updateCategoria(fd);
          } else {
            await createCategoria(fd);
          }
          onClose();
        }}
        className="w-[420px] bg-surface rounded-2xl p-6 max-h-[88vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5">
          <span className="text-base font-semibold">{esEdicion ? "Editar categoría" : "Nueva categoría"}</span>
          <button type="button" onClick={onClose} className="text-muted">✕</button>
        </div>

        <input type="hidden" name="icon" value={iconoSeleccionado} />
        <input type="hidden" name="color" value={color} />

        <label className="text-xs text-muted block mb-1.5">Nombre de categoría</label>
        <input
          name="name"
          required
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Comida"
          className="w-full border border-border rounded-lg px-3.5 py-2.5 bg-background text-sm mb-4"
        />

        <label className="text-xs text-muted block mb-1.5">Ícono</label>
        <div className="border border-border rounded-xl p-2 mb-4">
          <div className="flex items-center gap-2 border border-border rounded-lg px-3 py-2 mb-2 bg-background">
            <span className="text-muted">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            </span>
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar ícono..."
              className="flex-1 bg-transparent text-sm outline-none"
            />
          </div>
          <div className="grid grid-cols-8 gap-1 max-h-[140px] overflow-y-auto">
            {iconosFiltrados.length === 0 ? (
              <p className="col-span-8 text-xs text-muted text-center py-4">Sin resultados para &quot;{busqueda}&quot;</p>
            ) : (
              iconosFiltrados.map(({ name, Icon, label }) => (
                <button
                  key={name}
                  type="button"
                  title={label}
                  onClick={() => setIconoSeleccionado(name)}
                  className={`aspect-square flex items-center justify-center rounded-lg border ${
                    iconoSeleccionado === name ? "border-accent bg-accent-soft" : "border-transparent hover:bg-hover"
                  }`}
                >
                  <Icon size={18} strokeWidth={1.75} />
                </button>
              ))
            )}
          </div>
        </div>

        <label className="text-xs text-muted block mb-1.5">Color</label>
        <div className="flex items-center gap-2 mb-4">
          {PASTEL_PRESETS.map((p) => (
            <button
              key={p.hex}
              type="button"
              title={p.name}
              onClick={() => { setColor(p.hex); setColorPersonalizado(null); }}
              className="w-8 h-8 rounded-lg"
              style={{
                background: p.hex,
                border: color === p.hex && !colorPersonalizado ? "2px solid var(--foreground)" : "1px solid var(--border)",
              }}
            />
          ))}
          <button
            type="button"
            title="Color personalizado"
            onClick={() => colorInputRef.current?.click()}
            className="w-8 h-8 rounded-lg relative overflow-hidden"
            style={{
              background: colorPersonalizado || "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)",
              border: colorPersonalizado ? "2px solid var(--foreground)" : "1px solid var(--border)",
            }}
          >
            <input
              ref={colorInputRef}
              type="color"
              value={colorPersonalizado || "#888888"}
              onChange={(e) => { setColorPersonalizado(e.target.value); setColor(e.target.value); }}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </button>
        </div>

        <label className="text-xs text-muted block mb-1.5">Vista previa</label>
        <div className="flex items-center gap-3 border border-border rounded-xl p-3 mb-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: color }}>
            {IconoPreview && <IconoPreview size={18} strokeWidth={1.75} className="text-foreground" />}
          </div>
          <div>
            <p className="text-[10px] text-muted uppercase tracking-wide">Categoría</p>
            <p className="text-sm font-medium">{nombre || "Nombre de la categoría"}</p>
          </div>
        </div>

        <label className="text-xs text-muted block mb-1.5">Descripción para la IA (opcional)</label>
        <textarea
          name="description"
          defaultValue={categoria?.description || ""}
          placeholder="Qué tipo de compras van aquí..."
          className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-5 h-16"
        />

        <button className="w-full py-3 bg-accent text-white rounded-lg text-sm font-medium">
          {esEdicion ? "Guardar cambios" : "Crear categoría"}
        </button>
      </form>
    </div>
  );
}
