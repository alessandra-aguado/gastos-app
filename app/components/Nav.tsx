"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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
  ChevronDown,
  type LucideIcon,
} from "lucide-react";

type Item = { href: string; icon: LucideIcon; label: string };

// Grupo con un link principal clickeable (tiene su propia pagina) y links
// hijos indentados debajo, como "Gastos" con "Ingresos" adentro.
const gastosGroup: { id: string; parent: Item; children: Item[] } = {
  id: "gastos",
  parent: { href: "/gastos", icon: ShoppingCart, label: "Gastos" },
  children: [{ href: "/ingresos", icon: CircleDollarSign, label: "Ingresos" }],
};

const presupuestoGroup: { id: string; parent: Item; children: Item[] } = {
  id: "presupuesto",
  parent: { href: "/presupuesto", icon: PieChart, label: "Presupuesto" },
  children: [{ href: "/simulador", icon: Calculator, label: "Simulador" }],
};

// Grupos que no tienen pagina propia: solo agrupan visualmente varias
// secciones relacionadas bajo un encabezado no clickeable.
const patrimonioGroup: { id: string; label: string; children: Item[] } = {
  id: "patrimonio",
  label: "Patrimonio",
  children: [
    { href: "/cuentas", icon: Wallet, label: "Cuentas" },
    { href: "/debo", icon: CreditCard, label: "Deuda" },
    { href: "/ahorro", icon: PiggyBank, label: "Ahorro" },
    { href: "/metas", icon: Target, label: "Metas" },
    { href: "/inversiones", icon: TrendingUp, label: "Inversiones" },
  ],
};

const planeadoGroup: { id: string; label: string; children: Item[] } = {
  id: "planeado",
  label: "Planeado",
  children: [
    { href: "/fijos", icon: Repeat, label: "Fijos" },
    { href: "/deseos", icon: Gift, label: "Deseos" },
  ],
};

function useGrupoAbierto(id: string, activo: boolean) {
  const key = `miga_nav_${id}_abierto`;
  const [abierto, setAbierto] = useState(true);

  useEffect(() => {
    // Lee la preferencia guardada solo despues del montaje (no durante el
    // render inicial) para no generar un mismatch de hidratacion entre
    // servidor (sin localStorage) y cliente.
    const guardado = window.localStorage.getItem(key);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza con localStorage, no puede leerse durante el render de servidor
    if (guardado !== null) setAbierto(guardado === "1");
  }, [key]);

  useEffect(() => {
    // Si la ruta activa esta dentro de este grupo, fuerza que se muestre
    // expandido aunque el usuario lo haya contraido antes.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza el estado visual con la ruta activa de Next
    if (activo) setAbierto(true);
  }, [activo]);

  function toggle() {
    setAbierto((prev) => {
      const next = !prev;
      window.localStorage.setItem(key, next ? "1" : "0");
      return next;
    });
  }

  return { abierto, toggle };
}

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

function Chevron({ abierto, onClick, label }: { abierto: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={abierto ? `Contraer ${label}` : `Expandir ${label}`}
      className="w-7 h-7 flex items-center justify-center rounded-lg text-muted hover:bg-hover shrink-0"
    >
      <ChevronDown size={14} strokeWidth={2} className={`transition-transform ${abierto ? "" : "-rotate-90"}`} />
    </button>
  );
}

// Grupo con pagina propia clickeable (Gastos, Presupuesto): el label navega,
// la flechita solo expande/contrae los hijos.
function GrupoConPagina({
  grupo,
  pathname,
}: {
  grupo: { id: string; parent: Item; children: Item[] };
  pathname: string;
}) {
  const activo = pathname === grupo.parent.href || grupo.children.some((c) => c.href === pathname);
  const { abierto, toggle } = useGrupoAbierto(grupo.id, activo);

  return (
    <div>
      <div className="flex items-center gap-0.5">
        <div className="flex-1 min-w-0">
          <NavLink {...grupo.parent} active={pathname === grupo.parent.href} />
        </div>
        <Chevron abierto={abierto} onClick={toggle} label={grupo.parent.label} />
      </div>
      {abierto &&
        grupo.children.map((c) => <NavLink key={c.href} {...c} active={pathname === c.href} indent />)}
    </div>
  );
}

// Grupo sin pagina propia (Patrimonio, Planeado): solo un encabezado fijo,
// sin flechita — siempre expandido.
function GrupoConEncabezado({
  grupo,
  pathname,
}: {
  grupo: { id: string; label: string; children: Item[] };
  pathname: string;
}) {
  return (
    <div>
      <p className="px-3 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">{grupo.label}</p>
      {grupo.children.map((c) => <NavLink key={c.href} {...c} active={pathname === c.href} />)}
    </div>
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

      <GrupoConPagina grupo={gastosGroup} pathname={pathname} />
      <GrupoConPagina grupo={presupuestoGroup} pathname={pathname} />
      <GrupoConEncabezado grupo={patrimonioGroup} pathname={pathname} />
      <GrupoConEncabezado grupo={planeadoGroup} pathname={pathname} />

      <div className="mt-2 pt-2 border-t border-border">
        <NavLink href="/asistencia-ia" icon={Sparkles} label="Asistencia IA" active={pathname === "/asistencia-ia"} />
        <NavLink href="/ajustes" icon={Settings} label="Ajustes" active={pathname === "/ajustes"} />
      </div>
    </aside>
  );
}
