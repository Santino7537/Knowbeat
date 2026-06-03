const { ComputeDVHFromObject } = require('../utils/dvhHelpers');

const PostResponseLog = (req, res, next) => {
  if (req.method === 'OPTIONS') return next(); // Ignoramos preflights

  const start = process.hrtime.bigint(); // Tiempo para saber duración de respuesta

  const oldJson = res.json; // Guardamos la función '.json()' original
  let responseBody;

  // Cambiamos 'res.json' para capturar el body que se va a enviar en la respuesta
  res.json = function (body) {
    responseBody = body;
    return oldJson.call(this, body); // Seguimos el comportamiento original
  };

  res.once('finish', async () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;

    const sessionToken = req.user?.sessionToken
    const user_id = req.user?.user_id;
    const actions = req.actions_data;
    const ip = req.ip || req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress
    const { headers, params, query, body } = req

    try {
      const binnacle_data = {
        actions: actions,
        endpoint_route: req.path,
        request_data: { headers },
        response_data: {
            status_code: res.statusCode,
            response_time: durationMs,
            body: responseBody
        },
        timestamp: new Date()
      };

      ip && (binnacle_data.ip_source = ip);
      sessionToken && (binnacle_data.session_token = sessionToken);
      user_id && (binnacle_data.user_id = user_id);
      params && (binnacle_data.request_data.params = params);
      query && (binnacle_data.request_data.query = query);
      body && (binnacle_data.request_data.body = body);

      binnacle_data.dvh = ComputeDVHFromObject(binnacle_data);

      await db.query('INSERT INTO Binnacle (actions, endpoint_route, ip_source, user_id, session_token, request_data, response_data, timestamp, dvh) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);',
      Object.values(binnacle_data));
    } catch (err) {
      console.error('binnacle persistence failed', err);
    }
  });

  next();
}

module.exports = { PostResponseLog }
