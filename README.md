# Nosotros · PWA privada de pareja

Vite + React + Tailwind. Los datos se guardan en el teléfono (`localStorage`, claves con prefijo `nosotros:`) y, si conectas la nube, se sincronizan con un **Gist secreto de tu GitHub**, igual que la Bitácora PDT.

## Nube (Gist de GitHub)
1. Crea un token *fine-grained* en https://github.com/settings/personal-access-tokens/new con el permiso **Gists: Read and write** (o reutiliza el de la Bitácora PDT si ya lo tiene).
2. En la app, toca el botón de nube (arriba a la derecha), pega el token y deja el ID del Gist vacío: se crea un Gist secreto `nosotros.json` con lo que ya tenías.
3. En tus otros dispositivos pega el mismo token y el ID del Gist que muestra la app.

- Solo acceden los dispositivos donde pegues tu token. El token queda guardado solo en ese dispositivo.
- Funciona sin señal: guarda en el teléfono y sube los cambios cuando vuelve la conexión.
- Gana la versión más reciente de cada sección; la primera vez que conectas un dispositivo, sus listas se fusionan con las de la nube.

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
