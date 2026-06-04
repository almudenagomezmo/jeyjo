# 03 — User Stories del Proyecto Jeyjo

| Campo       | Valor                                      |
|-------------|--------------------------------------------|
| Versión     | 1.0                                        |
| Fecha       | 2026-05-27                                 |
| Autor       | Equipo de desarrollo Jeyjo                 |
| Estado      | Borrador                                   |

---

## 1. Roles de Usuario (Personas)

### ROL-01: Visitante Anónimo
- **Perfil:** Persona que llega a jeyjo.es sin cuenta registrada. Puede ser un particular que busca material de oficina puntualmente, o el responsable de compras de una empresa que está evaluando a Jeyjo como proveedor.
- **Responsabilidades en el sistema:** Navegar el catálogo, buscar productos, ver precios (P1 con IVA), añadir al carrito y completar una compra como invitado o registrarse.
- **Nivel técnico:** Básico.
- **Objetivos principales:** Encontrar el producto que busca rápidamente, entender el precio con claridad y completar la compra con el mínimo de pasos posibles.

### ROL-02: Cliente B2C Registrado
- **Perfil:** Particular o autónomo con cuenta en jeyjo.es, asignado al Grupo 01 (serie TI en Avansuite). Compra esporádicamente o de forma recurrente a título personal.
- **Responsabilidades en el sistema:** Gestionar su cuenta, ver su historial de pedidos, repetir compras y acceder a facturas de sus pedidos online.
- **Nivel técnico:** Básico.
- **Objetivos principales:** Repetir compras anteriores de forma rápida, descargar facturas para gastos profesionales y obtener soporte ante dudas de producto o entrega.

### ROL-03: Administrador de Empresa B2B
- **Perfil:** Responsable de compras o administrador designado de una empresa cliente de Jeyjo. Accede al portal B2B con el máximo nivel de permisos de su organización. Grupo 02 en Avansuite.
- **Responsabilidades en el sistema:** Realizar pedidos, ver toda la información documental y financiera de su empresa, gestionar subusuarios, revisar tarifas pactadas, gestionar devoluciones.
- **Nivel técnico:** Medio.
- **Objetivos principales:** Autonomía total en la gestión de su relación comercial con Jeyjo sin necesitar llamar al equipo administrativo; visibilidad completa de su cuenta.

### ROL-04: Subusuario B2B
- **Perfil:** Empleado o responsable de departamento de una empresa cliente que ha recibido acceso limitado al portal B2B por parte del administrador de su empresa.
- **Responsabilidades en el sistema:** Realizar pedidos (con o sin aprobación previa según configuración), acceder a las secciones permitidas por su administrador.
- **Nivel técnico:** Básico.
- **Objetivos principales:** Pedir el material que necesita su departamento de forma rápida y autónoma sin tener que pasar por el responsable de compras para pedidos habituales.

### ROL-05: Superadministrador Jeyjo
- **Perfil:** Miembro del equipo de Jeyjo con acceso total al backend (Payload CMS). Tiene visión global del sistema: catálogo, pedidos, clientes, marketing, configuración y seguridad.
- **Responsabilidades en el sistema:** Gestión completa de la plataforma; crear cuentas de trabajadores con permisos limitados; configurar integraciones; revisar pedidos de EVA; supervisar la salud del sistema.
- **Nivel técnico:** Avanzado.
- **Objetivos principales:** Operar la plataforma de forma eficiente, detectar problemas antes de que afecten a los clientes y mantener el catálogo y los clientes sincronizados con el ERP.

### ROL-06: Trabajador Jeyjo (rol limitado)
- **Perfil:** Empleado de Jeyjo con acceso al backend en un área específica (ej. solo gestión de pedidos, solo catálogo, solo devoluciones). Los permisos los otorga el Superadministrador.
- **Responsabilidades en el sistema:** Gestionar el área que le corresponde; no puede acceder a configuraciones del sistema ni a módulos fuera de su rol.
- **Nivel técnico:** Medio.
- **Objetivos principales:** Hacer su trabajo diario en la plataforma web sin riesgo de modificar accidentalmente configuraciones sensibles.

---

## 2. Épicas

### ÉPICA-01: Descubrimiento y Compra B2C
Cubre toda la experiencia de un usuario no identificado o cliente particular desde que llega a jeyjo.es hasta que completa una compra. Incluye navegación, búsqueda, listado, ficha de producto, carrito y checkout.
**Objetivo de negocio:** Convertir visitantes en compradores con la mínima fricción posible.

### ÉPICA-02: Portal de Autogestión B2B
Cubre todas las funcionalidades de la Intranet del Cliente para usuarios empresa: autenticación, área documental, historial de compras, pedido rápido, tarifas personalizadas, RMA y gestión de cuenta.
**Objetivo de negocio:** Reducir la carga administrativa del equipo de Jeyjo y fidelizar a los clientes empresa dándoles autonomía.

