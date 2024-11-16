const Problem = require('../models/Problem'); // Asegúrate de tener este modelo creado

const errorLogger = async (err, req, res, next) => {
  console.error('Error capturado:', err.message);

  // Registrar problema en la base de datos
  try {
    const newProblem = new Problem({
      description: err.message,
    });

    await newProblem.save();
  } catch (dbError) {
    console.error('Error al guardar el problema en la base de datos:', dbError.message);
  }

  res.status(500).json({ success: false, error: 'Ocurrió un error. El equipo lo está investigando.' });
};

module.exports = errorLogger;
