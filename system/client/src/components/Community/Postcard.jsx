import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../../api/client';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import Avatar from '../general/Avatar.jsx';
import { fullDate, timeAgo } from '../../utils/format';
import styles from './Postcard.module.css';

// Cache compartido entre tarjetas para no pedir dos veces el mismo autor de comentario
const authorCache = new Map();

async function fetchAuthor(userId) {
  if (userId == null) return null;
  if (!authorCache.has(userId)) {
    authorCache.set(
      userId,
      api.get(`/user/get/user/${userId}`)
        .then(({ data }) => ({ username: data.username, picture: data.picture }))
        .catch(() => null)
    );
  }
  return authorCache.get(userId);
}

export default function PostCard({ post }) {
  const { id, title, text, likes_count = 0, created_at, author = {}, tags = [] } = post;
  const navigate = useNavigate();
  const toast = useToast();
  const { loggedUser } = useAuth();

  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(likes_count);
  const [likeBurst, setLikeBurst] = useState(0);

  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentsError, setCommentsError] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const [expanded, setExpanded] = useState(false);
  const [hasHiddenContent, setHasHiddenContent] = useState(false);
  const textRef = useRef(null);
  const commentInputRef = useRef(null);

  // ¿El texto está cortado? Solo en ese caso mostramos "Ver más"
  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) return undefined;
    const measure = () => {
      if (!expanded) setHasHiddenContent(el.scrollHeight > el.clientHeight + 1);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    measure();
    return () => observer.disconnect();
  }, [text, expanded]);

  useEffect(() => {
    if (isCommentsOpen) commentInputRef.current?.focus();
  }, [isCommentsOpen]);

  // ── Me gusta ────────────────────────────────────────────────────────────
  const handleLike = async () => {
    if (isLiked) {
      toast.info('Ya le diste me gusta a esta publicación.');
      return;
    }
    setIsLiked(true);
    setLikes((prev) => prev + 1);
    setLikeBurst((n) => n + 1);

    try {
      await api.patch(`/community/like/thread/${id}`);
    } catch (error) {
      const message = getErrorMessage(error, 'No se pudo registrar tu me gusta.');
      // Si el servidor dice que ya tenía like, dejamos el corazón marcado
      if (/ya has dado like/i.test(message)) {
        setLikes((prev) => prev - 1);
        return;
      }
      setIsLiked(false);
      setLikes((prev) => prev - 1);
      toast.error(message);
    }
  };

  // ── Comentarios ─────────────────────────────────────────────────────────
  const loadComments = async () => {
    setIsLoadingComments(true);
    setCommentsError('');
    try {
      const { data } = await api.get(`/community/search/thread/${id}/responses`);
      const list = data?.data ?? [];
      const withAuthors = await Promise.all(
        list.map(async (comment) => ({ ...comment, author: await fetchAuthor(comment.author_id) }))
      );
      setComments(withAuthors);
      setCommentsLoaded(true);
    } catch (error) {
      setCommentsError(getErrorMessage(error, 'No se pudieron cargar los comentarios.'));
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleToggleComments = () => {
    const nextOpen = !isCommentsOpen;
    setIsCommentsOpen(nextOpen);
    if (nextOpen && !commentsLoaded) loadComments();
  };

  const submitComment = async () => {
    const trimmedText = newCommentText.trim();
    if (!trimmedText || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const { data } = await api.post(`/community/create/response/${id}`, { text: trimmedText });
      setComments((prev) => [
        ...prev,
        {
          id: data?.responseId ?? `local-${Date.now()}`,
          text: trimmedText,
          created_at: new Date().toISOString(),
          author: loggedUser ? { username: loggedUser.username, picture: loggedUser.picture } : null,
        },
      ]);
      setNewCommentText('');
      if (commentInputRef.current) commentInputRef.current.style.height = 'auto';
    } catch (error) {
      toast.error(getErrorMessage(error, 'No se pudo publicar tu comentario.'));
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleCommentKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitComment();
    }
  };

  const handleInputResize = (e) => {
    setNewCommentText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const authorName = author.username ?? 'Usuario';
  const goToAuthor = () => author.username && navigate(`/user/${encodeURIComponent(author.username)}`);

  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <button type="button" className={styles.authorButton} onClick={goToAuthor} disabled={!author.username}>
          <Avatar name={authorName} src={author.picture} size={44} />
          <span className={styles.userInfo}>
            <span className={styles.username}>{authorName}</span>
            <time className={styles.date} dateTime={created_at} title={fullDate(created_at)}>
              {timeAgo(created_at)}
            </time>
          </span>
        </button>
      </header>

      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        <p ref={textRef} className={expanded ? `${styles.text} ${styles.textExpanded}` : styles.text}>
          {text}
        </p>
        {(hasHiddenContent || expanded) && (
          <button
            type="button"
            className={styles.toggleButton}
            onClick={() => setExpanded((prev) => !prev)}
            aria-expanded={expanded}
          >
            {expanded ? 'Ver menos' : 'Ver más'}
          </button>
        )}

        {Array.isArray(tags) && tags.length > 0 && (
          <ul className={styles.tags} aria-label="Etiquetas">
            {tags.map((tag) => <li key={tag} className={styles.tag}>#{tag}</li>)}
          </ul>
        )}
      </div>

      <footer className={styles.footer}>
        <button
          type="button"
          className={`${styles.action} ${isLiked ? styles.liked : ''}`}
          onClick={handleLike}
          aria-pressed={isLiked}
          aria-label={isLiked ? 'Te gusta' : 'Me gusta'}
        >
          <svg key={likeBurst} className={styles.icon} viewBox="0 0 24 24" fill={isLiked ? 'currentColor' : 'none'}
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
          <span>{likes}</span>
        </button>

        <button
          type="button"
          className={`${styles.action} ${isCommentsOpen ? styles.actionActive : ''}`}
          onClick={handleToggleComments}
          aria-expanded={isCommentsOpen}
        >
          <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
          </svg>
          <span>{commentsLoaded ? `${comments.length} ` : ''}{comments.length === 1 ? 'comentario' : 'Comentar'}</span>
        </button>
      </footer>

      {isCommentsOpen && (
        <section className={styles.comments} aria-label="Comentarios">
          {isLoadingComments && (
            <div className={styles.commentSkeleton} aria-label="Cargando comentarios">
              <span /><span />
            </div>
          )}

          {commentsError && (
            <div className={styles.commentsError} role="alert">
              <span>{commentsError}</span>
              <button type="button" onClick={loadComments}>Reintentar</button>
            </div>
          )}

          {!isLoadingComments && !commentsError && comments.length === 0 && (
            <p className={styles.noComments}>Todavía no hay comentarios. ¡Sé la primera persona en responder!</p>
          )}

          {comments.map((comment) => {
            const name = comment.author?.username ?? 'Usuario';
            return (
              <div key={comment.id} className={styles.comment}>
                <Avatar name={name} src={comment.author?.picture} size={32} />
                <div className={styles.commentBody}>
                  <div className={styles.commentMeta}>
                    <strong>{name}</strong>
                    <time dateTime={comment.created_at} title={fullDate(comment.created_at)}>{timeAgo(comment.created_at)}</time>
                  </div>
                  <p>{comment.text}</p>
                </div>
              </div>
            );
          })}

          <div className={styles.commentComposer}>
            <Avatar name={loggedUser?.username ?? 'Vos'} src={loggedUser?.picture} size={32} />
            <textarea
              ref={commentInputRef}
              className={styles.commentInput}
              rows={1}
              placeholder="Escribí un comentario…"
              value={newCommentText}
              onChange={handleInputResize}
              onKeyDown={handleCommentKeyDown}
              maxLength={500}
              aria-label="Escribí un comentario"
            />
            <button
              type="button"
              className={styles.sendButton}
              onClick={submitComment}
              disabled={!newCommentText.trim() || isSubmittingComment}
              aria-label="Enviar comentario"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12.6 2-12.6 2z" /></svg>
            </button>
          </div>
        </section>
      )}
    </article>
  );
}
