import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { initSync } from './lib/sync.js';

initSync();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Pide almacenamiento persistente para que el navegador no borre los datos por falta de espacio.
if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL })
      .catch((err) => console.error('Service Worker no registrado:', err));
  });
}
