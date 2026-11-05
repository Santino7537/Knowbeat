import api from "./client";

export async function listFolders(params) {
  const { data } = await api.get("/user/get/folders", { params });
  return data;
}

export async function listFolderFiles(folderId, params) {
  const { data } = await api.get(`/user/get/folder/files/${encodeURIComponent(folderId)}`, { params });
  return data;
}

export async function createFolder(name) {
  const { data } = await api.post(`/user/create/folder/${encodeURIComponent(name)}`);
  return data;
}

export async function updateFolder(folderId, changes) {
  const { data } = await api.patch("/user/update/folder", { folder_id: folderId, ...changes });
  return data;
}

export async function removeFolder(folderId) {
  const { data } = await api.delete(`/user/delete/folder/${encodeURIComponent(folderId)}`);
  return data;
}

export async function shareFolder(folderId, username) {
  const { data } = await api.post(`/user/share/folder/${encodeURIComponent(folderId)}`, { username });
  return data;
}

export async function unshareFolder(folderId, username) {
  const { data } = await api.delete(
    `/user/unshare/folder/${encodeURIComponent(folderId)}/${encodeURIComponent(username)}`
  );
  return data;
}

export async function uploadFile(folderId, file, { signal, onProgress }) {
  const body = new FormData();
  body.append("folder_file", file);
  const { data } = await api.post(
    `/user/upload/file/${encodeURIComponent(folderId)}`,
    body,
    {
      signal,
      onUploadProgress: (event) => {
        if (event.total) onProgress(Math.round((event.loaded / event.total) * 100));
      }
    }
  );
  return data;
}

export async function removeFile(fileId, folderId) {
  const { data } = await api.delete(
    `/user/delete/file/${encodeURIComponent(fileId)}/${encodeURIComponent(folderId)}`
  );
  return data;
}

export async function getFileUrl(fileId, folderId, download = false) {
  const { data } = await api.get(
    `/user/get/file/${encodeURIComponent(fileId)}/${encodeURIComponent(folderId)}`,
    { params: download ? { download: 1 } : undefined }
  );
  return data.fileUrl;
}
