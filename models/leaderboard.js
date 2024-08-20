const { DataTypes } = require('sequelize');
const database = require('../config/database');

const Leaderboard = database.define('Leaderboard', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    username: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    moves: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    time: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    address: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    possible_cheater: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
    },
}, {
    tableName: 'leaderboard',
    timestamps: false, // Disable Sequelize's automatic timestamp columns
});

module.exports = Leaderboard;
