const express = require('express');
const router = express.Router();
const Problem = require('../models/Problem');

// Obtener problemas pendientes
router.get('/unresolved', async (req, res) => {
  const problems = await Problem.find({ resolved: false });
  res.json({ success: true, problems });
});

// Marcar un problema como resuelto
router.post('/resolve/:id', async (req, res) => {
  const { id } = req.params;
  const { cause, solution } = req.body;

  const problem = await Problem.findByIdAndUpdate(
    id,
    {
      cause,
      solution,
      resolved: true,
      resolvedAt: Date.now(),
    },
    { new: true }
  );

  res.json({ success: true, problem });
});

module.exports = router;
