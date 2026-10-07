# Nosotros · PWA privada de pareja

Vite + React + Tailwind. Los datos se guardan en el teléfono (`localStorage`, claves con prefijo `nosotros:`) y, al iniciar sesión, se sincronizan con Supabase.

## Nube (Supabase)
1. En tu proyecto de Supabase (sirve el mismo de Base Lunar): **SQL Editor → New query**, pega [`supabase/esquema.sql`](supabase/esquema.sql) y pulsa **Run**. Crea la tabla `nosotros`, donde cada usuario solo puede ver sus propios datos.
2. Copia en [`src/config.js`](src/config.js) la **Project URL** y la **Publishable key** (`sb_publishable_…`). Nunca la Secret key.
3. Entra en la app con tu usuario de Supabase (Authentication → Users). Lo que ya tenías en el teléfono se sube solo la primera vez.

Sin llaves en `config.js`, la app funciona como antes: solo en el teléfono.
- Funciona sin señal: guarda en el teléfono y sube los cambios cuando vuelve la conexión.
- Gana la versión más reciente de cada sección; las listas se fusionan la primera vez que entras desde un teléfono nuevo.

```bash
npm install
npm run dev      # desarrollo
npm run build    # genera dist/
```

## Publicar en GitHub Pages
1. Crea un repo (por ejemplo `app-bb`). Si usas otro nombre, cambia `base` en `vite.config.js` a `'/<nombre-del-repo>/'`.
2. Sube el código a la rama `main`.
3. En el repo: Settings → Pages → Source: **GitHub Actions**.
4. El workflow `.github/workflows/deploy.yml` compila y publica en `https://<usuario>.github.io/<repo>/`.
5. Abre esa URL en el móvil → "Añadir a pantalla de inicio" (iOS: Compartir; Android: menú ⋮ → Instalar app).

> Los datos viven solo en el navegador del móvil donde instales la app. Borrar los datos del sitio los elimina.
