import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import FileViewer from "../components/folders/FileViewer";
import { useToast } from "../context/ToastContext.jsx";
import { getErrorMessage } from "../api/client";
import { useLanguage } from "../context/LanguageContext.jsx"; // <-- Importar hook de idioma
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
  const { t } = useLanguage(); // <-- Consumir función de traducción
  const inputRef = useRef(null);

  const SCOPES = [
    { id: "mine", label: t("folders_page.scopes.mine") },
    { id: "public", label: t("folders_page.scopes.public") },
    { id: "shared", label: t("folders_page.scopes.shared") }
  ];

  const CATEGORIES = [
    { id: "", label: t("folders_page.categories.all") },
    { id: "documents", label: t("folders_page.categories.documents") },
    { id: "images", label: t("folders_page.categories.images") },
    { id: "audio", label: t("folders_page.categories.audio") },
    { id: "video", label: t("folders_page.categories.video") },
    { id: "other", label: t("folders_page.categories.other") }
  ];

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
      if (!cancelled) setError(getErrorMessage(requestError, t("folders_page.errors.load_failed")));
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [category, folderId, folderPage, page, query, reloadKey, scope, sortBy, t]);

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
        toast.success(t("folders_page.toasts.folder_created"));
      } else if (dialog === "rename") {
        await updateFolder(folderInfo.id, { name: dialogValue.trim() });
        toast.success(t("folders_page.toasts.folder_renamed"));
      } else if (dialog === "share") {
        await shareFolder(folderInfo.id, dialogValue.trim());
        toast.success(t("folders_page.toasts.folder_shared"));
      } else if (dialog === "unshare") {
        await unshareFolder(folderInfo.id, dialogValue.trim());
        toast.success(t("folders_page.toasts.folder_unshared"));
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
      toast.success(folderInfo.public ? t("folders_page.toasts.made_private") : t("folders_page.toasts.made_public"));
      refresh();
    } catch (requestError) {
      toast.error(getErrorMessage(requestError));
    }
  };

  const deleteCurrentFolder = async () => {
    if (!window.confirm(t("folders_page.confirm.delete_folder").replace("{name}", folderInfo.name))) return;
    try {
      await removeFolder(folderInfo.id);
      toast.success(t("folders_page.toasts.folder_deleted"));
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
      status: t("folders_page.upload.uploading_status"),
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
          item.id === job.id ? { ...item, progress: 100, status: t("folders_page.upload.ready_status") } : item
        ));
        toast.success(t("folders_page.toasts.upload_complete").replace("{name}", file.name));
        refresh();
      } catch (requestError) {
        const cancelled = requestError?.code === "ERR_CANCELED" || requestError?.name === "CanceledError";
        setUploads((current) => current.map((item) =>
          item.id === job.id
            ? { ...item, status: cancelled ? t("folders_page.upload.cancelled_status") : t("folders_page.upload.error_status") }
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
    if (!window.confirm(t("folders_page.confirm.delete_file").replace("{name}", file.name))) return;
    try {
      await removeFile(file.id, folderId);
      toast.success(t("folders_page.toasts.file_deleted"));
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
        <aside className={styles.filters} aria-label={t("folders_page.aria.filters")}>
          {!folderId ? (
            <>
              <p className={styles.filterHeading}>{t("folders_page.library_heading")}</p>
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
                <span>{t("folders_page.storage.used")}</span>
                <strong>{storageUsed == null ? "—" : formatSize(storageUsed)}</strong>
                <small>{t("folders_page.storage.no_quota")}</small>
              </div>
            </>
          ) : (
            <>
              <p className={styles.filterHeading}>{t("folders_page.file_type_heading")}</p>
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
                <button type="button" onClick={() => navigate("/folders")}>{t("folders_page.breadcrumbs.folders")}</button>
                {folderInfo && <><span>/</span><span>{folderInfo.name}</span></>}
              </div>
              <h1>{folderInfo?.name || SCOPES.find((item) => item.id === scope)?.label}</h1>
              <p>{folderInfo ? t("folders_page.header.folder_desc") : t("folders_page.header.main_desc")}</p>
            </div>
            <div className={styles.headerActions}>
              {!folderId && (
                <button className={styles.primaryButton} type="button" onClick={() => setDialog("create")}>
                  {t("folders_page.actions.new_folder")}
                </button>
              )}
              {folderInfo?.can_write && (
                <button className={styles.primaryButton} type="button" onClick={() => inputRef.current?.click()}>
                  {t("folders_page.actions.upload_files")}
                </button>
              )}
            </div>
          </header>

          <label className={styles.search}>
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={folderId ? t("folders_page.search.folder_placeholder") : t("folders_page.search.main_placeholder")}
            />
            {searchInput && (
              <button type="button" onClick={() => setSearchInput("")} aria-label={t("folders_page.search.clear_aria")}>
                ×
              </button>
            )}
          </label>

          {folderInfo && (
            <div className={styles.folderMeta}>
              <span>
                {folderInfo.public ? t("folders_page.meta.public") : t("folders_page.meta.private")} · {folderInfo.owner_name || t("folders_page.meta.owner")}
              </span>
              {folderInfo.can_write && (
                <div className={styles.folderActions}>
                  <button type="button" onClick={() => { setDialogValue(folderInfo.name); setDialog("rename"); }}>
                    {t("folders_page.meta.rename")}
                  </button>
                  <button type="button" onClick={toggleVisibility}>
                    {folderInfo.public ? t("folders_page.meta.make_private") : t("folders_page.meta.make_public")}
                  </button>
                  <button type="button" onClick={() => setDialog("share")}>{t("folders_page.meta.share")}</button>
                  <button type="button" onClick={() => setDialog("unshare")}>{t("folders_page.meta.revoke")}</button>
                  <button type="button" className={styles.dangerText} onClick={deleteCurrentFolder}>
                    {t("folders_page.meta.delete_folder")}
                  </button>
                </div>
              )}
            </div>
          )}

          {folderInfo && (
            <div className={styles.fileToolbar}>
              <span>{pagination.total} {pagination.total === 1 ? t("folders_page.toolbar.file_singular") : t("folders_page.toolbar.file_plural")}</span>
              <label>
                {t("folders_page.toolbar.sort_label")}
                <select
                  value={sortBy}
                  onChange={(event) => {
                    setLoading(true);
                    setError("");
                    setSortBy(event.target.value);
                    setPage(1);
                  }}
                >
                  <option value="name">{t("folders_page.toolbar.sort_name")}</option>
                  <option value="size">{t("folders_page.toolbar.sort_size")}</option>
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
              {t("folders_page.dropzone.text_prefix")}{" "}
              <button type="button" onClick={() => inputRef.current?.click()}>
                {t("folders_page.dropzone.select_btn")}
              </button>
              <span>{t("folders_page.dropzone.limit")}</span>
            </div>
          )}

          {uploads.length > 0 && (
            <div className={styles.uploadQueue} aria-live="polite">
              {uploads.map((upload) => (
                <div className={styles.uploadItem} key={upload.id}>
                  <span title={upload.name}>{upload.name}</span>
                  <progress value={upload.progress} max="100" />
                  <small>{upload.status === t("folders_page.upload.uploading_status") ? `${upload.progress}%` : upload.status}</small>
                  {upload.status === t("folders_page.upload.uploading_status") && (
                    <button type="button" onClick={() => cancelUpload(upload.id)}>
                      {t("folders_page.upload.cancel_btn")}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className={styles.stateMessage} role="alert">
              <p>{error}</p>
              <button type="button" onClick={refresh}>{t("folders_page.states.retry")}</button>
            </div>
          )}
          {loading && <div className={styles.stateMessage}>{t("folders_page.states.loading")}</div>}
          {!loading && !error && !folderId && folders.length === 0 && (
            <div className={styles.empty}>
              <span aria-hidden="true">▰</span>
              <h2>{query ? t("folders_page.empty.no_folders_query") : t("folders_page.empty.no_folders")}</h2>
              <p>{query ? t("folders_page.empty.try_other") : t("folders_page.empty.create_prompt")}</p>
              {scope === "mine" && !query && (
                <button className={styles.primaryButton} type="button" onClick={() => setDialog("create")}>
                  {t("folders_page.actions.new_folder")}
                </button>
              )}
            </div>
          )}
          {!loading && !error && folderId && files.length === 0 && (
            <div className={styles.empty}>
              <span aria-hidden="true">▱</span>
              <h2>{query || category ? t("folders_page.empty.no_files_query") : t("folders_page.empty.folder_empty")}</h2>
              <p>{folderInfo?.can_write ? t("folders_page.empty.upload_prompt") : t("folders_page.empty.no_access")}</p>
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
                    {folder.file_count} {folder.file_count === 1 ? t("folders_page.toolbar.file_singular") : t("folders_page.toolbar.file_plural")} · {folder.public ? t("folders_page.meta.public") : t("folders_page.meta.private")}
                  </span>
                  <span className={styles.owner}>
                    {folder.is_owner ? t("folders_page.folder_card.your_folder") : folder.owner_name || t("folders_page.folder_card.shared")}
                  </span>
                </article>
              ))}
            </div>
          )}

          {!loading && !error && folderId && files.length > 0 && (
            <div className={styles.fileList}>
              <div className={styles.fileHeader}>
                <span>{t("folders_page.file_list.name")}</span>
                <span>{t("folders_page.file_list.type")}</span>
                <span>{t("folders_page.file_list.size")}</span>
                <span>{t("folders_page.file_list.actions")}</span>
              </div>
              {files.map((file) => (
                <article className={styles.fileRow} key={file.id}>
                  <button className={styles.fileName} type="button" onClick={() => openFile(file)}>
                    <span className={styles.fileIcon}>{fileGlyph(file.mime_type)}</span>
                    <span title={file.name}>{file.name}</span>
                  </button>
                  <span className={styles.fileType}>{file.mime_type}</span>
                  <span>{formatSize(file.size)}</span>
                  <div className={styles.fileActions}>
                    <button type="button" onClick={() => openFile(file)}>
                      {canPreview(file.mime_type) ? t("folders_page.file_list.open") : t("folders_page.file_list.download")}
                    </button>
                    {folderInfo?.can_write && (
                      <button type="button" className={styles.dangerText} onClick={() => deleteCurrentFile(file)}>
                        {t("folders_page.file_list.delete")}
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}

          {!loading && !error && pagination.total > PAGE_SIZE && (
            <nav className={styles.pagination} aria-label={t("folders_page.aria.pagination")}>
              <button
                type="button"
                disabled={(folderId ? page : folderPage) <= 1}
                onClick={() => {
                  setLoading(true);
                  setError("");
                  folderId ? setPage((value) => value - 1) : setFolderPage((value) => value - 1);
                }}
              >
                {t("folders_page.pagination.prev")}
              </button>
              <span>
                {t("folders_page.pagination.pages")
                  .replace("{current}", folderId ? page : folderPage)
                  .replace("{total}", maxPages)}
              </span>
              <button
                type="button"
                disabled={(folderId ? page : folderPage) >= maxPages}
                onClick={() => {
                  setLoading(true);
                  setError("");
                  folderId ? setPage((value) => value + 1) : setFolderPage((value) => value + 1);
                }}
              >
                {t("folders_page.pagination.next")}
              </button>
            </nav>
          )}
        </section>
      </main>

      {dialog && (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDialog();
          }}
        >
          <form className={styles.modal} onSubmit={submitDialog} aria-labelledby="folder-dialog-title">
            <h2 id="folder-dialog-title">
              {dialog === "create"
                ? t("folders_page.dialog.create_title")
                : dialog === "rename"
                ? t("folders_page.dialog.rename_title")
                : dialog === "unshare"
                ? t("folders_page.dialog.unshare_title")
                : t("folders_page.dialog.share_title")}
            </h2>
            <label>
              {dialog === "share" || dialog === "unshare"
                ? t("folders_page.dialog.username_label")
                : t("folders_page.dialog.name_label")}
              <input
                autoFocus
                required
                maxLength={dialog === "share" || dialog === "unshare" ? 80 : 120}
                value={dialogValue}
                onChange={(event) => setDialogValue(event.target.value)}
                placeholder={
                  dialog === "share" || dialog === "unshare"
                    ? t("folders_page.dialog.username_placeholder")
                    : t("folders_page.dialog.name_placeholder")
                }
              />
            </label>
            {dialog === "share" && <p>{t("folders_page.dialog.share_desc")}</p>}
            <div className={styles.modalActions}>
              <button type="button" onClick={closeDialog}>{t("folders_page.dialog.cancel_btn")}</button>
              <button className={styles.primaryButton} type="submit">
                {dialog === "share"
                  ? t("folders_page.dialog.share_btn")
                  : dialog === "unshare"
                  ? t("folders_page.dialog.revoke_btn")
                  : t("folders_page.dialog.save_btn")}
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