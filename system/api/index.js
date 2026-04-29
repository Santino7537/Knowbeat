require('dotenv').config(); // Carga las variables de entorno desde el archivo .env

const express = require('express');
const cors = require('cors');
const { login, register, getUsers, deleteUser } = require('./controllers/userController');
const isAdmin = require('./middlewares/isAdmin');

const server = express();
const PORT = process.env.PORT || 3000

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000'
]; // Origenes permitidos para CORS

server.use(express.json({ limit: '100kb' })); // Limita el tamaño del body a 100kb
server.use(express.urlencoded({ limit: '100kb', extended: true })); // Limita el tamaño del body a 100kb para datos codificados en URL

server.use(cors({ // No permite solicitudes de otros orígenes que no estén en la lista de allowedOrigins
  origin: function (origin, callback) {
    if (allowedOrigins.includes(origin)) { // Se puede agregar "!origin ||" para testeos 
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));


server.get('/', (req, res) => {
    res.status(200).send('Bienvenido a la API de Knowbeat!');
});

server.post('/login', login)
server.post('/register', register)

server.get('/users', getUsers);

// DELETE /users/:id (Momentaneo)
// En HEADERS x-user-id: 1 (para testing, se tiene que cambiar despues)

server.delete('/delUsers/:id', isAdmin, deleteUser);

server.listen(PORT, async () => {
    console.log('La API está corriendo en el puerto ', PORT);
})