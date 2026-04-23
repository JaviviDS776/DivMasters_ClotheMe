require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const { Server } = require('socket.io');
const setupSocket = require('./src/socket/socketManager');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;
const verifyToken = require('./src/middleware/authMiddleware');

const allowedOrigins = [
  'http://localhost:5173', 
  'https://swapappfrontend.vercel.app',
  'https://swapappfrontend.vercel.app/'
];

app.use(cors({
  origin: function (origin, callback) {
    const sanitizedOrigin = origin ? origin.replace(/\/$/, '') : null;
    const isAllowed = !sanitizedOrigin || 
                     allowedOrigins.some(o => o.replace(/\/$/, '') === sanitizedOrigin) || 
                     process.env.NODE_ENV !== 'production';
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(helmet());
app.use(express.json());

// Inicializar Firebase
require('./src/services/firebaseService');

// Inicializar Socket.io
setupSocket(server);

// --- DEFINICIÓN EXPLÍCITA DE RUTAS ---
const exchangeRoutes = require('./src/routes/exchangeRoutes');
const lockerRoutes = require('./src/routes/lockerRoutes');
const postRoutes = require('./src/routes/postRoutes');
const userRoutes = require('./src/routes/userRoutes');
const chatRoutes = require('./src/routes/chatRoutes');

app.use('/api/exchanges', exchangeRoutes);
app.use('/api/locker', lockerRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);

app.get('/', (req, res) => {
  res.send('👕 SwapApp API is running...');
});

app.get('/api/ping-protected', verifyToken, (req, res) => {
  res.json({ 
    success: true, 
    message: `¡Conexión Exitosa!`,
    uid: req.user.uid
  });
});

server.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en puerto ${PORT}`);
});

module.exports = app;
