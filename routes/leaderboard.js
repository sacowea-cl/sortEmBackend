const express = require('express');
const router = express.Router();
const Leaderboard = require('../models/leaderboard');
const { decryptWithMp3Key } = require('../encryption');
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

const isPostValid = (jsonObject) => {
    const { username, moves, time } = jsonObject;
    return !(username.length > 30 || moves <= 0 || time < 1000)
};

// Post a new score
router.post('/leaderboard', async (req, res) => {
    try {
        const { x } = req.body;
        const decryptedJson = JSON.parse(await decryptWithMp3Key(x));
        if (!isPostValid(decryptedJson)) {
            return res.status(400).json({ msg: 'Invalid request' });
        }
        const newEntry = await Leaderboard.create(decryptedJson);
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

// Get all usernames
router.get('/leaderboard/usernames', async (req, res) => {
    try {
        const usernames = await Leaderboard.findAll({
            attributes: ['username'],
            group: ['username']
        });
        res.json(usernames);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
