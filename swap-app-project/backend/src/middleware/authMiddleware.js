const admin = require('firebase-admin');

const verifyToken = async (req, res, next) => {
  // 1. Buscamos el token en los headers (Authorization: Bearer <token>)
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado. Falta token.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // 2. Verificamos el token con Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // 3. ¡Éxito! Guardamos los datos del usuario dentro de la petición (req)
    // Así, en las siguientes funciones sabremos quién es "req.user"
    req.user = decodedToken; 
    
    next(); // Dejamos pasar la petición al siguiente paso
  } catch (error) {
    console.error('Error verificando token:', error);
    return res.status(403).json({ error: 'Token inválido o expirado.' });
  }
};

module.exports = verifyToken;