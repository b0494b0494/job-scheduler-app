const express = require('express');
const bodyParser = require('body-parser');
const scheduleRoutes = require('./routes/scheduleRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const { sequelize } = require('./models');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ルート
app.use('/api/schedules', scheduleRoutes);
app.use('/api/feedbacks', feedbackRoutes);

// データベース接続のリトライロジック
const connectWithRetry = () => { // ★ 関数定義をここに移動
    sequelize.sync({ alter: true }).then(() => {
        console.log('Database connected and synced');
        app.listen(5000, () => console.log('Server running on port 5000'));
    }).catch((err) => {
        console.error('Failed to connect to the database:', err.message);
        console.log('Retrying database connection in 5 seconds...');
        setTimeout(connectWithRetry, 5000); // 5秒後に再試行
    });
};

connectWithRetry(); // ★ 関数呼び出し