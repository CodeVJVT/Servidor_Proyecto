const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authenticateUser = (req, res, next) => {
  const token = req.header("auth-token");
  if (!token) {
    return res
      .status(401)
      .json({ success: false, error: "Acceso no autorizado." });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || "secretKey");
    req.user = verified;
    next();
  } catch (error) {
    return res.status(400).json({ success: false, error: "Token inválido." });
  }
};

module.exports = authenticateUser;
