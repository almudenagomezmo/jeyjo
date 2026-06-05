export type NewsletterSettings = {
  enabled: boolean
  headline: string
  description: string
  privacyPolicyUrl: string
}

export type NewsletterSource = 'footer' | 'account'
