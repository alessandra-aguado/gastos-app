"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Home,
  ShoppingCart,
  CircleDollarSign,
  PieChart,
  Calculator,
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

type Item = { href: string; icon: LucideIcon; label: string };

// Grupo con un link principal clickeable (tiene su propia pagina) y links
// hijos indentados debajo, como "Gastos" con "Ingresos" adentro.
const gastosGroup: { parent: Item; children: Item[] } = {
  parent: { href: "/gastos", icon: ShoppingCart, label: "Gastos" },
  children: [{ href: "/ingresos", icon: CircleDollarSign, label: "Ingresos" }],
};

const presupuestoGroup: { parent: Item; children: Item[] } = {
  parent: { href: "/presupuesto", icon: PieChart, label: "Presupuesto" },
  children: [{ href: "/simulador", icon: Calculator, label: "Simulador" }],
};

// Grupos que no tienen pagina propia: solo agrupan visualmente varias
// secciones relacionadas bajo un encabezado no clickeable.
const patrimonioGroup: { label: string; children: Item[] } = {
  label: "Patrimonio",
  children: [
    { href: "/cuentas", icon: Wallet, label: "Cuentas" },
    { href: "/debo", icon: CreditCard, label: "Deuda" },
    { href: "/ahorro", icon: PiggyBank, label: "Ahorro" },
    { href: "/metas", icon: Target, label: "Metas" },
    { href: "/inversiones", icon: TrendingUp, label: "Inversiones" },
  ],
};

const planeadoGroup: { label: string; children: Item[] } = {
  label: "Planeado",
  children: [
    { href: "/fijos", icon: Repeat, label: "Fijos" },
    { href: "/deseos", icon: Gift, label: "Deseos" },
  ],
};

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

function GroupHeader({ label }: { label: string }) {
  return (
    <p className="px-3 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
      {label}
    </p>
  );
}

export default function Nav() {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 border-r border-border bg-sidebar min-h-screen px-3 py-6 hidden md:flex md:flex-col gap-1">
      <div className="px-3 pb-6">
        <Image src="/miga-logo.png" alt="miga" width={96} height={32} className="h-7 w-auto" priority />
      </div>

      <NavLink href="/" icon={Home} label="Inicio" active={pathname === "/"} />

      <NavLink {...gastosGroup.parent} active={pathname === gastosGroup.parent.href} />
      {gastosGroup.children.map((c) => (
        <NavLink key={c.href} {...c} active={pathname === c.href} indent />
      ))}

      <NavLink {...presupuestoGroup.parent} active={pathname === presupuestoGroup.parent.href} />
      {presupuestoGroup.children.map((c) => (
        <NavLink key={c.href} {...c} active={pathname === c.href} indent />
      ))}

      <GroupHeader label={patrimonioGroup.label} />
      {patrimonioGroup.children.map((c) => (
        <NavLink key={c.href} {...c} active={pathname === c.href} />
      ))}

      <GroupHeader label={planeadoGroup.label} />
      {planeadoGroup.children.map((c) => (
        <NavLink key={c.href} {...c} active={pathname === c.href} />
      ))}

      <div className="mt-2 pt-2 border-t border-border">
        <NavLink href="/asistencia-ia" icon={Sparkles} label="Asistencia IA" active={pathname === "/asistencia-ia"} />
        <NavLink href="/ajustes" icon={Settings} label="Ajustes" active={pathname === "/ajustes"} />
      </div>
    </aside>
  );
}
