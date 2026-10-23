import folderIcon from '../../assets/folder-open-svgrepo-com.svg';
import styles from './FolderCard.module.css';

/*
  Props:
  - folder: { id, name, author: { username } }
    searchFolders devuelve el id del creador en `author`; la página lo
    reemplaza por el objeto { username } pidiéndolo a /user/get/user/:id
    (el mismo caché de autores que usan las publicaciones).
*/
export default function FolderCard({ folder }) {
  const { name, author } = folder;

  return (
    <article className={styles.card}>
      <div className={styles.inner}>
        {/* Cuadrado con esquinas curvadas donde iría la foto de perfil */}
        <div className={styles.iconBox}>
          {/* Decorativo: el nombre de la carpeta ya describe el contenido */}
          <img className={styles.icon} src={folderIcon} alt="" aria-hidden="true" />
        </div>

        <div className={styles.folderInfo}>
          <span className={styles.name}>{name}</span>
          <span className={styles.creator}>
            {author?.username ?? 'Usuario desconocido'}
          </span>
        </div>
      </div>
    </article>
  );
}