import dotenv from 'dotenv';
dotenv.config();

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

// Simple in-memory rate limiter: IP -> { count, resetTime }
const rateLimitMap = new Map();
const ONE_HOUR_MS = 60 * 60 * 1000;

export function checkRateLimit(ip, maxPerHour = 8) {
  const now = Date.now();
  let record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    record = { count: 1, resetTime: now + ONE_HOUR_MS };
    rateLimitMap.set(ip, record);
    return { allowed: true, remaining: maxPerHour - 1, resetInMinutes: 60 };
  }

  if (record.count >= maxPerHour) {
    const minutesLeft = Math.ceil((record.resetTime - now) / 60000);
    return { allowed: false, remaining: 0, resetInMinutes: minutesLeft };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: maxPerHour - record.count,
    resetInMinutes: Math.ceil((record.resetTime - now) / 60000),
  };
}

export async function handleGradeRequest(body) {
  const serverApiKey = process.env.GEMINI_API_KEY || '';
  const serverModel = process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';

  const {
    customApiKey,
    model = serverModel,
    title,
    promptGuide,
    targetWordCount,
    selectedRhetorics = [],
    content = '',
    imageBase64 = null,
    imageMimeType = 'image/jpeg',
  } = body;

  const activeApiKey = (customApiKey || serverApiKey).trim();

  if (!activeApiKey) {
    throw new Error('伺服器尚未設定 GEMINI_API_KEY，請在 .env 中填寫，或於設定面板手動輸入 Key。');
  }

  const promptUser = `
請評閱以下作文作品：

【寫作題目】
${title || '未指定題目'}

【題目引導與說明】
${promptGuide || '無特殊引導說明'}

【目標字數要求】
${targetWordCount || '未限定字數'}

【指定檢測之必備修辭清單】
${selectedRhetorics.length > 0 ? selectedRhetorics.join('、') : '無指定修辭，請自由檢測亮點修辭'}

【學生文章內容】
${imageBase64 ? '（請先對附帶之手寫作文圖片進行高精度繁體中文 OCR 逐字辨識，再進行深度批改）' : content}

請依據系統指令，回傳嚴格符合以下結構的 JSON 字串：
{
  "meta": {
    "title": "題目",
    "actual_word_count": 數字,
    "target_word_count": "目標字數說明",
    "word_count_status": "字數狀況評定短語"
  },
  "overall": {
    "score": 數字(1-6),
    "grade_name": "一級分~六級分",
    "summary_comment": "溫暖具教育意義的閱卷導師綜合短評語（嚴格要求在 100 字至 150 字之間，需涵蓋立意取材、修辭與文字張力、情感體悟之全面診斷）"
  },
  "four_dimensions": {
    "theme_and_materials": {
      "dimension_name": "立意取材",
      "highlights": "亮點解析",
      "suggestions": "改進建議"
    },
    "structure_and_organization": {
      "dimension_name": "結構組織",
      "highlights": "亮點解析",
      "suggestions": "改進建議"
    },
    "vocabulary_and_sentences": {
      "dimension_name": "遣詞造句",
      "highlights": "亮點解析",
      "suggestions": "改進建議"
    },
    "orthography_and_punctuation": {
      "dimension_name": "錯別字與標點",
      "typo_corrections": [
        { "original": "原錯字詞", "correction": "正確字詞", "explanation": "辨析說明" }
      ],
      "punctuation_comment": "標點與格式評語"
    }
  },
  "rhetoric_diagnosis": {
    "target_rhetorics": ["修辭1", "修辭2"],
    "achieved_count": 數字,
    "total_target_count": 數字,
    "achievement_rate": "百分比字串，如 75%",
    "details": [
      {
        "name": "修辭名稱",
        "detected": true或false,
        "sample_sentence": "摘錄原文句子，若未達成則填空字串",
        "evaluation": "使用效果評析或補充建議"
      }
    ]
  },
  "interactive_learning": {
    "sentence_upgrade": {
      "original": "挑選原文中一句具潛力的句子",
      "upgraded": "示範更高層次之改寫",
      "upgrade_tip": "改寫重點與技巧說明"
    },
    "reflection_questions": [
      "啟發思考題1",
      "啟發思考題2"
    ],
    "teacher_encouragement": "溫暖正向的導師勉勵語"
  },
  "level_6_model_essay": {
    "essay_title": "六級分示範範文標題",
    "word_count": 數字,
    "model_content": "以學生原創骨架與真實經歷為基礎，昇華寫作立意、補齊指定修辭、字句精煉之六級分範文全文",
    "elevation_highlights": [
      {
        "aspect": "立意昇華 / 修辭補全 / 遣詞精進",
        "description": "具體說明此範文是如何在此向度上進行實質提升"
      }
    ]
  }
}
`;

  const contentsParts = [];

  if (imageBase64) {
    contentsParts.push({
      inlineData: {
        mimeType: imageMimeType,
        data: imageBase64,
      },
    });
  }

  contentsParts.push({ text: promptUser });

  // List of models to try in sequence for high resilience
  const candidateModels = Array.from(new Set([model, 'gemini-flash-lite-latest', 'gemini-3.8-flash']));

  let lastError = null;

  for (const currentModel of candidateModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${activeApiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
          contents: [{ role: 'user', parts: contentsParts }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.3,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData?.error?.message || `HTTP ${response.status} 請求失敗`;
        // If 503 or 404, continue to next candidate model
        if (response.status === 503 || response.status === 404) {
          lastError = new Error(`模型 ${currentModel} 暫時繁忙 (${response.status}): ${message}`);
          continue;
        }
        if (response.status === 400 && message.includes('API_KEY_INVALID')) {
          throw new Error('伺服器設定的 Gemini API Key 無效，請檢查 .env 設定。');
        }
        throw new Error(`評改失敗: ${message}`);
      }

      const result = await response.json();
      const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        throw new Error('AI 未回傳評改內容，請稍後重試。');
      }

      const cleanedJson = rawText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      return JSON.parse(cleanedJson);
    } catch (err) {
      lastError = err;
      if (err.message && err.message.includes('API_KEY_INVALID')) {
        throw err;
      }
    }
  }

  throw lastError || new Error('所有可用 AI 模型均暫時無回應，請稍候幾秒再試。');
}
