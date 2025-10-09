import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { env } from './environment';
import { createAuthRouter } from './routes/auth';
import { createSubscriptionsRouter } from './routes/subscriptions';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.corsOrigin === '*' ? true : env.corsOrigin.split(','),
    credentials: false,
  }),
);
app.use(express.json());
app.use(
  morgan(env.port === 4000 ? 'dev' : 'combined', {
    skip: (_req, res) => res.statusCode < 400,
  }),
);

app.get('/health', (_req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

app.use('/auth', createAuthRouter());
app.use('/subscriptions', createSubscriptionsRouter());

app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error('Unexpected error', err);
    res.status(500).json({ error: 'Internal server error' });
  },
);

app.listen(env.port, () => {
  console.log(`API listening on port ${env.port}`);
});
