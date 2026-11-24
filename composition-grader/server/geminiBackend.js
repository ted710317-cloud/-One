import dotenv from 'dotenv';
import { normalizeEvaluationResult } from '../src/utils/normalizeResult.js';
dotenv.config();

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
   - 【修辭清單定位（極度重要）】：題目設定之修辭勾選僅為「課堂教學輔導與診斷回饋」，並非國中會考正式考試之硬性扣分條件！會考官方規準從未規定考生必須使用特定修辭。因此『嚴禁因學生未完全使用勾選之修辭，而將整體會考級分扣罰或降級至五級分！』修辭達成度僅在 rhetoric_diagnosis 欄位提供教學建議即可。

★【五級分標準（五級分 vs 六級分關鍵分野）】：
切合題旨，取材適當，組織完整，文句通順；但立意多停留在「常態生活經驗陳述、學校課堂活動、一般流水帳或平鋪直敘之常規宣導」，缺乏獨到的哲思昇華、深刻內省或強烈的情感渲染力。

★【四級分標準】：
大致切題，結構尚稱完整但轉折略生硬，文字尚通順，但思想較淺、用詞平淡或略有少許語病。

★【三級分標準】：
題旨發揮未盡完整或取材零散；組織鬆散，章法不足；造句不順或詞不達意；錯別字或標點錯誤頻繁。

★【二級分與一級分】：
審題不清或偏離題旨，內容貧乏；語病嚴重；僅寫零星文句。

【手寫稿紙照片檔專屬辨析與錯別字診療高精度規範（極重要）】
當評閱對象為「學生手寫稿紙照片」時，請務必遵循以下高精度原則：
1. 忠實逐字 OCR 辨識（絕不自動語意校正）：
   - 逐字忠實謄錄學生稿紙上的實際字形，絕不可在 OCR 辨識時憑藉前後文語意順暢度，將學生的「錯別字」自動腦補修正成正確字（例如學生手寫「玩的很高興」，不得自動轉錄成「得」；手寫「決的」不得自動轉錄成「覺得」）！
2. 杜絕連筆與拍照模糊假錯字（防範 OCR 幻覺）：
   - 手寫稿常見行書筆勢、牽絲連筆、墨水滲透或拍照反光。閱卷時必須嚴謹區分「真錯字」與「正常連筆草字」：
   - 若該字在文脈中完全通順，且筆畫僅是一般手寫行書連筆（如點挑連寫、折筆圓弧化、橫劃牽絲），【嚴禁草率判為錯字】！
   - 唯有在學生確實寫錯筆畫結構（如部首誤寫、多一筆少一畫、自造錯字）或詞意混淆（如同音別字「在/再」、「的/得/地」、「決/絕」、「倒/到」、「以/已」、「成究/成就」）時，才可列入錯別字清單。
3. 每個錯字提供前後文語境（context）：
   - 在 typo_corrections 中，必須提供包含該字的 6~12 字前後文語境（context），讓師生能精準在手寫稿紙上對照定位。
4. 回傳手寫逐字謄錄（ocr_transcript）：
   - 在 meta 中務必回傳 ocr_transcript 欄位，完整附上自照片辨識出的繁體中文學生作文全文，以供核對。

