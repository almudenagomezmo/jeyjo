# 02 — Alcance del Proyecto Jeyjo

| Campo       | Valor                                      |
|-------------|--------------------------------------------|
| Versión     | 1.1                                        |
| Fecha       | 2026-05-27                                 |
| Autor       | Equipo de desarrollo Jeyjo                 |
| Estado      | Borrador                                   |

---

## 1. IN SCOPE — Dentro del Alcance

### Módulo FRONTEND — Tienda Pública (Next.js)

1. **Buscador prominente tipo Booking/Amazon**
   - Descripción: Barra de búsqueda hero con posición destacada en la cabecera y/o en el centro de la página de inicio. Muestra sugerencias visuales en tiempo real (miniatura, nombre, precio) desde la tercera letra, con secciones diferenciadas de productos sugeridos y categorías relacionadas. Autocompletado contextual, tolerancia a errores tipográficos y soporte de búsqueda por voz vía EVA. Indexado sobre Qdrant mediante tabla de eventos asíncronos en Supabase (cuando un producto cambia, se inserta un evento; un worker actualiza el índice de Qdrant).
   - Justificación: La multiplicidad de referencias y el volumen del catálogo exigen un buscador de primer nivel como experiencia central de la tienda.
   - Prioridad: Alta

2. **Cabecera sticky y mega-menú multinivel**
   - Descripción: Header fijo en scroll con mega-menú Categoría > Subcategoría > Familia, responsive (desktop hover / móvil hamburguesa). Gestión completa de ítems de menú desde el backoffice.
   - Justificación: Catálogo extenso que requiere navegación estructurada.
   - Prioridad: Alta

3. **Mini-carrito flotante**
   - Descripción: Badge numérico en header con desplegable lateral mostrando artículos, subtotal y acceso al checkout sin abandonar la página.
   - Justificación: Estándar de UX en e-commerce que reduce la fricción en el proceso de compra.
   - Prioridad: Alta

4. **Barra superior (Top Bar) con mensajes de confianza**
   - Descripción: Franja fina configurable con mensajes promocionales y de confianza (envío gratis, atención con IA).
   - Justificación: Refuerza la conversión con mensajes de valor visibles en toda la web.
   - Prioridad: Media

5. **Etiqueta de precios dual B2C/B2B en cabecera**
   - Descripción: Indicador visual que cambia automáticamente al modo "precios sin IVA" cuando detecta sesión B2B activa.
   - Justificación: Evita confusiones de precios entre tipos de cliente.
   - Prioridad: Alta

6. **Página de Inicio (Home) segmentada**
   - Descripción: Home con selector B2C/B2B, banners promocionales con fecha de inicio/fin configurables, top ventas segmentados, categorías destacadas y carruseles de productos.
   - Justificación: La segmentación del mensaje de bienvenida mejora la conversión en ambos canales.
   - Prioridad: Alta

7. **Listado de productos (PLP) con navegación facetada**
   - Descripción: Listado filtrable por marca, color, material, precio (rango), stock, eco-label. Respeto de lógica de envase cerrado. Visualización de precios dual B2C/B2B. Indicadores de stock por colores. Vista rápida y "Añadir al carrito" desde el listado. Comparativa de hasta 3 productos.
   - Justificación: Con miles de referencias, la navegación facetada es imprescindible.
   - Prioridad: Alta

8. **Ficha de producto (PDP) enriquecida con soporte de imagen dual**
   - Descripción: Galería multimedia, descripción comercial y técnica larga, motor de precios dinámico (P1/P2/precios especiales, IVA snapshoteen pedido), control de envase cerrado, estado de stock semáforo, cross-selling dinámico, archivos adjuntos. Las imágenes se sirven de dos formas: (a) desde la URL del proveedor directamente (Distrisantiago, Arnoia) sin almacenamiento local — si la URL del proveedor falla, no hay imagen; (b) como archivo adjunto subido en el backoffice y almacenado en Supabase Storage, con prioridad sobre la URL de proveedor si ambas existen.
   - Justificación: Dual-source de imágenes: las de proveedor sin coste de almacenamiento; las propias para artículos estratégicos.
   - Prioridad: Alta

