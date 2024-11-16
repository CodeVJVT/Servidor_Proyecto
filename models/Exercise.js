const mongoose = require("mongoose");

const ExerciseSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    topic: { type: String, required: true },
    level: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    prompt: { type: String, required: true },
    exampleInput: { type: String, required: true },
    exampleOutput: { type: String, required: true },
    solution: { type: String, required: true },
  },
  {
    timestamps: true, // Incluye createdAt y updatedAt automáticamente
  }
);

module.exports = mongoose.model("Exercise", ExerciseSchema);