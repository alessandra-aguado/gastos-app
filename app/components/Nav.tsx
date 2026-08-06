"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const sections = [
  { href: "/", icon: "🏠", label: "Inicio" },
  { href: "/gastos", icon: "🛒", label: "Gastos" },
  { href: "/presupuesto", icon: "📊", label: "Presupuesto" },
  { href: "/metas", icon: "🎯", label: "Metas" },
  { href: "/inversiones", icon: "📈", label: "Inversiones" },
  { href: "/debo", icon: "💳", label: "Debo" },
  { href: "/fijos", icon: "🔁", label: "Fijos" },
  { href: "/asistencia-ia", icon: "🤖", label: "Asistencia IA" },
  { href: "/deseos", icon: "✨", label: "Deseos" },
  { href: "/ajustes", icon: "⚙️", label: "Ajustes" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 border-r border-border bg-surface min-h-screen px-3 py-6 hidden md:flex md:flex-col gap-1">
      <div className="px-3 pb-6">
        <p className="text-sm font-semibold text-foreground">Mis Gastos</p>
        <p className="text-xs text-muted">Hola, Ale 👋</p>
      </div>
      {sections.map((s) => {
        const active = pathname === s.href;
        return (
          <Link
            key={s.href}
            href={s.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
              active
                ? "bg-accent-soft text-accent font-medium"
                : "text-foreground/80 hover:bg-background"
            }`}
          >
            <span className="text-base">{s.icon}</span>
            <span>{s.label}</span>
          </Link>
        );
      })}
    </aside>
  );
}