### ÉPICA-03: Administración y Gestión del Negocio
Cubre el backend de administración (Payload CMS): catálogo, pedidos, clientes, marketing, configuración e integraciones. Para el equipo interno de Jeyjo.
**Objetivo de negocio:** Que el equipo de Jeyjo pueda operar la plataforma de forma autónoma sin depender de desarrolladores para las tareas del día a día.

### ÉPICA-04: Inteligencia de Precios y Sincronización ERP
Cubre el motor de precios dinámico, la sincronización con Avansuite, la importación/exportación de datos y la lógica de descuentos y grupos de cliente.
**Objetivo de negocio:** Garantizar que los precios y datos mostrados en la web son siempre correctos y coherentes con el ERP, respetando las reglas de negocio de Jeyjo.

### ÉPICA-05: IA y Asistente Virtual EVA
Cubre la integración del asistente virtual EVA (SKAI) en toda la plataforma: widget flotante en tienda pública e intranet, búsqueda por voz, generación autónoma de pedidos desde WhatsApp/email, bandeja de revisión de pedidos IA.
**Objetivo de negocio:** Automatizar la atención al cliente y la generación de pedidos para reducir la carga operativa y mejorar la experiencia de usuario 24/7.

---

## 3. Historias de Usuario

---

### US-01: Búsqueda predictiva de productos
**Épica:** ÉPICA-01

```
Como VISITANTE ANÓNIMO
Quiero que el buscador me sugiera productos relevantes mientras escribo desde la tercera letra
Para encontrar rápidamente el artículo que necesito sin tener que escribir la referencia exacta

Criterios de aceptación:
- CA1: Al escribir 3 o más caracteres en el buscador, aparece un desplegable en menos de 150 ms mostrando hasta 10 productos con miniatura, nombre y precio, ordenados por relevancia.
- CA2: Si el usuario escribe "boligrafo vic" o "volígrafo" el sistema devuelve resultados para "bolígrafo BIC" (tolerancia a errores tipográficos activa).
- CA3: El desplegable incluye una sección de "Categorías sugeridas" (ej. "¿Buscabas en Escritura?") además de los productos.
- CA4: Los resultados del buscador contemplan los campos: nombre del producto, referencia del mayorista principal, referencia OEM/fabricante y código EAN.
- CA5: Si no hay resultados para la búsqueda, se muestra el mensaje "No hemos encontrado resultados para [término]" con sugerencias de categorías relacionadas.

Prioridad: Alta
Estimación: L
Dependencias: RF-012 (motor de búsqueda), RF-013 (indexación multicampo)
Notas: La integración de búsqueda por voz con EVA es una mejora posterior; el buscador debe funcionar sin ella.
```

---

### US-02: Visualización de precio dual (B2C)
**Épica:** ÉPICA-01

```
Como VISITANTE ANÓNIMO
Quiero ver el precio de los productos con IVA incluido y también el precio sin IVA de forma clara
Para entender exactamente cuánto voy a pagar y comparar sin confusión

Criterios de aceptación:
- CA1: En la ficha de producto y en el listado, el precio sin IVA se muestra en grande/negrita y el precio con IVA (4%, 10% o 21% según el producto) aparece al lado en formato más pequeño.
- CA2: Los porcentajes de IVA se leen desde el campo correspondiente del ERP/importación y se aplican automáticamente por artículo.
- CA3: Cuando un cliente B2B inicia sesión, la visualización cambia automáticamente a mostrar el precio base imponible (P2 menos descuento) como precio principal, sin IVA en primer plano.
- CA4: El sistema nunca muestra el precio del grupo 2 (B2B) a un usuario no autenticado; siempre muestra el precio P1 del grupo 1.

Prioridad: Alta
Estimación: M
Dependencias: US-01, RF-007 (motor de precios)
Notas: Ningún cliente del grupo 1 debe poder ver los precios del grupo 2 o 3.
```

---

### US-03: Añadir producto al carrito con control de envase cerrado
**Épica:** ÉPICA-01

```
Como VISITANTE ANÓNIMO o CLIENTE B2C REGISTRADO
Quiero añadir un producto al carrito seleccionando la cantidad que necesito
Para acumular mis compras antes de pasar por caja

Criterios de aceptación:
- CA1: El selector de cantidad en la PDP permite introducir la cantidad deseada con botones + y -.
- CA2: Si el artículo está marcado como "venta por envase cerrado" (ej. caja de 12 unidades), el selector solo permite múltiplos de la cantidad mínima de envase; si el usuario introduce 5 y el envase es de 12, el sistema ajusta automáticamente a 12 y muestra un aviso: "Este artículo se vende en cajas de 12 unidades".
- CA3: Al añadir al carrito, el mini-carrito del header se actualiza inmediatamente mostrando el nuevo artículo y el subtotal actualizado.
- CA4: Si el artículo no tiene stock pero tiene habilitado el flag de "permitir pedido sin stock", el sistema añade el artículo con el aviso: "El pedido queda pendiente de validación por comprobación de stock de la referencia [REF]".

Prioridad: Alta
Estimación: M
Dependencias: RF-019 (lógica envase cerrado), RF-005 (gestión de stock)
Notas: —
```

