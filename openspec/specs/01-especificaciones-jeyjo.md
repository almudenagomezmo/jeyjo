# 01 — Especificaciones del Proyecto Jeyjo

| Campo       | Valor                                      |
|-------------|--------------------------------------------|
| Versión     | 1.1                                        |
| Fecha       | 2026-05-27                                 |
| Autor       | Equipo de desarrollo Jeyjo                 |
| Estado      | Borrador                                   |

---

## 1. Descripción del Sistema

**Jeyjo Digital Platform** es una plataforma de comercio electrónico y autogestión de clientes híbrida B2C/B2B construida sobre el dominio `www.jeyjo.es`. El sistema integra una tienda pública orientada al consumidor final (B2C) con un área de cliente privada accesible tanto para particulares registrados (B2C) como para empresas (B2B), todo ello en un frontend unificado Next.js. La administración interna de la plataforma se gestiona desde un backoffice separado construido sobre Payload CMS, exclusivamente para el equipo de Jeyjo. Ambas capas se sincronizan de forma bidireccional con el ERP corporativo Avansuite (lectura y escritura vía API y, como mecanismo secundario, vía Excel) y con el asistente virtual de inteligencia artificial EVA (powered by SKAI).

El sistema resuelve tres problemas críticos del negocio actual. En primer lugar, la ausencia de un canal de venta online capaz de gestionar la complejidad tarifaria de Jeyjo: múltiples grupos de clientes, precios negociados por empresa, descuentos sobre tarifa, referencias comodín y lógica de envases cerrados que la web actual no puede modelar correctamente. En segundo lugar, la carga administrativa que soporta el equipo de Jeyjo al gestionar pedidos, consultas de facturas, solicitudes de albaranes y presupuestos de forma manual por teléfono, email y WhatsApp. En tercer lugar, la imposibilidad de los clientes empresa de acceder de forma autónoma a su información contable, historial de compras o tarifas pactadas sin tener que contactar con un comercial, lo que genera fricción y reduce la fidelización.

La plataforma está diseñada para que tanto un particular que busca un bolígrafo como una empresa que necesita renovar su flota de impresoras encuentren una experiencia de usuario coherente, segura y ajustada a sus condiciones comerciales específicas. El buscador de la plataforma sigue el modelo de los grandes e-commerce (estilo Amazon/Booking): prominente, con sugerencias visuales en tiempo real, categorías contextuales y tolerancia a errores, indexado sobre Qdrant mediante un sistema de eventos asíncronos. El sistema actúa como el espejo digital del ERP: todo lo que Avansuite sabe sobre un cliente empresa debe estar accesible para ese cliente en su portal privado, sin necesidad de intermediación humana para las consultas habituales.

---

## 2. Objetivos del Proyecto

1. **Poner en producción una tienda B2C funcional** con catálogo completo, motor de búsqueda tipo Booking/Amazon (Qdrant + eventos), carrito de compra y pasarelas de pago (Redsys BBVA, Bizum, PayPal, Apple Pay, Google Pay) antes del fin del primer ciclo de desarrollo completo.

2. **Lanzar el Área de Cliente** (portal unificado en Next.js para B2C y B2B) que permita a los clientes empresa acceder de forma autónoma a sus datos, historial de compras, tarifas personalizadas y realizar pedidos, reduciendo las llamadas de consulta administrativa en al menos un 40 % durante los 6 primeros meses de operación. El área documental y financiera (facturas, albaranes, cifra 347) se implementará en una fase posterior una vez que el resto del portal esté estable.

3. **Sincronizar el catálogo de productos con Avansuite de forma bidireccional** (lectura y escritura vía API, con Excel como mecanismo de respaldo) de forma que el stock, los precios y las referencias del ERP sean la única fuente de verdad para la plataforma web, con una latencia máxima de sincronización de stock crítico de 5 minutos.

4. **Integrar EVA (SKAI)** como asistente virtual omnipresente en toda la plataforma (tienda pública y área de cliente), capaz de resolver consultas de producto, estado de pedido y dudas operativas sin intervención humana para al menos el 60 % de las consultas entrantes.

