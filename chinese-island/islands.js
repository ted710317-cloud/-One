/**
 * ============================================================================
 * 《古韻文學群島》課文島嶼資料庫 (islands.js)
 * ============================================================================
 * 老師擴充說明：
 * 1. 已經完成：第九課《孫翠鳳與歌仔戲》「梨園戲台島」（完整對應 Padlet 12 題 + 2 隱藏修辭/曲調彩蛋）。
 * 2. 其他未製作的島嶼（第 8、10、11、12 課與龍門金榜島）目前皆設為 `status: 'blank'`（空白待建置狀態）。
 * 3. 您有兩種方式可以隨時新增或填滿空白島嶼：
 *    - 【方式一（免改程式）】：直接在網頁右上角點擊「🛠️ 教師造島工坊」，點擊任一空白島嶼或「➕ 新增島嶼」，
 *      填入課名、題目與寶物後即可遊玩，並可匯出 JSON / islands.js 備份！
 *    - 【方式二（直接編輯本檔）】：複製下方的第九課或空白島模板，把 `status` 改成 `'active'` 並填寫 `stages` 即可。
 * ============================================================================
 */

window.GAME_CONFIG = {
  gameTitle: "古韻文學群島",
  gameSubtitle: "國小國語六上｜古代像素冒險遊戲島",
  gradeLabel: "國小六年級上學期・國語互動島嶼"
};

/**
 * 4 位可選古代數位像素角色（使用 12x12 像素矩陣繪製，支援待機與走路雙幀動畫）
 * 色碼對照：
 * . = 透明, K = 深墨黑(#1f1a24), S = 膚色(#ffd2a6), R = 朱紅(#d9383a),
 * G = 金黃(#f6c445), B = 靛藍(#3b6fd8), T = 青綠(#2c9f7c), P = 粉霞(#ef6f9c),
 * W = 雪白(#f8f4e8), M = 咖啡木(#7a4b2a), L = 淺青(#7dd3fc), V = 紫袍(#8b5cf6)
 */