---

### US-04: Completar checkout B2C
**Épica:** ÉPICA-01

```
Como CLIENTE B2C REGISTRADO
Quiero completar mi compra en el menor número de pasos posibles, eligiendo dirección, método de pago y finalizando el pedido
Para recibir mi material sin fricciones y obtener confirmación inmediata

Criterios de aceptación:
- CA1: El proceso de checkout se completa en una sola pantalla o un máximo de 2 pasos (dirección + pago).
- CA2: El cliente puede elegir entre: envío a domicilio, dirección alternativa o recogida en tienda (Alfaro o Rincón de Soto).
- CA3: Si el importe del carrito es mayor de 39€, los portes aparecen automáticamente como "Envío gratuito"; si es menor, aparece "Gastos de envío: 5,00 € (IVA incluido)".
- CA4: El cliente puede aplicar un cupón de descuento en el campo correspondiente; el sistema valida el cupón y actualiza el total antes de finalizar el pedido.
- CA5: Una vez confirmado el pedido, el sistema envía un email de confirmación al cliente y otro a la dirección de Jeyjo configurada en el sistema.
- CA6: El pedido queda registrado en el backend de Jeyjo en la bandeja de pedidos web (OMS) en menos de 30 segundos tras la confirmación.

Prioridad: Alta
Estimación: XL
Dependencias: US-03, RF-020 (pasarelas de pago), RF-021 (motor de portes)
Notas: —
```

---

### US-05: Solicitar presupuesto desde la tienda
**Épica:** ÉPICA-01

```
Como VISITANTE ANÓNIMO o CLIENTE B2C REGISTRADO
Quiero poder solicitar un presupuesto en lugar de confirmar un pedido directamente
Para obtener un precio formal de Jeyjo antes de comprometer la compra (necesidad por normativa ISO u otros motivos)

Criterios de aceptación:
- CA1: En el carrito y en el checkout existe un botón "Solicitar presupuesto" además del botón "Confirmar pedido".
- CA2: Al solicitar presupuesto, el sistema crea un presupuesto con estado "Solicitado" visible en el backend y en la cuenta del cliente si está registrado.
- CA3: El presupuesto pasa por los estados: Solicitado → En revisión → Enviado → Aceptado → Pedido.
- CA4: El cliente recibe un email confirmando que su solicitud de presupuesto ha sido recibida con el número de presupuesto asignado.

Prioridad: Alta
Estimación: M
Dependencias: RF-022 (gestión de presupuestos)
Notas: —
```

---

### US-06: Comparar productos en el listado
**Épica:** ÉPICA-01

```
Como VISITANTE ANÓNIMO
Quiero seleccionar hasta 3 productos en el listado para comparar sus características en paralelo
Para elegir el modelo más adecuado a mi necesidad sin abrir múltiples pestañas

Criterios de aceptación:
- CA1: En cada tarjeta de producto del listado aparece un checkbox o botón "Comparar".
- CA2: Se pueden seleccionar entre 2 y 3 productos para comparar; al intentar añadir un cuarto, aparece el mensaje "Solo puedes comparar hasta 3 productos a la vez".
- CA3: La pantalla de comparación muestra los atributos principales de cada producto en columnas lado a lado (precio, marca, dimensiones, disponibilidad, descripción).
- CA4: Desde la pantalla de comparación se puede añadir directamente cualquiera de los productos al carrito.

Prioridad: Baja
Estimación: M
Dependencias: RF-015 (atributos de producto)
Notas: —
```

---

### US-07: Acceder al Portal B2B (Intranet)
**Épica:** ÉPICA-02

```
Como ADMINISTRADOR DE EMPRESA B2B
Quiero acceder al portal privado de mi empresa tras autenticarme con mis credenciales
Para gestionar de forma autónoma toda mi relación comercial con Jeyjo

Criterios de aceptación:
- CA1: Al hacer clic en el icono "Mi cuenta" de la cabecera e introducir credenciales de un usuario del grupo 02, el sistema redirige automáticamente al portal B2B (Intranet), no al perfil estándar de cliente B2C.
- CA2: El portal muestra el menú completo de la intranet: Mi cuenta, Contabilidad, Histórico de pedidos, Pedido rápido, Precios especiales, RMA e incidencias, Avisos de stock, Descargas, Contacto.
- CA3: Si el superadministrador del cliente tiene MFA activo, el sistema solicita el segundo factor antes de dar acceso.
- CA4: Un usuario del grupo 01 (B2C) no puede acceder al portal B2B bajo ninguna circunstancia; si intenta acceder a una URL de la intranet, se le redirige al dashboard B2C estándar.
- CA5: El portal muestra el nombre comercial y el CIF de la empresa del cliente en la cabecera una vez autenticado.

Prioridad: Alta
Estimación: L
Dependencias: RF-001 (autenticación), RF-002 (gestión de grupos)
Notas: —
```

