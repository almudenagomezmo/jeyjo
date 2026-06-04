# 05 — Requisitos del Proyecto Jeyjo

| Campo       | Valor                                      |
|-------------|--------------------------------------------|
| Versión     | 1.1                                        |
| Fecha       | 2026-05-27                                 |
| Autor       | Equipo de desarrollo Jeyjo                 |
| Estado      | Borrador                                   |

---

## 1. Requisitos Funcionales (RF)

### Módulo: Autenticación y Control de Acceso

**RF-001 — Login y detección de grupo de cliente**
- **Descripción:** El sistema debe autenticar a los usuarios mediante email y contraseña. Tras la autenticación, debe leer el grupo de cliente del ERP (01, 02, 03, 04) y redirigir automáticamente: grupo 01 (B2C) al panel de cliente estándar; grupos 02, 03 y 04 al Portal B2B (Intranet).
- **Prioridad MoSCoW:** Must Have
- **Justificación:** Sin autenticación correcta y detección de grupo no existe segmentación de precios ni acceso al portal B2B.
- **Historia(s) de usuario origen:** US-07
- **Criterio de verificación:** Un usuario de grupo 02 que hace login ve la intranet; un usuario de grupo 01 nunca ve la intranet; un usuario no autenticado nunca ve precios B2B.

**RF-002 — MFA obligatorio para el backoffice Jeyjo; opcional para superadmin B2B de cliente**
- **Descripción:** El acceso al backoffice de Payload CMS por parte del equipo Jeyjo requiere MFA activo (TOTP compatible con Google Authenticator) sin excepción. No existe posibilidad de acceder al backoffice sin segundo factor configurado. Para el superadministrador de empresa B2B en el área de cliente, el MFA es opcional pero recomendado; puede activarlo desde su perfil. Para subusuarios B2B y clientes B2C, no se implementa MFA en la primera versión.
- **Prioridad MoSCoW:** Must Have (backoffice Jeyjo) / Could Have (superadmin B2B cliente)
- **Justificación:** El backoffice tiene acceso total a datos de clientes, precios, pedidos y configuración del sistema; requiere la máxima protección. El área de cliente B2B expone datos financieros sensibles, por lo que se recomienda MFA sin imponerlo como obligatorio.
- **Historia(s) de usuario origen:** US-07, US-20
- **Criterio de verificación:** Un usuario del equipo Jeyjo sin MFA configurado no puede acceder al backoffice. Un superadmin B2B con MFA activado debe introducir el TOTP tras las credenciales. Un superadmin B2B sin MFA accede normalmente.

**RF-003 — Gestión de subusuarios B2B con permisos granulares**
- **Descripción:** El administrador de una empresa cliente debe poder crear subusuarios con permisos configurables de forma independiente para cada sección: financiera (facturas, albaranes, vencimientos), pedidos (histórico, pedido rápido), datos maestros (mi cuenta). Debe poder configurar si los pedidos de un subusuario requieren aprobación previa.
- **Prioridad MoSCoW:** Must Have
- **Justificación:** Las empresas cliente tienen varios empleados y departamentos que necesitan acceso diferenciado.
- **Historia(s) de usuario origen:** US-12
- **Criterio de verificación:** Un subusuario sin permiso de finanzas no puede acceder a la sección de facturas aunque conozca la URL.

**RF-004 — Registro de nuevos clientes con validación**
- **Descripción:** Un visitante anónimo puede registrarse en la plataforma. Los datos mínimos requeridos son: nombre/razón social, email, CIF/NIF (si es empresa), dirección, teléfono. El registro crea el usuario en estado "pendiente de validar". El equipo de Jeyjo puede validar el registro asignando el grupo de cliente correcto. Hasta la validación, el cliente solo puede comprar como B2C (grupo 01).
- **Prioridad MoSCoW:** Must Have
- **Justificación:** Jeyjo necesita controlar la asignación de grupos y descuentos a nuevos clientes.
- **Historia(s) de usuario origen:** US-04
- **Criterio de verificación:** Un registro nuevo aparece en la bandeja de clientes pendientes del backend; tras validación, el grupo se actualiza y el cliente puede acceder al portal correspondiente.

### Módulo: Catálogo y Motor de Búsqueda

**RF-005 — Gestión de stock multi-fuente con indicadores semáforo**
- **Descripción:** El sistema debe gestionar el stock desde tres fuentes: ERP Avansuite (stock propio), Distrisantiago (FTP diario) y Arnoia (enlace web). El estado de stock visible en la web debe ser: Verde ("Disponible") si hay stock en ERP o en algún mayorista; Azul ("Últimas unidades") si el stock es bajo (umbral configurable); Rojo/Amarillo ("Disponibilidad limitada según fabricante") si no hay dato de stock de ninguna fuente. No se muestran cantidades exactas.
- **Prioridad MoSCoW:** Must Have
- **Justificación:** El stock es un criterio de compra crítico; mostrar cantidades exactas no es viable dado que los datos de mayoristas son imprecisos.
- **Historia(s) de usuario origen:** US-03
- **Criterio de verificación:** Un producto con stock en ERP muestra "Disponible" en verde; uno sin dato de ninguna fuente muestra "Disponibilidad limitada".

**RF-006 — Regla de referencias comodín**
- **Descripción:** Las referencias definidas como "comodín" en la importación (ej. 9000000001 usada para trabajos de imprenta genéricos) deben estar excluidas del catálogo público, de los resultados del buscador, del historial de compras del cliente y de las estadísticas de "más vendidos".
- **Prioridad MoSCoW:** Must Have
- **Justificación:** Las referencias comodín son artículos internos de Jeyjo que no tienen sentido en la tienda pública y distorsionan las estadísticas.
- **Historia(s) de usuario origen:** US-15
- **Criterio de verificación:** La referencia 9000000001 no aparece en ninguna búsqueda ni en el historial de compras del cliente.

