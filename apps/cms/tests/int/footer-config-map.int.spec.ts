import { describe, expect, it } from 'vitest'

import {
  mapFooterSettingsToDto,
  resolveBusinessHours,
  resolvePublicContact,
} from '@/lib/system-config/map-footer-dto'

describe('mapFooterSettingsToDto', () => {
  it('prefers SKAI business hours over default', () => {
    const dto = mapFooterSettingsToDto(null, null, { businessHours: 'L-V 10:00–19:00' }, 'http://localhost:3001')
    expect(dto.businessHours).toBe('L-V 10:00–19:00')
  })

  it('omits empty social URLs', () => {
    const dto = mapFooterSettingsToDto(
      {
        socialFacebook: ' https://facebook.com/jeyjo ',
        socialInstagram: '',
        socialYoutube: '   ',
      },
      null,
      null,
      'http://localhost:3001',
    )
    expect(dto.social.facebook).toBe('https://facebook.com/jeyjo')
    expect(dto.social.instagram).toBeNull()
    expect(dto.social.youtube).toBeNull()
  })

  it('resolves public contact with SKAI precedence', () => {
    const contact = resolvePublicContact(
      { supportPhone: '941111111', supportEmail: 'info@jeyjo.es', whatsapp: '34600000000' },
      { fallbackPhone: '942222222', fallbackEmail: 'eva@jeyjo.es' },
    )
    expect(contact.phone).toBe('942222222')
    expect(contact.email).toBe('eva@jeyjo.es')
    expect(contact.whatsapp).toBe('34600000000')
  })

  it('disables EU badge without image URL', () => {
    const dto = mapFooterSettingsToDto(
      { euFundingEnabled: true, euFundingAlt: 'Proyecto UE' },
      null,
      null,
      'http://localhost:3001',
    )
    expect(dto.euFunding.enabled).toBe(false)
  })
})

describe('resolveBusinessHours', () => {
  it('falls back to default when SKAI hours empty', () => {
    expect(resolveBusinessHours({ businessHours: '  ' })).toBe('Lunes a viernes 09:00–18:00')
  })
})
