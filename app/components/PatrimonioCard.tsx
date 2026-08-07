import Link from "next/link";
import { Wallet } from "lucide-react";
import { formatMonto } from "@/lib/format";

export default function PatrimonioCard({ total, decimales = 0 }: { total: number; decimales?: number }) {
  return (
    <Link
      href="/cuentas"
      className="flex items-center gap-2 bg-surface border border-border rounded-full px-4 py-2 text-sm hover:border-accent transition-colors"
    >
      <Wallet size={15} strokeWidth={1.75} className="text-muted" />
      <span className="text-muted">Patrimonio</span>
      <span className="font-medium">S/ {formatMonto(total, decimales)}</span>
    </Link>
  );
}
