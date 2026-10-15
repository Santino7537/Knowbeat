import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import CreatePostModal from '../components/Community/Createpostmodal';
import PostCard from '../components/Community/Postcard';
import Pagination from '../components/general/Pagination';
import styles from './CSS/Community.module.css';

// Publicaciones por página. La paginación solo aparece si hay más de esto.
const PAGE_SIZE = 10;

// ASUMIDO: la lista de hilos se pide a través de searchCommunity, que es lo único
// que exporta tu controller. Confirmá el path real en tu archivo de rutas:
// es la única línea que habría que cambiar.
const COMMUNITY_SEARCH_ENDPOINT = '/community/search';
const USER_BY_ID_ENDPOINT = '/user/get/user';

export default function Community() {
  // Texto de la barra de búsqueda. Todavía no filtra: queda para un próximo paso.
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [threads, setThreads] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Cambiar este número fuerza a recargar la página actual
  // (lo usamos al publicar algo nuevo y en el botón "Reintentar").
  const [reloadKey, setReloadKey] = useState(0);

  // Caché de autores { [id]: { username, picture } }.
  // Es un ref (y no estado) porque solo sirve para no repetir pedidos: no
  // necesita provocar un render al cambiar. Si el mismo usuario publicó
  // varias veces, o aparece en otra página, no volvemos a pedirlo.
  const authorsRef = useRef({});

  // El scroll vive en el área de contenido, no en el body (ver el CSS).
  // Necesitamos la referencia para volver arriba al cambiar de página.
  const mainRef = useRef(null);

  useEffect(() => {
    // Evita aplicar una respuesta vieja si el usuario ya cambió de página
    // (o el componente se desmontó) mientras la petición seguía en curso.
    let cancelled = false;

    const loadThreads = async () => {
      setIsLoading(true);
      setLoadError('');

      try {
        // Pedimos la página de publicaciones. axios arma el query string a partir
        // de `params` y lanza error si el servidor responde 4xx/5xx (cae en el catch).
        // Respuesta esperada con types=threads:
        // { threads: { data: [...], pagination: { page, limit, total } } }
        const response = await axios.get(COMMUNITY_SEARCH_ENDPOINT, {
          params: { types: 'threads', page, limit: PAGE_SIZE },
          withCredentials: true,
        });
        const { data, pagination } = response.data.threads;

        // Pedimos los autores que todavía no tenemos, sin repetir ids y en paralelo.
        const missingIds = [...new Set(data.map((t) => t.author_id))].filter(
          (authorId) => !(authorId in authorsRef.current)
        );

        // allSettled (y no all): si un usuario falla, el resto del feed igual se muestra
        // y esa card cae en "Usuario desconocido".
        const results = await Promise.allSettled(
          missingIds.map((authorId) =>
            axios.get(`${USER_BY_ID_ENDPOINT}/${authorId}`, {
              withCredentials: true,
            })
          )
        );
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            // Guardamos SOLO username y picture: la card no necesita nada más
            // y así no dejamos en memoria campos que no hacen falta.
            const { username, picture } = result.value.data;
            authorsRef.current[missingIds[index]] = { username, picture };
          }
        });

        if (cancelled) return;

        // Mostramos publicaciones y autores juntos en un único render,
        // así no se ve el "Usuario desconocido" parpadeando antes de tiempo.
        setThreads(
          data.map((thread) => ({
            ...thread,
            author: authorsRef.current[thread.author_id],
          }))
        );
        setTotal(pagination.total);
      } catch (error) {
        if (cancelled) return;
        setThreads([]);
        setLoadError('No se pudieron cargar las publicaciones.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadThreads();

    return () => {
      cancelled = true;
    };
  }, [page, reloadKey]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handlePageChange = (nextPage) => {
    setPage(nextPage);
    mainRef.current?.scrollTo({ top: 0 });
  };

  const handlePostCreated = () => {
    // Volvemos a la primera página y recargamos para ver la novedad.
    setPage(1);
    setReloadKey((key) => key + 1);
    mainRef.current?.scrollTo({ top: 0 });
  };

  // Solo en la primera carga (sin nada para mostrar todavía) reemplazamos
  // el feed por un texto; en cargas posteriores atenuamos lo que ya está.
  const isFirstLoad = isLoading && threads.length === 0;

  return (
    <div className={styles.page}>
      <Sidebar />

      <main className={styles.mainArea} ref={mainRef}>
        <div className={styles.topBar}>
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
              placeholder="Busca algo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

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

        <div className={styles.columns}>
          {/* Columna central: publicaciones + paginación */}
          <section className={styles.feed} aria-busy={isLoading}>
            {isFirstLoad && (
              <p className={styles.statusText}>Cargando publicaciones...</p>
            )}

            {loadError && (
              <div className={styles.statusBox}>
                <p className={styles.statusText}>{loadError}</p>
                <button
                  type="button"
                  className={styles.retryButton}
                  onClick={() => setReloadKey((key) => key + 1)}
                >
                  Reintentar
                </button>
              </div>
            )}

            {!isLoading && !loadError && threads.length === 0 && (
              <p className={styles.statusText}>
                Todavía no hay publicaciones. ¡Sé el primero en publicar!
              </p>
            )}

            {threads.length > 0 && (
              <div
                className={
                  isLoading ? `${styles.list} ${styles.listLoading}` : styles.list
                }
              >
                {threads.map((thread) => (
                  <PostCard key={thread.id} post={thread} />
                ))}
              </div>
            )}

            {/* Solo aparece si hay más de PAGE_SIZE (10) publicaciones */}
            {!loadError && total > PAGE_SIZE && (
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </section>

          {/*
            Marcador de posición del selector de filtros (todavía no existe).
            Reserva su ancho real para que el resto del layout ya quede bien
            distribuido. Se reemplaza por <FilterSelector /> cuando lo hagamos.
          */}
          <aside className={styles.filters}>
            <h2 className={styles.filtersTitle}>Filtros</h2>
          </aside>
        </div>
      </main>

      <CreatePostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPostCreated={handlePostCreated}
      />
    </div>
  );
}