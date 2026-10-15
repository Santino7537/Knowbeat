import { useLayoutEffect, useRef, useState } from 'react';
import styles from './PostCard.module.css';

// Formatea la fecha que viene del backend (created_at llega como string ISO)
// a algo legible en español, ej: "8 de octubre de 2026".
const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
};

/*
  Props:
  - post: { id, title, text, likes_count, created_at, author: { username, picture } }
  - onLike(postId, isLiked): opcional, para cuando conectemos el endpoint
  - onOpenComments(postId): opcional, para cuando hagamos la vista de comentarios
*/
export default function PostCard({ post, onLike, onOpenComments }) {
  const { id, title, text, likes_count = 0, created_at, author = {} } = post;

  // Por ahora el like es solo visual/local: no hay endpoint todavía.
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(likes_count);

  // expanded: el usuario pidió ver todo el contenido.
  // hasHiddenContent: estando colapsada, la card está ocultando algo
  // (texto o título cortado) y por eso corresponde ofrecer "Ver todo".
  const [expanded, setExpanded] = useState(false);
  const [hasHiddenContent, setHasHiddenContent] = useState(false);

  const titleRef = useRef(null);
  const textRef = useRef(null);

  /*
    Detectamos si hay contenido oculto midiendo el DOM real:
    - Texto: el CSS lo recorta a 6 líneas (-webkit-line-clamp). Si su alto
      total (scrollHeight) supera el alto visible (clientHeight), hay excedente.
    - Título: se corta con "..." en una línea; si su ancho total supera el
      visible, también hay algo oculto (si no, quedaría ilegible para siempre).

    useLayoutEffect (y no useEffect) mide antes de que el navegador pinte,
    así el botón nunca "parpadea" al aparecer.
    ResizeObserver vuelve a medir cuando la card cambia de tamaño (ventana
    redimensionada), porque al cambiar el ancho cambia cuántas líneas ocupa el texto.
  */
  useLayoutEffect(() => {
    const titleEl = titleRef.current;
    const textEl = textRef.current;
    if (!titleEl || !textEl) return undefined;

    const measure = () => {
      // Expandida no hay recorte, así que no hay nada que medir:
      // se conserva el último valor y se vuelve a medir al colapsar.
      if (expanded) return;

      const titleCut = titleEl.scrollWidth > titleEl.clientWidth + 1;
      const textCut = textEl.scrollHeight > textEl.clientHeight + 1;
      setHasHiddenContent(titleCut || textCut);
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(titleEl);
    observer.observe(textEl);

    return () => observer.disconnect();
  }, [title, text, expanded]);

  const handleLike = () => {
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    // Actualizamos el contador de inmediato (+1 / -1) para que se sienta
    // instantáneo; cuando exista el endpoint, esto pasa a ser "optimista".
    setLikes((prev) => prev + (nextLiked ? 1 : -1));
    onLike?.(id, nextLiked);
  };

  return (
    <article className={styles.card}>
      <div className={styles.inner}>
        {/* Parte superior: avatar + usuario + fecha */}
        <header className={styles.header}>
          {author.picture ? (
            <img
              className={styles.avatar}
              src={author.picture}
              alt={`Foto de ${author.username ?? 'usuario'}`}
            />
          ) : (
            // Círculo gris de relleno cuando el usuario no tiene foto
            <div className={styles.avatar} aria-hidden="true" />
          )}

          <div className={styles.userInfo}>
            <span className={styles.username}>
              {author.username ?? 'Usuario desconocido'}
            </span>
            <span className={styles.date}>{formatDate(created_at)}</span>
          </div>
        </header>

        {/* Parte central: título + cuerpo + fila del botón "Ver todo" */}
        <div className={styles.content}>
          <h3
            ref={titleRef}
            className={
              expanded
                ? `${styles.title} ${styles.titleExpanded}`
                : styles.title
            }
          >
            {title}
          </h3>
          <p
            ref={textRef}
            className={
              expanded ? `${styles.text} ${styles.textExpanded}` : styles.text
            }
          >
            {text}
          </p>

          {/*
            Esta fila se renderiza SIEMPRE (con o sin botón) para que su
            espacio esté reservado y la altura de la card no cambie
            según haya o no contenido oculto.
          */}
          <div className={styles.toggleRow}>
            {(hasHiddenContent || expanded) && (
              <button
                type="button"
                className={styles.toggleButton}
                onClick={() => setExpanded((prev) => !prev)}
                aria-expanded={expanded}
              >
                {expanded ? 'Mostrar menos' : 'Ver todo'}
              </button>
            )}
          </div>
        </div>

        {/* Parte inferior: línea separadora + acciones */}
        <footer className={styles.footer}>
          <div className={styles.likeGroup}>
            <button
              type="button"
              className={
                isLiked
                  ? `${styles.likeButton} ${styles.likeButtonActive}`
                  : styles.likeButton
              }
              onClick={handleLike}
              aria-pressed={isLiked}
              aria-label={isLiked ? 'Quitar me gusta' : 'Dar me gusta'}
            >
              <svg
                className={styles.icon}
                viewBox="0 0 24 24"
                // Vacío cuando está apagado, relleno cuando está en "me gusta"
                fill={isLiked ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
            </button>
            <span className={styles.likeCount}>{likes}</span>
          </div>

          {/* De momento no hace nada: solo tiene el diseño */}
          <button
            type="button"
            className={styles.commentsButton}
            onClick={() => onOpenComments?.(id)}
            aria-label="Ver comentarios"
          >
            <svg
              className={styles.icon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
            </svg>
          </button>
        </footer>
      </div>
    </article>
  );
}