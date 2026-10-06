# comu-data

Aplicación web para consultar y administrar la información de Comunidad X Santas. Incluye una interfaz adaptada a móviles, una API FastAPI para desarrollo local y soporte para usar Supabase como base de datos en Vercel.

## Funciones

- **Inicio (`/`)**: salmo actual, próximo cumpleaños, eventos del mes actual y el siguiente, y palabras guardadas.
- **Lista (`/lista`)**: directorio de personas ordenado por hogares; muestra nombre y apellidos y permite buscar.
- **Eventos (`/eventos`)**: muestra eventos futuros. Si un evento tiene ágape, permite consultar las asignaciones por tipo de comida.
- **Grupos (`/grupos`)**: grupos de la comunidad y sección Parejas, con los hermanos y las calles asociadas.
- **Admin (`/admin`)**: backoffice protegido por contraseña para crear, editar y eliminar registros. Al crear o editar eventos se puede activar un ágape y asignar personas a tipos de comida. Si una persona tiene cónyuge registrado, ambos quedan asignados a la misma comida.

El formulario de administración usa selectores de fecha y hora para campos de fecha. Las tablas internas `agapes` y `agape_assignments` se gestionan desde el formulario de eventos, sin tener que introducir sus IDs manualmente. `agape_food_types` sigue disponible en Admin para mantener las opciones de comida.

## Desarrollo local

Requisitos: Docker Compose y Nix con flakes habilitados.

1. Copia `.env.example` a `.env`. Cambia `ADMIN_PASSWORD` y `ADMIN_SESSION_SECRET` por valores propios; no uses los valores de ejemplo en un entorno compartido.
2. Inicia PostgreSQL y la API:

   ```sh
   docker compose up --build
   ```

   PostgreSQL queda en `localhost:5432`, FastAPI en `http://localhost:8000` y su documentación en `http://localhost:8000/docs`.

3. En otra terminal configura y ejecuta el frontend:

   ```sh
   cd frontend
   cp .env.example .env
   nix develop
   npm install
   npm run dev
   ```

4. Abre `http://localhost:5173`.

El entorno Nix proporciona Node.js 22 y npm. `VITE_API_URL` en `frontend/.env` debe apuntar al backend local (`http://localhost:8000/api`).

PostgreSQL ejecuta `init.sql` y `populate.sql` solo al crear por primera vez el volumen `pgdata`. Si el volumen ya existe, los scripts no se ejecutan de nuevo; conserva los datos existentes. Para empezar con una base vacía se puede borrar el volumen con `docker compose down -v` —esto elimina los datos locales— y volver a iniciar Compose.

### Migraciones

Para una base creada antes de estas migraciones, aplica los archivos en orden:

```sh
psql -d comu -U comu -f migrations/001_add_person_sex.sql
psql -d comu -U comu -f migrations/002_sync_person_spouse.sql
```

También se pueden ejecutar desde el editor SQL de Supabase. El campo `persons.sex` acepta `M` o `F`. La sincronización de `spouse_id` mantiene la relación de cónyuges en ambas direcciones.

## Supabase y Vercel

En Vercel configura las siguientes variables:

| Variable | Uso |
| --- | --- |
| `VITE_SUPABASE_URL` | URL pública del proyecto Supabase que utiliza el frontend. |
| `VITE_SUPABASE_ANON_KEY` | Clave pública para las consultas de lectura del frontend. |
| `ADMIN_PASSWORD` | Contraseña para acceder a Admin. |
| `ADMIN_SESSION_SECRET` | Secreto privado para firmar las sesiones de Admin. |
| `SUPABASE_URL` | URL del proyecto para las funciones de servidor de Admin. |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave privada que las funciones de servidor usan para las operaciones administrativas. |

En este modo, elimina `VITE_API_URL`. No pongas `SUPABASE_SERVICE_ROLE_KEY` ni otros secretos en variables `VITE_*`: esas variables se incluyen en el frontend.

El cliente Supabase del frontend usa la clave pública para las lecturas. Configura las políticas y permisos de lectura necesarios para las tablas públicas que aparecen en Inicio, Lista, Eventos y Grupos. Las escrituras de administración pasan por las funciones servidoras protegidas por contraseña y usan la clave de servicio. No concedas escritura anónima a las tablas.

## Seguridad

La contraseña de Admin se valida en el servidor. Las sesiones caducan a las 8 horas y el API administrativo exige un token válido. El backend local está pensado para desarrollo; antes de exponerlo a Internet, configura secretos fuertes y revisa qué datos personales del directorio son públicos.
