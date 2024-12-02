// Test file: generateProblemRoute.test.js

const request = require("supertest");
const express = require("express");
const fetch = require("node-fetch");
jest.mock("node-fetch"); // Mockea 'node-fetch'

// Importar rutas y controladores necesarios
const exerciseRoutes = require("../routes/exerciseRoutes"); // Ruta de tus ejercicios
const app = express();
app.use(express.json());
app.use("/api/exercises", exerciseRoutes);

// Definir un mock para 'node-fetch'
const { Response } = jest.requireActual("node-fetch"); // Esto obtiene la clase Response real

// Mock de la respuesta que 'fetch' debe devolver
fetch.mockResolvedValue(
  new Response(JSON.stringify({ response: '{"title":"Test Problem"}' }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
);

describe("POST /generate-problem", () => {
  it("should generate a problem and return a response", async () => {
    // Datos de prueba
    const payload = {
      topic: "procedimientos",
      exerciseText: "Genera un problema de procedimientos en JavaScript",
      level: "basico",
    };

    // Realizamos la solicitud al endpoint
    const response = await request(app)
      .post("/api/exercises/generate-problem")
      .send(payload)
      .expect(200);

    // Verificamos el contenido de la respuesta
    expect(response.body).toHaveProperty("title", "Test Problem");
  });

  it("should return an error if fields are missing", async () => {
    const payload = { topic: "", exerciseText: "", level: "" }; // Datos incorrectos

    const response = await request(app)
      .post("/api/exercises/generate-problem")
      .send(payload)
      .expect(400);

    // Verifica que el error esté presente
    expect(response.body.error).toBe(
      "Faltan campos requeridos: topic, level o exerciseText."
    );
  });
});
