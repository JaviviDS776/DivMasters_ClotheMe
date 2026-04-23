const { db } = require('../services/firebaseService');
const admin = require('firebase-admin');

// Helper para limpiar datos indefinidos (Firestore no acepta undefined)
const cleanData = (obj) => {
  const newObj = {};
  Object.keys(obj).forEach(key => {
    if (obj[key] !== undefined) newObj[key] = obj[key];
  });
  return newObj;
};

// 1. Obtener perfil de usuario
exports.getProfile = async (req, res) => {
  try {
    const { uid, name, email, picture, photoURL } = req.user;
    
    if (!uid) {
      return res.status(401).json({ error: 'Usuario no identificado (falta UID)' });
    }

    const userRef = db.collection('users').doc(uid);
    let doc = await userRef.get();

    const now = admin.firestore.FieldValue.serverTimestamp();

    if (!doc.exists) {
      // Crear perfil por defecto si es la primera vez
      const newUser = {
        displayName: name || 'Usuario',
        email: email || '',
        photoURL: picture || photoURL || '',
        bio: '',
        location: '',
        friends: [],
        lastActive: now,
        createdAt: now
      };
      await userRef.set(newUser);
      return res.status(200).json({ uid, ...newUser });
    }

    // Actualizar última actividad cada vez que pide el perfil
    await userRef.update({ lastActive: now });
    res.status(200).json({ uid, ...doc.data() });
  } catch (error) {
    console.error('ERROR en getProfile:', error);
    res.status(500).json({ 
      error: 'Error interno al obtener perfil', 
      details: error.message 
    });
  }
};

// 2. Actualizar perfil
exports.updateProfile = async (req, res) => {
  try {
    const { uid } = req.user;
    const { displayName, bio, location, photoURL } = req.body;
    
    const updateData = cleanData({
      displayName,
      bio,
      location,
      photoURL
    });

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No hay datos para actualizar' });
    }

    await db.collection('users').doc(uid).update(updateData);
    res.status(200).json({ message: 'Perfil actualizado correctamente' });
  } catch (error) {
    console.error('ERROR en updateProfile:', error);
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
};

// 3. Buscar usuarios
exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 3) return res.status(200).json([]);

    const snapshot = await db.collection('users')
      .where('email', '>=', q)
      .where('email', '<=', q + '\uf8ff')
      .limit(5)
      .get();

    const users = [];
    snapshot.forEach(doc => {
      if (doc.id !== req.user.uid) {
        users.push({ uid: doc.id, ...doc.data() });
      }
    });

    res.status(200).json(users);
  } catch (error) {
    console.error('ERROR en searchUsers:', error);
    res.status(500).json({ error: 'Error en la búsqueda' });
  }
};

// 4. Obtener lista de amigos
exports.getFriends = async (req, res) => {
  try {
    const { uid } = req.user;
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists || !userDoc.data().friends || userDoc.data().friends.length === 0) {
      return res.status(200).json([]);
    }

    const friendIds = userDoc.data().friends;
    const friends = [];

    // Firestore limit: 'in' operator supports up to 30 IDs. 
    // We chunk the IDs array to handle more than 30 friends.
    const chunks = [];
    for (let i = 0; i < friendIds.length; i += 30) {
      chunks.push(friendIds.slice(i, i + 30));
    }

    for (const chunk of chunks) {
      const friendsSnapshot = await db.collection('users')
        .where(admin.firestore.FieldPath.documentId(), 'in', chunk)
        .get();

      friendsSnapshot.forEach(doc => {
        friends.push({ uid: doc.id, ...doc.data() });
      });
    }

    res.status(200).json(friends);
  } catch (error) {
    console.error('ERROR en getFriends:', error);
    res.status(500).json({ error: 'Error al obtener amigos' });
  }
};

// 5. Añadir amigo
exports.addFriend = async (req, res) => {
  try {
    const { uid } = req.user;
    const { friendId } = req.body;

    if (!friendId || friendId === uid) {
      return res.status(400).json({ error: 'ID de amigo inválido' });
    }

    const batch = db.batch();
    const userRef = db.collection('users').doc(uid);
    const friendRef = db.collection('users').doc(friendId);

    batch.update(userRef, {
      friends: admin.firestore.FieldValue.arrayUnion(friendId)
    });
    batch.update(friendRef, {
      friends: admin.firestore.FieldValue.arrayUnion(uid)
    });

    await batch.commit();
    res.status(200).json({ message: 'Amigo añadido correctamente' });
  } catch (error) {
    console.error('ERROR en addFriend:', error);
    res.status(500).json({ error: 'Error al añadir amigo' });
  }
};

// 6. Eliminar amigo
exports.removeFriend = async (req, res) => {
  try {
    const { uid } = req.user;
    const { friendId } = req.params;

    const batch = db.batch();
    const userRef = db.collection('users').doc(uid);
    const friendRef = db.collection('users').doc(friendId);

    batch.update(userRef, {
      friends: admin.firestore.FieldValue.arrayRemove(friendId)
    });
    batch.update(friendRef, {
      friends: admin.firestore.FieldValue.arrayRemove(uid)
    });

    await batch.commit();
    res.status(200).json({ message: 'Amigo eliminado correctamente' });
  } catch (error) {
    console.error('ERROR en removeFriend:', error);
    res.status(500).json({ error: 'Error al eliminar amigo' });
  }
};

// 7. Obtener todos los usuarios (para descubrimiento)
exports.getAllUsers = async (req, res) => {
  try {
    const snapshot = await db.collection('users').limit(50).get();
    const users = [];
    const now = Date.now();
    const onlineThreshold = 5 * 60 * 1000; // 5 minutos

    snapshot.forEach(doc => {
      if (doc.id !== req.user.uid) {
        const data = doc.data();
        const lastActive = data.lastActive?.toDate ? data.lastActive.toDate().getTime() : 0;
        const isOnline = (now - lastActive) < onlineThreshold;

        users.push({ 
          uid: doc.id, 
          ...data,
          isOnline 
        });
      }
    });

    // Ordenar: primero los online, luego por nombre
    users.sort((a, b) => {
      if (a.isOnline === b.isOnline) {
        return (a.displayName || '').localeCompare(b.displayName || '');
      }
      return a.isOnline ? -1 : 1;
    });

    res.status(200).json(users);
  } catch (error) {
    console.error('ERROR en getAllUsers:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

// 8. Obtener usuario por ID (Público/Básico)
exports.getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const doc = await db.collection('users').doc(userId).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const data = doc.data();
    res.status(200).json({
      uid: doc.id,
      displayName: data.displayName || 'Usuario',
      photoURL: data.photoURL || '',
      bio: data.bio || '',
      lastActive: data.lastActive || null
    });
  } catch (error) {
    console.error('ERROR en getUserById:', error);
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
};
