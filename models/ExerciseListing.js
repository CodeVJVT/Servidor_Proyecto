const mongoose = require("mongoose");

const ExerciseListingSchema = new mongoose.Schema(
  {
    topic: { type: String, required: true, unique: true },
    listings: {
      basico: { type: [String], required: true },
      intermedio: { type: [String], required: true },
      avanzado: { type: [String], required: true },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ExerciseListing", ExerciseListingSchema);
