/** Locale-aware EUR formatting (Spain). */
const eur = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatMoney(value: number): string {
  return eur.format(value);
}

const integer = new Intl.NumberFormat("es-ES");

export function formatInt(value: number): string {
  return integer.format(value);
}
