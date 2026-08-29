// backend/src/controllers/lockerController.js
const { db, rtdb, admin } = require('../services/firebaseService');
const crypto = require('crypto');

const IOT_API_KEY = process.env.IOT_API_KEY || 'clotheme_secret_iot_token_2024';

const generateHexCode = () => {
  return crypto.randomBytes(5).toString('hex');
};

exports.assignLocker = async (req, res) => {
  const { exchangeId, userA, userB } = req.body;

  if (!exchangeId) {
    return res.status(400).json({ error: 'Falta exchangeId obligatorio' });
  }

  try {
    let lockerA = null;
    let lockerB = null;

    // Transacción atómica en el nodo de casilleros para evitar condiciones de carrera
    const lockersRef = rtdb.ref('lockers');
    const txResult = await lockersRef.transaction((lockers) => {
      if (!lockers) return lockers;

      const available = Object.keys(lockers).filter(id => lockers[id] && lockers[id].status === 'AVAILABLE');
      if (available.length < 2) {
        return; // Aborta la transacción si no hay al menos 2 casilleros disponibles
      }

      lockerA = available[0];
      lockerB = available[1];

      lockers[lockerA] = { status: 'RESERVED', currentExchange: exchangeId, type: 'A' };
      lockers[lockerB] = { status: 'RESERVED', currentExchange: exchangeId, type: 'B' };

      return lockers;
    });

    if (!txResult.committed || !lockerA || !lockerB) {
      return res.status(409).json({ error: 'No hay suficientes casilleros disponibles en este momento (se requieren 2)' });
    }

    const hashA = generateHexCode();
    const hashB = generateHexCode();

    // Actualizar registros e índices de búsqueda O(1)
    const updates = {};
    updates[`active_exchanges/${exchangeId}`] = {
      lockerA,
      lockerB,
      codeA: hashA,
      codeB: hashB,
      statusA: 'WAITING_DEPOSIT',
      statusB: 'WAITING_DEPOSIT',
      createdAt: Date.now()
    };

    updates[`qr_indices/${hashA}`] = { exchangeId, userRole: 'A' };
    updates[`qr_indices/${hashB}`] = { exchangeId, userRole: 'B' };

    await rtdb.ref().update(updates);

    await db.collection('exchanges').doc(exchangeId).update({
      lockers: { lockerA, lockerB },
      status: 'lockers_assigned',
      qrCodes: { userA: hashA, userB: hashB },
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ success: true, lockers: { lockerA, lockerB }, qrCodes: { userA: hashA, userB: hashB } });
  } catch (error) {
    console.error('Error en assignLocker:', error);
    res.status(500).json({ error: 'Error interno al asignar casilleros' });
  }
};

