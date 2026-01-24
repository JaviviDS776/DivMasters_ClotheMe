require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
//const { initializeFirebase } = require('./src/services/firebaseService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
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
