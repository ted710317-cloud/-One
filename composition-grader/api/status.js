export default async function handler(req, res) {
  const hasServerKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim());
  let usageCount = 18;

  try {
    const cResp = await fetch('https://abacus.jasoncameron.dev/get/weizhen-composition-grader/evaluations', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (cResp.ok) {
      const cData = await cResp.json();
      usageCount = cData.value;
    }
  } catch (e) {
    // fallback
  }

  res.status(200).json({
    status: 'ok',
    hasServerKey,
    usageCount,
    model: process.env.GEMINI_MODEL || 'gemini-flash-lite-latest',
    maxPerHour: parseInt(process.env.RATE_LIMIT_PER_HOUR || '8', 10),
    message: hasServerKey ? '伺服器內建 AI 已就緒，學生可免 Key 直接評改' : '伺服器未設定 Key，需手動設定',
  });
}
