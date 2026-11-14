export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const hasServerKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim());
  let usageCount = null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    const cResp = await fetch('https://abacus.jasoncameron.dev/get/weizhen-composition-grader/evaluations', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (cResp.ok) {
      const cData = await cResp.json();
      if (typeof cData.value === 'number') {
        usageCount = cData.value;
      }
    }
  } catch (e) {
    console.warn('Status get remote counter failed or timed out:', e.message);
  }

  res.status(200).json({
    status: 'ok',
    hasServerKey,
    usageCount,
    model: process.env.GEMINI_MODEL || 'gemini-flash-lite-latest',
    maxPerHour: parseInt(process.env.RATE_LIMIT_PER_HOUR || '60', 10),
    message: hasServerKey ? '伺服器內建 AI 已就緒，學生可免 Key 直接評改' : '伺服器未設定 Key，需手動設定',
  });
}