9. **Carrito y Checkout de un solo paso**
   - Descripción: Carrito con campo de observaciones, campo de artículos no referenciados, selector de dirección de entrega (fiscal, alternativa, recogida en tienda Alfaro/Rincón de Soto). Motor de portes automático (B2C: gratis >39€, 5€ <39€; B2B: gratis >10€, 2,50€ <10€). Casilla de cupones y descuentos. Botones "Confirmar pedido" y "Solicitar presupuesto".
   - Justificación: Embudo final de conversión; debe ser claro, rápido y sin fricciones.
   - Prioridad: Alta

10. **Pasarelas de pago B2C**
    - Descripción: Redsys BBVA (tarjeta), Bizum, PayPal, Apple Pay, Google Pay, Transferencia bancaria. Activables/desactivables desde backoffice.
    - Justificación: Maximizar las opciones de pago reduce el abandono en el checkout B2C.
    - Prioridad: Alta

11. **Formas de pago B2B sincronizadas con ERP**
    - Descripción: La forma de pago del cliente B2B se lee de su ficha en Avansuite y se muestra por defecto; no puede ser modificada por el cliente sin solicitarlo expresamente.
    - Justificación: Las empresas tienen condiciones de pago pactadas que deben respetarse.
    - Prioridad: Alta

12. **Pie de página completo**
    - Descripción: Widget flotante de EVA, enlaces legales, zona de contacto omnicanal, nuestras tiendas, redes sociales, blog, newsletter, proyecto financiado UE, Copyright, métodos de pago aceptados, FAQ.
    - Justificación: Obligatorio legal y referencia de confianza para el usuario.
    - Prioridad: Media

13. **Blog corporativo integrado**
    - Descripción: Blog gestionado desde Payload CMS, con categorías, etiquetas, autor y optimización SEO por artículo.
    - Justificación: Actualmente en WordPress separado; se integra para unificar el mantenimiento.
    - Prioridad: Media

14. **Newsletter (suscripción y gestión)**
    - Descripción: Módulo de suscripción en frontend y gestión de lista en backoffice, con integración a servicio de email marketing externo.
    - Justificación: Canal de recuperación de clientes inactivos.
    - Prioridad: Baja

### Módulo ÁREA DE CLIENTE — Portal Unificado B2C/B2B (Next.js)

15. **Autenticación segura con gestión de subusuarios**
    - Descripción: Login con usuario/contraseña para clientes B2C y B2B. MFA opcional (recomendado) para el superadministrador de empresa. Gestión de subusuarios con permisos granulares (finanzas, pedidos, datos maestros), flujo de aprobación de pedidos de subusuarios. Clientes B2C acceden a su panel de pedidos e historial; clientes B2B acceden además a todas las secciones de empresa.
    - Justificación: El área de cliente es unificada para todos los clientes registrados; el portal B2B se diferencia por el grupo de cliente detectado en el login.
    - Prioridad: Alta

16. **Historial de compras con repetición de pedidos**
    - Descripción: Listado de compras históricas con foto, referencia, descripción, cantidad, precio actual (no histórico). Filtros por fecha, referencia, categoría, departamento. Gráficos de consumo. Capacidad de añadir líneas del histórico al carrito. Campo de observaciones y campo libre para artículos no catalogados.
    - Justificación: Facilita la recompra recurrente, que es la base del negocio B2B.
    - Prioridad: Alta

17. **Pedido rápido**
    - Descripción: Campo de texto libre donde el cliente puede escribir referencia y cantidad para añadir al carrito sin navegar por el catálogo. Compatible con carga de Excel (referencia + cantidad).
    - Justificación: Los compradores habituales conocen las referencias y no necesitan buscar.
    - Prioridad: Alta

18. **Tarifas personalizadas (Pricing B2B)**
    - Descripción: Sección que muestra los precios especiales pactados para ese cliente específico, con fecha de vigencia, estado (vigente/caducado) y botón de solicitar revisión si está caducado.
    - Justificación: Transparencia comercial y motivación de compra para el cliente empresa.
    - Prioridad: Alta

