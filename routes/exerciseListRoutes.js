const express = require('express');
const router = express.Router();

// Endpoint para generar una lista de ejercicios basados en el tema
router.get('/generate-exercises/:topicId', async (req, res) => {
    const { topicId } = req.params;
    
    // Generación de ejercicios ficticia - este bloque debería reemplazarse por la generación real
    const exercises = Array.from({ length: 10 }, (_, index) => ({
        id: `${topicId}-exercise-${index + 1}`,
        title: `Ejercicio ${index + 1} de ${topicId}`,
        difficulty: ['Fácil', 'Media', 'Difícil'][index % 3],
    }));

    res.json({ success: true, exercises });
});

module.exports = router;