5. **Implementar un motor de precios dinámico** que aplique correctamente las reglas de negocio de Jeyjo: precio P1 para B2C, precio P2 menos descuento de cliente para B2B, precios especiales pactados, ofertas de grupo y la regla crítica de no acumulación de descuento sobre productos ya en promoción. El IVA de cada artículo se toma en el momento de creación del pedido y queda registrado en él inmutablemente, independientemente de cambios futuros en el IVA del producto.

6. **Construir el backoffice de administración** (Payload CMS, exclusivo para el equipo Jeyjo) con gestión completa de catálogo enriquecida (SEO, multimedia), bandeja de pedidos, generador de campañas, recuperación de carritos abandonados y panel de KPIs en tiempo real. Todo cambio realizado en el backoffice queda registrado en un log de acciones inmutable que recoge quién, qué y cuándo.

7. **Cumplir con los estándares de ciberseguridad** OWASP Top 10, TLS 1.3, HSTS y WAF activo, con MFA obligatorio para todos los accesos al backoffice (equipo Jeyjo). Garantizando que ningún cliente pueda acceder a datos de otro cliente bajo ninguna circunstancia.

8. **Alcanzar una puntuación de rendimiento web ≥ 85 en Google PageSpeed Insights** (Core Web Vitals) para asegurar el posicionamiento SEO y una experiencia de carga inferior a 2 segundos en la página principal.

---

## 3. Contexto y Motivación

Jeyjo Material de Oficina, SL opera actualmente con una web de comercio electrónico basada en PrestaShop que cubre parcialmente las necesidades del negocio. Esta plataforma no puede modelar la complejidad tarifaria de la empresa: grupos de precio diferenciados, descuentos por cliente, precios pactados por artículo específico y la lógica de no acumulación de descuento sobre productos en oferta. Tampoco permite que los clientes B2B accedan de forma autónoma a su historial documental (facturas, albaranes, cifra del 347), lo que obliga al equipo administrativo a atender estas consultas manualmente cada día.

El blog corporativo se gestiona en una instancia de WordPress separada de la web principal, lo que fragmenta la experiencia editorial y duplica el trabajo de mantenimiento. El ERP Avansuite centraliza toda la información crítica del negocio (artículos, clientes, precios, albaranes, facturas) y expone tanto lectura como escritura por API; los cambios en productos, proveedores, tarifas y clientes pueden enviarse a Avansuite vía Payload CMS sin necesidad exclusiva de importación Excel, aunque Excel permanece como mecanismo de respaldo y para operaciones masivas puntuales.

La situación actual implica que un comercial de Jeyjo dedica parte significativa de su jornada a responder consultas de clientes sobre facturas pasadas, saldo pendiente, estado de pedidos y tarifas vigentes, tareas que podrían ser autoservidas por el propio cliente. Además, la captación de nuevos clientes B2C por vía online está limitada por la ausencia de Google Shopping (sin feed de productos activo) y por una velocidad de carga insatisfactoria que penaliza el posicionamiento orgánico.

El proyecto nace como respuesta a este conjunto de problemas: construir desde cero una plataforma moderna, mantenible por el propio equipo de Jeyjo (tecnología Next.js + Payload CMS + Supabase + Qdrant sobre Vercel), que sea la evolución natural del negocio digital de la empresa y que sirva de base para los próximos 5-10 años de crecimiento.

---

## 4. Partes Interesadas (Stakeholders)

