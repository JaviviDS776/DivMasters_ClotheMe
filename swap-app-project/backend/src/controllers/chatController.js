const { db } = require('../services/firebaseService');
const admin = require('firebase-admin');

// Auxiliar para obtener info de usuarios participantes
const getParticipantsInfo = async (uids) => {
  if (!uids || uids.length === 0) return [];
  try {
    const snapshot = await db.collection('users')
      .where(admin.firestore.FieldPath.documentId(), 'in', uids)
      .get();
    
    const users = {};
    snapshot.forEach(doc => {
      users[doc.id] = {
        uid: doc.id,
        displayName: doc.data().displayName || 'Usuario',
        photoURL: doc.data().photoURL || '',
        lastActive: doc.data().lastActive || null
      };
    });
    return users;
  } catch (error) {
    console.error('Error obteniendo info de participantes:', error);
    return {};
  }
};

// Obtener todas las conversaciones de un usuario
exports.getConversations = async (req, res) => {
  try {
    const { uid } = req.user;
    
    const snapshot = await db.collection('conversations')
      .where('participants', 'array-contains', uid)
      .get();

    let conversations = [];
    let allParticipantIds = new Set();

    snapshot.forEach(doc => {
      const data = doc.data();
      conversations.push({ id: doc.id, ...data });
      data.participants.forEach(pId => allParticipantIds.add(pId));
    });

    // Obtener info de todos los participantes involucrados
    const participantsInfo = await getParticipantsInfo(Array.from(allParticipantIds));

    // Mapear info a las conversaciones
    conversations = conversations.map(conv => ({
      ...conv,
      participantsData: conv.participants.map(pId => participantsInfo[pId] || { uid: pId })
    }));

    // Ordenar manualmente
    conversations.sort((a, b) => {
      const timeA = a.lastActivity?.seconds || 0;
      const timeB = b.lastActivity?.seconds || 0;
      return timeB - timeA;
    });

    res.status(200).json(conversations);
  } catch (error) {
    console.error('❌ ERROR en getConversations:', error);
    res.status(500).json({ error: 'Error al obtener conversaciones' });
  }
};

// Crear o obtener una conversación
exports.getOrCreateConversation = async (req, res) => {
  try {
    const { uid } = req.user;
    const { otherUserId } = req.body;

    if (!otherUserId) return res.status(400).json({ error: 'ID del otro usuario es necesario' });

    // Buscar existente
    const snapshot = await db.collection('conversations')
      .where('participants', 'array-contains', uid)
      .get();

    let conversation = null;
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.participants.includes(otherUserId)) {
        conversation = { id: doc.id, ...data };
      }
    });

    if (conversation) {
      const participantsInfo = await getParticipantsInfo(conversation.participants);
      return res.status(200).json({
        ...conversation,
        participantsData: conversation.participants.map(pId => participantsInfo[pId] || { uid: pId })
      });
    }

    // Crear nueva
    const newConv = {
      participants: [uid, otherUserId],
      lastActivity: admin.firestore.FieldValue.serverTimestamp(),
      lastMessage: '',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('conversations').add(newConv);
    const participantsInfo = await getParticipantsInfo([uid, otherUserId]);
    
    res.status(201).json({ 
      id: docRef.id, 
      ...newConv,
      participantsData: [uid, otherUserId].map(pId => participantsInfo[pId] || { uid: pId })
    });
  } catch (error) {
    console.error('Error en getOrCreateConversation:', error);
    res.status(500).json({ error: 'Error al iniciar conversación' });
  }
};

// Obtener mensajes
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { uid } = req.user;

    // Verificar si el usuario es participante
    const convDoc = await db.collection('conversations').doc(conversationId).get();
    if (!convDoc.exists) {
      return res.status(404).json({ error: 'Conversación no encontrada' });
    }
    
    if (!convDoc.data().participants.includes(uid)) {
      return res.status(403).json({ error: 'No tienes permiso para ver esta conversación' });
    }
    
    const snapshot = await db.collection('conversations')
      .doc(conversationId)
      .collection('messages')
      .orderBy('timestamp', 'asc')
      .get();

    const messages = [];
    snapshot.forEach(doc => {
      messages.push({ id: doc.id, ...doc.data() });
    });

    res.status(200).json(messages);
  } catch (error) {
    console.error('Error en getMessages:', error);
    res.status(500).json({ error: 'Error al obtener mensajes' });
  }
};

// Enviar mensaje vía REST
exports.sendMessage = async (req, res) => {
  try {
    const { uid } = req.user;
    const { conversationId, text, receiverId } = req.body;

    if (!text || !conversationId) {
      return res.status(400).json({ error: 'Faltan datos para el mensaje' });
    }

    // Verificar si el usuario es participante
    const convRef = db.collection('conversations').doc(conversationId);
    const convDoc = await convRef.get();
    
    if (!convDoc.exists) {
      return res.status(404).json({ error: 'Conversación no encontrada' });
    }

    if (!convDoc.data().participants.includes(uid)) {
      return res.status(403).json({ error: 'No eres participante de esta conversación' });
    }

    const newMessage = {
      senderId: uid,
      receiverId: receiverId || '',
      text,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    };

    const batch = db.batch();
    
    // Guardar mensaje
    const msgRef = convRef.collection('messages').doc();
    batch.set(msgRef, newMessage);

    // Actualizar conversación
    batch.update(convRef, {
      lastMessage: text,
      lastActivity: admin.firestore.FieldValue.serverTimestamp()
    });

    await batch.commit();

    res.status(201).json({ success: true, message: { id: msgRef.id, ...newMessage } });
  } catch (error) {
    console.error('Error en sendMessage REST:', error);
    res.status(500).json({ error: 'Error al enviar mensaje' });
  }
};
