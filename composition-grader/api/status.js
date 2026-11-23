export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const hasServerKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim());

  res.status(200).json({
    status: 'ok',
    hasServerKey,
    model: process.env.GEMINI_MODEL || 'gemini-flash-lite-latest',
    maxPerHour: parseInt(process.env.RATE_LIMIT_PER_HOUR || '60', 10),
    message: hasServerKey ? '伺服器內建 AI 已就緒，學生可免 Key 直接評改' : '伺服器未設定 Key，需手動設定',
  });
}
