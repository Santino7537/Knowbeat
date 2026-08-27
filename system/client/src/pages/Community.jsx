import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import CreatePostModal from '../components/Community/Createpostmodal';
import styles from './CSS/Community.module.css';

export default function Community() {
  // Texto actual de la barra de búsqueda.
  // Todavía no filtra nada: eso lo dejamos para el siguiente paso,
  // así vamos agregando funcionalidad de a poco como pediste.
  const [search, setSearch] = useState('');

  // Controla si el modal de "crear publicación" está visible o no.
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className={styles.page}>
      {/* Sidebar ya existente, no la tocamos, solo la importamos */}
      <Sidebar />

      <main className={styles.mainArea}>
        <div className={styles.topBar}>
          {/* Barra de búsqueda */}
          <div className={styles.searchWrapper}>
            <svg
              className={styles.searchIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Buscar publicaciones..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Botón de "+" que abre el modal de creación de publicación */}
          <button
            type="button"
            className={styles.addButton}
            onClick={() => setIsModalOpen(true)}
            aria-label="Crear publicación"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>

        {/* Acá abajo, en los próximos pasos, va el feed de publicaciones */}
      </main>

      <CreatePostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}