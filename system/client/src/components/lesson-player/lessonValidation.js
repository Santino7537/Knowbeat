const isRecord = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;

export function validateLesson(lesson) {
  if (!isRecord(lesson)) return "El archivo de la lección debe contener un objeto JSON.";
  if (!isNonEmptyString(lesson.id)) return "Falta el identificador de la lección.";
  if (!isNonEmptyString(lesson.courseId)) return "Falta el identificador del curso.";
  if (!isNonEmptyString(lesson.sectionId)) return "Falta el identificador de la sección.";
  if (!isNonEmptyString(lesson.title)) return "Falta el título de la lección.";
  if (!isNonEmptyString(lesson.description)) return "Falta la descripción de la lección.";
  if (!isNonEmptyString(lesson.level)) return "Falta el nivel de la lección.";
  if (!Number.isSafeInteger(lesson.estimatedMinutes) || lesson.estimatedMinutes <= 0) {
    return "La duración estimada debe ser un número entero mayor que cero.";
  }
  if (lesson.completion !== undefined && !isRecord(lesson.completion)) {
    return "La configuración de finalización de la lección no es válida.";
  }
  if (!Array.isArray(lesson.slides) || lesson.slides.length === 0) {
    return "La lección debe contener al menos una diapositiva.";
  }

  const slideIds = new Set();
  const questionIds = new Set();
  let questionCount = 0;

  for (const slide of lesson.slides) {
    if (!isRecord(slide) || !isNonEmptyString(slide.id)) {
      return "Cada diapositiva debe tener un identificador.";
    }
    if (slideIds.has(slide.id)) return `El identificador de diapositiva "${slide.id}" está repetido.`;
    slideIds.add(slide.id);

    if (slide.type === "info") {
      if (slide.title !== undefined && !isNonEmptyString(slide.title)) {
        return `El título de la diapositiva "${slide.id}" no es válido.`;
      }
      if (slide.blocks !== undefined && !Array.isArray(slide.blocks)) {
        return `Los bloques de la diapositiva "${slide.id}" deben ser una lista.`;
      }
      const blocks = slide.blocks ?? [];
      for (const block of blocks) {
        if (!isRecord(block)
          || !["text", "paragraph", "subtitle"].includes(block.type)
          || !isNonEmptyString(block.text)) {
          return `La diapositiva "${slide.id}" contiene un bloque de texto no válido.`;
        }
        if (block.heading !== undefined && !isNonEmptyString(block.heading)) {
          return `Un encabezado de la diapositiva "${slide.id}" no es válido.`;
        }
      }
      if (slide.image !== undefined) {
        if (!isRecord(slide.image) || !isNonEmptyString(slide.image.src)
          || !slide.image.src.startsWith("/") || slide.image.src.startsWith("//")
          || !isNonEmptyString(slide.image.alt)) {
          return `La imagen de la diapositiva "${slide.id}" necesita una ruta pública y texto alternativo.`;
        }
        if (slide.image.orientation !== undefined
          && !["horizontal", "vertical"].includes(slide.image.orientation)) {
          return `La orientación de la imagen en "${slide.id}" debe ser horizontal o vertical.`;
        }
      }
      if (blocks.length === 0 && !slide.image) {
        return `La diapositiva informativa "${slide.id}" no tiene contenido.`;
      }
      continue;
    }

    if (slide.type === "exercise") {
      if (!Array.isArray(slide.questions) || slide.questions.length === 0) {
        return `El ejercicio "${slide.id}" debe contener preguntas.`;
      }
      if (slide.completion !== undefined && !isRecord(slide.completion)) {
        return `La configuración de finalización del ejercicio "${slide.id}" no es válida.`;
      }
      for (const question of slide.questions) {
        if (!isRecord(question) || !isNonEmptyString(question.id)
          || questionIds.has(question.id)) {
          return `El ejercicio "${slide.id}" contiene una pregunta sin identificador o repetida.`;
        }
        questionIds.add(question.id);
        questionCount += 1;
        if (question.type !== "multiple-choice"
          || !isNonEmptyString(question.prompt)
          || !Array.isArray(question.options) || question.options.length < 2) {
          return `La pregunta "${question.id}" no tiene un formato de opción múltiple válido.`;
        }
        const optionIds = new Set();
        for (const option of question.options) {
          if (!isRecord(option) || !isNonEmptyString(option.id)
            || !isNonEmptyString(option.text) || optionIds.has(option.id)) {
            return `La pregunta "${question.id}" contiene opciones no válidas o repetidas.`;
          }
          optionIds.add(option.id);
        }
        if (!optionIds.has(question.correctOptionId)
          || !isNonEmptyString(question.feedbackCorrect)
          || !isNonEmptyString(question.feedbackIncorrect)) {
          return `La respuesta correcta o la retroalimentación de "${question.id}" no son válidas.`;
        }
      }
      const passingScore = slide.completion?.passingScore;
      if (passingScore !== undefined
        && (!Number.isInteger(passingScore) || passingScore < 0 || passingScore > slide.questions.length)) {
        return `El puntaje de aprobación del ejercicio "${slide.id}" debe ser un número entero entre 0 y ${slide.questions.length}.`;
      }
      continue;
    }

    return `El tipo de diapositiva "${slide.type}" no está soportado.`;
  }

  const passingScore = lesson.completion?.passingScore;
  if (passingScore !== undefined
    && (!Number.isInteger(passingScore) || passingScore < 0 || passingScore > questionCount)) {
    return `El puntaje de aprobación debe ser un número entero entre 0 y ${questionCount}.`;
  }

  return null;
}
