import { useState } from "react";
import styles from "./LessonPlayer.module.css";

const InfoSlide = ({ slide }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const hasImage = slide.image && !imageFailed;

  return (
    <article className={`${styles.infoSlide} ${hasImage ? styles.withImage : styles.textOnly}`}>
      <div className={styles.infoCopy}>
        {slide.title && <h1 className={styles.slideTitle}>{slide.title}</h1>}
        <div className={styles.blocks}>
          {(slide.blocks ?? []).map((block, index) => (
            <div className={styles.textBlock} key={`${block.type}-${index}`}>
              {(block.heading || block.type === "subtitle") && (
                <h2 className={styles.blockHeading}>{block.heading || block.text}</h2>
              )}
              {block.type !== "subtitle" && <p>{block.text}</p>}
            </div>
          ))}
          {imageFailed && (
            <p className={styles.imageFallback} role="status">
              No se pudo cargar la imagen de esta diapositiva.
            </p>
          )}
        </div>
      </div>
      {hasImage && (
        <figure className={`${styles.imageFrame} ${styles[slide.image.orientation || "vertical"]}`}>
          <img
            src={slide.image.src}
            alt={slide.image.alt}
            onError={() => setImageFailed(true)}
          />
        </figure>
      )}
    </article>
  );
};

export default InfoSlide;
