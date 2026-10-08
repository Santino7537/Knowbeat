import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar.jsx";
import styles from "./CSS/Folders.module.css";

const API_URL = "http://localhost:3000";

export default function Folders() {
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token = localStorage.getItem("token");

  const headers = {
    headers: { Authorization: `Bearer ${token}` },
  };

  const fetchFolders = async () => {
    try {
      setError("");
      const { data } = await axios.get(`${API_URL}/user/get/folders`, headers);
      setFolders(data || []);

      if (!selectedFolder && data?.length) {
        setSelectedFolder(data[0].name);
      }
    } catch (err) {
      console.error("Error al cargar carpetas:", err);
      setError(err.response?.data?.message || "No se pudieron cargar las carpetas.");
    }
  };

  const fetchFolderFiles = async (folderName) => {
    try {
      const { data } = await axios.get(
        `${API_URL}/user/get/folder/files/${encodeURIComponent(folderName)}`,
        headers
      );

      const fileList = Array.isArray(data) ? data : data?.fileURLs || [];
      setFiles(fileList);
    } catch (err) {
      console.error("Error al cargar archivos:", err);
      setFiles([]);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchFolders();
      setLoading(false);
    };

    init();
  }, []);

  useEffect(() => {
    if (selectedFolder) {
      fetchFolderFiles(selectedFolder);
    }
  }, [selectedFolder]);

  const handleCreateFolder = async (event) => {
    event.preventDefault();

    const name = newFolderName.trim();
    if (!name) {
      setError("Escribí un nombre para la carpeta.");
      return;
    }

    try {
      setCreating(true);
      setError("");
      setSuccess("");

      await axios.post(`${API_URL}/user/create/folder/${encodeURIComponent(name)}`, {}, headers);
      setNewFolderName("");
      await fetchFolders();
      setSelectedFolder(name);
      setSuccess("Carpeta creada correctamente.");
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo crear la carpeta.");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteFolder = async (folderName) => {
    if (!window.confirm(`¿Eliminar la carpeta "${folderName}"?`)) {
      return;
    }

    try {
      await axios.delete(
        `${API_URL}/user/delete/folder/${encodeURIComponent(folderName)}`,
        headers
      );

      const nextFolders = folders.filter((folder) => folder.name !== folderName);
      setFolders(nextFolders);

      if (selectedFolder === folderName) {
        setSelectedFolder(nextFolders[0]?.name || null);
      }

      setSuccess("Carpeta eliminada.");
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo eliminar la carpeta.");
    }
  };

  if (loading) {
    return (
      <div className={styles.layout}>
        <Sidebar />
        <main className={styles.main}>
          <p className={styles.loading}>Cargando carpetas…</p>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <Sidebar />

      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>ARCHIVOS</p>
            <h1>Mis carpetas</h1>
          </div>
        </header>

        <form className={styles.createForm} onSubmit={handleCreateFolder}>
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Nueva carpeta"
            aria-label="Nombre de la carpeta"
          />
          <button type="submit" disabled={creating}>
            {creating ? "Creando..." : "Crear carpeta"}
          </button>
        </form>

        {error && <p className={styles.error}>{error}</p>}
        {success && <p className={styles.success}>{success}</p>}

        <div className={styles.content}>
          <section className={styles.listSection}>
            {folders.length === 0 ? (
              <div className={styles.emptyState}>
                <p>Aún no tenés carpetas.</p>
              </div>
            ) : (
              <div className={styles.folderList}>
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    type="button"
                    className={`${styles.folderCard} ${selectedFolder === folder.name ? styles.active : ""}`}
                    onClick={() => setSelectedFolder(folder.name)}
                  >
                    <div>
                      <strong>{folder.name}</strong>
                      <span>{folder.filesCount || 0} archivos</span>
                    </div>
                    <span className={styles.visibility}>{folder.public ? "Pública" : "Privada"}</span>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className={styles.detailsSection}>
            {selectedFolder ? (
              <>
                <div className={styles.detailHeader}>
                  <div>
                    <p className={styles.eyebrow}>CARPETA</p>
                    <h2>{selectedFolder}</h2>
                  </div>
                  <button
                    type="button"
                    className={styles.deleteButton}
                    onClick={() => handleDeleteFolder(selectedFolder)}
                  >
                    Eliminar
                  </button>
                </div>

                {files.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>Esta carpeta todavía no tiene archivos.</p>
                  </div>
                ) : (
                  <ul className={styles.fileList}>
                    {files.map((file, index) => (
                      <li key={`${file}-${index}`}>
                        <a href={file} target="_blank" rel="noreferrer">
                          Archivo {index + 1}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <div className={styles.emptyState}>
                <p>Seleccioná una carpeta para ver su contenido.</p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
