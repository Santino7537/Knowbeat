# Directorio 'system'
El directorio 'system' contiene la totalidad del proyecto.

### Despliegue en Render

Los Dockerfiles individuales para desplegar la API, MySQL, MongoDB, MinIO y FFmpeg
en Render están en `render/`. Consulta `render/README.md` para configurar cada
servicio, las variables de entorno y el almacenamiento persistente. Render requiere
un servicio por imagen; esta configuración no reemplaza `docker-compose.yml` para
el despliegue local.

Los archivos y directorios importantes son:

### Directorio 'api'
El directorio 'api' contiene la totalidad del Backend.
La documentación de las rutas de archivos y carpetas está en `api/README.md`.
### Directorio 'client'
El directorio 'client' contiene la totalidad del Frontend.
### Directorio 'mongo/init'
El directorio 'mongo/init' contiene la totalidad de la configuración de la base de datos Mongo.
### Directorio 'mysql/init'
El directorio 'mysql/init' contiene la totalidad de la configuración de la base de datos MySQL.
### Directorio 'temp'
El directorio 'temp' contiene la totalidad de los volúmenes que tienen archivos temporales.
#### Directorio 'temp/ffmpeg'
El directorio 'temp/ffmpeg' contiene archivos temporales, los cuales pueden ser revisados por 'ffmpeg'.
### Archivo 'docker-compose.yml'
El archivo 'docker-compose.yml' contiene la configuración de todos los contenedores que se utilizan para el proyecto.
Para que Docker instale las imagenes necesarias, se debe ejecutar el comando `docker compose pull`.
Para que Docker cree e inicie todos los contenedores, se debe ejecutar el comando `docker compose up -d`.
Para que Docker elimine los contenedores, se debe ejecutar el comando `docker compose down`.
Para que Docker elimine los contenedores y volúmenes, se debe ejecutar el comando `docker compose down -v`.

### Worker nocturno de DVV

`docker compose up -d --build dvv-worker` inicia el worker independiente. Por defecto
se programa diariamente a las 02:00 de `America/Argentina/Buenos_Aires`; cambiar
`DVV_SCHEDULE_HOUR` y `DVV_SCHEDULE_MINUTE` en el archivo `.env` para configurar otra
hora local (por ejemplo, `12` y `2` para las 12:02). Luego recrear el worker con
`docker compose up -d --build --force-recreate dvv-worker` para aplicar la configuración.
Calcula el DVV de las tablas MySQL `User` y `Binnacle`. La colección `Binnacle` de
MongoDB no forma parte del proceso.

El worker escribe logs JSON en stdout/stderr, no en un archivo. Consultarlos con
`docker compose logs --tail=100 dvv-worker` o seguirlos con
`docker compose logs -f dvv-worker`. Si se modifica el código, reconstruirlo con
`docker compose up -d --build dvv-worker`; `docker compose up -d` puede reutilizar la
imagen ya construida. Al iniciar, el worker calcula la próxima hora programada; si
inicia después de la hora de ese día, la próxima ejecución será al día siguiente. El log
muestra `nextRunLocal` en la zona horaria configurada y `nextRunAtUtc` en UTC.

El worker abre una transacción InnoDB `REPEATABLE READ` con `WITH CONSISTENT
SNAPSHOT`, lee solo `id` y `dvh` en páginas ordenadas por clave primaria y publica
ambos resultados en una transacción breve. El DVV es CRC32 de los bytes de los DVH
concatenados en ese orden. El valor y `snapshot_at` se reemplazan juntos; `snapshot_at`
se almacena en UTC. El bloqueo asesor `GET_LOCK` evita ejecuciones simultáneas entre
instancias del worker.

La instantánea mantiene una transacción de lectura abierta durante el escaneo; InnoDB
debe conservar las versiones necesarias hasta que termine. El procesamiento paginado
limita la memoria del worker, pero no evita ese costo de undo. Los registros de la
bitácora siguen creciendo con el DVH actual; todas las páginas de una ejecución leen
la misma instantánea.

El esquema DVV se define en `mysql/init/001-tables.sql`. Los scripts de inicialización
de MySQL solo se ejecutan cuando se crea el volumen de datos; para una base ya
inicializada con el esquema anterior, actualizar ese archivo no altera la tabla
existente. En ese caso hay que actualizar `DVV` antes de iniciar el worker. Si no hay
datos que conservar, se puede recrear únicamente el volumen MySQL para que corra la
inicialización desde cero. El worker valida el esquema al arrancar y falla
explícitamente si `snapshot_at` o el índice único por `table_name` no existen.
Si el contenedor termina al arrancar, revisar sus logs: entre las causas posibles está
un volumen MySQL inicializado antes de actualizar la tabla `DVV`.

### Backups y restores

