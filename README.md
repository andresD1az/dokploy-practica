# Práctica de administración de infraestructura con Dokploy

**Autor:** Eyner Andrés Díaz Díaz  
**Institución:** Universidad del Quindío  
**Programa:** Ingeniería de Sistemas y Computación  
**Curso:** Administración de Infraestructura TI

Laboratorio realizado en Ubuntu 26.04.1, dentro de VirtualBox, con Dokploy 0.30.10 y Docker. Las direcciones siguientes pertenecen a la red local del laboratorio.

## Aplicación

Aplicación Express sobre Node.js 22, construida con el Dockerfile del repositorio.

| Ruta | Función |
| --- | --- |
| / | Metadatos y mensaje para comprobar el despliegue automático |
| /health | Estado y tiempo de actividad |
| /info | Versión de Node.js y datos del sistema |
| /db | Comprobación de MySQL |
| /db-postgres | Comprobación de PostgreSQL |
| /cache | PING y escritura/lectura temporal en Redis |

Los clientes de las bases de datos usan variables de entorno. Copiar los nombres de `.env.example` y completar los valores en **Environment** de Dokploy. Mantener las contraseñas fuera del repositorio.

El despliegue independiente se conecta a MySQL, PostgreSQL y Redis administrados como servicios separados de Dokploy. Es distinto del stack Compose.

## Direcciones del laboratorio

| Servicio | URL |
| --- | --- |
| Aplicación independiente | http://webapp-uq.192-168-1-34.sslip.io/ |
| Dokploy | http://192.168.1.34:3000 |
| Aplicación Compose | http://192.168.1.34:3001 |
| phpMyAdmin del stack | http://192.168.1.34:8080 |
| Consola RustFS | http://192.168.1.34:9001 |
| Buzón Mailpit | http://192.168.1.34:8025 |

Estas direcciones requieren acceso a la LAN del laboratorio. HTTP corresponde a esta práctica local; no se configuró HTTPS público.

## Stack Docker Compose

`docker-compose.yml` reproduce la configuración del stack **stack-uni-quindio**:

- Aplicación Node.js y MySQL en la red bridge `compose-net`.
- MongoDB disponible en esa misma red.
- phpMyAdmin conectado al servicio MySQL.
- Volúmenes nombrados `mysql-data` y `mongo-data`.
- Montaje de carpeta `../files/app-data:/app/data`, siguiendo la ubicación utilizada en Dokploy.

En Dokploy se usó el tipo **Docker Compose**, proveedor **Raw**. El archivo se guarda también aquí como parte de la entrega.

Para ejecutarlo por separado, en una máquina sin esos puertos ocupados:

1. Copiar `.env.example` a `.env`.
2. Completar `MYSQL_ROOT_PASSWORD`, `MYSQL_PASSWORD` y `MONGO_ROOT_PASSWORD`.
3. Ejecutar:

```bash
docker compose up -d --build
```

El build usa la rama `main` del repositorio remoto. No requiere publicar los puertos de las bases de datos. Los puertos 3001 y 8080 deben estar disponibles.

En el stack, la ruta `/db` usa la base `compose_db`. PostgreSQL y Redis se configuraron en el despliegue independiente, no en este Compose. MongoDB se comprobó con `mongosh`; la aplicación no implementa una ruta HTTP para MongoDB.

## Persistencia comprobada

Antes de recrear los contenedores se insertaron registros en:

- MySQL: `compose_db.evidencias`, id 1, mensaje "Datos persistentes de la practica Dokploy".
- MongoDB: `compose_db.evidencias`, _id 1, mensaje "Datos persistentes de MongoDB".

Se ejecutó `docker compose up -d --force-recreate --no-build` usando el archivo, directorio y nombre de proyecto originales de Dokploy. Después se consultaron ambas bases y los registros conservaron sus mensajes y fechas.

El montaje `/app/data` está configurado, pero no se hizo una prueba de escritura desde la aplicación en esa carpeta.

## Monitoreo

Se revisaron métricas y registros en Dokploy. Una lectura posterior con `docker stats --no-stream` registró:

| Servicio | CPU | Memoria |
| --- | --- | --- |
| Aplicación independiente | 0.00 % | 22.95 MiB |
| MySQL independiente | 0.50 % | 332.4 MiB |
| PostgreSQL independiente | 0.00 % | 24.16 MiB |
| Redis independiente | 0.29 % | 5.125 MiB |
| Aplicación Compose | 0.00 % | 19.43 MiB |
| MySQL Compose | 0.47 % | 312.7 MiB |
| MongoDB Compose | 0.43 % | 77.71 MiB |
| phpMyAdmin | 0.00 % | 23.96 MiB |

Son lecturas puntuales, sin una prueba de carga; no representan promedios ni capacidad máxima.

## Respaldos y notificaciones

- Destino S3 compatible: **RustFS-Local-Quindio**, conectado al endpoint local de RustFS.
- Bucket privado: `dokploy-backups`.
- Base respaldada: `uni_quindio_db`, del servicio **db-uni-quindio**.
- Programación activa: `0 7 * * *` — 07:00 UTC, equivalente a 02:00 en Colombia.
- Retención: últimas 7 copias.
- Prefijo configurado: `uni-quindio/mysql`.
- Se ejecutaron respaldos manuales y se comprobaron archivos `.sql.gz` en RustFS.
- Dokploy informó una restauración exitosa en `uni_quindio_restore`. Se seleccionó una copia anterior a la inserción del registro de prueba; no se verificó recuperación de ese registro.
- Se recibió en Mailpit una notificación de respaldo exitoso para **db-uni-quindio**.

RustFS y Mailpit están en el mismo equipo del laboratorio. El respaldo local no protege frente a la pérdida de ese equipo. Mailpit demuestra recepción SMTP local; no se probó entrega a un proveedor de correo externo. No se documentaron pruebas de respaldo de PostgreSQL o Redis.

## Despliegue automático

Archivo: `.github/workflows/dokploy-deploy.yml`.

Un push a `main` ejecuta el job en el runner Linux local. El job solicita el despliegue mediante la API de Dokploy. No hace checkout ni ejecuta código de pull requests.

Los secretos de Actions son:

- `DOKPLOY_URL`: dirección del panel accesible desde el runner.
- `DOKPLOY_API_KEY`: clave de API generada en Dokploy.

Se comprobó el recorrido completo: cambio de código en GitHub, ejecución exitosa del workflow, construcción de la imagen y aparición del mensaje "¡Despliegue automático desde GitHub funcionando!" en la aplicación.

Un resultado exitoso de Actions indica que la API aceptó la solicitud; el resultado del build se consulta en **Deployments**. El runner debe estar activo para atender nuevos trabajos. Se inició manualmente con `./run.sh`; Ctrl+C lo detiene.

El runner se usa para este laboratorio. GitHub advierte sobre ejecutores propios en repositorios públicos; al terminar la práctica se puede retirar el registro del runner y revocar la clave temporal de Dokploy.

Los commits de documentación de esta entrega llevan `[skip ci]` para evitar reconstrucciones sin cambios de aplicación.

## Adaptación y problema resuelto

El intento inicial con Nixpacks falló al preparar su entorno Nix. Se cambió a un Dockerfile con Node.js 22 Alpine y `npm ci --omit=dev`; la construcción y ejecución posteriores funcionaron.

Se mantuvieron las rutas de salud e integración al comprobar el despliegue automático. La versión sigue en 1.0.0 porque la prueba cambió el mensaje, no la variable `APP_VERSION`.
