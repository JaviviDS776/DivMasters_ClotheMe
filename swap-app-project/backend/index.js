require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
//const { initializeFirebase } = require('./src/services/firebaseService');

const app = express();
const PORT = process.env.PORT || 3000;
const verifyToken = require('./src/middleware/authMiddleware');

const allowedOrigins = [
  'http://localhost:5173'
];

// Middlewares
app.use(cors(
  {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}
));
app.use(helmet());
app.use(express.json());

// Inicializar Firebase
//initializeFirebase();
require('./src/services/firebaseService');

// Rutas (Placeholders)
app.use('/api/exchanges', require('./src/routes/exchangeRoutes'));
app.use('/api/locker', require('./src/routes/lockerRoutes'));

app.get('/', (req, res) => {
  res.send('👕 SwapApp API is running...');
});

app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en puerto ${PORT}`);
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`✅ Servidor local corriendo en http://localhost:${PORT}`);
  });
}

app.get('/api/ping-protected', verifyToken, (req, res) => {
  // Si llega aquí, es que el token era válido
  console.log("¡Petición recibida de:", req.user.email);
  
  res.json({ 
    success: true, 
    message: `¡Conexión Exitosa! El servidor reconoce a: ${req.user.email}`,
    uid: req.user.uid
  });
});


module.exports = app; // <--- ESTO ES CRUCIAL PARA VERCEL