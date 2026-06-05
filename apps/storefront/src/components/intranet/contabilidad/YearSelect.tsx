"use client";

type YearSelectProps = {
  value: number;
  onChange: (year: number) => void;
  minYear?: number;
  maxYear?: number;
};

export function YearSelect({ value, onChange, minYear, maxYear }: YearSelectProps) {
  const now = new Date().getFullYear()
  const start = minYear ?? now - 5
  const end = maxYear ?? now
  const years: number[] = []
  for (let y = end; y >= start; y -= 1) years.push(y)

  return (
    <label className="flex flex-col gap-1 text-xs font-semibold text-text-secondary">
      Ejercicio fiscal
      <select
        value={value}
        onChange={(e) => onChange(Number.parseInt(e.target.value, 10))}
        className="h-10 w-full max-w-xs rounded-md border border-border bg-surface px-3 text-sm text-text-primary"
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </label>
  );
}
