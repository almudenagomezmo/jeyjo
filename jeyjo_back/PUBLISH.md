# Flujo de publicación

## 1. Desarrollo local

```bash
# Arrancar base de datos (si no está corriendo)
cd docker && docker compose up -d

# Volver al proyecto y arrancar dev
cd ..
pnpm dev
```

## 2. Antes de publicar

### 2.1 TipoScript y lint

```bash
pnpm lint
```

### 2.2 Migraciones (solo si cambiaste el esquema)

Si modificaste colecciones, campos o globals, genera una migración:

```bash
pnpm payload migrate:create
```

Esto crea un archivo en `src/migrations/`. Revísalo y súbelo al repo.

### 2.3 Regenerar tipos (si cambiaste el esquema)

```bash
pnpm generate:types
```

### 2.3 Tests (si los hay)

```bash
pnpm test
```

### 2.4 Build local (opcional, verifica que compila)

```bash
pnpm build
```

## 3. Publicar

```bash
git add -A
git commit -m "descripción del cambio"
git push
```

Vercel detecta el push y hace deploy automático si la rama es `main`.

## 4. Post-deploy

### 4.1 Ejecutar migraciones en producción

Si creaste migraciones nuevas, conéctate a la consola de Vercel o ejecuta:

```bash
pnpm payload migrate
```

Puedes hacerlo desde la terminal de Vercel en el dashboard del proyecto (`Terminal` > ejecutar comando).

### 4.2 Sembrar base de datos (solo si es necesario)

Desde el admin panel de Payload en producción, ve a `Settings` > `Seed Database`.

## Recordatorio rápido (sin leer todo)

```bash
# 1. Desarrollo
cd docker && docker compose up -d   # arrancar PostgreSQL
pnpm dev                             # arrancar dev

# 2. Preparar cambios
pnpm lint                            # verificar código
pnpm payload migrate:create          # si hay cambios de esquema
pnpm generate:types                  # si hay cambios de esquema

# 3. Publicar
git add -A && git commit -m "..." && git push
```
