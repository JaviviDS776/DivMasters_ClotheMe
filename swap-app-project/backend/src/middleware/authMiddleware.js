const admin = require('firebase-admin');

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado. Falta token.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // VALIDACIÓN DE DOMINIO: Solo permitir correos institucionales
    if (!decodedToken.email || !decodedToken.email.endsWith('@alumnos.udg.mx')) {
      // Nota: Si estás en desarrollo, podrías querer comentar esta línea o permitir tu propio correo
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ error: 'Acceso restringido a correos @alumnos.udg.mx' });
      }
    }

    req.user = decodedToken; 
    next();
  } catch (error) {
    console.error('Error verificando token:', error);
    return res.status(403).json({ error: 'Token inválido o expirado.' });
  }
};

const verifyAdmin = async (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });

  try {
    const userDoc = await admin.firestore().collection('users').doc(req.user.uid).get();
    if (userDoc.exists && userDoc.data().role === 'admin') {
      next();
    } else {
      res.status(403).json({ error: 'Se requieren permisos de administrador' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error al verificar permisos' });
  }
};

module.exports = { verifyToken, verifyAdmin };