exports.verifyLockerCode = async (req, res) => {
  const { scannedCode, apiKey } = req.body;

  // SEGURIDAD: Validación estricta de API Key
  if (!IOT_API_KEY || !apiKey || apiKey !== IOT_API_KEY) {
    return res.status(403).json({ error: 'No autorizado. API Key inválida o no configurada.' });
  }

  if (!scannedCode) {
    return res.status(400).json({ access: false, error: 'Código no proporcionado' });
  }

  try {
    // 1. Búsqueda optimizada por índice (O(1))
    const indexSnapshot = await rtdb.ref(`qr_indices/${scannedCode}`).once('value');
    
    if (!indexSnapshot.exists()) {
      return res.status(404).json({ access: false, error: 'Código QR no reconocido o ya expirado' });
    }

    const { exchangeId, userRole } = indexSnapshot.val();
    const exchangeRef = rtdb.ref(`active_exchanges/${exchangeId}`);

    let response = { access: false, action: 'none' };
    let shouldCheckCompletion = false;

    // Transacción atómica sobre el intercambio activo
    const txResult = await exchangeRef.transaction((exchangeData) => {
      if (!exchangeData) return exchangeData;

      const { lockerA, lockerB, statusA, statusB } = exchangeData;

      if (userRole === 'A') {
        if (statusA === 'WAITING_DEPOSIT') {
          exchangeData.statusA = 'DEPOSITED';
          response = { 
            access: true, 
            action: 'open_for_deposit', 
            lockerId: lockerA, 
            message: `Usuario A: Deposita en ${lockerA}`,
            item: '👕'
          };
        } else if (statusA === 'DEPOSITED') {
          if (statusB === 'DEPOSITED' || statusB === 'COMPLETED') {
            exchangeData.statusA = 'COMPLETED';
            shouldCheckCompletion = true;
            response = { 
              access: true, 
              action: 'open_for_pickup', 
              lockerId: lockerB, 
              message: `Usuario A: Recoge en ${lockerB}`,
              item: '🎁'
            };
          } else {
            response = { access: false, message: 'Esperando depósito del Usuario B...' };
          }
        }
      } else if (userRole === 'B') {
        if (statusB === 'WAITING_DEPOSIT') {
          exchangeData.statusB = 'DEPOSITED';
          response = { 
            access: true, 
            action: 'open_for_deposit', 
            lockerId: lockerB, 
            message: `Usuario B: Deposita en ${lockerB}`,
            item: '👟'
          };
        } else if (statusB === 'DEPOSITED') {
          if (statusA === 'DEPOSITED' || statusA === 'COMPLETED') {
            exchangeData.statusB = 'COMPLETED';
            shouldCheckCompletion = true;
            response = { 
              access: true, 
              action: 'open_for_pickup', 
              lockerId: lockerA, 
              message: `Usuario B: Recoge en ${lockerA}`,
              item: '👕'
            };
          } else {
            response = { access: false, message: 'Esperando depósito del Usuario A...' };
          }
        }
      }

      return exchangeData;
    });

    if (!txResult.committed || !response.access) {
      return res.status(200).json(response.message ? response : { access: false, error: 'No se pudo procesar la acción' });
    }

    // Sincronizar estado en Firestore para reflejo en la PWA
    if (response.action === 'open_for_deposit') {
      await db.collection('exchanges').doc(exchangeId).update({
        lastNotification: `user_${userRole.toLowerCase()}_deposited`,
        status: 'partially_deposited',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    if (shouldCheckCompletion) {
      await checkExchangeCompletion(exchangeId);
    }

    res.json(response);
  } catch (error) {
    console.error('Error en verifyLockerCode:', error);
    res.status(500).json({ error: error.message });
  }
};

async function checkExchangeCompletion(exchangeId) {
  const exchangeRef = rtdb.ref(`active_exchanges/${exchangeId}`);
  
  try {
    const snap = await exchangeRef.once('value');
    const data = snap.val();

    if (data && data.statusA === 'COMPLETED' && data.statusB === 'COMPLETED') {
      const { lockerA, lockerB, codeA, codeB } = data;
      
      console.log(`✅ Intercambio ${exchangeId} finalizado. Liberando casilleros ${lockerA} y ${lockerB}...`);

      const updates = {};
      // Liberar casilleros
      updates[`lockers/${lockerA}`] = { status: 'AVAILABLE', currentExchange: null };
      updates[`lockers/${lockerB}`] = { status: 'AVAILABLE', currentExchange: null };
      
      // Limpiar índices de búsqueda QR
      if (codeA) updates[`qr_indices/${codeA}`] = null;
      if (codeB) updates[`qr_indices/${codeB}`] = null;
      
      // Eliminar el intercambio activo
      updates[`active_exchanges/${exchangeId}`] = null;
      
      await rtdb.ref().update(updates);

      // Actualizar en Firestore
      await db.collection('exchanges').doc(exchangeId).update({
        status: 'completed',
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error en checkExchangeCompletion:', error);
  }
}

// Obtener estado de todos los casilleros e intercambios activos
exports.getAllLockers = async (req, res) => {
  try {
    const lockersSnap = await rtdb.ref('lockers').once('value');
    const exchangesSnap = await rtdb.ref('active_exchanges').once('value');
    
    res.json({
      lockers: lockersSnap.val() || {},
      activeExchanges: exchangesSnap.val() || {}
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.seedLockers = async (req, res) => {
  try {
    const lockers = {
      'L01': { status: 'AVAILABLE' },
      'L02': { status: 'AVAILABLE' },
      'L03': { status: 'AVAILABLE' },
      'L04': { status: 'AVAILABLE' },
      'L05': { status: 'AVAILABLE' }
    };
    
    const updates = {};
    updates['lockers'] = lockers;
    updates['active_exchanges'] = null;
    updates['qr_indices'] = null;
    
    await rtdb.ref().update(updates);
    res.json({ success: true, message: 'Sistema reiniciado. Casilleros L01-L05 creados e índices limpiados.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};