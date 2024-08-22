const express = require('express');
const Sequelize = require('sequelize');
const router = express.Router();
const Leaderboard = require('../models/leaderboard');
const BannedIP = require('../models/BannedIP');
const { decryptWithMp3Key } = require('../encryption');
require('dotenv').config();

const fetchLeaderboardEntries = async ({ ascending = true, fetchLimit = 50 } = {}) => {
    if (ascending) {
        return await Leaderboard.findAll({
            attributes: ['username', 'time'],
            order: [['time', 'ASC']],
            limit: fetchLimit,
            where: {
                possible_cheater: false
            }
        });
    }
    return await Leaderboard.findAll({
        attributes: ['username', 'time'],
        order: [['time', 'DESC']],
        limit: fetchLimit,
        where: {
            possible_cheater: false
        }
    });
};

const fetchDailyLeaderboardEntries = async ({ ascending = true, fetchLimit = 10 } = {}) => {
    const { Op } = require('sequelize');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (ascending) {
        return await Leaderboard.findAll({
            attributes: ['username', 'time'],
            order: [['time', 'ASC']],
            limit: fetchLimit,
            where: {
                created_at: {
                    [Op.gte]: today
                },
                possible_cheater: false
            }
        });
    }
    return await Leaderboard.findAll({
        attributes: ['username', 'time'],
        order: [['time', 'DESC']],
        limit: fetchLimit,
        where: {
            created_at: {
                [Op.gte]: today
            },
            possible_cheater: false
        }
    });
};

// Get the leaderboard
router.get('/leaderboard', async (req, res) => {
    try {
        const entries = await fetchLeaderboardEntries();
        res.json(entries);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Get daily leaderboard
router.get('/leaderboard/daily', async (req, res) => {
    try {
        const entries = await fetchDailyLeaderboardEntries();
        res.json(entries);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

const isPostValid = async (jsonObject, address) => {
    const { username, moves, time } = jsonObject;
    const isIpBanned = await BannedIP.findOne({
        where: {
            ip_address: address
        }
    });

    const alphanumericRegex = /^[a-zA-Z0-9]+$/;
    return !(username.length > 25 || moves < 0 || time < 1000 || isIpBanned || !alphanumericRegex.test(username));
};

// Post a new score
router.post('/leaderboard', async (req, res) => {
    try {
        const address = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const { x } = req.body;
        const decryptedJson = JSON.parse(await decryptWithMp3Key(x));

        if (!await isPostValid(decryptedJson, address)) {
            return res.status(400).json({ msg: 'Invalid request' });
        }

        const top50 = await fetchLeaderboardEntries();
        const worstTen = await fetchLeaderboardEntries({ ascending: false, fetchLimit: 10 });

        let newEntry;
        if ((top50.length === 50 && decryptedJson.time <= top50[49].time) ||
            (worstTen.length === 10 && decryptedJson.time >= worstTen[9].time)) {
            newEntry = await Leaderboard.create({ ...decryptedJson, address: address, possible_cheater: true });
        } else {
            newEntry = await Leaderboard.create({ ...decryptedJson, address: address, possible_cheater: false });
        }
        res.json(newEntry);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Get best time
router.get('/leaderboard/best', async (req, res) => {
    try {
        const { position } = req.query;
        const best = await Leaderboard.findOne({
            attributes: ['username', 'time'],
            order: [['time', 'ASC']],
            offset: parseInt(position) - 1,
            limit: 1,
            where: {
                possible_cheater: false
            }
        });
        res.json(best);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Get possible cheaters
router.get('/leaderboard/cheaters', async (req, res) => {
    try {
        const cheaters = await Leaderboard.findAll({
            attributes: ['username', 'time', 'address', 'created_at'],
            where: {
                possible_cheater: true
            },
            order: [['time', 'ASC']],
            limit: 10
        });
        res.json(cheaters);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

//Get username all games
router.get('/leaderboard/games', async (req, res) => {
    try {
        const { username } = req.query;
        const user = await Leaderboard.findAll({
            attributes: ['username', 'time', 'created_at'],
            where: {
                username: username
            },
            order: [['time', 'ASC']],
        });
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
}
);

// Patch possible cheater as non-cheater (false positive)
router.patch('/leaderboard/cheaters', async (req, res) => {
    try {
        const { username, validation_key } = req.body;
        // Find all the entries with the same username to update as non-cheaters
        console.log(username);
        const entries = await Leaderboard.findAll({
            where: {
                username: username,
                possible_cheater: true
            }
        });

        if (entries.length === 0) {
            return res.status(404).json({ msg: 'No entries found' });
        }
        if (validation_key !== process.env.CHEATER_VALIDATION_KEY) {
            return res.status(401).json({ msg: 'Unauthorized' });
        }

        const updatedEntries = await Leaderboard.update({
            possible_cheater: false
        }, {
            where: {
                username: username,
                possible_cheater: true
            }
        });

        res.json({ updatedEntries });
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

//Get banned ips
router.get('/leaderboard/banned', async (req, res) => {
    try {
        const banned = await BannedIP.findAll({
            attributes: ['ip_address', 'banned_at'],
        });
        res.json(banned);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Ban an IP address
router.post('/leaderboard/banned', async (req, res) => {
    try {
        const { ip_address, password } = req.body;
        if (password !== process.env.DELETE_PASSWORD) {
            return res.status(401).json({ msg: 'Unauthorized' });
        }
        const address = await BannedIP.create({ ip_address });
        res.json(address);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Remove user's possible chated games from the leaderboard
router.delete('/leaderboard/cheaters', async (req, res) => {
    try {
        const { username } = req.body;
        const deleted = await Leaderboard.destroy({
            where: {
                username: username,
                possible_cheater: true
            }
        });
        res.json({ deleted });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Get the total number of scores
router.get('/leaderboard/total', async (req, res) => {
    try {
        const total = await Leaderboard.count();
        res.json({ total });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