19. **Gestión de datos maestros "Mi cuenta"**
    - Descripción: Visualización de datos del cliente (nombre fiscal, CIF, dirección, contactos, formas de pago). Las modificaciones generan solicitud de validación por Jeyjo antes de aplicarse al ERP.
    - Justificación: El cliente debe poder verificar sus datos pero no modificarlos directamente en el ERP.
    - Prioridad: Alta

20. **RMA e incidencias**
    - Descripción: Formulario de solicitud de devolución/RMA, listado de incidencias abiertas y cerradas por cliente. Ninguna devolución se acepta sin autorización previa de Jeyjo.
    - Justificación: Proceso obligatorio para la gestión de devoluciones.
    - Prioridad: Alta

21. **Avisos de stock (Wishlist)**
    - Descripción: El cliente puede marcar artículos que le gustan; recibe notificación cuando el artículo entra en stock.
    - Justificación: Retiene intención de compra cuando el producto no está disponible.
    - Prioridad: Media

22. **Sistema de notificaciones proactivas**
    - Descripción: Centro de notificaciones en el área de cliente (y email opcional) para cambio de estado de pedido, vencimiento inminente de presupuesto. La notificación de nueva factura disponible se activará cuando se implemente el área documental.
    - Justificación: Proactividad informativa que reduce llamadas de seguimiento.
    - Prioridad: Media

23. **Área documental y financiera (FASE FINAL)**
    - Descripción: Acceso a facturas emitidas (últimos 5 años), albaranes, cifra del 347, presupuestos (vigentes y caducados), vencimientos con semáforo de estado y saldo total pendiente. Todo descargable en PDF. Se implementa en la última fase del proyecto, una vez que el resto del área de cliente esté estable y la integración de lectura documental con Avansuite esté completamente validada.
    - Justificación: Módulo de alto valor pero de complejidad significativa en la integración con el ERP; se difiere a la fase final para no bloquear el lanzamiento del resto del portal.
    - Prioridad: Baja (fase final)

24. **Descargas (catálogos y ofertas)**
    - Descripción: Repositorio de catálogos PDF y revistas de ofertas con fecha de inicio y fin de vigencia; desaparecen automáticamente al expirar.
    - Justificación: El cliente accede a los catálogos vigentes sin llamar a su comercial.
    - Prioridad: Media

### Módulo BACKOFFICE — Administración Jeyjo (Payload CMS)

25. **Acceso con MFA obligatorio**
    - Descripción: Todo usuario del equipo Jeyjo debe tener MFA activo (TOTP, compatible con Google Authenticator o similar) para acceder al backoffice. Sin segundo factor configurado no es posible hacer login. El superadministrador gestiona las cuentas y puede forzar el reset del MFA si un trabajador pierde acceso.
    - Justificación: El backoffice tiene acceso completo a datos de clientes, precios, pedidos y configuración del sistema; requiere la capa más alta de seguridad.
    - Prioridad: Alta

26. **Log de acciones inmutable (audit trail)**
    - Descripción: Cada acción realizada en el backoffice (creación, edición, borrado de cualquier entidad, cambios de configuración, importaciones Excel, sincronizaciones con ERP) genera un registro en una tabla de log inmutable (sin UPDATE ni DELETE). Cada registro contiene: operador (userId + nombre), acción, entidad afectada (tipo + ID), valor anterior (JSON), valor nuevo (JSON), timestamp y IP de origen. Visible desde el backoffice con filtros por operador, tipo de entidad y rango de fechas.
    - Justificación: Trazabilidad completa de todos los cambios operativos; imprescindible para auditorías, detección de errores y resolución de conflictos.
    - Prioridad: Alta

27. **Dashboard principal con KPIs en tiempo real**
    - Descripción: Panel con ventas diarias, ticket medio, tasa de conversión, visitantes actuales, últimos pedidos, carritos activos, alertas de sistema y monitorización de EVA.
    - Justificación: Visibilidad instantánea de la salud del negocio digital.
    - Prioridad: Alta

