import express from 'express';
import * as trpcExpress from '@trpc/server/adapters/express';
import { appRouter } from './router';
import cors from 'cors';

const app = express();
const apiEndpoint = '/trpc';

app.use(express.json());

// CORSミドルウェアをtRPCエンドポイントのパスに限定して適用
app.use(
  apiEndpoint,
  cors({
    origin: 'http://localhost:3000', // フロントエンドのオリジンを明示的に許可
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // 許可するHTTPメソッド
    credentials: true, // クッキーなどの資格情報を許可する場合
  }),
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext: () => ({}),
  })
);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log(`tRPC endpoint: http://localhost:${PORT}${apiEndpoint}`);
});