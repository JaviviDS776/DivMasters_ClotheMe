// backend/src/controllers/lockerController.js
const { db, rtdb, admin } = require('../services/firebaseService');
const crypto = require('crypto');

const IOT_API_KEY = process.env.IOT_API_KEY;

if (!IOT_API_KEY) {
  console.warn('⚠️ WARNING: IOT_API_KEY is not defined in environment variables.');
}

const generateHash = (text) => {
  const salt = crypto.randomBytes(4).toString('hex');
  return crypto.createHash('sha256').update(text + Date.now() + salt).digest('hex').substring(0, 10);
};

exports.assignLocker = async (req, res) => {
  const { exchangeId, userA, userB } = req.body;

  try {
    // Buscar 2 casilleros disponibles
    const snapshot = await rtdb.ref('lockers').orderByChild('status').equalTo('AVAILABLE').limitToFirst(2).once('value');
    
    if (!snapshot.exists() || Object.keys(snapshot.val()).length < 2) {
      return res.status(404).json({ error: 'No hay suficientes casilleros disponibles (se requieren 2)' });
    }

    const lockerIds = Object.keys(snapshot.val());
    const lockerA = lockerIds[0];
    const lockerB = lockerIds[1];
    
    const hashA = generateHash(userA);
    const hashB = generateHash(userB);

    // Reservar casilleros y crear índices de búsqueda rápida por QR
    const updates = {};
    updates[`lockers/${lockerA}`] = { status: 'RESERVED', currentExchange: exchangeId, type: 'A' };
    updates[`lockers/${lockerB}`] = { status: 'RESERVED', currentExchange: exchangeId, type: 'B' };
    
    // Registro de intercambio activo
    updates[`active_exchanges/${exchangeId}`] = {
      lockerA,
      lockerB,
      codeA: hashA,
      codeB: hashB,
      statusA: 'WAITING_DEPOSIT',
      statusB: 'WAITING_DEPOSIT'
    };

    // ÍNDICE DE BÚSQUEDA RÁPIDA (O(1) lookup)
    updates[`qr_indices/${hashA}`] = { exchangeId, userRole: 'A' };
    updates[`qr_indices/${hashB}`] = { exchangeId, userRole: 'B' };

    await rtdb.ref().update(updates);

    await db.collection('exchanges').doc(exchangeId).update({
      lockers: { lockerA, lockerB },
      status: 'lockers_assigned',
      qrCodes: { userA: hashA, userB: hashB }
    });

    res.json({ success: true, lockers: { lockerA, lockerB }, qrCodes: { userA: hashA, userB: hashB } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno' });
  }
};

exports.verifyLockerCode = async (req, res) => {
  const { scannedCode, apiKey } = req.body;

  // SEGURIDAD: Validación estricta de API Key
  if (!IOT_API_KEY || !apiKey || apiKey !== IOT_API_KEY) {
    return res.status(403).json({ error: 'No autorizado. API Key inválida o no configurada.' });
  }

  try {
    // 1. Búsqueda optimizada por índice (O(1))
    const indexSnapshot = await rtdb.ref(`qr_indices/${scannedCode}`).once('value');
    
    if (!indexSnapshot.exists()) {
      return res.status(404).json({ access: false, error: 'Código QR no reconocido' });
    }

    const { exchangeId, userRole } = indexSnapshot.val();

    // 2. Obtener datos del intercambio
    const exchangeRef = rtdb.ref(`active_exchanges/${exchangeId}`);
    const exchangeSnapshot = await exchangeRef.once('value');

    if (!exchangeSnapshot.exists()) {
      return res.status(404).json({ access: false, error: 'Intercambio activo no encontrado' });
    }

    const exchangeData = exchangeSnapshot.val();
    const { lockerA, lockerB, statusA, statusB } = exchangeData;
    let response = { access: false, action: 'none' };

    // 3. Lógica de Intercambio Atómica (Simplificada para legibilidad)
    if (userRole === 'A') {
      if (statusA === 'WAITING_DEPOSIT') {
        response = { 
          access: true, 
          action: 'open_for_deposit', 
          lockerId: lockerA, 
          message: `Usuario A: Deposita en ${lockerA}`,
          item: '👕'
        };
        await exchangeRef.update({ statusA: 'DEPOSITED' });

        // NOTIFICACIÓN: Informar al Usuario B que A ya depositó
        await db.collection('exchanges').doc(exchangeId).update({
          lastNotification: 'user_a_deposited',
          status: 'partially_deposited',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } 
      else if (statusA === 'DEPOSITED') {
        if (statusB === 'DEPOSITED' || statusB === 'COMPLETED') {
          response = { 
            access: true, 
            action: 'open_for_pickup', 
            lockerId: lockerB, 
            message: `Usuario A: Recoge en ${lockerB}`,
            item: '🎁'
          };
          await exchangeRef.update({ statusA: 'COMPLETED' });
          await checkExchangeCompletion(exchangeId);
        } else {
          response = { access: false, message: 'Esperando depósito del Usuario B...' };
        }
      }
    } 
    else if (userRole === 'B') {
      if (statusB === 'WAITING_DEPOSIT') {
        response = { 
          access: true, 
          action: 'open_for_deposit', 
          lockerId: lockerB, 
          message: `Usuario B: Deposita en ${lockerB}`,
          item: '👟'
        };
        await exchangeRef.update({ statusB: 'DEPOSITED' });

        // NOTIFICACIÓN: Informar al Usuario A que B ya depositó
        await db.collection('exchanges').doc(exchangeId).update({
          lastNotification: 'user_b_deposited',
          status: 'partially_deposited',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } 
      else if (statusB === 'DEPOSITED') {
        if (statusA === 'DEPOSITED' || statusA === 'COMPLETED') {
          response = { 
            access: true, 
            action: 'open_for_pickup', 
            lockerId: lockerA, 
            message: `Usuario B: Recoge en ${lockerA}`,
            item: '👕'
          };
          await exchangeRef.update({ statusB: 'COMPLETED' });
          await checkExchangeCompletion(exchangeId);
        } else {
          response = { access: false, message: 'Esperando depósito del Usuario A...' };
        }
      }
    }

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

async function checkExchangeCompletion(exchangeId) {
  const exchangeRef = rtdb.ref(`active_exchanges/${exchangeId}`);
  
  try {
    // 1. Obtener datos antes de cualquier acción
    const snap = await exchangeRef.once('value');
    const data = snap.val();

    if (data && data.statusA === 'COMPLETED' && data.statusB === 'COMPLETED') {
      const { lockerA, lockerB, codeA, codeB } = data;
      
      console.log(`✅ Intercambio ${exchangeId} finalizado. Liberando casilleros ${lockerA} y ${lockerB}...`);

      const updates = {};
      // Liberar casilleros
      updates[`lockers/${lockerA}`] = { status: 'AVAILABLE', currentExchange: null };
      updates[`lockers/${lockerB}`] = { status: 'AVAILABLE', currentExchange: null };
      
      // Limpiar índices de búsqueda
      updates[`qr_indices/${codeA}`] = null;
      updates[`qr_indices/${codeB}`] = null;
      
      // ELIMINAR el intercambio activo al FINAL
      updates[`active_exchanges/${exchangeId}`] = null;
      
      await rtdb.ref().update(updates);

      // Actualizar en Firestore para el historial del usuario
      await db.collection('exchanges').doc(exchangeId).update({
        status: 'completed',
        completedAt: admin.firestore.FieldValue.serverTimestamp()
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
    updates['active_exchanges'] = null; // Limpiar intercambios activos
    
    await rtdb.ref().update(updates);
    res.json({ success: true, message: 'Sistema reiniciado. Casilleros L01-L05 creados.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};