window.CHARACTERS_DATA = [
  {
    id: "xiaosheng",
    name: "無敵小生",
    role: "文武小生・明華園台柱傳人",
    badge: "帥氣扇法",
    perkTitle: "天賦：身段先知",
    perkDesc: "闖關時每島可免費使用「錦囊提示」2 次（其他角色 1 次），特別擅長戲曲身段題。",
    color: "#e11d48",
    freeHints: 2,
    autoEliminateOnStructure: false,
    highlightRhetoric: false,
    extraShield: false,
    spriteIdle: [
      "....GGGG....",
      "...GKKKKG...",
      "...KWWWWK...",
      "..KKSSSSKK..",
      "..KKSKKSKK..",
      "..KKSSSSKK..",
      "...RRRRRR...",
      "..RRRRGGRR..",
      ".GRRRGGGRRW.",
      ".GKRRRRRRGW.",
      "...BB..BB...",
      "..KKK..KKK.."
    ],
    spriteWalk: [
      "....GGGG....",
      "...GKKKKG...",
      "...KWWWWK...",
      "..KKSSSSKK..",
      "..KKSKKSKK..",
      "..KKSSSSKK..",
      "...RRRRRR...",
      ".GRRRRGGRR..",
      ".WKRRGGGRR..",
      "...RRRRRRG..",
      "..BB....BB..",
      ".KKK....KKK."
    ]
  },
  {
    id: "huadan",
    name: "靈巧花旦",
    role: "青衣花旦・七字調歌姬",
    badge: "水袖飄逸",
    perkTitle: "天賦：音律修辭眼",
    perkDesc: "遇到「曲調體驗」或「修辭彩蛋」關卡時，系統自動亮出關鍵線索標籤。",
    color: "#ec4899",
    freeHints: 1,
    autoEliminateOnStructure: false,
    highlightRhetoric: true,
    extraShield: false,
    spriteIdle: [
      "...G.GG.G...",
      "..GKKKKKKG..",
      "..KKKKKKKK..",
      "..KSSSSSSK..",
      "..KSKSSKSK..",
      "..KSSSSSSK..",
      "...PPPPPP...",
      "..WPPPPPPW..",
      ".WWPPGGPPWW.",
      ".W.PPPPPP.W.",
      "...PP..PP...",
      "..KKK..KKK.."
    ],
    spriteWalk: [
      "...G.GG.G...",
      "..GKKKKKKG..",
      "..KKKKKKKK..",
      "..KSSSSSSK..",
      "..KSKSSKSK..",
      "..KSSSSSSK..",
      "...PPPPPP...",
      ".WWPPPPPPW..",
      ".W.PPGGPPWW.",
      "...PPPPPP.W.",
      "..PP....PP..",
      ".KKK....KKK."
    ]
  },
  {
    id: "scholar",
    name: "采風小書生",
    role: "古風特派小記者",
    badge: "竹簡筆記",
    perkTitle: "天賦：訪綱達人",
    perkDesc: "在「文體、結構、採訪問題」類型關卡，自動幫你畫掉 1 個錯誤選項！",
    color: "#2563eb",
    freeHints: 1,
    autoEliminateOnStructure: true,
    highlightRhetoric: false,
    extraShield: false,
    spriteIdle: [
      "...KKKKKK...",
      "..KKKKKKKK..",
      "..KKWWWWKK..",
      "..KSSSSSSK..",
      "..KSKSSKSK..",
      "..KSSSSSSK..",
      "...BBBBBB...",
      "..MBBBBBBM..",
      ".GMBBWWBBM..",
      ".GKBBBBBB...",
      "...MM..MM...",
      "..KKK..KKK.."
    ],
    spriteWalk: [
      "...KKKKKK...",
      "..KKKKKKKK..",
      "..KKWWWWKK..",
      "..KSSSSSSK..",
      "..KSKSSKSK..",
      "..KSSSSSSK..",
      "...BBBBBB...",
      ".MMBBBBBB...",
      ".GMBBWWBBM..",
      "...BBBBBBM..",
      "..MM....MM..",
      ".KKK....KKK."
    ]
  },
  {
    id: "clown",
    name: "機智丑角",
    role: "三花小仙・戲班氣氛組",
    badge: "笑口常開",
    perkTitle: "天賦：戲班護身符",
    perkDesc: "天生多 1 顆心心（4 顆心出發），而且每座島首次答錯會發動護身符不扣心！",
    color: "#16a34a",
    freeHints: 1,
    autoEliminateOnStructure: false,
    highlightRhetoric: false,
    extraShield: true,
    spriteIdle: [
      "..RR....RR..",
      "...KKKKKK...",
      "..KSSSSSSK..",
      "..KSKWWKSK..",
      "..KSSWWSSK..",
      "..KSSSSSSK..",
      "...TTTTTT...",
      "..GTTTTTTG..",
      "..TTTTGGTT..",
      "...TTTTTT...",
      "...GG..GG...",
      "..KKK..KKK.."
    ],
    spriteWalk: [
      ".RR......RR.",
      "...KKKKKK...",
      "..KSSSSSSK..",
      "..KSKWWKSK..",
      "..KSSWWSSK..",
      "..KSSSSSSK..",
      "...TTTTTT...",
      ".GTTTTTTGG..",
      "..TTTTGGTT..",
      "...TTTTTT...",
      "..GG....GG..",
      ".KKK....KKK."
    ]
  }
];

/**
 * 10x10 古風像素寶物圖示庫（純像素矩陣，可於百寶閣與開寶箱動畫放大繪製）
 */
