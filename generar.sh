#!/bin/bash

echo "🚀 Iniciando Protocolo de Generación: Proyecto SwapApp (Fullstack + IoT)..."

# 1. Crear directorio raíz
mkdir swap-app-project
cd swap-app-project

echo "📂 Directorio raíz creado."

# ==========================================
# 🟢 BACKEND SETUP (Node.js + Firebase Admin)
# ==========================================
echo "⚙️ Configurando Backend..."
mkdir backend
cd backend

# Inicializar npm y crear package.json básico
npm init -y

# Instalar dependencias del servidor
npm install express firebase-admin cors dotenv sightengine openai helmet

# Instalar dependencias de desarrollo
npm install -D nodemon

# Crear estructura de carpetas del Backend
mkdir src
mkdir src/controllers src/routes src/services src/middleware src/utils

# Crear archivo base del servidor
cat <<EOF > index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { initializeFirebase } = require('./src/services/firebaseService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(helmet());
app.use(express.json());

// Inicializar Firebase
initializeFirebase();

// Rutas (Placeholders)
app.use('/api/exchanges', require('./src/routes/exchangeRoutes'));
app.use('/api/locker', require('./src/routes/lockerRoutes'));

app.get('/', (req, res) => {
  res.send('👕 SwapApp API is running...');
});

app.listen(PORT, () => {
  console.log(\`✅ Servidor corriendo en puerto \${PORT}\`);
});
EOF

# Crear archivos placeholder para evitar errores
echo "const admin = require('firebase-admin'); 
const serviceAccount = require('../../serviceAccountKey.json'); 
const initializeFirebase = () => { 
  if (!admin.apps.length) { 
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount), databaseURL: process.env.FIREBASE_DB_URL }); 
  } 
}; 
module.exports = { initializeFirebase, db: admin.firestore(), rtdb: admin.database() };" > src/services/firebaseService.js

echo "const router = require('express').Router(); router.get('/', (req, res) => res.send('Exchange Route')); module.exports = router;" > src/routes/exchangeRoutes.js
echo "const router = require('express').Router(); router.post('/assign', (req, res) => res.send('Locker Assigned')); module.exports = router;" > src/routes/lockerRoutes.js

echo "✅ Backend configurado."
cd ..

# ==========================================
# 🔵 FRONTEND SETUP (Vite + React + PWA)
# ==========================================
echo "🎨 Configurando Frontend..."

# Crear app Vite (usando template react)
npm create vite@latest frontend -- --template react
cd frontend

# Instalar dependencias base + PWA + Navegación + UI
npm install
npm install firebase lucide-react react-router-dom react-hot-toast react-qr-code
npm install -D tailwindcss@3 postcss autoprefixer vite-plugin-pwa

# Inicializar Tailwind
npx tailwindcss init -p

# Configurar tailwind.config.js
cat <<EOF > tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6366f1',
        secondary: '#a855f7',
      }
    },
  },
  plugins: [],
}
EOF

# Configurar index.css
cat <<EOF > src/index.css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  overscroll-behavior-y: none; /* Prevenir rebote en móviles */
}
EOF

# Configurar vite.config.js con PWA
cat <<EOF > vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'SwapApp - Intercambio de Ropa',
        short_name: 'SwapApp',
        description: 'Intercambia ropa usando casilleros inteligentes',
        theme_color: '#6366f1',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
});
EOF

# Crear estructura de carpetas Frontend
mkdir src/components src/components/ui src/components/locker
mkdir src/pages src/layouts src/context src/hooks src/services

# Crear archivo de configuración de Firebase
cat <<EOF > src/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: "TU_AUTH_DOMAIN",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_STORAGE_BUCKET",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID",
  databaseURL: "TU_REALTIME_DB_URL"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const rtdb = getDatabase(app);
EOF

echo "✅ Frontend configurado."
cd ..

echo "🎉 ¡PROYECTO GENERADO CON ÉXITO!"
echo "------------------------------------------------"
echo "👉 Para correr el Backend: cd backend && npm start"
echo "👉 Para correr el Frontend: cd frontend && npm run dev"
echo "------------------------------------------------"