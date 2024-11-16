require("dotenv").config(); // Agrega esta línea al inicio
console.log("MONGO_URI:", process.env.MONGO_URI); // Esto debería mostrar tu URI
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const verifyToken = require("./middlewares/verifyToken");
const authRoutes = require("./routes/authRoutes"); // Rutas de autenticación
const exerciseRoutes = require("./routes/exerciseRoutes"); // Rutas de ejercicios
const userProgressRoutes = require("./routes/userProgressRoutes"); // Rutas de progreso de usuario
const generateProblemRoutes = require("./routes/generateProblemRoutes"); // Rutas para generar problemas
const validateAnswerRoute = require("./routes/validateAnswerRoute"); // Rutas para validar respuestas
const achievementRoutes = require("./routes/achievementRoutes");
const problemRoutes = require("./routes/problems"); // Rutas para gestionar problemas
const errorLogger = require("./middlewares/errorLogger"); // Importa el middleware de captura de errores

const app = express();
const port = process.env.PORT || 5000; // Usar puerto desde variable de entorno o valor por defecto

// Middleware
app.use(cors());
app.use(express.json());

// Conexión a MongoDB
(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Conectado a MongoDB Atlas");
  } catch (err) {
    console.error("No se pudo conectar a MongoDB Atlas", err);
  }
})();

// Rutas
app.use("/api/auth", authRoutes); // Rutas de autenticación
app.use("/api/exercises", exerciseRoutes); // Rutas de ejercicios
app.use("/api/user-progress", userProgressRoutes); // Rutas de progreso del usuario
app.use("/api/problems", generateProblemRoutes); // Rutas de generación de problemas
app.use("/api/validate", validateAnswerRoute); // Rutas para validar respuestas
app.use("/api/achievements", achievementRoutes);
app.use("/api/problems", problemRoutes); // Ruta para gestionar problemas
app.use(errorLogger); // Debe ir después de todas las rutas

// Middleware de captura de errores

// Ruta básica para probar
app.get("/", (req, res) => {
  res.send("¡Servidor funcionando!");
});

// Ruta protegida (solo para usuarios autenticados)
app.get("/dashboard", verifyToken, (req, res) => {
  res.json({
    message: `Bienvenido al dashboard, usuario con ID: ${req.user._id}`,
  });
});

// Inicializa el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});
