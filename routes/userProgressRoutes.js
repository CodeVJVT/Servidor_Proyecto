const express = require("express");
const router = express.Router();
const UserProgress = require("../models/UserProgress");
const verifyToken = require("../middlewares/verifyToken");
const Exercise = require("../models/Exercise"); // Para verificar problemas existentes

// Ruta para registrar el progreso del usuario
router.post("/update-progress", verifyToken, async (req, res) => {
  const { problemCode, status } = req.body;

  if (!problemCode || !status) {
    return res
      .status(400)
      .json({ message: "Faltan campos requeridos: problemCode o status." });
  }

  try {
    // Buscar el problema para obtener su dificultad
    const problem = await Exercise.findOne({ code: problemCode });
    if (!problem) {
      return res.status(404).json({ message: "Problema no encontrado." });
    }

    // Asignar puntos según la dificultad
    let score = 0;
    switch (problem.level) {
      case "fácil":
        score = 10;
        break;
      case "medio":
        score = 20;
        break;
      case "difícil":
        score = 30;
        break;
      default:
        score = 10; // Puntaje por defecto
    }

    // Actualizar el progreso del usuario
    let userProgress = await UserProgress.findOne({ userId: req.user._id });

    if (!userProgress) {
      userProgress = new UserProgress({
        userId: req.user._id,
        solvedProblems: [{ problemCode, status, score }],
        totalScore: score,
      });
    } else {
      const existingProblem = userProgress.solvedProblems.find(
        (p) => p.problemCode === problemCode
      );

      if (existingProblem) {
        existingProblem.status = status;
        existingProblem.attempts += 1;
        existingProblem.score = Math.max(existingProblem.score, score);
      } else {
        userProgress.solvedProblems.push({ problemCode, status, score });
      }

      userProgress.totalScore += score;
    }

    await userProgress.save();

    res.json({
      message: "Progreso actualizado con éxito",
      progress: userProgress,
    });
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Error al actualizar el progreso",
        error: error.message,
      });
  }
});

router.get("/progress", verifyToken, async (req, res) => {
  try {
    const userProgress = await UserProgress.findOne({
      userId: req.user._id,
    }).populate("userId", "username");

    if (!userProgress) {
      return res
        .status(404)
        .json({ message: "Progreso no encontrado para este usuario." });
    }

    res.json({ success: true, progress: userProgress });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener el progreso", error: error.message });
  }
});

module.exports = router;
