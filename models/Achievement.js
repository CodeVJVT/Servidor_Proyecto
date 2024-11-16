const mongoose = require('mongoose');

const AchievementSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    achievements: [
        {
            name: { type: String, required: true }, // Nombre del logro
            description: { type: String, required: true }, // Descripción del logro
            dateEarned: { type: Date, default: Date.now }, // Fecha en la que se obtuvo
            points: { type: Number, default: 0 } // Puntos otorgados por el logro
        }
    ],
    totalAchievements: { type: Number, default: 0 } // Total de logros obtenidos
});

module.exports = mongoose.model('Achievement', AchievementSchema);
