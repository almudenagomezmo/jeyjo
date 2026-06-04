# Guía OpenSpec para Jeyjo

> Cómo usar los comandos de OpenSpec partiendo de los 6 documentos de especificación que ya tienes, para construir el proyecto **paso a paso, poco a poco**.

---

## 1. Qué hace cada comando

OpenSpec organiza el trabajo en **cambios** (changes). Cada feature o trozo de proyecto es un cambio con su propia carpeta de artefactos. El ciclo de vida de un cambio es: explorar → proponer → implementar → sincronizar → archivar.

| Comando | Cuándo se usa | Qué hace |
|---|---|---|
| `/openspec-explore` | Antes de comprometerte a nada, cuando la idea aún no está clara | Modo "compañero de pensamiento". Te ayuda a razonar la idea, hacer preguntas e inspeccionar el código. **No genera artefactos**, solo clarifica. Opcional pero recomendable. |
| `/openspec-propose` | Para arrancar un cambio concreto | Crea la carpeta del cambio y genera los artefactos de planificación: `proposal.md` (por qué y qué cambia), `specs/` (requisitos y escenarios), `design.md` (enfoque técnico) y `tasks.md` (checklist de implementación). |
| `/openspec-apply-change` | Cuando el plan está aprobado | Implementa las tareas de `tasks.md` una a una (escribe el código) hasta completarlas todas. |
| `/openspec-sync-specs` | Cuando el cambio está implementado | Fusiona las *delta specs* del cambio en las specs principales del proyecto (`openspec/specs/`). Convierte lo definido en este cambio en la fuente de verdad permanente. El cambio sigue activo. |
| `/openspec-archive-change` | Para cerrar un cambio terminado | Verifica que los artefactos existan y las tareas estén completas, sincroniza si falta, y mueve la carpeta a `openspec/changes/archive/` con fecha. Mantiene la traza de auditoría. |

**Flujo completo:** `explore` (opcional) → `propose` → `apply-change` → `sync-specs` → `archive-change`.

---

## 2. El punto clave de tu situación

Tus 6 documentos describen **el proyecto completo**:

```
01-especificaciones-jeyjo.md
02-alcance-jeyjo.md
03-user-stories-jeyjo.md
04-arquitectura-jeyjo.md
05-requisitos-jeyjo.md
06-criterios-aceptacion-jeyjo.md
```

Pero OpenSpec **no** construye proyectos enteros de una vez: trabaja por **cambios pequeños e incrementales**. Por eso, para hacerlo "poco a poco", la estrategia es:

1. Usar tus 6 documentos como **fuente de verdad y contexto** del proyecto.
2. **Trocear** el proyecto en cambios pequeños (normalmente, una user story o un grupo de requisitos por cambio).
3. Llevar **cada trozo** por el ciclo `propose → apply → sync → archive`.
4. Repetir hasta cubrir todo el alcance.

Así avanzas feature a feature sin perder la visión global, y las specs del proyecto van creciendo de forma trazable.

---

## 3. Plan paso a paso

### Paso 0 — Inicializar OpenSpec (una sola vez)

```bash
openspec init
```

Esto crea la estructura `openspec/` y configura tu asistente de IA. Cuando te pregunte, **crea el `openspec/config.yaml`**: ahí puedes inyectar contexto del proyecto (arquitectura, convenciones, alcance) para que todos los artefactos lo respeten.

> Consejo: copia lo esencial de `02-alcance`, `04-arquitectura` y `05-requisitos` al config (o referéncialos), para que cada `propose` nazca alineado con tus decisiones.

### Paso 1 — Sembrar las specs base del proyecto

Lleva el contenido estable de tus documentos a `openspec/specs/` (la fuente de verdad). Por ejemplo, organiza las capacidades por dominio según tu arquitectura. Esto da a OpenSpec el "estado actual" del proyecto contra el que comparar cada cambio.

### Paso 2 — Trocear el proyecto en cambios

A partir de `03-user-stories` y `05-requisitos`, haz una lista ordenada de cambios pequeños. Ordénalos por dependencias (lo que es base primero) y por valor. Ejemplo de lista de trabajo:

```
[ ] cambio-1: autenticación de usuarios
[ ] cambio-2: gestión de perfil
[ ] cambio-3: ...
```

Si dudas sobre cómo trocear o por dónde empezar, usa primero:

```
/openspec-explore
```

para razonarlo apoyándote en tus user stories y criterios de aceptación.

### Paso 3 — Construir CADA cambio (este es el bucle que repites)

Para cada elemento de tu lista, repite estos cuatro pasos:

**3.1 Proponer**
```
/openspec-propose <nombre-del-cambio>
```
Genera `proposal.md`, `specs/`, `design.md` y `tasks.md`. **Revísalos y edítalos** apoyándote en `06-criterios-aceptacion` para que los escenarios reflejen tus criterios reales. No pases al siguiente paso hasta estar conforme.

**3.2 Implementar**
```
/openspec-apply-change
```
La IA ejecuta las tareas de `tasks.md` una a una. Revisa el código a medida que avanza.

**3.3 Sincronizar specs**
```
/openspec-sync-specs
```
Fusiona las specs del cambio en las specs principales del proyecto. Ahora la fuente de verdad refleja lo recién construido.

**3.4 Archivar**
```
/openspec-archive-change
```
Cierra el cambio (verifica artefactos y tareas completas) y lo mueve al archivo con fecha. Listo para el siguiente.

### Paso 4 — Repetir

Vuelve al Paso 3 con el siguiente cambio de la lista. Cada vuelta del bucle añade una pieza funcional al proyecto, ya documentada y trazable, hasta cubrir todo el alcance de Jeyjo.

---

## 4. Resumen visual del flujo

```
                  ┌─────────────────────────────────────────────┐
   (una vez)      │  init  →  sembrar specs  →  trocear cambios  │
                  └─────────────────────────────────────────────┘
                                        │
                                        ▼
              ┌──────────  POR CADA CAMBIO (bucle)  ──────────┐
              │                                               │
   explore ──►│  propose ──► apply-change ──► sync-specs ──► archive-change
   (opcional) │                                               │
              └───────────────────►  siguiente cambio  ───────┘
```

---

## 5. Buenas prácticas

- **Cambios pequeños.** Un cambio que se pueda implementar y revisar en una sesión. Si es muy grande, divídelo.
- **Revisa antes de implementar.** El valor de OpenSpec está en acordar el *qué* antes del *cómo*; no dejes pasar un `propose` sin revisar.
- **Tus 6 docs son el "norte".** Cuando un `propose` se desvíe de tu alcance o arquitectura, corrige el artefacto, no el documento maestro.
- **Criterios de aceptación = escenarios.** Usa `06-criterios-aceptacion` para validar que las specs de cada cambio son testeables.
- **Sincroniza siempre antes de archivar** para no perder las delta specs.



npx supabase link --project-ref <ref>
npx supabase db push