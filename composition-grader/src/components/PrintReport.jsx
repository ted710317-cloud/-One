import React from 'react';

export default function PrintReport({ result, originalContent }) {
  if (!result) return null;

  const { meta, overall, four_dimensions, rhetoric_diagnosis, interactive_learning, level_6_model_essay } = result;

  return (
    <div className="hidden print:block p-8 max-w-[210mm] mx-auto text-black font-sans bg-white leading-relaxed text-xs">
      {/* Title Header */}
      <div className="border-b-2 border-slate-900 pb-3 mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            A4 寫作診斷報告書：{meta.title}
          </h1>
          <p className="text-[11px] text-slate-600 mt-0.5">
            依據臺灣國中教育會考六級分規準評定 · 產出時間：{new Date().toLocaleDateString('zh-TW')}
          </p>
        </div>
        <div className="text-right border-2 border-slate-900 px-4 py-1.5 rounded-lg text-center">
          <div className="text-[9px] font-bold text-slate-500 uppercase">會考評定</div>
          <div className="text-lg font-black text-slate-900">{overall.grade_name || `${overall.score} 級分`}</div>
        </div>
      </div>

      {/* Meta Bar */}
      <div className="grid grid-cols-3 gap-2 bg-slate-100 p-2.5 rounded-md mb-4 text-[11px]">
        <div>
          <strong>字數統計：</strong>{meta.actual_word_count} 字（目標：{meta.target_word_count}）
        </div>
        <div>
          <strong>字數狀態：</strong>{meta.word_count_status}
        </div>
        <div>
          <strong>修辭達成率：</strong>{rhetoric_diagnosis.achieved_count}/{rhetoric_diagnosis.total_target_count} 項 ({rhetoric_diagnosis.achievement_rate})
        </div>
      </div>

      {/* 導師總評 */}
      <div className="mb-4">
        <h2 className="text-xs font-bold bg-slate-200 px-2 py-1 rounded-sm mb-1.5">
          🏆 導師綜合評語
        </h2>
        <p className="p-2 border border-slate-200 rounded-sm bg-slate-50 text-[11px] leading-relaxed">
          {overall.summary_comment}
        </p>
      </div>

      {/* 四向度深度診斷 */}
      <div className="mb-4">
        <h2 className="text-xs font-bold bg-slate-200 px-2 py-1 rounded-sm mb-2">
          🔍 四向度深度診斷
        </h2>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="p-2 border border-slate-200 rounded-sm">
            <strong className="text-slate-900 block mb-1">【立意取材】</strong>
            <p className="mb-1"><span className="font-semibold text-emerald-800">亮點：</span>{four_dimensions.theme_and_materials.highlights}</p>
            <p><span className="font-semibold text-indigo-800">建議：</span>{four_dimensions.theme_and_materials.suggestions}</p>
          </div>
          <div className="p-2 border border-slate-200 rounded-sm">
            <strong className="text-slate-900 block mb-1">【結構組織】</strong>
            <p className="mb-1"><span className="font-semibold text-emerald-800">亮點：</span>{four_dimensions.structure_and_organization.highlights}</p>
            <p><span className="font-semibold text-indigo-800">建議：</span>{four_dimensions.structure_and_organization.suggestions}</p>
          </div>
          <div className="p-2 border border-slate-200 rounded-sm">
            <strong className="text-slate-900 block mb-1">【遣詞造句】</strong>
            <p className="mb-1"><span className="font-semibold text-emerald-800">亮點：</span>{four_dimensions.vocabulary_and_sentences.highlights}</p>
            <p><span className="font-semibold text-indigo-800">建議：</span>{four_dimensions.vocabulary_and_sentences.suggestions}</p>
          </div>
          <div className="p-2 border border-slate-200 rounded-sm">
            <strong className="text-slate-900 block mb-1">【錯別字與標點】</strong>
            {four_dimensions.orthography_and_punctuation.typo_corrections?.length > 0 ? (
              <ul className="list-disc list-inside space-y-0.5">
                {four_dimensions.orthography_and_punctuation.typo_corrections.map((t, idx) => (
                  <li key={idx}>
                    <span className="line-through text-red-600">{t.original}</span> ➔ <strong>{t.correction}</strong>（{t.explanation}）
                  </li>
                ))}
              </ul>
            ) : (
              <p>無明顯錯別字或標點錯誤。</p>
            )}
          </div>
        </div>
      </div>

      {/* 指定修辭檢驗 */}
      <div className="mb-4">
        <h2 className="text-xs font-bold bg-slate-200 px-2 py-1 rounded-sm mb-1.5">
          🎨 指定修辭技巧達成狀況
        </h2>
        <div className="space-y-1.5 text-[11px]">
          {rhetoric_diagnosis.details?.map((item, idx) => (
            <div key={idx} className="p-1.5 border border-slate-200 rounded-sm flex items-start justify-between gap-2">
              <div>
                <strong>{item.name}：</strong>
                {item.detected ? (
                  <span>已達成。{item.sample_sentence && `「${item.sample_sentence}」`}</span>
                ) : (
                  <span className="text-slate-500">未達成。</span>
                )}
                <span className="text-slate-600 ml-1">({item.evaluation})</span>
              </div>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${item.detected ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                {item.detected ? '達成' : '未達成'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 句子升級魔法與期勉 */}
      {interactive_learning && (
        <div className="mb-4">
          <h2 className="text-xs font-bold bg-slate-200 px-2 py-1 rounded-sm mb-1.5">
            ✍️ 實戰修訂與引導思考
          </h2>
          {interactive_learning.sentence_upgrade && (
            <div className="p-2 border border-slate-200 rounded-sm mb-2 text-[11px]">
              <div className="mb-1 text-slate-500">【原句】：{interactive_learning.sentence_upgrade.original}</div>
              <div className="font-semibold text-slate-900">【升級範例】：{interactive_learning.sentence_upgrade.upgraded}</div>
              <div className="text-[10px] text-slate-500 mt-1">升級要點：{interactive_learning.sentence_upgrade.upgrade_tip}</div>
            </div>
          )}
          {interactive_learning.teacher_encouragement && (
            <p className="text-[11px] text-slate-700 italic border-l-2 border-indigo-600 pl-2">
              💌 導師期勉：{interactive_learning.teacher_encouragement}
            </p>
          )}
        </div>
      )}

      {/* Page Break for Model Essay */}
      {level_6_model_essay && (
        <div className="page-break pt-4 border-t-2 border-slate-300">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-300 pb-1 mb-2 flex items-center justify-between">
            <span>🌟 原創六級分示範升級範文（保留學生情節骨架）</span>
            <span className="text-xs font-normal text-slate-500">{level_6_model_essay.word_count} 字</span>
          </h2>
          <div className="p-4 border border-slate-300 rounded-sm text-[11px] leading-relaxed whitespace-pre-line bg-slate-50 mb-3">
            {level_6_model_essay.model_content}
          </div>
          {level_6_model_essay.elevation_highlights?.length > 0 && (
            <div>
              <strong className="text-xs text-slate-900 block mb-1">【六級分升級要點解密】：</strong>
              <ul className="list-disc list-inside text-[11px] text-slate-700 space-y-1">
                {level_6_model_essay.elevation_highlights.map((h, i) => (
                  <li key={i}>
                    <strong>{h.aspect}：</strong>{h.description}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
