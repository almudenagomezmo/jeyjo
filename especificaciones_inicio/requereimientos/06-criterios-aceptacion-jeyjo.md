# 06 — Criterios de Aceptación del Proyecto Jeyjo

| Campo       | Valor                                      |
|-------------|--------------------------------------------|
| Versión     | 1.1                                        |
| Fecha       | 2026-05-27                                 |
| Autor       | Equipo de desarrollo Jeyjo                 |
| Estado      | Borrador                                   |

---

## 1. Definition of Done (Definición de Hecho)

Una funcionalidad se considera **TERMINADA** cuando cumple todos los siguientes criterios sin excepción:

1. El código está en la rama principal (`main`) tras revisión y aprobación de al menos otro miembro del equipo (code review).
2. Todos los tests unitarios relevantes pasan (cobertura ≥ 80 % en módulos críticos: motor de precios, autenticación, importador Excel).
3. Los tests E2E de los flujos críticos afectados (checkout, login B2B, importación Excel) pasan en el entorno de staging.
4. No hay errores de ESLint ni de TypeScript en modo estricto en el código añadido.
5. La funcionalidad está desplegada y verificada en el entorno de **staging** (no solo en local).
6. La documentación de API interna (tipos TypeScript, comentarios en colecciones Payload) está actualizada si la PR añade o modifica endpoints.
7. El fichero de especificaciones correspondiente (RF, US) está marcado como "Implementado" en el tracker del equipo.
8. No hay datos sensibles (claves de API, contraseñas, tokens) en el código fuente ni en los commits.

---

## 2. Criterios de Aceptación por Módulo

### Módulo: Autenticación y Acceso

**CA-AUTH-001: Login exitoso de cliente B2C**
```
Requisito origen: RF-001

Dado que existe un usuario registrado con email "test-b2c@ejemplo.com", contraseña "Test1234!" 
  y grupo de cliente "01" en la base de datos
Cuando el usuario introduce esas credenciales en el formulario de login y hace clic en "Entrar"
Entonces el sistema autentica al usuario, crea una sesión JWT válida y redirige al panel 
  de cliente B2C estándar (ruta /mi-cuenta)
  Y el header muestra el nombre del cliente en el icono de cuenta
  Y el sistema registra el evento de login en la tabla de auditoría

Datos de prueba: Usuario con email test-b2c@ejemplo.com, contraseña Test1234!, grupo 01, activo
Entorno: Staging
Tipo: Funcional
```

**CA-AUTH-002: Login exitoso de cliente B2B con redirección a intranet**
```
Requisito origen: RF-001

Dado que existe un usuario con email "empresa@test.com", contraseña "Empresa2024!" 
  y grupo de cliente "02" en la base de datos, sin MFA activo
Cuando el usuario introduce esas credenciales y hace clic en "Entrar"
Entonces el sistema autentica al usuario y redirige a la intranet B2B (ruta /intranet/dashboard)
  Y el portal muestra el nombre comercial y CIF de la empresa en la cabecera

Datos de prueba: Usuario empresa@test.com, grupo 02, empresa "Papelería Test S.L.", CIF B12345678
Entorno: Staging
Tipo: Funcional
```

**CA-AUTH-003: Bloqueo de acceso B2C a URL de intranet**
```
Requisito origen: RF-001, RF-003

Dado que un usuario B2C está autenticado con sesión válida (grupo 01)
Cuando intenta acceder directamente a la URL /intranet/facturas
Entonces el sistema rechaza el acceso y redirige a /mi-cuenta con mensaje 
  "No tienes permisos para acceder a esta sección"
  Y el sistema NO muestra ningún dato de la intranet B2B

Datos de prueba: Usuario B2C con sesión activa; URL /intranet/facturas
Entorno: Staging
Tipo: Seguridad
```

**CA-AUTH-004: Bloqueo tras 5 intentos de login fallidos**
```
Requisito origen: RNF-011

Dado que un usuario intenta autenticarse con contraseña incorrecta 5 veces consecutivas
Cuando realiza el sexto intento (correcto o incorrecto)
Entonces el sistema muestra "Tu cuenta está bloqueada temporalmente. Inténtalo de nuevo 
  en 15 minutos"
  Y no procesa la autenticación hasta que pasen 15 minutos

Datos de prueba: Usuario existente; contraseña incorrecta repetida 5 veces
Entorno: Staging
Tipo: Seguridad
```

**CA-AUTH-005: MFA obligatorio para acceso al backoffice Jeyjo**
```
Requisito origen: RF-002, RNF-011

Dado que existe un usuario del equipo Jeyjo "trabajador@jeyjo.es" sin MFA configurado
Cuando intenta acceder al backoffice de Payload CMS con usuario y contraseña correctos
Entonces el sistema rechaza el acceso y muestra el mensaje: 
  "Debes configurar la autenticación en dos pasos antes de acceder al backoffice."
  Y le muestra el flujo de configuración de TOTP (QR para Google Authenticator)

Dado que el mismo usuario configura correctamente el TOTP
Cuando hace login con usuario, contraseña y código TOTP correcto
Entonces el sistema permite el acceso al backoffice

Dado que un superadmin B2B de cliente "admin-empresa@test.com" NO tiene MFA activo
Cuando hace login en el área de cliente con usuario y contraseña correctos
Entonces el sistema permite el acceso (MFA es opcional para clientes B2B)
  Y muestra un banner recomendando activar el MFA desde el perfil

Datos de prueba: Usuario Jeyjo sin MFA; usuario B2B sin MFA; app TOTP de prueba
Entorno: Staging
Tipo: Seguridad
```

