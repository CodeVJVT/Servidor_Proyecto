const mongoose = require('mongoose');

const UserProgressSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    solvedProblems: [
        {
            problemCode: { type: String, required: true },
            status: { type: String, enum: ['correcto', 'incorrecto'], required: true },
            attempts: { type: Number, default: 1 },
            score: { type: Number, required: true }
        }
    ],
    totalScore: { type: Number, default: 0 }
});

module.exports = mongoose.model('UserProgress', UserProgressSchema);
