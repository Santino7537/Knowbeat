require('dotenv').config({ path: "../.env" }); // Carga las variables de entorno desde el archivo .env
const express = require('express');
const cors = require('cors');

const { login, register, getUserById, getUserByUsername, getUserByToken, getUsers, getConfig, changeConfig, changeProfile, reportUser } = require('./controllers/userController');
const { changeRole, deleteUser } = require('./controllers/adminController');
const { getReports, getReportDetail, resolveReport, revokeSanction } = require('./controllers/moderationController');
const { verifyAdminPassword, getAdminSession, revokeAdminSession, logout } = require('./controllers/adminAccessController');

const { getCourses, getUserProgress, registerCourse, updateUserProgress } = require('./controllers/coursesController');
const { getUserStats, getUserScoreHistory, changeGoal } = require('./controllers/streakController');
const { createFolder, updateFolder, deleteFolder, getFolders, getFolderFiles, shareFolder, unshareFolder } = require('./controllers/folderController');
const { uploadFileInFolder, deleteFileFromFolder, getFileUrlFromFolder } = require('./controllers/fileController');
const { searchCommunity, searchThread, createThread, createResponse, searchResponses, likePublication, getPublicationLike } = require('./controllers/communityController');
const { getFriendshipRequests, getFriends, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, cancelFriendRequest, deleteFriendship } = require('./controllers/friendshipController');
const { getMessages, sendMessage, markMessagesAsRead } = require('./controllers/chatController');

const { createServer } = require('http');
const { connectMongo } = require('./config/mongodb');
const { initSocket } = require('./config/socket');

const { postResponseLog } = require('./middlewares/binnacleHelper');
const { checkFilesUpload } = require('./middlewares/checkFiles');
const { checkRequestDataSize } = require('./middlewares/checkReq');
const isAuth = require('./middlewares/isAuth');
const checkToken = require('./middlewares/checkToken');
const requireAdminAccess = require('./middlewares/requireAdminAccess');

const server = express();
const httpServer = createServer(server);
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
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-Authorization'],
  credentials: true
}));

// 'postResponseLog' es un middleware para registrar en la bitácora después de cada respuesta

server.get('/', (req, res) => { res.status(200).send('Bienvenido a la API de Knowbeat!'); });

// Users
server.post('/register', postResponseLog, register);
server.post('/login', postResponseLog, login);
server.post('/user/logout', postResponseLog, checkToken, logout);
server.get('/user/get/user/:id', checkToken, isAuth, getUserById);
server.get('/user/get/user/username/:username', checkToken, isAuth, getUserByUsername);
server.get('/user/get/users', checkToken, isAuth, requireAdminAccess, getUsers);
server.get('/user/get/config', checkToken, isAuth, getConfig);
server.patch('/user/update/config', postResponseLog, checkToken, isAuth, changeConfig);

// Files
server.patch('/user/update/profile', postResponseLog, checkToken, isAuth, checkFilesUpload('profile_picture', 1), changeProfile);
server.post('/user/create/folder/:folder_name', postResponseLog, checkToken, isAuth, createFolder);
server.patch('/user/update/folder', postResponseLog, checkToken, isAuth, updateFolder);
server.delete('/user/delete/folder/:folder_name', postResponseLog, checkToken, isAuth, deleteFolder);
server.get('/user/get/folders', checkToken, isAuth, getFolders);
server.get('/user/get/folder/files/:folder_name', checkToken, isAuth, getFolderFiles);
server.post('/user/share/folder/:folder_id', postResponseLog, checkToken, isAuth, shareFolder);
server.delete('/user/unshare/folder/:folder_id/:user_id', postResponseLog, checkToken, isAuth, unshareFolder);
server.post('/user/upload/file/:folder_id', postResponseLog, checkToken, isAuth, checkFilesUpload('folder_file', 1), uploadFileInFolder);
server.delete('/user/delete/file/:file_id/:folder_id', postResponseLog, checkToken, isAuth, deleteFileFromFolder);
server.get('/user/get/file/:file_id/:folder_id', checkToken, isAuth, getFileUrlFromFolder);
server.post('/user/report', postResponseLog, checkToken, isAuth, reportUser);

