const express = require('express');
const { Feedback, Schedule } = require('../models');
const router = express.Router();
const fetch = require('node-fetch'); // node-fetchをインポート

// フィードバック一覧を取得 (必要であれば、関連するスケジュール情報も取得できるようにする)
router.get('/', async (req, res) => {
    try {
        const feedbacks = await Feedback.findAll({
            include: [{ model: Schedule, as: 'schedule' }] // 関連するスケジュールも取得
        });
        res.json(feedbacks);
    } catch (error) {
        console.error('Error fetching feedbacks:', error);
        res.status(500).json({ error: 'Failed to fetch feedbacks' });
    }
});

// フィードバック詳細を取得 (関連するスケジュール情報も取得)
router.get('/:id', async (req, res) => {
    try {
        const feedback = await Feedback.findByPk(req.params.id, {
            include: [{ model: Schedule, as: 'schedule' }] // 関連するスケジュールも取得
        });
        if (!feedback) {
            return res.status(404).json({ error: 'フィードバックが見つかりません' });
        }
        res.json(feedback);
    } catch (error) {
        console.error('Error fetching feedback:', error);
        res.status(500).json({ error: 'サーバーエラー' });
    }
});

// ★ 新しいエンドポイント: 特定のスケジュールに紐づくフィードバックを取得
router.get('/schedule/:scheduleId', async (req, res) => {
    try {
        const feedback = await Feedback.findOne({
            where: { scheduleId: req.params.scheduleId },
            include: [{ model: Schedule, as: 'schedule' }]
        });
        if (!feedback) {
            // フィードバックが存在しない場合は404ではなく、空のオブジェクトを返すなど、フロントエンドで扱いやすいようにする
            return res.status(200).json(null); // フィードバックがない場合はnullを返す
        }
        res.json(feedback);
    } catch (error) {
        console.error('Error fetching feedback by scheduleId:', error);
        res.status(500).json({ error: 'サーバーエラー' });
    }
});


// フィードバックを追加 (scheduleId を受け取るように変更)
router.post('/', async (req, res) => {
    const { impression, attraction, concern, aspiration, next_step, other, scheduleId } = req.body;

    if (!scheduleId) {
        return res.status(400).json({ error: 'scheduleId は必須です' });
    }

    try {
        // 既にそのscheduleIdに紐づくフィードバックが存在しないか確認
        const existingFeedback = await Feedback.findOne({ where: { scheduleId } });
        if (existingFeedback) {
            return res.status(409).json({ error: 'このスケジュールには既にフィードバックが存在します。' });
        }

        const newFeedback = await Feedback.create({
            impression,
            attraction,
            concern,
            aspiration,
            next_step,
            other,
            scheduleId
        });
        res.status(201).json(newFeedback);
    } catch (error) {
        console.error('Error creating feedback:', error);
        res.status(500).json({ error: 'フィードバックの作成に失敗しました' });
    }
});

// ★ 新しいエンドポイント: LLMサービスを呼び出してテキストを分類
router.post('/classify', async (req, res) => {
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ error: 'テキストは必須です' });
    }

    try {
        const LLM_SERVICE_URL = process.env.LLM_SERVICE_URL || 'http://localhost:8000'; // LLMサービスのURL
        const llmServiceUrl = `${LLM_SERVICE_URL}/classify-feedback`;
        const response = await fetch(llmServiceUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('LLM Service Error:', errorText);
            throw new Error(`LLMサービスからの応答エラー: ${response.status} - ${errorText}`);
        }

        const classifiedData = await response.json();
        res.json(classifiedData);
    } catch (error) {
        console.error('Error calling LLM service:', error);
        res.status(500).json({ error: `LLMサービス呼び出し中にエラーが発生しました: ${error.message}` });
    }
});

// LLMとのチャットエンドポイント
router.post('/chat', async (req, res) => {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Messages array is required for chat.' });
    }

    try {
        const LLM_SERVICE_URL = process.env.LLM_SERVICE_URL || 'http://localhost:8000';
        // カスタムLLMサービスの/chatエンドポイントを呼び出す
        const llmResponse = await fetch(`${LLM_SERVICE_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            // main.pyで定義したChatRequestの形式に合わせる
            body: JSON.stringify({
                messages: messages.map(msg => ({ sender: msg.sender, text: msg.text }))
            }),
        });

        if (!llmResponse.ok) {
            const errorData = await llmResponse.json();
            throw new Error(`LLM chat service error: ${llmResponse.status} - ${errorData.detail || llmResponse.statusText}`);
        }

        // main.pyからの応答形式 ({ "reply": "..." }) に合わせる
        const chatResult = await llmResponse.json();
        res.json({ reply: chatResult.reply });
    } catch (error) {
        console.error('Error calling LLM chat service:', error.message);
        res.status(500).json({ error: `Failed to communicate with LLM chat service: ${error.message}` });
    }
});

// ★ 新しいエンドポイント: LLMサービスを呼び出して長文を分析し、最初の質問を取得
router.post('/chat/analyze', async (req, res) => {
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ error: 'テキストは必須です' });
    }

    try {
        const LLM_SERVICE_URL = process.env.LLM_SERVICE_URL || 'http://localhost:8000';

        // Step 1: テキストを再構成するエージェントを呼び出す
        const rephraseResponse = await fetch(`${LLM_SERVICE_URL}/chat/rephrase`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
        });

        if (!rephraseResponse.ok) {
            const errorText = await rephraseResponse.text();
            console.error('LLM Rephrase Service Error:', errorText);
            throw new Error(`LLMテキスト再構成サービスからの応答エラー: ${rephraseResponse.status} - ${errorText}`);
        }
        const rephrasedData = await rephraseResponse.json();
        const rephrasedText = rephrasedData.reply;

        // Step 2: 深掘り質問を生成するエージェントを呼び出す
        const deepDiveResponse = await fetch(`${LLM_SERVICE_URL}/chat/deep_dive_questions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: rephrasedText }), // 再構成されたテキストを渡す
        });

        if (!deepDiveResponse.ok) {
            const errorText = await deepDiveResponse.text();
            console.error('LLM Deep Dive Questions Service Error:', errorText);
            throw new Error(`LLM深掘り質問サービスからの応答エラー: ${deepDiveResponse.status} - ${errorText}`);
        }
        const deepDiveData = await deepDiveResponse.json();
        const deepDiveQuestions = deepDiveData.reply;

        // Step 3: 最終的な応答を構成する
        const finalReply = `こんな感じですね、${rephrasedText}。\n\n${deepDiveQuestions}`;

        res.json({ reply: finalReply });

    } catch (error) {
        console.error('Error calling LLM analyze service:', error);
        res.status(500).json({ error: `LLM分析サービス呼び出し中にエラーが発生しました: ${error.message}` });
    }
});

module.exports = router;