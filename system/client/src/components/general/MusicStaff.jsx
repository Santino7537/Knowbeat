import { useMemo } from "react";
import styles from "./MusicStaff.module.css";

// ── Pentagrama animado ──────────────────────────────────────────────────────
// Cinco líneas que ondulan y notas que viajan por ellas de izquierda a derecha.
// Se usa como fondo (login, landing). Respeta "reducir movimiento".
//
// Props:
//   staves:  cuántos pentagramas apilar (1–3)
//   notes:   cantidad de notas viajando
//   className
const GLYPHS = ["♪", "♫", "♩", "♬", "𝅘𝅥𝅮", "♪"];

function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// Tres formas de onda por línea; SMIL interpola entre ellas (movimiento fluido)
function wavePath(y, amp, phase) {
  const a = amp * Math.sin(phase);
  const b = amp * Math.cos(phase * 1.3);
  return `M-100 ${y} C 300 ${y - a}, 600 ${y + b}, 900 ${y + a * 0.6} S 1500 ${y - b}, 1800 ${y + a * 0.4}`;
}

export default function MusicStaff({ staves = 1, notes = 14, className = "", lineGap = 26 }) {
  const staffList = useMemo(() => {
    return Array.from({ length: staves }, (_, s) => {
      const top = staves === 1 ? 300 - lineGap * 2 : 140 + s * (420 / Math.max(1, staves - 1)) - lineGap * 2;
      return { id: s, top };
    });
  }, [staves, lineGap]);

  const noteList = useMemo(() => {
    const rand = seeded(11 + staves * 7 + notes);
    return Array.from({ length: notes }, (_, i) => {
      const staff = staffList[i % staffList.length];
      // posición en líneas y espacios (9 alturas posibles dentro del pentagrama)
      const step = Math.floor(rand() * 9);
      const y = staff.top + (step * lineGap) / 2;
      return {
        id: i,
        glyph: GLYPHS[i % GLYPHS.length],
        top: `${(y / 600) * 100}%`,
        size: 1.6 + rand() * 1.4,
        duration: 16 + rand() * 14,
        delay: -rand() * 30,
        bob: 3 + rand() * 3,
        hue: rand() > 0.6 ? "alt" : "main",
      };
    });
  }, [notes, staffList, lineGap, staves]);

  return (
    <div className={`${styles.staffWrap} ${className}`} aria-hidden="true">
      <svg className={styles.svg} viewBox="0 0 1600 600" preserveAspectRatio="none">
        {staffList.map((staff) => (
          <g key={staff.id} className={styles.staff}>
            {[0, 1, 2, 3, 4].map((i) => {
              const y = staff.top + i * lineGap;
              const p1 = wavePath(y, 60, 0.6 + staff.id);
              const p2 = wavePath(y, 90, 2.1 + staff.id);
              const p3 = wavePath(y, 50, 3.9 + staff.id);
              return (
                <path key={i} d={p1} style={{ animationDelay: `${i * 0.08 + staff.id * 0.3}s` }}>
                  <animate
                    attributeName="d"
                    dur={`${11 + staff.id * 3}s`}
                    repeatCount="indefinite"
                    values={`${p1};${p2};${p3};${p1}`}
                    calcMode="spline"
                    keySplines="0.45 0 0.55 1; 0.45 0 0.55 1; 0.45 0 0.55 1"
                  />
                </path>
              );
            })}
          </g>
        ))}
      </svg>

      {noteList.map((n) => (
        <span
          key={n.id}
          className={`${styles.note} ${n.hue === "alt" ? styles.noteAlt : ""}`}
          style={{
            top: n.top,
            fontSize: `${n.size}rem`,
            animationDuration: `${n.duration}s`,
            animationDelay: `${n.delay}s`,
          }}
        >
          <span className={styles.noteInner} style={{ animationDuration: `${n.bob}s` }}>{n.glyph}</span>
        </span>
      ))}
    </div>
  );
}
