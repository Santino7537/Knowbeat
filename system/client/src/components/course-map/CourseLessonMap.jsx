import { useLayoutEffect, useRef, useState } from "react";

import LessonDetailsSidebar from "./LessonDetailsSidebar";
import LessonNote from "./LessonNote";
import styles from "./CourseLessonMap.module.css";

const noteSpacing = 220;

const getPositions = (lessons, lineYPositions) => {
  return lessons.map((lesson, index) => {
    return {
      lesson,
      x: 120 + index * noteSpacing,
      y: lineYPositions[(index % 3) + 1]
    };
  });
};

const CourseLessonMap = ({ lessons, onStartLesson, startingLesson }) => {
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const viewportRef = useRef(null);
  const svgHeight = Math.max(viewportSize.height, 1);
  const lineYPositions = [0.12, 0.31, 0.5, 0.69, 0.88].map((ratio) => svgHeight * ratio);
  const positions = getPositions(lessons, lineYPositions);
  const finalNoteX = positions.at(-1)?.x ?? 120;
  const svgWidth = Math.max(viewportSize.width || 1080, finalNoteX + 120);
  const selectedLesson = lessons.find((lesson) => lesson.id === selectedLessonId) ?? null;
  const selectedIndex = positions.findIndex(({ lesson }) => lesson.id === selectedLesson?.id);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return undefined;

    const measureViewport = () => {
      const nextSize = { width: viewport.clientWidth, height: viewport.clientHeight };
      setViewportSize((currentSize) => (
        currentSize.width === nextSize.width && currentSize.height === nextSize.height
          ? currentSize
          : nextSize
      ));
    };
    const observer = new ResizeObserver(measureViewport);
    observer.observe(viewport);
    measureViewport();

    return () => observer.disconnect();
  }, []);

  return (
    <section className={styles.mapShell} aria-label="Recorrido de lecciones">
      <div
        ref={viewportRef}
        className={styles.mapViewport}
        tabIndex="0"
        aria-label="Mapa horizontal. Desplazate para ver más lecciones."
      >
        <svg
          className={styles.lessonSvg}
          width={svgWidth}
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          role="group"
          aria-label="Pentagrama con las lecciones del curso"
        >
          <g className={styles.staffLines} aria-hidden="true">
            {lineYPositions.map((y) => (
              <line key={y} x1="12" y1={y} x2={svgWidth - 12} y2={y} />
            ))}
          </g>
          {positions.map(({ lesson, x, y }, index) => (
            <LessonNote
              key={lesson.id}
              lesson={lesson}
              x={x}
              y={y}
              index={index}
              selected={selectedLesson?.id === lesson.id}
              onSelect={(lesson) => setSelectedLessonId(lesson.id)}
            />
          ))}
        </svg>
      </div>
      <LessonDetailsSidebar
        lesson={selectedLesson}
        lessonNumber={selectedIndex + 1}
        onClose={() => setSelectedLessonId(null)}
        onStartLesson={onStartLesson}
        startingLesson={startingLesson}
      />
    </section>
  );
};

export default CourseLessonMap;