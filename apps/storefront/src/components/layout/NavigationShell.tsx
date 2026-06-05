import { headers } from "next/headers";
import { getNavigationTree } from "@/lib/catalog/fetch-navigation-tree";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { TopBar } from "@/components/layout/TopBar";
import { PortalTopBar } from "@/components/intranet/PortalTopBar";
import { getCustomerContext, pricingCustomerGroup } from "@/lib/auth/customer-context";
import { isB2bValidated } from "@/lib/auth/redirect";
import { isPortalModeFromHeaders } from "@/lib/intranet/portal-mode";
import { isB2BCustomerGroup } from "@jeyjo/pricing";
import { getNewsletterSettings } from "@/lib/newsletter/settings";
import { getContactConfig } from "@/lib/system-config/fetch";

export async function NavigationShell({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const portalMode = isPortalModeFromHeaders(headersList);
  const tree = await getNavigationTree();
  const ctx = await getCustomerContext();
  const newsletterSettings = await getNewsletterSettings();
  const contact = await getContactConfig();

  let accountHref = "/login";
  let accountLabel = "Acceder";
  let sessionPriceMode: "b2c" | "b2b" | undefined;
  let priceModeLocked = false;

  if (ctx) {
    accountLabel = ctx.commercialName;
    accountHref = isB2bValidated(ctx) ? "/intranet" : "/cuenta";
    const group = pricingCustomerGroup(ctx);
    if (isB2bValidated(ctx) && isB2BCustomerGroup(group)) {
      sessionPriceMode = "b2b";
      priceModeLocked = true;
    }
  }

  if (portalMode) {
    return (
      <>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:shadow-lg"
        >
          Ir al contenido
        </a>
        <PortalTopBar
          commercialName={ctx?.commercialName ?? "Portal B2B"}
          profileId={ctx?.userId ?? ""}
        />
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
      </>
    );
  }

  return (
    <>
      <TopBar />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:shadow-lg"
      >
        Ir al contenido
      </a>
      <Header
        tree={tree}
        accountHref={accountHref}
        accountLabel={accountLabel}
        sessionPriceMode={sessionPriceMode}
        priceModeLocked={priceModeLocked}
      />
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      <Footer
        tree={tree}
        newsletterSettings={newsletterSettings}
        defaultEmail={ctx?.email}
        contact={contact}
      />
    </>
  );
}
