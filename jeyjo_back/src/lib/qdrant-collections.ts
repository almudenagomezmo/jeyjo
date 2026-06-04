export type QdrantCollectionDef = {
  name: string
  vectorSize: number
  description?: string
}

export const qdrantCollections: QdrantCollectionDef[] = [
  {
    name: "products",
    vectorSize: 384,
    description: "Embeddings de productos para búsqueda semántica",
  },
  {
    name: "pages",
    vectorSize: 384,
    description: "Embeddings de páginas para búsqueda semántica",
  },
]
