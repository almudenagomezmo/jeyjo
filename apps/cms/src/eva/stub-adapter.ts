import type {
  SkaiEvaAdapter,
  SkaiHealth,
  SkaiKnowledgeMeta,
  SkaiMetrics,
  SkaiWidgetConfig,
} from '@/eva/types'

const STUB_WIDGET_ID = 'eva-stub-widget'

export function createStubSkaiAdapter(): SkaiEvaAdapter {
  return {
    kind: 'stub',
    getWidgetConfig(): SkaiWidgetConfig {
      return {
        widgetId: process.env.SKAI_WIDGET_ID?.trim() || STUB_WIDGET_ID,
        scriptUrl: process.env.SKAI_WIDGET_SCRIPT_URL?.trim() || null,
      }
    },
    async getConversationMetrics(): Promise<SkaiMetrics> {
      return {
        activeConversations: 0,
        conversationsLast30Days: 42,
        unresolvedQueries: [
          { id: 'stub-q1', label: '¿Cuál es el plazo de entrega para pedidos grandes?' },
          { id: 'stub-q2', label: 'Compatibilidad toner HP LaserJet M404' },
        ],
      }
    },
    async uploadKnowledgeDocument(_file: Buffer, _meta: SkaiKnowledgeMeta): Promise<void> {
      return
    },
    async validateConnection(): Promise<SkaiHealth> {
      return { ok: true, message: 'SKAI stub adapter' }
    },
  }
}
