const { USER_ROLE, ROLES_PERMISSIONS, PENALTY_DATE, CONFIG_JSON, ALLOWED_CONFIGS } = require('../constants');
const { computeDVHFromObject } = require('../utils/dvhHelpers');
const { convertImageToWebP, resizeImage } = require('../utils/fileChecker');
const { getPublicFileUrl, uploadFile, deleteFile } = require('./bucketController');
const { fileTypeFromBuffer } = require('file-type');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs/promises');
const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SECRET = process.env.SECRET;

const login = async (req, res) => {
  const { username, password } = req.body;

  if (password) req.body.password = "[REDACTED]"; // Para no guardar la contraseña en la bitácora

  if (!username || !password) {
    return res.status(400).json({ message: 'Nombre de usuario o contraseña faltante' });
  }

  let user;

  // Comprueba si el usuario existe y obtiene su información
  try {
    [user] = await db.query('SELECT * FROM User WHERE username = ?;', [username]);
    if (user.length === 0) return res.status(400).json({ message: 'Usuario o contraseña incorrecta' });
    user = user[0];
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener usuario' });
  }

  // Comprueba si la contraseña es correcta
  const compare = await bcrypt.compare(password, user.password);
  if (!compare) return res.status(400).json({ message: 'Usuario o contraseña incorrecta' });

  const token = jwt.sign({ user_id: user.id }, SECRET, { expiresIn: '8h' });
  res.json({ message: 'Logueo exitoso!', token });
};

