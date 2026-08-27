require('dotenv').config({ path: "../.env" }); // Carga las variables de entorno desde el archivo .env
const express = require('express');
const cors = require('cors');

const { login, register, getUser, getUserByUsername, getUserByToken, getUsers, getConfig, changeConfig, changeProfile, reportUser } = require('./controllers/userController');
const { changeRole, deleteUser, getReports, getReportDetail, resolveReport } = require('./controllers/adminController');

const { getCourses, getUserProgress, registerCourse, } = require('./controllers/coursesController');
const { getUserStats, changeGoal } = require('./controllers/streakController');
const { createFolder, updateFolder, deleteFolder, getFolderFiles } = require('./controllers/folderController');
const { uploadFileInFolder, deleteFileFromFolder, getFileUrlFromFolder } = require('./controllers/fileController');
const { searchCommunity, searchThread, createThread, createResponse, searchResponses } = require('./controllers/communityController');

const { connectMongo } = require('./config/mongodb');

const { postResponseLog } = require('./middlewares/binnacleHelper');
const { checkFilesUpload } = require('./middlewares/checkFiles');
const { checkRequestDataSize } = require('./middlewares/checkReq');
const isAuth = require('./middlewares/isAuth');
const checkToken = require('./middlewares/checkToken');

const server = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000'
]; // Origenes permitidos para CORS

server.set('trust proxy', true); // Confía en el proxy para obtener la IP real del cliente

server.use(checkRequestDataSize()); // Verifica el tamaño de los datos del request
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
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// 'postResponseLog' es un middleware para registrar en la bitácora después de cada respuesta

server.get('/', (req, res) => { res.status(200).send('Bienvenido a la API de Knowbeat!'); });

// Users
server.post('/register', postResponseLog, register);
server.post('/login', postResponseLog, login);
server.get('/user/get/user/:id', checkToken, isAuth, getUser);
server.get('/user/get/user/username/:username', checkToken, isAuth, getUserByUsername);
server.get('/user/get/users', checkToken, isAuth, getUsers);
server.get('/user/get/config', checkToken, isAuth, getConfig);
server.patch('/user/update/config', postResponseLog, checkToken, isAuth, changeConfig);

// Files
server.patch('/user/update/profile', postResponseLog, checkToken, isAuth, checkFilesUpload('profile_picture', 1), changeProfile);
server.post('/user/create/folder/:folder_name', postResponseLog, checkToken, isAuth, createFolder);
server.patch('/user/update/folder', postResponseLog, checkToken, isAuth, updateFolder);
server.delete('/user/delete/folder/:folder_name', postResponseLog, checkToken, isAuth, deleteFolder);
server.get('/user/get/folder/files/:folder_name', checkToken, isAuth, getFolderFiles);
server.post('/user/upload/file/:folder_id', postResponseLog, checkToken, isAuth, checkFilesUpload('folder_file', 1), uploadFileInFolder);
server.delete('/user/delete/file/:file_id/:folder_id', postResponseLog, checkToken, isAuth, deleteFileFromFolder);
server.get('/user/get/file/:file_id/:folder_id', checkToken, isAuth, getFileUrlFromFolder);
server.post('/user/report', postResponseLog, checkToken, isAuth, reportUser);

// Community
server.get('/community/search', checkToken, isAuth, searchCommunity);
server.get('/community/search/thread/:thread_id', checkToken, isAuth, searchThread);
server.post('/community/create/thread', postResponseLog, checkToken, isAuth, createThread);
server.post('/community/create/response/:thread_id', postResponseLog, checkToken, isAuth, createResponse);
server.get('/community/search/thread/:thread_id/responses', checkToken, isAuth, searchResponses);

// Admins
server.patch('/user/update/role/:id', postResponseLog, checkToken, isAuth, changeRole);
server.patch('/user/delete/user/:id', postResponseLog, checkToken, isAuth, deleteUser);
server.get('/admin/reports', postResponseLog, checkToken, isAuth, getReports);
server.get('/admin/reports/:id', postResponseLog, checkToken, isAuth, getReportDetail);
server.patch('/admin/reports/:id', postResponseLog, checkToken, isAuth, resolveReport);

// Courses
server.get('/course/get/courses', checkToken, isAuth, getCourses);
server.get('/user/get/progress', checkToken, isAuth, getUserProgress);
server.post('/user/register/course/:id', postResponseLog, checkToken, isAuth, registerCourse);

// Streak & Score
server.get('/user/get/stats', checkToken, isAuth, getUserStats)
server.patch('/user/update/goal', postResponseLog, checkToken, isAuth, changeGoal)

// Token
server.get('/token/get/user', checkToken, getUserByToken)

server.listen(PORT, async () => {
  console.log('La API está corriendo en el puerto ', PORT);
  try {
    await connectMongo();
  } catch (err) { console.error("Failed to start MongoDB:", err); }

  await require('./config/createRoles')();
  await require('./config/createPermissions')();
  await require('./config/createAdmin')();
});
