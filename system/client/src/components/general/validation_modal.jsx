import styles from './validation_modal.module.css'

function ValidationModal({ missingFields, onClose }) {
  if (!missingFields) return null;

  return (
    <div className={styles.modal_overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className={styles.modal_icon}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h3 id="modal-title" className={styles.modal_title}>
          Campos incompletos
        </h3>
        <p className={styles.modal_body}>
          Por favor completá los siguientes campos antes de continuar:
        </p>
        <ul className={styles.modal_list}>
          {missingFields.map((field) => (
            <li key={field} className={styles.modal_list_item}>
              {field}
            </li>
          ))}
        </ul>
        <button className={styles.modal_button} onClick={onClose} autoFocus>
          Entendido
        </button>
      </div>
    </div>
  );
}

export default ValidationModal