"use client";

import { useEffect, useRef, useState } from "react";
import { Download, ChevronDown } from "lucide-react";

export default function DescargarReporte({
  filename,
  title,
  subtitle,
  headers,
  rows,
}: {
  filename: string;
  title: string;
  subtitle?: string;
  headers: string[];
  rows: (string | number)[][];
}) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [abierto]);

  function escapeCSV(v: string | number) {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }

  function descargarCSV() {
    const csv = [headers, ...rows].map((r) => r.map(escapeCSV).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setAbierto(false);
  }

  async function descargarPDF() {
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);
    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.setTextColor(17, 17, 17);
    doc.text(title, 14, 18);

    if (subtitle) {
      doc.setFontSize(9);
      doc.setTextColor(110, 110, 110);
      doc.text(subtitle, 14, 25);
    }

    autoTable(doc, {
      startY: subtitle ? 30 : 24,
      head: [headers],
      body: rows.map((r) => r.map((v) => String(v))),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [17, 17, 17], textColor: 255 },
      alternateRowStyles: { fillColor: [247, 247, 248] },
      didDrawPage: (data) => {
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `miga · página ${data.pageNumber} de ${pageCount}`,
          14,
          doc.internal.pageSize.getHeight() - 8
        );
      },
    });

    doc.save(`${filename}.pdf`);
    setAbierto(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setAbierto((v) => !v)}
        disabled={rows.length === 0}
        className="text-xs px-3 py-1.5 rounded-lg border border-border hover:border-accent transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:hover:border-border"
      >
        <Download size={13} strokeWidth={1.75} /> Descargar <ChevronDown size={12} strokeWidth={1.75} />
      </button>

      {abierto && (
        <div className="absolute right-0 mt-1 z-20 bg-surface border border-border rounded-lg shadow-[0_4px_12px_rgba(16,24,40,0.08)] py-1 w-28">
          <button onClick={descargarPDF} className="w-full text-left text-xs px-3 py-2 hover:bg-hover transition-colors">
            PDF
          </button>
          <button onClick={descargarCSV} className="w-full text-left text-xs px-3 py-2 hover:bg-hover transition-colors">
            CSV
          </button>
        </div>
      )}
    </div>
  );
}
