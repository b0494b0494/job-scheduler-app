const express = require('express');
const { Schedule, Feedback } = require('../models');
const router = express.Router();
const { Op } = require('sequelize'); // Opをインポート

// スケジュール一覧を取得 (関連するフィードバックも取得、日付でフィルタリング可能)
router.get('/', async (req, res) => {
    try {
        const { date } = req.query;
        let whereClause = {};

        if (date) {
            // 日付が指定された場合、その日付のスケジュールを検索
            whereClause.date = date;
        }

        const schedules = await Schedule.findAll({
            where: whereClause,
            include: [{ model: Feedback, as: 'feedback' }]
        });
        res.json(schedules);
    } catch (error) {
        console.error('Error fetching schedules:', error);
        res.status(500).json({ error: 'Failed to fetch schedules' });
    }
});

// ★ 新しいエンドポイント: スケジュール詳細を取得 (関連するフィードバックも取得)
router.get('/:id', async (req, res) => {
    try {
        const schedule = await Schedule.findByPk(req.params.id, {
            include: [{ model: Feedback, as: 'feedback' }] // 関連するフィードバックも取得
        });
        if (!schedule) {
            return res.status(404).json({ error: 'スケジュールが見つかりません' });
        }
        res.json(schedule);
    } catch (error) {
        console.error('Error fetching schedule:', error);
        res.status(500).json({ error: 'サーバーエラー' });
    }
});

// スケジュールを追加
router.post('/', async (req, res) => {
    const { title, date, description } = req.body;

    if (!title || !date) {
        return res.status(400).json({ error: 'タイトルと日付は必須です' });
    }

    try {
        const newSchedule = await Schedule.create({ title, date, description });
        res.status(201).json(newSchedule);
    } catch (error) {
        console.error('Error creating schedule:', error);
        res.status(500).json({ error: 'スケジュールの作成に失敗しました' });
    }
});

module.exports = router;