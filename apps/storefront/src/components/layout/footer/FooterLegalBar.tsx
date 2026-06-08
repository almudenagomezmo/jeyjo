import Link from 'next/link'

import { LEGAL_BAR_LINKS } from '@/lib/footer/links'
import { PaymentMethodIcons } from '@/components/layout/footer/PaymentMethodIcons'

export function FooterLegalBar() {
  return (
    <div className="flex flex-col gap-4 border-t border-white/10 py-5 text-[12px] text-neutral-400 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-2">
        <span>© {new Date().getFullYear()} Jeyjo Material de Oficina, SL · CIF B-26000000</span>
        <nav aria-label="Enlaces legales" className="flex flex-wrap gap-x-3 gap-y-1">
          {LEGAL_BAR_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-white">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <PaymentMethodIcons />
    </div>
  )
}
