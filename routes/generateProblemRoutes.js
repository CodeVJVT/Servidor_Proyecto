const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid"); // Para generar códigos únicos
const Exercise = require("../models/Exercise"); // Modelo de la base de datos
const API_BASE_URL = require("../config");
const ExerciseListing = require("../models/ExerciseListing"); // Importar el modelo

// Prompt para generar listado de ejercicios
function generateListingPrompt(topic) {
  return `
    Eres un experto en programación. Genera un listado de 10 problemas de codificación prácticos relacionados específicamente con el tema "${topic}".
    Los problemas deben estar diseñados para ser resueltos exclusivamente en el lenguaje JavaScript y no incluir otros lenguajes.

    Divide los problemas en tres niveles de dificultad: básico, intermedio y avanzado.
    Solo incluye ejercicios prácticos que requieran escribir código en JavaScript para resolverlos.

    El formato esperado es el siguiente:
    {
      "basico": [
        "Descripción del ejercicio básico 1",
        "Descripción del ejercicio básico 2"
      ],
      "intermedio": [
        "Descripción del ejercicio intermedio 1",
        "Descripción del ejercicio intermedio 2"
      ],
      "avanzado": [
        "Descripción del ejercicio avanzado 1",
        "Descripción del ejercicio avanzado 2"
      ]
    }

    Ejemplo de problemas relacionados al tema "${topic}" y en JavaScript:
    - Si el tema es "procedimientos", ejemplos incluyen "Escribe un procedimiento en JavaScript que sume dos números" o "Crea un procedimiento que encuentre el número más grande de una lista en JavaScript".
    - Si el tema es "funciones", ejemplos incluyen "Implementa una función en JavaScript que calcule el área de un triángulo" o "Escribe una función que devuelva todos los números primos en un rango en JavaScript".
    - Si el tema es "estructuras", ejemplos incluyen "Crea una estructura de datos en JavaScript para una cola (queue)" o "Diseña una estructura para almacenar información de contactos en JavaScript".
  `;
}

// Endpoint para generar un listado de ejercicios
router.post("/generate-listing", async (req, res) => {
  const { topic } = req.body;

  if (!topic) {
    return res.status(400).json({
      success: false,
      error: "Falta el campo requerido: topic.",
    });
  }

  try {
    const listing = await ExerciseListing.findOne({ topic });

    if (listing) {
      // Filtrar ejercicios no seleccionados
      const filteredListings = {
        basico: listing.listings.basico.filter((exercise) => !exercise.selected),
        intermedio: listing.listings.intermedio.filter((exercise) => !exercise.selected),
        avanzado: listing.listings.avanzado.filter((exercise) => !exercise.selected),
      };

      return res.json({ success: true, listings: filteredListings });
    }

    // Si no hay listado existente, genera uno nuevo
    const fetch = (await import("node-fetch")).default;
    const response = await fetch(`${API_BASE_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3.2",
        prompt: generateListingPrompt(topic),
        format: "json",
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error en Ollama: ${response.statusText}`);
    }

    const { response: listingJson } = await response.json();
    const listings = JSON.parse(listingJson);

    if (!listings.basico || !listings.intermedio || !listings.avanzado) {
      throw new Error("El listado generado no contiene todos los niveles.");
    }

    const newListing = new ExerciseListing({ topic, listings });
    await newListing.save();

    res.json({ success: true, listings });
  } catch (error) {
    console.error("Error al generar el listado de ejercicios:", error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor.",
    });
  }
});


router.get("/listings/:topic", async (req, res) => {
  const { topic } = req.params;

  try {
    const listing = await ExerciseListing.findOne({ topic });

    if (!listing) {
      return res.json({
        success: true,
        message: "No se encontró un listado para este tema.",
        listings: null,
      });
    }

    res.json({ success: true, listings: listing.listings });
  } catch (error) {
    console.error("Error al obtener el listado de ejercicios:", error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor.",
    });
  }
});

