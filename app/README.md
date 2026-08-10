# Control Servicio

Aplicación web interna para autenticación por roles, administración de usuarios, tableros de indicadores,
carga de facturación y proyección de seguimiento a clientes por asesor.

## Stack

- **Backend**: Node.js + TypeScript + Express + Prisma ORM + PostgreSQL
- **Frontend**: React + TypeScript + Vite + MUI (Material UI)

## Requisitos

- Node.js 20+
- PostgreSQL (en este equipo ya está instalado como servicio de Windows `postgresql-x64-17`,
  escuchando en `localhost:5432`)

## Estructura

```
app/
  backend/   API REST (puerto 4000)
  frontend/  SPA de React (puerto 5173)
```

## Puesta en marcha

### 1. Base de datos

Ya se creó la base de datos `control_servicio` y el rol `control_servicio_user` (password `changeme`,
solo para desarrollo local — cámbiela antes de cualquier despliegue). Si necesita recrearlos:

```sql
CREATE ROLE control_servicio_user LOGIN PASSWORD 'changeme' CREATEDB;
CREATE DATABASE control_servicio OWNER control_servicio_user;
```

### 2. Backend

```bash
cd app/backend
npm install
npx prisma migrate dev   # aplica el esquema (ya aplicado en este entorno)
npx tsx prisma/seed.ts   # crea el usuario Administrador inicial (ya ejecutado)
npm run dev              # http://localhost:4000
```

Variables de entorno en `app/backend/.env` (ver `.env.example`). El seed crea el usuario:

- **Documento (usuario):** `admin`
- **Contraseña:** `Admin123!`

Cambie esta contraseña desde la aplicación (menú de usuario → "Cambiar contraseña") después del primer
ingreso.

### 3. Frontend

```bash
cd app/frontend
npm install
npm run dev   # http://localhost:5173
```

Variable de entorno en `app/frontend/.env` (ver `.env.example`): `VITE_API_URL`.

## Roles

| Rol | Acceso |
|---|---|
| Administrador | Sin restricciones: usuarios, auditoría, facturación (carga + parametrización), tablero, proyección de seguimiento (todos los clientes) |
| Asesor | Tablero de indicadores y Proyección de seguimiento (restringida a los clientes cuya última factura le pertenece a él, por PSSR). Sin acceso a Usuarios ni a Facturación |
| Consulta | Solo consulta al Tablero de indicadores. Sin acceso a Usuarios, Facturación ni Proyección |

Las restricciones se aplican tanto en el frontend (rutas protegidas / sidebar) como en el backend (cada
router valida el rol en el middleware), así que no basta con ocultar el enlace: la API rechaza con 403
cualquier llamado fuera del alcance del rol.

## Módulos

1. **Usuarios**: CRUD + inactivación (soft delete) + auditoría de creación/edición/inactivación/login. Al
   crear (o editar) un usuario con rol Asesor, se registra/vincula automáticamente en el **maestro de
   Asesores** (`GET /api/asesores`) — la fuente única de nombres usada por los filtros de asesor del
   Tablero y de Proyección. Ese maestro también se puebla solo con cualquier PSSR nuevo que aparezca al
   importar Facturación (sin cuenta de usuario vinculada, hasta que alguien cree el usuario correspondiente).
