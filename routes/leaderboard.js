const express = require('express');
const router = express.Router();
const Leaderboard = require('../models/leaderboard');
require('dotenv').config();

// Get the leaderboard
router.get('/leaderboard', async (req, res) => {
    try {
        const entries = await Leaderboard.findAll({
            attributes: ['username', 'time'],
            order: [['time', 'ASC']],
            limit: 100
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

// Delete all scores
router.patch('/leaderboard/pablochile', async (req, res) => {
    try {
        const { password } = req.body;
        if (password !== process.env.DELETE_PASSWORD) {
            return res.status(401).json({ msg: 'Unauthorized' });
        }
        await Leaderboard.destroy({
            where: {},
            truncate: true
        });
        res.json({ msg: 'All scores deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
