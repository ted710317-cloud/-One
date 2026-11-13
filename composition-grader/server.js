import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { handleGradeRequest, checkRateLimit } from './server/geminiBackend.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const MAX_PER_HOUR = parseInt(process.env.RATE_LIMIT_PER_HOUR || '8', 10);

app.use(cors());
app.use(express.json({ limit: '15mb' }));

// 1. Health & Server Status Endpoint
app.get('/api/status', (req, res) => {
  const hasServerKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim());
  res.json({
    status: 'ok',
    hasServerKey,
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    maxPerHour: MAX_PER_HOUR,
    message: hasServerKey ? '伺服器內建 AI 已就緒，學生可免 Key 直接評改' : '伺服器未設定 Key，需手動設定',
  });
});

// 2. Essay Grading Endpoint with Rate Limiting
app.post('/api/grade', async (req, res) => {
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

  // Check Rate Limit (8 times per hour per IP)
  const rateLimit = checkRateLimit(clientIp, MAX_PER_HOUR);
  res.setHeader('X-RateLimit-Limit', MAX_PER_HOUR);
  res.setHeader('X-RateLimit-Remaining', rateLimit.remaining);

  if (!rateLimit.allowed) {
    return res.status(429).json({
      error: `您這小時評改次數已達上限（${MAX_PER_HOUR} 篇）。為確保其他師生使用順暢，請於 ${rateLimit.resetInMinutes} 分鐘後再試。`,
    });
  }

  try {
    const result = await handleGradeRequest(req.body);
    res.json(result);
  } catch (err) {
    console.error('Grade Error:', err);
    res.status(500).json({ error: err.message || '伺服器評改處理異常' });
  }
});

// Serve frontend in production
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 作文評改伺服器已啟動: http://localhost:${PORT}`);
  console.log(`🔑 內建 API Key: ${process.env.GEMINI_API_KEY ? '已設定（學生可免 Key 直接使用）' : '未設定'}`);
  console.log(`⏱️ 每小時頻率限制: 每 IP 上限 ${MAX_PER_HOUR} 次`);
});
