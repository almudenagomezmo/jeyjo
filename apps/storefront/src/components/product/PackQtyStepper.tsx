"use client";

import { useState } from "react";
import { QtyStepper } from "@/components/ui/QtyStepper";
import { roundUpToPack } from "@/lib/pdp/pack-qty";

const PACK_NOTICE =
  "Este artículo se vende en cajas de {n} unidades. La cantidad se ha ajustado al envase cerrado.";

export function PackQtyStepper({
  packUnit,
  value,
  onChange,
}: {
  packUnit: number;
  value: number;
  onChange: (value: number) => void;
}) {
  const [notice, setNotice] = useState<string | null>(null);
  const step = packUnit > 0 ? packUnit : 1;
  const min = step;

  const applyPackRules = (raw: number) => {
    const rounded = roundUpToPack(raw, step);
    if (step > 1 && raw !== rounded) {
      setNotice(PACK_NOTICE.replace("{n}", String(step)));
    } else {
      setNotice(null);
    }
    onChange(rounded);
  };

  return (
    <div>
      <QtyStepper
        value={value}
        onChange={applyPackRules}
        step={step}
        min={min}
      />
      {notice && (
        <p className="mt-2 text-xs text-text-secondary" role="status">
          {notice}
        </p>
      )}
    </div>
  );
}