【執行守則與輸出要求】
1. 閱卷導師綜合短評：文字長度嚴格要求在「100字到150字之間」，需涵蓋立意取材、修辭與文字張力、情感體悟之全面診斷，兼具專業深度與教育溫暖。若達六級分，應明確指出其立意昇華或文學感染力何以達到會考滿級分標準。
2. 純文字字數統計：統計純文字字數，評估是否達到設定之目標字數範圍。
3. 指定修辭檢驗：逐一比對使用者指定之修辭（如譬喻、摹寫、引用、設問等），若有使用，精準摘錄原文例句並評價其效果；若未使用，提供具體融入建議（修辭欄位作為寫作輔導，不影響本已達標的高分判定）。
4. 四向度深度診斷：每向度均包含「亮點（正面鼓勵）」與「建議（具體改進點）」。
5. 錯別字與標點診療：找出錯別字或常見標點誤用，提供正確字形與簡易辨析，協助學生精益求精。
6. 句子升級魔法：挑選原文中 1 句具潛力的句子，示範更高層次的修辭與遣詞改寫範例。
7. 六級分昇華範文示範（極重要！附帶升級顏色標記）：
   - 務必以「學生原本的經歷故事、情節骨架與生活記憶」為基礎，絕不無中生有更換故事。
   - 若學生作品為 1~5 級分：深化其立意與哲思，自然融進未使用的修辭，示範如何邁向六級分。
   - 若學生作品已達到六級分：此範文作為「典範巔峰精修版」，嚴格保留其精彩故事與深層哲理，進行字句微調潤飾與筆誤修補。
   - 【修改升級標記規範（極重要）】：為了讓學生清楚看見範文中「哪裡被修改與升級」，請在 model_content 中針對「有修改、替換、擴寫或昇華」的關鍵詞句，務必使用以下三種專屬標籤精準包覆（未修改的原句保持純文字不標記，且不可跨段落或雙層嵌套標籤）：
     * [[詞彙：修改或精進後的詞句]] ➔ 修正原文錯別字、替換更精煉準確的動詞／形容詞／成語
     * [[修辭：新增或強化的修辭感官句]] ➔ 新加入或潤飾後的譬喻、五感摹寫、轉化、引用、設問等修辭亮點句
     * [[立意：深化或昇華思想的關鍵句]] ➔ 拔高主題思想、抒情省思、或首尾昇華點題之深度文句
   - 附帶 2~3 點「升級亮點解析」。