// Prompt para generar un problema específico
function generateProblemPrompt(exerciseText) {
  return `
    Genera un problema de codificación basado en el siguiente ejercicio:
    "${exerciseText}"

    El problema debe estar diseñado exclusivamente para ser resuelto en JavaScript. Proporciona un formato JSON con los siguientes campos:
    {
      "title": "Título del problema",
      "description": "Descripción detallada",
      "exampleInput": "Ejemplo de entrada",
      "exampleOutput": "Ejemplo de salida",
      "solution": {
          "language": "JavaScript",
          "code": "Código solución en JavaScript",
          "explanation": "Explicación breve"
      }
    }

    Ejemplo de cómo se vería un problema generado:
    {
      "title": "Sumar dos números",
      "description": "Escribe un procedimiento en JavaScript que reciba dos números como entrada y devuelva su suma.",
      "exampleInput": "2, 3",
      "exampleOutput": "5",
      "solution": {
          "language": "JavaScript",
          "code": "function sumar(a, b) { return a + b; }",
          "explanation": "La función sumar toma dos parámetros y devuelve su suma."
      }
    }
  `;
}

// Endpoint para generar un problema basado en un ejercicio seleccionado
router.post("/generate-problem", async (req, res) => {
  const { topic, exerciseText, level } = req.body;

  if (!topic || !exerciseText || !level) {
    return res.status(400).json({
      success: false,
      error: "Faltan campos requeridos: topic, level o exerciseText.",
    });
  }

  try {
    const fetch = (await import("node-fetch")).default;

    const response = await fetch(`${API_BASE_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3.2",
        prompt: generateProblemPrompt(exerciseText),
        format: "json",
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error en Ollama: ${response.statusText}`);
    }

    const { response: problemJson } = await response.json();
    const problemData = JSON.parse(problemJson);

    if (
      !problemData.title ||
      !problemData.description ||
      !problemData.exampleInput ||
      !problemData.exampleOutput ||
      !problemData.solution
    ) {
      throw new Error(
        "El problema generado no contiene todos los campos necesarios."
      );
    }

    // Verificar si el problema ya existe
    const existingExercise = await Exercise.findOne({
      title: problemData.title,
    });

    if (existingExercise) {
      return res.status(400).json({
        success: false,
        error: "El problema ya existe.",
      });
    }

    // Guardar el problema en la base de datos
    const uniqueCode = uuidv4();
    const newExercise = new Exercise({
      code: uniqueCode,
      topic,
      level, // Guardar el nivel dinámicamente según lo recibido
      title: problemData.title,
      description: problemData.description,
      prompt: generateProblemPrompt(exerciseText),
      exampleInput: problemData.exampleInput,
      exampleOutput: problemData.exampleOutput,
      solution: problemData.solution.code,
    });

    await newExercise.save();

    res.json({ success: true, problem: newExercise });
  } catch (error) {
    console.error("Error al generar el problema:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

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
    await ExerciseListing.deleteMany();
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

// Obtener ejercicios y listados por tema
router.get("/topic/:topicId", async (req, res) => {
  const { topicId } = req.params;

  try {
    const exercises = await Exercise.find({ topic: topicId });
    const listings = await ExerciseListing.findOne({ topic: topicId });

    res.json({
      success: true,
      exercises,
      listings: listings ? listings.listings : null,
    });
  } catch (error) {
    console.error("Error al obtener ejercicios y listados:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener ejercicios y listados.",
    });
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

router.post("/mark-selected", async (req, res) => {
  const { topic, category, index } = req.body;

  if (!topic || !category || index === undefined) {
    return res.status(400).json({
      success: false,
      error: "Faltan campos requeridos: topic, category o index.",
    });
  }

  try {
    // Encontrar el listado
    const listing = await ExerciseListing.findOne({ topic });
    if (!listing) {
      return res.status(404).json({
        success: false,
        error: "No se encontró el listado de ejercicios.",
      });
    }

    // Actualizar el campo `selected`
    listing.listings[category][index].selected = true;
    await listing.save();

    res.json({
      success: true,
      message: "Ejercicio marcado como seleccionado.",
    });
  } catch (error) {
    console.error("Error al marcar ejercicio como seleccionado:", error);
    res
      .status(500)
      .json({ success: false, error: "Error interno del servidor." });
  }
});

module.exports = router;