---

### Módulo: Motor de Precios

**CA-PRECIOS-001: Precio P1 para usuario anónimo**
```
Requisito origen: RF-007, RF-011

Dado que el artículo REF-001 tiene precio P1 = 1,00 € y tipo IVA = 21%
  Y el usuario NO está autenticado
Cuando visita la ficha del producto REF-001
Entonces ve el precio sin IVA "1,00 €" en grande y "1,21 € con IVA" en tamaño menor al lado
  Y la cabecera muestra el indicador "Precios sin IVA"

Datos de prueba: Artículo REF-001, P1=1.000000, IVA=21%; sesión no autenticada
Entorno: Staging
Tipo: Funcional
```

**CA-PRECIOS-002: Precio P2 con descuento de cliente B2B (sin oferta)**
```
Requisito origen: RF-007

Dado que el artículo REF-002 tiene precio P2 = 10,00 € sin oferta activa
  Y el cliente B2B "empresa@test.com" tiene un descuento general del 10% en su ficha
Cuando el cliente B2B autenticado visita la ficha del producto REF-002
Entonces ve el precio neto "9,00 € (sin IVA)" como precio principal
  Y se muestra el desglose: PVP recomendado 10,00 € | Descuento 10% | Importe neto 9,00 €

Datos de prueba: Artículo REF-002, P2=10.000000, sin oferta; cliente con descuento 10%
Entorno: Staging
Tipo: Funcional
```

**CA-PRECIOS-003: Regla de no acumulación — oferta activa + descuento cliente B2B**
```
Requisito origen: RF-007

Dado que el artículo REF-003 tiene precio P2 = 10,00 € y hay una oferta de grupo activa 
  que lo descuenta al precio especial de 8,00 €
  Y el cliente B2B "empresa@test.com" tiene un descuento general del 10%
Cuando el cliente B2B autenticado visita la ficha del producto REF-003
Entonces ve el precio neto "8,00 € (sin IVA)" sin aplicar adicionalmente el 10% de descuento
  Y NO ve un precio de 7,20 € (que sería la acumulación incorrecta)
  Y el sistema muestra la etiqueta "Precio especial" o "En oferta"

Datos de prueba: Artículo REF-003, P2=10.000000, oferta activa precio=8.000000; cliente dto=10%
Entorno: Staging
Tipo: Funcional — CRÍTICO
```

**CA-PRECIOS-004: Precio especial pactado por cliente/artículo**
```
Requisito origen: RF-007, RF-020

Dado que el cliente "empresa2@test.com" tiene un precio especial pactado para el artículo 
  REF-004 de 5,00 € vigente hasta el 31/12/2026
  Y el precio P2 del artículo es 8,00 € con descuento general del cliente del 5%
Cuando el cliente B2B autenticado visita la ficha del producto REF-004
Entonces ve el precio neto "5,00 € (sin IVA)" (precio especial pactado, que prevalece)
  Y NO aplica P2 - descuento_cliente = 8,00 * 0,95 = 7,60 €

Datos de prueba: Cliente empresa2@test.com, artículo REF-004, precio especial 5.00000 vigente
Entorno: Staging
Tipo: Funcional — CRÍTICO
```

**CA-PRECIOS-005: Lógica de envase cerrado en selector de cantidad**
```
Requisito origen: RF-008

Dado que el artículo REF-005 tiene unidad de envase = 12
Cuando un usuario introduce la cantidad "5" en el selector de la ficha de producto
Entonces el selector ajusta automáticamente la cantidad a "12"
  Y muestra el aviso: "Este artículo se vende en cajas de 12 unidades. 
    Cantidad ajustada automáticamente."

Datos de prueba: Artículo REF-005, unidad_envase=12; entrada de cantidad=5
Entorno: Staging
Tipo: Funcional
```

**CA-PRECIOS-006: IVA snapshot inmutable en línea de pedido**
```
Requisito origen: RF-007

Dado que el artículo REF-015 tiene iva_rate_actual = 21% en el momento T
  Y el cliente confirma un pedido que incluye REF-015 en el momento T
  Y posteriormente el equipo de Jeyjo modifica el IVA del artículo REF-015 a 10%
Cuando se consulta la línea del pedido confirmado en T
Entonces iva_rate_snapshot = 21% (valor en el momento de confirmación del pedido)
  Y el IVA mostrado en la factura del pedido es el 21%, no el 10% actual
  Y el campo iva_rate_actual del producto muestra 10% (el nuevo valor)
  Y ningún pedido histórico ha cambiado su IVA

Datos de prueba: Artículo REF-015 con IVA 21%; pedido confirmado; cambio posterior IVA a 10%
Entorno: Staging
Tipo: Funcional — CRÍTICO (requisito fiscal)
```

---

### Módulo: Buscador

**CA-SEARCH-001: Buscador prominente tipo Booking/Amazon responde en menos de 150 ms**
```
Requisito origen: RF-009, RNF-002

Dado que el catálogo contiene el artículo "Bolígrafo BIC Cristal Azul" indexado en Qdrant
  Y el buscador ocupa una posición prominente en la cabecera (barra hero)
Cuando un usuario escribe "boli" en el buscador
Entonces en menos de 150 ms aparece el desplegable visual con:
  - Sección "Productos sugeridos": miniatura, nombre y precio del artículo BIC
  - Sección "Categorías": "¿Buscabas en Escritura?"
  Y el diseño visual del desplegable es tipo Amazon/Booking (rico, con imágenes)

Dado que se actualiza el nombre del artículo BIC en el backoffice
Cuando pasan menos de 60 segundos
Entonces el nuevo nombre aparece en los resultados del buscador (evento procesado por el worker)

Datos de prueba: Artículo BIC indexado en Qdrant; catálogo con >1.000 productos; término "boli"
Entorno: Staging
Tipo: Funcional + Rendimiento
```

