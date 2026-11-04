# Files and folders API

All endpoints below require the existing bearer-token authentication and the matching role permission.

| Method and path | Purpose | Access |
|---|---|---|
| `GET /user/get/folders?scope=mine\|public\|shared\|all&page=1&limit=20&query=` | Paginated folders with owner, visibility, file count and the caller's used storage in MB | Authenticated user; only owned, public or explicitly shared folders are returned |
| `GET /user/get/folder/files/:folder_id?page=1&limit=20&query=&type=&sort=name\|size` | Paginated metadata for a folder's files | Owner, public visitor or `FolderPermission` recipient |
| `POST /user/create/folder/:folder_name` | Create a private folder | Owner |
| `PATCH /user/update/folder` with `{ "folder_id": "...", "name": "...", "isPublic": false }` | Rename or change visibility | Owner |
| `DELETE /user/delete/folder/:folder_id` | Delete folder contents and metadata | Owner |
| `POST /user/share/folder/:folder_id` with `{ "username": "..." }` | Grant read-only access | Owner |
| `DELETE /user/unshare/folder/:folder_id/:user_id` | Revoke shared access; the final segment accepts a user id or username | Owner |
| `POST /user/upload/file/:folder_id` (`folder_file`, one file per request) | Upload a validated file | Owner |
| `GET /user/get/file/:file_id/:folder_id` | Return a short-lived signed URL for inline viewing | Owner, public visitor or shared recipient |
| `GET /user/get/file/:file_id/:folder_id?download=1` | Return a short-lived signed URL for download | Owner, public visitor or shared recipient |
| `DELETE /user/delete/file/:file_id/:folder_id` | Delete file metadata and object | Owner |

`FolderPermission` grants read-only access; a public folder also grants read-only access. Neither grants upload, rename, visibility changes, sharing, or deletion rights. File access is verified through `FileRelation` and the folder on every URL request. The `user-files` MinIO bucket remains private; viewing URLs expire after five minutes, except audio/video URLs which expire after one hour to support longer streaming and seeking.

The existing MongoDB model uses `Folder` and `FileRelation` to connect a `File` to a folder. A `File` document intentionally retains its existing `name`, `size`, and `mime_type` fields. The object key is derived from the folder owner and IDs as `user_id/folder_id/file_id`; it is not the MongoDB file id alone. Upload is limited to 50 MB per file, with text files limited to 1 MB. Supported initial media includes MP4/WebM video and MP3/WAV/OGG audio. Inline video/audio playback uses MinIO's signed GET URL, allowing browser Range requests without downloading the full object first.