window.TREASURE_SPRITES = {
  brush: [
    ".......GG.",
    "......GRR.",
    ".....GMM..",
    "....GMM...",
    "...GMM....",
    "..GMM.....",
    ".KMM......",
    "KKK.......",
    "KRK.......",
    ".K........"
  ],
  scroll: [
    ".GGGGGGGG.",
    "GWWWWWWWWG",
    "GWWKKKWKWG",
    "GWWWWWWWWG",
    "GWWKKWKKWG",
    "GWWWWWWWWG",
    "GWWKKKKWWG",
    "GWWWWWWWWG",
    ".GGGGGGGG.",
    "M........M"
  ],
  token: [
    "...GGGG...",
    "..GKKKKG..",
    ".GKGGGGKG.",
    ".GKGKKGKG.",
    ".GKGGGGKG.",
    ".GKGKKGKG.",
    ".GKGKKGKG.",
    "..GKKKKG..",
    "...GGGG...",
    "....RR...."
  ],
  jade: [
    "...TTTT...",
    "..TLLLLT..",
    ".TLWWWWLT.",
    ".TLWTTWLT.",
    ".TLWTTWLT.",
    ".TLWWWWLT.",
    "..TLLLLT..",
    "...TTTT...",
    "....GG....",
    "...R..R..."
  ],
  ticket: [
    "..........",
    ".RRRRRRRR.",
    "RGGGGGGGGR",
    "RGWWKKWWGR",
    "RGWWWWWWGR",
    "RGWWKKWWGR",
    "RGGGGGGGGR",
    ".RRRRRRRR.",
    "..........",
    ".........."
  ],
  towel: [
    "..WWWWWW..",
    ".WWWWWWWW.",
    ".WWLLLLWW.",
    ".WWWWWWWW.",
    ".WWLLLLWW.",
    ".WWWWWWWW.",
    ".WWGGGGWW.",
    ".WWWWWWWW.",
    "..WW..WW..",
    ".........."
  ],
  fan: [
    "..GGGGGG..",
    ".GRRRRRRG.",
    "GRRWWWWWRG",
    "GRWGGGGWRG",
    "GRRWWWWWRG",
    ".GRRRRRRG.",
    "..GGMMGG..",
    "...MMMM...",
    "....MM....",
    "...G..G..."
  ],
  robe: [
    "..GG..GG..",
    ".RRRRRRRR.",
    "RRRGGGGRRR",
    "RRGGGGGGGR",
    ".RRRRRRRR.",
    ".RRGGGGRR.",
    ".RRGGGGRR.",
    ".RRRRRRRR.",
    ".RR....RR.",
    ".........."
  ],
  lantern: [
    "....GG....",
    "...KKKK...",
    "..RRRRRR..",
    ".RRGGGGRR.",
    ".RRGWWGRR.",
    ".RRGGGGRR.",
    "..RRRRRR..",
    "...KKKK...",
    "....GG....",
    "...G..G..."
  ],
  huqin: [
    ".....GG...",
    ".....MM...",
    ".....MM...",
    ".....MM...",
    "....MMMM..",
    "...MMGGMM.",
    "..MMGKKGMM",
    "..MMGGGGMM",
    "...MMMMMM.",
    ".........."
  ],
  helmet: [
    "....PP....",
    "...GGGG...",
    "..GRRRRG..",
    ".GRGGGGRG.",
    "GGGGGGGGGG",
    "GKKWWWWKKG",
    ".G.GGGG.G.",
    ".P......P.",
    "P........P",
    ".........."
  ],
  seal: [
    "...GGGG...",
    "..GGGGGG..",
    "...GGGG...",
    "..MMMMMM..",
    "..MRRRRM..",
    "..MRRRRM..",
    ".MMMMMMMM.",
    ".GGGGGGGG.",
    ".KKKKKKKK.",
    ".........."
  ],
  goldpen: [
    ".......GG.",
    "......GGGG",
    ".....GGGG.",
    "....GGGG..",
    "...GGGG...",
    "..GGGG....",
    ".KGGG.....",
    "KKK.......",
    "KWK.......",
    ".K........"
  ],
  pendant: [
    "....RR....",
    "...GGGG...",
    "..GTTTTG..",
    ".GTWWWWGT.",
    ".GTWGGWGT.",
    ".GTWWWWGT.",
    "..GTTTTG..",
    "...GGGG...",
    "...R..R...",
    "..R....R.."
  ]
};

/**
 * 島嶼主題色彩與像素建築風格（提供老師在空白島嶼快速套用）
 */
