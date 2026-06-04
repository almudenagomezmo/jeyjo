# Seed — Datos de Demo

## Endpoint

```
POST /next/seed
```

Requiere autenticación como **admin**. El payload de Payload se encarga de la autenticación si haces la petición estando logueado en el admin.

## ¿Qué crea?

| Tipo | Cantidad |
|---|---|
| Usuario customer | `customer@example.com` / `password` |
| Categorías | 3 (Accessories, T-Shirts, Hats) |
| Productos | 2 (Hat con variantes de color, T-Shirt con variantes de talla+color) |
| Páginas | 2 (Home + Contact) |
| Formulario | 1 (Contact) |
| Direcciones | 2 (US + UK) |
| Transacciones | 2 (1 pending, 1 succeeded) |
| Carritos | 3 (1 open, 1 abandoned, 1 completed) |
| Pedidos | 2 (1 completed, 1 processing) |
| Navegación | Header + Footer |

## Primer admin

Si es la primera vez, crea un usuario admin desde el panel de Payload (`/admin`),
luego úsalo para hacer seed.

## Reset total

El seed **limpia todas las colecciones** antes de poblar, así que es seguro ejecutarlo
múltiples veces.