| Rol / Nombre              | Interés en el proyecto                                                        | Influencia | Expectativas principales                                                                     |
|---------------------------|-------------------------------------------------------------------------------|------------|----------------------------------------------------------------------------------------------|
| Dirección / Propietario   | Reducir carga operativa, aumentar ventas online, fidelizar clientes empresa   | Alta       | Plataforma estable, rentable y que dé imagen profesional; métricas de venta visibles         |
| Equipo administrativo     | Automatizar consultas de clientes, reducir llamadas y emails de soporte       | Alta       | Portal de cliente funcional; clientes autónomos para facturas/albaranes/presupuestos         |
| Comerciales Jeyjo         | Herramienta para demos a clientes, seguimiento de pedidos web, gestión CRM    | Media      | Dashboard claro, cliente demo operativo, acceso a pedidos e historial desde el backoffice    |
| Equipo de almacén/pedidos | No duplicar trabajo: albaranes en ERP, no en plataforma web                  | Media      | Integración limpia con Avansuite; bandeja de pedidos web clara y exportable al ERP           |
| Clientes B2B (empresas)   | Acceso autónomo a sus datos, pedidos rápidos, autogestión sin llamar          | Alta       | Área de cliente intuitiva, facturas descargables (fase posterior), historial de compras, tarifas visibles |
| Clientes B2C (particulares)| Comprar de forma sencilla, precios claros con IVA, buena experiencia móvil  | Media      | Tienda rápida, buscador potente tipo Amazon, pago fácil con Bizum o tarjeta                  |
| Proveedor SKAI (EVA)      | Integración correcta de su API de asistente virtual                           | Media      | Especificación clara de puntos de integración y datos a consumir                             |
| Avansuite (ERP)           | Que la integración bidireccional sea estable y no sature el sistema           | Media      | Contrato de datos definido, consultas optimizadas, escrituras controladas vía API            |
| Equipo de desarrollo Jeyjo| Claridad de requisitos, arquitectura mantenible, documentación actualizada    | Alta       | Especificaciones sin ambigüedad, decisiones arquitectónicas documentadas, deuda técnica baja |

---

## 5. Capacidades Principales del Sistema

1. **Tienda B2C pública** con catálogo completo, buscador prominente tipo Booking/Amazon (barra de búsqueda hero con sugerencias visuales en tiempo real, autocompletado de categorías, tolerancia a errores, indexado en Qdrant mediante tabla de eventos asíncronos), mega-menú multinivel, ficha de producto enriquecida (SEO, multimedia con soporte de imágenes por URL de proveedor o por archivo adjunto), carrito y checkout de un solo paso con múltiples pasarelas de pago.

2. **Área de Cliente unificada (Next.js)** accesible tras autenticación para clientes B2C y B2B con historial de compras inteligente con repetición de pedidos, pedido rápido, tarifas personalizadas y gestión de RMA. El área documental y financiera (facturas, albaranes, cifra 347, presupuestos, vencimientos) se implementa en una fase posterior y se obtiene del ERP.

3. **Motor de precios dinámico** que aplica las reglas de negocio de Jeyjo: precio P1 (B2C), precio P2 menos descuento de cliente (B2B), precios especiales pactados por artículo, ofertas de grupo y la regla de no acumulación de descuento sobre producto en promoción. El tipo de IVA vigente en el momento de confirmación del pedido queda registrado inmutablemente en la línea del pedido.

4. **Integración bidireccional con Avansuite (ERP)**: lectura y escritura vía API gestionada desde Payload CMS para artículos, precios, proveedores, tarifas y clientes; Excel como mecanismo de respaldo para operaciones masivas o cuando la API no cubra un caso específico. Stock, facturas y albaranes: solo lectura.

5. **Asistente Virtual EVA** integrado en toda la plataforma (tienda pública y área de cliente), capaz de responder consultas de producto, gestión de pedidos y dudas operativas; con capacidad de generar pedidos autónomamente desde WhatsApp o email.

6. **Backoffice de administración (Payload CMS)** exclusivo para el equipo Jeyjo, con importador/exportador masivo de datos Excel, PIM enriquecido (SEO, multimedia), gestión de pedidos web, generador de campañas y descuentos, panel de KPIs en tiempo real y configuración completa del sistema. MFA obligatorio para todo acceso. Log de acciones inmutable que registra cada cambio (quién, qué entidad, valor anterior y nuevo, cuándo).

7. **SEO técnico y rendimiento web**: generación automática de metadescripciones y etiquetas SEO, feed de productos para Google Merchant Center, lazy loading, caché inteligente diferenciada por segmento de usuario (B2C anónimo vs cliente logueado), sitemap automático.

8. **Seguridad Zero Trust**: MFA obligatorio para el backoffice (equipo Jeyjo); MFA opcional pero recomendado para superadministradores B2B de clientes. Cifrado TLS 1.3 en tránsito, WAF activo, logs de auditoría inmutables, segregación de permisos y backup continuo.