**CA-SEARCH-002: Tolerancia a errores tipográficos**
```
Requisito origen: RF-009

Dado que el catálogo contiene el artículo "Bolígrafo BIC Cristal Azul"
Cuando un usuario escribe "boligrafo vic" o "volígrafo bic" en el buscador
Entonces el sistema devuelve resultados que incluyen "Bolígrafo BIC Cristal Azul"
  Y no devuelve el mensaje "No se encontraron resultados"

Datos de prueba: Términos de búsqueda "boligrafo vic" y "volígrafo bic"
Entorno: Staging
Tipo: Funcional
```

**CA-SEARCH-003: Búsqueda por EAN**
```
Requisito origen: RF-009

Dado que el artículo REF-006 tiene EAN "3086123519963" indexado
Cuando un usuario escribe "3086123519963" en el buscador
Entonces el primer resultado es el artículo REF-006 con su nombre y precio

Datos de prueba: Artículo con EAN indexado; búsqueda por EAN completo
Entorno: Staging
Tipo: Funcional
```

**CA-SEARCH-004: Referencia comodín no aparece en búsqueda**
```
Requisito origen: RF-006

Dado que la referencia "9000000001" está marcada como comodín en la base de datos
Cuando un usuario busca "9000000001" o cualquier término que coincida con esa referencia
Entonces el buscador no devuelve resultados para esa referencia
  Y la referencia no aparece en ninguna sección del catálogo público

Datos de prueba: Referencia comodín 9000000001 en base de datos
Entorno: Staging
Tipo: Funcional
```

---

### Módulo: Carrito y Checkout

**CA-CHECKOUT-001: Cálculo automático de portes B2C**
```
Requisito origen: RF-013

Dado que el cliente B2C tiene en el carrito artículos por valor de 38,00 € 
  (precio con IVA incluido)
Cuando visualiza el resumen del carrito o el checkout
Entonces los gastos de envío muestran "Gastos de envío: 5,00 € (IVA incluido)"
  Y el total del pedido es 43,00 €

Datos de prueba: Carrito B2C con total 38,00 € con IVA; umbral de portes gratis = 39 €
Entorno: Staging
Tipo: Funcional
```

**CA-CHECKOUT-002: Portes gratis por superar umbral B2C**
```
Requisito origen: RF-013

Dado que el cliente B2C tiene en el carrito artículos por valor de 40,00 €
Cuando visualiza el resumen del carrito
Entonces se muestra "Envío gratuito" en la línea de gastos de envío
  Y el total del pedido es 40,00 €

Datos de prueba: Carrito B2C con total 40,00 € con IVA
Entorno: Staging
Tipo: Funcional
```

**CA-CHECKOUT-003: Pago con tarjeta Redsys completa el pedido**
```
Requisito origen: RF-014, RI-006

Dado que el cliente B2C tiene un carrito de 45,00 € con envío gratuito
  Y selecciona el método de pago "Tarjeta de crédito/débito"
Cuando completa el formulario de Redsys con los datos de tarjeta de prueba 
  (4548812049400004, CVV 123, caducidad 12/26)
Entonces el sistema recibe la confirmación de pago autorizado desde Redsys
  Y crea el pedido en la base de datos con estado "Confirmado"
  Y envía un email de confirmación al cliente en menos de 60 segundos
  Y el pedido aparece en la bandeja OMS del backend de Jeyjo

Datos de prueba: Tarjeta de prueba Redsys; carrito con total 45,00 €
Entorno: Staging (entorno de pruebas Redsys)
Tipo: Integración — End-to-End
```

**CA-CHECKOUT-004: Cupón BLOG5 se aplica correctamente**
```
Requisito origen: RF-027, RF-007

Dado que existe un cupón activo con código "BLOG5" con 5% de descuento sin mínimo de compra
  Y el carrito contiene artículos sin oferta activa por valor de 100,00 €
Cuando el usuario introduce el código "BLOG5" en el campo de cupón y hace clic en "Aplicar"
Entonces el sistema valida el cupón y muestra el descuento aplicado: -5,00 €
  Y el nuevo total del pedido es 95,00 €

Datos de prueba: Cupón BLOG5 activo, 5% descuento; carrito 100,00 € sin artículos en oferta
Entorno: Staging
Tipo: Funcional
```

**CA-CHECKOUT-005: Cupón no se acumula sobre artículo en oferta**
```
Requisito origen: RF-007 (regla de no acumulación), RF-027

Dado que el cupón "BLOG5" (5% descuento) está activo
  Y el carrito contiene el artículo REF-007 que está en oferta activa (ya con precio reducido)
  Y también contiene el artículo REF-008 sin oferta por valor de 50,00 €
Cuando el usuario aplica el cupón "BLOG5"
Entonces el descuento del 5% se aplica solo sobre el artículo REF-008 (50,00 €)
  Y NO se aplica sobre el artículo REF-007 (en oferta)
  Y el sistema muestra un aviso: "El cupón no aplica sobre artículos en oferta"

Datos de prueba: Cupón BLOG5 activo; artículo REF-007 en oferta; artículo REF-008 sin oferta
Entorno: Staging
Tipo: Funcional — CRÍTICO
```

