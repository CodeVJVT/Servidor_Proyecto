const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid"); // Para generar códigos únicos
const Exercise = require("../models/Exercise"); // Modelo de la base de datos
const API_BASE_URL = require("../config");
const ExerciseListing = require("../models/ExerciseListing"); // Importar el modelo

function generateListingPromptForProcedures(topic) {
  return `
    Eres un experto en programación. Genera un listado de 15 problemas prácticos en el tema "${topic}" exclusivamente para procedimientos en JavaScript.

    Asegúrate de que:
    - Los problemas estén relacionados con procedimientos.
    - Los procedimientos no devuelvan valores (utilizan console.log u otras acciones visibles en lugar de return).
    - Incluyan acciones claras y secuenciales.

    Divide los problemas en tres niveles de dificultad: básico, intermedio y avanzado.

    Formato esperado:
    {
      "basico": [
        "Escribe un procedimiento",
        "Crea un procedimiento"
      ],
      "intermedio": [
        "Escribe un procedimiento",
        "Crea un procedimiento"
      ],
      "avanzado": [
        "Diseña un procedimiento",
        "Implementa un procedimiento"
      ]
    }

    Asegúrate de que los problemas generados estén relacionados con procedimientos secuenciales en JavaScript.
  `;
}

function generateListingPromptForFunctions(topic) {
  return `
    Eres un experto en programación. Genera un listado de 15 problemas prácticos en el tema "${topic}" exclusivamente para funciones en JavaScript.

    Asegúrate de que:
    - Todos los problemas estén relacionados con funciones reutilizables.
    - Las funciones devuelvan valores utilizando "return".
    - Las funciones sean específicas y cumplan una única tarea.

    Divide los problemas en tres niveles de dificultad: básico, intermedio y avanzado.

    Formato esperado:
    {
      "basico": [
        "Escribe una función",
        "Crea una función"
      ],
      "intermedio": [
        "Diseña una función",
        "Escribe una función"
      ],
      "avanzado": [
        "Crea una función",
        "Implementa una función"
      ]
    }

    Asegúrate de que los problemas generados estén relacionados exclusivamente con funciones reutilizables en JavaScript.
  `;
}

function generateListingPromptForStructures(topic) {
  return `
    Eres un experto en programación. Genera un listado de 15 problemas prácticos en el tema "${topic}" relacionados con estructuras de control y secuenciales en JavaScript.

    Asegúrate de que:
    - Los problemas se enfoquen en estructuras como bucles, condicionales y estructuras básicas de control.
    - Utilicen control de flujo para manejar las tareas.
    - Sean aplicables a escenarios prácticos y educativos.

    Divide los problemas en tres niveles de dificultad: básico, intermedio y avanzado.

    Formato esperado:
    {
      "basico": [
        "Escribe un bloque de control",
        "Crea un bloque"
      ],
      "intermedio": [
        "Diseña un bloque de control",
        "Crea un bloque"
      ],
      "avanzado": [
        "Escribe un bloque de control",
        "Crea un bloque de control"
      ]
    }

    Asegúrate de que los problemas generados estén relacionados exclusivamente con estructuras de control en JavaScript.
  `;
}