**RF-007 — Motor de precios dinámico con reglas de negocio e IVA snapshot**
- **Descripción:** El sistema debe calcular el precio final de cada artículo para cada tipo de cliente aplicando estrictamente las siguientes reglas en orden de prioridad: (1) Si el cliente tiene un precio especial pactado para ese artículo (tabla de precios especiales del ERP), ese precio prevalece. (2) Si el artículo está en oferta de grupo activa, se aplica la oferta. (3) Para clientes B2B sin precio especial ni oferta, se aplica P2 menos el descuento general del cliente. (4) Para clientes B2C y visitantes anónimos, se aplica P1. **Regla crítica de no acumulación:** si se aplica la regla (2) u oferta, el descuento general del cliente B2B (regla 3) no se acumula. **IVA snapshot:** en el momento de confirmación del pedido, el tipo de IVA vigente del artículo (`iva_rate_actual`) se copia al campo `iva_rate_snapshot` de la línea del pedido; este valor es inmutable y no cambia aunque el IVA del producto se modifique en el futuro.
- **Prioridad MoSCoW:** Must Have
- **Justificación:** Esta es la regla de negocio más crítica del sistema; un error en el cálculo de precios genera pérdidas económicas o conflictos con clientes. El IVA snapshot es un requisito fiscal: los pedidos históricos deben reflejar el IVA que estaba vigente cuando se confirmaron.
- **Historia(s) de usuario origen:** US-02, US-10, US-14
- **Criterio de verificación:** Un cliente B2B con 10% descuento comprando un artículo de oferta al 15% ve solo el precio con 15% de descuento. Una línea de pedido confirmado tiene `iva_rate_snapshot` con el valor del IVA en ese momento; si se cambia el IVA del producto posteriormente, la línea del pedido no cambia.

**RF-008 — Lógica de envase cerrado en selector de cantidad**
- **Descripción:** Si un artículo está marcado como "venta por envase cerrado" con una cantidad mínima definida, el selector de cantidad solo debe permitir múltiplos de esa cantidad. Si el usuario introduce una cantidad no múltiplo, el sistema ajusta automáticamente al múltiplo superior y muestra un aviso.
- **Prioridad MoSCoW:** Must Have
- **Justificación:** Vender unidades sueltas de artículos de envase cerrado genera problemas operativos en el almacén y conflictos con el ERP.
- **Historia(s) de usuario origen:** US-03
- **Criterio de verificación:** Con un artículo de envase de 12 unidades, el carrito no permite añadir 5; ajusta a 12 y muestra aviso.

**RF-009 — Buscador predictivo tipo Booking/Amazon con Qdrant e indexación por tabla de eventos**
- **Descripción:** El buscador debe ocupar una posición prominente en la interfaz (barra hero en la cabecera o zona central de la home), siguiendo el modelo de Amazon o Booking.com. Debe mostrar sugerencias visuales en tiempo real (miniatura, nombre, precio, categoría sugerida) desde la tercera letra, con latencia inferior a 150 ms. El motor de búsqueda es Qdrant (vectorial), alimentado de forma asíncrona: cuando un producto, categoría o proveedor cambia en el backoffice, se inserta un evento en la tabla `search_events` de Supabase; un worker procesa la cola y actualiza el índice de Qdrant. Debe indexar y buscar en: nombre, referencia mayorista, referencia OEM/fabricante, código EAN. Tolerancia a errores tipográficos. Soporte de búsqueda por voz vía integración con EVA (fase posterior).
- **Prioridad MoSCoW:** Must Have
- **Justificación:** El buscador es el motor principal de descubrimiento de producto; la multiplicidad de referencias y el volumen del catálogo hacen imprescindible un motor de primera clase.
- **Historia(s) de usuario origen:** US-01
- **Criterio de verificación:** "boligrafo vic" devuelve resultados de "bolígrafo BIC" en menos de 150 ms. Al actualizar un producto en el backoffice, aparece en el índice de Qdrant en menos de 60 segundos. La cola de search_events no tiene registros con status='error' acumulados.

**RF-010 — Navegación facetada en listado de productos (PLP)**
- **Descripción:** El listado de productos debe permitir filtrar por: marca/fabricante, color, tipo de material, rango de precio, disponibilidad en stock ("En stock para envío hoy"), categoría y atributos específicos del producto. Los filtros deben ser acumulables y mostrar el número de productos resultante antes de aplicar.
- **Prioridad MoSCoW:** Must Have
- **Justificación:** Con miles de referencias, sin filtros el cliente no puede encontrar lo que busca.
- **Historia(s) de usuario origen:** US-01
- **Criterio de verificación:** Seleccionando dos filtros simultáneos, el listado muestra solo los productos que cumplen ambos.

**RF-011 — Visualización de precios dual (con IVA / sin IVA) en frontend**
- **Descripción:** Para usuarios anónimos y B2C, el precio sin IVA se muestra en grande y el precio con IVA al lado en menor tamaño. Para usuarios B2B autenticados, el precio principal es el precio neto (P2 menos descuento), sin IVA. La cabecera debe incluir un indicador que muestre el modo de precio activo ("Precios sin IVA" / "Precios con IVA").
- **Prioridad MoSCoW:** Must Have
- **Justificación:** Los clientes B2C en España esperan ver el precio con IVA; los clientes B2B trabajan con precios sin IVA. La transparencia evita disputas.
- **Historia(s) de usuario origen:** US-02
- **Criterio de verificación:** Un usuario anónimo ve "0,36 € + 0,04 € IVA (4%)"; un usuario B2B logueado ve "0,32 € (sin IVA)".

**RF-012 — Ficha de producto enriquecida con cross-selling**
- **Descripción:** La PDP debe mostrar: galería de imágenes (mínimo 1), descripción larga (HTML), atributos técnicos, precio dinámico según rol, control de envase, estado de stock semáforo, botón de añadir al carrito (con opción de pedir aunque no haya stock con aviso), archivos adjuntos descargables (manuales), y un módulo de cross-selling con productos complementarios configurables.
- **Prioridad MoSCoW:** Must Have
- **Justificación:** La PDP es el punto de decisión de compra; debe proporcionar toda la información necesaria.
- **Historia(s) de usuario origen:** US-03
- **Criterio de verificación:** Una PDP de impresora muestra sus tóneres compatibles en el módulo de cross-selling.

### Módulo: Carrito y Checkout

