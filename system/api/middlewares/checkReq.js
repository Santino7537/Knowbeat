const checkRequestDataSize = () => {
    const maxParams = 5;
    const maxQuery = 5;
    const maxHeaders = 20;
    const maxKeyLength = 100;
    const maxValueLength = 300;
    return (req, res, next) => {
        const checkObject = (obj, maxCount, objectName) => {
            const entries = Object.entries(obj);

            if (entries.length > maxCount) { throw new Error(`${objectName}: demasiados parámetros`); }
            for (const [key, value] of entries) {
                if (key.length > maxKeyLength) { throw new Error(`${objectName}: clave demasiado larga`); }

                const values = Array.isArray(value) ? value : [value];

                for (const v of values) {
                    if (typeof v === "string" && v.length > maxValueLength) {
                        throw new Error(`${objectName}: valor demasiado largo`);
                    }
                }
            }
        };

        try {
            checkObject(req.params, maxParams, "params");
            checkObject(req.query, maxQuery, "query");
            checkObject(req.headers, maxHeaders, "headers");

            next();
        } catch (err) { return res.status(400).json({ error: err.message}); }
    };
};

module.exports = { checkRequestDataSize };
