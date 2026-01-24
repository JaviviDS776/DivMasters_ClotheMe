// backend/src/controllers/lockerController.js
const { db, rtdb } = require('../services/firebaseService');
const crypto = require('crypto');

// Generar hash corto para QR
const generateHash = (text) => crypto.createHash('sha256').update(text + Date.now()).digest('hex').substring(0, 10);

exports.assignLocker = async (req, res) => {
  const { exchangeId, userA, userB } = req.body;

  try {
    // 1. Buscar Casillero Disponible en Realtime DB (Más rápido para IoT)
    const snapshot = await rtdb.ref('lockers').orderByChild('status').equalTo('AVAILABLE').limitToFirst(1).once('value');
    
    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'No hay casilleros disponibles' });
    }

    const lockerId = Object.keys(snapshot.val())[0];

    // 2. Generar QRs únicos
    const hashA = generateHash(userA);
    const hashB = generateHash(userB);

    // 3. Actualizar estado del casillero (Reservar)
    await rtdb.ref(`lockers/${lockerId}`).update({
      status: 'RESERVED',
      currentExchange: exchangeId,
      codes: {
        codeA: hashA,
        codeB: hashB
      },
      step: 'WAITING_FOR_A' // Máquina de estados
    });

    // 4. Guardar referencia en Firestore (Historial persistente)
    await db.collection('exchanges').doc(exchangeId).update({
      lockerId: lockerId,
      status: 'locker_assigned',
      qrCodes: { userA: hashA, userB: hashB }
    });

    res.json({ success: true, lockerId, qrCodes: { userA: hashA, userB: hashB } });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};