---

### US-08: Descargar facturas del área financiera
**Épica:** ÉPICA-02

```
Como ADMINISTRADOR DE EMPRESA B2B
Quiero acceder y descargar mis facturas emitidas de los últimos 5 años
Para tener mis documentos contables accesibles en cualquier momento sin llamar a Jeyjo

Criterios de aceptación:
- CA1: El área "Contabilidad > Facturas emitidas" muestra solo las "Facturas a cliente actualizadas" del ERP (no las borradores).
- CA2: Las facturas se pueden filtrar por año, mes, número de factura e importe.
- CA3: Cada factura muestra: número, fecha, importe sin IVA, importe con IVA y botón de descarga en PDF.
- CA4: El PDF descargado es exactamente el documento generado por Avansuite, no una re-generación de la plataforma web.
- CA5: Si una factura aún no está disponible porque está en estado borrador en el ERP, no aparece en el listado del portal.
- CA6: El sistema carga el historial de los últimos 5 años para cumplir con la legislación vigente.

Prioridad: Alta
Estimación: L
Dependencias: RF-030 (integración Avansuite documentos), RF-033 (seguridad datos cruzados)
Notas: —
```

---

### US-09: Ver vencimientos pendientes de pago
**Épica:** ÉPICA-02

```
Como ADMINISTRADOR DE EMPRESA B2B
Quiero ver mis facturas pendientes de pago con sus vencimientos destacados visualmente
Para gestionar mi tesorería y evitar sorpresas con facturas vencidas

Criterios de aceptación:
- CA1: La sección "Contabilidad > Vencimientos" muestra todas las facturas con saldo pendiente, ordenadas por fecha de vencimiento ascendente.
- CA2: Las facturas ya vencidas aparecen resaltadas en rojo.
- CA3: Se muestra un total acumulado del saldo pendiente de pago de la empresa.
- CA4: Cada fila incluye: número de factura, fecha de factura, fecha de vencimiento, importe y estado (pendiente/vencido).

Prioridad: Alta
Estimación: M
Dependencias: US-08, RF-030 (integración Avansuite documentos)
Notas: —
```

---

### US-10: Repetir un pedido anterior
**Épica:** ÉPICA-02

```
Como ADMINISTRADOR DE EMPRESA B2B
Quiero seleccionar artículos de mi historial de compras y añadirlos a un nuevo pedido con un solo clic
Para reabastecer mis suministros habituales sin tener que buscar cada referencia

Criterios de aceptación:
- CA1: En "Histórico de pedidos > Datos histórico", el cliente puede ver su historial de compras con: foto del artículo (grande, para no confundirse), referencia, descripción, cantidad habitual y precio de venta recomendado ACTUAL (no el precio al que lo compró en su día; si tiene precio especial, ese precio especial; si está en oferta, la oferta).
- CA2: El cliente puede seleccionar una o varias líneas del historial y hacer clic en "Añadir al carrito" para iniciar un nuevo pedido.
- CA3: El nuevo pedido incluye un campo de observaciones y un campo libre para añadir artículos que no estén en su histórico ni en el catálogo.
- CA4: El cliente puede filtrar el histórico por fecha (desde/hasta), referencia de artículo, categoría y departamento/sede.
- CA5: El histórico muestra el precio de "hoy" para cada artículo. Si el precio actual difiere del precio pagado en el histórico de albaranes, se muestra claramente el precio actual con etiqueta "Precio actual".

Prioridad: Alta
Estimación: XL
Dependencias: RF-031 (historial de compras ERP), RF-007 (motor de precios)
Notas: Extremadamente importante para la retención B2B; mostrar el precio actual, no el histórico, para evitar disputas.
```

---

### US-11: Realizar un pedido rápido por referencia
**Épica:** ÉPICA-02

```
Como SUBUSUARIO B2B
Quiero introducir directamente la referencia del artículo y la cantidad para añadirlo al carrito
Para realizar pedidos rápidos de artículos que conozco sin necesidad de navegar por el catálogo

Criterios de aceptación:
- CA1: La sección "Pedido rápido" tiene un campo de texto donde el usuario puede introducir una referencia (del mayorista, OEM o EAN) y la cantidad deseada.
- CA2: El sistema valida la referencia en tiempo real y muestra el nombre, foto y precio del artículo antes de añadirlo al carrito.
- CA3: El usuario puede subir un archivo Excel con columnas "Referencia" y "Cantidad" para añadir múltiples artículos al carrito de una sola vez.
- CA4: Si la referencia no existe en el catálogo, el sistema lo indica y ofrece una caja de texto libre para que el cliente pueda pedir el artículo como "referencia no catalogada".

Prioridad: Alta
Estimación: M
Dependencias: RF-013 (indexación de referencias), US-07
Notas: —
```