**RF-013 — Motor de portes automático por segmento**
- **Descripción:** El sistema debe calcular automáticamente los gastos de envío según las siguientes reglas: (B2C) si el pedido supera 39€, portes gratis; si es inferior, 5€ IVA incluido. (B2B) si el pedido supera 10€, portes gratis; si es inferior, 2,50€ de gastos mínimos de gestión. Ambas reglas y sus umbrales deben ser configurables desde el backend.
- **Prioridad MoSCoW:** Must Have
- **Justificación:** Las reglas de portes son parte de las condiciones comerciales de Jeyjo y afectan directamente al total del pedido.
- **Historia(s) de usuario origen:** US-04
- **Criterio de verificación:** Un carrito B2C de 38€ muestra "Gastos de envío: 5,00 €"; uno de 40€ muestra "Envío gratuito".

**RF-014 — Formas de pago diferenciadas por segmento**
- **Descripción:** Para clientes B2C: se ofrecen Redsys BBVA (tarjeta), Bizum, PayPal, Apple Pay, Google Pay y Transferencia bancaria. Para clientes B2B: la forma de pago se lee de la ficha del cliente en Avansuite (giro, transferencia, confirming, pagaré, etc.) y se muestra por defecto sin posibilidad de cambio por el propio cliente en el checkout.
- **Prioridad MoSCoW:** Must Have
- **Justificación:** Las formas de pago B2B son condiciones pactadas con el cliente que no pueden modificarse unilateralmente.
- **Historia(s) de usuario origen:** US-04
- **Criterio de verificación:** Un cliente B2B con forma de pago "Giro a 30 días" en Avansuite ve esa opción preseleccionada y sin posibilidad de cambio en el checkout.

**RF-015 — Botón "Solicitar presupuesto" con gestión de estados**
- **Descripción:** Además del botón "Confirmar pedido", el carrito debe tener un botón "Solicitar presupuesto" disponible para todos los usuarios. Los presupuestos deben seguir el flujo de estados: Solicitado → En revisión → Enviado → Aceptado → Pedido. El cliente recibe notificación de cambio de estado.
- **Prioridad MoSCoW:** Must Have
- **Justificación:** Algunos clientes (colegios, administraciones públicas) necesitan presupuesto formal antes de generar un pedido por normativa.
- **Historia(s) de usuario origen:** US-05
- **Criterio de verificación:** Un presupuesto solicitado aparece en el backend con estado "Solicitado" y el cliente recibe email de confirmación con número de presupuesto.

### Módulo: Portal B2B (Intranet)

**RF-016 — Área documental: facturas, albaranes, cifra 347, presupuestos**
- **Descripción:** La intranet debe mostrar, sincronizados desde Avansuite: facturas emitidas (solo "Facturas a cliente actualizadas", últimos 5 años), albaranes con indicador de estado emitido/preparado, cifra del 347, presupuestos vigentes y caducados. Todos los documentos deben ser descargables en PDF.
- **Prioridad MoSCoW:** Must Have
- **Justificación:** Este es el módulo de mayor valor para los clientes B2B; elimina la necesidad de llamar a Jeyjo para obtener documentos.
- **Historia(s) de usuario origen:** US-08, US-09
- **Criterio de verificación:** Un cliente puede descargar una factura de hace 3 años en menos de 5 segundos; no puede ver las facturas de otro cliente.

**RF-017 — Vencimientos con semáforo y saldo total pendiente**
- **Descripción:** La sección de vencimientos debe mostrar todas las facturas con saldo pendiente, resaltando en rojo las ya vencidas, mostrando la fecha de vencimiento de cada una y calculando el total acumulado pendiente de pago.
- **Prioridad MoSCoW:** Must Have
- **Justificación:** Visibilidad de la deuda pendiente es crítica para la gestión financiera del cliente y reduce llamadas al equipo de administración de Jeyjo.
- **Historia(s) de usuario origen:** US-09
- **Criterio de verificación:** Una factura con vencimiento pasado aparece destacada en rojo; el total de saldo muestra la suma correcta de todas las facturas pendientes.

**RF-018 — Historial de compras con precio actual y repetición de pedido**
- **Descripción:** El historial debe mostrar compras históricas con foto del artículo, referencia, descripción, cantidad, precio de venta recomendado ACTUAL (no el precio histórico al que se compró; si el cliente tiene precio especial en ese artículo, ese precio especial; si está en oferta, la oferta). El cliente puede seleccionar líneas y añadirlas al carrito para repetir el pedido. La sección incluye filtros por fecha, referencia, categoría y departamento/sede.
- **Prioridad MoSCoW:** Must Have
- **Justificación:** La recompra recurrente es el principal patrón de comportamiento de los clientes B2B; facilitarla es clave para la retención.
- **Historia(s) de usuario origen:** US-10
- **Criterio de verificación:** Un artículo que el cliente compró en enero al precio de enero muestra el precio actual de hoy en el historial, con la etiqueta "Precio actual".

**RF-019 — Pedido rápido por referencia y carga Excel**
- **Descripción:** La sección de pedido rápido debe permitir: introducir una referencia (mayorista, OEM o EAN) y cantidad para añadir al carrito con validación en tiempo real; cargar un archivo Excel con columnas "Referencia" y "Cantidad" para añadir múltiples artículos en un paso; campo libre para solicitar artículos no catalogados.
- **Prioridad MoSCoW:** Must Have
- **Justificación:** Los compradores profesionales conocen las referencias de los artículos que necesitan y no deben navegar por el catálogo.
- **Historia(s) de usuario origen:** US-11
- **Criterio de verificación:** Una carga Excel de 10 referencias válidas añade los 10 artículos al carrito en una sola operación.

**RF-020 — Tarifas personalizadas y precios especiales**
- **Descripción:** La sección de precios especiales debe mostrar los precios pactados individualmente para ese cliente (leídos de la tabla de precios especiales del ERP), con los campos: foto, referencia, descripción, precio recomendado, descuento 1, descuento 2, importe neto, fecha de vigencia y estado (Vigente/Caducado). Los precios caducados muestran botón "Solicitar revisión".
- **Prioridad MoSCoW:** Must Have
- **Justificación:** La transparencia sobre los precios pactados elimina fricción comercial y mejora la confianza del cliente.
- **Historia(s) de usuario origen:** US-14
- **Criterio de verificación:** Un precio especial con fecha fin pasada aparece con estado "Caducado" y el botón de revisión visible.