**CA-CHECKOUT-006: Pedido B2B con forma de pago del ERP**
```
Requisito origen: RF-014

Dado que el cliente B2B "empresa@test.com" tiene forma de pago "Giro a 30 días" 
  en su ficha de Avansuite
Cuando el cliente autenticado llega al paso de pago del checkout
Entonces la forma de pago "Giro a 30 días" aparece preseleccionada
  Y no se ofrecen las pasarelas de pago inmediato (tarjeta, Bizum, PayPal)
  Y el cliente no puede cambiar la forma de pago desde el checkout

Datos de prueba: Cliente B2B con forma_pago_defecto="Giro a 30 días" en la base de datos
Entorno: Staging
Tipo: Funcional
```

---

### Módulo: Portal B2B — Área Documental

**CA-B2B-001: Acceso a facturas propias y descarga PDF**
```
Requisito origen: RF-016

Dado que el cliente "empresa@test.com" (CIF B12345678) tiene 5 facturas en Avansuite
  de los últimos 3 años con estado "Factura a cliente actualizada"
Cuando accede a la sección "Contabilidad > Facturas emitidas" de la intranet
Entonces ve un listado de las 5 facturas con: número, fecha, importe sin IVA, importe con IVA
  Y puede descargar cualquiera de ellas en PDF en menos de 5 segundos
  Y el PDF descargado es el documento original de Avansuite

Datos de prueba: Cliente empresa@test.com con 5 facturas; historial 3 años
Entorno: Staging
Tipo: Funcional
```

**CA-B2B-002: Cliente no ve facturas de otro cliente**
```
Requisito origen: RF-016, RNF-009

Dado que existen dos clientes: "empresa-a@test.com" (CIF A11111111) y 
  "empresa-b@test.com" (CIF B22222222) con facturas separadas en el sistema
Cuando "empresa-a@test.com" está autenticado y accede a la sección de facturas
Entonces solo ve las facturas con CIF A11111111
  Y no puede acceder a las facturas de empresa-b@test.com bajo ninguna circunstancia
  (ni por URL directa, ni por manipulación de parámetros)

Datos de prueba: Dos clientes con facturas separadas; intentos de acceso cruzado
Entorno: Staging
Tipo: Seguridad — CRÍTICO
```

**CA-B2B-003: Vencimientos en rojo y saldo total correcto**
```
Requisito origen: RF-017

Dado que el cliente "empresa@test.com" tiene:
  - Factura FAC-2024-001 con vencimiento 01/01/2024 y saldo pendiente 150,00 € (VENCIDA)
  - Factura FAC-2026-050 con vencimiento 31/12/2026 y saldo pendiente 300,00 € (PENDIENTE)
Cuando accede a la sección "Contabilidad > Vencimientos"
Entonces FAC-2024-001 aparece destacada en rojo con la etiqueta "Vencida"
  Y FAC-2026-050 aparece sin resaltar
  Y se muestra el total "Saldo pendiente total: 450,00 €"

Datos de prueba: Dos facturas con saldos pendientes; una vencida, otra no
Entorno: Staging
Tipo: Funcional
```

**CA-B2B-004: Repetir pedido desde historial de compras**
```
Requisito origen: RF-018

Dado que el cliente "empresa@test.com" tiene en su historial de compras 
  el artículo REF-010 que compró en enero de 2026 al precio de 5,00 € (precio de ese momento)
  Y el precio actual de REF-010 es 5,50 € (precio de hoy)
Cuando el cliente accede al historial y selecciona la línea de REF-010
  Y hace clic en "Añadir al carrito"
Entonces el artículo se añade al carrito con el precio actual de 5,50 €
  Y el historial muestra el precio como "5,50 € (precio actual)" con la etiqueta visible
  Y NO muestra 5,00 € como si fuera el precio vigente

Datos de prueba: Artículo REF-010 con precio histórico 5,00 € y precio actual 5,50 €
Entorno: Staging
Tipo: Funcional — CRÍTICO
```

**CA-B2B-005: Solicitud de RMA genera incidencia con número**
```
Requisito origen: RF-021

Dado que el cliente "empresa@test.com" recibió el artículo REF-011 incorrecto en el albarán 
  ALB-2026-001
Cuando rellena el formulario de RMA con: referencia=REF-011, albarán=ALB-2026-001, 
  motivo="Artículo incorrecto" y observaciones="Pedí azul, me enviaron rojo"
  Y hace clic en "Enviar solicitud"
Entonces el sistema crea la incidencia con un número de RMA (ej. RMA-2026-0042)
  Y la incidencia aparece en la bandeja del backend de Jeyjo en menos de 1 minuto
  Y el cliente recibe email de confirmación con el número RMA
  Y el estado inicial de la incidencia es "Solicitada"

Datos de prueba: Cliente con albarán existente; datos del formulario RMA
Entorno: Staging
Tipo: Funcional
```

**CA-B2B-006: Notificación de nueva factura al cliente**
```
Requisito origen: RF-022

Dado que el sistema sincroniza una nueva factura desde Avansuite para el cliente 
  "empresa@test.com" y ese cliente tiene notificaciones por email activas
Cuando se completa el ciclo de sincronización
Entonces en menos de 5 minutos el cliente recibe un email con el asunto 
  "Nueva factura disponible en tu portal Jeyjo"
  Y aparece una notificación nueva en el centro de notificaciones de su portal

Datos de prueba: Factura nueva en Avansuite para empresa@test.com; notificaciones email=activo
Entorno: Staging
Tipo: Integración
```

---

### Módulo: Backend / Administración