28. **Sincronización bidireccional con Avansuite (ERP) vía Payload CMS**
    - Descripción: Payload CMS gestiona la sincronización bidireccional con Avansuite: lectura de artículos, precios, proveedores, tarifas y clientes desde la API del ERP; escritura de cambios (nuevos artículos, modificaciones de ficha, nuevas tarifas, nuevos clientes) hacia Avansuite vía API. El importador/exportador Excel permanece como mecanismo de respaldo para operaciones masivas o cuando la API no cubra un caso específico.
    - Justificación: La sincronización bidireccional por API es más fiable y en tiempo real que la importación manual de Excel.
    - Prioridad: Alta

29. **Importador/Exportador masivo Excel (PIM) — mecanismo de respaldo**
    - Descripción: Herramienta para importar y exportar los archivos Excel de Avansuite (ImportaciónArticulos.xlsx, ImportacionTarifasClie.xlsx, ImportacionCDBarticulos.xlsx, etc.) como mecanismo de respaldo o para migraciones masivas puntuales.
    - Justificación: Necesario para casos que la API no cubra y para la migración inicial de datos.
    - Prioridad: Alta

30. **Enriquecedor de fichas (SEO y multimedia) con gestión de imágenes dual**
    - Descripción: Panel para añadir a cada referencia: URL de imagen de proveedor (que se sirve directamente sin almacenamiento local), archivo de imagen propio (almacenado en Supabase Storage, con prioridad sobre la URL de proveedor), vídeo, descripción larga, URL amigable, metadescripción, palabras clave.
    - Justificación: El ERP no gestiona campos de marketing digital; sin este módulo el catálogo web no es competitivo en SEO.
    - Prioridad: Alta

31. **Gestión de catálogo (categorías, productos, proveedores, atributos, stock)**
    - Descripción: CRUD completo de categorías (con posición), productos (con filtro de duplicados y referencias comodín), proveedores/fabricantes, atributos de producto, gestión masiva de stock.
    - Justificación: El equipo de Jeyjo necesita control total sobre el catálogo.
    - Prioridad: Alta

32. **Bandeja de pedidos web (OMS)**
    - Descripción: Listado de pedidos entrantes con filtros, exportación en formato compatible con Avansuite para crear albaranes, bandeja especial de pedidos generados por EVA pendientes de validación humana.
    - Justificación: Centraliza la gestión de pedidos web antes de procesarlos en el ERP.
    - Prioridad: Alta

33. **Gestión de clientes (CRM web)**
    - Descripción: Gestión de clientes B2C y B2B (validados y pendientes de validar), modificación de fichas, gestión de contraseñas, devoluciones, mensajes, productos pendientes. Asignación automática de grupos.
    - Justificación: El equipo administrativo necesita gestionar clientes web desde el backoffice.
    - Prioridad: Alta

34. **Generador de campañas y descuentos (Marketing)**
    - Descripción: Módulo de recuperación de carritos abandonados (email a 2h y a 24h con cupón), gestión de cupones y reglas de descuento.
    - Justificación: Herramienta de marketing autónoma para el equipo de Jeyjo.
    - Prioridad: Media

35. **Integraciones (GA4, Google Merchant Center, SEO técnico)**
    - Descripción: Integración con Google Analytics 4, generación automática del feed de productos para Google Merchant Center, auditor SEO técnico, generador SEO automático con variables.
    - Justificación: Sin estas integraciones no hay visibilidad de tráfico ni posibilidad de hacer Google Shopping.
    - Prioridad: Media

36. **Configuración general del sistema**
    - Descripción: Configuración de pedidos, productos, clientes, contacto (IA EVA, tiendas, teléfonos, emails), seguridad (WAF, TLS, rotación de claves), email (plantillas), registros de auditoría, configuración del buscador.
    - Justificación: El sistema debe ser operable y configurable sin tocar código.
    - Prioridad: Alta

37. **Control de roles y permisos del equipo Jeyjo**
    - Descripción: Superadministrador puede crear cuentas de trabajadores con permisos limitados por área (tienda, administración, catálogo, personalización, mantenimiento). MFA obligatorio para todos.
    - Justificación: Principio de mínimo privilegio aplicado al equipo interno.
    - Prioridad: Alta

