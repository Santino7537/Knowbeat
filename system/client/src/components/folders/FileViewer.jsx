import styles from "./FileViewer.module.css";

const isImage = (type) => type?.startsWith("image/");
const isAudio = (type) => type?.startsWith("audio/");
const isVideo = (type) => type?.startsWith("video/");

export default function FileViewer({ file, url, onClose }) {
  let content;
  if (file.mime_type === "application/pdf") {
    content = <iframe className={styles.document} title={file.name} src={url} />;
  } else if (isImage(file.mime_type)) {
    content = <img className={styles.image} src={url} alt={file.name} />;
  } else if (isAudio(file.mime_type)) {
    content = <audio className={styles.media} src={url} controls autoPlay />;
  } else if (isVideo(file.mime_type)) {
    content = <video className={styles.media} src={url} controls autoPlay playsInline />;
  } else if (file.mime_type === "text/plain") {
    content = <iframe className={styles.document} title={file.name} src={url} sandbox="" />;
  } else {
    content = <a className={styles.download} href={url} download={file.name}>Descargar archivo</a>;
  }

  return (
    <div className={styles.backdrop} role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className={styles.dialog} role="dialog" aria-modal="true" aria-label={`Vista previa de ${file.name}`}>
        <header className={styles.header}>
          <strong title={file.name}>{file.name}</strong>
          <button type="button" onClick={onClose} aria-label="Cerrar visor">×</button>
        </header>
        <div className={styles.content}>{content}</div>
      </section>
    </div>
  );
}