**RF-021 — RMA e incidencias con formulario y seguimiento**
- **Descripción:** La intranet debe incluir un formulario de solicitud de RMA con campos: referencia del artículo, número de albarán, motivo (lista cerrada + campo libre) y observaciones. Las solicitudes generan un número de RMA y siguen estados: Solicitada → En revisión → Autorizada/Rechazada. El historial de incidencias abiertas y cerradas es visible para el cliente.
- **Prioridad MoSCoW:** Must Have
- **Justificación:** Las devoluciones sin autorización previa crean problemas logísticos y contables; el formulario formaliza el proceso.
- **Historia(s) de usuario origen:** US-13
- **Criterio de verificación:** Una solicitud de RMA enviada genera un número de referencia y aparece en el backend de Jeyjo en menos de 1 minuto.

**RF-022 — Sistema de notificaciones proactivas (en portal y por email)**
- **Descripción:** El sistema debe enviar notificaciones al cliente B2B en los siguientes eventos: (a) nueva factura disponible en el portal, (b) cambio de estado en un pedido, (c) presupuesto próximo a caducar (7 días antes). Las notificaciones aparecen en un centro de notificaciones en la cabecera del portal y opcionalmente se envían por email. El cliente puede configurar sus preferencias de notificación.
- **Prioridad MoSCoW:** Should Have
- **Justificación:** Las notificaciones proactivas reducen las llamadas de seguimiento al equipo de Jeyjo.
- **Historia(s) de usuario origen:** US-21
- **Criterio de verificación:** Cuando se sincroniza una nueva factura desde el ERP para el cliente X, el cliente X recibe una notificación en su portal y un email (si lo tiene configurado así) en menos de 5 minutos.

### Módulo: Backend Administración

**RF-023 — Sincronización bidireccional con Avansuite vía API (lectura y escritura)**
- **Descripción:** El backoffice (Payload CMS) debe gestionar la sincronización bidireccional con Avansuite: (a) Lectura desde ERP: artículos, precios P1/P2, proveedores, tarifas de cliente, precios especiales, grupos de cliente, stock; (b) Escritura hacia ERP: creación y modificación de artículos, actualización de tarifas, creación y actualización de clientes, modificación de precios. Las escrituras hacia el ERP se realizan vía la API de Avansuite gestionada desde Payload CMS. El importador/exportador Excel permanece como mecanismo de respaldo para operaciones masivas o cuando la API no cubra un caso específico. Stock, facturas y albaranes son solo de lectura. Las escrituras hacia el ERP se registran en el Audit Log con el valor anterior y el nuevo.
- **Prioridad MoSCoW:** Must Have
- **Justificación:** La sincronización bidireccional por API es más fiable, trazable y en tiempo real que la importación manual de Excel, que queda como mecanismo de respaldo.
- **Historia(s) de usuario origen:** US-15
- **Criterio de verificación:** Un artículo creado en el backoffice de Payload aparece en Avansuite sin necesidad de importar Excel. Una modificación de precio hecha en el backoffice se refleja en Avansuite. Ambas operaciones quedan en el Audit Log.

**RF-024 — PIM: enriquecedor de fichas con campos SEO y gestión de imagen dual**
- **Descripción:** Para cada producto en el backoffice, debe ser posible editar: descripción larga (HTML), metadescripción (máx. 160 caracteres con contador), palabras clave, URL amigable (con autogeneración desde nombre si está vacía). Para las imágenes se soportan dos modos: (a) URL de imagen de proveedor: campo de texto donde se introduce la URL del proveedor (ej. Distrisantiago, Arnoia); la imagen se sirve directamente desde esa URL sin descarga ni almacenamiento local en Supabase; (b) Archivo de imagen adjunto: permite subir un archivo de imagen (JPG, PNG, WebP) que se almacena en Supabase Storage; si existe imagen adjunta, tiene prioridad sobre la URL de proveedor en el frontend. El campo URL amigable debe ser único; el sistema advierte de duplicados.
- **Prioridad MoSCoW:** Must Have
- **Justificación:** El dual-source de imágenes permite servir imágenes de proveedor sin coste de almacenamiento y a la vez tener imágenes propias de calidad para artículos estratégicos.
- **Historia(s) de usuario origen:** US-16
- **Criterio de verificación:** Un producto con solo URL de proveedor muestra esa imagen en la PDP (cargada desde la URL original). Un producto con imagen adjunta muestra la imagen adjunta aunque también tenga URL de proveedor. Un producto sin ninguna imagen muestra el placeholder.

**RF-025 — Bandeja de pedidos web (OMS) con exportación a Avansuite**
- **Descripción:** El backend debe mostrar todos los pedidos recibidos por la web con filtros (fecha, estado, cliente, origen). Los pedidos generados por EVA deben aparecer en una bandeja separada "Pedidos IA - pendientes de validación" con botón "Revisar y Validar". Los pedidos validados deben poder exportarse en formato Excel compatible con Avansuite para crear albaranes.
- **Prioridad MoSCoW:** Must Have
- **Justificación:** La bandeja de pedidos web es el puente entre la venta online y el ERP; sin exportación, el equipo de almacén no puede preparar los pedidos.
- **Historia(s) de usuario origen:** US-17
- **Criterio de verificación:** Un pedido exportado desde la plataforma puede importarse en Avansuite sin errores de formato y genera el albarán correspondiente.

**RF-026 — Dashboard de KPIs con alertas de sistema**
- **Descripción:** El panel principal del backend debe mostrar: ventas del día (importe y número de pedidos), ticket medio del periodo, tasa de conversión (visitantes únicos / pedidos completados), visitantes activos en tiempo real, últimos 5 pedidos, carritos activos. Debe incluir una bandeja de alertas: errores de sincronización con ERP, productos Top Ventas con stock bajo y nuevos registros de cliente pendientes de validación.
- **Prioridad MoSCoW:** Must Have
- **Justificación:** El equipo de Jeyjo necesita visibilidad del negocio digital sin tener que generar informes manualmente.
- **Historia(s) de usuario origen:** US-19
- **Criterio de verificación:** El dashboard muestra el número de pedidos del día actual; las alertas de stock bajo aparecen cuando el stock de un Top Venta baja del umbral configurado.

