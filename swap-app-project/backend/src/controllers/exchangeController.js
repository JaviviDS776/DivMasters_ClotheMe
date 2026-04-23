const { db, admin } = require('../services/firebaseService');

// 1. Proponer un intercambio
exports.proposeExchange = async (req, res) => {
  try {
    const { uid: requesterId } = req.user;
    const { recipientId, garmentWantedId, garmentOfferedId } = req.body;

    if (!recipientId || !garmentWantedId || !garmentOfferedId) {
      return res.status(400).json({ error: 'Faltan datos obligatorios para el intercambio' });
    }

    const newExchange = {
      requesterId,
      recipientId,
      garmentWantedId,
      garmentOfferedId,
      status: 'pending', // pending, accepted, rejected, completed
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('exchanges').add(newExchange);
    res.status(201).json({ id: docRef.id, ...newExchange });
  } catch (error) {
    console.error('Error al proponer intercambio:', error);
    res.status(500).json({ error: 'Error al proponer el intercambio' });
  }
};

// 2. Obtener mis intercambios (como solicitante o receptor)
exports.getExchanges = async (req, res) => {
  try {
    const { uid } = req.user;

    // Obtener intercambios donde soy solicitante
    const snapshot1 = await db.collection('exchanges')
      .where('requesterId', '==', uid)
      .get();

    // Obtener intercambios donde soy receptor
    const snapshot2 = await db.collection('exchanges')
      .where('recipientId', '==', uid)
      .get();

    const exchanges = [];
    
    // Necesitaremos detalles de las prendas
    const garmentIds = new Set();

    snapshot1.forEach(doc => {
      const data = doc.data();
      exchanges.push({ id: doc.id, ...data });
      garmentIds.add(data.garmentWantedId);
      garmentIds.add(data.garmentOfferedId);
    });

    snapshot2.forEach(doc => {
      const data = doc.data();
      exchanges.push({ id: doc.id, ...data });
      garmentIds.add(data.garmentWantedId);
      garmentIds.add(data.garmentOfferedId);
    });

    // Obtener info de prendas involucradas para mostrar en la UI
    const garments = {};
    if (garmentIds.size > 0) {
      const garmentsSnapshot = await db.collection('posts')
        .where(admin.firestore.FieldPath.documentId(), 'in', Array.from(garmentIds).slice(0, 30))
        .get();
      
      garmentsSnapshot.forEach(doc => {
        garments[doc.id] = { id: doc.id, ...doc.data() };
      });
    }

    // Inyectar info de prendas en los intercambios
    const enrichedExchanges = exchanges.map(ex => ({
      ...ex,
      garmentWanted: garments[ex.garmentWantedId] || { title: 'Prenda no encontrada' },
      garmentOffered: garments[ex.garmentOfferedId] || { title: 'Prenda no encontrada' }
    }));

    // Ordenar por fecha
    enrichedExchanges.sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });

    res.status(200).json(enrichedExchanges);
  } catch (error) {
    console.error('Error al obtener intercambios:', error);
    res.status(500).json({ error: 'Error al obtener intercambios' });
  }
};

// 3. Aceptar/Rechazar intercambio
exports.updateExchangeStatus = async (req, res) => {
  try {
    const { uid } = req.user;
    const { exchangeId } = req.params;
    const { status } = req.body; // 'accepted' o 'rejected'

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    const exchangeRef = db.collection('exchanges').doc(exchangeId);
    const doc = await exchangeRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Intercambio no encontrado' });
    }

    if (doc.data().recipientId !== uid) {
      return res.status(403).json({ error: 'No tienes permiso para actualizar este intercambio' });
    }

    await exchangeRef.update({
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(200).json({ id: exchangeId, status });
  } catch (error) {
    console.error('Error al actualizar intercambio:', error);
    res.status(500).json({ error: 'Error al actualizar el estado del intercambio' });
  }
};

// 4. Modo ADMIN (Pruebas): Forzar estado de cualquier intercambio
exports.adminUpdateExchangeStatus = async (req, res) => {
  try {
    const { exchangeId } = req.params;
    const { status } = req.body;

    const exchangeRef = db.collection('exchanges').doc(exchangeId);
    await exchangeRef.update({
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(200).json({ id: exchangeId, status, adminMode: true });
  } catch (error) {
    console.error('Error en adminUpdateExchangeStatus:', error);
    res.status(500).json({ error: 'Error en modo admin' });
  }
};
