'use client'

import Link from 'next/link'
import React from 'react'

import './index.scss'

const baseClass = 'system-config-hub'

type HubCard = {
  title: string
  description: string
  href: string
  roles: string
}

const cards: HubCard[] = [
  {
    title: 'Parámetros operativos',
    description: 'Portes B2C/B2B, umbrales de stock, alertas del dashboard, contacto y tiendas.',
    href: '/admin/globals/systemSettings',
    roles: 'Superadmin, Administración (parcial Mantenimiento)',
  },
  {
    title: 'Pagos B2C',
    description: 'Métodos de pago activos e instrucciones de transferencia.',
    href: '/admin/globals/paymentSettings',
    roles: 'Superadmin, Administración',
  },
  {
    title: 'Marketing',
    description: 'Carritos abandonados, cupones y reglas promocionales.',
    href: '/admin/globals/marketingSettings',
    roles: 'Superadmin, Marketing',
  },
  {
    title: 'SKAI / EVA',
    description: 'Horarios, contactos de fallback y documentos de conocimiento.',
    href: '/admin/skai-config',
    roles: 'Superadmin',
  },
  {
    title: 'Analytics y Merchant Feed',
    description: 'GA4, feed Google Merchant Center y salud del cron.',
    href: '/admin/analytics-config',
    roles: 'Superadmin, Mantenimiento',
  },
  {
    title: 'Registro de auditoría',
    description: 'Log inmutable de cambios en el backoffice (RF-029).',
    href: '/admin/audit-log',
    roles: 'Superadmin, Mantenimiento',
  },
]

export const SystemConfigHubView: React.FC = () => {
  return (
    <div className={baseClass}>
      <header className={`${baseClass}__header`}>
        <h1>Configuración del sistema</h1>
        <p>
          Centro unificado de parámetros operativos (Alcance §1.36). Los cambios en portes y
          umbrales se propagan a la tienda en aproximadamente 1 minuto.
        </p>
      </header>

      <div className={`${baseClass}__grid`}>
        {cards.map((card) => (
          <Link key={card.href} href={card.href} className={`${baseClass}__card`}>
            <h2>{card.title}</h2>
            <p>{card.description}</p>
            <span className={`${baseClass}__roles`}>{card.roles}</span>
          </Link>
        ))}
      </div>

      <section className={`${baseClass}__security`}>
        <h2>Seguridad e infraestructura</h2>
        <ul>
          <li>
            <strong>TLS 1.3 / HTTPS:</strong> gestionado por Vercel. Comprobar con SSL Labs antes
            de go-live.
          </li>
          <li>
            <strong>WAF:</strong> Vercel Firewall / protección DDoS en el plan de producción.
          </li>
          <li>
            <strong>Rotación de claves:</strong> rotar <code>PAYLOAD_SECRET</code>,{' '}
            <code>CRON_SECRET</code> y API keys (Supabase, Qdrant, Resend) según política interna.
          </li>
          <li>
            <strong>API pública de config:</strong>{' '}
            <code>GET /api/system/config</code> — sin secretos; cache 60 s.
          </li>
        </ul>
      </section>
    </div>
  )
}
