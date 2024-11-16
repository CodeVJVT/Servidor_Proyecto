const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    const token = req.header('auth-token');
    if (!token) return res.status(401).json({ message: 'Acceso denegado' });

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'secretKey');
        req.user = verified;
        next(); // Continúa al siguiente middleware o ruta
    } catch (err) {
        res.status(400).json({ message: 'Token inválido' });
    }
}

module.exports = verifyToken;