**RF-027 — Módulo de marketing: cupones, descuentos y recuperación de carritos**
- **Descripción:** El backend debe permitir: crear cupones con condiciones (código, tipo descuento, valor, mínimo compra, fechas, usos máximos); configurar la recuperación automática de carritos abandonados (email a 2h y 24h, configurable, con código descuento en el segundo email); gestionar reglas de precio por categoría, fabricante o atributo.
- **Prioridad MoSCoW:** Should Have
- **Justificación:** Herramientas de marketing autónomas para el equipo de Jeyjo sin necesidad de tocar código.
- **Historia(s) de usuario origen:** US-18, US-23
- **Criterio de verificación:** Un cupón creado con código "BLOG5" y 5% de descuento funciona en el checkout y no se aplica sobre artículos ya en oferta.

**RF-028 — Integración Google Analytics 4 y Google Merchant Center**
- **Descripción:** El frontend debe enviar eventos GA4 para: vistas de página, vistas de producto (view_item), añadir al carrito (add_to_cart), inicio de checkout (begin_checkout) y conversión (purchase). El backend debe generar automáticamente un feed de productos en formato Google Merchant Center (XML o CSV) actualizado al menos una vez al día.
- **Prioridad MoSCoW:** Should Have
- **Justificación:** Sin GA4 no hay datos de analítica web; sin GMC feed no hay Google Shopping.
- **Historia(s) de usuario origen:** —
- **Criterio de verificación:** Tras completar un pedido de prueba, el evento "purchase" aparece en GA4 en tiempo real; el feed GMC incluye el producto con foto, precio y URL.

**RF-029 — Log de acciones inmutable para todo el backoffice (Audit Trail)**
- **Descripción:** Toda acción realizada en el backoffice (Payload CMS) debe generar un registro en una tabla inmutable `audit_log` (solo INSERT; sin UPDATE ni DELETE posibles mediante RLS policy). Esto incluye sin excepción: creación, edición y borrado de cualquier entidad (productos, categorías, clientes, pedidos, tarifas, usuarios, cupones, configuraciones), importaciones Excel, sincronizaciones con ERP, cambios de contraseña y MFA, y cambios de permisos. Cada registro contiene: userId, nombre del operador, acción, entityType, entityId, valor anterior (JSON), valor nuevo (JSON), timestamp UTC, IP de origen. El log es consultable desde el backoffice con filtros por operador, tipo de entidad, rango de fechas y acción.
- **Prioridad MoSCoW:** Must Have
- **Justificación:** El log inmutable es la base de la trazabilidad operativa, imprescindible para auditorías, resolución de conflictos, detección de errores y cumplimiento de RGPD.
- **Historia(s) de usuario origen:** US-19, US-20
- **Criterio de verificación:** Tras modificar el precio de un producto, el audit_log tiene un registro con el precio anterior y el nuevo. Ningún usuario (ni el superadministrador) puede modificar o borrar un registro del audit_log.

**RF-030 — Control de roles del equipo interno Jeyjo**
- **Descripción:** El superadministrador puede crear cuentas para empleados de Jeyjo con acceso limitado por área funcional. Las áreas son: administración (pedidos, clientes), catálogo (productos, categorías, importaciones), personalización (diseño, banners, blog, landing pages) y mantenimiento (configuración técnica, seguridad). Un trabajador con rol "catálogo" no puede ver pedidos de clientes ni datos financieros.
- **Prioridad MoSCoW:** Must Have
- **Justificación:** Principio de mínimo privilegio; reduce el riesgo de errores accidentales y de acceso no autorizado a datos sensibles.
- **Historia(s) de usuario origen:** —
- **Criterio de verificación:** Un usuario con solo rol "catálogo" no puede acceder a la bandeja de pedidos aunque conozca la URL.

---

## 2. Requisitos No Funcionales (RNF)

### Rendimiento

**RNF-001 — Tiempo de carga de páginas cacheadas**
- Las páginas de catálogo servidas desde CDN (ISR) deben tener un TTFB inferior a 200 ms medido desde un cliente en España. El LCP (Largest Contentful Paint) debe ser inferior a 2,5 segundos. Medición con Vercel Analytics y Google PageSpeed Insights. Objetivo de puntuación ≥ 85 en PageSpeed.

**RNF-002 — Latencia del buscador predictivo**
- La respuesta del buscador predictivo (desde que el usuario escribe el tercer carácter hasta que aparecen resultados) debe ser inferior a 150 ms en el percentil 95 de las consultas, medido en condiciones de carga normal.

**RNF-003 — Consulta de precio personalizado B2B**
- El cálculo y devolución del precio personalizado para un cliente B2B (incluyendo precio especial pactado si lo hay) debe completarse en menos de 200 ms en el percentil 95, medido desde el frontend.

**RNF-004 — Sincronización de stock crítico**
- El stock proveniente del ERP Avansuite debe reflejarse en la plataforma web en un máximo de 5 minutos desde el cambio en el ERP (en modo sincronización por eventos) o como máximo en el siguiente ciclo de sincronización programado (máximo 15 minutos en modo batch).

**RNF-005 — Capacidad de usuarios concurrentes**
- La plataforma debe soportar 200 usuarios concurrentes sin degradación de rendimiento (tiempos de respuesta que no superen en más de un 20 % los valores de referencia). En picos estacionales (Vuelta al Cole, fin de año), se espera hasta 600 usuarios concurrentes; Vercel debe escalar automáticamente sin intervención manual.

### Disponibilidad

**RNF-006 — Uptime objetivo**
- La plataforma debe tener un uptime mínimo del 99,5 % mensual, equivalente a no más de 3,6 horas de caída al mes. Las ventanas de mantenimiento planificadas se notificarán con al menos 24 horas de antelación y se realizarán fuera del horario pico (lunes a viernes 9:00-20:00 hora española).