---

### US-12: Gestionar subusuarios de mi empresa
**Épica:** ÉPICA-02

```
Como ADMINISTRADOR DE EMPRESA B2B
Quiero crear y gestionar usuarios para los empleados o departamentos de mi empresa
Para que puedan realizar pedidos con autonomía pero con los permisos adecuados

Criterios de aceptación:
- CA1: El administrador puede crear subusuarios introduciendo nombre, email y contraseña inicial.
- CA2: Para cada subusuario, el administrador puede activar o desactivar el acceso a: sección financiera (facturas/albaranes), sección de pedidos, datos maestros de la cuenta.
- CA3: Puede configurar si los pedidos de un subusuario requieren aprobación del administrador antes de enviarse a Jeyjo o si se envían directamente.
- CA4: El administrador puede desactivar un subusuario sin borrar su historial de pedidos.

Prioridad: Alta
Estimación: L
Dependencias: RF-003 (gestión de subusuarios)
Notas: —
```

---

### US-13: Solicitar RMA (devolución)
**Épica:** ÉPICA-02

```
Como ADMINISTRADOR DE EMPRESA B2B
Quiero solicitar la devolución de un artículo recibido de forma incorrecta o defectuosa
Para resolver la incidencia de forma ordenada y con trazabilidad

Criterios de aceptación:
- CA1: En la sección "RMA e incidencias" existe un formulario con los campos: referencia del artículo, número de albarán, motivo de la devolución (lista: artículo incorrecto, artículo defectuoso, cantidad incorrecta, otro) y campo de observaciones libre.
- CA2: Tras enviar el formulario, el sistema crea una incidencia con número de referencia y estado "Solicitada", y envía un email de confirmación al cliente.
- CA3: El listado de incidencias abiertas y cerradas es visible para el cliente en su portal.
- CA4: El sistema muestra claramente que ninguna devolución se acepta sin autorización previa de Jeyjo.

Prioridad: Alta
Estimación: M
Dependencias: RF-036 (gestión RMA)
Notas: EVA debe tener acceso a este historial para no repetir errores con el cliente.
```

---

### US-14: Ver tarifas personalizadas pactadas
**Épica:** ÉPICA-02

```
Como ADMINISTRADOR DE EMPRESA B2B
Quiero ver los precios especiales que tengo pactados con Jeyjo para mis artículos habituales
Para conocer exactamente mis condiciones comerciales vigentes y saber cuándo caducan

Criterios de aceptación:
- CA1: La sección "Precios especiales" muestra la tabla de precios pactados con los campos: foto, referencia, descripción, cantidad (si el precio depende de unidades), precio de venta recomendado, descuento 1, descuento 2, importe neto, fecha de fin de vigencia, estado (Vigente/Caducado).
- CA2: Los precios con estado "Caducado" muestran un botón "Solicitar revisión de precio" para que el cliente pueda solicitar su renovación.
- CA3: Los precios con estado "Vigente" no muestran el botón de revisión para no generar solicitudes innecesarias.
- CA4: La sección también muestra las ofertas de grupo activas (revista de ofertas, catálogo estacional) que aplican a su grupo de cliente.

Prioridad: Alta
Estimación: M
Dependencias: RF-031 (precios especiales ERP), RF-007 (motor de precios)
Notas: —
```

---

### US-15: Importar catálogo de productos desde Excel
**Épica:** ÉPICA-03

```
Como SUPERADMINISTRADOR JEYJO
Quiero subir el archivo Excel de importación de artículos de Avansuite (ImporációnArticulos.xlsx) para actualizar masivamente el catálogo de la plataforma
Para mantener el catálogo web sincronizado con el ERP sin picar datos a mano

Criterios de aceptación:
- CA1: El módulo PIM dispone de un área de importación donde se puede subir el archivo Excel; el sistema valida el formato antes de procesar.
- CA2: Si el archivo tiene errores de formato o datos faltantes en columnas obligatorias, el sistema los lista de forma clara antes de aplicar la importación.
- CA3: La importación actualiza: referencias, descripciones, precios P1 y P2, IVA, unidades de envase, códigos de barras EAN y categorías.
- CA4: Las referencias marcadas como "comodín" (ej. 9000000001) quedan excluidas automáticamente del catálogo público y de las estadísticas.
- CA5: El sistema registra en el log de auditoría quién realizó la importación, cuándo, cuántos registros se procesaron y cuántos errores hubo.

Prioridad: Alta
Estimación: XL
Dependencias: RF-040 (importador Excel), RF-041 (regla comodín)
Notas: —
```

