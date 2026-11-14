import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import dotenv from 'dotenv';
import { handleGradeRequest, checkRateLimit } from './server/geminiBackend.js';

dotenv.config();

function apiDevServerPlugin() {
  const MAX_PER_HOUR = parseInt(process.env.RATE_LIMIT_PER_HOUR || '8', 10);
  return {
    name: 'api-dev-server-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/status' && req.method === 'GET') {
          const hasServerKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim());
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              status: 'ok',
              hasServerKey,
              model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
              maxPerHour: MAX_PER_HOUR,
              message: hasServerKey ? '伺服器內建 AI 已就緒，學生可免 Key 直接評改' : '伺服器未設定 Key，需手動設定',
            })
          );
          return;
        }

        if (req.url === '/api/grade' && req.method === 'POST') {
          const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
          const rateLimit = checkRateLimit(clientIp, MAX_PER_HOUR);

          res.setHeader('X-RateLimit-Limit', MAX_PER_HOUR);
          res.setHeader('X-RateLimit-Remaining', rateLimit.remaining);

          if (!rateLimit.allowed) {
            res.statusCode = 429;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                error: `您這小時評改次數已達上限（${MAX_PER_HOUR} 篇）。為確保其他師生使用順暢，請於 ${rateLimit.resetInMinutes} 分鐘後再試。`,
              })
            );
            return;
          }

          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const data = JSON.parse(body || '{}');
              const result = await handleGradeRequest(data);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message || '伺服器評改處理失敗' }));
            }
          });
          return;
        }

        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), apiDevServerPlugin()],
});
