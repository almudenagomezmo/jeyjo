"use client";

import Script from "next/script";

type RedsysWalletScriptProps = {
  enabled: boolean;
  env: "test" | "prod";
};

/** Loads Redsys InSite script only when wallet payments are enabled in CMS. */
export function RedsysWalletScript({ enabled, env }: RedsysWalletScriptProps) {
  if (!enabled) return null;

  const src =
    env === "prod"
      ? "https://sis.redsys.es/sis/NC/sandbox/redsysV3.js"
      : "https://sis-t.redsys.es:25443/sis/NC/sandbox/redsysV3.js";

  return <Script src={src} strategy="lazyOnload" id="redsys-insite" />;
}
