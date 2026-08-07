"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  ShoppingCart,
  PieChart,
  Target,
  TrendingUp,
  Wallet,
  CreditCard,
  Repeat,
  Sparkles,
  Gift,
  Settings,
  type LucideIcon,
} from "lucide-react";

const sections: { href: string; icon: LucideIcon; label: string }[] = [
  { href: "/", icon: Home, label: "Inicio" },
  { href: "/gastos", icon: ShoppingCart, label: "Gastos" },
  { href: "/presupuesto", icon: PieChart, label: "Presupuesto" },
  { href: "/metas", icon: Target, label: "Metas" },
  { href: "/inversiones", icon: TrendingUp, label: "Inversiones" },
  { href: "/cuentas", icon: Wallet, label: "Cuentas" },
  { href: "/debo", icon: CreditCard, label: "Debo" },
  { href: "/fijos", icon: Repeat, label: "Fijos" },
  { href: "/asistencia-ia", icon: Sparkles, label: "Asistencia IA" },
  { href: "/deseos", icon: Gift, label: "Deseos" },
  { href: "/ajustes", icon: Settings, label: "Ajustes" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 border-r border-border bg-sidebar min-h-screen px-3 py-6 hidden md:flex md:flex-col gap-1">
      <div className="px-3 pb-6">
        <p className="text-sm font-semibold text-foreground">Mis Gastos</p>
        <p className="text-xs text-muted">Hola, Ale 👋</p>
      </div>
      {sections.map((s) => {
        const active = pathname === s.href;
        const Icon = s.icon;
        return (
          <Link
            key={s.href}
            href={s.href}
            className={`flex items-center gap-3 px-3 h-10 rounded-lg text-[13px] font-medium transition-colors ${
              active
                ? "bg-accent-soft text-accent"
                : "text-foreground/80 hover:bg-hover"
            }`}
          >
            <Icon size={18} strokeWidth={2} className={active ? "text-accent" : "text-muted"} />
            <span>{s.label}</span>
          </Link>
        );
      })}
    </aside>
  );
}
