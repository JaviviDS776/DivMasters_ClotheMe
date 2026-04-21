const { db, admin } = require('../services/firebaseService');
const { uploadImage } = require('../services/cloudinaryService');

// 1. Crear un nuevo post
exports.createPost = async (req, res) => {
  try {
    const { title, description } = req.body;
    const { uid, name, email } = req.user; // Obtenido del authMiddleware
    let imageUrl = req.body.imageUrl;

    console.log('--- Iniciando creación de post ---');
    console.log('Datos recibidos:', { title, description });
    console.log('Usuario:', { uid, name, email });

    if (!title) {
      console.log('Error: Título faltante');
      return res.status(400).json({ error: 'Título es obligatorio' });
    }

    if (req.file) {
      console.log('Archivo recibido, subiendo a Cloudinary...');
      try {
        const result = await uploadImage(req.file);
        imageUrl = result.secure_url;
        console.log('Imagen subida con éxito:', imageUrl);
      } catch (cloudinaryError) {
        console.error('Error detallado de Cloudinary:', cloudinaryError);
        return res.status(500).json({ error: 'Error al procesar la imagen en el servidor', details: cloudinaryError.message });
      }
    }

    if (!imageUrl) {
      console.log('Error: URL de imagen faltante');
      return res.status(400).json({ error: 'Imagen es obligatoria' });
    }

    const newPost = {
      title,
      description: description || '',
      imageUrl,
      authorId: uid,
      authorName: name || 'Usuario',
      authorEmail: email,
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
    const snapshot = await db.collection('posts').orderBy('createdAt', 'desc').get();
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
