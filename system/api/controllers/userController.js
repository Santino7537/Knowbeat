const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SECRET = process.env.SECRET;

const login = async (req, res) => {
  const { username, password } = req.body;

  // if (password) req.body.password = "[REDACTED]"; esto es si se guarda el body

  if (!username || !password) {
    return res.status(400).json({ message: 'Nombre de usuario o contraseña faltante' });
  }

  let user;

  // Comprueba si el usuario existe y obtiene su información
  try {
    [user] = await db.query('SELECT * FROM user WHERE username = ?;', [username]);
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
    
  // Detectamos el idioma desde el header antes del INSERT
  const langHeader = req.headers['accept-language'] || 'es';
  const detectedLang = langHeader.startsWith('en') ? 'en-US' : 'es-AR';

  // Se crea el JSON que contiene la configuración del usuario:
  const config_json = JSON.stringify({
    privacidad: {
      cuenta_privada: false,
      visibilidad_progreso: "todos",
      mensajeria_restringida: false,
      mostrar_actividad: true
    },
    preferencia: {
      notacion: "americana",
      ejercicios_microfono: true,
      ejercicios_escucha: true,
      notificaciones: {
        recordatorio_racha: true,
        emails: true,
        menciones: true,
        likes: true,
        avisos_comunidad: true
      }
    },
    apariencia: {
      idioma: detectedLang,
      modo_oscuro: true
    }
   });

  // if (password) req.body.password = "[REDACTED]"; esto es si se guarda el body

  if (!username || !password || !email) {
    return res.status(400).json({ message: 'Nombre de usuario, contraseña o email faltante' });
  }

  // Comprueba si el nombre de usuario o email ya existen
  try {
    const [existingUsername] = await db.query('SELECT id FROM user WHERE username = ?;', [username]);
    if (existingUsername.length !== 0) return res.status(400).json({ message: 'El nombre de usuario ya está registrado' });
  } catch (error) {
    return res.status(500).json({ error: 'Error al comprobar nombre de usuario' });
  }

  try {
    [existingMail] = await db.query('SELECT id FROM user WHERE email = ?;', [email]);
    if (existingMail.length !== 0) return res.status(400).json({ message: 'El email ya está registrado' });
  } catch (error) {
    return res.status(500).json({ error: 'Error al comprobar email' });
  }

  // Prepara campos para la creación del usuario
  const hashedPassword = await bcrypt.hash(password, 10);
  const penaltyDate = new Date("2000-01-01");
  const dvh = 0 // No existe el cálculo todavía, por ahora es un valor de prueba

  let user;

  // Crea el usuario en la base de datos
  try {
    user = await db.query('INSERT INTO user (role_id, username, email, password, picture, configuration, penalty_date, eliminated, dvh) VALUES (1, ?, ?, ?, "prueba.png", ?, ?, 0, ?);',
      [username, email, hashedPassword, config_json, penaltyDate, dvh]);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Error al crear usuario' });
  }

  res.json({ message: 'Registro exitoso', user });
};

const getUsers = async (req, res) => {

  try {
    const [rows] = await db.query('SELECT * FROM user WHERE eliminated = 0');
    res.json(rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }

};

const changeConfig = async (req, res) => {

  function iterate(obj, path = "") {

    // Detecta como se llama el campo, y el contenido que tiene
    for (const [reg, value] of Object.entries(obj)) {

      // Va formando el campo "preferencias.notificaciones.etc"
      const newPath = path ? `${path}.${reg}` : reg;

      // Si encuentra otro objeto, sigue recorriendo
      if (
        typeof(value) == 'object' &&
        value !== null &&
        !Array.isArray(value)
      ) {

        return iterate(value, newPath);

      } else {

        return {
          // Devuelve el path completo y el valor final
          type: newPath,
          content: value
        };

      }
    }
  }

  const userId = req.user.user_id;

  // req.body devuelve un obj de los cambios que se efectuaron
  const result = iterate(req.body);

  // Si no encontró nada válido
  if (!result) {
    return res.status(400).json({
      error: 'Configuración inválida'
    });
  }

  const configType = result.type;
  const configValue = result.content;

  /* =========================
     SEGURIDAD
     ========================= */

  // Configuraciones permitidas
  const allowedConfigs = {

    // PRIVACIDAD
    'privacidad.cuenta_privada': 'boolean',
    'privacidad.visibilidad_progreso': 'string',
    'privacidad.mensajeria_restringida': 'boolean',
    'privacidad.mostrar_actividad': 'boolean',

    // PREFERENCIAS
    'preferencia.notacion': 'string',
    'preferencia.ejercicios_microfono': 'boolean',
    'preferencia.ejercicios_escucha': 'boolean',

    // NOTIFICACIONES
    'preferencia.notificaciones.recordatorio_racha': 'boolean',
    'preferencia.notificaciones.emails': 'boolean',
    'preferencia.notificaciones.menciones': 'boolean',
    'preferencia.notificaciones.likes': 'boolean',
    'preferencia.notificaciones.avisos_comunidad': 'boolean',

    // APARIENCIA
    'apariencia.idioma': 'string',
    'apariencia.modo_oscuro': 'boolean'

  };

  // Verifica que la config exista
  if (!(configType in allowedConfigs)) {

    return res.status(400).json({
      error: 'Configuración no permitida'
    });

  }

  // Verifica tipo de dato
  if (typeof(configValue) !== allowedConfigs[configType]) {

    return res.status(400).json({
      error: 'Tipo de dato inválido'
    });

  }


  try {

    const sqlPath = `$.${configType}`;

    const [resultDB] = await db.query(
      'UPDATE user SET configuration = JSON_SET(configuration, ?, ?) WHERE id = ?',
      [sqlPath, configValue, userId]
    );

    if (resultDB.affectedRows === 0) {

      return res.status(404).json({
        error: 'Usuario no encontrado'
      });

    }

    res.json({
      message: 'Se cambió la configuración exitosamente'
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: 'Error al cambiar la configuración del usuario'
    });

  }
};

module.exports = {
  login,
  register,
  getUsers,
  changeConfig,
};