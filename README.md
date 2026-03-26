# ♟ ChessMate — Ajedrez Multijugador

Aplicación web de ajedrez multijugador en tiempo real construida con:

| Capa | Tecnología |
|------|-----------|
| Frontend | HTML + CSS + JavaScript vanilla |
| Lógica de ajedrez | chess.js |
| Tablero visual | chessboard.js |
| Backend / BD / Auth | Supabase (PostgreSQL + Realtime) |
| Despliegue | Vercel (Serverless Functions) |

---

## Estructura del proyecto

```
chessmate/
├── public/
│   ├── index.html        ← Login / pantalla de inicio
│   ├── lobby.html        ← Crear o unirse a partida
│   ├── game.html         ← Tablero de juego
│   ├── profile.html      ← Perfil y estadísticas
│   ├── css/style.css     ← Estilos globales
│   └── js/
│       ├── supabase-client.js  ← Singleton del cliente Supabase
│       └── utils.js            ← Helpers compartidos
├── api/
│   ├── _supabase.js      ← Cliente admin (service role)
│   ├── create-game.js    ← POST /api/create-game
│   ├── join-game.js      ← POST /api/join-game
│   ├── move.js           ← POST /api/move
│   └── game-state.js     ← GET  /api/game-state?id=
├── supabase/
│   └── schema.sql        ← DDL completo (tablas + RLS + Realtime)
├── package.json
└── vercel.json
```

---

## Pasos para activar Supabase

### 1. Crear proyecto

1. Ve a [supabase.com](https://supabase.com) → **New project**
2. Anota la **Project URL** y las dos claves:
   - `anon / public` → para el navegador
   - `service_role` → solo para las funciones de servidor

### 2. Ejecutar el esquema

1. En el dashboard de Supabase → **SQL Editor**
2. Abre `supabase/schema.sql` y ejecútalo completo
3. Verifica que se crearon las tablas `users`, `games` y `moves`

### 3. Configurar autenticación

En **Authentication → Providers**:
- Habilita **Email** (ya viene activo por defecto)
- Opcional: activa OAuth (Google, GitHub) si lo deseas

En **Authentication → URL Configuration**:
- Site URL: `https://tu-dominio.vercel.app`
- Redirect URLs: `https://tu-dominio.vercel.app/*`

### 4. Insertar claves en el frontend

Abre `public/js/supabase-client.js` y reemplaza:

```js
// Ya configurado — URL: https://bouwyielngvqltusosle.supabase.co
// Anon key incluida en el archivo
```

> Alternativa: define `window.ENV_SUPABASE_URL` y `window.ENV_SUPABASE_ANON_KEY`
> desde un snippet de Vercel Edge Config o una variable de entorno pública.

---

## Pasos para desplegar en Vercel

### 1. Instalar Vercel CLI (opcional)

```bash
npm i -g vercel
```

### 2. Conectar el repositorio

1. Ve a [vercel.com](https://vercel.com) → **New Project**
2. Importa el repositorio `sergio-velites/testchess`
3. Framework Preset: **Other** (sin framework)
4. Root Directory: `.` (raíz)
5. Output Directory: `public`

### 3. Variables de entorno en Vercel

En **Settings → Environment Variables** añade:

| Variable | Valor |
|----------|-------|
| `SUPABASE_URL` | `https://bouwyielngvqltusosle.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Tu service role key |

> Las claves del frontend (`ANON_KEY`, `URL`) van directamente en
> `public/js/supabase-client.js` porque son públicas y seguras.

### 4. Deploy

```bash
vercel --prod
# o simplemente haz push al branch principal — Vercel auto-despliega
```

---

## Flujo de uso

```
1. Regístrate / inicia sesión en /
2. Ve al lobby → "Crear partida" → elige color → copia el código
3. Comparte el código con tu rival (o el link /game.html?id=...)
4. Rival entra al lobby → "Unirse" → pega el código
5. Ambos jugadores ven el tablero en /game.html?id=...
6. Los movimientos se sincronizan en tiempo real vía Supabase Realtime
7. El historial completo queda guardado en la tabla `moves`
```

---

## Funcionalidades

- **Tiempo real**: WebSockets de Supabase Realtime — cada movimiento aparece al instante
- **Persistencia**: se guardan todos los movimientos en notación algebraica (SAN) y UCI
- **Historial**: tabla lateral con todos los movimientos
- **Estados**: waiting → active → check / checkmate / draw / paused
- **Perfil**: estadísticas de victorias, derrotas y tablas
- **Móvil**: tablero táctil responsive con chessboard.js
- **Promoción de peón**: modal para elegir pieza
- **Pausa / Rendirse**: botones in-game
- **Código de invitación**: 8 caracteres, copiable al portapapeles

---

## Desarrollo local

```bash
npm install
npx vercel dev   # levanta frontend en public/ + funciones en api/
```

Necesitas un archivo `.env.local`:

```
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

---

## Licencia

MIT
