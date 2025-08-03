const { DataTypes } = require('sequelize');
const sequelize = require('../utils/db');

const Schedule = sequelize.define('Schedule', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    date: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
    },
});

module.exports = Schedule;