**CA-BACKEND-001: Sincronización bidireccional ERP — escritura de artículo en Avansuite**
```
Requisito origen: RF-023, RI-001

Dado que el superadministrador crea un nuevo artículo en el backoffice de Payload CMS
  con referencia "TEST-001", precio P1=5,00€, precio P2=3,50€, IVA 21%
Cuando guarda el artículo y el Sync Engine procesa la escritura hacia Avansuite
Entonces el artículo "TEST-001" aparece en Avansuite en menos de 30 segundos
  Y el audit_log registra la operación con: acción="CREATE_PRODUCT", 
    entityId=TEST-001, valor_nuevo={...datos del artículo...}
  Y si la escritura hacia Avansuite falla, el error aparece en la bandeja de alertas 
    del backoffice y el registro en audit_log tiene status='error_erp'

Datos de prueba: Artículo TEST-001; credenciales API Avansuite de prueba
Entorno: Staging (con Avansuite de prueba)
Tipo: Integración — End-to-End
```

**CA-BACKEND-002: Referencia comodín excluida de la importación pública**
```
Requisito origen: RF-006, RF-023

Dado que el archivo "ImportaciónArticulos_test.xlsx" contiene la referencia "9000000001" 
  junto con otras 50 referencias normales
Cuando el superadministrador importa el archivo
Entonces la referencia "9000000001" queda marcada como comodín en la base de datos
  Y NO aparece en el catálogo público de la tienda
  Y NO aparece en los resultados del buscador
  Y el log de importación indica "1 referencia marcada como comodín y excluida del catálogo"

Datos de prueba: Archivo con referencia 9000000001 y 50 referencias normales
Entorno: Staging
Tipo: Funcional
```

**CA-BACKEND-003: Bandeja de pedidos EVA requiere validación antes de enviar**
```
Requisito origen: RF-025

Dado que EVA ha generado autónomamente el pedido EVA-2026-0015 para el cliente 
  "empresa@test.com" con 3 líneas de artículos a partir de un email recibido
Cuando el trabajador de Jeyjo accede a la bandeja "Pedidos IA - pendientes de validación"
Entonces ve el pedido EVA-2026-0015 con los detalles completos (artículos, cantidades, cliente)
  Y debe hacer clic en "Revisar y Validar" para que el pedido pase a la bandeja principal
  Y si hace clic en "Rechazar", el pedido se cancela y EVA recibe notificación para informar 
    al cliente

Datos de prueba: Pedido generado por EVA con 3 líneas; trabajador con permisos de pedidos
Entorno: Staging
Tipo: Funcional
```

**CA-BACKEND-004: Exportación de pedido en formato Avansuite**
```
Requisito origen: RF-025, RI-002

Dado que existe el pedido web PED-2026-0050 con 3 líneas de artículos para el cliente 
  "empresa@test.com" en estado "Confirmado"
Cuando el trabajador de Jeyjo hace clic en "Exportar para Avansuite" desde la ficha del pedido
Entonces se descarga un archivo Excel con el formato compatible con las plantillas de 
  importación de Avansuite
  Y el archivo importado en Avansuite genera el albarán correspondiente sin errores de formato

Datos de prueba: Pedido PED-2026-0050 con 3 líneas; exportación y reimportación en Avansuite test
Entorno: Staging (+ Avansuite entorno de prueba)
Tipo: Integración — End-to-End
```

**CA-BACKEND-005: Log de auditoría inmutable registra cambio de precio**
```
Requisito origen: RF-029

Dado que el superadministrador modifica el precio P1 del artículo REF-012 
  de 2,50 € a 2,80 €
Cuando guarda el cambio en el panel PIM
Entonces la tabla de auditoría registra un nuevo entry con:
  - userId del superadministrador
  - acción: "UPDATE_PRICE"
  - entityType: "Producto", entityId: ID del artículo REF-012
  - datos: { precio_p1_anterior: 2.500000, precio_p1_nuevo: 2.800000 }
  - timestamp del momento del cambio
  - IP de origen
  Y este registro NO puede ser modificado ni eliminado (RLS policy de solo INSERT en audit_log)

Datos de prueba: Superadmin autenticado; artículo REF-012 con P1=2.50
Entorno: Staging
Tipo: Seguridad
```

**CA-BACKEND-006: Trabajador sin acceso a datos fuera de su rol**
```
Requisito origen: RF-030

Dado que existe un usuario del equipo Jeyjo con solo el rol "catálogo" activo
Cuando ese usuario intenta acceder a la URL /admin/pedidos (bandeja de pedidos)
Entonces el backend devuelve 403 Forbidden y el panel no muestra datos de pedidos
  Y el acceso rechazado queda registrado en el log de auditoría

Datos de prueba: Usuario Jeyjo con solo rol catálogo; intento de acceso a /admin/pedidos
Entorno: Staging
Tipo: Seguridad
```

---

### Módulo: Sincronización ERP

**CA-ERP-001: Stock actualizado desde ERP en tiempo máximo**
```
Requisito origen: RF-005, RNF-004

Dado que el artículo REF-013 tiene stock = 50 en Avansuite
  Y el Sync Engine ejecuta una sincronización de stock
Cuando el stock de REF-013 baja a 2 unidades en Avansuite (albarán generado manualmente)
  Y pasa el ciclo de sincronización (máximo 15 minutos)
Entonces la plataforma web muestra el indicador azul "Últimas unidades" para REF-013
  Y el stock anterior (verde "Disponible") ya no está visible

Datos de prueba: Artículo con stock inicial 50; reducción manual a 2; umbral "últimas unidades" = 5
Entorno: Staging (con acceso a Avansuite de prueba)
Tipo: Integración
```

