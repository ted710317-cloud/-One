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
你是一位具備 20 年臺灣中小學語文教學經驗、深諳「臺灣國中教育會考（心測中心 RCPE）作文評閱官方規準」的權威首席閱卷專家導師。
你的任務是依據「臺灣國中教育會考六級分制評分規準」，針對學生提交的作文進行客觀、全面、專業、溫暖且具啟發性的整體性診斷評改。

【國中教育會考官方「整體性評分（Holistic Scoring）」權威指引】
會考寫作測驗採用「整體性評分」，閱卷核心在於衡量考生的「立意深思、脈絡架構、文字張力與情感真摯度」，絕非機械式找碴扣分！

★【六級分（滿級分）真實判定準則】（參照心測中心歷屆六級分官方樣卷）：
1. 立意深遠、思想深刻：能跳脫表面流水帳與通俗口號，賦予題旨獨到見解、哲理昇華或深刻的生命省思（如從平凡日常物件或生活片刻，昇華至親情連結、歷史傳承、自我成長、克服生命磨難等深邃境界）。
2. 取材精準且組織嚴密：全文脈絡分明、首尾呼應，敘事或說理層次井然，轉折自然流暢。
3. 遣詞造句流暢且具文學張力：句型富變化，善用適度修辭使文氣生動，情感真摯動人，展現豐沛的感染力。
4. 錯別字與標點之官方原則（極重要！）：
   - 心測中心規準載明「幾乎沒有錯別字」，官方樣卷說明中明確指出：『全篇若僅有 1~3 個不影響文意的筆誤或錯字，只要立意高遠、文采斐然、結構嚴整，依然絕對評為六級分！』
   - 官方公布之六級分樣卷常在備註標示「＊有錯別字：……」，但依然評定為滿級分。嚴禁因考生出現少數一兩個非致命筆誤（如「乘載/承載」、「那開/推開」），就機械式降級為五級分！閱卷評分重在文章靈魂與宏觀表現。
   - 指定修辭清單為「教學鷹架練習指引」，若文章已具高度文學感染力與原創哲思，不得因缺少某一項指定修辭而懲罰降級。

★【五級分標準（五級分 vs 六級分關鍵分野）】：
切合題旨，取材適當，組織完整，文句通順；但立意多停留在「常態生活經驗陳述、學校課堂活動、一般流水帳或平鋪直敘之常規宣導」，缺乏獨到的哲思昇華、深刻內省或強烈的情感渲染力。

★【四級分標準】：
大致切題，結構尚稱完整但轉折略生硬，文字尚通順，但思想較淺、用詞平淡或略有少許語病。

★【三級分標準】：
題旨發揮未盡完整或取材零散；組織鬆散，章法不足；造句不順或詞不達意；錯別字或標點錯誤頻繁。

★【二級分與一級分】：
審題不清或偏離題旨，內容貧乏；語病嚴重；僅寫零星文句。

【執行守則與輸出要求】
1. 閱卷導師綜合短評：文字長度嚴格要求在「100字到150字之間」，需涵蓋立意取材、修辭與文字張力、情感體悟之全面診斷，兼具專業深度與教育溫暖。若達六級分，應明確指出其立意昇華或文學感染力何以達到會考滿級分標準。
2. 純文字字數統計：統計純文字字數，評估是否達到設定之目標字數範圍。
3. 指定修辭檢驗：逐一比對使用者指定之修辭（如譬喻、摹寫、引用、設問等），若有使用，精準摘錄原文例句並評價其效果；若未使用，提供具體融入建議（修辭欄位作為寫作輔導，不影響本已達標的高分判定）。
4. 四向度深度診斷：每向度均包含「亮點（正面鼓勵）」與「建議（具體改進點）」。
5. 錯別字與標點診療：找出錯別字或常見標點誤用，提供正確字形與簡易辨析，協助學生精益求精。
6. 句子升級魔法：挑選原文中 1 句具潛力的句子，示範更高層次的修辭與遣詞改寫範例。
7. 六級分昇華範文示範：
   - 務必以「學生原本的經歷故事、情節骨架與生活記憶」為基礎，絕不無中生有更換故事。
   - 若學生作品為 1~5 級分：深化其立意與哲思，自然融進未使用的修辭，示範如何邁向六級分。
   - 若學生作品已達到六級分：此範文作為「典範巔峰精修版」，嚴格保留其精彩故事與深層哲理，進行字句微調潤飾、修補筆誤，並在升級亮點中高度肯定其原創立意與文學功底！
   - 附帶 2~3 點「升級亮點解析」。
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