9. **Gestión de subusuarios B2B**: el administrador de una empresa cliente puede crear usuarios subordinados con permisos granulares (solo ver facturas, solo hacer pedidos, acceso total), con flujo de aprobación de pedidos configurable.

10. **Sistema de notificaciones proactivas**: alertas en el portal y por email al cliente sobre nueva factura disponible (cuando esté implementado el área documental), cambio de estado de pedido, vencimiento inminente de presupuesto y productos en wishlist con stock disponible.

---

## 6. Restricciones y Limitaciones

| Restricción                            | Origen                     | Impacto en el proyecto                                                                                                              |
|----------------------------------------|----------------------------|-------------------------------------------------------------------------------------------------------------------------------------|
| Avansuite: escritura controlada vía API | Técnico / ERP             | La escritura hacia Avansuite se realiza vía API gestionada desde Payload CMS; Excel actúa como mecanismo de respaldo. Requiere validar qué endpoints de escritura expone Avansuite antes del desarrollo del módulo de sincronización bidireccional. |
| Stock, facturas y albaranes: solo lectura desde ERP | Técnico / ERP | Los movimientos de stock y los documentos contables (facturas, albaranes) se leen del ERP; no se modifican desde la plataforma web. |
| Área documental y financiera: fase final | Decisión de proyecto      | La sección de facturas, albaranes, cifra 347 y vencimientos en el portal del cliente se implementa en la última fase; el resto del portal (historial de compras, pedido rápido, tarifas) se entrega antes. |
| Ventas en España con extensibilidad    | Negocio / decisión actual  | La primera versión cubre España completa (Península, Islas, Ceuta y Melilla). El sistema de envíos y la gestión de IVA se diseña de forma extensible para poder añadir otros países en el futuro sin rediseño. |
| Stack tecnológico fijo                 | Decisión de equipo         | Next.js + Payload CMS + Supabase + Qdrant + Vercel. Las decisiones de diseño deben adaptarse a este stack.                         |
| SKAI/EVA es servicio externo           | Contrato tercero           | Las capacidades de la IA están limitadas por lo que expone la API de SKAI; cualquier funcionalidad no disponible en su API queda fuera de alcance. |
| RGPD y normativa española (LOPDGDD)    | Legal                      | Todo tratamiento de datos personales debe cumplir con RGPD: consentimiento explícito, política de cookies, derecho al olvido, registro de actividades de tratamiento. |
| Sin fecha fija de go-live              | Decisión de negocio        | Permite planificación por sprints sin presión artificial, pero requiere definición clara de MVP para evitar scope creep indefinido.  |
| Equipo de desarrollo interno           | Recursos                   | La capacidad de desarrollo está limitada por la disponibilidad del equipo interno; el ritmo de entrega debe ajustarse a esa capacidad real. |
| Imágenes de proveedor: servidas desde URL | Técnico / proveedores  | Las imágenes de Distrisantiago y Arnoia se sirven directamente desde la URL del proveedor (URL compuesta base + referencia), sin almacenamiento local en Supabase Storage. El backoffice permite también adjuntar imágenes propias como archivos, que sí se almacenan localmente. Si el proveedor da de baja el producto, la imagen deja de estar disponible. |
| IVA del producto puede variar con el tiempo | Fiscal / negocio       | El tipo de IVA aplicable a un artículo puede cambiar a lo largo del tiempo. El valor del IVA vigente en el momento de confirmación del pedido se registra inmutablemente en la línea del pedido; ningún cambio posterior en el IVA del producto altera los pedidos históricos. |
| MFA obligatorio para el backoffice     | Seguridad / decisión        | Todo acceso al backoffice de Payload CMS por parte del equipo Jeyjo requiere MFA activo. No hay excepción. |

---

## 7. Glosario de Términos