**CA-ERP-002: Degradación grácil ante caída de la API del ERP**
```
Requisito origen: RNF-007

Dado que la API de Avansuite está temporalmente inaccesible (simulado con un mock)
Cuando un usuario visita la ficha del artículo REF-014 o busca productos
Entonces la plataforma sirve los datos del catálogo desde la última sincronización 
  cacheada en Supabase
  Y muestra un aviso sutil (no bloqueante): "Los datos de stock pueden no estar actualizados"
  Y la tienda permanece completamente funcional para navegar y añadir al carrito
  Y el dashboard del backend muestra una alerta: "Error de conexión con ERP Avansuite 
    desde HH:MM"

Datos de prueba: API Avansuite mockeada para devolver timeout; datos de catálogo en caché
Entorno: Staging
Tipo: Resiliencia
```

---

### Módulo: Rendimiento

**CA-PERF-001: PageSpeed Score ≥ 85 en página de inicio**
```
Requisito origen: RNF-001

Dado que la página de inicio está en producción (o staging sin diferencias de infraestructura)
Cuando se ejecuta Google PageSpeed Insights sobre la URL https://jeyjo.es desde 
  dispositivo móvil
Entonces la puntuación de Rendimiento (Performance Score) es ≥ 85
  Y el LCP (Largest Contentful Paint) es < 2,5 segundos
  Y el CLS (Cumulative Layout Shift) es < 0,1
  Y el FID/INP es < 200 ms

Datos de prueba: URL de staging/producción; herramienta Google PageSpeed Insights
Entorno: Producción o staging con misma infraestructura
Tipo: Rendimiento
```

**CA-PERF-002: Búsqueda predictiva responde en < 150 ms bajo carga**
```
Requisito origen: RNF-002

Dado que hay 50 usuarios concurrentes usando el buscador simultáneamente 
  (simulado con test de carga)
Cuando cada usuario escribe un término de 4 caracteres en el buscador
Entonces el percentil 95 de latencia de respuesta (tiempo desde la petición hasta 
  recibir los resultados) es inferior a 150 ms
  Y ninguna petición individual supera 300 ms

Datos de prueba: 50 usuarios virtuales concurrentes; herramienta k6 o Artillery
Entorno: Staging
Tipo: Rendimiento
```

**CA-PERF-003: Plataforma soporta 200 usuarios concurrentes sin degradación**
```
Requisito origen: RNF-005

Dado que se simula una carga de 200 usuarios concurrentes navegando la tienda 
  (50% en páginas de catálogo, 30% en fichas de producto, 20% en checkout)
Cuando se ejecuta la prueba de carga durante 10 minutos
Entonces el TTFB promedio no supera 200 ms para páginas cacheadas
  Y la tasa de error (respuestas HTTP 5xx) es inferior al 0,1%
  Y no se producen caídas del servicio ni timeouts en las funciones serverless

Datos de prueba: 200 usuarios virtuales; perfil de navegación mixto; herramienta k6
Entorno: Staging
Tipo: Rendimiento
```

---

### Módulo: Seguridad adicional

**CA-SEG-001: URLs de PDF de facturas no son accesibles sin autenticación**
```
Requisito origen: RNF-009, RF-016

Dado que la factura FAC-2026-001 del cliente A tiene una URL firmada de Supabase Storage
Cuando un usuario no autenticado (o el cliente B autenticado) intenta acceder a esa URL
  Y la URL tiene más de 5 minutos de antigüedad (TTL expirado)
Entonces el servidor devuelve 403 Forbidden
  Y no se sirve el PDF de la factura

Datos de prueba: URL firmada de un PDF de factura con TTL de 5 minutos ya expirado
Entorno: Staging
Tipo: Seguridad
```

**CA-SEG-002: Inyección SQL no produce resultados indebidos**
```
Requisito origen: RNF-012

Dado que un atacante introduce en el campo de búsqueda el valor: 
  "'; DROP TABLE productos; --"
Cuando el sistema procesa la búsqueda
Entonces la tabla de productos no se ve afectada
  Y el sistema devuelve 0 resultados o un mensaje de búsqueda vacía
  Y no se lanza ningún error SQL visible al usuario

Datos de prueba: Input malicioso de SQL injection; verificar integridad de la tabla productos
Entorno: Staging
Tipo: Seguridad
```

---

## 3. Criterios de Aceptación de Rendimiento

| Métrica                              | Valor objetivo     | Condición de medición                                  | Herramienta          |
|--------------------------------------|--------------------|--------------------------------------------------------|----------------------|
| TTFB páginas cacheadas (CDN)         | < 200 ms           | Percentil 95; usuario en España                        | Vercel Analytics     |
| LCP página de inicio                 | < 2,5 s            | Google PageSpeed Insights, móvil                       | PageSpeed Insights   |
| CLS página de inicio                 | < 0,1              | Google PageSpeed Insights, móvil                       | PageSpeed Insights   |
| PageSpeed Score (móvil)              | ≥ 85               | URL de producción                                      | PageSpeed Insights   |
| Latencia búsqueda predictiva         | < 150 ms (p95)     | Carga de 50 usuarios concurrentes                      | k6                   |
| Latencia precio B2B personalizado    | < 200 ms (p95)     | Cliente autenticado; product page; carga normal        | Vercel Analytics     |
| Sincronización de stock (batch)      | < 15 min           | Desde cambio en ERP hasta reflejo en web               | Log de sincronización|
| Usuarios concurrentes sin degradación| 200 usuarios       | TTFB no supera 1,5x el valor base; error rate < 0,1%   | k6                   |
| Email transaccional (confirmación)   | < 60 s             | Desde confirmación del pedido hasta llegada del email  | Test manual          |

