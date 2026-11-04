import { useCallback, useEffect, useRef, useState } from 'react';
import api, { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx'; // <-- Importar hook de idioma
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

// Espera desde la última tecla antes de buscar
const SEARCH_DEBOUNCE_MS = 400;

const COMMUNITY_SEARCH_ENDPOINT = '/community/search';
const USER_BY_ID_ENDPOINT = '/user/get/user';

export default function Community() {
  const { loggedUser } = useAuth();
  const { t } = useLanguage(); // <-- Consumir la función de traducción

  // Tipos de contenido definidos dentro del componente para que lean las traducciones dinámicamente
  const CONTENT_TYPES = [
    { value: 'threads', label: t('community.types.threads') },
    { value: 'folders', label: t('community.types.folders') },
    { value: 'users', label: t('community.types.users') },
  ];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalKind, setModalKind] = useState(null);

  const openComposer = (kind = null) => {
    setModalKind(kind);
    setIsModalOpen(true);
  };

  // --- Búsqueda ---
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const appliedQueryRef = useRef('');

  // --- Filtros ---
  const [visibleTypes, setVisibleTypes] = useState(['threads']);
  const [tags, setTags] = useState([]);

  // --- Resultados ---
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [reloadKey, setReloadKey] = useState(0);
  const usersCacheRef = useRef({});
  const mainRef = useRef(null);

  const applyQuery = useCallback((value) => {
    const trimmed = value.trim();
    if (trimmed === appliedQueryRef.current) return;
    appliedQueryRef.current = trimmed;
    setQuery(trimmed);
    setPage(1);
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => applyQuery(search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeoutId);
  }, [search, applyQuery]);

  useEffect(() => {
    let cancelled = false;

    const loadContent = async () => {
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
        const params = new URLSearchParams();
        params.append('types', visibleTypes.join(','));
        params.append('page', page);
        params.append('limit', PAGE_SIZE);
        if (query) params.append('query', query);
        tags.forEach((tag) => params.append('tags', tag));

        const response = await api.get(COMMUNITY_SEARCH_ENDPOINT, { params });
        const { threads, folders, users } = response.data;

        const threadList = threads?.data ?? [];
        const folderList = folders?.data ?? [];
        const userList = users?.data ?? [];

        const neededIds = new Set([
          ...threadList.map((thread) => thread.author_id),
          ...folderList.map((folder) => folder.author),
          ...userList.map((user) => user.id),
        ]);
        const missingIds = [...neededIds].filter(
          (userId) => userId != null && !(userId in usersCacheRef.current)
        );

        const results = await Promise.allSettled(
          missingIds.map((userId) =>
            api.get(`${USER_BY_ID_ENDPOINT}/${userId}`)
          )
        );
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
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
                username: profile?.username ?? user.username,
                picture: profile?.picture ?? user.picture,
                biography: profile?.biography,
                streak: profile?.streak,
              },
            };
          }),
        ]);

        const pagesPerType = [threads, folders, users].map((result) =>
          result ? Math.ceil(result.pagination.total / PAGE_SIZE) : 0
        );
        setTotalPages(Math.max(0, ...pagesPerType));
      } catch (error) {
        if (cancelled) return;
        setItems([]);
        setTotalPages(0);
        setLoadError(getErrorMessage(error, t('community.errors.load_failed')));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadContent();

    return () => {
      cancelled = true;
    };
  }, [page, reloadKey, query, visibleTypes, tags, t]);

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
    setPage(1);
    setReloadKey((key) => key + 1);
    mainRef.current?.scrollTo({ top: 0 });
  };

  const isFirstLoad = isLoading && items.length === 0;
  const isFiltering = query !== '' || tags.length > 0;
  
  let emptyMessage = '';
  if (visibleTypes.length === 0) {
    emptyMessage = t('community.empty.no_types');
  } else if (!isLoading && !loadError && items.length === 0) {
    emptyMessage = isFiltering
      ? t('community.empty.no_search_results')
      : t('community.empty.no_content');
  }

  return (
    <div className={styles.page}>
      <Sidebar />

      <main className={styles.mainArea} ref={mainRef}>
        <header className={styles.pageHeader}>
          <div>
            <h1>{t('community.title')}</h1>
            <p>{t('community.subtitle')}</p>
          </div>

          <div className={styles.searchWrapper}>
            <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="search"
              className={styles.searchInput}
              placeholder={t('community.search_placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applyQuery(search);
              }}
              aria-label={t('community.search_aria')}
            />
            {search && (
              <button type="button" className={styles.clearSearch} onClick={() => setSearch('')} aria-label={t('community.clear_search_aria')}>×</button>
            )}
          </div>
        </header>

        <div className={styles.columns}>
          <section className={styles.feed} aria-busy={isLoading}>
            <div className={styles.composer}>
              <div className={styles.composerTop}>
                <Avatar name={loggedUser?.username ?? t('community.composer.default_user')} src={loggedUser?.picture} size={44} />
                <button type="button" className={styles.composerInput} onClick={() => openComposer()}>
                  {t('community.composer.prompt_prefix')}
                  {loggedUser?.username ? `, ${loggedUser.username}` : ''}?
                </button>
              </div>
              <div className={styles.composerKinds}>
                {POST_KINDS.map((k) => (
                  <button key={k.id} type="button" className={styles.composerKind} onClick={() => openComposer(k.id)}>
                    {k.label}
                  </button>
                ))}
                <button type="button" className={styles.composerPublish} onClick={() => openComposer()}>
                  {t('community.composer.publish_btn')}
                </button>
              </div>
            </div>

            {isFirstLoad && (
              <div className={styles.skeletonList} aria-label={t('community.loading_aria')}>
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
                <h2>{t('community.error_title')}</h2>
                <p className={styles.statusText}>{loadError}</p>
                <button
                  type="button"
                  className={styles.retryButton}
                  onClick={() => setReloadKey((key) => key + 1)}
                >
                  {t('community.retry_btn')}
                </button>
              </div>
            )}

            {emptyMessage && (
              <div className={styles.statusBox}>
                <h2>{isFiltering ? t('community.empty.search_title') : t('community.empty.default_title')}</h2>
                <p className={styles.statusText}>{emptyMessage}</p>
                {!isFiltering && visibleTypes.length > 0 && (
                  <button type="button" className={styles.retryButton} onClick={() => openComposer()}>
                    {t('community.empty.create_first')}
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