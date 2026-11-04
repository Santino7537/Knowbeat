# Directorio 'system'
El directorio 'system' contiene la totalidad del proyecto.
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

### Demo pública temporal con Cloudflare Quick Tunnel

Esta alternativa sirve para mostrar la aplicación por unos minutos desde una PC
encendida. Cualquier persona con la URL temporal puede acceder desde Internet. No es
un alojamiento permanente: la URL deja de funcionar al detener el túnel y puede cambiar
al crear uno nuevo. Usar solo datos de prueba.

El cliente Vite reenvía las rutas de API, Socket.IO y MinIO localmente. Solo el puerto
del cliente queda publicado por el túnel; los puertos de bases de datos y MinIO están
limitados a `127.0.0.1` en el host.

1. Abrir Docker Desktop y, desde PowerShell, iniciar las dependencias desde `system`:

   ```powershell
   docker compose up -d mysql mongo minio minio-init ffmpeg
   docker compose ps
   ```

   Esperar a que MySQL y MongoDB terminen su inicialización. La primera descarga de
   imágenes puede tardar.
2. En una segunda terminal, iniciar el cliente:

   ```powershell
   cd system\client
   npm run dev
   ```

3. Instalar `cloudflared` desde
   [la documentación oficial](https://developers.cloudflare.com/tunnel/downloads/) si
   todavía no está instalado. En una tercera terminal, crear el Quick Tunnel:

   ```powershell
   cloudflared tunnel --url http://127.0.0.1:5173
   ```

   Copiar la dirección `https://....trycloudflare.com` que muestra el comando.
4. En una cuarta terminal, iniciar el API y configurar para esta sesión la dirección
   pública que acabás de copiar. Reemplazar el ejemplo por la URL exacta del túnel:

   ```powershell
   cd system\api
   $publicUrl = 'https://REEMPLAZAR.trycloudflare.com'
   $env:CLIENT_URL = $publicUrl
   $env:MINIO_PUBLIC_ENDPOINT = $publicUrl
   $env:MINIO_PUBLIC_URL = $publicUrl
   npm start
   ```

   El API reutiliza las credenciales locales de `system\.env`; no copiar ni compartir ese
   archivo. Dejar abiertas las cuatro terminales mientras se use la demo.
5. Compartir la URL de Quick Tunnel. Probar registro/login, cargar una imagen o archivo
   y, si corresponde, el chat. La computadora y la conexión a Internet deben seguir
   activas.

Para terminar, detener `cloudflared`, Vite y el API con `Ctrl+C`; luego se pueden parar
los contenedores conservando sus datos:

```powershell
cd system
docker compose down
```

No usar `docker compose down -v`: eso elimina los volúmenes de bases, MinIO y backups.
Al iniciar otro Quick Tunnel, la URL puede ser distinta; volver a configurar
`CLIENT_URL`, `MINIO_PUBLIC_ENDPOINT` y `MINIO_PUBLIC_URL` para esa sesión.