`docker compose up -d --build backup-worker` construye e inicia el worker. Cada domingo
a las 03:00 de `America/Argentina/Buenos_Aires` guarda en el volumen Docker `backup_data`
una copia de la base MySQL, la base MongoDB y los buckets de MinIO. Conserva los 8
backups completos más recientes. Se puede ajustar el día (`BACKUP_DAY_OF_WEEK`, de
`0` domingo a `6` sábado), la hora (`BACKUP_SCHEDULE_HOUR`), los minutos
(`BACKUP_SCHEDULE_MINUTE`) y la retención (`BACKUP_RETENTION_WEEKS`) en `.env`; luego
recrear el worker para aplicar los cambios. Un backup iniciado después del horario
semanal espera hasta la semana siguiente.
El worker reutiliza las variables existentes del `.env`. MongoDB y MinIO usan sus
endpoints internos de Compose (`mongo:27017` y `http://minio:9000`), ya que los valores
`localhost` y los puertos publicados en `.env` son para conexiones desde el host. MySQL
usa el socket local de `root` compartido entre los dos contenedores: el usuario de
aplicación definido en `.env` no tiene permisos suficientes para un backup completo.

El worker escribe logs JSON en stdout/stderr. Consultarlos con
`docker compose logs --tail=100 backup-worker` o seguirlos con
`docker compose logs -f backup-worker`. Cada backup terminado incluye un manifiesto con
checksums SHA-256; los backups incompletos no se publican ni reemplazan los anteriores.
La retención elimina copias viejas solo después de completar una nueva.
MinIO respalda los objetos actuales de cada bucket, no el historial de versiones ni la
configuración avanzada del bucket; al restaurar se restablece el acceso público de
`profiles`, `courses` y `posts`, y se dejan privados los demás.

Para listar los puntos disponibles:

```sh
docker compose run --rm backup-worker list
```

Para restaurar uno, primero detener manualmente la API y confirmar que el ID elegido es
el correcto. El restore valida el manifiesto y los checksums, y exige el flag explícito
`--confirm-replace`:

```sh
docker compose run --rm backup-worker restore 2026-11-08T06-00-00-000Z --confirm-replace
```

El restore elimina y recrea las bases MySQL y MongoDB configuradas, y reemplaza los
buckets de MinIO. No genera una copia previa del estado actual; si una etapa falla, la
restauración puede quedar parcial y no hay rollback automático. El backup se hace con
la aplicación activa: cada servicio se respalda de forma consistente por separado, pero
los tres respaldos podrían reflejar instantes distintos. Los archivos no están cifrados.

`backup_data` es un volumen local del host, no una copia externa. Un fallo o pérdida del
host puede destruir tanto los datos como sus backups; copiar periódicamente el volumen
a otro medio/servidor y restringir el acceso al host es responsabilidad del operador.
`docker compose down -v` también elimina este volumen.

### Reportes y sanciones de usuarios

La API usa consultas `mysql2` directas; no hay modelos Sequelize ni un ejecutor de
migraciones. Antes de desplegar reportes y sanciones, respaldar la base y comprobar en
MySQL Workbench:

```sql
USE knowbeat;
SHOW CREATE TABLE `User`;
SHOW CREATE TABLE `Report`;
```

`User.id` y `Report.id` deben ser `INT UNSIGNED`. Si `Report` no existe, la migración
crea la tabla con el esquema indicado en la especificación de moderación. Si ya existe,
`CREATE TABLE IF NOT EXISTS` no la altera: verificar que tenga los campos que consume
la API (`reporter_id`, `reported_id`, `reviser_id`, `status`, `reason`, `description`,
`admin_comment`, `date` y `review_date`) antes de continuar.

Ejecutar manualmente `mysql/migrations/20261104-moderation.sql` sobre la base
configurada en la API; el archivo selecciona `knowbeat`, así que ajustar esa línea si el
nombre real es distinto. Después reiniciar la API. Esta migración agrega `UserSanction`
sin alterar usuarios ni cambiar el historial existente de reportes. La tabla almacena
cada sanción, su comentario, su fecha de expiración o su indicador explícito de
permanencia, además de las revocaciones. No se debe ejecutar de nuevo sobre un esquema
incompatible ni borrar tablas para resolver errores.

Los reportes nuevos usan `PENDING`, `RESOLVED` y `REJECTED`; `ACCEPTED` se conserva
solo para mostrar registros antiguos. Las sanciones temporales guardan también la fecha
en `User.penalty_date`; las permanentes se identifican en `UserSanction`, sin fechas
mágicas. Una sanción temporal vence al llegar `expires_at` en UTC. El backend consulta
esa tabla en el login, en cada solicitud JWT y en cada acción Socket.IO de chat; al
aplicarse una sanción también desconecta los sockets activos locales. El motivo visible
al usuario se toma de la sanción vigente, no del reporte más reciente.
El archivo `mysql/migrations/20261104-moderation-down.sql` revierte solo la tabla nueva
`UserSanction`; exportar su historial antes de ejecutarlo. Intencionalmente no elimina
`Report`, que puede contener datos existentes.

El endpoint de reportes limita cada cuenta a cinco envíos por hora y rechaza duplicados
pendientes contra el mismo usuario. Solo una cuenta con rol `Administrator` y
autorización administrativa vigente puede revisar o revocar sanciones. No se permite
sancionar cuentas administradoras.

La migración debe aplicarse antes de iniciar la versión nueva de la API. El repositorio
no contiene el esquema real que se creó manualmente en Workbench, por lo que la
validación de compatibilidad y las pruebas integrales contra esa base deben hacerse en
el entorno de desarrollo antes de usarla con datos reales.