window.ISLAND_THEMES = {
  opera: {
    name: "梨園紅戲台",
    landColor: "#4d7c3f",
    sandColor: "#e6c88a",
    accentColor: "#d9383a",
    buildingEmoji: "🏮",
    desc: "紅木戲台、燈籠高掛、鑼鼓齊鳴的傳統戲曲島"
  },
  bamboo: {
    name: "青翠竹林島",
    landColor: "#3b8254",
    sandColor: "#dfd3a7",
    accentColor: "#10b981",
    buildingEmoji: "🎋",
    desc: "清幽翠竹、石階小徑、隱士竹亭的古風島"
  },
  mountain: {
    name: "山水墨客島",
    landColor: "#4b7b6b",
    sandColor: "#d9caa0",
    accentColor: "#0ea5e9",
    buildingEmoji: "⛰️",
    desc: "層巒疊翠、飛瀑流泉、涼亭賞景的詩畫島"
  },
  academy: {
    name: "墨海書院島",
    landColor: "#65743a",
    sandColor: "#e8cf97",
    accentColor: "#f59e0b",
    buildingEmoji: "🏯",
    desc: "青瓦飛簷、藏書閣與孔廟碑林的學堂島"
  },
  harbor: {
    name: "古港燈塔島",
    landColor: "#5e8048",
    sandColor: "#f2d694",
    accentColor: "#6366f1",
    buildingEmoji: "⛵",
    desc: "古帆船停泊、青石碼頭與海風燈塔的商港島"
  },
  citadel: {
    name: "龍門金榜島",
    landColor: "#785d3d",
    sandColor: "#f5d782",
    accentColor: "#eab308",
    buildingEmoji: "👑",
    desc: "金瓦城樓、文魁牌坊與段考總試煉的終極聖殿"
  }
};

/**
 * 預設群島清單（含 1 座完整第九課島嶼 ＋ 5 座可隨時填入/擴充的空白島嶼）
 * x, y 為世界大海圖上的百分比座標 (10~90)
 */
