const mongoose = require("mongoose");

const AttemptSchema = new mongoose.Schema({
  exerciseCode: String,
  userCode: String,
  isCorrect: Boolean,
  feedback: String,
  date: { type: Date, default: Date.now },
});

const ProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  exerciseCode: String,
  attempts: [AttemptSchema], // Historial de intentos
  totalScore: { type: Number, default: 100 }, // Puntuación inicial
});

module.exports = mongoose.model("Progress", ProgressSchema);
