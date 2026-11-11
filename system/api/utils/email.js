const nodemailer = require('nodemailer');
const TOKEN_TTL_MINUTES = 30;

const sendPasswordResetEmail = async (email, username, token) => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
    throw new Error('Faltan SMTP_HOST, SMTP_USER o SMTP_PASSWORD en la configuración.');
  }

  const port = Number(SMTP_PORT || 587);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('SMTP_PORT debe ser un puerto válido.');
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD }
  });
  const clientOrigin = (process.env.CLIENT_ORIGIN || 'http://localhost:5173').replace(/\/+$/, '');
  const resetUrl = `${clientOrigin}/reset-password#token=${encodeURIComponent(token)}`;

  await transporter.sendMail({
    from: SMTP_FROM || SMTP_USER,
    to: email,
    subject: 'Restablecé tu contraseña de KnowBeat',
    text: `Hola ${username},\n\nRecibimos una solicitud para cambiar tu contraseña de KnowBeat. Abrí este enlace dentro de los próximos ${TOKEN_TTL_MINUTES} minutos:\n${resetUrl}\n\nSi no solicitaste este cambio, ignorá este correo.`,
    html: `<p>Hola ${escapeHtml(username)},</p><p>Recibimos una solicitud para cambiar tu contraseña de KnowBeat. El enlace vence en ${TOKEN_TTL_MINUTES} minutos.</p><p><a href="${escapeHtml(resetUrl)}">Cambiar mi contraseña</a></p><p>Si no solicitaste este cambio, ignorá este correo.</p>`
  });
};

const escapeHtml = (value) => value.replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[character]));

module.exports = { sendPasswordResetEmail };
