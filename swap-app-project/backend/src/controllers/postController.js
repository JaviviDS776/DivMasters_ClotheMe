const { db, admin } = require('../services/firebaseService');
const { uploadImage } = require('../services/cloudinaryService');
const { moderateText, moderateImageBuffer } = require('../services/moderationService');

// 1. Crear un nuevo post
exports.createPost = async (req, res) => {
  try {
    const { title, description, lockerZone } = req.body;
    const { uid, name, email, picture, photoURL: tokenPhotoURL } = req.user;
    let imageUrl = req.body.imageUrl;

    console.log('--- Iniciando creación de post con moderación ---');

    if (!title) {
      return res.status(400).json({ error: 'El título es obligatorio' });
    }

    // PASO 1: Moderación de Texto y Términos Comunitarios
    const textModeration = moderateText(title, description);
    if (!textModeration.approved) {
      console.warn('Post rechazado por moderación de texto:', textModeration.reason);
      return res.status(400).json({ 
        error: 'Contenido no permitido', 
        details: textModeration.reason 
      });
    }

    // PASO 2: Moderación y Validación del Archivo de Imagen
    if (req.file) {
      const imageModeration = moderateImageBuffer(req.file);
      if (!imageModeration.approved) {
        console.warn('Imagen rechazada por moderación de archivo:', imageModeration.reason);
        return res.status(400).json({ 
          error: 'Imagen no válida', 
          details: imageModeration.reason 
        });
      }

      console.log('Archivo validado, subiendo a Cloudinary con filtros de seguridad...');
      try {
        const result = await uploadImage(req.file);
        imageUrl = result.secure_url;
        console.log('Imagen subida y aprobada con éxito:', imageUrl);
      } catch (cloudinaryError) {
        console.error('Error en servicio de Cloudinary / Moderación:', cloudinaryError.message);
        return res.status(400).json({ 
          error: 'Error al moderar o procesar la imagen', 
          details: cloudinaryError.message 
        });
      }
    }

    if (!imageUrl) {
      return res.status(400).json({ error: 'La fotografía de la prenda es obligatoria' });
    }

    const newPost = {
      title,
      description: description || '',
      lockerZone: lockerZone || 'CUALTOS - General',
      imageUrl,
      authorId: uid,
      authorName: name || 'Usuario',
      authorEmail: email,
      authorPhotoURL: picture || tokenPhotoURL || '',
      likesCount: 0,
      commentsCount: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    console.log('Guardando en Firestore...');
    const docRef = await db.collection('posts').add(newPost);
    console.log('Post guardado con ID:', docRef.id);
    
    res.status(201).json({ id: docRef.id, ...newPost });
  } catch (error) {
    console.error('Error general en createPost:', error);
    res.status(500).json({ error: 'Error interno del servidor al crear el post', details: error.message });
  }
};

// 2. Obtener todos los posts (Feed)
exports.getPosts = async (req, res) => {
  try {
    // Añadimos un límite de 50 posts para evitar el error 413 de Vercel
    const snapshot = await db.collection('posts')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();
    const posts = [];
    snapshot.forEach(doc => {
      posts.push({ id: doc.id, ...doc.data() });
    });
    res.status(200).json(posts);
  } catch (error) {
    console.error('Error al obtener posts:', error);
    res.status(500).json({ error: 'Error al obtener el feed' });
  }
};

// 2.1 Obtener mis propios posts
exports.getMyPosts = async (req, res) => {
  try {
    const { uid } = req.user;
    
    // Quitamos el orderBy de la consulta de Firestore para evitar errores de índice
    const snapshot = await db.collection('posts')
      .where('authorId', '==', uid)
      .get();
      
    const posts = [];
    snapshot.forEach(doc => {
      posts.push({ id: doc.id, ...doc.data() });
    });

    // Ordenamos manualmente por fecha descendente
    posts.sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });

    res.status(200).json(posts);
  } catch (error) {
    console.error('Error al obtener mis posts:', error);
    res.status(500).json({ error: 'Error al obtener tus prendas' });
  }
};

// 3. Alternar Like (Like/Unlike)
exports.toggleLike = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const { uid: userId } = req.user;

    const likeId = `${userId}_${postId}`;
    const likeRef = db.collection('likes').doc(likeId);
    const postRef = db.collection('posts').doc(postId);

    const likeDoc = await likeRef.get();

    if (likeDoc.exists) {
      // Si existe, quitar like
      await likeRef.delete();
      await postRef.update({
        likesCount: admin.firestore.FieldValue.increment(-1)
      });
      res.json({ liked: false });
    } else {
      // Si no existe, agregar like
      await likeRef.set({ userId, postId, createdAt: admin.firestore.FieldValue.serverTimestamp() });
      await postRef.update({
        likesCount: admin.firestore.FieldValue.increment(1)
      });
      res.json({ liked: true });
    }
  } catch (error) {
    console.error('Error en toggleLike:', error);
    res.status(500).json({ error: 'Error al procesar el like' });
  }
};

// 4. Agregar un comentario
exports.addComment = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const { content } = req.body;
    const { uid: userId, name: userName } = req.user;

    if (!content) {
      return res.status(400).json({ error: 'El comentario no puede estar vacío' });
    }

    const comment = {
      postId,
      userId,
      userName: userName || 'Usuario',
      content,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('comments').add(comment);
    await db.collection('posts').doc(postId).update({
      commentsCount: admin.firestore.FieldValue.increment(1)
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error('Error al añadir comentario:', error);
    res.status(500).json({ error: 'Error al añadir comentario' });
  }
};

// 5. Obtener comentarios de un post
exports.getComments = async (req, res) => {
  try {
    const { id: postId } = req.params;
    console.log('Solicitando comentarios para post:', postId);

    if (!db) {
      throw new Error('Base de datos no inicializada');
    }

    const snapshot = await db.collection('comments')
      .where('postId', '==', postId)
      .get();

    const comments = [];
    snapshot.forEach(doc => {
      comments.push({ id: doc.id, ...doc.data() });
    });

    res.status(200).json(comments);
  } catch (error) {
    console.error('Error CRÍTICO en getComments:', error.message);
    res.status(500).json({ error: 'Error en el servidor', details: error.message });
  }
};
