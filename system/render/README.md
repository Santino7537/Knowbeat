# Dockerfiles para Render

Render no despliega `docker-compose.yml`: cada servicio debe crearse por separado
como un servicio Docker. En la configuración de cada servicio, usa:

- **Root Directory:** `system`
- **Dockerfile Path:** la ruta indicada en la tabla

| Servicio | Dockerfile Path | Observaciones |
|---|---|---|
| API | `render/api/Dockerfile` | Instala `ffmpeg`/`ffprobe` en la misma imagen de la API. |
| MySQL | `render/mysql/Dockerfile` | Incluye los scripts de `mysql/init`. |
| MongoDB | `render/mongo/Dockerfile` | Incluye los scripts de `mongo/init`. |
| MinIO | `render/minio/Dockerfile` | Inicia el servidor y su consola. |
| FFmpeg | `render/ffmpeg/Dockerfile` | Imagen de utilidad para ejecutar `ffprobe`; no desplegar como servicio independiente de la API. |

## Conexiones y variables

Configura MySQL y MongoDB como servicios privados y conecta la API a sus hosts
internos. No uses `localhost` ni los puertos publicados por Docker Compose. La API
también necesita `CLIENT_ORIGIN` con el origen exacto del cliente web desplegado
(por ejemplo, `https://knowbeat.example.com`) para permitir sus solicitudes CORS.

- API: `SQL_DATABASE_HOST`, `SQL_DATABASE_PORT`, `SQL_DATABASE_NAME`,
  `SQL_BACKEND_USER`, `SQL_BACKEND_PASSWORD`, `MONGO_DATABASE_HOST`,
  `MONGO_DATABASE_PORT`, `MONGO_DATABASE_NAME`, `MONGO_BACKEND_USER`,
  `MONGO_BACKEND_PASSWORD`, `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`,
  `MINIO_SECRET_KEY`, `MINIO_PUBLIC_URL`, `CLIENT_ORIGIN`, `ADMIN_USERNAME`,
  `ADMIN_EMAIL`, `ADMIN_PASSWORD` y `SECRET`.
- MySQL: `MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE`, `SQL_BACKEND_USER` y
  `SQL_BACKEND_PASSWORD`.
- MongoDB: `MONGO_INITDB_DATABASE`, `MONGO_INITDB_ROOT_USERNAME`,
  `MONGO_INITDB_ROOT_PASSWORD`, `MONGO_BACKEND_USER` y `MONGO_BACKEND_PASSWORD`.
- MinIO: `MINIO_ROOT_USER` y `MINIO_ROOT_PASSWORD`. Haz coincidir las credenciales
  con `MINIO_ACCESS_KEY` y `MINIO_SECRET_KEY` de la API.

La API escucha en `PORT`, que Render proporciona automáticamente. Configura los
puertos internos de MySQL (`3306`) y MongoDB (`27017`). MinIO usa `9000` para S3 y
`9001` para la consola. La API firma URLs de objetos que consume el navegador, así
que `MINIO_ENDPOINT` debe ser accesible desde el cliente web, no solo desde la red
privada de Render. Configura `MINIO_PUBLIC_URL` con la URL pública base para los
objetos de los buckets públicos. Protege las credenciales y evita exponer la consola
de administración de MinIO públicamente.

Los discos de los servicios deben persistir en `/var/lib/mysql` para MySQL,
`/data/db` para MongoDB y `/data` para MinIO. Sin discos persistentes, los datos
pueden perderse al reiniciar o volver a desplegar el servicio. Los scripts de
inicialización de MySQL y MongoDB se ejecutan solamente al inicializar un directorio
de datos vacío.

## FFmpeg y archivos temporales

La API valida audio y video invocando `ffprobe` directamente. Por eso, su Dockerfile
instala FFmpeg y no necesita conectarse a un contenedor FFmpeg separado ni compartir
un volumen con él. El Dockerfile independiente de FFmpeg queda disponible para
ejecuciones puntuales de esa herramienta, no como servicio web o worker permanente.

Los archivos que la API guarda temporalmente durante una solicitud están en
`/app/system/temp/ffmpeg` dentro del contenedor y no necesitan persistencia.

## Límites de esta configuración

Estos Dockerfiles construyen imágenes para cada servicio, pero no reemplazan las
funciones de Compose como la creación de red, el orden de arranque, los volúmenes o
`minio-init`. Configura discos, variables y hosts en Render. Crea los buckets de
MinIO (`profiles`, `courses`, `posts`, `chat-files` y `user-files`) por separado y
configura sus políticas como en el entorno local.
