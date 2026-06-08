import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { FooterEuBadge } from "@/components/layout/footer/FooterEuBadge";
import { FooterLegalBar } from "@/components/layout/footer/FooterLegalBar";
import { FooterOmnichannel } from "@/components/layout/footer/FooterOmnichannel";
import { FooterSocial } from "@/components/layout/footer/FooterSocial";
import { FooterStores } from "@/components/layout/footer/FooterStores";
import { NewsletterSignup } from "@/components/newsletter/NewsletterSignup";
import { Logo } from "@/components/ui/Logo";
import { resolvePublicContact } from "@/lib/footer/contact";
import { buildHelpColumnLinks, PURCHASE_COLUMN_LINKS } from "@/lib/footer/links";
import type { NavNode } from "@/lib/catalog/fetch-navigation-tree";
import type { NewsletterSettings } from "@/lib/newsletter/types";
import type { SystemConfigDto } from "@/lib/system-config/types";

interface FooterProps {
  tree: NavNode[];
  newsletterSettings: NewsletterSettings;
  defaultEmail?: string;
  config: SystemConfigDto;
}

export function Footer({ tree, newsletterSettings, defaultEmail, config }: FooterProps) {
  const catalogLinks = tree.map((cat) => ({ label: cat.title, href: `/c/${cat.slug}` }));
  const publicContact = resolvePublicContact(config);

  const columns = [
    { title: "Catálogo", links: catalogLinks },
    { title: "Comprar en Jeyjo", links: PURCHASE_COLUMN_LINKS },
    {
      title: "Ayuda",
      links: buildHelpColumnLinks(config.footer.blog.enabled, config.footer.blog.label),
    },
  ];

  return (
    <footer className="mt-20 bg-ink pt-14 text-neutral-200">
      <Container>
        <div className="grid grid-cols-2 gap-10 pb-10 md:grid-cols-[1.4fr_repeat(3,1fr)_1.2fr]">
          <div className="col-span-2 md:col-span-1">
            <Logo size={32} color="white" />
            <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-neutral-300">
              Material de oficina y reciclaje desde 1998. Servicio para particulares y empresas en
              toda España.
            </p>
            <FooterOmnichannel contact={publicContact} />
            <FooterStores contact={config.contact} showStores={config.footer.showStores} />
            <FooterSocial social={config.footer.social} showSocial={config.footer.showSocial} />
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="mb-3.5 text-[13px] font-bold text-white">{col.title}</h3>
              <ul className="flex flex-col gap-2">
                {col.links.map((link) => (
                  <li key={`${col.title}-${link.label}`}>
                    <Link href={link.href} className="text-[13px] text-neutral-300 hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="col-span-2 md:col-span-1">
            <NewsletterSignup settings={newsletterSettings} defaultEmail={defaultEmail} />
          </div>
        </div>
        <FooterEuBadge euFunding={config.footer.euFunding} />
        <FooterLegalBar />
      </Container>
    </footer>
  );
}
