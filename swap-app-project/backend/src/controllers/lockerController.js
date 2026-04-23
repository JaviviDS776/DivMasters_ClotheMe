// backend/src/controllers/lockerController.js
const { db, rtdb } = require('../services/firebaseService');
const crypto = require('crypto');

const IOT_API_KEY = process.env.IOT_API_KEY || 'clotheme_secret_iot_token_2024';

// Generar hash corto para QR
const generateHash = (text) => crypto.createHash('sha256').update(text + Date.now()).digest('hex').substring(0, 10);

exports.assignLocker = async (req, res) => {
  const { exchangeId, userA, userB } = req.body;

  try {
    const snapshot = await rtdb.ref('lockers').orderByChild('status').equalTo('AVAILABLE').limitToFirst(1).once('value');
    
    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'No hay casilleros disponibles' });
    }

    const lockerId = Object.keys(snapshot.val())[0];
    const hashA = generateHash(userA);
    const hashB = generateHash(userB);

    await rtdb.ref(`lockers/${lockerId}`).update({
      status: 'RESERVED',
      currentExchange: exchangeId,
      codes: {
        codeA: hashA,
        codeB: hashB
      },
      step: 'WAITING_FOR_A' 
    });

    await db.collection('exchanges').doc(exchangeId).update({
      lockerId: lockerId,
      status: 'locker_assigned',
      qrCodes: { userA: hashA, userB: hashB }
    });

    res.json({ success: true, lockerId, qrCodes: { userA: hashA, userB: hashB } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno' });
  }
};

// NUEVA: Para el ESP32 - Verificar QR escaneado
exports.verifyLockerCode = async (req, res) => {
  const { lockerId, scannedCode, apiKey } = req.body;

  // Seguridad básica para el dispositivo IoT
  if (apiKey !== IOT_API_KEY) {
    return res.status(403).json({ error: 'No autorizado' });
  }

  try {
    const lockerRef = rtdb.ref(`lockers/${lockerId}`);
    const snapshot = await lockerRef.once('value');

    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Casillero no encontrado' });
    }

    const lockerData = snapshot.val();
    const { codeA, codeB } = lockerData.codes || {};
    const step = lockerData.step;

    let response = { access: false, action: 'none' };

    // Lógica de apertura según el paso actual
    if (step === 'WAITING_FOR_A' && scannedCode === codeA) {
      response = { access: true, action: 'open_for_dropoff', user: 'A' };
      await lockerRef.update({ step: 'WAITING_FOR_B' });
    } 
    else if (step === 'WAITING_FOR_B' && scannedCode === codeB) {
      response = { access: true, action: 'open_for_pickup', user: 'B' };
      // Finalizar el intercambio en ambos sistemas
      await lockerRef.update({ status: 'AVAILABLE', step: 'IDLE', codes: null, currentExchange: null });
      
      if (lockerData.currentExchange) {
        await db.collection('exchanges').doc(lockerData.currentExchange).update({
          status: 'completed',
          completedAt: new Date()
        });
      }
    }

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// NUEVA: Para pruebas - Crear casilleros iniciales
exports.seedLockers = async (req, res) => {
  try {
    const lockers = {
      'L01': { status: 'AVAILABLE', step: 'IDLE' },
      'L02': { status: 'AVAILABLE', step: 'IDLE' },
      'L03': { status: 'AVAILABLE', step: 'IDLE' }
    };
    await rtdb.ref('lockers').set(lockers);
    res.json({ success: true, message: 'Casilleros L01, L02 y L03 creados.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
