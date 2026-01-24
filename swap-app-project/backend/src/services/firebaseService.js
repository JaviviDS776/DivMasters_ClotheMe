const admin = require('firebase-admin');
const serviceAccount = require('../../serviceAccountKey.json');
require('dotenv').config(); // Aseguramos que cargue las variables de entorno aquí también

// 1. Inicializamos Firebase SIEMPRE antes de exportar nada
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      // Es vital que esta variable exista en tu .env del backend
      databaseURL: process.env.FIREBASE_DB_URL 
    });
    console.log("🔥 Firebase Admin inicializado correctamente.");
  } catch (error) {
    console.error("❌ Error inicializando Firebase Admin:", error);
  }
}

// 2. Ahora es seguro crear las instancias
const db = admin.firestore();
const rtdb = admin.database();

// 3. Exportamos las instancias listas para usar
module.exports = { db, rtdb };