import { SAMPLE_ESSAY_BASKETBALL } from '../constants/presets';

/**
 * 檢查後端伺服器是否已內建 Gemini API Key
 */
export async function checkServerStatus() {
  try {
    const res = await fetch('/api/status');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('無法連線至後端 /api/status，將切換為純前端模式:', err);
  }
  return { hasServerKey: false, model: 'gemini-2.5-flash', maxPerHour: 8 };
}

/**
 * 送出作文進行會考六級分深度評閱
 * 優先透過後端 API (/api/grade) 進行伺服器端代呼叫（附帶 Rate Limit 頻率防護）
 */
export async function gradeEssay({
  apiKey = '',
  model = 'gemini-2.5-flash',
  title,
  promptGuide,
  targetWordCount,
  selectedRhetorics = [],
  content = '',
  imageBase64 = null,
  imageMimeType = 'image/jpeg',
  isDemo = false,
}) {
  // 示範模式快速模擬回傳
  if (isDemo && !apiKey) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return SAMPLE_ESSAY_BASKETBALL.mockResult;
  }

  // 1. 優先透過後端 /api/grade 進行評閱（學生免申請 Key）
  try {
    const res = await fetch('/api/grade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customApiKey: apiKey,
        model,
        title,
        promptGuide,
        targetWordCount,
        selectedRhetorics,
        content,
        imageBase64,
        imageMimeType,
      }),
    });

    if (res.status === 429) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || '您這小時的評改次數已達上限，請稍作休息後再試。');
    }

    if (res.ok) {
      const data = await res.json();
      return data;
    }

    // 若後端回傳 500 等錯誤且包含訊息
    const errJson = await res.json().catch(() => ({}));
    if (errJson.error) {
      throw new Error(errJson.error);
    }
  } catch (err) {
    // 若為 Rate Limit 錯誤直接往外拋，不嘗試重送
    if (err.message && err.message.includes('上限')) {
      throw err;
    }

    // 若後端連線失敗或提示尚未設定 Key，且使用者本地有手動輸入 Key，則嘗試純前端直連 fallback
    if (apiKey) {
      return await directClientGrade({
        apiKey,
        model,
        title,
        promptGuide,
        targetWordCount,
        selectedRhetorics,
        content,
        imageBase64,
        imageMimeType,
      });
    }

    throw err;
  }
}

/**
 * 純前端 Direct Client-side Fallback
 */
async function directClientGrade({
  apiKey,
  model,
  title,
  promptGuide,
  targetWordCount,
  selectedRhetorics,
  content,
  imageBase64,
  imageMimeType,
}) {
  const SYSTEM_INSTRUCTION = `
你是一位具備 20 年臺灣中小學語文教學與「國中教育會考作文評閱」資深閱卷委員經驗的專家導師。
你的任務是依據「臺灣國中教育會考六級分制評分規準」，針對學生提交的作文進行客觀、全面、專業、溫暖且具啟發性的診斷評改。

【會考六級分規準判定核心原則】
- 六級分：立意深遠透徹，取材新穎貼切；結構嚴密，首尾呼應；遣詞精確多樣，文句流暢富感染力；幾無錯別字與標點錯誤。
- 五級分：切合題旨，取材適當；組織完整，層次分明；詞句通順流暢；錯別字及標點瑕疵極少且不影響文意。
- 四級分：大致切題，取材平實常見；結構尚稱完整但轉折略嫌生硬；文字尚通順但有少數贅字或語病；有少許錯字或標點錯誤。
- 三級分：題旨發揮未盡完整或取材零散；組織鬆散，章法不足；造句不順或詞不達意；錯別字或標點錯誤頻繁。
- 二級分：審題不清或偏離題旨，內容貧乏；缺乏條理結構；語病嚴重；錯別字極多。
- 一級分：僅寫零星文句、內容極度貧乏、無文理可循。
- 零級分：完全空白、文不對題、或完全抄錄題目說明。

【執行守則與輸出要求】
1. 閱卷導師綜合短評：文字長度嚴格要求在「100字到150字之間」，需涵蓋立意取材、修辭與文字張力、情感體悟之全面診斷，兼具專業深度與教育溫暖。
2. 純文字字數統計：統計純文字字數，評估是否達到設定之目標字數範圍。
3. 指定修辭檢驗：逐一比對使用者指定之修辭（如譬喻、摹寫、引用、設問等），若有使用，精準摘錄原文例句並評價其效果；若未使用，提供具體融入建議。
4. 四向度深度診斷：每向度均包含「亮點（正面鼓勵）」與「建議（具體改進點）」。
5. 錯別字與標點診療：找出錯別字或常見標點誤用，提供正確字形與簡易辨析。
6. 句子升級魔法：挑選原文中 1 句具潛力的句子，示範更高層次的修辭與遣詞改寫範例。
7. 六級分昇華範文示範：
   - 務必以「學生原本的經歷故事、情節骨架與生活記憶」為基礎，絕不無中生有更換故事。
   - 巧妙將「學生原本未使用的指定修辭（如引用、設問）」自然融進範文中。
   - 深化立意與哲思（提升至會考六級分維度），修飾語病與錯別字。
   - 附帶 2~3 點「升級亮點解析」，讓學生明白是如何從原稿昇華到六級分。
8. 回傳格式：必須嚴格回傳純 JSON，不得包裹額外對話贅字。
`;

  const promptUser = `
請評閱以下作文作品：
【寫作題目】：${title || '未指定題目'}
【題目引導與說明】：${promptGuide || '無特殊引導說明'}
【目標字數要求】：${targetWordCount || '未限定字數'}
【指定檢測之必備修辭清單】：${selectedRhetorics.length > 0 ? selectedRhetorics.join('、') : '無指定修辭'}
【學生文章內容】：${imageBase64 ? '（請先對手寫作文圖片進行繁體中文 OCR 逐字辨識再批改）' : content}

請回傳純 JSON 格式報告。
`;

  const contentsParts = [];
  if (imageBase64) {
    contentsParts.push({ inlineData: { mimeType: imageMimeType, data: imageBase64 } });
  }
  contentsParts.push({ text: promptUser });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      contents: [{ role: 'user', parts: contentsParts }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.3 },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `API 請求失敗 (${response.status})`);
  }

  const result = await response.json();
  const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;
  const cleanedJson = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
  return JSON.parse(cleanedJson);
}
