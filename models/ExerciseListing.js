const mongoose = require("mongoose");

const ExerciseListingSchema = new mongoose.Schema({
  topic: { type: String, required: true },
  listings: {
    basico: [
      {
        text: { type: String, required: true },
        selected: { type: Boolean, default: false },
      },
    ],
    intermedio: [
      {
        text: { type: String, required: true },
        selected: { type: Boolean, default: false },
      },
    ],
    avanzado: [
      {
        text: { type: String, required: true },
        selected: { type: Boolean, default: false },
      },
    ],
  },
});

module.exports = mongoose.model("ExerciseListing", ExerciseListingSchema);
