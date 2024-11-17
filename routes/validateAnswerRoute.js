const express = require("express");
const router = express.Router();
const Exercise = require("../models/Exercise");
const API_BASE_URL = require("../config");

function generateValidationPrompt(
  problemDescription,
  userCode,
  expectedSolution
) {
  return `
    Eres un evaluador de código. Evalúa si el siguiente código del usuario resuelve correctamente el problema planteado.

    Problema:
    ${problemDescription}

    Código del Usuario:
    ${userCode}

    Solución Esperada:
    ${expectedSolution}

    Compararás la salida del código del usuario con la salida esperada para los mismos datos de entrada. 
    Si hay diferencias lógicas, explica cuál es el error y proporciona sugerencias de mejora.

    Devuelve un JSON con el formato:
    {
        "isCorrect": true/false,
        "feedback": "Texto explicando si la solución es correcta o no."
    }
  `;
}

const normalizeCode = (code) => {
  return code.replace(/\s+/g, " ").trim(); // Reemplaza saltos de línea y espacios múltiples por un solo espacio
};

router.post("/validate-answer", async (req, res) => {
  const { code, userCode } = req.body;

  if (!code || !userCode) {
    return res.status(400).json({
      success: false,
      error: "Faltan campos requeridos: code o userCode.",
    });
  }

  try {
    // Obtener el ejercicio de la base de datos
    const exercise = await Exercise.findOne({ code });

    if (!exercise) {
      return res.status(404).json({
        success: false,
        error: "No se encontró un ejercicio con el código proporcionado.",
      });
    }

    const normalizedUserCode = normalizeCode(userCode);
    const normalizedSolution = normalizeCode(exercise.solution);
    const response = await fetch(`${API_BASE_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3.2",
        prompt: generateValidationPrompt(
          exercise.description,
          normalizedUserCode,
          normalizedSolution
        ),
        format: "json",
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error en Ollama: ${response.statusText}`);
    }

    const { response: validationJson } = await response.json();
    const validationResult = JSON.parse(validationJson);

    res.json({ success: true, validation: validationResult });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
