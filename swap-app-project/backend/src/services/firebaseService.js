const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

let db;
let rtdb;

try {
  if (!admin.apps.length) {
    let serviceAccount = null;
    const rawServiceAccount = process.env.SERVICE_ACCOUNT;

    if (rawServiceAccount && rawServiceAccount !== 'TU_SERVICE_ACCOUNT_JSON_EN_BASE64') {
      try {
        // 1. Probar si es JSON directo
        serviceAccount = JSON.parse(rawServiceAccount);
      } catch {
        try {
          // 2. Probar si es base64
          const decoded = Buffer.from(rawServiceAccount, 'base64').toString('utf8');
          serviceAccount = JSON.parse(decoded);
        } catch {
          // 3. Probar si es ruta a archivo
          if (fs.existsSync(rawServiceAccount)) {
            serviceAccount = require(path.resolve(rawServiceAccount));
          }
        }
      }
    }

    // Si aún no se cargó, buscar si existe serviceAccountKey.json en la carpeta backend
    if (!serviceAccount) {
      const localKeyPath = path.join(__dirname, '../../serviceAccountKey.json');
      if (fs.existsSync(localKeyPath)) {
        serviceAccount = require(localKeyPath);
      }
    }

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DB_URL
      });
      console.log('🔥 Firebase Admin inicializado correctamente.');
    } else {
      console.warn('⚠️ [Firebase Admin] Falta configurar SERVICE_ACCOUNT en backend/.env o colocar serviceAccountKey.json en backend/');
    }
  }

  if (admin.apps.length) {
    db = admin.firestore();
    rtdb = admin.database();
  }
} catch (error) {
  console.error('❌ ERROR CRÍTICO inicializando Firebase Admin:', error.message);
}

module.exports = {
  get db() { return db; },
  get rtdb() { return rtdb; },
  admin
};

