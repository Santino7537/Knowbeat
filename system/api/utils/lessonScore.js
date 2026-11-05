const fs = require('node:fs/promises');
const path = require('node:path');

const exercisesContentPath = path.resolve(__dirname, '../../client/exercises_content');
const courseAliases = {
  guitar: ['guitar', 'guitarra'],
  piano: ['piano']
};

const normalize = (value) => String(value)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const getCourseAliases = (value) => {
  const normalized = normalize(value);
  return Object.values(courseAliases).find((aliases) => aliases.includes(normalized)) ?? [normalized];
};

const matchesCourse = (courseName, ...identifiers) => {
  const aliases = new Set(getCourseAliases(courseName));
  return identifiers.some((identifier) =>
    getCourseAliases(identifier).some((alias) => aliases.has(alias))
  );
};

const getLessonReward = (lesson) => {
  const declaredReward = lesson.completion?.score;
  const slideRewards = (lesson.slides ?? [])
    .map((slide) => slide.completion?.score)
    .filter((score) => score !== undefined);
  const reward = declaredReward !== undefined
    ? declaredReward
    : slideRewards.reduce((total, score) => total + score, 0);

  if ((!slideRewards.length && declaredReward === undefined)
    || !Number.isSafeInteger(reward)
    || reward < 0) {
    throw new Error(`El JSON de la lección "${lesson.id}" no tiene un score válido.`);
  }

  return reward;
};

const getLessonScore = async (courseName, lessonNumber) => {
  const courseDirectories = await fs.readdir(exercisesContentPath, { withFileTypes: true });
  const matches = [];

  for (const directory of courseDirectories) {
    if (!directory.isDirectory() || !matchesCourse(courseName, directory.name)) continue;

    const folderPath = path.join(exercisesContentPath, directory.name);
    const files = await fs.readdir(folderPath, { withFileTypes: true });
    const lessonFiles = files.filter((file) => {
      if (!file.isFile()) return false;
      const match = file.name.match(/^(\d+)_.*\.json$/i);
      return match && Number(match[1]) === lessonNumber;
    });

    for (const file of lessonFiles) {
      const filePath = path.join(folderPath, file.name);
      const lesson = JSON.parse(await fs.readFile(filePath, 'utf8'));
      if (!lesson || !matchesCourse(courseName, lesson.courseId)) continue;
      matches.push({ lesson, filePath });
    }
  }

  if (matches.length !== 1) {
    throw new Error(
      matches.length === 0
        ? `No se encontró el JSON de la lección ${lessonNumber} del curso "${courseName}".`
        : `Hay más de un JSON para la lección ${lessonNumber} del curso "${courseName}".`
    );
  }

  return getLessonReward(matches[0].lesson);
};

module.exports = getLessonScore;
