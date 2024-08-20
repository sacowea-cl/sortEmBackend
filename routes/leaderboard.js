const express = require('express');
const Sequelize = require('sequelize');
const router = express.Router();
const Leaderboard = require('../models/leaderboard');
const { decryptWithMp3Key } = require('../encryption');
require('dotenv').config();

const bannedUsernames = ['admin', 'root', 'pablochile', 'LinusTorvalds'];
const bannedAddresses = ['191.113.149.195'];

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
    return !(username.length > 30 || moves < 0 || time < 1000 || bannedUsernames.includes(username)
             || bannedAddresses.includes(jsonObject.address));
};

// Post a new score
router.post('/leaderboard', async (req, res) => {
    try {
        const address = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        console.log("ip:", address);
        const { x } = req.body;
        const decryptedJson = JSON.parse(await decryptWithMp3Key(x));
        if (!isPostValid(decryptedJson)) {
            return res.status(400).json({ msg: 'Invalid request' });
        }
        const newEntry = await Leaderboard.create({ ...decryptedJson, address: address });
        res.json(newEntry);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Get the worst scores
router.get('/leaderboard/worst', async (req, res) => {
    try {
        const entries = await Leaderboard.findAll({
            attributes: ['username', 'time'],
            order: [['time', 'DESC']],
            limit: 10
        });
        res.json(entries);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Get currently active users
router.get('/leaderboard/active', async (req, res) => {
    try {
        const { Op } = require('sequelize');
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

        const activeUsers = await Leaderboard.count({
            distinct: true,
            col: 'username',
            where: {
                created_at: {
                    [Op.gte]: thirtyMinutesAgo
                }
            }
        });

        res.json({ activeUsers });
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

// Get all usernames ordered by oldest recorded game
router.get('/leaderboard/usernames', async (req, res) => {
    try {
        const usernames = await Leaderboard.findAll({
            attributes: [
                'username',
                [Sequelize.fn('MIN', Sequelize.col('created_at')), 'earliestCreatedAt']
            ],
            group: ['username'],
            order: [[Sequelize.fn('MIN', Sequelize.col('created_at')), 'ASC']],
        });
        res.json(usernames);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});


module.exports = router;
