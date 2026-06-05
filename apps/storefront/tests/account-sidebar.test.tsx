// @vitest-environment jsdom

import React from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/navigation', () => ({
  usePathname: () => '/cuenta',
}))

import { AccountSidebar } from '@/components/account/AccountSidebar'
import { ACCOUNT_STOCK_WATCHES_NAV } from '@/lib/account/navigation'

afterEach(() => cleanup())

describe('AccountSidebar stock watches link', () => {
  it('includes avisos de stock for all account users', () => {
    render(<AccountSidebar />)

    const link = screen.getByRole('link', { name: ACCOUNT_STOCK_WATCHES_NAV.label })
    expect(link.getAttribute('href')).toBe(ACCOUNT_STOCK_WATCHES_NAV.href)
  })
})
