import { useState } from "react";
import styles from "./Avatar.module.css";

// Avatar con foto o, si no hay (o falla), iniciales sobre un color propio de
// cada usuario. Reemplaza los círculos grises vacíos que había en la app.
const HUES = [212, 228, 196, 262, 172, 240, 190, 280];

function hueFor(name = "") {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return HUES[hash % HUES.length];
}

function initials(name = "") {
  const clean = name.replace(/[_.-]+/g, " ").trim();
  if (!clean) return "?";
  const parts = clean.split(/\s+/);
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : clean.slice(0, 2)).toUpperCase();
}

const isRealPicture = (src) => src && !/default_profile/i.test(String(src));

const Avatar = ({ name = "", src, size = 40, ring = false, className = "" }) => {
  const [failed, setFailed] = useState(false);
  const showImage = isRealPicture(src) && !failed;

  return (
    <span
      className={`${styles.avatar} ${ring ? styles.ring : ""} ${className}`}
      style={{ "--size": `${size}px`, "--hue": hueFor(name) }}
      title={name || undefined}
    >
      {showImage ? (
        <img src={src} alt="" onError={() => setFailed(true)} />
      ) : (
        <span className={styles.initials} aria-hidden="true">{initials(name)}</span>
      )}
    </span>
  );
};

export default Avatar;