2. **Tablero**: KPIs (venta neta, margen, # facturas, top asesores) y gráficos gerenciales, filtrables
   dinámicamente por año, mes y **asesor** (los tres como botones; el de mes solo se habilita tras elegir
   un año), usando `@mui/x-charts`:
   - **Facturación**: venta neta por período (por mes si hay año elegido, por año si no — el gráfico de
     tendencia ignora el filtro de mes a propósito), por tipo de facturación, por marca, y top asesores.
   - **Seguimientos de asesores**: % de cumplimiento global y por asesor, conteo de realizados/pendientes/
     vencidos, y su distribución. Se calcula sobre el mismo universo (cliente, tipo de facturación) del
     módulo de Proyección — un seguimiento "vencido" es uno pendiente cuya fecha de próximo seguimiento
     proyectada ya pasó.
3. **Facturación**: carga del Excel de ventas (hoja `Ingresos`, mismas 39 columnas del archivo de origen).
   Usa upsert por `(Factura, Pedido)`, así que volver a cargar el mismo archivo actualiza en vez de duplicar.
   El Administrador puede configurar (botón "Configurar seguimiento") los días de seguimiento por tipo de
   facturación (Repuestos/Servicio/Estibadores, valores por defecto 30/90/180); la grilla calcula y muestra
   la "Próxima fecha de seguimiento" de cada renglón (fecha de facturación + días configurados). Los cambios
   quedan en la auditoría.
4. **Proyección de seguimiento**: no tiene carga de Excel propia — se deriva de la Facturación ya cargada.
   Para cada combinación (Cliente, Tipo de Facturación: Repuestos/Servicio/Estibadores) se toma el renglón
   con la fecha de facturación más reciente. Buscador con filtros por Asesor (PSSR), Cliente y Tipo de
   Facturación; cada resultado muestra cliente, última fecha de facturación, tipo, asesor, la **fecha de
   próximo seguimiento proyectada** y el estado (Pendiente/Realizado), con acciones para registrar un nuevo
   seguimiento (fecha + observaciones) y para ver el **historial completo** de seguimientos de ese cliente +
   tipo de facturación. Cada "Registrar seguimiento" agrega una entrada nueva al historial (no sobrescribe
   las anteriores). La fecha proyectada usa los días parametrizados por tipo de facturación del módulo de
   Facturación, calculados sobre el registro más reciente del historial de ese cliente + tipo; si nunca se
   ha registrado un seguimiento, se calcula desde la última fecha de facturación. Un Asesor solo puede ver
   (listado, historial) y registrar seguimiento de clientes cuya última factura quedó a su nombre
   (comparando el PSSR de la factura contra su nombre completo).

## Notas de seguridad

- Contraseñas con bcrypt, sesión por JWT en cookie `httpOnly`. `sameSite` es `strict` en desarrollo y
  `none` en producción (necesario porque frontend y backend quedan en dominios distintos); siempre
  atado a `secure`, que solo se activa con HTTPS.
- Rate limiting en el login (10 intentos / 15 min).
- El parser de Excel usa la distribución oficial de SheetJS (`cdn.sheetjs.com`) porque la versión publicada
  en npm tiene vulnerabilidades conocidas sin parche.

## Despliegue (prueba gratuita: Neon + Render + Vercel)

Estructura pensada para desplegar el backend y el frontend por separado, con una base de datos
administrada. Combinación sin costo para una prueba (con las limitaciones de cada tier gratuito, ver
más abajo):

| Pieza | Proveedor | Plan |
|---|---|---|
| Base de datos PostgreSQL | [Neon](https://neon.tech) | Free (permanente, no expira) |
| Backend (API Express) | [Render](https://render.com) | Free (el servicio "duerme" tras ~15 min sin uso) |
| Frontend (SPA estática) | [Vercel](https://vercel.com) o [Netlify](https://netlify.com) | Free (sin sueño) |

### 1. Base de datos en Neon

1. Cree un proyecto en Neon y una base de datos (ej. `control_servicio`).
2. Copie el "Connection string" (ya incluye `?sslmode=require`, requerido por Prisma).

### 2. Backend en Render

El repo incluye [`render.yaml`](render.yaml) (Render Blueprint): al conectar el repositorio, Render
detecta el servicio automáticamente (`rootDir: app/backend`). Si prefiere configurarlo a mano, use:

- **Build command**: `npm install && npm run build`
- **Start command**: `npm run start:prod` (aplica migraciones con `prisma migrate deploy`, siembra el
  usuario Administrador si no existe, y arranca el servidor — todo idempotente, seguro de repetir en
  cada reinicio)
- **Variables de entorno**: ver [`app/backend/.env.production.example`](app/backend/.env.production.example)
  (`DATABASE_URL` de Neon, `JWT_SECRET` nuevo, `FRONTEND_ORIGIN` con la URL de Vercel, `COOKIE_SECURE=true`,
  credenciales del Administrador inicial)

Render asigna el puerto automáticamente vía la variable `PORT`; el servidor ya la respeta
([`env.ts`](app/backend/src/config/env.ts)).

### 3. Frontend en Vercel

1. Importe el repositorio en Vercel y configure **Root Directory** = `app/frontend` (Vercel detecta
   Vite automáticamente).
2. Variable de entorno: `VITE_API_URL` = URL del backend en Render + `/api` (ver
   [`app/frontend/.env.production.example`](app/frontend/.env.production.example)).
3. El archivo [`vercel.json`](app/frontend/vercel.json) ya incluye la reescritura necesaria para que
   las rutas de React Router (`/facturacion`, `/proyeccion`, etc.) no den 404 al recargar la página.
   Si despliega en Netlify en su lugar, use [`public/_redirects`](app/frontend/public/_redirects), que
   cumple la misma función.

### Limitaciones del tier gratuito

- **Render free**: el servicio se apaga tras ~15 minutos sin tráfico; la primera petición tras
  dormir tarda ~30-50s en responder (cold start). Aceptable para una prueba, no para uso productivo
  diario sin que se note el arranque lento ocasional.
- **Neon free**: la base de datos también puede "pausarse" tras inactividad prolongada, con un
  primer query más lento al reactivarse; el almacenamiento y cómputo del tier gratuito son generosos
  para una app de este tamaño.
- Ninguno de los tres requiere tarjeta de crédito para el tier gratuito mencionado (verifique
  condiciones vigentes de cada proveedor al momento de registrarse).

### Requisito previo: repositorio Git

Tanto Render como Vercel despliegan conectándose a un repositorio (GitHub, GitLab o Bitbucket) para
poder redesplegar automáticamente en cada `push`. Este proyecto todavía no es un repositorio Git —
avise cuando quiera que lo inicialice y prepare el primer commit; la creación del repositorio remoto
en GitHub (o el proveedor que prefiera) y la conexión con Render/Vercel las tiene que hacer usted,
porque requieren su cuenta.
