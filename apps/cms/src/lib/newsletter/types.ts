export type NewsletterStatus = 'pending' | 'confirmed' | 'unsubscribed'
export type NewsletterSource = 'footer' | 'account'

export type NewsletterSubscriberRow = {
  id: string
  email: string
  email_normalized: string
  status: NewsletterStatus
  confirm_token: string
  unsubscribe_token: string
  consent_at: string
  confirmed_at: string | null
  unsubscribed_at: string | null
  source: NewsletterSource
  web_profile_id: string | null
  esp_contact_id: string | null
  esp_synced_at: string | null
  created_at: string
  updated_at: string
}

export type EspContactAttributes = {
  source: NewsletterSource
  segment: 'b2b' | 'b2c'
}
