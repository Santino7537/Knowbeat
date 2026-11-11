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

## Password recovery

| Method and path | Purpose | Access |
|---|---|---|
| `POST /user/password/forgot` with `{ "username": "..." }` | Sends a 30-minute password-reset link to the account email | Public; returns 404 if the username does not exist and 429 if requested again within one minute |
| `POST /user/password/reset` with `{ "token": "...", "password": "..." }` | Changes the password and invalidates all reset links for that account | Public; token is single-use |

The login form asks only for the username. The protected `GET /user/get/user/username/:username` endpoint is not used for recovery because it requires a session and must not expose another user's email.

Email delivery uses the Brevo transactional email HTTPS API, avoiding SMTP ports that may time out on hosting platforms. Add these variables to the API service's environment in Render (or to `system/.env` for local development):

```env
BREVO_API_KEY=tu-api-key-de-brevo
EMAIL_FROM=correo-verificado@tudominio.com
EMAIL_FROM_NAME=KnowBeat
CLIENT_ORIGIN=http://localhost:5173
```

Create a Brevo account, generate an API key, and verify the sender address before sending. The free plan's quotas and sender/domain requirements are determined by Brevo and may change. Keep the API key private and do not commit it.

The MySQL initialization script `system/mysql/init/002-password-reset.sql` creates the token table on a fresh database. For an existing database, run that SQL once before using password recovery; initialization scripts are not rerun automatically for an existing MySQL data volume.