---

## 4. Criterios de Aceptación de Seguridad

| Criterio                                                                                  | Cómo se verifica                                                        |
|-------------------------------------------------------------------------------------------|-------------------------------------------------------------------------|
| Un cliente B2B no puede acceder a datos de otro cliente B2B (facturas, precios, pedidos) | Test de acceso cruzado manual + test automatizado de RLS (CA-B2B-002)  |
| Las URLs de PDFs de facturas expiran en 5 minutos y no son accesibles sin autenticación  | Test CA-SEG-001                                                          |
| El login bloquea la cuenta tras 5 intentos fallidos durante 15 minutos                  | Test CA-AUTH-004                                                         |
| Cabeceras HTTP de seguridad presentes (HSTS, CSP, X-Frame-Options)                      | Herramienta SecurityHeaders.com en URL de staging                        |
| TLS 1.3 activo y sin versiones SSL/TLS inferiores                                        | Herramienta SSL Labs (ssllabs.com/ssltest) con nota mínima A             |
| La tabla de auditoría no puede ser modificada ni borrada por ningún rol de aplicación    | Test CA-BACKEND-005 + verificación de RLS policy en Supabase             |
| Inyección SQL no produce resultados indebidos                                             | Test CA-SEG-002 + OWASP ZAP automated scan                               |
| Los PDFs de facturas no están indexados en buscadores públicos                            | Verificación en Google Search Console que las URLs de Storage no indexan |

---

## 5. Criterios de Aceptación de Datos

| Criterio                                                                                  | Cómo se verifica                                                        |
|-------------------------------------------------------------------------------------------|-------------------------------------------------------------------------|
| El precio mostrado al cliente B2B es exactamente P2 - descuento (sin redondeo diferente al del ERP) | CA-PRECIOS-002; comparar con cálculo manual basado en datos del ERP |
| La regla de no acumulación es estrictamente respetada                                     | CA-PRECIOS-003, CA-PRECIOS-004, CA-CHECKOUT-005                         |
| Las cantidades de artículos de envase cerrado solo admiten múltiplos del envase           | CA-PRECIOS-005                                                           |
| Una misma importación Excel ejecutada dos veces no duplica artículos                     | Test de idempotencia: importar el mismo archivo dos veces y verificar que el catálogo tiene el mismo número de artículos |
| Los datos de la exportación de pedidos para Avansuite son importables sin errores         | CA-BACKEND-004                                                           |
| Los documentos (facturas, albaranes) visibles en la intranet coinciden con los de Avansuite | Verificación manual comparando listados entre el ERP y el portal B2B  |

---

## 6. Plan de Pruebas de Aceptación

| ID Criterio        | Módulo                  | Tipo            | Responsable          | Entorno  | Estado  |
|--------------------|-------------------------|-----------------|----------------------|----------|---------|
| CA-AUTH-001        | Autenticación           | Funcional       | Equipo dev           | Staging  | Pendiente |
| CA-AUTH-002        | Autenticación           | Funcional       | Equipo dev           | Staging  | Pendiente |
| CA-AUTH-003        | Autenticación           | Seguridad       | Equipo dev           | Staging  | Pendiente |
| CA-AUTH-004        | Autenticación           | Seguridad       | Equipo dev           | Staging  | Pendiente |
| CA-AUTH-005        | Autenticación / MFA     | Seguridad       | Equipo dev           | Staging  | Pendiente |
| CA-PRECIOS-001     | Motor de Precios        | Funcional       | Equipo dev           | Staging  | Pendiente |
| CA-PRECIOS-002     | Motor de Precios        | Funcional       | Equipo dev           | Staging  | Pendiente |
| CA-PRECIOS-003     | Motor de Precios        | Funcional CRÍTICO| Equipo dev + Dirección | Staging  | Pendiente |
| CA-PRECIOS-004     | Motor de Precios        | Funcional CRÍTICO| Equipo dev + Dirección | Staging  | Pendiente |
| CA-PRECIOS-005     | Catálogo / Carrito      | Funcional       | Equipo dev           | Staging  | Pendiente |
| CA-SEARCH-001      | Buscador                | Funcional + Rend.| Equipo dev           | Staging  | Pendiente |
| CA-SEARCH-002      | Buscador                | Funcional       | Equipo dev           | Staging  | Pendiente |
| CA-SEARCH-003      | Buscador                | Funcional       | Equipo dev           | Staging  | Pendiente |
| CA-SEARCH-004      | Catálogo                | Funcional       | Equipo dev           | Staging  | Pendiente |
| CA-CHECKOUT-001    | Checkout                | Funcional       | Equipo dev           | Staging  | Pendiente |
| CA-CHECKOUT-002    | Checkout                | Funcional       | Equipo dev           | Staging  | Pendiente |
| CA-CHECKOUT-003    | Checkout / Pagos        | E2E Integración | Equipo dev           | Staging  | Pendiente |
| CA-CHECKOUT-004    | Checkout / Marketing    | Funcional       | Equipo dev           | Staging  | Pendiente |
| CA-CHECKOUT-005    | Checkout / Precios      | Funcional CRÍTICO| Equipo dev + Dirección | Staging | Pendiente |
| CA-CHECKOUT-006    | Checkout B2B            | Funcional       | Equipo dev           | Staging  | Pendiente |
| CA-B2B-001         | Portal B2B              | Funcional       | Equipo dev + Admin   | Staging  | Pendiente |
| CA-B2B-002         | Portal B2B              | Seguridad CRÍTICO| Equipo dev + Dirección | Staging | Pendiente |
| CA-B2B-003         | Portal B2B              | Funcional       | Equipo dev + Admin   | Staging  | Pendiente |
| CA-B2B-004         | Portal B2B / Precios    | Funcional CRÍTICO| Equipo dev + Dirección | Staging | Pendiente |
| CA-B2B-005         | Portal B2B              | Funcional       | Equipo dev           | Staging  | Pendiente |
| CA-B2B-006         | Notificaciones          | Integración     | Equipo dev           | Staging  | Pendiente |
| CA-BACKEND-001     | Backend / PIM           | Funcional       | Equipo dev           | Staging  | Pendiente |
| CA-BACKEND-002     | Backend / Catálogo      | Funcional       | Equipo dev           | Staging  | Pendiente |
| CA-BACKEND-003     | Backend / OMS           | Funcional       | Equipo dev           | Staging  | Pendiente |
| CA-BACKEND-004     | Backend / OMS           | E2E Integración | Equipo dev + Admin   | Staging  | Pendiente |
| CA-BACKEND-005     | Backend / Seguridad     | Seguridad       | Equipo dev           | Staging  | Pendiente |
| CA-BACKEND-006     | Backend / Roles         | Seguridad       | Equipo dev           | Staging  | Pendiente |
| CA-ERP-001         | Sincronización ERP      | Integración     | Equipo dev           | Staging  | Pendiente |
| CA-ERP-002         | Sincronización ERP      | Resiliencia     | Equipo dev           | Staging  | Pendiente |
| CA-PERF-001        | Rendimiento             | Rendimiento     | Equipo dev           | Producción | Pendiente |
| CA-PERF-002        | Rendimiento / Buscador  | Rendimiento     | Equipo dev           | Staging  | Pendiente |
| CA-PERF-003        | Rendimiento             | Carga           | Equipo dev           | Staging  | Pendiente |
| CA-SEG-001         | Seguridad               | Seguridad       | Equipo dev           | Staging  | Pendiente |
| CA-SEG-002         | Seguridad               | Seguridad       | Equipo dev           | Staging  | Pendiente |

