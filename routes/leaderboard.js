const express = require('express');
const router = express.Router();
const Leaderboard = require('../models/leaderboard');

// Get the leaderboard
router.get('/leaderboard', async (req, res) => {
    try {
        const entries = await Leaderboard.findAll({
            attributes: ['username', 'time'],
            order: [['time', 'ASC']],
            limit: 10
        });
        res.json(entries);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Post a new score
router.post('/leaderboard', async (req, res) => {
    try {
        const { username, moves, time } = req.body;
        const newEntry = await Leaderboard.create({ username, moves, time });
        res.json(newEntry);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
