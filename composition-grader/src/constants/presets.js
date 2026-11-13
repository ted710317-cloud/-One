export const AVAILABLE_GENRES = [
  { id: '記敘文', name: '記敘文', desc: '以敘述事件、刻畫人物、描摹景物為主的文體（人事時地物、起承轉合）' },
  { id: '說明文', name: '說明文', desc: '客觀解說事物狀態、性質、成因或運作原理之文體（條理分明、邏輯嚴謹）' },
  { id: '議論文', name: '議論文', desc: '針對特定議題提出主張並舉證辨析之文體（論點、論據、論證）' },
  { id: '抒情文', name: '抒情文', desc: '以抒發個人情感、思想感觸為主的文體（借景抒情、融情於景）' },
  { id: '讀書報告', name: '讀書報告', desc: '閱讀書籍後整理重點大意、個人反思與心得啟發之文體' },
  { id: '書信', name: '書信', desc: '寫給特定對象之應用文（稱謂、正文、祝詞、署名、日期等格式規範）' },
  { id: '寓言故事', name: '寓言故事', desc: '透過生動情節或擬人化動植物，寄託深刻道德或處世哲理之故事' },
  { id: '生活日記', name: '生活日記', desc: '記錄日常生活所見所聞、個人心境轉折與當日省思之文體' },
];