| Término                | Definición                                                                                                                                                                                      | Contexto de uso                                  |
|------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------|
| Avansuite              | ERP (Enterprise Resource Planning) utilizado por Jeyjo para gestionar artículos, clientes, pedidos, albaranes, facturas y contabilidad. Expone lectura y escritura por API; Excel como mecanismo de respaldo. | Integración, sincronización bidireccional        |
| B2B (Business to Business) | Modalidad de venta dirigida a empresas y autónomos con condiciones comerciales específicas: precios sin IVA, descuentos pactados, formas de pago a crédito.                              | Área de cliente, portal, precios                 |
| B2C (Business to Consumer) | Modalidad de venta dirigida al consumidor final particular. Precios con IVA incluido, pago inmediato, pasarelas estándar.                                                                | Tienda pública, checkout                         |
| Precio P1              | Precio de venta recomendado para clientes B2C (particulares). Incluye IVA en la visualización web.                                                                                             | Motor de precios, catálogo                       |
| Precio P2              | Precio de venta recomendado base para clientes B2B (empresas), sin IVA. Sobre este precio se aplica el descuento pactado del cliente.                                                          | Motor de precios, área de cliente B2B            |
| Descuento de cliente   | Porcentaje de descuento general asignado a un cliente B2B en su ficha de Avansuite. Se aplica sobre P2 salvo que el producto ya esté en oferta (regla de no acumulación).                       | Cálculo de precio final, motor de precios        |
| Regla de no acumulación | Regla de negocio crítica: si un producto ya está en oferta o promoción en la web, el descuento general del cliente B2B no se aplica adicionalmente.                                           | Motor de precios, checkout B2B                   |
| Grupo de cliente       | Clasificación de clientes en Avansuite que determina las tarifas y condiciones aplicables. Grupos principales: 01 (B2C/Tienda), 02 (Empresas B2B), 03 (Colegios), 04 (Concursos públicos).    | Segmentación, precios, acceso al área de cliente |
| Referencia comodín     | Código de artículo genérico (ej. 9000000001) usado en el ERP para trabajos a medida o productos no catalogados. No debe aparecer en la web pública ni contaminar estadísticas de ventas.       | Catálogo, filtros de importación, PIM            |
| Albarán                | Documento de entrega de mercancía generado en Avansuite cuando se prepara y expide un pedido. Sirve de base para la facturación mensual a clientes empresa.                                     | Área de cliente B2B, integración ERP (fase final)|
| Cifra 347              | Declaración informativa de operaciones con terceros (modelo 347 de la AEAT). El cliente B2B puede consultarla en su área de cliente para preparar su propia declaración fiscal.                 | Área de cliente B2B, área documental (fase final)|
| Vencimiento            | Fecha límite de pago de una factura. El portal B2B debe mostrar los vencimientos pendientes destacando en rojo los ya vencidos y calculando el saldo total pendiente.                           | Área de cliente B2B, área financiera (fase final)|
| RMA (Return Merchandise Authorization) | Proceso de autorización previa para la devolución de mercancía. Ningún producto puede devolverse sin autorización explícita de Jeyjo.                                             | Área de cliente, gestión de incidencias          |
| Subusuario B2B         | Usuario subordinado creado por el administrador de una empresa cliente para que empleados o departamentos puedan acceder al área de cliente con permisos limitados.                             | Portal B2B, gestión de accesos                   |
| EVA / SKAI             | Asistente virtual de inteligencia artificial proporcionado por SKAI como servicio externo. Se integra en jeyjo.es como widget flotante y responde consultas de producto, pedidos y operativas.  | Frontend, área de cliente, integración IA        |
| PIM (Product Information Management) | Módulo del backoffice dedicado a enriquecer las fichas de producto con datos de marketing que el ERP no almacena: descripciones largas, metadescripciones, palabras clave, multimedia. | Backoffice, Payload CMS, SEO                     |
| Payload CMS            | Sistema de gestión de contenidos headless utilizado como backoffice exclusivo del equipo Jeyjo. Gestiona el catálogo enriquecido, el panel de administración, las sincronizaciones con el ERP y expone una API para el frontend Next.js. | Arquitectura, backoffice, administración         |
| Supabase               | Plataforma de base de datos PostgreSQL gestionada en la nube utilizada como capa de persistencia del proyecto. Incluye autenticación, almacenamiento de ficheros y tiempo real.                 | Arquitectura, base de datos, autenticación       |
| Next.js                | Framework de React para el frontend del proyecto. Renderizado híbrido (SSR/ISR/SSG) optimizado para SEO y rendimiento. Aloja tanto la tienda pública como el área de cliente B2C/B2B.         | Arquitectura, frontend, SEO                      |
| Envase cerrado         | Configuración de un artículo en el ERP que indica que solo puede venderse en múltiplos de una cantidad mínima (ej. caja de 12 unidades). El carrito no permite añadir unidades sueltas.         | Catálogo, PDP, checkout                          |
| Qdrant                 | Motor de búsqueda vectorial utilizado para indexar el catálogo de productos. Se alimenta de forma asíncrona mediante una tabla de eventos en Supabase: cuando un producto cambia, se escribe un evento en la tabla; un worker lee esa tabla y actualiza el índice de Qdrant. Este patrón se denomina "indexación por tabla de eventos". | Búsqueda, arquitectura, rendimiento              |
| Tabla de eventos (indexación) | Tabla en Supabase que actúa como cola asíncrona para la sincronización de cambios hacia Qdrant. Cuando un producto, categoría o proveedor cambia, se inserta un registro en esta tabla. Un worker procesa los eventos pendientes y actualiza el índice de búsqueda correspondiente. | Arquitectura, Qdrant, sincronización             |
| IVA en pedido (snapshot) | El tipo de IVA aplicado a un artículo se registra en la línea del pedido en el momento de su confirmación. Este valor es inmutable: aunque el IVA del producto cambie posteriormente, los pedidos históricos conservan el IVA que estaba vigente cuando se confirmaron. | Motor de precios, pedidos, fiscalidad            |
| Log de acciones (backoffice) | Registro inmutable de todos los cambios realizados en el backoffice (Payload CMS): creación, edición y borrado de entidades, cambios de configuración, importaciones. Cada entrada recoge: operador, acción, entidad afectada, valor anterior, valor nuevo y timestamp. | Seguridad, auditoría, backoffice                 |
| ISR (Incremental Static Regeneration) | Técnica de Next.js que regenera páginas estáticas en segundo plano cuando los datos cambian, combinando rendimiento de página estática con frescura de datos.                     | Arquitectura, rendimiento, catálogo              |
| Backoffice             | Interfaz de administración de la plataforma, construida sobre Payload CMS, accesible solo para el equipo interno de Jeyjo con MFA obligatorio. Los clientes (B2C y B2B) no acceden al backoffice; ellos acceden al Área de Cliente en Next.js. | Arquitectura, administración, seguridad          |

