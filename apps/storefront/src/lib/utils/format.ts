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

/** Formats an ISO date or datetime for order headers (es-ES). */
export function formatOrderDateTime(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const hasTime = trimmed.length > 10 && trimmed.includes("T");
  const date = new Date(hasTime ? trimmed : `${trimmed}T12:00:00`);
  if (Number.isNaN(date.getTime())) return trimmed;

  if (hasTime) {
    return date.toLocaleString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