export const AVAILABLE_RHETORICS = [
  { id: '譬喻', name: '譬喻', desc: '明喻、隱喻、借喻等比方修辭', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: '摹寫', name: '摹寫', desc: '視覺、聽覺、觸覺、嗅覺、味覺五感細節', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: '引用', name: '引用', desc: '援引名言佳句、俗諺、詩詞典故', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: '設問', name: '設問', desc: '提問、反問、激問等引發思考之問句', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: '排比', name: '排比', desc: '三句以上結構相同、語氣一致的句群', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { id: '轉化', name: '轉化 (擬人/擬物)', desc: '將無生物比作具人性、或物性轉化', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  { id: '映襯', name: '映襯 (對比)', desc: '將兩種相反觀念或情境並列對照', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { id: '誇飾', name: '誇飾', desc: '刻意超越客觀事實，強化感受', color: 'bg-pink-50 text-pink-700 border-pink-200' },
  { id: '類疊', name: '類疊', desc: '字詞、語句規律反覆疊現', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  { id: '感嘆', name: '感嘆', desc: '抒發驚喜、悲愴、讚嘆等強烈情感', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
];

export const WORD_COUNT_PRESETS = [
  { id: 'primary-mid', label: '國小中年級', range: '250~400字', min: 250, max: 400 },
  { id: 'primary-high', label: '國小高年級', range: '400~550字', min: 400, max: 550 },
  { id: 'junior-high', label: '國中會考標準', range: '500~750字', min: 500, max: 750 },
  { id: 'short-writing', label: '段落隨筆', range: '150~300字', min: 150, max: 300 },
];

export const SAMPLE_ESSAY_BASKETBALL = {
  title: '校園中的一角',
  promptGuide: '請描寫校園中令你印象深刻的一個角落，融入五感觀察，並抒發此地承載的個人記憶與深層情感。',
  presetId: 'primary-high',
  targetWordCount: '400~550字',
  selectedRhetorics: ['譬喻', '摹寫', '引用', '設問'],
  content: `　　「噹！噹！噹！」那串悠揚的下課鐘聲響起，那是期待已久的自由樂章。我和班上滿腔熱血的男孩們化身為敏捷的獵豹，迫不及待地衝向那座充滿熱情與汗水的籃球場。
　　曾經校園裡那露天的籃球場，總是要看老天爺的臉色，如今已換上鋼鐵屋脊，蛻變成嶄新、壯觀的風雨球場。潔白的籃板映照著陽光，四高兩低的籃框整齊排開，潔白的籃網正等待著球影穿梭。我特別喜歡這裡，因為它像一把傘，在雨天時為我們撐起一片揮灑汗水的自由天地。地板色彩錯落有致，不僅標示了界線，更點燃了我們心中的鬥志，讓我陷入這份動感的魅力裡。
　　每當下課鐘聲敲響，我都會和班上熱愛籃球的男孩們，一如脫韁野馬般，衝向那充滿熱血的「主場」，展開一場五對五的激戰。在進攻端，我化身為精準的神射手，為隊友提供強大的三分火力；防守時，若對手企圖橫衝直撞闖進禁區，我就會發揮身材優勢，化身為不可撼動的綠巨人，將攻勢硬生生的擋下。
　　印象最深的是某次體育課，在活動練習投籃時，我意創下了「連續五球入網」的紀錄！那一刻，看著籃網發出清脆的摩擦聲，我簡直不敢相信自己的眼睛。
　　六年的國小時從如白騎過隙，轉瞬即逝，這座籃球場見證了我揮汗如雨與球技的跑變，它不僅是運動場，更像一位好友，默默收藏著我無數的歡笑與淚水。未來的某一天重返母校，能與這產銘刻著我青春足跡的籃球場，再次相遇。`,
  mockResult: {
    meta: {
      title: '校園中的一角',
      actual_word_count: 486,
      target_word_count: '400~550字',
      word_count_status: '達標（篇幅適中、情節具體且飽滿）'
    },
    overall: {
      score: 5,
      grade_name: '五級分',
      // 100~150 字之標準導師綜合短評（精確統計：138字）
      summary_comment: '本文取材生動且情感豐沛，以風雨球場為情感依託，將下課奔馳的熱血與攻防激戰刻畫得淋漓盡致。「敏捷獵豹」與「綠巨人」等化身比喻極具畫面張力，聽覺與視覺摹寫亦成功營造出生動的臨場氛圍。末段由賽事的熱烈轉入畢業感懷，能體悟球場陪伴成長的精神意義。文章脈絡分明、情感真摯，展現出高度的文字駕馭力。'
    },
    four_dimensions: {
      theme_and_materials: {
        dimension_name: '立意取材',
        highlights: '以風雨球場為情感載體，結合改建歷程與個人投籃榮耀，選材典型生動。',
        suggestions: '可延伸描寫與隊友間在輸贏之外的心靈默契，讓主題更顯厚度。'
      },
      structure_and_organization: {
        dimension_name: '結構組織',
        highlights: '從聽覺引導、場地巡禮到攻防激戰與畢業感懷，脈絡層層遞進。',
        suggestions: '第五段末句「未來的某一天…再次相遇」宜補齊主要動詞「期盼」以成完整句。'
      },
      vocabulary_and_sentences: {
        dimension_name: '遣詞造句',
        highlights: '「敏捷獵豹」、「綠巨人」等化身比喻極具畫面感與節奏感。',
        suggestions: '成語典故使用宜再審慎，避免因筆誤削弱文字精確度。'
      },
      orthography_and_punctuation: {
        dimension_name: '錯別字與標點',
        typo_corrections: [
          { original: '意創下', correction: '竟創下', explanation: '「竟」表示出乎意料' },
          { original: '白騎過隙', correction: '白駒過隙', explanation: '成語筆誤，「駒」指少壯之馬' },
          { original: '跑變', correction: '蛻變', explanation: '字音相近之筆誤' },
          { original: '這產', correction: '這座', explanation: '量詞筆誤' }
        ],
        punctuation_comment: '標點符號運用大致得宜，引號與頓號使用清晰。'
      }
    },
    rhetoric_diagnosis: {
      target_rhetorics: ['譬喻', '摹寫', '引用', '設問'],
      achieved_count: 2,
      total_target_count: 4,
      achievement_rate: '50%',
      details: [
        {
          name: '譬喻',
          detected: true,
          sample_sentence: '我和班上滿腔熱血的男孩們化身為敏捷的獵豹 / 它像一把傘，在雨天時為我們撐起一片揮灑汗水的自由天地。',
          evaluation: '明喻與隱喻運用極為傳神，具象化了運動員的敏捷與球場的庇護感。'
        },
        {
          name: '摹寫',
          detected: true,
          sample_sentence: '聽覺：「噹！噹！噹！」那串悠揚的下課鐘聲響起 / 視覺：潔白的籃板映照著陽光，四高兩低的籃框整齊排開。',
          evaluation: '聽覺摹寫開場成功建立生動臨場感，視覺摹寫細膩刻畫球場細節。'
        },
        {
          name: '引用',
          detected: false,
          sample_sentence: '',
          evaluation: '文中未發現引用名言佳句或俗諺，建議可在末段感懷處適度引用名人奮鬥名句。'
        },
        {
          name: '設問',
          detected: false,
          sample_sentence: '',
          evaluation: '未偵測到設問句，若在段落轉折處加入自問自答，能引導讀者更深刻思索球場的意義。'
        }
      ]
    },
    interactive_learning: {
      sentence_upgrade: {
        original: '防守時，若對手企圖橫衝直撞闖進禁區，我就會發揮身材優勢，化身為不可撼動的綠巨人，將攻勢硬生生的擋下。',
        upgraded: '防守哨音如箭在弦，面對對手強勢壓境，我如同一座固若金湯的磐石巍然屹立，封死所有穿透防線的空隙。',
        upgrade_tip: '運用動態摹寫與成語強化防守時的壓迫感與堅固感。'
      },
      reflection_questions: [
        '當你投進那神奇的連續第五球時，現場隊友的歡呼與你當下的心跳是怎樣的？',
        '除了晴雨避風，這座球場在精神上給了你什麼樣的「保護」？'
      ],
      teacher_encouragement: '球場上的熱血化作筆尖的力量，願你保持這份昂揚自信，在文字世界裡持續投出精彩好球！'
    },
    level_6_model_essay: {
      essay_title: '校園中的一角（六級分示範升級範文）',
      word_count: 556,
      model_content: `　　「噹！噹！噹！」那串悠揚的下課鐘聲敲響，是校園裡最振奮人心的自由樂章。我和班上熱血的少年們如敏捷的獵豹，循著風的呼喚，直奔那座揮灑汗水的主場——風雨球場。
　　這座球場曾是一片看老天臉色的露天水泥地，如今披覆著鋼鐵屋脊，在陽光下泛著沉穩的銀光。四高兩低的籃框如忠誠的衛士整齊矗立，紅白交織的籃網隨風微擺，靜候每一記拋物線的降臨。它像一把庇護青春的傘，為我們隔絕風雨，撐開一片奔馳的天地。腳下交錯的界線，不僅圈出了球場，更劃出了我們追逐夢想的航道。
　　每逢下課，我們便如脫韁野馬在此鏖戰。進攻時，我化身為外線冷靜的射手，劃出一道道精準的弧度；防守之際，面對對手強勢壓境，我若磐石般巍然屹立，封死每一條禁區通路。難忘那次體育課，哨音迴盪間，我意氣風發地創下連進五球的奇蹟！籃網刷出清脆的摩擦聲，全場屏息繼而爆出如雷歡呼。那一刻，汗水流進眼角帶來微鹹的刺痛，卻點燃了胸口最熾熱的自豪。
　　『成功的花，人們只驚羨她現時的明豔；然而當初她的芽兒，浸透了奮鬥的淚泉。』這座球場見證的何止是勝負榮耀？更多的是投籃不進的懊惱，與隊友相視一笑、相互擊掌的默契。難道運動場僅是奔跑的場所？不，它更是教導我們跌倒後重新爬起的淬鍊之地。
　　六年的國小光陰如白駒過隙，轉瞬即逝。這座球場如同沉默而寬厚的老友，收納了我童年最純粹的歡笑與淚滴。多年以後，當我重返母校，期盼這方承載著我青春足跡的球場，依然在此迎著陽光，守候那群追風的少年。`,
      elevation_highlights: [
        {
          aspect: '立意昇華',
          description: '將單純的投籃得勝，昇華為「運動場不僅是勝負，更是教導人面對挫折與友情的淬鍊之所」，深化至六級分思想維度。'
        },
        {
          aspect: '修辭補全',
          description: '巧妙融入冰心名言作為「引用」，並在第四段加入「設問」引導讀者思考球場的精神意涵，完美達成老師設定的所有修辭要求。'
        },
        {
          aspect: '感官摹寫與遣詞',
          description: '增添「汗水微鹹的刺痛」、「籃網刷出清脆聲響」等細膩五感，並修正原文白駒過隙、竟創下等筆誤，文字典雅有張力。'
        }
      ]
    }
  }
};
