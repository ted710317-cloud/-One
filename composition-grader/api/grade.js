import { handleGradeRequest, checkRateLimit } from '../server/geminiBackend.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const maxPerHour = parseInt(process.env.RATE_LIMIT_PER_HOUR || '8', 10);
  const rateLimit = checkRateLimit(clientIp, maxPerHour);

  res.setHeader('X-RateLimit-Limit', maxPerHour);
  res.setHeader('X-RateLimit-Remaining', rateLimit.remaining);

  if (!rateLimit.allowed) {
    return res.status(429).json({
      error: `您這小時評改次數已達上限（${maxPerHour} 篇）。為確保其他師生使用順暢，請於 ${rateLimit.resetInMinutes} 分鐘後再試。`,
    });
  }

  try {
    const result = await handleGradeRequest(req.body);
    res.status(200).json(result);
  } catch (err) {
    console.error('Vercel API Grade Error:', err);
    res.status(500).json({ error: err.message || '伺服器處理失敗' });
  }
}
