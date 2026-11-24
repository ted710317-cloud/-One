import { stripUpgradeTags } from './annotationParser.js';

/**
 * 統一標準化 AI 回傳的作文評閱結果，避免欄位缺失導致前端渲染崩潰，
 * 並精準校準「未指定必備修辭」時的統計與顯示格式。
 */
export function normalizeEvaluationResult(
  rawParsed,
  { title = '', genre = '', targetWordCount = '', selectedRhetorics = [], content = '', imageBase64 = null } = {}
) {
  const parsed = rawParsed && typeof rawParsed === 'object' ? rawParsed : {};
  const meta = parsed.meta || {};
  const overall = parsed.overall || {};
  const fourDimensions = parsed.four_dimensions || {};
  const rhetoric = parsed.rhetoric_diagnosis || {};
  const interactive = parsed.interactive_learning || {};
  const modelEssay = parsed.level_6_model_essay || {};

  const fallbackWordCount = content ? content.replace(/\s+/g, '').length : 0;
  const hasSelectedRhetorics = Array.isArray(selectedRhetorics) && selectedRhetorics.length > 0;
  const rawDetails = Array.isArray(rhetoric.details) ? rhetoric.details : [];

  let normalizedRhetoric;
  if (!hasSelectedRhetorics) {
    // 未指定修辭：避免 AI 自行編造未達成項而出現「0% (0/2項)」誤導
    const detectedHighlights = rawDetails.filter((item) => item && item.detected);
    normalizedRhetoric = {
      target_rhetorics: [],
      achieved_count: detectedHighlights.length,
      total_target_count: 0,
      achievement_rate: '未指定',
      details: detectedHighlights,
    };
  } else {
    const totalTarget = selectedRhetorics.length;
    const achievedCount = rawDetails.filter((item) => item && item.detected).length;
    const rate = `${Math.round((achievedCount / totalTarget) * 100)}%`;
    normalizedRhetoric = {
      target_rhetorics: selectedRhetorics,
      achieved_count: achievedCount,
      total_target_count: totalTarget,
      achievement_rate: rhetoric.achievement_rate || rate,
      details: rawDetails,
    };
  }

  return {
    meta: {
      title: meta.title || title || '無題',
      genre: meta.genre || genre || '不限文體',
      actual_word_count: typeof meta.actual_word_count === 'number' ? meta.actual_word_count : fallbackWordCount,
      target_word_count: meta.target_word_count || targetWordCount || '未限定',
      word_count_status: meta.word_count_status || '已完成字數評估',
      is_handwritten_photo: Boolean(meta.is_handwritten_photo ?? imageBase64),
      ocr_transcript: typeof meta.ocr_transcript === 'string' ? meta.ocr_transcript : '',
    },
    overall: {
      score: typeof overall.score === 'number' ? overall.score : 4,
      grade_name: overall.grade_name || `${overall.score || 4} 級分`,
      summary_comment: overall.summary_comment || '已完成文章整體檢視，請參考下方四向度具體建議。',
    },
    four_dimensions: {
      theme_and_materials: {
        dimension_name: '立意取材',
        highlights: fourDimensions.theme_and_materials?.highlights || '文意貼合題旨。',
        suggestions: fourDimensions.theme_and_materials?.suggestions || '可再深化個人體驗與思想省思。',
      },
      structure_and_organization: {
        dimension_name: '結構組織',
        highlights: fourDimensions.structure_and_organization?.highlights || '段落安排具備基本脈絡。',
        suggestions: fourDimensions.structure_and_organization?.suggestions || '可強化段落間轉折與首尾呼應。',
      },
      vocabulary_and_sentences: {
        dimension_name: '遣詞造句',
        highlights: fourDimensions.vocabulary_and_sentences?.highlights || '語句大致通順自然。',
        suggestions: fourDimensions.vocabulary_and_sentences?.suggestions || '可嘗試變化句型並融入五感摹寫。',
      },
      orthography_and_punctuation: {
        dimension_name: '錯別字與標點',
        typo_corrections: Array.isArray(fourDimensions.orthography_and_punctuation?.typo_corrections)
          ? fourDimensions.orthography_and_punctuation.typo_corrections
          : [],
        punctuation_comment:
          fourDimensions.orthography_and_punctuation?.punctuation_comment || '標點符號運用大致得宜。',
      },
    },
    rhetoric_diagnosis: normalizedRhetoric,
    interactive_learning: {
      sentence_upgrade: interactive.sentence_upgrade || null,
      reflection_questions: Array.isArray(interactive.reflection_questions) ? interactive.reflection_questions : [],
      teacher_encouragement: interactive.teacher_encouragement || '',
    },
    level_6_model_essay: modelEssay.model_content
      ? (() => {
          const rawAnnotated = modelEssay.annotated_content || modelEssay.model_content;
          const cleanContent = stripUpgradeTags(modelEssay.model_content);
          return {
            essay_title: modelEssay.essay_title || `${meta.title || title || '原創'}（六級分示範升級範文）`,
            word_count: cleanContent.replace(/\s+/g, '').length || modelEssay.word_count || 0,
            model_content: cleanContent,
            annotated_content: rawAnnotated,
            elevation_highlights: Array.isArray(modelEssay.elevation_highlights)
              ? modelEssay.elevation_highlights
              : [],
          };
        })()
      : null,
  };
}
