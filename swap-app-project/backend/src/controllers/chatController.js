const { db } = require('../services/firebaseService');
const admin = require('firebase-admin');

// Obtener todas las conversaciones de un usuario
exports.getConversations = async (req, res) => {
  try {
    const { uid } = req.user;
    console.log('🔍 Buscando conversaciones para UID:', uid);
    
    // Simplificamos la consulta eliminando el orderBy temporalmente
    // Esto evita el error de "missing index" de Firestore
    const snapshot = await db.collection('conversations')
      .where('participants', 'array-contains', uid)
      .get();

    const conversations = [];
    snapshot.forEach(doc => {
      conversations.push({ id: doc.id, ...doc.data() });
    });

    // Ordenar manualmente en memoria para evitar el error de índice
    conversations.sort((a, b) => {
      const timeA = a.lastActivity?.seconds || 0;
      const timeB = b.lastActivity?.seconds || 0;
      return timeB - timeA;
    });

    res.status(200).json(conversations);
  } catch (error) {
    console.error('❌ ERROR DETALLADO en getConversations:', error);
    res.status(500).json({ 
      error: 'Error al obtener conversaciones',
      details: error.message 
    });
  }
};

// Crear o obtener una conversación entre dos usuarios
exports.getOrCreateConversation = async (req, res) => {
  try {
    const { uid } = req.user; // Mi ID
    const { otherUserId } = req.body; // El ID del otro

    if (!otherUserId) return res.status(400).json({ error: 'ID del otro usuario es necesario' });

    // Buscar si ya existe una conversación entre ambos
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
      return res.status(200).json(conversation);
    }

    // Si no existe, crearla
    const newConv = {
      participants: [uid, otherUserId],
      lastActivity: admin.firestore.FieldValue.serverTimestamp(),
      lastMessage: '',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('conversations').add(newConv);
    res.status(201).json({ id: docRef.id, ...newConv });
  } catch (error) {
    console.error('Error en getOrCreateConversation:', error);
    res.status(500).json({ error: 'Error al iniciar conversación' });
  }
};

// Obtener mensajes de una conversación
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    
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
