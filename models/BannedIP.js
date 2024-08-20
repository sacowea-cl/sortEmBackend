const { DataTypes } = require('sequelize');
const database = require('../config/database');

const BannedIP = database.define('BannedIP', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    ip_address: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
    },
    banned_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
    },
}, {
    tableName: 'banned_ips',
    timestamps: false,
});

module.exports = BannedIP;
