const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid"); // Para generar códigos únicos
const Exercise = require("../models/Exercise"); // Modelo de la base de datos

function generatePrompt(topic, level) {
  return `
    Genera un problema de codificación en formato JSON con el tema "${topic}" y nivel "${level}". Formato esperado:
    {
        "title": "Título del problema",
        "description": "Descripción detallada",
        "exampleInput": "Ejemplo de entrada",
        "exampleOutput": "Ejemplo de salida",
        "solution": {
            "language": "Lenguaje Java",
            "code": "Código solución",
            "explanation": "Explicación breve"
        }
    }
    `;
}

// Obtener todos los ejercicios generados
router.get("/all", async (req, res) => {
  try {
    const exercises = await Exercise.find().sort({ createdAt: -1 }); // Ordenar por fecha de creación descendente
    res.json({ success: true, exercises });
  } catch (error) {
    console.error("Error al obtener todos los ejercicios:", error);
    res
      .status(500)
      .json({ success: false, error: "Error al obtener ejercicios." });
  }
});

// Eliminar todos los ejercicios
router.delete("/all", async (req, res) => {
  try {
    await Exercise.deleteMany();
    res.json({
      success: true,
      message: "Todos los ejercicios han sido eliminados.",
    });
  } catch (error) {
    console.error("Error al eliminar todos los ejercicios:", error);
    res
      .status(500)
      .json({ success: false, error: "Error al eliminar ejercicios." });
  }
});

// Eliminar un ejercicio por su código único
router.delete("/:exerciseCode", async (req, res) => {
  const { exerciseCode } = req.params;

  try {
    const deletedExercise = await Exercise.findOneAndDelete({
      code: exerciseCode,
    });

    if (!deletedExercise) {
      return res.status(404).json({
        success: false,
        message: "No se encontró el ejercicio solicitado.",
      });
    }

    res.json({ success: true, message: "Ejercicio eliminado con éxito." });
  } catch (error) {
    console.error("Error al eliminar el ejercicio:", error);
    res
      .status(500)
      .json({ success: false, error: "Error al eliminar el ejercicio." });
  }
});

router.put("/:exerciseCode", async (req, res) => {
  const { exerciseCode } = req.params;
  const { title, description, exampleInput, exampleOutput, solution } =
    req.body;

  try {
    const updatedExercise = await Exercise.findOneAndUpdate(
      { code: exerciseCode },
      { title, description, exampleInput, exampleOutput, solution },
      { new: true, runValidators: true }
    );

    if (!updatedExercise) {
      return res.status(404).json({
        success: false,
        message: "No se encontró el ejercicio solicitado.",
      });
    }

    res.json({ success: true, exercise: updatedExercise });
  } catch (error) {
    console.error("Error al actualizar el ejercicio:", error);
    res
      .status(500)
      .json({ success: false, error: "Error al actualizar el ejercicio." });
  }
});

router.post("/generate-problem", async (req, res) => {
  const { topic, level } = req.body;

  if (!topic || !level) {
    return res.status(400).json({
      success: false,
      error: "Faltan campos requeridos: topic o level.",
    });
  }
  const validLevels = ["facil", "medio", "dificil"];
  if (!validLevels.includes(level.toLowerCase())) {
    return res.status(400).json({
      success: false,
      error: `El nivel debe ser uno de los siguientes: ${validLevels.join(
        ", "
      )}.`,
    });
  }
  try {
    const fetch = require("node-fetch");
    const OLLAMA_BASE_URL =
      process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3.2",
        prompt: generatePrompt(topic, level),
        format: "json",
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error en Ollama: ${response.statusText}`);
    }

    const { response: problemJson } = await response.json();

    let problemData;
    try {
      problemData = JSON.parse(problemJson);
    } catch (parseError) {
      throw new Error("La respuesta generada no contiene un JSON válido.");
    }

    // Validar campos requeridos en la respuesta generada
    const requiredFields = [
      "title",
      "description",
      "exampleInput",
      "exampleOutput",
      "solution",
    ];

    for (const field of requiredFields) {
      if (!problemData[field]) {
        throw new Error(
          `Falta el campo obligatorio "${field}" en el problema generado.`
        );
      }
    }

    // Validar estructura de la solución
    if (
      !problemData.solution.language ||
      !problemData.solution.code ||
      !problemData.solution.explanation
    ) {
      throw new Error(
        'El campo "solution" debe contener "language", "code" y "explanation".'
      );
    }

    // Generar código único y guardar el problema
    const uniqueCode = uuidv4();
    const newExercise = new Exercise({
      code: uniqueCode,
      topic,
      level,
      title: problemData.title,
      description: problemData.description,
      prompt: generatePrompt(topic, level),
      exampleInput: problemData.exampleInput,
      exampleOutput: problemData.exampleOutput,
      solution: problemData.solution.code,
    });

    await newExercise.save();

    res.json({ success: true, problem: newExercise });
  } catch (error) {
    console.error("Error al generar el problema:", error);
    res
      .status(500)
      .json({ success: false, error: "Error interno del servidor." });
  }
});

// Obtener ejercicios por tema
router.get("/topic/:topicId", async (req, res) => {
  const { topicId } = req.params;

  try {
    const exercises = await Exercise.find({ topic: topicId });

    if (!exercises || exercises.length === 0) {
      return res.json({
        success: true,
        message: "No se encontraron ejercicios para este tema.",
        exercises: [], // Lista vacía
      });
    }

    res.json({ success: true, exercises });
  } catch (error) {
    console.error("Error al obtener ejercicios:", error);
    res
      .status(500)
      .json({ success: false, error: "Error al obtener ejercicios." });
  }
});

// Obtener detalles de un ejercicio por su código único
router.get("/details/:exerciseCode", async (req, res) => {
  const { exerciseCode } = req.params;

  try {
    const exercise = await Exercise.findOne({ code: exerciseCode });

    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: "No se encontró el ejercicio solicitado.",
      });
    }

    res.json({ success: true, exercise });
  } catch (error) {
    console.error("Error al obtener detalles del ejercicio:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener detalles del ejercicio.",
    });
  }
});
module.exports = router;
