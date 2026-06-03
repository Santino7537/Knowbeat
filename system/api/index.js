require('dotenv').config(); // Carga las variables de entorno desde el archivo .env

const express = require('express');
const cors = require('cors');

const { login, register, getUsers, changeConfig } = require('./controllers/userController');
const { changeRole, deleteUser } = require('./controllers/adminController');
const { getCourses, getUserProgress, registerCourse, } = require('./controllers/coursesController');

const { PostResponseLog } = require('./middlewares/binnacleHelper');

const isAdmin = require('./middlewares/isAdmin');
const checkToken = require('./middlewares/checkToken');

const server = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000'
]; // Origenes permitidos para CORS

server.use(express.json({ limit: '100kb' })); // Limita el tamaño del body a 100kb
server.use(express.urlencoded({ limit: '100kb', extended: true })); // Limita el tamaño del body a 100kb para datos codificados en URL
server.use(PostResponseLog); // Middleware para registrar en la bitácora después de cada respuesta

server.use(cors({ // No permite solicitudes de otros orígenes que no estén en la lista de allowedOrigins
    origin: function (origin, callback) {
        if (allowedOrigins.includes(origin)) { // Se puede agregar "!origin ||" para testeos 
            callback(null, true);
        } else {
            callback(new Error('No permitido por CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id'],
    credentials: true
}));


server.get('/', (req, res) => {
    res.status(200).send('Bienvenido a la API de Knowbeat!');
});

// Users
server.get('/users', checkToken, getUsers);
server.post('/login', login);
server.post('/register', register);
server.patch('/changeConfig', checkToken, changeConfig)

//Admins
server.patch('/changeRole/:id', checkToken, isAdmin, changeRole)
server.patch('/delUsers/:id', checkToken, isAdmin, deleteUser);

//Courses
server.get('/courses', checkToken, getCourses);
server.get('/progress', checkToken, getUserProgress);
server.post('/registerCourse/:id', checkToken, registerCourse);

server.listen(PORT, async () => {
    console.log('La API está corriendo en el puerto ', PORT);
    await require('./config/createRoles')();
    await require('./config/createPermissions')();
    await require('./config/createAdmin')();
});