**RNF-007 — Independencia de fallos del ERP**
- Una caída temporal de la API de Avansuite no debe hacer caer la tienda pública. El sistema debe servir los datos cacheados (catálogo, precios del último sync) degradando de forma grácil y mostrando un aviso si los datos tienen más de X tiempo (configurable). El portal B2B puede mostrar documentos de la última sincronización y advertir que los datos pueden no ser en tiempo real.

**RNF-008 — RTO y RPO**
- RTO (Recovery Time Objective): la plataforma debe poder restaurarse en menos de 4 horas tras un fallo catastrófico.
- RPO (Recovery Point Objective): la pérdida máxima de datos aceptable es de 1 hora (los backups de Supabase se configurarán con frecuencia horaria en el plan de producción).

### Seguridad

**RNF-009 — Aislamiento absoluto de datos entre clientes**
- Bajo ninguna circunstancia un cliente puede acceder, leer o inferir datos de otro cliente. Este requisito se garantiza mediante Row Level Security (RLS) en PostgreSQL: todas las tablas con datos de cliente tienen policies que filtran por el ID del cliente autenticado. Las pruebas de penetración deben verificar este requisito explícitamente.

**RNF-010 — Protocolo TLS y cabeceras de seguridad**
- Todo el tráfico debe ser HTTPS obligatorio con TLS 1.3. Las cabeceras HTTP de seguridad obligatorias son: HSTS (max-age=31536000, includeSubDomains, preload), Content-Security-Policy, X-Frame-Options (DENY), X-Content-Type-Options (nosniff), Referrer-Policy.

**RNF-011 — Política de contraseñas y MFA**
- Las contraseñas de clientes (área de cliente) deben tener mínimo 8 caracteres con al menos una mayúscula, una minúscula y un número. Las contraseñas del equipo interno de Jeyjo (backoffice) deben tener mínimo 12 caracteres con los mismos requisitos más un carácter especial. Los intentos de login fallidos deben limitarse a 5 consecutivos antes de bloqueo temporal de 15 minutos. **MFA obligatorio para backoffice:** ningún usuario del equipo Jeyjo puede acceder al backoffice de Payload CMS sin tener MFA (TOTP) configurado y activo. Esta restricción no tiene excepciones, ni para el superadministrador. MFA opcional (recomendado) para el superadministrador de empresa B2B en el área de cliente.

**RNF-012 — Protección WAF y OWASP Top 10**
- El sistema debe estar protegido contra las 10 vulnerabilidades más críticas de OWASP (SQL injection, XSS, CSRF, inyección, fallo de autenticación, exposición de datos sensibles, XXE, control de acceso roto, configuración incorrecta, deserialización insegura). Se realizará un pentest anual externo.

### Usabilidad

**RNF-013 — Accesibilidad WCAG 2.1 nivel AA**
- El frontend debe cumplir con las Pautas de Accesibilidad para el Contenido Web (WCAG) 2.1 nivel AA como mínimo. Esto incluye: contraste de color suficiente (ratio mínimo 4.5:1 para texto normal), texto alternativo en imágenes, navegación por teclado, etiquetas ARIA en formularios.

**RNF-014 — Diseño responsivo**
- La plataforma debe funcionar correctamente en: Chrome, Firefox, Safari y Edge en sus últimas 2 versiones. En dispositivos móviles (iOS Safari y Chrome para Android) con tamaños de pantalla desde 320 px de ancho. El diseño responsive debe estar optimizado específicamente para compras desde móvil.

**RNF-015 — Idioma**
- La plataforma se desarrollará en castellano como idioma único. La arquitectura debe permitir añadir otros idiomas en el futuro sin refactorización mayor (uso de i18n de Next.js).

### Mantenibilidad

**RNF-016 — Cobertura de tests**
- El código de los módulos críticos (motor de precios, autenticación, importador Excel) debe tener cobertura de tests unitarios ≥ 80 %. Los flujos críticos de usuario (checkout, login B2B, importación Excel) deben tener tests E2E automatizados con Playwright que se ejecuten en cada merge a la rama principal.

**RNF-017 — Estándares de código y linting**
- Todo el código debe pasar ESLint con la configuración estricta de Next.js + TypeScript sin errores. Se usará Prettier para formateo automático. Las PR no se mergearán si los checks de CI (lint + tests + build) fallan.

**RNF-018 — Documentación de API interna**
- Las colecciones y campos de Payload CMS deben estar documentados con comentarios en el código. Los endpoints de API interna deben tener esquemas TypeScript exportados que sirvan de documentación viva.

### Portabilidad

**RNF-019 — Compatibilidad de navegadores**
- Soporte completo en: Chrome 120+, Firefox 120+, Safari 17+, Edge 120+. Soporte funcional (sin garantía de paridad visual exacta) en versiones anteriores hasta 2 versiones previas de cada navegador.

**RNF-020 — Exportabilidad de datos**
- El sistema debe permitir exportar todos los datos propios de la plataforma (pedidos, clientes, catálogo enriquecido, logs) en formatos estándar (CSV, JSON, Excel) para facilitar una eventual migración futura. No puede haber datos críticos del negocio almacenados en formatos propietarios sin exportación estándar.

---

## 3. Requisitos de Datos (RD)

**RD-001 — Volúmenes estimados**
- Catálogo de artículos: entre 5.000 y 30.000 referencias activas.
- Clientes: entre 500 y 2.000 empresas B2B activas; usuarios B2C sin límite definido.
- Pedidos históricos a importar: a confirmar por Jeyjo; estimado en 10.000-50.000 pedidos.
- Documentos ERP (facturas, albaranes): hasta 5 años de histórico por cliente; estimado 100.000-500.000 documentos.
- Imágenes de producto: entre 1 y 10 imágenes por producto; almacenamiento estimado 5-20 GB.

**RD-002 — Política de retención de datos**
- Datos de pedidos y documentos contables: mínimo 5 años (obligación fiscal española).
- Datos de clientes: hasta que el cliente solicite la eliminación (derecho al olvido RGPD) o hasta 3 años sin actividad (política de purga de cuentas inactivas).
- Logs de auditoría: mínimo 2 años.
- Sesiones de usuario: tokens de acceso de 15 minutos; refresh tokens de 30 días.

