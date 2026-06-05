import { describe, expect, it } from 'vitest'

function shouldSendSecondEmail(args: {
  inactiveMinutes: number
  secondDelay: number
  firstSent: boolean
  secondSent: boolean
  converted: boolean
}): boolean {
  if (args.converted) return false
  if (!args.firstSent || args.secondSent) return false
  return args.inactiveMinutes >= args.secondDelay
}

describe('abandoned cart recovery selection', () => {
  it('CA3: skips second email when converted', () => {
    expect(
      shouldSendSecondEmail({
        inactiveMinutes: 1500,
        secondDelay: 1440,
        firstSent: true,
        secondSent: false,
        converted: true,
      }),
    ).toBe(false)
  })

  it('sends second email when still active after delay', () => {
    expect(
      shouldSendSecondEmail({
        inactiveMinutes: 1500,
        secondDelay: 1440,
        firstSent: true,
        secondSent: false,
        converted: false,
      }),
    ).toBe(true)
  })
})
