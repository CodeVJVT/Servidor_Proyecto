const express = require("express");
const router = express.Router();
const Achievement = require("../models/Achievement");
const UserProgress = require("../models/UserProgress");
const verifyToken = require("../middlewares/verifyToken");

// Logros posibles
const availableAchievements = [
  {
    name: "Primer Problema Resuelto",
    description: "Resuelve tu primer problema",
    points: 10,
  },
  {
    name: "Resolutor Consistente",
    description: "Resuelve problemas durante 5 días consecutivos",
    points: 20,
  },
  {
    name: "Maestro de Categorías",
    description: "Resuelve problemas en 3 categorías diferentes",
    points: 25,
  },
  {
    name: "Campeón de Puntuación",
    description: "Alcanza 100 puntos totales",
    points: 50,
  },
];

// Evaluar si un usuario ha desbloqueado logros
router.post("/evaluate-achievements", verifyToken, async (req, res) => {
  try {
    const userProgress = await UserProgress.findOne({ userId: req.user._id });
    if (!userProgress) {
      return res.status(404).json({ message: "Progreso no encontrado." });
    }

    const userAchievements =
      (await Achievement.findOne({ userId: req.user._id })) ||
      new Achievement({ userId: req.user._id });

    const unlockedAchievements = [];

    if (
      userProgress.solvedProblems.length >= 1 &&
      !userAchievements.achievements.find(
        (a) => a.name === "Primer Problema Resuelto"
      )
    ) {
      unlockedAchievements.push(availableAchievements[0]);
    }

    if (
      userProgress.totalScore >= 100 &&
      !userAchievements.achievements.find(
        (a) => a.name === "Campeón de Puntuación"
      )
    ) {
      unlockedAchievements.push(availableAchievements[3]);
    }

    unlockedAchievements.forEach((achievement) => {
      userAchievements.achievements.push(achievement);
      userAchievements.totalAchievements++;
    });

    if (unlockedAchievements.length > 0) {
      await userAchievements.save();
      return res.json({
        message: "Logros evaluados con éxito",
        unlockedAchievements,
        notification: `¡Felicidades! Has desbloqueado ${unlockedAchievements.length} nuevo(s) logro(s).`,
      });
    }

    res.json({ message: "No hay nuevos logros desbloqueados" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al evaluar logros", error: error.message });
  }
});

router.get("/user-achievements", verifyToken, async (req, res) => {
  try {
    const userAchievements = await Achievement.findOne({
      userId: req.user._id,
    });

    if (!userAchievements) {
      return res
        .status(404)
        .json({ message: "No se encontraron logros para este usuario." });
    }

    res.json({ success: true, achievements: userAchievements });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener los logros", error: error.message });
  }
});
module.exports = router;
