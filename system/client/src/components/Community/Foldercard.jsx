import { Link } from 'react-router-dom';
import folderIcon from '../../assets/folder-open-svgrepo-com.svg';
import styles from './Foldercard.module.css';

/*
  Props:
  - folder: { id, name, author: { username } }
    searchFolders devuelve el id del creador en `author`; la página lo
    reemplaza por el objeto { username } pidiéndolo a /user/get/user/:id
    (el mismo caché de autores que usan las publicaciones).
    `id` es el _id de Mongo (viene como string) y es el que va en la URL.
*/
export default function FolderCard({ folder }) {
  const { id, name, author } = folder;

  // El contenido es el mismo se pueda hacer clic o no, así que se arma una sola vez.
  const content = (
    <div className={styles.inner}>
      {/* Cuadrado con esquinas curvadas donde iría la foto de perfil */}
      <div className={styles.iconBox}>
        {/* Decorativo: el nombre de la carpeta ya describe el contenido */}
        <img className={styles.icon} src={folderIcon} alt="" aria-hidden="true" />
      </div>

      <div className={styles.folderInfo}>
        <span className={styles.name}>{name}</span>
        <span className={styles.creator}>
          Carpeta pública de {author?.username ?? 'un usuario'}
        </span>
      </div>
    </div>
  );

  // Sin id no hay carpeta a la que ir (el link sería /folders/undefined),
  // así que en ese caso la tarjeta se muestra igual pero sin ser clickeable.
  if (id == null) {
    return <article className={styles.card}>{content}</article>;
  }

  return (
    <Link
      className={`${styles.card} ${styles.cardLink}`}
      to={`/folders/${id}`}
      aria-label={name ? `Abrir carpeta ${name}` : 'Abrir carpeta'}
    >
      {content}
    </Link>
  );
}