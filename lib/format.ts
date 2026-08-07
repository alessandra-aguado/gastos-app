export function formatMonto(amount: number, decimales: number = 0): string {
  return amount.toLocaleString("es-PE", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
}

const MESES_LARGO = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

export function etiquetaMes(mes: string): string {
  const [y, m] = mes.split("-").map(Number);
  return `${MESES_LARGO[m - 1]} ${y}`;
}
