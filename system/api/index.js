require('dotenv').config(); // Carga las variables de entorno desde el archivo .env

const express = require('express');
const cors = require('cors');

const { login, register, getUsers, changeConfig, changeProfile } = require('./controllers/userController');
const { changeRole, deleteUser } = require('./controllers/adminController');
const { getCourses, getUserProgress, registerCourse, } = require('./controllers/coursesController');

const { PostResponseLog } = require('./middlewares/binnacleHelper');

const isAuth = require('./middlewares/isAuth');
const checkToken = require('./middlewares/checkToken');

const server = express();
const PORT = process.env.PORT || 3000;

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
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', "x-forwarded-for"],
  credentials: true
}));

// 'PostResponseLog' es un middleware para registrar en la bitácora después de cada respuesta


server.get('/', (req, res) => {
  res.status(200).send('Bienvenido a la API de Knowbeat!');
});

// Users
server.post('/register', PostResponseLog, register);
server.post('/login', PostResponseLog, login);
server.get('/user/get/users', checkToken, isAuth, getUsers);
server.patch('/user/update/config', PostResponseLog, checkToken, isAuth, changeConfig)

//Admins
server.patch('/user/update/role/:id', PostResponseLog, checkToken, isAuth, changeRole)
server.patch('/user/delete/user/:id', PostResponseLog, checkToken, isAuth, deleteUser);

//Courses
server.get('/course/get/courses', checkToken, isAuth, getCourses);
server.get('/user/get/progress', checkToken, isAuth, getUserProgress);
server.post('/user/register/course/:id', PostResponseLog, checkToken, isAuth, registerCourse);
server.patch('/user/update/profile', PostResponseLog, checkToken, isAuth, changeProfile);

server.listen(PORT, async () => {
  console.log('La API está corriendo en el puerto ', PORT);
  await require('./config/createRoles')();
  await require('./config/createPermissions')();
  await require('./config/createAdmin')();
});