window.DEFAULT_ISLANDS = [
  {
    id: "lesson08",
    status: "blank",
    lessonNum: "第八課",
    islandName: "翠竹秘境島",
    title: "空白島嶼（第八課預留）",
    subtitle: "老師可隨時點擊「教師造島工坊」填入課文題目與寶物",
    theme: "bamboo",
    x: 16,
    y: 34,
    connectsTo: ["lesson09"],
    padletUrl: "",
    stages: []
  },
  {
    id: "lesson09",
    status: "active",
    lessonNum: "第九課",
    islandName: "梨園戲台島",
    title: "孫翠鳳與歌仔戲",
    subtitle: "結合 Padlet 12 道課堂提問與修辭影音彩蛋的古韻冒險",
    theme: "opera",
    x: 42,
    y: 48,
    connectsTo: ["lesson08", "lesson10", "exam_island"],
    padletUrl: "https://padlet.com/ted0317_/padlet-s025r9udf85l6719nra9",
    stages: [
      {
        id: "l9_q1",
        zone: "第一區・墨海渡口",
        padletRef: "Padlet 第 1 題",
        title: "段數羅盤與圈詞掃雷",
        type: "choice",
        question: "登上梨園島第一關！關於課文預習「自然段與生字語詞」的閱讀策略，下列哪一項做法最正確？",
        hint: "想想看 Padlet 第 1 題任務：紅筆圈什麼？藍筆標什麼？還要標出什麼？",
        options: [
          "先快速念過一次就好，不需要標記任何段落與詞語",
          "用紅筆圈出生字語詞、藍筆標記不理解的詞句，並標出課文自然段數",
          "只看最後一段的心得，前面的採訪過程全部跳過",
          "把所有出現過的人名都塗掉"
        ],
        answer: 1,
        treasure: {
          id: "t_brush",
          name: "硃砂圈詞筆",
          sprite: "brush",
          rarity: "良品",
          cardQuote: "【第 1 題學習錦囊】讀新課文三步驟：①紅筆圈生字語詞 ②藍筆標記不理解處 ③標上自然段號，掌握文章骨幹！"
        }
      },
      {
        id: "l9_q2",
        zone: "第一區・墨海渡口",
        padletRef: "Padlet 第 2 題（小組討論）",
        title: "文體試煉碑",
        type: "choice",
        question: "請判斷本課《孫翠鳳與歌仔戲》屬於哪一種文體？它的主要寫作形式是什麼？",
        hint: "課文裡有「採訪前言」、一連串「提問與受訪者回答」，最後還有親身體驗與結語喔！",
        options: [
          "記敘文（遊記）——只描寫各地風景名勝",
          "訪問稿（採訪報導）——由採訪前言、問答實錄、親身體驗與結語構成",
          "新詩（韻文）——每句押韻、分行排列",
          "劇本——只有角色名字與舞台指示，沒有訪問前言"
        ],
        answer: 1,
        padletTip: "過關提示：記得和組員到 Padlet「第 2 題」區段寫下你們的判斷依據喔！",
        treasure: {
          id: "t_scroll",
          name: "採訪竹簡",
          sprite: "scroll",
          rarity: "良品",
          cardQuote: "【第 2 題學習錦囊】本課文體為「訪問稿／採訪報導」。結構分為：採訪緣起前言 → 訪談問答重點 → 體驗與心得結語。"
        }
      },
      {
        id: "l9_q3",
        zone: "第一區・墨海渡口",
        padletRef: "Padlet 第 3 題（個人作答）",
        title: "前言三要素通行證",
        type: "multi",
        question: "守門將軍要檢查你的「採訪前言三要素」！下列哪些要素是課文前言明確交代的？（請選出 3 項正確項目）",
        hint: "想一想 Padlet 第 3 題要提取的 3 個關鍵詞：①原因、②對象、③地點。",
        options: [
          "採訪原因：完成學校藝術與人文課的分組採訪作業",
          "採訪對象：明華園當家「無敵小生」孫翠鳳",
          "採訪地點：前往明華園總團部進行面對面採訪",
          "採訪時間：挑選跨年夜的煙火施放時刻",
          "採訪費用：花費一萬元購買限量戲票"
        ],
        answer: [0, 1, 2],
        treasure: {
          id: "t_token",
          name: "明華園通行令牌",
          sprite: "token",
          rarity: "珍品",
          cardQuote: "【第 3 題學習錦囊】採訪前言三要素缺一不可：①原因（藝術採訪作業）②對象（孫翠鳳）③地點（明華園總團部）。"
        }
      },
      {
        id: "l9_q4",
        zone: "第二區・問答竹林",
        padletRef: "Padlet 第 4 題",
        title: "雙劍分類陣：提問 vs 追問",
        type: "classify",
        question: "採訪時，問題分為「事先設計好的提問」與「依回答內容的現場追問」。請幫下列 4 個問題分類！",
        hint: "「現場追問」通常是聽到受訪者剛說的話（例如：提到辛苦、提到反串）才順著接著問下去的深入問題。",
        categories: ["事先設計的提問", "現場延伸的追問"],
        items: [
          { text: "請問您當初是如何踏入歌仔戲這一行？", cat: 0 },
          { text: "既然這麼辛苦，為什麼有勇氣撐下來？", cat: 1 },
          { text: "女性反串生角，有哪些特殊的揣摩功夫？", cat: 1 },
          { text: "面對現代娛樂競爭，是否擔心歌仔戲沒落？", cat: 0 }
        ],
        treasure: {
          id: "t_jade",
          name: "追問慧眼玉",
          sprite: "jade",
          rarity: "珍品",
          cardQuote: "【第 4 題學習錦囊】好的採訪不只照稿念！「事先提問」抓主軸，「現場追問」接住受訪者的故事，讓訪問更有深度。"
        }
      },
      {
        id: "l9_q5",
        zone: "第三區・古韻戲台聚落",
        padletRef: "Padlet 第 5 題",
        title: "入行之亭：戲班機緣",
        type: "choice",
        question: "面對「如何入行？」的提問，孫翠鳳分享自己當初是怎麼踏上歌仔戲舞台的？",
        hint: "她原本並不是從小學戲，而是婚後一次「臨時救場」的機會喔！",
        options: [
          "從三歲就立志當武生，每天在廟口免費唱戲",
          "婚後因劇團臨時缺一個「不用開口說話的丫鬟」，被推上台而展開戲劇生涯",
          "先在網路上拍搞笑短片爆紅後被邀請加入",
          "參加全國歌唱大賽獲得冠軍後直接演主角"
        ],
        answer: 1,
        treasure: {
          id: "t_ticket",
          name: "戲班入門票",
          sprite: "ticket",
          rarity: "良品",
          cardQuote: "【第 5 題學習錦囊】孫翠鳳 26 歲半路出家，從不用開口的跑龍套丫鬟起步，一步步磨練成「首席臨時演員」。"
        }
      },
      {
        id: "l9_q6",
        zone: "第三區・古韻戲台聚落",
        padletRef: "Padlet 第 6 題",
        title: "練功之井：苦練歲月",
        type: "choice",
        question: "孫翠鳳學戲過程非常辛苦（不會講閩南語、筋骨僵硬練劈腿下腰），她是怎麼撐過來的？",
        hint: "她比別人起步晚，所以她用了幾倍的時間與決心去苦練？",
        options: [
          "只要遇到太難的動作就請替身代打，專心背台詞就好",
          "花比別人「兩倍的時間」咬牙苦練，把全身的傷痕當成成功的紀念品",
          "改演完全不需要講閩南語和拉筋的現代舞台劇",
          "每天只練習十分鐘，靠天分自然學會"
        ],
        answer: 1,
        treasure: {
          id: "t_towel",
          name: "十年功汗巾",
          sprite: "towel",
          rarity: "珍品",
          cardQuote: "【第 6 題學習錦囊】「台上一分鐘，台下十年功！」別人練一遍，半路出家的她就用兩倍時間苦撐，把傷痕變成榮耀。"
        }
      },
      {
        id: "l9_q7",
        zone: "第三區・古韻戲台聚落",
        padletRef: "Padlet 第 7 題",
        title: "陰陽之鏡：為何反串",
        type: "choice",
        question: "身為女性的孫翠鳳，為何會選擇「反串」扮演男性「小生」角色？",
        hint: "除了歌仔戲本身的戲曲傳統之外，也跟她自己的「個性」與「戲胞」有關！",
        options: [
          "因為劇團規定女生絕對不能演花旦",
          "歌仔戲魅力之一就是女性反串小生，加上她覺得自己個性適合演小生、能發揮戲胞",
          "因為小生的戲服比較輕便、不用化妝",
          "因為抽籤輸了才被迫換穿男裝"
        ],
        answer: 1,
        treasure: {
          id: "t_fan",
          name: "生旦雙面摺扇",
          sprite: "fan",
          rarity: "珍品",
          cardQuote: "【第 7 題學習錦囊】女性反串小生是歌仔戲的一大魅力！孫翠鳳用心揣摩男性氣魄與眼神，成為家喻戶曉的「無敵小生」。"
        }
      },
      {
        id: "l9_q8",
        zone: "第三區・古韻戲台聚落",
        padletRef: "Padlet 第 8 題",
        title: "衣箱寶閣：戲服密碼",
        type: "choice",
        question: "孫翠鳳在現場介紹歌仔戲「生、旦、淨、丑」與戲服穿著時，說明戲服是如何區分的？",
        hint: "想想看：市井小民跟達官顯要穿的布料和圖案有什麼差別？",
        options: [
          "所有角色全部穿一模一樣的白色長袍，靠帽子顏色區分",
          "依角色行當與社會身分區分：市井小民穿粗布衣，達官顯要穿繡龍鳳的華麗戲服",
          "完全按照季節溫度決定穿短袖或羽絨衣",
          "只有丑角可以穿刺繡服裝，其他人都穿牛仔褲"
        ],
        answer: 1,
        treasure: {
          id: "t_robe",
          name: "金線蟒袍",
          sprite: "robe",
          rarity: "珍品",
          cardQuote: "【第 8 題學習錦囊】歌仔戲行當分為「生、旦、淨、丑」，戲服講究「寧穿破，不穿錯」，依角色身分展現不同華麗圖騰！"
        }
      },
      {
        id: "l9_q9",
        zone: "第三區・古韻戲台聚落",
        padletRef: "Padlet 第 9 題",
        title: "薪火高塔：面對時代考驗",
        type: "choice",
        question: "面對「是否擔心歌仔戲沒落？」的問題，孫翠鳳與明華園是如何看待與應對的？",
        hint: "他們沒有消極守舊，而是把傳統歌仔戲結合了什麼新元素？",
        options: [
          "認為傳統戲曲一定會消失，打算把劇團解散",
          "不害怕沒落！積極結合現代燈光、科技特效（如吊鋼絲、高空水柱），不斷創新吸引新世代觀眾",
          "禁止年輕人來看戲，只保留給長輩欣賞",
          "把所有對白改成英文演唱"
        ],
        answer: 1,
        treasure: {
          id: "t_lantern",
          name: "不熄戲燈",
          sprite: "lantern",
          rarity: "稀世",
          cardQuote: "【第 9 題學習錦囊】傳統文化要靠「創新」延續生命力！明華園把野台戲搬進現代劇場，結合科技奇觀讓年輕人也愛上歌仔戲。"
        }
      },
      {
        id: "l9_q10",
        zone: "第四區・紅氍毹主舞台",
        padletRef: "Padlet 第 10 題＋影音①",
        title: "七字調音律台",
        type: "rhythm",
        question: "採訪者們最後體驗了哪齣經典劇目？歌仔戲最常用的曲調又是什麼？（先試試點擊下方的《七字調》節拍鼓，再選出正確組合！）",
        hint: "對應課文句子：「好好的一首□□□，被我們一唱，五音只全了一音。」（提示：《身騎白馬》就是這齣戲的唱段！）",
        rhythmPhrase: ["我", "身", "騎", "白", "馬", "走", "三", "關"],
        options: [
          "體驗劇目：《薛平貴與王寶釧》｜常用曲調：《七字調》（七字一句、四句一首）",
          "體驗劇目：《西遊記》｜常用曲調：《搖滾Rap》",
          "體驗劇目：《三國演義》｜常用曲調：《京劇西皮》",
          "體驗劇目：《小紅帽》｜常用曲調：《兒歌兩隻老虎》"
        ],
        answer: 0,
        treasure: {
          id: "t_huqin",
          name: "七字調胡琴",
          sprite: "huqin",
          rarity: "稀世",
          cardQuote: "【第 10 題學習錦囊】《薛平貴與王寶釧》是歌仔戲經典，《七字調》則是「七字一句、四句一首」的核心曲調！"
        }
      },
      {
        id: "l9_q11",
        zone: "第四區・紅氍毹主舞台",
        padletRef: "Padlet 第 11 題＋影音⑦",
        title: "身段演武場",
        type: "classify",
        question: "採訪者在現場體驗了兩大角色的身段動作！請將下方的手勢與臺步，配對給正確的角色：",
        hint: "生角陽剛帥氣（劍指、武生步）；旦角柔美優雅（蘭花指、青衣步）。",
        categories: ["生角（薛平貴）身段", "旦角（王寶釧）身段"],
        items: [
          { text: "英氣挺拔的「劍指」手勢", cat: 0 },
          { text: "穩健有氣勢的「武生步」", cat: 0 },
          { text: "優雅柔美的「蘭花指／蝶指」", cat: 1 },
          { text: "輕盈細緻的「青衣步」", cat: 1 }
        ],
        treasure: {
          id: "t_helmet",
          name: "無敵小生帥盔",
          sprite: "helmet",
          rarity: "稀世",
          cardQuote: "【第 11 題學習錦囊】生角「劍指＋武生步」顯氣勢；旦角「蘭花指＋青衣步」顯柔美，剛柔並濟展現戲曲身段之美！"
        }
      },
      {
        id: "l9_q12",
        zone: "第四區・紅氍毹主舞台",
        padletRef: "Padlet 第 12 題（最終 BOSS）",
        title: "采風大成・收穫百寶箱",
        type: "multi",
        question: "最終大挑戰！作者們在結束這次令人難忘、收穫滿滿的採訪之旅後，總共完成了哪三件事？（請選出 3 項）",
        hint: "回想第 12 題：①作業完成了嗎？②見到誰、認識了什麼？③最後有沒有親自上場體驗？",
        options: [
          "順利完成了藝術與人文課的採訪作業",
          "親睹名家孫翠鳳風采，深入認識歌仔戲文化與創新精神",
          "換上戲服親身體驗唱七字調與角色身段動作",
          "決定休學立刻加入馬戲團環遊世界",
          "把所有採訪錄音全部刪除忘記"
        ],
        answer: [0, 1, 2],
        padletTip: "恭喜破關主線！別忘了到 Padlet「第 12 題」與「備用區段三」留下你的課後心得喔！",
        treasure: {
          id: "t_seal",
          name: "太史采風印",
          sprite: "seal",
          rarity: "傳說",
          cardQuote: "【第 12 題學習錦囊】這趟採訪不僅完成作業、親見大師風采，更透過親身體驗真正愛上台灣傳統戲曲！"
        }
      },
      {
        id: "l9_b1",
        zone: "隱藏秘境・修辭煉丹爐",
        padletRef: "Padlet 備用區段一（課文修辭）",
        title: "彩蛋關：課文修辭大師",
        type: "classify",
        isBonus: true,
        question: "【隱藏修辭彩蛋】請辨識課文中的精彩修辭技巧，將例句送到正確的修辭爐裡！",
        hint: "「自問或提出問題引出回答」是設問；「兩相對照凸顯差異」是映襯！",
        categories: ["設問修辭", "映襯修辭"],
        items: [
          { text: "「既然這麼辛苦，為什麼當初有勇氣跨入歌仔戲的世界？」", cat: 0 },
          { text: "「女性反串生角……有哪些特殊的揣摩？」", cat: 0 },
          { text: "「台上一分鐘，台下十年功」的苦練對比", cat: 1 },
          { text: "「女性特質」與「陽剛生角身段」的強烈對照", cat: 1 }
        ],
        treasure: {
          id: "t_goldpen",
          name: "修辭金毫筆",
          sprite: "goldpen",
          rarity: "隱藏神兵",
          cardQuote: "【備用區段一・修辭錦囊】善用「設問」帶出採訪提問，用「映襯」凸顯反串與十年苦練的震撼力！"
        }
      },
      {
        id: "l9_b2",
        zone: "隱藏秘境・戲曲留聲亭",
        padletRef: "Padlet 備用區段二（戲曲影音）",
        title: "彩蛋關：戲曲小學堂密碼",
        type: "choice",
        isBonus: true,
        question: "【隱藏影音彩蛋】在歌仔戲小學堂介紹中，最核心的《七字調》曲調結構是哪一種？",
        hint: "看看它的名字「七字調」跟每一首有幾句！",
        options: [
          "五字一句、兩句一首",
          "七字一句、四句一首",
          "十字一句、八句一首",
          "不限字數、自由念白"
        ],
        answer: 1,
        treasure: {
          id: "t_pendant",
          name: "明華園觀劇玉佩",
          sprite: "pendant",
          rarity: "隱藏神兵",
          cardQuote: "【備用區段二・影音錦囊】歌仔戲《七字調》結構為「七字一句、四句一首」，可到 Padlet 備用區段二觀看孫翠鳳親授影音喔！"
        }
      }
    ]
  },
  {
    id: "lesson10",
    status: "blank",
    lessonNum: "第十課",
    islandName: "雲霧山林島",
    title: "空白島嶼（第十課預留）",
    subtitle: "可隨時開啟「教師造島工坊」填入新課文",
    theme: "mountain",
    x: 68,
    y: 28,
    connectsTo: ["lesson09", "lesson11"],
    padletUrl: "",
    stages: []
  },
  {
    id: "lesson11",
    status: "blank",
    lessonNum: "第十一課",
    islandName: "墨海書院島",
    title: "空白島嶼（第十一課預留）",
    subtitle: "可隨時開啟「教師造島工坊」填入新課文",
    theme: "academy",
    x: 84,
    y: 56,
    connectsTo: ["lesson10", "lesson12"],
    padletUrl: "",
    stages: []
  },
  {
    id: "lesson12",
    status: "blank",
    lessonNum: "第十二課",
    islandName: "古港燈塔島",
    title: "空白島嶼（第十二課預留）",
    subtitle: "可隨時開啟「教師造島工坊」填入新課文",
    theme: "harbor",
    x: 65,
    y: 79,
    connectsTo: ["lesson11", "exam_island"],
    padletUrl: "",
    stages: []
  },
  {
    id: "exam_island",
    status: "blank",
    lessonNum: "考前複習",
    islandName: "龍門金榜島",
    title: "空白魔王島（段考綜合預留）",
    subtitle: "未來可彙整各島精選題，打造期末段考大挑戰",
    theme: "citadel",
    x: 34,
    y: 80,
    connectsTo: ["lesson09", "lesson12"],
    padletUrl: "",
    stages: []
  }
];
