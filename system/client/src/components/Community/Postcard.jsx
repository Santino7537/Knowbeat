import { useState } from 'react';
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
    (los primeros cinco campos ya los devuelve tu controller; "author" hay
    que armarlo, ver nota en la respuesta)
  - onLike(postId, isLiked): opcional, para cuando conectemos el endpoint
  - onOpenComments(postId): opcional, para cuando hagamos la vista de comentarios
*/
export default function PostCard({ post, onLike, onOpenComments }) {
  const { id, title, text, likes_count = 0, created_at, author = {} } = post;

  // Por ahora el like es solo visual/local: no hay endpoint todavía.
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(likes_count);

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

        {/* Parte central: título + cuerpo */}
        <div className={styles.content}>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.text}>{text}</p>
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