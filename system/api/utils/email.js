const TOKEN_TTL_MINUTES = 30;

const sendPasswordResetEmail = async (email, username, token) => {
  const { BREVO_API_KEY, EMAIL_FROM, EMAIL_FROM_NAME } = process.env;
  if (!BREVO_API_KEY || !EMAIL_FROM) {
    throw new Error('Faltan BREVO_API_KEY o EMAIL_FROM en la configuración.');
  }

  const clientOrigin = (process.env.CLIENT_ORIGIN || 'http://localhost:5173').replace(/\/+$/, '');
  const resetUrl = `${clientOrigin}/reset-password#token=${encodeURIComponent(token)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: { email: EMAIL_FROM, name: EMAIL_FROM_NAME || 'KnowBeat' },
        to: [{ email }],
        subject: 'Restablecé tu contraseña de KnowBeat',
        textContent: `Hola ${username},\n\nRecibimos una solicitud para cambiar tu contraseña de KnowBeat. Abrí este enlace dentro de los próximos ${TOKEN_TTL_MINUTES} minutos:\n${resetUrl}\n\nSi no solicitaste este cambio, ignorá este correo.`,
        htmlContent: `<p>Hola ${escapeHtml(username)},</p><p>Recibimos una solicitud para cambiar tu contraseña de KnowBeat. El enlace vence en ${TOKEN_TTL_MINUTES} minutos.</p><p><a href="${escapeHtml(resetUrl)}">Cambiar mi contraseña</a></p><p>Si no solicitaste este cambio, ignorá este correo.</p>`
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      let providerMessage = '';
      try {
        const body = await response.json();
        providerMessage = typeof body.message === 'string' ? body.message.slice(0, 500) : '';
      } catch {
        providerMessage = '';
      }
      throw new Error(`Brevo API devolvió HTTP ${response.status}${providerMessage ? `: ${providerMessage}` : ''}`);
    }
  } finally {
    clearTimeout(timeout);
  }
};

const escapeHtml = (value) => value.replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[character]));

module.exports = { sendPasswordResetEmail };