---

## 8. Pendientes y Decisiones Abiertas

1. **Responsable: Equipo dev + Soporte Avansuite** — Confirmar los endpoints de escritura disponibles en la API de Avansuite (qué entidades admite escritura, formato de payload, autenticación). Necesario antes de iniciar el módulo de sincronización bidireccional.
2. **Responsable: Equipo dev + SKAI** — Definir los endpoints y el modelo de datos que EVA necesita consumir de la plataforma para responder consultas de cliente logueado (estado de pedido, historial, datos de cuenta).
3. **Responsable: Dirección** — Confirmar el alcance exacto de la primera fase (MVP) del área de cliente: qué módulos se entregan en la primera versión pública y cuáles van en la fase posterior que incluye el área documental.
4. **Responsable: Dirección** — Decidir el proveedor de email transaccional (Resend ya está contemplado) y si se integra un servicio de newsletter externo (Mailchimp, Brevo) o se usa Resend para todo.
5. **Responsable: Equipo dev** — Decidir el proveedor de hosting para Qdrant (Qdrant Cloud vs instancia propia en Fly.io o Railway) y establecer el contrato de datos del índice antes de iniciar el sprint de búsqueda.

---

## Historial de Cambios

| Versión | Fecha      | Autor                      | Descripción del cambio                                                                                      |
|---------|------------|----------------------------|-------------------------------------------------------------------------------------------------------------|
| 1.0     | 2026-05-27 | Equipo de desarrollo Jeyjo | Creación inicial del documento                                                                              |
| 1.1     | 2026-05-27 | Equipo de desarrollo Jeyjo | Incorporación de Qdrant como motor de búsqueda; sincronización bidireccional Avansuite; área de cliente unificada B2C+B2B; España extensible; MFA obligatorio backoffice; log de acciones; IVA snapshot en pedido; imágenes URL sin almacenamiento local + soporte adjunto; eliminado Page Builder; área documental a fase final |
