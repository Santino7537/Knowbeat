import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import FileViewer from "../components/folders/FileViewer";
import { useToast } from "../context/ToastContext.jsx";
import { getErrorMessage } from "../api/client";
import {
  createFolder,
  getFileUrl,
  listFolderFiles,
  listFolders,
  removeFile,
  removeFolder,
  shareFolder,
  unshareFolder,
  updateFolder,
  uploadFile
} from "../api/folders";
import styles from "./CSS/Folders.module.css";

const SCOPES = [
  { id: "mine", label: "Mis carpetas" },
  { id: "public", label: "Carpetas públicas" },
  { id: "shared", label: "Compartidas conmigo" }
];
const CATEGORIES = [
  { id: "", label: "Todos los archivos" },
  { id: "documents", label: "Documentos" },
  { id: "images", label: "Imágenes" },
  { id: "audio", label: "Audio" },
  { id: "video", label: "Videos" },
  { id: "other", label: "Otros" }
];
const PAGE_SIZE = 30;

const formatSize = (megabytes) => {
  const size = Number(megabytes) || 0;
  if (size === 0) return "0 KB";
  if (size < 1) return `${Math.max(1, Math.round(size * 1024))} KB`;
  if (size >= 1024) return `${(size / 1024).toFixed(2)} GB`;
  return `${size.toFixed(2)} MB`;
};

const fileGlyph = (mimeType) => {
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType?.startsWith("image/")) return "IMG";
  if (mimeType?.startsWith("audio/")) return "♫";
  if (mimeType?.startsWith("video/")) return "▶";
  if (mimeType === "text/plain") return "TXT";
  return "FILE";
};

const canPreview = (mimeType) =>
  mimeType === "application/pdf" ||
  mimeType === "text/plain" ||
  mimeType?.startsWith("image/") ||
  mimeType?.startsWith("audio/") ||
  mimeType?.startsWith("video/");