// Community
server.get('/community/search', checkToken, isAuth, searchCommunity);
server.get('/community/search/thread/:thread_id', checkToken, isAuth, searchThread);
server.post('/community/create/thread', postResponseLog, checkToken, isAuth, createThread);
server.post('/community/create/response/:thread_id', postResponseLog, checkToken, isAuth, createResponse);
server.get('/community/like/thread/:publication_id', checkToken, isAuth, getPublicationLike('thread'));
server.get('/community/like/response/:publication_id', checkToken, isAuth, getPublicationLike('response'));
server.patch('/community/like/thread/:publication_id', postResponseLog, checkToken, isAuth, likePublication('thread'));
server.patch('/community/like/response/:publication_id', postResponseLog, checkToken, isAuth, likePublication('response'));
server.get('/community/search/thread/:thread_id/responses', checkToken, isAuth, searchResponses);

// Friends
server.get('/friend/requests', checkToken, isAuth, getFriendshipRequests);
server.get('/friend/list', checkToken, isAuth, getFriends);
server.post('/friend/request/:user_id', postResponseLog, checkToken, isAuth, sendFriendRequest);
server.patch('/friend/request/:request_id/accept', postResponseLog, checkToken, isAuth, acceptFriendRequest);
server.patch('/friend/request/:request_id/reject', postResponseLog, checkToken, isAuth, rejectFriendRequest);
server.patch('/friend/request/:request_id/cancel', postResponseLog, checkToken, isAuth, cancelFriendRequest);
server.delete('/friend/:friendship_id', postResponseLog, checkToken, isAuth, deleteFriendship);

// Chats
server.post('/chat/send', postResponseLog, checkToken, isAuth, sendMessage);
server.get('/chat/:friendship_id/messages', checkToken, isAuth, getMessages);
server.patch('/chat/:friendship_id/read', postResponseLog, checkToken, isAuth, markMessagesAsRead);

// Courses
server.get('/course/get/courses', checkToken, isAuth, getCourses);
server.get('/user/get/progress', checkToken, isAuth, getUserProgress);
server.post('/user/register/course/:id', postResponseLog, checkToken, isAuth, registerCourse);
server.patch('/user/update/progress/:id', postResponseLog, checkToken, isAuth, updateUserProgress);

// Streak & Score
server.get('/user/get/stats', checkToken, isAuth, getUserStats)
server.get('/user/get/score/history', checkToken, isAuth, getUserScoreHistory)
server.patch('/user/update/goal', postResponseLog, checkToken, isAuth, changeGoal)

// Administrative re-authentication and temporary access
server.post('/admin/reauth', postResponseLog, checkToken, verifyAdminPassword);
server.get('/admin/session', checkToken, requireAdminAccess, getAdminSession);
server.delete('/admin/session', checkToken, revokeAdminSession);

// Administrative endpoints
server.get('/admin/reports', postResponseLog, checkToken, isAuth, requireAdminAccess, getReports);
server.get('/admin/reports/:id', postResponseLog, checkToken, isAuth, requireAdminAccess, getReportDetail);
server.patch('/admin/reports/:id', postResponseLog, checkToken, isAuth, requireAdminAccess, resolveReport);
server.patch('/admin/sanctions/user/:id/revoke', postResponseLog, checkToken, isAuth, requireAdminAccess, revokeSanction);
server.patch('/user/update/role/:id', postResponseLog, checkToken, isAuth, requireAdminAccess, changeRole);
server.patch('/user/delete/user/:id', postResponseLog, checkToken, isAuth, requireAdminAccess, deleteUser);

// Token
server.get('/token/get/user', checkToken, getUserByToken)

httpServer.listen(PORT, async () => {
  console.log('La API está corriendo en el puerto ', PORT);
  initSocket(httpServer, allowedOrigins);

  try {
    await connectMongo();
  } catch (err) { console.error("Failed to start MongoDB:", err); }

  await require('./config/createRoles')();
  await require('./config/createPermissions')();
  await require('./config/createAdmin')();
  await require('./config/createCourses')();
});
