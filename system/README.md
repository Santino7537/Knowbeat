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
