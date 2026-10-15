import styles from './Pagination.module.css';

/*
  Decide qué números mostrar. Con muchas páginas no entran todos, así que
  se muestran siempre: la primera, la última, la actual y sus vecinas, y los
  huecos se reemplazan por "…". Ejemplo con 20 páginas estando en la 10:
  1 … 9 10 11 … 20

  Si el hueco es de una sola página (ej: 1 _ 3) se muestra el número en vez
  de "…", porque un "…" que esconde una sola página no ahorra nada.
*/
const getPageItems = (currentPage, totalPages) => {
  const visible = new Set([
    1,
    totalPages,
    currentPage - 1,
    currentPage,
    currentPage + 1,
  ]);

  const sorted = [...visible]
    .filter((pageNumber) => pageNumber >= 1 && pageNumber <= totalPages)
    .sort((a, b) => a - b);

  const items = [];
  sorted.forEach((pageNumber, index) => {
    if (index > 0) {
      const gap = pageNumber - sorted[index - 1];
      if (gap === 2) items.push(pageNumber - 1);
      else if (gap > 2) items.push(`ellipsis${index}`);
    }
    items.push(pageNumber);
  });

  return items;
};

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  const items = getPageItems(currentPage, totalPages);

  return (
    <nav className={styles.pagination} aria-label="Paginación">
      <button
        type="button"
        className={styles.pageButton}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Página anterior"
      >
        ‹
      </button>

      {items.map((item) =>
        typeof item === 'string' ? (
          // Los huecos son strings ("ellipsis1", ...); los números son páginas
          <span key={item} className={styles.ellipsis} aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            className={
              item === currentPage
                ? `${styles.pageButton} ${styles.pageButtonActive}`
                : styles.pageButton
            }
            onClick={() => onPageChange(item)}
            aria-label={`Página ${item}`}
            aria-current={item === currentPage ? 'page' : undefined}
          >
            {item}
          </button>
        )
      )}

      <button
        type="button"
        className={styles.pageButton}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Página siguiente"
      >
        ›
      </button>
    </nav>
  );
}