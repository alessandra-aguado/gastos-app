export function formatMonto(amount: number, decimales: number = 0): string {
  return amount.toLocaleString("es-PE", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
}
