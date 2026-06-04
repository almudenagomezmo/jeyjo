# Agents

This project uses the Payload CMS skill at `.agents/skills/payload/`.
Start with `.agents/skills/payload/SKILL.md` for a quick reference, then see `.agents/skills/payload/reference/` for detailed docs.

# Qdrant (Vector Database)

## Inicio rápido

```bash
# Levantar Qdrant (junto a PostgreSQL)
docker compose -f docker/docker-compose.yml up -d

# Verificar que responde
curl http://localhost:6333/collections
```

Las colecciones se crean **automáticamente** al arrancar Payload (vía `onInit` en `payload.config.ts`).
Si Qdrant no está disponible, salta un warning pero no bloquea el arranque.

## Cómo añadir una colección nueva

Edita `src/lib/qdrant-collections.ts` y añade una entrada al array:

```ts
export const qdrantCollections: QdrantCollectionDef[] = [
  { name: "products", vectorSize: 384, description: "..." },
  { name: "pages",    vectorSize: 384, description: "..." },
  { name: "orders",   vectorSize: 768, description: "Búsqueda de pedidos" }, // <-- nueva
]
```

El `vectorSize` debe coincidir con la dimensión del modelo de embeddings que uses.

## API (src/lib/qdrant.ts)

| Función | Descripción |
|---|---|
| `qdrant` | Cliente singleton ya configurado |
| `ensureCollection(name, vectorSize)` | Crea colección si no existe (distancia Cosine) |
| `upsertPoints(collection, points)` | Inserta/actualiza vectores con payload |
| `searchPoints(collection, vector, opts?)` | Búsqueda por similitud coseno |
| `deletePoints(collection, ids)` | Elimina puntos por ID |

## Ejemplo de uso

```ts
import { upsertPoints, searchPoints } from "@/lib/qdrant"

// Generas el embedding con tu modelo (ej. OpenAI, Transformers.js, etc.)
const embedding = await getEmbedding("Camiseta de algodón")

// Insertar
await upsertPoints("products", [
  {
    id: "prod_123",
    vector: embedding,
    payload: { title: "Camiseta de algodón", price: 29.99, category: "ropa" },
  },
])

// Buscar
const results = await searchPoints("products", embedding, { limit: 5 })
// results[0].payload.title -> "Camiseta de algodón"
// results[0].score -> 0.95 (similitud coseno)
```

## Configuración

| Variable | Descripción | Defecto |
|---|---|---|
| `QDRANT_URL` | URL del servidor Qdrant | `http://localhost:6333` |
| `QDRANT_API_KEY` | API key (Qdrant Cloud) | vacío |

Puertos: `6333` (HTTP/REST), `6334` (gRPC).

## Producción

| Entorno | `QDRANT_URL` | `QDRANT_API_KEY` |
|---|---|---|
| Local (Docker) | `http://localhost:6333` | vacío |
| Qdrant Cloud | `https://xxx.us-east-1-0.aws.cloud.qdrant.io:6333` | la del cluster |

# Resend / Mailpit (Email)

## Inicio rápido

```bash
# Levantar Mailpit (para desarrollo)
docker compose -f docker/docker-compose.yml up -d mailpit

# Abrir interfaz web
open http://localhost:8025
```

## Variables de entorno

| Variable | Descripción | Defecto |
|---|---|---|
| `RESEND_API_KEY` | API key de Resend | — |
| `RESEND_SMTP_HOST` | Host SMTP | `smtp.resend.com` |
| `RESEND_SMTP_PORT` | Puerto SMTP | `587` |
| `RESEND_FROM_EMAIL` | Dirección remitente | `noreply@tudominio.com` |
| `RESEND_FROM_NAME` | Nombre remitente | `Jeyjo` |

## Comportamiento

- **Desarrollo** (`NODE_ENV=development` o sin `RESEND_API_KEY`) → Mailpit (`localhost:1025`)
- **Producción** → Resend SMTP

## Envío manual

```ts
import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY)

await resend.emails.send({
  from: 'Jeyjo <noreply@tudominio.com>',
  to: ['cliente@email.com'],
  subject: 'Asunto',
  html: '<p>Contenido</p>',
})
```

Ver `docs/resend.md` para la documentación completa.
