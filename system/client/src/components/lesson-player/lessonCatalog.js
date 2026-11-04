import { validateLesson } from "./lessonValidation.js";

const lessonFiles = import.meta.glob("../../../exercises_content/**/*.json", {
  eager: true,
  import: "default",
  query: "?raw"
});

const courseAliases = {
  guitar: ["guitar", "guitarra"]
};

const normalize = (value) => String(value)
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "");

const getLessonOrder = (path) => {
  const filename = path.split("/").pop() ?? "";
  const match = filename.match(/^(\d+)_/);
  return match ? Number(match[1]) : null;
};

const getCourseFolder = (path) => path.split("/").at(-2) ?? "";

const matchesCourseFolder = (courseName, folder) => {
  const aliases = courseAliases[normalize(folder)] ?? [folder];
  const normalizedName = normalize(courseName);
  return aliases.some((alias) => normalizedName.includes(normalize(alias)));
};

const matchesCourse = (courseName, courseId) => {
  const aliases = courseAliases[normalize(courseId)] ?? [courseId];
  const normalizedName = normalize(courseName);
  return aliases.some((alias) => {
    const normalizedAlias = normalize(alias);
    return normalizedName === normalizedAlias || normalizedName.includes(normalizedAlias);
  });
};

// Función para traducir dinámicamente la lección usando el diccionario actual
export function getTranslatedLesson(lesson, t) {
  if (!lesson || !lesson.id || typeof t !== "function") return lesson;
  const translationKey = `lessons.${lesson.id}`;
  
  const translatedTitle = t(`${translationKey}.title`);
  if (!translatedTitle || translatedTitle === `${translationKey}.title`) return lesson;

  return {
    ...lesson,
    title: translatedTitle,
    description: t(`${translationKey}.description`),
    slides: lesson.slides.map((slide) => {
      const slideKey = `${translationKey}.slides.${slide.id}`;
      const translatedSlideTitle = t(`${slideKey}.title`);
      
      return {
        ...slide,
        title: translatedSlideTitle !== `${slideKey}.title` ? translatedSlideTitle : slide.title,
        description: t(`${slideKey}.description`) !== `${slideKey}.description` ? t(`${slideKey}.description`) : slide.description,
        image: slide.image ? {
          ...slide.image,
          alt: t(`${slideKey}.imageAlt`) !== `${slideKey}.imageAlt` ? t(`${slideKey}.imageAlt`) : slide.image.alt
        } : undefined,
        blocks: slide.blocks ? slide.blocks.map((block, bIdx) => {
          if (typeof block === 'string') {
            const blockText = t(`${slideKey}.blocks.${bIdx}`);
            return blockText !== `${slideKey}.blocks.${bIdx}` ? blockText : block;
          }
          const blockHeading = t(`${slideKey}.blocks.${bIdx}.heading`);
          const blockText = t(`${slideKey}.blocks.${bIdx}.text`);
          return {
            ...block,
            heading: blockHeading !== `${slideKey}.blocks.${bIdx}.heading` ? blockHeading : block.heading,
            text: blockText !== `${slideKey}.blocks.${bIdx}.text` ? blockText : block.text
          };
        }) : slide.blocks,
        questions: slide.questions ? slide.questions.map((q) => {
          const qKey = `${slideKey}.questions.${q.id}`;
          return {
            ...q,
            prompt: t(`${qKey}.prompt`) !== `${qKey}.prompt` ? t(`${qKey}.prompt`) : q.prompt,
            options: q.options.map(opt => ({
              ...opt,
              text: t(`${qKey}.options.${opt.id}`) !== `${qKey}.options.${opt.id}` ? t(`${qKey}.options.${opt.id}`) : opt.text
            })),
            feedbackCorrect: t(`${qKey}.feedbackCorrect`) !== `${qKey}.feedbackCorrect` ? t(`${qKey}.feedbackCorrect`) : q.feedbackCorrect,
            feedbackIncorrect: t(`${qKey}.feedbackIncorrect`) !== `${qKey}.feedbackIncorrect` ? t(`${qKey}.feedbackIncorrect`) : q.feedbackIncorrect
          };
        }) : slide.questions
      };
    })
  };
}

export function getLessonForCourse(courseName, lessonNumber, t) {
  const candidates = Object.entries(lessonFiles)
    .filter(([path]) => getLessonOrder(path) === lessonNumber);

  for (const [path, rawContent] of candidates) {
    const folderMatches = matchesCourseFolder(courseName, getCourseFolder(path));
    let lesson;
    try {
      lesson = JSON.parse(rawContent);
    } catch {
      if (folderMatches) return { error: "El archivo JSON de esta lección no se puede leer." };
      continue;
    }

    if (!folderMatches && (!lesson || !matchesCourse(courseName, lesson.courseId))) continue;

    const validationError = validateLesson(lesson);
    if (validationError) return { error: validationError };
    if (!matchesCourse(courseName, lesson.courseId)) {
      return { error: "El curso indicado en el JSON no coincide con su contenido." };
    }

    // Traducir la lección antes de retornarla
    const translatedLesson = getTranslatedLesson(lesson, t);
    return { lesson: translatedLesson };
  }

  return null;
}