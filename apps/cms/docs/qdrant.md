# Qdrant — Base de Datos Vectorial

Qdrant se usa para **búsqueda semántica** sobre productos y páginas mediante vectores (embeddings).

## Inicio rápido

```bash
# Local (con Docker)
docker compose -f docker/docker-compose.yml up -d

# Verificar que responde
curl http://localhost:6333/collections
```

Las colecciones se crean **automáticamente** al arrancar Payload vía `onInit`.
Si Qdrant no está disponible, muestra un warning pero no bloquea el arranque.

## Colecciones registradas

Definidas en `src/lib/qdrant-collections.ts`:

| Colección | Vector Size | Uso |
|---|---|---|
| `products` | 384 | Búsqueda semántica de productos |
| `categories` | 384 | Búsqueda semántica de categorías |
| `pages` | 384 | Búsqueda semántica de páginas |

## Modelo de embeddings (search indexer)

El worker `src/search-indexer/` usa **Transformers.js** (`@xenova/transformers`) con el modelo [`Xenova/multilingual-e5-small`](https://huggingface.co/Xenova/multilingual-e5-small) (384 dimensiones, alineado con `vectorSize` de las colecciones).

- **Primera ejecución:** descarga el modelo (~100 MB) desde Hugging Face; puede tardar varios minutos en cold start (Vercel incluido).
- **Dev local:** tras `pnpm dev`, ejecuta `POST /next/process-search-events` (admin) o `GET /api/cron/search-indexer` con `Authorization: Bearer $CRON_SECRET`.
- **Producción:** cron Vercel cada minuto (`vercel.json` → `/api/cron/search-indexer`).

No se requiere API key externa para embeddings en desarrollo.

### Añadir una colección nueva

```ts
// src/lib/qdrant-collections.ts
export const qdrantCollections: QdrantCollectionDef[] = [
  { name: "products",  vectorSize: 384 },
  { name: "pages",     vectorSize: 384 },
  { name: "orders",    vectorSize: 768 },  // <-- nueva
]
```

El `vectorSize` debe coincidir con la dimensión del modelo de embeddings.

## API

```ts
import { qdrant, ensureCollection, upsertPoints, searchPoints } from "@/lib/qdrant"
```

| Función | Descripción |
|---|---|
| `qdrant` | Cliente singleton |
| `ensureCollection(name, vectorSize)` | Crea colección si no existe (distancia Cosine) |
| `upsertPoints(collection, points)` | Inserta/actualiza vectores con payload |
| `searchPoints(collection, vector, opts?)` | Búsqueda por similitud coseno |
| `deletePoints(collection, ids)` | Elimina puntos por ID |

## Ejemplo

```ts
import { upsertPoints, searchPoints } from "@/lib/qdrant"

// Generar embedding con tu modelo (ej. OpenAI, Transformers.js...)
const embedding = await getEmbedding("Camiseta de algodón")

// Insertar vector
await upsertPoints("products", [
  {
    id: "prod_123",
    vector: embedding,
    payload: { title: "Camiseta de algodón", price: 29.99, slug: "camiseta-algodon" },
  },
])

// Buscar por similitud
const results = await searchPoints("products", embedding, { limit: 5 })
// results[0].payload.title = "Camiseta de algodón"
// results[0].score = 0.95
```

## Configuración

| Variable | Local (Docker) | Producción (Cloud) |
|---|---|---|
| `QDRANT_URL` | `http://localhost:6333` | `https://xxx.cloud.qdrant.io:6333` |
| `QDRANT_API_KEY` | vacío | la del cluster |

Puertos: `6333` (HTTP/REST), `6334` (gRPC).