8. 回傳格式：必須嚴格回傳純 JSON，不得包裹額外對話贅字。
`;

// Simple in-memory rate limiter: IP -> { count, resetTime }
const rateLimitMap = new Map();
const ONE_HOUR_MS = 60 * 60 * 1000;

export function checkRateLimit(ip, maxPerHour = 60) {
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
    genre = '',
    selectedRhetorics = [],
    content = '',
    imageBase64 = null,
    imageMimeType = 'image/jpeg',
  } = body;

  const isUsingCustomKey = Boolean(customApiKey && customApiKey.trim());
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

【文體規範限定】
${genre ? genre + '（學生作答需符合該文體之文體特質與寫作規範，例如書信需具備稱呼/正文/祝詞/署名/日期等格式要件，讀書報告需包含內容大意與個人反思啟發，說明文需客觀條理清晰，議論文需具備論點/論據/論證，記敘文需具備人事時地物完整脈絡。請在結構組織向度中專題評核文體規範之達成度）' : '未指定特殊文體（不限文體，請尊重學生自然呈現之寫作體裁）'}

【指定檢測之修辭輔助參考（僅供教學診斷與課堂回饋，絕不可作為會考總級分之扣分理由！會考評定核心為立意深淺、架構組織與文字張力）】
${selectedRhetorics.length > 0 ? selectedRhetorics.join('、') : '無指定必備修辭（請將 rhetoric_diagnosis.total_target_count 設為 0、achieved_count 設為 0、target_rhetorics 設為 []、achievement_rate 設為 "未指定"，並在 details 中僅主動摘錄文章已展現的 1~3 項亮點修辭，detected 皆設為 true）'}

【學生文章內容】
${imageBase64 ? '（請先對附帶之手寫作文圖片進行高精度繁體中文 OCR 逐字辨識，再進行深度批改）' : content}

請依據系統指令，回傳嚴格符合以下結構的 JSON 字串：
{
  "meta": {
    "title": "題目",
    "genre": "${genre || '不限文體'}",
    "actual_word_count": 數字,
    "target_word_count": "目標字數說明",
    "word_count_status": "字數狀況評定短語",
    "is_handwritten_photo": ${imageBase64 ? 'true' : 'false'},
    "ocr_transcript": "若為手寫照片，請填寫從照片中高精度逐字辨識出之學生完整繁體中文作文內容全文；若為純文字輸入則留空字串"
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
        {
          "context": "包含該錯別字的前後文語境（約6~12字，方便師生在稿紙精確定位）",
          "original": "原錯字詞",
          "correction": "正確字詞",
          "explanation": "辨析說明（指明錯誤原因，避免把正常連筆誤判為錯字）"
        }
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
    "model_content": "以學生原創骨架與真實經歷為基礎之六級分範文全文，並務必於修改升級處使用 [[詞彙：...]]、[[修辭：...]]、[[立意：...]] 精準標記（全篇建議標記 6~12 處代表性修改，保留未改寫段落為純文字）",
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

  // 過濾已知已下線的模型，並建置高韌性多模型備援池（兼顧視覺 OCR 與速度）
  const RETIRED_MODELS = new Set(['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-2.5-flash-lite']);
  const safeUserModel = model && !RETIRED_MODELS.has(model) ? model : null;

  const candidateModels = imageBase64
    ? [
        'gemini-3.8-flash',
        'gemini-3-flash-preview',
        'gemini-3.6-flash',
        'gemini-3.5-flash-lite',
        'gemini-3.1-flash-lite',
        'gemini-flash-lite-latest',
      ]
    : Array.from(
        new Set(
          [
            safeUserModel,
            'gemini-flash-lite-latest',
            'gemini-3.5-flash-lite',
            'gemini-3.1-flash-lite',
            'gemini-3-flash-preview',
            'gemini-3.6-flash',
            'gemini-3.8-flash',
          ].filter(Boolean)
        )
      );

  let lastError = null;
  const startedAt = Date.now();
  const TOTAL_BUDGET_MS = 52000;

  for (let i = 0; i < candidateModels.length; i++) {
    const remainingBudget = TOTAL_BUDGET_MS - (Date.now() - startedAt);
    if (remainingBudget < 5000) break;

    const currentModel = candidateModels[i];
    const isLastModel = i === candidateModels.length - 1;
    // 單一模型超時上限：優先模型給 18 秒（避免尖峰卡死佔滿預算），剩餘備援依剩餘預算彈性分配
    const attemptTimeout = Math.min(isLastModel ? 25000 : 18000, remainingBudget);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), attemptTimeout);

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${activeApiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
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
        if (response.status === 400 && message.includes('API_KEY_INVALID')) {
          throw new Error(
            isUsingCustomKey
              ? '您輸入的個人 Gemini API Key 無效，請點右上角「AI 設定」清除個人 Key 以恢復免費伺服器模式。'
              : '伺服器設定的 Gemini API Key 無效，請檢查 .env 設定。'
          );
        }
        // 遇到暫時繁忙、限流、找不到或伺服器錯誤，自動切換下一個備援模型
        if ([404, 429, 500, 502, 503, 504].includes(response.status) && !isLastModel) {
          lastError = new Error(`模型 ${currentModel} 暫時繁忙 (${response.status}): ${message}`);
          continue;
        }
        throw new Error(`評改失敗 (${currentModel}): ${message}`);
      }

      const result = await response.json();
      const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        lastError = new Error(`模型 ${currentModel} 未回傳評改內容`);
        if (!isLastModel) continue;
        throw new Error('AI 未回傳評改內容，請稍後重試。');
      }

      const cleanedJson = rawText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      const parsed = JSON.parse(cleanedJson);
      return normalizeEvaluationResult(parsed, {
        title,
        genre,
        targetWordCount,
        selectedRhetorics,
        content,
        imageBase64,
      });
    } catch (err) {
      lastError =
        err.name === 'AbortError'
          ? new Error(`模型 ${currentModel} 回應逾時`)
          : err;
      if (err.message && err.message.includes('API_KEY_INVALID')) {
        throw err;
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw lastError || new Error('所有可用 AI 模型均暫時無回應，請稍候幾秒再試。');
}
