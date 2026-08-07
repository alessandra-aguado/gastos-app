"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Home,
  ShoppingCart,
  CircleDollarSign,
  PieChart,
  PiggyBank,
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

const topSections: { href: string; icon: LucideIcon; label: string }[] = [
  { href: "/", icon: Home, label: "Inicio" },
  { href: "/gastos", icon: ShoppingCart, label: "Gastos" },
  { href: "/ingresos", icon: CircleDollarSign, label: "Ingresos" },
  { href: "/presupuesto", icon: PieChart, label: "Presupuesto" },
];

const ahorroGroup = {
  href: "/ahorro",
  icon: PiggyBank,
  label: "Ahorro",
  children: [
    { href: "/metas", icon: Target, label: "Metas" },
    { href: "/inversiones", icon: TrendingUp, label: "Inversiones" },
  ] as { href: string; icon: LucideIcon; label: string }[],
};

const bottomSections: { href: string; icon: LucideIcon; label: string }[] = [
  { href: "/cuentas", icon: Wallet, label: "Cuentas" },
  { href: "/debo", icon: CreditCard, label: "Deuda" },
  { href: "/fijos", icon: Repeat, label: "Fijos" },
  { href: "/asistencia-ia", icon: Sparkles, label: "Asistencia IA" },
  { href: "/deseos", icon: Gift, label: "Deseos" },
  { href: "/ajustes", icon: Settings, label: "Ajustes" },
];

function NavLink({
  href,
  icon: Icon,
  label,
  active,
  indent,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  active: boolean;
  indent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 h-10 rounded-lg text-[13px] font-medium transition-colors ${
        indent ? "pl-8 pr-3" : "px-3"
      } ${active ? "bg-accent-soft text-accent" : "text-foreground/80 hover:bg-hover"}`}
    >
      <Icon size={indent ? 16 : 18} strokeWidth={2} className={active ? "text-accent" : "text-muted"} />
      <span>{label}</span>
    </Link>
  );
}

export default function Nav() {
  const pathname = usePathname();
  const AhorroIcon = ahorroGroup.icon;
  const ahorroActive = pathname === ahorroGroup.href;

  return (
    <aside className="w-60 shrink-0 border-r border-border bg-sidebar min-h-screen px-3 py-6 hidden md:flex md:flex-col gap-1">
      <div className="px-3 pb-6">
        <Image src="/miga-logo.png" alt="miga" width={96} height={32} className="h-7 w-auto" priority />
      </div>
      {topSections.map((s) => (
        <NavLink key={s.href} {...s} active={pathname === s.href} />
      ))}

      <NavLink href={ahorroGroup.href} icon={AhorroIcon} label={ahorroGroup.label} active={ahorroActive} />
      {ahorroGroup.children.map((c) => (
        <NavLink key={c.href} {...c} active={pathname === c.href} indent />
      ))}

      {bottomSections.map((s) => (
        <NavLink key={s.href} {...s} active={pathname === s.href} />
      ))}
    </aside>
  );
}