---

## 2. OUT OF SCOPE — Fuera del Alcance

1. **Constructor de Landing Pages (Page Builder)**
   - Motivo: Decisión de proyecto. La complejidad de desarrollo de un editor drag-and-drop no aporta valor suficiente en la fase inicial frente al coste de implementación. Las landing pages de campaña se crean directamente en código por el equipo de desarrollo.

2. **Aplicación móvil nativa (iOS / Android)**
   - Motivo: El presupuesto y la complejidad no justifican una app nativa en la fase inicial; el frontend Next.js estará optimizado como web responsiva. Se evaluará en una fase futura si los datos de uso lo justifican.

3. **Ventas y envíos fuera de España**
   - Motivo: La primera versión cubre España completa. Los países europeos y mercados internacionales quedan excluidos de momento. La arquitectura se diseña de forma extensible para añadir nuevas zonas geográficas sin rediseño.

4. **Gestión de contabilidad y facturación propia**
   - Motivo: Avansuite ya gestiona la contabilidad y la facturación. La plataforma web solo consume y visualiza estos datos; no genera facturas propias ni lleva contabilidad paralela.

5. **ERP de nueva generación o sustitución de Avansuite**
   - Motivo: Avansuite seguirá siendo el ERP de Jeyjo. Su sustitución es una decisión de negocio de largo plazo que está fuera del alcance de este proyecto.

6. **Módulo de gestión de rutas de reparto**
   - Motivo: Jeyjo distribuye con vehículos propios pero la optimización de rutas es una herramienta de operaciones independiente. La plataforma web solo recoge la dirección de entrega del pedido.

7. **Tienda física integrada (TPV web)**
   - Motivo: Las ventas en la tienda física se gestionan directamente en Avansuite. No se desarrollará un módulo de punto de venta web en esta fase.

8. **Gestión de almacén (WMS)**
   - Motivo: La gestión de ubicaciones físicas en almacén es función del ERP. La plataforma web solo informa del stock disponible; no gestiona ubicaciones, pickings ni movimientos físicos.

9. **Integración con más de dos mayoristas adicionales en fase inicial (más allá de Distrisantiago y Arnoia)**
   - Motivo: El mecanismo de sincronización de stock varía por proveedor. Los demás mayoristas se integrarán en fases sucesivas conforme confirmen métodos compatibles.

10. **Desarrollo del asistente virtual EVA desde cero**
    - Motivo: EVA es un servicio externo ya contratado con SKAI. Este proyecto solo realiza la integración de su API en la plataforma.

11. **Marketplace (venta de terceros en jeyjo.es)**
    - Motivo: Jeyjo vende exclusivamente sus propios productos.

12. **Almacenamiento local de imágenes de URL de proveedor**
    - Motivo: Las imágenes de Distrisantiago y Arnoia se sirven directamente desde la URL del proveedor sin descarga ni copia local, para mantener los costes de almacenamiento al mínimo. El backoffice sí permite adjuntar imágenes propias para artículos estratégicos.

---

## 3. Límites de Integración

