const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); // CORS パッケージをインポート
const feedbackRoutes = require('./routes/feedbackRoutes'); // フィードバック用のルート
const sequelize = require('./utils/db'); // データベース接続

const app = express();

// CORS 設定を最初に追加
app.use(cors()); // 全てのオリジンを許可

// JSON パーサーを追加
app.use(bodyParser.json());

// デバッグ用のミドルウェアを追加
app.use((req, res, next) => {
    console.log('CORS Debug: Origin:', req.headers.origin);
    console.log('CORS Debug: Method:', req.method);
    console.log('CORS Debug: Headers:', req.headers);
    next();
});

// フィードバック用のルート
app.use('/api/feedbacks', feedbackRoutes);

// サーバー起動
sequelize.sync().then(() => {
    console.log('Database connected');
    app.listen(5000, () => console.log('Server running on port 5000'));
}).catch((err) => {
    console.error('Failed to connect to the database:', err);
});