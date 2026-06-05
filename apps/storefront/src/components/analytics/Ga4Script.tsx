"use client";

import Script from "next/script";

import { getGa4MeasurementId } from "@/lib/analytics/ga4";

export function Ga4Script() {
  const measurementId = getGa4MeasurementId();
  if (!measurementId || process.env.NEXT_PUBLIC_GA4_ENABLED === "false") {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${measurementId}');
        `}
      </Script>
    </>
  );
}
