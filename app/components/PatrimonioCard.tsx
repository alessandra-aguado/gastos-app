import Link from "next/link";

export default function PatrimonioCard() {
  return (
    <Link
      href="/cuentas"
      className="flex items-center justify-between bg-surface border border-border rounded-2xl px-4 py-3 hover:border-accent transition-colors max-w-sm"
    >
      <div className="flex items-center gap-3">
        <span className="text-lg">👛</span>
        <div>
          <p className="text-sm font-medium">Patrimonio: S/ 4,750</p>
          <p className="text-xs text-muted">En 5 cuentas · actualizado hace 5 días</p>
        </div>
      </div>
      <span className="text-muted">→</span>
    </Link>
  );
}
