import Link from "next/link";
import { Flame } from "lucide-react";

export default function RachaChip({ rachaActual }: { rachaActual: number }) {
  return (
    <Link
      href="/racha"
      className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-5 text-left hover:border-accent transition-colors block"
    >
      <p className="text-xs text-muted flex items-center gap-1.5"><Flame size={14} strokeWidth={1.75} className="text-accent" />Racha</p>
      <p className="text-3xl font-bold mt-1 text-accent">{rachaActual}</p>
      <p className="text-xs text-muted mt-0.5">{rachaActual === 1 ? "día" : "días"} seguidos</p>
    </Link>
  );
}
