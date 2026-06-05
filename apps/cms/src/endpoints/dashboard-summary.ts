import { APIError, type Endpoint } from 'payload'

import { isStaff } from '@/access/staffRoles'
import { logAccessDenied } from '@/access/logAccessDenied'
import { buildDashboardSummary } from '@/lib/dashboard/build-summary'
import { hasValidMfaSession } from '@/lib/mfa-session'

export const dashboardSummaryEndpoint: Endpoint = {
  path: '/dashboard/summary',
  method: 'get',
  handler: async (req) => {
    if (!req.user || !isStaff(req.user) || !hasValidMfaSession(req)) {
      if (req.user && isStaff(req.user)) {
        await logAccessDenied(req, 'dashboard', 'read')
      }
      throw new APIError('Unauthorized', 401)
    }

    const url = new URL(req.url ?? 'http://local', 'http://local')
    const summary = await buildDashboardSummary({
      payload: req.payload,
      user: req.user,
      period: url.searchParams.get('period'),
      from: url.searchParams.get('from'),
      to: url.searchParams.get('to'),
    })

    return Response.json(summary)
  },
}
