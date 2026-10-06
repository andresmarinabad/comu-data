# comu-data

Almacenamiento y gestión de los datos de la comunidad.

## Desarrollo local

1. Copia `.env.example` a `.env` y define una contraseña larga y una clave de sesión aleatoria.
2. `docker compose up --build` inicia PostgreSQL y la API FastAPI en `http://localhost:8000`.
3. PostgreSQL escucha en `localhost:5432`; la documentación interactiva de la API está en `http://localhost:8000/docs`.
4. En otra terminal: `cd frontend && cp .env.example .env && nix develop`.
5. Dentro del entorno Nix, ejecuta `npm install` una vez y después `npm run dev`.
6. Abre `http://localhost:5173`. La ruta `/` muestra la lista y `/admin` pide la contraseña antes de abrir el backoffice.

El `flake.nix` del frontend proporciona Node.js 22 y npm dentro del entorno de desarrollo, sin instalarlos globalmente en el equipo. Nix descargará el entorno la primera vez; `npm install` instala las dependencias del proyecto en `frontend/node_modules`.

Los scripts `init.sql` y `populate.sql` se ejecutan automáticamente cuando PostgreSQL crea por primera vez el volumen `pgdata`. Si el volumen ya existía antes de añadir estos scripts, PostgreSQL no vuelve a inicializarlo; conserva tus datos y aplica los scripts manualmente si necesitas crear el esquema.

La contraseña se comprueba en el backend y las sesiones caducan a las 8 horas; el API de administración exige el token. Para una base que ya existía, aplica las migraciones `migrations/001_add_person_sex.sql` y `migrations/002_sync_person_spouse.sql` con `psql -d comu -U comu -f migrations/001_add_person_sex.sql` y `psql -d comu -U comu -f migrations/002_sync_person_spouse.sql`, o desde el editor SQL de Supabase. `sex` acepta `M` o `F`; edítalo en `/admin`.

## Frontend en Vercel con Supabase

Configura `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en Vercel y deja sin definir `VITE_API_URL`. Configura además `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` como variables privadas del servidor de Vercel. La clave de servicio solo se usa en las funciones de `frontend/api/admin`; nunca la pongas en variables `VITE_*`.

La ruta `/admin` pide la contraseña antes de abrir el backoffice. En local, FastAPI protege también las operaciones del API. En Vercel, las funciones servidoras validan la contraseña y realizan las operaciones con la clave privada de Supabase. La lista pública sigue usando la clave pública.

El backend local está pensado para desarrollo en la máquina local. No lo expongas a Internet sin configurar una contraseña fuerte y revisar el acceso público al directorio.
