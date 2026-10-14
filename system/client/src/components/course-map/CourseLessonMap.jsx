import { useLayoutEffect, useRef, useState } from "react";

import LessonDetailsSidebar from "./LessonDetailsSidebar";
import LessonNote from "./LessonNote";
import styles from "./CourseLessonMap.module.css";

const noteSpacing = 220;

const getPositions = (lessons, lineYPositions) => {
  let seed = (lessons.length * 7919 + 37) >>> 0;
  let previousLine = -1;
  let previousX = 120;

  return lessons.map((lesson, index) => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    let lineIndex = seed % 3;
    if (lineIndex === previousLine) lineIndex = (lineIndex + 1 + (seed % 2)) % 3;
    previousLine = lineIndex;
    if (index > 0) previousX += noteSpacing + (seed % 49) - 24;

    return {
      lesson,
      x: previousX,
      y: lineYPositions[lineIndex + 1]
    };
  });
};

const CourseLessonMap = ({ lessons }) => {
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const viewportRef = useRef(null);
  const svgHeight = Math.max(viewportSize.height, 1);
  const lineYPositions = [0.12, 0.31, 0.5, 0.69, 0.88].map((ratio) => svgHeight * ratio);
  const positions = getPositions(lessons, lineYPositions);
  const finalNoteX = positions.at(-1)?.x ?? 120;
  const svgWidth = Math.max(viewportSize.width || 1080, finalNoteX + 120);
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
              onSelect={setSelectedLesson}
            />
          ))}
        </svg>
      </div>
      <LessonDetailsSidebar
        lesson={selectedLesson}
        lessonNumber={selectedIndex + 1}
        onClose={() => setSelectedLesson(null)}
      />
    </section>
  );
};

export default CourseLessonMap;