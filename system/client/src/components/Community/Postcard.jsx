import { useLayoutEffect, useRef, useState } from 'react';
import axios from 'axios';
import styles from './PostCard.module.css';

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
};

export default function PostCard({ post }) {
  const { id, title, text, likes_count = 0, created_at, author = {} } = post;

  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(likes_count);

  // Estados de expansión y comentarios
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const [expanded, setExpanded] = useState(false);
  const [hasHiddenContent, setHasHiddenContent] = useState(false);

  const titleRef = useRef(null);
  const textRef = useRef(null);
  const commentInputRef = useRef(null);

  useLayoutEffect(() => {
    const titleEl = titleRef.current;
    const textEl = textRef.current;
    if (!titleEl || !textEl) return undefined;

    const measure = () => {
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

  // Manejo del Like conectado al backend real
  const handleLike = async () => {
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikes((prev) => prev + (nextLiked ? 1 : -1));

    try {
      await axios.patch(`/community/like/thread/${id}`, {}, { withCredentials: true });
    } catch (error) {
      // Revertimos en caso de error (ej: "Ya has dado like a este hilo")
      setIsLiked(!nextLiked);
      setLikes((prev) => prev + (nextLiked ? -1 : 1));
      console.error('Error al dar like:', error?.response?.data?.message || error.message);
    }
  };

  // Apertura y carga de comentarios
  const handleToggleComments = async () => {
    const nextOpen = !isCommentsOpen;
    setIsCommentsOpen(nextOpen);

    if (nextOpen && comments.length === 0) {
      setIsLoadingComments(true);
      try {
        const response = await axios.get(`/community/search/thread/${id}/responses`, {
          withCredentials: true,
        });
        setComments(response.data.data || []);
      } catch (error) {
        console.error('Error al cargar comentarios:', error);
      } finally {
        setIsLoadingComments(false);
      }
    }
  };

  // Enviar un nuevo comentario
  const handleCommentSubmit = async (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const trimmedText = newCommentText.trim();
      if (!trimmedText || isSubmittingComment) return;

      setIsSubmittingComment(true);
      try {
        const response = await axios.post(
          `/community/create/response/${id}`,
          { text: trimmedText },
          { withCredentials: true }
        );

        const newResponseId = response.data.responseId;

        // Agregamos el comentario de forma optimista a la lista local
        const createdComment = {
          id: newResponseId,
          text: trimmedText,
          created_at: new Date().toISOString(),
          author_id: 'current_user', // O el id de tu usuario logueado si lo tenés disponible
          likes_count: 0,
        };

        setComments((prev) => [...prev, createdComment]);
        setNewCommentText('');
      } catch (error) {
        console.error('Error al crear comentario:', error);
      } finally {
        setIsSubmittingComment(false);
      }
    }
  };

  // Ajuste automático de tamaño del textarea de comentarios
  const handleInputResize = (e) => {
    setNewCommentText(e.target.value);
    const target = e.target;
    target.style.height = 'auto';
    target.style.height = `${target.scrollHeight}px`;
  };

  return (
    <article className={styles.card} style={isCommentsOpen ? { height: 'auto', aspectRatio: 'unset' } : {}}>
      <div className={styles.inner}>
        {/* Parte superior */}
        <header className={styles.header}>
          {author.picture ? (
            <img className={styles.avatar} src={author.picture} alt={`Foto de ${author.username ?? 'usuario'}`} />
          ) : (
            <div className={styles.avatar} aria-hidden="true" />
          )}

          <div className={styles.userInfo}>
            <span className={styles.username}>{author.username ?? 'Usuario desconocido'}</span>
            <span className={styles.date}>{formatDate(created_at)}</span>
          </div>
        </header>

        {/* Parte central */}
        <div className={styles.content}>
          <h3 ref={titleRef} className={expanded ? `${styles.title} ${styles.titleExpanded}` : styles.title}>
            {title}
          </h3>
          <p ref={textRef} className={expanded ? `${styles.text} ${styles.textExpanded}` : styles.text}>
            {text}
          </p>

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

        {/* Parte inferior: Acciones */}
        <footer className={styles.footer}>
          <div className={styles.likeGroup}>
            <button
              type="button"
              className={isLiked ? `${styles.likeButton} ${styles.likeButtonActive}` : styles.likeButton}
              onClick={handleLike}
              aria-pressed={isLiked}
              aria-label={isLiked ? 'Quitar me gusta' : 'Dar me gusta'}
            >
              <svg
                className={styles.icon}
                viewBox="0 0 24 24"
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

          <button
            type="button"
            className={styles.commentsButton}
            onClick={handleToggleComments}
            aria-label="Ver comentarios"
            aria-expanded={isCommentsOpen}
          >
            <svg
              className={styles.icon}
              viewBox="0 0 24 24"
              fill={isCommentsOpen ? 'currentColor' : 'none'}
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

        {/* Sección extendida de comentarios */}
        {isCommentsOpen && (
          <>
            <div className={styles.commentsSection}>
              {isLoadingComments && <p className={styles.noComments}>Cargando comentarios...</p>}

              {!isLoadingComments && comments.length === 0 && (
                <p className={styles.noComments}>Sé el primero en comentar.</p>
              )}

              {comments.map((comment) => (
                <div key={comment.id} className={styles.commentItem}>
                  <div className={styles.commentHeader}>
                    <div className={styles.commentAvatar} />
                    <div className={styles.commentUserInfo}>
                      <span className={styles.commentUsername}>
                        {comment.author_name || 'Usuario'}
                      </span>
                      <span className={styles.commentDate}>{formatDate(comment.created_at)}</span>
                    </div>
                  </div>
                  <p className={styles.commentText}>{comment.text}</p>
                </div>
              ))}
            </div>

            {/* Input fijo en la parte inferior de la sección de comentarios */}
            <div className={styles.commentInputWrapper}>
              <textarea
                ref={commentInputRef}
                className={styles.commentInput}
                rows={1}
                placeholder="Escribe un comentario..."
                value={newCommentText}
                onChange={handleInputResize}
                onKeyDown={handleCommentSubmit}
              />
            </div>
          </>
        )}
      </div>
    </article>
  );
}