const register = async (req, res) => {

  const { email, username, password } = req.body;

  if (password) req.body.password = "[REDACTED]"; // Para no guardar la contraseña en la bitácora

  if (!username || !password || !email) {
    return res.status(400).json({ message: 'Nombre de usuario, contraseña o email faltante' });
  }

  // Preparar campos para la creación del usuario
  // Detectamos el idioma desde el header antes del INSERT

  const langHeader = req.headers['accept-language'] || 'es';
  const detectedLang = langHeader.startsWith('en') ? 'en-US' : 'es-AR';

  // 1. Convertimos el string a OBJETO para poder editarlo
  const config = JSON.parse(CONFIG_JSON);

  // 2. Modificamos la propiedad en el objeto
  config.appearance = config.appearance || {};
  config.appearance.language = detectedLang;

  // 3. Volvemos a convertir el objeto a STRING para guardarlo en la BD
  const config_json = JSON.stringify(config);

  // Se crea el JSON que contiene la configuración del usuario:

  // Comprueba si el nombre de usuario e email ya existen
  try {
    const [existingUsername] = await db.query('SELECT id FROM User WHERE username = ?;', [username]);
    if (existingUsername.length !== 0) return res.status(400).json({ message: 'El nombre de usuario ya está registrado' });
  } catch (error) {
    return res.status(500).json({ error: 'Error al comprobar nombre de usuario' });
  }

  try {
    const [existingMail] = await db.query('SELECT id FROM User WHERE email = ?;', [email]);
    if (existingMail.length !== 0) return res.status(400).json({ message: 'El email ya está registrado' });
  } catch (error) {
    return res.status(500).json({ error: 'Error al comprobar email' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  let userPayload = {
    role_id: Object.keys(ROLES_PERMISSIONS).indexOf(USER_ROLE) + 1,
    username,
    email,
    password: hashedPassword,
    picture: `${process.env.MINIO_PUBLIC_URL}/profiles/default_profile.webp`,
    streak: 0,
    score: 0,
    configuration: config_json,
    penalty_date: PENALTY_DATE,
    eliminated: 0
  };

  userPayload.dvh = computeDVHFromObject(userPayload);

  // Crea el usuario en la base de datos
  let dbResult;
  try {
    const [result] = await db.query(
      'INSERT INTO User (role_id, username, email, password, picture, streak, score, configuration, penalty_date, eliminated, dvh) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);',
      Object.values(userPayload)
    );
    dbResult = result;
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Error al crear usuario' });
  }

  res.status(201).json({
    message: 'Registro exitoso',
    user: {
      id: dbResult.insertId,
      username: userPayload.username,
      email: userPayload.email,
      picture: userPayload.picture
    }
  });
};

const getUser = async (req, res) => {
  const username = req.params.username

  try {
    let [user] = await db.query('SELECT * FROM User WHERE eliminated = 0 && username = ?', [username]);
    if (user.length === 1) {
      user = user[0]
      user.picture = getPublicFileUrl("profiles", user.picture);
      return res.status(200).json(user);
    }
    return res.status(400).json({ message: `No existe el usuario con nombre ${username}` })

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }

};

const getUserByToken = async (req, res) => {
  const userId = req.user.user_id

  try {
    let [user] = await db.query('SELECT picture, username, biography FROM User WHERE eliminated = 0 && id = ?', [userId]);
    if (user.length === 1) {
      user = user[0]
      user.picture = getPublicFileUrl("profiles", user.picture);
      return res.status(200).json(user);
    }
    return res.status(400).json({ message: `No existe el usuario con id ${userId}` })

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }

};

const getUsers = async (req, res) => {

  try {
    const [rows] = await db.query('SELECT * FROM User WHERE eliminated = 0');
    rows.forEach(obj => { obj.picture = getPublicFileUrl("profiles", obj.picture); });
    res.json(rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }

};

const getConfig = async (req, res) => {

  try {
    const [user] = await db.query('SELECT configuration FROM User WHERE id = ?', [req.user.user_id]);
    res.json(user[0].configuration);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener la configuración del usuario' });
  }

};

const changeConfig = async (req, res) => {

  function iterate(obj, path = "") {

    for (const [reg, value] of Object.entries(obj)) {

      const newPath = path ? `${path}.${reg}` : reg;

      if (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
      ) {

        return iterate(value, newPath);

      } else {

        return {
          type: newPath,
          content: value
        };

      }
    }
  }

  req.actions_data = {};

  const userId = req.user.user_id;

  const result = iterate(req.body);

  if (!result) {
    return res.status(400).json({
      error: 'Configuración inválida'
    });
  }

  const configType = result.type;
  const configValue = result.content;

  if (!(configType in ALLOWED_CONFIGS)) {
    return res.status(400).json({
      error: 'Configuración no permitida'
    });
  }

  if (typeof configValue !== ALLOWED_CONFIGS[configType]) {
    return res.status(400).json({
      error: 'Tipo de dato inválido'
    });
  }

  try {

    // Obtener usuario actual
    let [userPayload] = await db.query(
      'SELECT * FROM User WHERE id = ?',
      [userId]
    );

    if (userPayload.length === 0) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    userPayload = userPayload[0];

    const oldDvh = userPayload.dvh;

    // Parsear configuración actual
    let configuration = userPayload.configuration;

    if (typeof configuration === 'string') {
      configuration = JSON.parse(configuration);
    }

    // Navegar hasta la propiedad a modificar
    const keys = configType.split('.');

    let current = configuration;

    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = configValue;

    // Actualizar configuración en el payload
    userPayload.configuration = configuration;

    // Recalcular DVH
    delete userPayload.dvh;

    const newDvh = ComputeDVHFromObject(userPayload);

    userPayload.dvh = newDvh;

    // Preparar acción para la bitácora
    req.actions_data["update-config"] = {
      entity: "User",
      record_id: userId,
      action: "update",
      old_dvh: oldDvh,
      new_dvh: newDvh
    };

    // Actualizar BD
    await db.query(
      `UPDATE User
       SET configuration = ?, dvh = ?
       WHERE id = ?`,
      [
        JSON.stringify(configuration),
        newDvh,
        userId
      ]
    );

    res.status(200).json({
      message: 'Se cambió la configuración exitosamente'
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: 'Error al cambiar la configuración del usuario'
    });

  }
};

const changeProfile = async (req, res) => {
  const { username, email, password, biography } = req.body;
  const file = req.files?.[0];
  req.actions_data = {};

  if (password) req.body.password = "[REDACTED]"; // Para no guardar la contraseña en la bitácora

  const updateFields = [];
  let [userPayload] = await db.query('SELECT * FROM User WHERE id = ?;', [req.user.user_id]);
  userPayload = userPayload[0]
  if (username) {
    try {
      const [existingUsername] = await db.query('SELECT id FROM User WHERE username = ?;', [username]);
      if (existingUsername.length !== 0) return res.status(400).json({ message: 'El nombre de usuario ya está registrado' });
    } catch (error) {
      return res.status(500).json({ error: 'Error al comprobar el nombre de usuario' });
    }
    req.actions_data["update-username"] = {
      entity: "User",
      record_id: req.user.user_id,
      action: "update",
      "old_dvh": userPayload.dvh,
      "new_dvh": null
    };
    userPayload.username = username;
    updateFields.push("username");
  }

  if (email) {
    try {
      const [existingEmail] = await db.query('SELECT id FROM User WHERE email = ?;', [email]);
      if (existingEmail.length !== 0) return res.status(400).json({ message: 'El email ya está registrado' });
    } catch (error) {
      return res.status(500).json({ error: 'Error al comprobar el email' });
    }
    req.actions_data["update-email"] = {
      entity: "User",
      record_id: req.user.user_id,
      action: "update",
      "old_dvh": userPayload.dvh,
      "new_dvh": null
    };
    userPayload.email = email;
    updateFields.push("email");
  }

  if (password) {
    const HashedPassword = await bcrypt.hash(password, 10);
    req.actions_data["update-password"] = {
      entity: "User",
      record_id: req.user.user_id,
      action: "update",
      "old_dvh": userPayload.dvh,
      "new_dvh": null
    };
    userPayload.password = HashedPassword;
    updateFields.push("password");
  }

  if (biography) {
    req.actions_data["update-biography"] = {
      entity: "User",
      record_id: req.user.user_id,
      action: "update",
      "old_dvh": userPayload.dvh,
      "new_dvh": null
    };
    userPayload.biography = biography;
    updateFields.push("biography");
  }
  if (file) {
    const filePath = file.path;

    try {
      const buffer = await fs.readFile(filePath);
      const picturePath = await uploadFile("profiles", await resizeImage(await convertImageToWebP(buffer), 512, 512), `${uuidv4()}.webp`, "image/webp");
      userPayload.picture !== "default_profile.webp" && await deleteFile("profiles", userPayload.picture)

      req.actions_data["update-picture"] = {
        entity: "User",
        record_id: req.user.user_id,
        action: "update",
        "old_dvh": userPayload.dvh,
        "new_dvh": null
      };
      userPayload.picture = picturePath;
      updateFields.push("picture");
    } catch (err) {
      return res.status(400).json({ message: err.message });
    } finally {
      if (filePath) {
        try {
          await fs.unlink(filePath);
        } catch (_) {
          // Si ya no existe o no pudo eliminarse, simplemente lo ignoramos.
        }
      }
    }
  }

  if (Object.keys(req.actions_data).length === 0) {
    return res.status(400).json({ message: 'No se enviaron campos para actualizar' });
  }

  delete userPayload.dvh; // Asegura que no se calcule el DVH con el valor antiguo
  const dvh = computeDVHFromObject(userPayload);

  userPayload.dvh = dvh;
  Object.values(req.actions_data).forEach(action => { action.new_dvh = dvh; });
  updateFields.push("dvh");

  const setClause = updateFields.map(field => `${field} = ?`).join(', ');

  await db.query(`UPDATE User SET ${setClause} WHERE id = ?;`,
    [...updateFields.map(field => userPayload[field]), req.user.user_id]);

  res.status(200).json({ message: 'Usuario actualizado correctamente', userPayload });
};

const reportUser = async (req, res) => {
  const { reported_id, reason, description } = req.body;
  req.actions_data = {};

  const reporterId = req.user?.user_id;
  const reportedId = Number(reported_id);
  const validReasons = [
    'HARASSMENT',
    'THREATS',
    'OFFENSIVE_LANGUAGE',
    'INAPPROPRIATE_CONTENT',
    'SPAM',
    'IDENTITY_THEFT',
    'PERSONAL_DATA_EXPOSURE',
    'OTHER'
  ];

  if (!reporterId) {
    return res.status(401).json({ message: 'Usuario no autenticado' });
  }


  if (!reported_id || !reason || !description || typeof description !== 'string') {
    return res.status(400).json({ message: 'reported_id, reason y description son obligatorios' });
  }

  if (!Number.isInteger(reportedId) || reportedId <= 0) {
    return res.status(400).json({ message: 'reported_id inválido' });
  }

  if (reporterId === reportedId) {
    return res.status(400).json({ message: 'No puedes reportarte a ti mismo' });
  }

  if (!validReasons.includes(reason)) {
    return res.status(400).json({ message: 'Razón de reporte inválida' });
  }

  const trimmedDescription = description.trim();
  if (trimmedDescription.length === 0) {
    return res.status(400).json({ message: 'La descripción es obligatoria' });
  }
  
  if (trimmedDescription.length > 500) {
    return res.status(400).json({
      message: 'La descripción es demasiado larga'
    });
  }

  try {
    const [reportedUser] = await db.query('SELECT id FROM User WHERE id = ?;', [reportedId]);
    if (reportedUser.length === 0) {
      return res.status(400).json({ message: 'El usuario reportado no existe' });
    }

    const [pendingReport] = await db.query(
      'SELECT id FROM Report WHERE reporter_id = ? AND reported_id = ? AND status = ?;',
      [reporterId, reportedId, 'PENDING']
    );
    if (pendingReport.length !== 0) {
      return res.status(409).json({ message: 'Ya existe un reporte pendiente para este usuario' });
    }

    const [result] = await db.query(
      'INSERT INTO Report (reporter_id, reported_id, status, reason, description, date) VALUES (?, ?, ?, ?, ?, NOW());',
      [reporterId, reportedId, 'PENDING', reason, trimmedDescription]
    );

    const reportId = result.insertId;
    req.actions_data['user-report'] = {
      entity: 'Report',
      record_id: reportId,
      action: 'insert',
      old_dvh: null,
      new_dvh: null
    };

    return res.status(201).json({ message: 'Reporte enviado correctamente', reportId });
  } catch (error) {
    console.error('Error al reportar usuario:', error);
    return res.status(500).json({ error: 'Error al procesar el reporte' });
  }
};

module.exports = {
  login,
  register,
  getUser,
  getUserByToken,
  getUsers,
  getConfig,
  changeConfig,
  changeProfile,
  reportUser
};