| Sistema externo          | Dirección              | Alcance de la integración                                                                                              | Responsable lado Jeyjo        | Responsable lado externo   |
|--------------------------|------------------------|------------------------------------------------------------------------------------------------------------------------|-------------------------------|----------------------------|
| Avansuite (ERP)          | Lectura + Escritura API| Artículos, precios, proveedores, tarifas, clientes (R+W); stock, facturas, albaranes, presupuestos, vencimientos (solo R) | Equipo dev Jeyjo / Payload CMS | Soporte Avansuite          |
| Avansuite (ERP)          | Escritura Excel (respaldo)| Operaciones masivas o casos no cubiertos por API                                                                    | Equipo dev Jeyjo (genera Excel) | Equipo admin Jeyjo (importa) |
| Distrisantiago           | Lectura (FTP)          | Stock diario de artículos del mayorista principal                                                                      | Equipo dev Jeyjo              | Soporte Distrisantiago      |
| Arnoia                   | Lectura (Web)          | Stock de artículos del mayorista Arnoia vía enlace web                                                                | Equipo dev Jeyjo              | Soporte Arnoia              |
| SKAI / EVA               | Bidireccional          | Widget de chat en frontend y área de cliente; API de EVA consume datos de catálogo, pedidos y cliente logueado         | Equipo dev Jeyjo              | Equipo SKAI                 |
| Redsys BBVA              | Bidireccional          | Pasarela de pago con tarjeta + Bizum para B2C                                                                         | Equipo dev Jeyjo              | BBVA / Redsys               |
| PayPal / Apple Pay / Google Pay | Bidireccional   | Wallets y pasarela PayPal para B2C                                                                                    | Equipo dev Jeyjo              | PayPal / Apple / Google     |
| Google Analytics 4       | Salida                 | Envío de eventos de navegación, conversión y funnel de compra                                                         | Equipo dev Jeyjo              | Google                      |
| Google Merchant Center   | Salida                 | Feed XML/CSV del catálogo público actualizado automáticamente                                                          | Equipo dev Jeyjo              | Google                      |
| SMTP / Resend            | Salida                 | Emails transaccionales (confirmación de pedido, bienvenida, recuperación de contraseña, carritos abandonados)          | Equipo dev Jeyjo              | Resend                      |
| Qdrant                   | Lectura + Escritura    | Indexación del catálogo para búsqueda vectorial; consultas de búsqueda predictiva desde el frontend                    | Equipo dev Jeyjo              | Qdrant Cloud / instancia propia |

---

## 4. Supuestos del Alcance

1. Avansuite expondrá por API endpoints de escritura para artículos, precios, proveedores, tarifas y clientes con el formato acordado. Si Avansuite no expone escritura para alguna entidad crítica, esa entidad se sincronizará mediante Excel como mecanismo de respaldo.
2. SKAI/EVA proporcionará documentación de API completa y un entorno de sandbox antes de iniciar la integración.
3. El equipo de Jeyjo tiene acceso a los ficheros Excel de importación de Avansuite (con ejemplos reales de datos) antes de iniciar el desarrollo del importador.
4. Las imágenes de Distrisantiago y Arnoia son accesibles públicamente mediante URL compuesta (base + referencia) sin autenticación adicional. Si en algún momento requieren autenticación, el equipo de Jeyjo gestionará las credenciales.
5. El certificado SSL/TLS para jeyjo.es estará disponible en Vercel para la configuración de dominio personalizado.
6. Jeyjo posee el manual de imagen corporativa (colores, tipografía, logotipos) y lo pondrá a disposición del equipo de desarrollo antes de iniciar el diseño del frontend.
7. El proveedor de email transaccional (Resend) estará configurado y con credenciales disponibles antes de la fase de pruebas de notificaciones.
8. Qdrant Cloud (o la instancia propia elegida) estará disponible y configurada antes de iniciar el sprint del motor de búsqueda.

---

## 5. Dependencias Externas

| Dependencia                        | Tipo         | Riesgo si falla                                                                 |
|------------------------------------|--------------|---------------------------------------------------------------------------------|
| API de Avansuite (R+W) operativa   | Crítica      | Sin API de escritura, los cambios en catálogo y clientes requieren importación Excel manual |
| Servicio SKAI/EVA disponible       | Alta         | Sin EVA, el asistente virtual no funciona; degradación importante de la experiencia |
| Credenciales Redsys BBVA activas   | Alta         | Sin pasarela de pago activa, el checkout B2C no puede completarse               |
| Qdrant disponible y con índice     | Alta         | Sin Qdrant, el buscador predictivo tipo Amazon no funciona                      |
| FTP Distrisantiago accesible       | Media        | Sin stock de Distrisantiago, los indicadores de disponibilidad son incompletos  |
| Google Merchant Center aprobado    | Media        | Sin aprobación, los productos no aparecen en Google Shopping                    |
| Vercel con dominio jeyjo.es        | Alta         | Sin la configuración del dominio, la plataforma no es accesible en producción   |
| Resend SMTP configurado            | Media        | Sin email transaccional, los clientes no reciben confirmaciones de pedido       |

