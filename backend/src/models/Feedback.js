const { DataTypes } = require('sequelize');
const sequelize = require('../utils/db');

const Feedback = sequelize.define('Feedback', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    impression: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    attraction: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    concern: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    aspiration: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    next_step: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    other: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    scheduleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: {
            model: 'Schedules', // テーブル名を文字列で参照
            key: 'id'
        }
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName: 'feedbacks',
    timestamps: false,
});

module.exports = Feedback;