export default function Folders() {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const inputRef = useRef(null);
  const [scope, setScope] = useState("mine");
  const [category, setCategory] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("name");
  const [folderPage, setFolderPage] = useState(1);
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [folderInfo, setFolderInfo] = useState(null);
  const [storageUsed, setStorageUsed] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState("");
  const [dialogValue, setDialogValue] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [viewerUrl, setViewerUrl] = useState("");
  const [uploads, setUploads] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextQuery = searchInput.trim();
      if (nextQuery !== query) {
        setLoading(true);
        setError("");
        setQuery(nextQuery);
        setPage(1);
        setFolderPage(1);
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [query, searchInput]);

  useEffect(() => {
    let cancelled = false;
    const request = folderId
      ? listFolderFiles(folderId, { query, type: category || undefined, sort: sortBy, page, limit: PAGE_SIZE })
      : listFolders({ scope, query, page: folderPage, limit: PAGE_SIZE });

    request.then((result) => {
      if (cancelled) return;
      if (folderId) {
        setFolderInfo(result.folder);
        setFiles(result.files || []);
      } else {
        setFolders(result.data || []);
        setStorageUsed(result.storage_used_mb);
      }
      setPagination(result.pagination);
    }).catch((requestError) => {
      if (!cancelled) setError(getErrorMessage(requestError, "No se pudo cargar el contenido."));
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [category, folderId, folderPage, page, query, reloadKey, scope, sortBy]);

  const maxPages = useMemo(
    () => Math.max(1, Math.ceil(pagination.total / PAGE_SIZE)),
    [pagination.total]
  );

  const refresh = () => {
    setLoading(true);
    setError("");
    setReloadKey((key) => key + 1);
  };
  const openFolder = (id) => {
    setCategory("");
    setPage(1);
    navigate(`/folders/${id}`);
  };

  const closeDialog = () => {
    setDialog("");
    setDialogValue("");
  };

  const submitDialog = async (event) => {
    event.preventDefault();
    try {
      if (dialog === "create") {
        await createFolder(dialogValue.trim());
        toast.success("Carpeta creada.");
      } else if (dialog === "rename") {
        await updateFolder(folderInfo.id, { name: dialogValue.trim() });
        toast.success("Carpeta renombrada.");
      } else if (dialog === "share") {
        await shareFolder(folderInfo.id, dialogValue.trim());
        toast.success("Acceso de solo lectura compartido.");
      } else if (dialog === "unshare") {
        await unshareFolder(folderInfo.id, dialogValue.trim());
        toast.success("Se revocó el acceso compartido.");
      }
      closeDialog();
      refresh();
    } catch (requestError) {
      toast.error(getErrorMessage(requestError));
    }
  };

  const toggleVisibility = async () => {
    try {
      await updateFolder(folderInfo.id, { isPublic: !folderInfo.public });
      toast.success(folderInfo.public ? "La carpeta ahora es privada." : "La carpeta ahora es pública.");
      refresh();
    } catch (requestError) {
      toast.error(getErrorMessage(requestError));
    }
  };

  const deleteCurrentFolder = async () => {
    if (!window.confirm(`¿Eliminar "${folderInfo.name}" y todos sus archivos? Esta acción no se puede deshacer.`)) return;
    try {
      await removeFolder(folderInfo.id);
      toast.success("Carpeta eliminada.");
      navigate("/folders");
    } catch (requestError) {
      toast.error(getErrorMessage(requestError));
    }
  };

  const addUploads = async (fileList) => {
    const selectedFiles = Array.from(fileList || []);
    if (!folderInfo?.can_write || !selectedFiles.length) return;
    const jobs = selectedFiles.map((file, index) => ({
      id: `${Date.now()}-${index}-${file.name}`,
      name: file.name,
      progress: 0,
      status: "Subiendo",
      controller: new AbortController()
    }));
    setUploads((current) => [...current, ...jobs]);

    await Promise.all(jobs.map(async (job, index) => {
      const file = selectedFiles[index];
      try {
        await uploadFile(folderId, file, {
          signal: job.controller.signal,
          onProgress: (progress) => setUploads((current) => current.map((item) =>
            item.id === job.id ? { ...item, progress } : item
          ))
        });
        setUploads((current) => current.map((item) =>
          item.id === job.id ? { ...item, progress: 100, status: "Listo" } : item
        ));
        toast.success(`${file.name}: carga completada.`);
        refresh();
      } catch (requestError) {
        const cancelled = requestError?.code === "ERR_CANCELED" || requestError?.name === "CanceledError";
        setUploads((current) => current.map((item) =>
          item.id === job.id
            ? { ...item, status: cancelled ? "Cancelada" : "Error" }
            : item
        ));
        if (!cancelled) toast.error(`${file.name}: ${getErrorMessage(requestError)}`);
      }
    }));
  };

  const cancelUpload = (uploadId) => {
    const upload = uploads.find((item) => item.id === uploadId);
    upload?.controller.abort();
  };

  const openFile = async (file) => {
    try {
      const url = await getFileUrl(file.id, folderId, !canPreview(file.mime_type));
      if (canPreview(file.mime_type)) {
        setSelectedFile(file);
        setViewerUrl(url);
      } else {
        window.location.assign(url);
      }
    } catch (requestError) {
      toast.error(getErrorMessage(requestError));
    }
  };

  const deleteCurrentFile = async (file) => {
    if (!window.confirm(`¿Eliminar "${file.name}"?`)) return;
    try {
      await removeFile(file.id, folderId);
      toast.success("Archivo eliminado.");
      refresh();
    } catch (requestError) {
      toast.error(getErrorMessage(requestError));
    }
  };

  const onDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    addUploads(event.dataTransfer.files);
  };

  return (
    <div className={styles.page}>
      <Sidebar />
      <main className={styles.main}>
        <aside className={styles.filters} aria-label="Filtros de carpetas">
          {!folderId ? (
            <>
              <p className={styles.filterHeading}>Biblioteca</p>
              {SCOPES.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={`${styles.filterButton} ${scope === item.id ? styles.filterActive : ""}`}
                  onClick={() => {
                    if (scope !== item.id) {
                      setLoading(true);
                      setError("");
                      setScope(item.id);
                      setFolderPage(1);
                    }
                  }}
                >
                  <span aria-hidden="true">{item.id === "mine" ? "▰" : item.id === "public" ? "◉" : "↗"}</span>
                  {item.label}
                </button>
              ))}
              <div className={styles.storage}>
                <span>Almacenamiento usado</span>
                <strong>{storageUsed == null ? "—" : formatSize(storageUsed)}</strong>
                <small>Sin cuota configurada</small>
              </div>
            </>
          ) : (
            <>
              <p className={styles.filterHeading}>Tipo de archivo</p>
              {CATEGORIES.map((item) => (
                <button
                  type="button"
                  key={item.id || "all"}
                  className={`${styles.filterButton} ${category === item.id ? styles.filterActive : ""}`}
                  onClick={() => {
                    if (category !== item.id) {
                      setLoading(true);
                      setError("");
                      setCategory(item.id);
                      setPage(1);
                    }
                  }}
                >
                  {item.label}
                </button>
              ))}
            </>
          )}
        </aside>

        <section className={styles.content}>
          <header className={styles.header}>
            <div>
              <div className={styles.breadcrumbs}>
                <button type="button" onClick={() => navigate("/folders")}>Carpetas</button>
                {folderInfo && <><span>/</span><span>{folderInfo.name}</span></>}
              </div>
              <h1>{folderInfo?.name || SCOPES.find((item) => item.id === scope)?.label}</h1>
              <p>{folderInfo ? "Archivos organizados en esta carpeta." : "Tu espacio personal para guardar y organizar archivos."}</p>
            </div>
            <div className={styles.headerActions}>
              {!folderId && <button className={styles.primaryButton} type="button" onClick={() => setDialog("create")}>＋ Nueva carpeta</button>}
              {folderInfo?.can_write && (
                <button className={styles.primaryButton} type="button" onClick={() => inputRef.current?.click()}>↑ Subir archivos</button>
              )}
            </div>
          </header>

          <label className={styles.search}>
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={folderId ? "Buscar archivos en esta carpeta" : "Buscar carpetas"}
            />
            {searchInput && <button type="button" onClick={() => setSearchInput("")} aria-label="Limpiar búsqueda">×</button>}
          </label>

          {folderInfo && (
            <div className={styles.folderMeta}>
              <span>{folderInfo.public ? "Pública" : "Privada"} · {folderInfo.owner_name || "Propietario"}</span>
              {folderInfo.can_write && (
                <div className={styles.folderActions}>
                  <button type="button" onClick={() => { setDialogValue(folderInfo.name); setDialog("rename"); }}>Renombrar</button>
                  <button type="button" onClick={toggleVisibility}>{folderInfo.public ? "Hacer privada" : "Hacer pública"}</button>
                  <button type="button" onClick={() => setDialog("share")}>Compartir</button>
                  <button type="button" onClick={() => setDialog("unshare")}>Revocar acceso</button>
                  <button type="button" className={styles.dangerText} onClick={deleteCurrentFolder}>Eliminar carpeta</button>
                </div>
              )}
            </div>
          )}

          {folderInfo && (
            <div className={styles.fileToolbar}>
              <span>{pagination.total} {pagination.total === 1 ? "archivo" : "archivos"}</span>
              <label>
                Ordenar por
                <select
                  value={sortBy}
                  onChange={(event) => {
                    setLoading(true);
                    setError("");
                    setSortBy(event.target.value);
                    setPage(1);
                  }}
                >
                  <option value="name">Nombre</option>
                  <option value="size">Tamaño</option>
                </select>
              </label>
            </div>
          )}

          {folderInfo?.can_write && (
            <input
              ref={inputRef}
              className={styles.hiddenInput}
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.webp,.mp3,.wav,.ogg,.mp4,.webm,.txt"
              onChange={(event) => {
                addUploads(event.target.files);
                event.target.value = "";
              }}
            />
          )}

          {folderInfo?.can_write && (
            <div
              className={`${styles.dropzone} ${dragging ? styles.dropzoneActive : ""}`}
              onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
            >
              Arrastrá archivos acá o <button type="button" onClick={() => inputRef.current?.click()}>seleccionalos</button>
              <span>Máximo 50 MB por archivo.</span>
            </div>
          )}

          {uploads.length > 0 && (
            <div className={styles.uploadQueue} aria-live="polite">
              {uploads.map((upload) => (
                <div className={styles.uploadItem} key={upload.id}>
                  <span title={upload.name}>{upload.name}</span>
                  <progress value={upload.progress} max="100" />
                  <small>{upload.status === "Subiendo" ? `${upload.progress}%` : upload.status}</small>
                  {upload.status === "Subiendo" && <button type="button" onClick={() => cancelUpload(upload.id)}>Cancelar</button>}
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className={styles.stateMessage} role="alert">
              <p>{error}</p>
              <button type="button" onClick={refresh}>Reintentar</button>
            </div>
          )}
          {loading && <div className={styles.stateMessage}>Cargando contenido…</div>}
          {!loading && !error && !folderId && folders.length === 0 && (
            <div className={styles.empty}>
              <span aria-hidden="true">▰</span>
              <h2>{query ? "No encontramos carpetas" : "Todavía no hay carpetas"}</h2>
              <p>{query ? "Probá con otro nombre." : "Creá una carpeta para empezar a organizar tus archivos."}</p>
              {scope === "mine" && !query && <button className={styles.primaryButton} type="button" onClick={() => setDialog("create")}>Crear carpeta</button>}
            </div>
          )}
          {!loading && !error && folderId && files.length === 0 && (
            <div className={styles.empty}>
              <span aria-hidden="true">▱</span>
              <h2>{query || category ? "No encontramos archivos" : "La carpeta está vacía"}</h2>
              <p>{folderInfo?.can_write ? "Subí archivos para tenerlos disponibles acá." : "No hay archivos disponibles en esta carpeta."}</p>
            </div>
          )}

          {!loading && !error && !folderId && folders.length > 0 && (
            <div className={styles.folderGrid}>
              {folders.map((folder) => (
                <article className={styles.folderCard} key={folder.id}>
                  <button className={styles.folderOpen} type="button" onClick={() => openFolder(folder.id)}>
                    <span className={styles.folderIcon} aria-hidden="true">▰</span>
                    <strong title={folder.name}>{folder.name}</strong>
                  </button>
                  <span className={styles.folderDetails}>
                    {folder.file_count} {folder.file_count === 1 ? "archivo" : "archivos"} · {folder.public ? "Pública" : "Privada"}
                  </span>
                  <span className={styles.owner}>{folder.is_owner ? "Tu carpeta" : folder.owner_name || "Compartida"}</span>
                </article>
              ))}
            </div>
          )}

          {!loading && !error && folderId && files.length > 0 && (
            <div className={styles.fileList}>
              <div className={styles.fileHeader}><span>Nombre</span><span>Tipo</span><span>Tamaño</span><span>Acciones</span></div>
              {files.map((file) => (
                <article className={styles.fileRow} key={file.id}>
                  <button className={styles.fileName} type="button" onClick={() => openFile(file)}>
                    <span className={styles.fileIcon}>{fileGlyph(file.mime_type)}</span>
                    <span title={file.name}>{file.name}</span>
                  </button>
                  <span className={styles.fileType}>{file.mime_type}</span>
                  <span>{formatSize(file.size)}</span>
                  <div className={styles.fileActions}>
                    <button type="button" onClick={() => openFile(file)}>{canPreview(file.mime_type) ? "Abrir" : "Descargar"}</button>
                    {folderInfo?.can_write && <button type="button" className={styles.dangerText} onClick={() => deleteCurrentFile(file)}>Eliminar</button>}
                  </div>
                </article>
              ))}
            </div>
          )}

          {!loading && !error && pagination.total > PAGE_SIZE && (
            <nav className={styles.pagination} aria-label="Paginación">
              <button
                type="button"
                disabled={(folderId ? page : folderPage) <= 1}
                onClick={() => {
                  setLoading(true);
                  setError("");
                  folderId ? setPage((value) => value - 1) : setFolderPage((value) => value - 1);
                }}
              >Anterior</button>
              <span>Página {folderId ? page : folderPage} de {maxPages}</span>
              <button
                type="button"
                disabled={(folderId ? page : folderPage) >= maxPages}
                onClick={() => {
                  setLoading(true);
                  setError("");
                  folderId ? setPage((value) => value + 1) : setFolderPage((value) => value + 1);
                }}
              >Siguiente</button>
            </nav>
          )}
        </section>
      </main>

      {dialog && (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeDialog();
        }}>
          <form className={styles.modal} onSubmit={submitDialog} aria-labelledby="folder-dialog-title">
            <h2 id="folder-dialog-title">
              {dialog === "create" ? "Crear carpeta" : dialog === "rename" ? "Renombrar carpeta" : dialog === "unshare" ? "Revocar acceso" : "Compartir carpeta"}
            </h2>
            <label>
              {dialog === "share" || dialog === "unshare" ? "Nombre de usuario" : "Nombre"}
              <input
                autoFocus
                required
                maxLength={dialog === "share" || dialog === "unshare" ? 80 : 120}
                value={dialogValue}
                onChange={(event) => setDialogValue(event.target.value)}
                placeholder={dialog === "share" || dialog === "unshare" ? "usuario" : "Por ejemplo, Mis partituras"}
              />
            </label>
            {dialog === "share" && <p>La persona podrá ver y descargar archivos, pero no modificarlos.</p>}
            <div className={styles.modalActions}>
              <button type="button" onClick={closeDialog}>Cancelar</button>
              <button className={styles.primaryButton} type="submit">
                {dialog === "share" ? "Compartir" : dialog === "unshare" ? "Revocar" : "Guardar"}
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedFile && (
        <FileViewer
          file={selectedFile}
          url={viewerUrl}
          onClose={() => { setSelectedFile(null); setViewerUrl(""); }}
        />
      )}
    </div>
  );
}