**RD-003 — Estrategia de backup y recuperación**
- Supabase realiza backups diarios automáticos en el plan Pro (point-in-time recovery). Adicionalmente, el equipo de Jeyjo debe configurar una exportación semanal de las tablas críticas a un almacenamiento externo (ej. bucket S3 independiente de Supabase). Los PDFs de documentos en Supabase Storage deben tener versionado activado.

**RD-004 — Formatos de importación/exportación**
- Importación: archivos .xlsx en los formatos estándar de Avansuite (ver lista en fichero 02-alcance).
- Exportación de pedidos: Excel en formato compatible con Avansuite (columnas idénticas a las plantillas de importación del ERP).
- Exportación de clientes: Excel en formato `ImportaciónContactosCRM.xlsx` de Avansuite.
- Feed Google Merchant Center: XML o TSV en el formato especificado por Google.
- Exportación de catálogo: CSV/Excel con todos los campos (incluidos enriquecidos).

**RD-005 — Calidad del dato**
- CIF/NIF: validación de formato (letra + 8 dígitos para empresas españolas; DNI/NIE para particulares) antes de guardar.
- Email: validación de formato RFC 5322 + verificación de dominio MX antes de guardar.
- Precios: decimales con máximo 6 posiciones (coherente con formato Avansuite); sin precios negativos salvo en campos de descuento.
- Códigos EAN: validación de dígito de control EAN-13/EAN-8 antes de indexar.
- Unicidad: no pueden existir dos productos activos con el mismo SKU del ERP; no pueden existir dos clientes con el mismo CIF en estado "validado".

---

## 4. Requisitos de Integración (RI)

**RI-001 — Integración Avansuite (ERP) — Lectura y Escritura vía API**
- **Sistema:** Avansuite ERP.
- **Tipo:** REST API (lectura y escritura bidireccional).
- **Datos leídos desde ERP:** Artículos (referencias, precios P1/P2, IVA actual, envase, stock ERP), clientes (grupo, descuento, forma de pago, CIF, datos de contacto), facturas, albaranes, presupuestos, precios especiales por cliente/artículo, tarifas de grupo.
- **Datos escritos hacia ERP:** Nuevos artículos, modificaciones de artículos, actualización de tarifas, creación/modificación de clientes, modificación de precios especiales. (Stock, facturas y albaranes son solo lectura; no se escriben desde la plataforma web.)
- **Frecuencia lectura:** Stock crítico cada 5-15 minutos. Precios y tarifas: diariamente o bajo demanda. Documentos (facturas, albaranes): bajo demanda desde el área de cliente.
- **Frecuencia escritura:** Tiempo real al guardar cambios en el backoffice. Las operaciones de escritura hacia el ERP son síncronas o con confirmación de callback según exponga la API de Avansuite.
- **Gestión de errores:** Si el ERP no responde, la plataforma sirve los últimos datos cacheados y registra el error en la bandeja de alertas del dashboard. Las escrituras fallidas hacia el ERP se registran en el audit_log con estado 'error_erp' y se reintenta con backoff exponencial (3 intentos).
- **Responsable lado Jeyjo:** Equipo de desarrollo (Payload CMS gestiona la conexión).
- **Responsable lado ERP:** Soporte Avansuite.

**RI-002 — Integración Avansuite (ERP) — Escritura (Excel)**
- **Sistema:** Avansuite ERP.
- **Tipo:** Archivo Excel exportado desde la plataforma e importado manualmente en Avansuite.
- **Datos enviados:** Nuevos clientes web (`ImportaciónContactosCRM.xlsx`), pedidos web para crear albaranes, solicitudes de modificación de datos de cliente.
- **Frecuencia:** Bajo demanda (generación manual o automatizada del archivo; importación manual por el equipo administrativo de Jeyjo).
- **Gestión de errores:** Si el Excel generado tiene un formato incompatible con Avansuite, el error se detectará en la importación manual; el sistema debe validar el formato antes de generar el archivo.

**RI-003 — Integración Distrisantiago (stock) — FTP**
- **Sistema:** Distrisantiago (mayorista principal).
- **Tipo:** FTP con archivo de stock diario.
- **Datos consumidos:** Stock disponible por referencia Distrisantiago.
- **Frecuencia:** Diaria (procesado automático al recibir el archivo en el FTP).
- **Gestión de errores:** Si no llega el archivo en el horario esperado, mantener los últimos datos de stock y registrar alerta en el dashboard.

**RI-004 — Integración Arnoia (stock) — Web Link**
- **Sistema:** Arnoia (mayorista).
- **Tipo:** Consulta a enlace web (scraping o API pública si existe).
- **Datos consumidos:** Stock disponible por referencia Arnoia.
- **Frecuencia:** Diaria o bajo demanda.
- **Gestión de errores:** Si el enlace no responde, mantener últimos datos y registrar alerta.

**RI-005 — Integración SKAI/EVA**
- **Sistema:** SKAI (asistente virtual EVA).
- **Tipo:** API REST (bidireccional).
- **Datos enviados a SKAI:** Contexto del usuario autenticado (si está logueado), datos del producto consultado, histórico de pedidos del cliente.
- **Datos recibidos de SKAI:** Respuestas del asistente para renderizar en el widget; pedidos generados autónomamente por EVA (enviados a la bandeja OMS de Payload).
- **Frecuencia:** Tiempo real (bajo demanda por interacción de usuario).
- **Gestión de errores:** Si SKAI no responde, el widget muestra "El asistente no está disponible en este momento; puedes contactar con nosotros por teléfono o email".
- **Seguridad:** EVA nunca recibe datos de un cliente cuando el usuario no está autenticado; el contexto de cliente se inyecta solo con sesión válida verificada.

**RI-006 — Integración Redsys BBVA (pagos)**
- **Sistema:** Redsys (plataforma de pagos de BBVA).
- **Tipo:** Redirección a TPV virtual Redsys + webhook de confirmación de pago.
- **Datos enviados:** Importe del pedido, referencia del pedido, URL de retorno.
- **Datos recibidos:** Confirmación de pago (autorizado/denegado), código de autorización.
- **Gestión de errores:** Si el pago es denegado, se muestra el motivo al cliente y se ofrece reintentar. Si el webhook de confirmación no llega, se implementa reconciliación periódica.

