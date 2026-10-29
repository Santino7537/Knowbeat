import { Link } from 'react-router-dom';
import styles from './UserCard.module.css';

/*
  Props:
  - user: { id, username, picture, biography, streak }
    Los nombres de las propiedades los definí yo para el componente. Si las
    columnas de tu tabla User se llaman distinto, se convierten una sola vez
    en la página al armar el objeto, y este componente no cambia.
*/
export default function UserCard({ user }) {
  const { username, picture, biography } = user;

  // La racha puede llegar como string o null desde la base: la normalizamos a número.
  const streak = Number(user.streak) || 0;
  const hasStreak = streak > 0;

  // El contenido es el mismo se pueda hacer clic o no, así que se arma una sola vez.
  const content = (
    <div className={styles.inner}>
      {picture ? (
        <img
          className={styles.avatar}
          src={picture}
          alt={`Foto de ${username ?? 'usuario'}`}
        />
      ) : (
        // Círculo gris de relleno cuando el usuario no tiene foto
        <div className={styles.avatar} aria-hidden="true" />
      )}

      <div className={styles.userInfo}>
        <span className={styles.username}>
          {username ?? 'Usuario desconocido'}
        </span>
        {/* Si el usuario no escribió biografía, no mostramos la línea vacía */}
        {biography && <span className={styles.biography}>{biography}</span>}
      </div>

      {/* Racha de días consecutivos completando ejercicios */}
      <span
        className={
          hasStreak
            ? `${styles.streak} ${styles.streakActive}`
            : styles.streak
        }
        role="img"
        aria-label={`Racha de ${streak} ${streak === 1 ? 'día' : 'días'}`}
      >
        {streak}
      </span>
    </div>
  );

  // Sin username no hay perfil al que ir (el link sería /user/undefined),
  // así que en ese caso la tarjeta se muestra igual pero sin ser clickeable.
  if (!username) {
    return <article className={styles.card}>{content}</article>;
  }

  return (
    <Link
      className={`${styles.card} ${styles.cardLink}`}
      // encodeURIComponent protege nombres con espacios, tildes o símbolos
      // (como "/" o "?"), que de otro modo romperían la ruta.
      // React Router los decodifica solo al leerlos con useParams().
      to={`/user/${encodeURIComponent(username)}`}
      aria-label={`Ver perfil de ${username}`}
    >
      {content}
    </Link>
  );
}