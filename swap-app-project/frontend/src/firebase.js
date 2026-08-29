import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';

if (!import.meta.env.VITE_API_KEY) {
  console.warn(
    '⚠️ [ClotheMe] FALTA CONFIGURACIÓN: No se encontró VITE_API_KEY.\n' +
    'Por favor crea el archivo swap-app-project/frontend/.env basándote en .env.example con las credenciales de tu proyecto Firebase.'
  );
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY || 'AIzaSy_NO_CONFIGURADO',
  authDomain: import.meta.env.VITE_AUTH_DOMAIN || 'clotheme-app.firebaseapp.com',
  databaseURL: import.meta.env.VITE_DATABASE_URL || 'https://clothe-me-7c5f9-default-rtdb.firebaseio.com',
  projectId: import.meta.env.VITE_PROJECT_ID || 'clotheme-app',
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET || 'clotheme-app.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID || '123456789',
  appId: import.meta.env.VITE_APP_ID || '1:123456789:web:abcdef'
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const rtdb = getDatabase(app);