router.post("/generate-listing", async (req, res) => {
  const { topic } = req.body;

  if (!topic) {
    return res.status(400).json({
      success: false,
      error: "Falta el campo requerido: topic.",
    });
  }

  try {
    // Seleccionar el prompt adecuado basado en el tema
    const selectPrompt = (topic) => {
      switch (topic.toLowerCase()) {
        case "procedimientos":
          return generateListingPromptForProcedures(topic);
        case "funciones":
          return generateListingPromptForFunctions(topic);
        case "estructuras":
          return generateListingPromptForStructures(topic);
        default:
          throw new Error(
            "Tema no reconocido. Seleccione: procedimientos, funciones o estructuras."
          );
      }
    };

    // Eliminar listados previos del tema
    await ExerciseListing.deleteMany({ topic });

    // Llamar a la API para generar nuevos ejercicios
    const fetch = (await import("node-fetch")).default;
    const response = await fetch(`${API_BASE_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3.2",
        prompt: selectPrompt(topic), // Usar el prompt adecuado
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

    // Transformar los listados a la estructura esperada
    const formattedListings = {
      basico: listings.basico.map((text) => ({ text, selected: false })),
      intermedio: listings.intermedio.map((text) => ({
        text,
        selected: false,
      })),
      avanzado: listings.avanzado.map((text) => ({ text, selected: false })),
    };

    // Guardar el nuevo listado en la base de datos
    const newListing = new ExerciseListing({
      topic,
      listings: formattedListings,
    });
    await newListing.save();

    res.json({ success: true, listings: formattedListings });
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
      "language": "JavaScript",
      "solution": "Código solución en JavaScript"
    }

    Ejemplo de cómo se vería un problema generado:
    {
      "title": "Sumar dos números",
      "description": "Escribe un procedimiento en JavaScript que reciba dos números como entrada y devuelva su suma.",
      "exampleInput": "2, 3",
      "exampleOutput": "5",
      "language": "JavaScript",
      "solution": "function sumar(a, b) { return a + b; }"
    }
  `;
}

// Endpoint para generar un problema basado en un ejercicio seleccionado
router.post("/generate-problem", async (req, res) => {
  const { topic, exerciseText, level } = req.body;

  // Verificar campos requeridos
  if (!topic || !exerciseText || !level) {
    return res.status(400).json({
      success: false,
      error: "Faltan campos requeridos: topic, level o exerciseText.",
    });
  }

  try {
    const fetch = (await import("node-fetch")).default;

    // Llamada a la API externa para generar el problema
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

    // Verificar si la respuesta de la API fue exitosa
    if (!response.ok) {
      throw new Error(`Error en Ollama: ${response.statusText}`);
    }

    const { response: problemJson } = await response.json();
    const problemData = JSON.parse(problemJson);

    // Verificar que todos los campos necesarios estén presentes
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

    // Verificar si el problema ya existe en la base de datos
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
      topic: topic,
      level: level,
      title: problemData.title,
      description: problemData.description,
      prompt: exerciseText,
      exampleInput: problemData.exampleInput,
      exampleOutput: problemData.exampleOutput,
      solution: problemData.solution,
    });

    await newExercise.save();

    // Enviar respuesta exitosa con el nuevo problema
    return res.status(201).json({
      success: true,
      message: "Problema generado y guardado exitosamente.",
      exercise: newExercise,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      error: `Error al generar o guardar el problema: ${error.message}`,
    });
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

  const validCategories = ["basico", "intermedio", "avanzado"];
  if (!validCategories.includes(category)) {
    return res.status(400).json({
      success: false,
      error: `Categoría inválida. Las categorías válidas son: ${validCategories.join(
        ", "
      )}.`,
    });
  }

  try {
    // Buscar el listado correspondiente al tema
    const listing = await ExerciseListing.findOne({ topic });
    if (!listing) {
      return res.status(404).json({
        success: false,
        error:
          "No se encontró el listado de ejercicios para el tema especificado.",
      });
    }

    // Validar índice dentro del rango
    if (index < 0 || index >= listing.listings[category].length) {
      return res.status(400).json({
        success: false,
        error: "Índice fuera de rango para la categoría especificada.",
      });
    }

    // Marcar como seleccionado
    listing.listings[category][index].selected = true;
    await listing.save();

    res.json({
      success: true,
      message: "Ejercicio marcado como seleccionado correctamente.",
    });
  } catch (error) {
    console.error("Error al marcar el ejercicio como seleccionado:", error);
    res
      .status(500)
      .json({ success: false, error: "Error interno del servidor." });
  }
});

module.exports = router;
