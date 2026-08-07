"use client";

import { Download } from "lucide-react";

export default function DescargarCSV({
  filename,
  headers,
  rows,
}: {
  filename: string;
  headers: string[];
  rows: (string | number)[][];
}) {
  function escape(v: string | number) {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }

  function descargar() {
    const csv = [headers, ...rows].map((r) => r.map(escape).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={descargar}
      disabled={rows.length === 0}
      className="text-xs px-3 py-1.5 rounded-lg border border-border hover:border-accent transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:hover:border-border"
    >
      <Download size={13} strokeWidth={1.75} /> Descargar CSV
    </button>
  );
}
