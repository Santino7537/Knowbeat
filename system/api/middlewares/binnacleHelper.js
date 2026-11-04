const { computeDVHFromObject } = require("../utils/dvhHelpers");
const db = require("../config/db");
const crypto = require("node:crypto");

const sanitizeForLog = (value) => {
  if (Array.isArray(value)) return value.map(sanitizeForLog);
  if (value instanceof Date) return value.toISOString();
  if (value === null || typeof value !== "object") return value;

  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [
    key,
    /password|authorization|token|secret|cookie/i.test(key)
      ? "[REDACTED]"
      : sanitizeForLog(entry)
  ]));
};

const postResponseLog = (req, res, next) => {
  if (req.method === "OPTIONS") return next(); // Ignoramos preflights

  const start = process.hrtime.bigint(); // Tiempo para saber duración de respuesta

  const oldJson = res.json; // Guardamos la función '.json()' original
  let responseBody;

  // Cambiamos 'res.json' para capturar el body que se va a enviar en la respuesta
  res.json = function (body) {
    responseBody = body;
    return oldJson.call(this, body); // Seguimos el comportamiento original
  };

  res.once("finish", async () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;

    const sessionToken = req.user?.sessionToken
      ? crypto.createHash("sha256").update(req.user.sessionToken).digest("hex")
      : null;
    const user_id = req.user?.user_id;
    let actions = req.actions_data;
    actions = actions && typeof actions === "object" ? actions : { message: "No actions recorded" }
    const ip =
      req.ip ||
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.connection.remoteAddress;
    const { headers, params, query, body } = req;
    const files = req.files?.map(file => ({
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    }));

    try {
      const binnacle_data = {
        actions: Object.keys(actions).length === 0 ? { message: "Error" } : actions,
        endpoint_route: req.path,
        ip_source: ip || null,
        user_id: user_id || null,
        session_token: sessionToken || null,
          request_data: { headers: sanitizeForLog(headers) },
        response_data: {
          status_code: res.statusCode,
          response_time: durationMs,
            body: sanitizeForLog(responseBody),
        },
        timestamp: new Date(),
      };

        params && (binnacle_data.request_data.params = sanitizeForLog(params));
        query && (binnacle_data.request_data.query = sanitizeForLog(query));
        body && (binnacle_data.request_data.body = sanitizeForLog(body));
      files && (binnacle_data.request_data.files = files);

      binnacle_data.dvh = computeDVHFromObject(binnacle_data);

      const values = Object.values(binnacle_data).map(value => {
        if (value instanceof Date) {
          return value;
        }

        if (value !== null && typeof value === 'object') {
          return JSON.stringify(value);
        }

        return value;
      });

      await db.query(
        "INSERT INTO Binnacle (actions, endpoint_route, ip_source, user_id, session_token, request_data, response_data, timestamp, dvh) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);",
        values,
      );
    } catch (err) {
      console.error("binnacle persistence failed", err);
    }
  });

  next();
};

module.exports = { postResponseLog };
