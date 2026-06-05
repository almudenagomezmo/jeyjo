import type {
  SkaiEvaAdapter,
  SkaiHealth,
  SkaiKnowledgeMeta,
  SkaiMetrics,
  SkaiWidgetConfig,
} from '@/eva/types'

const FETCH_TIMEOUT_MS = 5_000

type LiveConfig = {
  apiUrl: string
  apiKey: string
  widgetId: string
  scriptUrl: string | null
}

function requireLiveConfig(): LiveConfig {
  const apiUrl = process.env.SKAI_API_URL?.trim()
  const apiKey = process.env.SKAI_API_KEY?.trim()
  const widgetId = process.env.SKAI_WIDGET_ID?.trim()
  if (!apiUrl || !apiKey || !widgetId) {
    throw new Error(
      'SKAI_ADAPTER=live requires SKAI_API_URL, SKAI_API_KEY, and SKAI_WIDGET_ID',
    )
  }
  return {
    apiUrl: apiUrl.replace(/\/$/, ''),
    apiKey,
    widgetId,
    scriptUrl: process.env.SKAI_WIDGET_SCRIPT_URL?.trim() || null,
  }
}

async function skaiFetch(path: string, init?: RequestInit): Promise<Response> {
  const { apiUrl, apiKey } = requireLiveConfig()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    return await fetch(`${apiUrl}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
        ...(init?.headers ?? {}),
      },
    })
  } finally {
    clearTimeout(timer)
  }
}

export function createLiveSkaiAdapter(): SkaiEvaAdapter {
  return {
    kind: 'live',
    getWidgetConfig(): SkaiWidgetConfig {
      const cfg = requireLiveConfig()
      return { widgetId: cfg.widgetId, scriptUrl: cfg.scriptUrl }
    },
    async getConversationMetrics(): Promise<SkaiMetrics> {
      try {
        const res = await skaiFetch('/metrics/conversations?days=30')
        if (!res.ok) {
          return { activeConversations: 0, conversationsLast30Days: 0, unresolvedQueries: [] }
        }
        const body = (await res.json()) as Partial<SkaiMetrics>
        return {
          activeConversations: body.activeConversations ?? 0,
          conversationsLast30Days: body.conversationsLast30Days ?? 0,
          unresolvedQueries: Array.isArray(body.unresolvedQueries)
            ? body.unresolvedQueries
            : [],
        }
      } catch {
        return { activeConversations: 0, conversationsLast30Days: 0, unresolvedQueries: [] }
      }
    },
    async uploadKnowledgeDocument(file: Buffer, meta: SkaiKnowledgeMeta): Promise<void> {
      const form = new FormData()
      form.append(
        'file',
        new Blob([file], { type: meta.mimeType }),
        meta.filename,
      )
      const res = await skaiFetch('/knowledge/documents', { method: 'POST', body: form })
      if (!res.ok) {
        throw new Error(`SKAI knowledge upload failed (${res.status})`)
      }
    },
    async validateConnection(): Promise<SkaiHealth> {
      try {
        const res = await skaiFetch('/health')
        if (!res.ok) {
          return { ok: false, message: `SKAI health ${res.status}` }
        }
        return { ok: true }
      } catch (e) {
        return {
          ok: false,
          message: e instanceof Error ? e.message : 'SKAI unreachable',
        }
      }
    },
  }
}
