# Lecciones interactivas

Cada archivo JSON describe una lección. Guardalo en una carpeta cuyo nombre sea el `courseId` del contenido y usa un prefijo numérico para indicar el número de lección, por ejemplo `guitar/1_Guitar_parts.json`.

El reproductor valida los JSON al abrir la lección. Cada lección debe incluir `id`, `courseId`, `sectionId`, `title`, `description`, `level`, `estimatedMinutes` (entero mayor que cero) y al menos una diapositiva. Estos metadatos se muestran en la vista previa de la lección. Los identificadores de diapositivas, preguntas y opciones deben ser únicos en sus respectivos ámbitos.

## Diapositivas admitidas

- `info`: bloques `{ "type": "text", "text": "..." }`, con `heading` opcional; también admite bloques `paragraph` y `subtitle`. Puede incluir `image` con `src` pública absoluta desde `public/`, `alt` y `orientation` (`horizontal` o `vertical`).
- `exercise`: preguntas `multiple-choice`, opciones con identificadores estables y textos de retroalimentación para respuestas correctas e incorrectas.

El orden del arreglo `slides` determina la presentación. Para conservar el orden de las lecciones, el nombre del archivo empieza con su número y un guion bajo.

`completion.passingScore` dentro de una diapositiva `exercise` es la cantidad mínima de respuestas correctas de ese ejercicio para aprobar. También puede definirse en la raíz de la lección para exigir una cantidad mínima global. Si se omite en ambos niveles, no se exige un puntaje mínimo. Las lecciones que deban asociarse con nombres de curso distintos a su `courseId` requieren agregar esos nombres como alias en `src/components/lesson-player/lessonCatalog.js`.

Las imágenes se guardan bajo `public/` y se referencian desde la raíz, por ejemplo `/exercises/guitar/guitar-parts/guitarra.png`. El campo `xp` no forma parte del cálculo ni de la persistencia del progreso.
