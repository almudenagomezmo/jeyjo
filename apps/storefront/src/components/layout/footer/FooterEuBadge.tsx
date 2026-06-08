import type { FooterConfigDto } from '@/lib/footer/types'

interface FooterEuBadgeProps {
  euFunding: FooterConfigDto['euFunding']
}

export function FooterEuBadge({ euFunding }: FooterEuBadgeProps) {
  if (!euFunding.enabled || !euFunding.imageUrl || !euFunding.alt) return null

  const image = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={euFunding.imageUrl}
      alt={euFunding.alt}
      className="h-10 w-auto max-w-[220px] object-contain"
      loading="lazy"
    />
  )

  return (
    <div className="border-t border-white/10 py-6">
      {euFunding.url ? (
        <a href={euFunding.url} rel="noopener noreferrer" target="_blank">
          {image}
        </a>
      ) : (
        image
      )}
    </div>
  )
}