---

## 6. Tabla Resumen

| Funcionalidad                               | In/Out Scope | Prioridad      | Módulo                  | Observaciones                                                    |
|---------------------------------------------|--------------|----------------|-------------------------|------------------------------------------------------------------|
| Buscador tipo Booking/Amazon (Qdrant)       | In           | Alta           | Frontend                | Indexación por tabla de eventos asíncronos                       |
| Mega-menú multinivel responsivo             | In           | Alta           | Frontend                | Configurable desde backoffice                                    |
| Mini-carrito flotante                       | In           | Alta           | Frontend                |                                                                  |
| Visualización precios B2C (con IVA)         | In           | Alta           | Frontend / Precios      | IVA snapshot en línea del pedido                                 |
| Visualización precios B2B (sin IVA)         | In           | Alta           | Frontend / Precios      | P2 - descuento; regla no acumulación                             |
| Filtros facetados en PLP                    | In           | Alta           | Frontend                | Incluye lógica envase cerrado                                    |
| Ficha de producto (PDP) enriquecida         | In           | Alta           | Frontend / PIM          | Imagen por URL proveedor (sin storage) o archivo adjunto (storage)|
| Carrito y checkout un solo paso             | In           | Alta           | Frontend                | Portes automáticos, campo observaciones                          |
| Pasarelas B2C (Redsys, Bizum, PayPal…)      | In           | Alta           | Frontend / Pagos        | Apple Pay y Google Pay incluidos                                 |
| Formas de pago B2B desde ERP                | In           | Alta           | Frontend / Área cliente | Sincronizadas de Avansuite; no modificables por cliente          |
| Solicitud de presupuesto (botón)            | In           | Alta           | Frontend / Backoffice   | Con estados: solicitado, revisión, enviado, aceptado, pedido     |
| Recuperación de carritos abandonados        | In           | Media          | Backoffice / Marketing  | Email a 2h y 24h; programable                                    |
| Login área de cliente (B2C y B2B)           | In           | Alta           | Área de cliente         | Redirección automática según grupo de cliente                    |
| MFA obligatorio backoffice                  | In           | Alta           | Backoffice / Seguridad  | Sin excepción para todo el equipo Jeyjo                          |
| MFA opcional área de cliente B2B           | In           | Media          | Área de cliente         | Recomendado; opcional para superadmin de empresa                 |
| Historial de compras con repetición         | In           | Alta           | Área de cliente         | Precio actual, no histórico; gráficos de consumo                |
| Pedido rápido (texto libre + Excel)         | In           | Alta           | Área de cliente         |                                                                  |
| Tarifas personalizadas por cliente          | In           | Alta           | Área de cliente         | Desde ERP; estado vigente/caducado                               |
| Gestión de subusuarios B2B                  | In           | Alta           | Área de cliente         | Permisos granulares; flujo aprobación pedidos                    |
| RMA e incidencias                           | In           | Alta           | Área de cliente         |                                                                  |
| Avisos de stock (wishlist)                  | In           | Media          | Área de cliente         |                                                                  |
| **Área documental y financiera**            | In           | **Baja (FASE FINAL)** | Área de cliente  | Facturas, albaranes, 347, vencimientos; implementar al final     |
| Descargas (catálogos con vigencia)          | In           | Media          | Área de cliente         |                                                                  |
| Log de acciones inmutable (backoffice)      | In           | Alta           | Backoffice / Seguridad  | Toda acción registrada; inmutable                                |
| Dashboard KPIs en tiempo real               | In           | Alta           | Backoffice              | Ventas, conversión, carritos activos, EVA                        |
| Sincronización bidireccional ERP (API)      | In           | Alta           | Backoffice / ERP        | Lectura y escritura vía Payload CMS                              |
| Importador/Exportador Excel (respaldo)      | In           | Alta           | Backoffice              | Para operaciones masivas y casos sin cobertura API               |
| Enriquecedor fichas SEO/multimedia          | In           | Alta           | Backoffice / PIM        | Imagen por URL proveedor + imagen adjunta (dual)                 |
| Gestión de catálogo completa                | In           | Alta           | Backoffice              | Categorías, productos, proveedores, atributos, stock masivo      |
| Bandeja de pedidos web (OMS)                | In           | Alta           | Backoffice              | Exportable a Avansuite; bandeja especial pedidos EVA             |
| Gestión de clientes CRM web                 | In           | Alta           | Backoffice              | B2C y B2B; validación de nuevos clientes                         |
| Cupones y reglas de descuento               | In           | Media          | Backoffice / Marketing  |                                                                  |
| Integración GA4                             | In           | Media          | Backoffice              |                                                                  |
| Feed Google Merchant Center                 | In           | Media          | Backoffice              | Exportación nocturna automática                                  |
| Auditor SEO técnico                         | In           | Media          | Backoffice              | Alertas de artículos sin foto, URLs rotas, meta ausentes         |
| Blog integrado en Payload CMS               | In           | Media          | Backoffice / Frontend   | Migración desde WordPress externo                                |
| Configuración general y seguridad           | In           | Alta           | Backoffice              | WAF, TLS, logs, email, buscador, rendimiento                     |
| Roles y permisos equipo Jeyjo               | In           | Alta           | Backoffice              | Superadmin + roles por área; MFA obligatorio todos               |
| **Constructor de Landing Pages**            | **Out**      | —              | —                       | Eliminado; las landing pages se crean en código                  |
| App móvil nativa                            | Out          | —              | —                       | Web responsiva como alternativa                                  |
| Escritura directa en BD Avansuite           | Out          | —              | —                       | Solo vía API o Excel; nunca escritura directa en BD del ERP      |
| Ventas fuera de España                      | Out          | —              | —                       | Arquitectura extensible para futura expansión geográfica         |
| Almacenamiento local imágenes de proveedor  | Out          | —              | —                       | Las imágenes de URL de proveedor se sirven desde la URL original |
| Gestión contabilidad propia                 | Out          | —              | —                       | Responsabilidad de Avansuite                                     |
| WMS / gestión de almacén                    | Out          | —              | —                       | Responsabilidad de Avansuite                                     |
| TPV tienda física                           | Out          | —              | —                       | Responsabilidad de Avansuite                                     |
| Marketplace de terceros                     | Out          | —              | —                       | No forma parte del modelo de negocio actual                      |
| Desarrollo del modelo IA de EVA             | Out          | —              | —                       | Responsabilidad de SKAI; solo integración de API                 |

