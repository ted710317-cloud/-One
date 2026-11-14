/**
 * 全域使用人次計數器 API
 * 準則：使用者貼上文章進行評閱成功即加 1
 */
const ABACUS_BASE = 'https://abacus.jasoncameron.dev';
const NAMESPACE = 'weizhen-composition-grader';
const KEY = 'evaluations';

let inMemoryFallback = 11; // 目前已驗證的最新人次基數

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method === 'POST') {
    // 增加 1 人次
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const resp = await fetch(`${ABACUS_BASE}/hit/${NAMESPACE}/${KEY}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (resp.ok) {
        const data = await resp.json();
        if (typeof data.value === 'number') {
          inMemoryFallback = Math.max(inMemoryFallback, data.value);
          return res.status(200).json({ value: data.value });
        }
      }
    } catch (err) {
      console.warn('Counter hit remote failed, using fallback:', err.message);
    }
    inMemoryFallback += 1;
    return res.status(200).json({ value: inMemoryFallback });
  }

  // 讀取當前人次
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    const resp = await fetch(`${ABACUS_BASE}/get/${NAMESPACE}/${KEY}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (resp.ok) {
      const data = await resp.json();
      if (typeof data.value === 'number') {
        inMemoryFallback = Math.max(inMemoryFallback, data.value);
        return res.status(200).json({ value: data.value });
      }
    }
  } catch (err) {
    console.warn('Counter get remote failed, using fallback:', err.message);
  }

  return res.status(200).json({ value: inMemoryFallback });
}
