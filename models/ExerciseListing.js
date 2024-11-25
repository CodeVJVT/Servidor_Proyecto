const mongoose = require("mongoose");

const ExerciseListingSchema = new mongoose.Schema({
  topic: { type: String, required: true },
  listings: {
    basico: [
      {
        text: { type: String, required: true },
        selected: { type: Boolean, default: false }, // Nuevo campo
      },
    ],
    intermedio: [
      {
        text: { type: String, required: true },
        selected: { type: Boolean, default: false }, // Nuevo campo
      },
    ],
    avanzado: [
      {
        text: { type: String, required: true },
        selected: { type: Boolean, default: false }, // Nuevo campo
      },
    ],
  },
});

module.exports = mongoose.model("ExerciseListing", ExerciseListingSchema);