**RI-007 — Integración Google Analytics 4**
- **Sistema:** Google Analytics 4.
- **Tipo:** JavaScript SDK (gtag.js) + Server-side events para datos de compra sensibles.
- **Eventos a enviar:** page_view, view_item, add_to_cart, begin_checkout, purchase (con revenue, items, transaction_id).
- **Frecuencia:** Tiempo real, por evento de usuario.

**RI-008 — Integración Google Merchant Center**
- **Sistema:** Google Merchant Center.
- **Tipo:** Feed XML/TSV generado automáticamente por el backend y servido en URL pública.
- **Datos enviados:** Catálogo de productos públicos con: id, title, description, link, image_link, price, availability, brand, gtin.
- **Frecuencia:** Actualización diaria (cron nocturno). Google Merchant Center consulta la URL del feed periódicamente.

**RI-009 — Integración SMTP (email transaccional)**
- **Sistema:** Resend (proveedor SMTP).
- **Tipo:** API REST Resend + React Email para plantillas.
- **Emails a enviar:** Confirmación de pedido, bienvenida de nuevo cliente, recuperación de contraseña, recuperación de carrito abandonado (2h y 24h), notificación de nueva factura disponible, confirmación de solicitud de RMA, cambio de estado de pedido o presupuesto.
- **Gestión de errores:** Si el email no se entrega, se registra el error y se reintenta hasta 3 veces en las siguientes 24 horas. Los errores de entrega permanentes (hard bounce) desactivan el email de ese cliente.

---

## 5. Matriz de Trazabilidad

| RF     | Historia(s) origen | RNF relacionados        | RD relacionados | RI relacionados      |
|--------|--------------------|-------------------------|-----------------|----------------------|
| RF-001 | US-07              | RNF-009, RNF-010, RNF-011 | RD-005        | —                    |
| RF-002 | US-07              | RNF-009, RNF-011        | —               | —                    |
| RF-003 | US-12              | RNF-009, RNF-012        | RD-001          | —                    |
| RF-004 | US-04              | RNF-009, RNF-011        | RD-005          | RI-001, RI-002       |
| RF-005 | US-03              | RNF-004, RNF-007        | RD-001          | RI-001, RI-003, RI-004 |
| RF-006 | US-15              | —                       | RD-005          | RI-001               |
| RF-007 | US-02, US-10, US-14| RNF-003, RNF-009        | RD-005          | RI-001               |
| RF-008 | US-03              | —                       | RD-005          | RI-001               |
| RF-009 | US-01              | RNF-002, RNF-005        | RD-001          | —                    |
| RF-010 | US-01              | RNF-001, RNF-005        | RD-001          | —                    |
| RF-011 | US-02              | RNF-009                 | —               | RI-001               |
| RF-012 | US-03              | RNF-001, RNF-013        | RD-001          | RI-001               |
| RF-013 | US-04              | —                       | —               | —                    |
| RF-014 | US-04              | RNF-009                 | —               | RI-001, RI-006       |
| RF-015 | US-05              | —                       | —               | RI-009               |
| RF-016 | US-08, US-09       | RNF-009, RNF-010        | RD-002, RD-003  | RI-001               |
| RF-017 | US-09              | RNF-009                 | —               | RI-001               |
| RF-018 | US-10              | RNF-003, RNF-009        | —               | RI-001               |
| RF-019 | US-11              | RNF-002                 | RD-004          | —                    |
| RF-020 | US-14              | RNF-009                 | —               | RI-001               |
| RF-021 | US-13              | —                       | —               | RI-009               |
| RF-022 | US-21              | RNF-004                 | —               | RI-009               |
| RF-023 | US-15              | RNF-016, RNF-017        | RD-004, RD-005  | RI-001, RI-002       |
| RF-024 | US-16              | RNF-017, RNF-018        | RD-001          | —                    |
| RF-025 | US-17              | —                       | RD-004          | RI-001, RI-002       |
| RF-026 | US-19              | RNF-004                 | —               | RI-001               |
| RF-027 | US-18, US-23       | —                       | —               | RI-009               |
| RF-028 | —                  | RNF-001                 | —               | RI-007, RI-008       |
| RF-029 | —                  | RNF-009, RNF-012        | RD-002          | —                    |
| RF-030 | —                  | RNF-009, RNF-012        | —               | —                    |

---

## Pendientes y Decisiones Abiertas

1. **Responsable: Equipo dev + Soporte Avansuite** — Confirmar los endpoints exactos disponibles en la API de Avansuite y los campos devueltos para cada entidad. Sin este dato, RF-001, RF-005, RF-007, RF-016 y RF-018 no pueden cerrarse técnicamente.
2. **Responsable: Equipo dev** — Definir los umbrales de "stock bajo" para el indicador azul ("Últimas unidades") de RF-005. Valores sugeridos: <5 unidades para artículos de alta rotación; configurable por familia de producto.
3. **Responsable: Dirección** — Confirmar si el módulo de newsletter (RD-001) se integra con un proveedor externo de email marketing (Mailchimp, Brevo) o si el sistema interno de Resend es suficiente para el volumen inicial.

---

## Historial de Cambios

| Versión | Fecha      | Autor                      | Descripción del cambio                                                                                                     |
|---------|------------|----------------------------|----------------------------------------------------------------------------------------------------------------------------|
| 1.0     | 2026-05-27 | Equipo de desarrollo Jeyjo | Creación inicial del documento                                                                                             |
| 1.1     | 2026-05-27 | Equipo de desarrollo Jeyjo | RF-002: MFA obligatorio backoffice; RF-007: IVA snapshot en pedido; RF-009: Qdrant + tabla de eventos; RF-023: sincronización ERP bidireccional vía API; RF-024: imagen dual (URL + adjunto); RF-029: audit log todo backoffice; RNF-011: MFA backoffice obligatorio; RI-001: lectura+escritura ERP |
