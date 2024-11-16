const mongoose = require('mongoose');

const ProblemSchema = new mongoose.Schema({
  description: { type: String, required: true },  // Descripción del problema
  cause: { type: String, required: false },       // Causa raíz identificada
  solution: { type: String, required: false },    // Solución implementada
  resolved: { type: Boolean, default: false },    // Indicador si el problema fue resuelto
  createdAt: { type: Date, default: Date.now },   // Fecha de creación
  resolvedAt: { type: Date }                      // Fecha de resolución
});

module.exports = mongoose.model('Problem', ProblemSchema);
