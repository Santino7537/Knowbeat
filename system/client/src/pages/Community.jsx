import { useCallback, useEffect, useRef, useState } from 'react';
import api, { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from '../components/general/Avatar.jsx';
import Sidebar from '../components/Sidebar';
import CreatePostModal, { POST_KINDS } from '../components/Community/Createpostmodal';
import PostCard from '../components/Community/Postcard';
import FolderCard from '../components/Community/Foldercard';
import UserCard from '../components/Community/Usercard';
import FilterPanel from '../components/Community/Filterpanel';
import Pagination from '../components/Community/Pagination';
import styles from './CSS/Community.module.css';

// Elementos por página, POR CADA tipo de contenido marcado en los filtros.
const PAGE_SIZE = 10;

// Espera desde la última tecla antes de buscar (ver más abajo por qué).
const SEARCH_DEBOUNCE_MS = 400;

// ASUMIDO: la búsqueda se pide a través de searchCommunity, que es lo único
// que exporta tu controller. Confirmá el path real en tu archivo de rutas.
const COMMUNITY_SEARCH_ENDPOINT = '/community/search';
const USER_BY_ID_ENDPOINT = '/user/get/user';

// Tipos de contenido. Los `value` son los mismos que acepta el backend en
// `types`. El orden de esta lista es el orden del panel Y el orden en que se
// muestran en la página (publicaciones, luego carpetas, luego usuarios).
const CONTENT_TYPES = [
  { value: 'threads', label: 'Publicaciones' },
  { value: 'folders', label: 'Carpetas' },
  { value: 'users', label: 'Usuarios' },
];

export default function Community() {
  const { loggedUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalKind, setModalKind] = useState(null);

  const openComposer = (kind = null) => {
    setModalKind(kind);
    setIsModalOpen(true);
  };

  // --- Búsqueda ---
  // `search` es lo que el usuario está escribiendo (cambia en cada tecla).
  // `query` es el texto ya "aplicado": el que realmente se manda al backend.
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const appliedQueryRef = useRef('');

  // --- Filtros ---
  // Por defecto solo publicaciones, como en tu imagen del panel.
  const [visibleTypes, setVisibleTypes] = useState(['threads']);
  const [tags, setTags] = useState([]);

  // --- Resultados ---
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Cambiar este número fuerza a recargar (al publicar algo y en "Reintentar").
  const [reloadKey, setReloadKey] = useState(0);

  // Caché de usuarios { [id]: { username, picture, biography, streak } }.
  // Un mismo usuario puede aparecer como autor de una publicación, creador de
  // una carpeta y perfil en los resultados: con este caché se pide UNA sola vez.
  // Es un ref porque solo evita pedidos repetidos, no necesita provocar renders.
  const usersCacheRef = useRef({});

  // El scroll vive en el área de contenido (ver el CSS); necesitamos la
  // referencia para volver arriba al cambiar de página.
  const mainRef = useRef(null);

  // Aplica el texto de búsqueda. Si no cambió, no hace nada: así, escribir y
  // borrar una letra estando en la página 3 no te manda de vuelta a la 1.
  const applyQuery = useCallback((value) => {
    const trimmed = value.trim();
    if (trimmed === appliedQueryRef.current) return;
    appliedQueryRef.current = trimmed;
    setQuery(trimmed);
    setPage(1);
  }, []);

  // Debounce: la búsqueda se aplica 400ms después de la última tecla. Sin esto
  // se mandaría un pedido (y hasta 30 pedidos de usuarios) por cada letra.
  useEffect(() => {
    const timeoutId = setTimeout(() => applyQuery(search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeoutId);
  }, [search, applyQuery]);

  useEffect(() => {
    // Evita aplicar una respuesta vieja si el usuario ya cambió de página,
    // de filtros o de búsqueda mientras la petición seguía en curso.
    let cancelled = false;

    const loadContent = async () => {
      // Sin ningún tipo marcado no hay nada que pedir (el backend respondería 422).
      if (visibleTypes.length === 0) {
        setItems([]);
        setTotalPages(0);
        setLoadError('');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLoadError('');

      try {
        // URLSearchParams permite repetir una clave (tags=a&tags=b). Así las
        // etiquetas viajan como lista sin depender de cómo axios o Express
        // interpreten los corchetes, y una etiqueta puede llevar comas.
        const params = new URLSearchParams();
        params.append('types', visibleTypes.join(','));
        params.append('page', page);
        params.append('limit', PAGE_SIZE);
        if (query) params.append('query', query);
        tags.forEach((tag) => params.append('tags', tag));

        // Respuesta esperada: una clave por cada tipo pedido, por ejemplo
        // { threads: { data, pagination }, folders: {...}, users: {...} }
        const response = await api.get(COMMUNITY_SEARCH_ENDPOINT, { params });
        const { threads, folders, users } = response.data;

        const threadList = threads?.data ?? [];
        const folderList = folders?.data ?? [];
        const userList = users?.data ?? [];

        // Usuarios que necesitamos conocer: autores de publicaciones, creadores
        // de carpetas y los perfiles encontrados. Sin repetir y sin los que ya tenemos.
        const neededIds = new Set([
          ...threadList.map((thread) => thread.author_id),
          ...folderList.map((folder) => folder.author),
          ...userList.map((user) => user.id),
        ]);
        const missingIds = [...neededIds].filter(
          (userId) => userId != null && !(userId in usersCacheRef.current)
        );

        // allSettled (y no all): si un usuario falla, el resto igual se muestra.
        const results = await Promise.allSettled(
          missingIds.map((userId) =>
            api.get(`${USER_BY_ID_ENDPOINT}/${userId}`)
          )
        );
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            // Guardamos SOLO lo que las tarjetas usan.
            const { username, picture, biography, streak } = result.value.data;
            usersCacheRef.current[missingIds[index]] = {
              username,
              picture,
              biography,
              streak,
            };
          }
        });

        if (cancelled) return;

        const getUser = (userId) => usersCacheRef.current[userId];

        // Una sola lista con los tres tipos, en el orden del panel.
        setItems([
          ...threadList.map((thread) => ({
            key: `thread:${thread.id}`,
            type: 'thread',
            data: { ...thread, author: getUser(thread.author_id) },
          })),
          ...folderList.map((folder) => ({
            key: `folder:${folder.id}`,
            type: 'folder',
            data: { ...folder, author: getUser(folder.author) },
          })),
          ...userList.map((user) => {
            const profile = getUser(user.id);
            return {
              key: `user:${user.id}`,
              type: 'user',
              data: {
                id: user.id,
                // Si el pedido del perfil falló, usamos lo que ya trajo la búsqueda.
                username: profile?.username ?? user.username,
                picture: profile?.picture ?? user.picture,
                biography: profile?.biography,
                streak: profile?.streak,
              },
            };
          }),
        ]);

        // Cada tipo tiene su propio total. La cantidad de páginas es la del tipo
        // que más tiene: en las últimas páginas los tipos más cortos ya no traen nada.
        const pagesPerType = [threads, folders, users].map((result) =>
          result ? Math.ceil(result.pagination.total / PAGE_SIZE) : 0
        );
        setTotalPages(Math.max(0, ...pagesPerType));
      } catch (error) {
        if (cancelled) return;
        setItems([]);
        setTotalPages(0);
        setLoadError(getErrorMessage(error, 'No se pudo cargar el contenido de la comunidad.'));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadContent();

    return () => {
      cancelled = true;
    };
  }, [page, reloadKey, query, visibleTypes, tags]);

  // Marcar/desmarcar un tipo. Se mantiene siempre el orden del panel
  // y se vuelve a la primera página (el resultado cambió por completo).
  const handleToggleType = (type) => {
    setVisibleTypes((previous) => {
      const next = previous.includes(type)
        ? previous.filter((value) => value !== type)
        : [...previous, type];
      return CONTENT_TYPES.map((option) => option.value).filter((value) =>
        next.includes(value)
      );
    });
    setPage(1);
  };

  const handleTagsChange = (nextTags) => {
    setTags(nextTags);
    setPage(1);
  };

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
  const isFirstLoad = isLoading && items.length === 0;

  const isFiltering = query !== '' || tags.length > 0;
  let emptyMessage = '';
  if (visibleTypes.length === 0) {
    emptyMessage = 'Elegí al menos un tipo de contenido en los filtros.';
  } else if (!isLoading && !loadError && items.length === 0) {
    emptyMessage = isFiltering
      ? 'No se encontraron resultados para tu búsqueda.'
      : 'Todavía no hay contenido para mostrar.';
  }

  return (
    <div className={styles.page}>
      <Sidebar />

      <main className={styles.mainArea} ref={mainRef}>
        <header className={styles.pageHeader}>
          <div>
            <h1>Comunidad</h1>
            <p>Preguntá, compartí tus avances y aprendé con otros músicos.</p>
          </div>

          <div className={styles.searchWrapper}>
            <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Buscar publicaciones, carpetas o personas"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applyQuery(search);
              }}
              aria-label="Buscar en la comunidad"
            />
            {search && (
              <button type="button" className={styles.clearSearch} onClick={() => setSearch('')} aria-label="Borrar búsqueda">×</button>
            )}
          </div>
        </header>

        <div className={styles.columns}>
          {/* Columna central: contenido + paginación */}
          <section className={styles.feed} aria-busy={isLoading}>
            {/* Caja para publicar: invita a participar */}
            <div className={styles.composer}>
              <div className={styles.composerTop}>
                <Avatar name={loggedUser?.username ?? 'Vos'} src={loggedUser?.picture} size={44} />
                <button type="button" className={styles.composerInput} onClick={() => openComposer()}>
                  ¿Qué estás practicando hoy{loggedUser?.username ? `, ${loggedUser.username}` : ''}?
                </button>
              </div>
              <div className={styles.composerKinds}>
                {POST_KINDS.map((k) => (
                  <button key={k.id} type="button" className={styles.composerKind} onClick={() => openComposer(k.id)}>
                    {k.label}
                  </button>
                ))}
                <button type="button" className={styles.composerPublish} onClick={() => openComposer()}>
                  Publicar
                </button>
              </div>
            </div>

            {isFirstLoad && (
              <div className={styles.skeletonList} aria-label="Cargando publicaciones">
                {[0, 1, 2].map((n) => (
                  <div key={n} className={styles.skeleton}>
                    <div className={styles.skeletonHead}><span className={styles.skCircle} /><span className={styles.skLine} /></div>
                    <span className={styles.skLineWide} />
                    <span className={styles.skLineWide} />
                    <span className={styles.skLineShort} />
                  </div>
                ))}
              </div>
            )}

            {loadError && (
              <div className={styles.statusBox} role="alert">
                <h2>No se pudo cargar</h2>
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

            {emptyMessage && (
              <div className={styles.statusBox}>
                <h2>{isFiltering ? 'Sin resultados' : 'Todavía no hay publicaciones'}</h2>
                <p className={styles.statusText}>{emptyMessage}</p>
                {!isFiltering && visibleTypes.length > 0 && (
                  <button type="button" className={styles.retryButton} onClick={() => openComposer()}>
                    Crear la primera publicación
                  </button>
                )}
              </div>
            )}

            {items.length > 0 && (
              <div
                className={
                  isLoading ? `${styles.list} ${styles.listLoading}` : styles.list
                }
              >
                {items.map((item) => {
                  if (item.type === 'thread') {
                    return <PostCard key={item.key} post={item.data} />;
                  }
                  if (item.type === 'folder') {
                    return <FolderCard key={item.key} folder={item.data} />;
                  }
                  return <UserCard key={item.key} user={item.data} />;
                })}
              </div>
            )}

            {/* Solo aparece si algún tipo tiene más de PAGE_SIZE (10) elementos */}
            {!loadError && totalPages > 1 && (
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </section>

          <FilterPanel
            typeOptions={CONTENT_TYPES}
            visibleTypes={visibleTypes}
            onToggleType={handleToggleType}
            tags={tags}
            onTagsChange={handleTagsChange}
          />
        </div>
      </main>

      <CreatePostModal
        isOpen={isModalOpen}
        initialKind={modalKind}
        onClose={() => setIsModalOpen(false)}
        onPostCreated={handlePostCreated}
      />
    </div>
  );
}