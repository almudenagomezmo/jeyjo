import type { FooterConfigDto } from '@/lib/footer/types'

interface FooterSocialProps {
  social: FooterConfigDto['social']
  showSocial: boolean
}

const SOCIAL_ITEMS = [
  { key: 'facebook', label: 'Facebook' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'youtube', label: 'YouTube' },
] as const

export function FooterSocial({ social, showSocial }: FooterSocialProps) {
  if (!showSocial) return null

  const links = SOCIAL_ITEMS.flatMap(({ key, label }) => {
    const href = social[key]
    return href ? [{ label, href }] : []
  })

  if (links.length === 0) return null

  return (
    <div className="mt-6">
      <p className="mb-2 text-[13px] font-semibold text-white">Síguenos</p>
      <ul className="flex flex-wrap gap-3">
        {links.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              className="text-[13px] text-neutral-300 hover:text-white"
              rel="noopener noreferrer"
              target="_blank"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
