const sequelize = require('../utils/db');
const Schedule = require('./Schedule');
const Feedback = require('./Feedback');

// 1対1の関連付けを定義
Schedule.hasOne(Feedback, {
  foreignKey: 'scheduleId',
  as: 'feedback' // 取得時のエイリアス名
});
Feedback.belongsTo(Schedule, {
  foreignKey: 'scheduleId',
  as: 'schedule'
});

// 必要に応じて他のモデルもここに追加

const db = {
  sequelize,
  Schedule,
  Feedback,
};

module.exports = db;