---

### US-16: Enriquecer ficha de producto con datos SEO
**Épica:** ÉPICA-03

```
Como TRABAJADOR JEYJO (rol catálogo)
Quiero añadir metadescripción, palabras clave y descripción larga a los productos importados del ERP
Para mejorar el posicionamiento orgánico en buscadores sin modificar los datos del ERP

Criterios de aceptación:
- CA1: En el panel PIM, al editar un producto, existen campos diferenciados para: descripción corta (ERP), descripción larga (marketing), metadescripción (máx 160 caracteres), palabras clave (tags), URL amigable.
- CA2: Si el campo URL amigable está vacío, el sistema genera automáticamente una URL basada en el nombre del producto al guardar.
- CA3: El generador SEO automático permite aplicar plantillas masivas: "[Nombre del Producto] - Compra online al mejor precio en Jeyjo" para generar metadescripciones del catálogo completo en un clic.
- CA4: El auditor SEO indica con alertas los productos sin foto, sin metadescripción o con URL duplicada.

Prioridad: Alta
Estimación: L
Dependencias: RF-042 (enriquecedor PIM), RF-043 (auditor SEO)
Notas: —
```

---

### US-17: Gestionar pedidos web entrantes
**Épica:** ÉPICA-03

```
Como TRABAJADOR JEYJO (rol pedidos)
Quiero ver todos los pedidos recibidos por la web de forma ordenada y exportarlos en formato compatible con Avansuite
Para poder crear los albaranes en el ERP sin duplicar trabajo ni picar datos

Criterios de aceptación:
- CA1: La bandeja de pedidos web muestra: número de pedido, fecha, cliente, importe, estado y origen (web B2C, intranet B2B, EVA).
- CA2: Los pedidos generados autónomamente por EVA aparecen en una bandeja separada "Pedidos IA pendientes de validación" con botón "Revisar y Validar".
- CA3: Al validar un pedido de EVA, el trabajador confirma que el cliente ha pedido los artículos correctos antes de pasarlo a preparación.
- CA4: Los pedidos validados se pueden exportar en formato Excel compatible con las plantillas de importación de Avansuite.
- CA5: Si un pedido tiene una línea con producto sin stock y el flag de "pedido pendiente de validación de stock" activo, aparece destacado con un aviso visual.

Prioridad: Alta
Estimación: L
Dependencias: RF-050 (OMS), RF-051 (bandeja EVA)
Notas: —
```

---

### US-18: Crear cupón de descuento con reglas
**Épica:** ÉPICA-03

```
Como SUPERADMINISTRADOR JEYJO
Quiero crear cupones de descuento con condiciones específicas (mínimo de compra, fecha de validez, porcentaje de descuento)
Para ejecutar campañas promocionales de forma autónoma sin tocar el código

Criterios de aceptación:
- CA1: El módulo de marketing permite crear un cupón con: código, tipo de descuento (porcentaje o importe fijo), valor, importe mínimo de pedido, fecha de inicio y fin de validez, usos máximos.
- CA2: Al crear la regla "BLOG5" como descuento del 5% sin importe mínimo, esta se aplica automáticamente al introducir el código en el checkout.
- CA3: El sistema respeta la regla de no acumulación: si un artículo está en oferta, el cupón de descuento general no se aplica sobre ese artículo.
- CA4: Los cupones caducados se desactivan automáticamente en su fecha de fin sin intervención manual.

Prioridad: Media
Estimación: M
Dependencias: RF-007 (motor de precios), RF-052 (gestión cupones)
Notas: —
```

---

### US-19: Ver el dashboard de KPIs del negocio
**Épica:** ÉPICA-03

```
Como SUPERADMINISTRADOR JEYJO
Quiero ver en tiempo real los indicadores clave de mi negocio digital nada más entrar al backend
Para tomar decisiones rápidas basadas en datos sin necesidad de generar informes manuales

Criterios de aceptación:
- CA1: El dashboard muestra: ventas del día actual (importe y número de pedidos), ticket medio, tasa de conversión (visitas/pedidos), visitantes activos en este momento, últimos 5 pedidos recibidos y carritos activos.
- CA2: Un recuadro de "Monitorización EVA" muestra el número de conversaciones activas del asistente y las últimas consultas no resueltas que requieren atención humana.
- CA3: Una bandeja de alertas de sistema notifica: errores en la sincronización Excel con el ERP, productos Top Ventas con stock bajo y nuevos registros de cliente pendientes de validar.
- CA4: Los KPIs de ventas son filtrables por rango de fechas (hoy, ayer, esta semana, este mes, personalizado).

Prioridad: Alta
Estimación: L
Dependencias: RF-060 (dashboard KPIs), RF-061 (alertas sistema)
Notas: —
```

