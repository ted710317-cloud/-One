export default function handler(req, res) {
  const hasServerKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim());
  res.status(200).json({
    status: 'ok',
    hasServerKey,
    model: process.env.GEMINI_MODEL || 'gemini-flash-lite-latest',
    maxPerHour: parseInt(process.env.RATE_LIMIT_PER_HOUR || '8', 10),
    message: hasServerKey ? '伺服器內建 AI 已就緒，學生可免 Key 直接評改' : '伺服器未設定 Key，需手動設定',
  });
}
