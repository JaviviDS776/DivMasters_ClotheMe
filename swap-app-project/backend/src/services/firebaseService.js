const admin = require('firebase-admin');
require('dotenv').config();

let db;
let rtdb;

try {
  if (!admin.apps.length) {
    const serviceAccount = JSON.parse(
      Buffer.from(process.env.SERVICE_ACCOUNT, "base64").toString("utf8")
    );

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DB_URL 
    });
    console.log("🔥 Firebase Admin inicializado correctamente.");
  }
  db = admin.firestore();
  rtdb = admin.database();
} catch (error) {
  console.error("❌ ERROR CRÍTICO inicializando Firebase Admin:", error.message);
}

module.exports = { db, rtdb, admin };
