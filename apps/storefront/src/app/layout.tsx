import type { Metadata } from "next";
import { Manrope, JetBrains_Mono } from "next/font/google";
import { Suspense } from "react";
import { AnalyticsBeacon } from "@/components/analytics/AnalyticsBeacon";
import { Ga4PageView } from "@/components/analytics/Ga4PageView";
import { Ga4Script } from "@/components/analytics/Ga4Script";
import { EvaWidgetShell } from "@/components/eva/EvaWidgetShell";
import { WishlistSyncBootstrap } from "@/components/wishlist/WishlistSyncBootstrap";
import { NavigationShell } from "@/components/layout/NavigationShell";
import { MiniCart } from "@/components/cart/MiniCart";
import { themeInitScript } from "@/components/layout/ThemeToggle";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Jeyjo · Material de oficina y reciclaje",
    template: "%s · Jeyjo",
  },
  description:
    "Más de 30.000 referencias de material de oficina y reciclaje para particulares y empresas. Envío en 24-48 h y tarifas personalizadas B2B.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${manrope.variable} ${jetbrains.variable}`} suppressHydrationWarning>
      <head>
        {/* Apply persisted theme before paint to avoid a flash. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="antialiased">
        <Ga4Script />
        <Suspense fallback={null}>
          <Ga4PageView />
        </Suspense>
        <AnalyticsBeacon />
        <WishlistSyncBootstrap />
        <NavigationShell>{children}</NavigationShell>
        <MiniCart />
        <EvaWidgetShell />
      </body>
    </html>
  );
}
