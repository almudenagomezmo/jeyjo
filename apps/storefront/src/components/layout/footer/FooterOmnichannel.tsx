import type { PublicContact } from '@/lib/footer/types'
import { telHref, whatsappHref } from '@/lib/footer/contact'

interface FooterOmnichannelProps {
  contact: PublicContact
}

export function FooterOmnichannel({ contact }: FooterOmnichannelProps) {
  const { phone, email, whatsapp, businessHours } = contact
  const hasChannels = phone || email || whatsapp

  if (!hasChannels && !businessHours) return null

  return (
    <div className="mt-4 space-y-2 text-[13px] text-neutral-300">
      <p className="text-[13px] font-semibold text-white">Contacto</p>
      {phone && (
        <p>
          Tel:{' '}
          <a href={telHref(phone)} className="hover:text-white">
            {phone}
          </a>
        </p>
      )}
      {email && (
        <p>
          Email:{' '}
          <a href={`mailto:${email}`} className="hover:text-white">
            {email}
          </a>
        </p>
      )}
      {whatsapp && (
        <p>
          WhatsApp:{' '}
          <a
            href={whatsappHref(whatsapp)}
            className="hover:text-white"
            rel="noopener noreferrer"
            target="_blank"
          >
            {whatsapp}
          </a>
        </p>
      )}
      {businessHours && <p className="text-neutral-400">Horario: {businessHours}</p>}
      <p className="text-neutral-400">¿Dudas al instante? Usa el asistente EVA (botón flotante).</p>
    </div>
  )
}
