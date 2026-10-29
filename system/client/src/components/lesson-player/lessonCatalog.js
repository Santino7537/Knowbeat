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

export function getLessonForCourse(courseName, lessonNumber) {
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
    return { lesson };
  }

  return null;
}
