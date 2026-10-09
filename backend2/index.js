const express = require('express');
const app = express();

const NAME = 'backend2';

app.get('/', (req, res) => {
  res.json({
    server: NAME,
    message: `Hello from ${NAME}!`,
    forwarded_for: req.headers['x-forwarded-for'] ?? null,
    forwarded_proto: req.headers['x-forwarded-proto'] ?? null,
    real_ip: req.headers['x-real-ip'] ?? null,
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (_req, res) => res.json({ status: 'ok', server: NAME }));

app.listen(3000, () => console.log(`${NAME} listening on :3000`));