---

## Pendientes y Decisiones Abiertas

1. **Responsable: Equipo dev + Soporte Avansuite** — Confirmar qué entidades admiten escritura por API en Avansuite y el formato de payload esperado. Determina qué operaciones pueden sincronizarse por API y cuáles requieren Excel como respaldo.
2. **Responsable: Dirección** — Confirmar el proveedor de newsletter (Resend vs servicio externo de email marketing). Afecta al módulo de suscripción y campañas.
3. **Responsable: Equipo dev** — Definir si Qdrant se aloja en Qdrant Cloud o en instancia propia (Fly.io, Railway) y dimensionar el plan antes de iniciar el sprint de búsqueda.
4. **Responsable: Dirección + Equipo dev** — Definir el MVP concreto para el primer lanzamiento público (qué ítems de alta prioridad son imprescindibles para abrir la tienda vs cuáles van en iteraciones siguientes).

---

## Historial de Cambios

| Versión | Fecha      | Autor                      | Descripción del cambio                                                                                       |
|---------|------------|----------------------------|--------------------------------------------------------------------------------------------------------------|
| 1.0     | 2026-05-27 | Equipo de desarrollo Jeyjo | Creación inicial del documento                                                                               |
| 1.1     | 2026-05-27 | Equipo de desarrollo Jeyjo | Qdrant como buscador tipo Amazon; sincronización ERP bidireccional vía API; área de cliente unificada B2C+B2B; España extensible; MFA obligatorio backoffice; log de acciones; imágenes dual (URL proveedor sin storage + adjunto con storage); área documental a fase final; Page Builder eliminado; IVA snapshot en pedido |
