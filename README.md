# Nosotros · PWA privada de pareja

Vite + React + Tailwind. Sin backend: todo se guarda en `localStorage` (claves con prefijo `nosotros:`).

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
