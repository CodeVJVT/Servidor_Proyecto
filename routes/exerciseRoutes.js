const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const exercisesFilePath = path.join(__dirname, "exercises.json");

// Endpoint para generar un ejercicio
router.get("/generate-exercise/:category", async (req, res) => {
  const { category } = req.params;

  try {
    const fetch = (await import("node-fetch")).default;

    // Generar un solo ejercicio en función de la categoría y dificultad aleatoria
    const response = await fetch("http://127.0.0.1:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3.2",
        prompt: `Generar un ejercicio de codificación en lenguaje Java sobre el tema ${category} con una dificultad ${
          ["Fácil", "Media", "Difícil"][Math.floor(Math.random() * 3)]
        }. El ejercicio debe incluir:
                1. Un planteamiento del problema claro y detallado en el campo "problem".
                2. Una descripción completa en el campo "description" que explique lo que se espera que el usuario resuelva.
                3. Una solución esperada en Java en el campo "solution".
                4. Ejemplos de entrada y salida en el campo "examples", que ilustren casos de uso.
                5. Pistas en el campo "hints" para ayudar al usuario a resolver el problema y sugerencias para corregir errores comunes.

                Además, las pistas deben orientar al usuario si comete errores típicos de implementación, como el uso incorrecto de variables, problemas de sintaxis, o lógica incorrecta. El formato de respuesta debe ser JSON con los campos "problem", "description", "solution", "examples", y "hints".`,
        format: "json",
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error de Ollama: ${response.statusText}`);
    }

    const responseData = await response.json();
    console.log("Respuesta completa de Ollama:", responseData);

    // Procesar y limpiar el campo `response` del resultado
    let cleanedResponse = responseData.response
      .replace(/\\n/g, "")
      .replace(/\\\\/g, "\\");
    console.log("Respuesta limpia:", cleanedResponse);

    let problemData;
    try {
      problemData = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error("Error al parsear el campo `response`:", parseError);
      console.error(
        "Contenido del campo `response` que causó el error:",
        cleanedResponse
      );
      return res.status(500).json({
        success: false,
        error:
          "El campo `response` no contiene JSON válido. Intente nuevamente o contacte al soporte.",
      });
    }

    // Formatear y devolver el ejercicio generado
    const exercise = {
      id: `${category}-exercise-1`,
      title: problemData.problem || `Ejercicio de ${category}`,
      description: problemData.description || "Descripción no disponible",
      solution: problemData.solution || "Solución no disponible",
      examples: problemData.examples || [],
      hints: problemData.hints || [],
      difficulty: ["Fácil", "Media", "Difícil"][Math.floor(Math.random() * 3)],
      status: "No completado",
      acceptance: Math.floor(Math.random() * 100),
    };

    res.json({ success: true, exercise });
  } catch (error) {
    console.error("Error al generar el ejercicio:", error);
    res
      .status(500)
      .json({ success: false, error: "Error al generar el ejercicio" });
  }
});

// Endpoint para guardar un ejercicio en el archivo JSON
router.post("/save-exercise", async (req, res) => {
  const { exercise } = req.body;

  if (!exercise) {
    return res
      .status(400)
      .json({ success: false, error: "No se proporcionó ningún ejercicio" });
  }

  try {
    // Leer el archivo existente o crear un array vacío si no existe
    let exercises = [];
    if (fs.existsSync(exercisesFilePath)) {
      const data = fs.readFileSync(exercisesFilePath, "utf8");
      exercises = JSON.parse(data);
    }

    // Agregar el nuevo ejercicio
    exercises.push(exercise);

    // Guardar los datos actualizados en el archivo
    fs.writeFileSync(
      exercisesFilePath,
      JSON.stringify(exercises, null, 2),
      "utf8"
    );
    res.json({ success: true, message: "Ejercicio guardado exitosamente" });
  } catch (error) {
    console.error("Error al guardar el ejercicio:", error);
    res
      .status(500)
      .json({ success: false, error: "Error al guardar el ejercicio" });
  }
});
// Obtener ejercicios por tema
router.get("/:topicId", async (req, res) => {
  const { topicId } = req.params;

  try {
    const exercises = await Exercise.find({ topic: topicId });

    if (!exercises || exercises.length === 0) {
      return res
        .status(404)
        .json({
          success: false,
          message: "No se encontraron ejercicios para este tema.",
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
module.exports = router;
