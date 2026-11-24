/**
 * 解析與清理六級分示範範文中的教學升級標記
 * 支援格式：
 * - [[詞彙：...]] 遣詞精進 / 錯字修補
 * - [[修辭：...]] 修辭潤飾 / 五感摹寫
 * - [[立意：...]] 立意昇華 / 深度反思
 */

export const UPGRADE_CATEGORIES = {
  vocab: {
    id: 'vocab',
    label: '遣詞精進／錯字修補',
    shortLabel: '遣詞精修',
    webClass: 'bg-emerald-100/85 text-emerald-950 border-b-2 border-emerald-400 px-1 py-0.5 rounded-xs',
    dotClass: 'bg-emerald-500',
    legendBgClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    printBg: '#d1fae5',
    printColor: '#064e3b',
    printBorder: '#34d399',
  },
  rhetoric: {
    id: 'rhetoric',
    label: '修辭潤飾／五感摹寫',
    shortLabel: '修辭摹寫',
    webClass: 'bg-indigo-100/85 text-indigo-950 border-b-2 border-indigo-400 px-1 py-0.5 rounded-xs',
    dotClass: 'bg-indigo-500',
    legendBgClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    printBg: '#e0e7ff',
    printColor: '#312e81',
    printBorder: '#818cf8',
  },
  theme: {
    id: 'theme',
    label: '立意昇華／深化反思',
    shortLabel: '立意昇華',
    webClass: 'bg-amber-100/90 text-amber-950 border-b-2 border-amber-400 px-1 py-0.5 rounded-xs',
    dotClass: 'bg-amber-500',
    legendBgClass: 'bg-amber-50 text-amber-900 border-amber-200',
    printBg: '#fef3c7',
    printColor: '#78350f',
    printBorder: '#fbbf24',
  },
};

const TAG_REGEX = /\[\[(詞彙|精修|錯字|潤飾|修改|修辭|感官|立意)[：:]([^[\]]+?)\]\]/g;
const STRAY_OPEN_REGEX = /\[\[(?:詞彙|精修|錯字|潤飾|修改|修辭|感官|立意)[：:]/g;

function mapTagToCategory(tagName) {
  if (tagName === '修辭' || tagName === '感官') return 'rhetoric';
  if (tagName === '立意') return 'theme';
  return 'vocab';
}

/**
 * 去除所有 [[類別：...]] 標記，還原純淨文章全文（用於複製與精確字數計算）
 */
export function stripUpgradeTags(text) {
  if (typeof text !== 'string' || !text) return '';
  let cleaned = text;
  // 跑兩次以防模型極少數情況下誤用雙層嵌套
  for (let i = 0; i < 2; i++) {
    cleaned = cleaned.replace(TAG_REGEX, '$2');
  }
  // 清理任何未閉合的殘餘標記
  cleaned = cleaned.replace(STRAY_OPEN_REGEX, '').replace(/\]\]/g, '');
  return cleaned;
}

/**
 * 將含有標記的示範範文拆解為可供 React / PrintReport 彩色高亮的區段陣列
 */
export function parseAnnotatedEssay(text) {
  if (typeof text !== 'string' || !text) {
    return { segments: [], hasAnnotations: false };
  }

  const segments = [];
  let lastIndex = 0;
  let hasAnnotations = false;

  const regex = new RegExp(TAG_REGEX.source, 'g');
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const plainChunk = text.slice(lastIndex, match.index).replace(STRAY_OPEN_REGEX, '').replace(/\]\]/g, '');
      if (plainChunk) {
        segments.push({ type: 'plain', text: plainChunk });
      }
    }

    const categoryKey = mapTagToCategory(match[1]);
    const innerText = match[2];
    if (innerText) {
      hasAnnotations = true;
      segments.push({
        type: categoryKey,
        text: innerText,
        label: UPGRADE_CATEGORIES[categoryKey].label,
      });
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    const tail = text.slice(lastIndex).replace(STRAY_OPEN_REGEX, '').replace(/\]\]/g, '');
    if (tail) {
      segments.push({ type: 'plain', text: tail });
    }
  }

  return { segments, hasAnnotations };
}