---

### US-20: Configurar el asistente virtual EVA
**Épica:** ÉPICA-05

```
Como SUPERADMINISTRADOR JEYJO
Quiero gestionar la configuración de EVA desde el backend (horarios, conexiones de datos, catálogos PDF inyectados)
Para que EVA tenga la información más completa posible sobre Jeyjo y sus productos

Criterios de aceptación:
- CA1: La sección "Configuración SKAI" permite: subir catálogos PDF y fichas de productos para que EVA los lea, configurar los horarios de atención de EVA y los mensajes de desvío fuera de horario, y gestionar la conexión con la base de datos de la plataforma.
- CA2: El administrador puede preguntar directamente a EVA desde el backend para verificar que tiene el conocimiento correcto.
- CA3: EVA nunca proporciona información de un cliente a otro bajo ninguna circunstancia; si está logueado, solo tiene acceso a los datos del cliente autenticado.
- CA4: La sección muestra el número de conversaciones del último mes y las preguntas más frecuentes no resueltas como insumo para mejorar la base de conocimiento.

Prioridad: Media
Estimación: M
Dependencias: RF-070 (integración SKAI API), RF-071 (configuración EVA)
Notas: Las capacidades de EVA están limitadas por lo que expone la API de SKAI.
```

---

### US-21: Recibir notificación de nueva factura disponible
**Épica:** ÉPICA-02

```
Como ADMINISTRADOR DE EMPRESA B2B
Quiero recibir una notificación cuando Jeyjo emite y sube una nueva factura en mi portal
Para no tener que entrar manualmente a comprobar si hay documentos nuevos

Criterios de aceptación:
- CA1: Cuando una nueva factura aparece en el portal (sincronización desde ERP), el sistema envía un email al administrador de la empresa con el asunto "Nueva factura disponible en tu portal Jeyjo" y el importe.
- CA2: El mismo evento genera una notificación en el centro de notificaciones del portal (campana en la cabecera) que persiste hasta que el usuario la marca como leída.
- CA3: El cliente puede configurar desde su perfil si desea recibir las notificaciones por email, solo en el portal o desactivarlas.

Prioridad: Media
Estimación: S
Dependencias: US-08, RF-037 (sistema de notificaciones)
Notas: —
```

---

### US-22: Asistente EVA responde consultas de producto en la tienda pública
**Épica:** ÉPICA-05

```
Como VISITANTE ANÓNIMO
Quiero poder preguntarle al asistente virtual sobre las características de un producto o su compatibilidad con otro
Para resolver mis dudas de compra sin tener que llamar a Jeyjo

Criterios de aceptación:
- CA1: El widget de EVA está visible como botón flotante en toda la tienda pública, en todas las páginas.
- CA2: Un usuario no identificado puede preguntar sobre características de producto, compatibilidades, disponibilidad general y condiciones de envío; EVA responde en menos de 3 segundos.
- CA3: Si EVA no puede resolver la consulta, ofrece opciones de contacto humano (WhatsApp, teléfono, email) con el horario de atención.
- CA4: EVA nunca proporciona datos de precios especiales ni información de cuentas de cliente a usuarios no autenticados.

Prioridad: Alta
Estimación: M
Dependencias: RF-070 (integración SKAI API)
Notas: —
```

---

### US-23: Recuperación de carrito abandonado
**Épica:** ÉPICA-03

```
Como SUPERADMINISTRADOR JEYJO
Quiero que el sistema envíe automáticamente recordatorios a los clientes B2C que abandonaron el carrito
Para recuperar ventas que de otro modo se pierden

Criterios de aceptación:
- CA1: Si un cliente B2C registrado abandona el carrito sin completar el pedido, el sistema envía un email a las 2 horas con el asunto "Tienes artículos esperándote en Jeyjo" y un enlace directo al carrito.
- CA2: Si a las 24 horas el carrito sigue abandonado, el sistema envía un segundo email con un código de descuento del X% (configurable desde el backend).
- CA3: Si el cliente completa el pedido antes de que se envíe el segundo email, el segundo email se cancela automáticamente.
- CA4: La funcionalidad de recuperación de carritos B2B es programable (puede activarse o desactivarse por grupo).

Prioridad: Media
Estimación: M
Dependencias: RF-052 (módulo marketing)
Notas: —
```

---

### US-24: Gestión de blog corporativo integrado
**Épica:** ÉPICA-03

