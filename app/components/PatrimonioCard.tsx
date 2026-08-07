import Link from "next/link";

export default function PatrimonioCard() {
  return (
    <Link
      href="/cuentas"
      className="flex items-center gap-2 bg-surface border border-border rounded-full px-4 py-2 text-sm hover:border-accent transition-colors"
    >
      <span>👛</span>
      <span className="text-muted">Patrimonio</span>
      <span className="font-medium">S/ 4,750</span>
    </Link>
  );
}