---

## 7. Proceso de Aceptación Formal

**Quién valida:**
- Los criterios marcados como **Funcional** son validados por el equipo de desarrollo con los propietarios del requisito (Dirección o equipo administrativo de Jeyjo según el módulo).
- Los criterios marcados como **CRÍTICO** requieren validación explícita de Dirección de Jeyjo antes de poder pasar a producción.
- Los criterios marcados como **Seguridad** incluyen una revisión adicional de un segundo desarrollador no involucrado en la implementación.

**En qué entorno:** Toda la validación de aceptación se realiza en el entorno de **staging** (excepto CA-PERF-001 que requiere condiciones de producción). El entorno de staging es un reflejo de producción con datos de prueba anonimizados.

**Herramienta de tracking:** Los criterios de aceptación se gestionan como issues en el repositorio del proyecto (GitHub Issues) con la etiqueta `acceptance-criteria`. Cada criterio superado se cierra con comentario del validador y fecha.

**Ciclos de corrección:** Se contemplan máximo 2 ciclos de corrección por módulo antes de escalar a una reunión de decisión entre el equipo de desarrollo y Dirección. Un ciclo de corrección tiene una duración máxima de 5 días hábiles.

**Firma de aceptación:** Antes del despliegue a producción, el responsable de Jeyjo (Dirección o persona designada) firma un acta de aceptación digital (email con confirmación explícita o documento firmado) que confirma que todos los criterios marcados como Must Have han sido superados satisfactoriamente.

**Criterios de entrada a producción:**
- Todos los criterios Must Have del módulo a desplegar están en estado "Superado".
- No hay issues abiertos de severidad Alta o Crítica en el módulo.
- Los tests automatizados E2E de los flujos críticos pasan en staging.
- El despliegue ha sido revisado por al menos otro miembro del equipo (code review aprobado).

---

## Pendientes y Decisiones Abiertas

1. **Responsable: Equipo dev** — Definir la herramienta de test de carga (k6 vs Artillery) antes del sprint de rendimiento. Los scripts de carga para CA-PERF-002 y CA-PERF-003 deben estar listos antes de la semana de pruebas de rendimiento.
2. **Responsable: Dirección** — Confirmar quién firma el acta de aceptación formal y si existe un proceso de UAT (User Acceptance Testing) con clientes B2B de confianza antes del go-live del portal.
3. **Responsable: Equipo dev** — Planificar el pentest externo anual (RNF-012) con un proveedor de ciberseguridad. Se recomienda realizarlo 4-6 semanas antes del go-live para tener tiempo de remediar vulnerabilidades críticas.

---

## Historial de Cambios

| Versión | Fecha      | Autor                      | Descripción del cambio                                                                                                     |
|---------|------------|----------------------------|----------------------------------------------------------------------------------------------------------------------------|
| 1.0     | 2026-05-27 | Equipo de desarrollo Jeyjo | Creación inicial del documento                                                                                             |
| 1.1     | 2026-05-27 | Equipo de desarrollo Jeyjo | CA-AUTH-005: MFA obligatorio backoffice; CA-PRECIOS-006 nuevo (IVA snapshot); CA-SEARCH-001: Qdrant + booking style; CA-BACKEND-001: sincronización ERP bidireccional |