```
Como TRABAJADOR JEYJO (rol CMS)
Quiero redactar y publicar artículos en el blog de jeyjo.es desde el mismo backend que uso para gestionar el catálogo
Para no tener que mantener dos sistemas (la web y WordPress) por separado

Criterios de aceptación:
- CA1: El backend (Payload CMS) dispone de un módulo "Blog" con editor de texto enriquecido (negrita, listas, imágenes, cabeceras H2/H3).
- CA2: Cada artículo tiene campos: título, slug/URL, categoría del blog, etiquetas, imagen destacada, metadescripción y fecha de publicación.
- CA3: Los artículos pueden programarse para publicarse en una fecha futura.
- CA4: El blog aparece integrado en el frontend de jeyjo.es con el mismo diseño que el resto de la web.

Prioridad: Media
Estimación: M
Dependencias: RF-080 (módulo blog)
Notas: Migración de artículos del WordPress actual: pendiente de valorar alcance.
```

---

## 4. Mapa de Historias

| Épica        | ID    | Título                                          | Rol principal              | Prioridad | Estimación |
|--------------|-------|-------------------------------------------------|----------------------------|-----------|------------|
| ÉPICA-01     | US-01 | Búsqueda predictiva de productos                | Visitante Anónimo          | Alta      | L          |
| ÉPICA-01     | US-02 | Visualización de precio dual (B2C)              | Visitante Anónimo          | Alta      | M          |
| ÉPICA-01     | US-03 | Añadir producto al carrito con envase cerrado   | Visitante Anónimo / B2C    | Alta      | M          |
| ÉPICA-01     | US-04 | Completar checkout B2C                          | Cliente B2C Registrado     | Alta      | XL         |
| ÉPICA-01     | US-05 | Solicitar presupuesto desde la tienda           | Visitante Anónimo / B2C    | Alta      | M          |
| ÉPICA-01     | US-06 | Comparar productos en el listado                | Visitante Anónimo          | Baja      | M          |
| ÉPICA-02     | US-07 | Acceder al Portal B2B (Intranet)                | Admin Empresa B2B          | Alta      | L          |
| ÉPICA-02     | US-08 | Descargar facturas del área financiera          | Admin Empresa B2B          | Alta      | L          |
| ÉPICA-02     | US-09 | Ver vencimientos pendientes de pago             | Admin Empresa B2B          | Alta      | M          |
| ÉPICA-02     | US-10 | Repetir un pedido anterior                      | Admin Empresa B2B          | Alta      | XL         |
| ÉPICA-02     | US-11 | Realizar un pedido rápido por referencia        | Subusuario B2B             | Alta      | M          |
| ÉPICA-02     | US-12 | Gestionar subusuarios de mi empresa             | Admin Empresa B2B          | Alta      | L          |
| ÉPICA-02     | US-13 | Solicitar RMA (devolución)                      | Admin Empresa B2B          | Alta      | M          |
| ÉPICA-02     | US-14 | Ver tarifas personalizadas pactadas             | Admin Empresa B2B          | Alta      | M          |
| ÉPICA-02     | US-21 | Recibir notificación de nueva factura           | Admin Empresa B2B          | Media     | S          |
| ÉPICA-03     | US-15 | Importar catálogo de productos desde Excel      | Superadmin Jeyjo           | Alta      | XL         |
| ÉPICA-03     | US-16 | Enriquecer ficha de producto con datos SEO      | Trabajador Jeyjo (catálogo)| Alta      | L          |
| ÉPICA-03     | US-17 | Gestionar pedidos web entrantes                 | Trabajador Jeyjo (pedidos) | Alta      | L          |
| ÉPICA-03     | US-18 | Crear cupón de descuento con reglas             | Superadmin Jeyjo           | Media     | M          |
| ÉPICA-03     | US-19 | Ver el dashboard de KPIs del negocio            | Superadmin Jeyjo           | Alta      | L          |
| ÉPICA-03     | US-23 | Recuperación de carrito abandonado              | Superadmin Jeyjo           | Media     | M          |
| ÉPICA-03     | US-24 | Gestión de blog corporativo integrado           | Trabajador Jeyjo (CMS)     | Media     | M          |
| ÉPICA-05     | US-20 | Configurar el asistente virtual EVA             | Superadmin Jeyjo           | Media     | M          |
| ÉPICA-05     | US-22 | EVA responde consultas de producto              | Visitante Anónimo          | Alta      | M          |

---

## Pendientes y Decisiones Abiertas

1. **Responsable: Equipo dev** — Definir si la búsqueda predictiva (US-01) se implementa con Supabase full-text search, Algolia u otra solución. Impacta en la estimación y en la latencia <150 ms exigida.
2. **Responsable: Dirección** — Confirmar el porcentaje de descuento del segundo email de recuperación de carrito (US-23). Actualmente sin definir.
3. **Responsable: Equipo dev + Dirección** — Definir el alcance de la migración de artículos del blog de WordPress a Payload CMS (US-24): ¿migración automática o solo artículos futuros?

---

## Historial de Cambios

| Versión | Fecha      | Autor                      | Descripción del cambio       |
|---------|------------|----------------------------|------------------------------|
| 1.0     | 2026-05-27 | Equipo de desarrollo Jeyjo | Creación inicial del documento |
