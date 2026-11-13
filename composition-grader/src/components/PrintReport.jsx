import React from 'react';

export default function PrintReport({ result, originalContent }) {
  if (!result) return null;

  const { meta, overall, four_dimensions, rhetoric_diagnosis, interactive_learning, level_6_model_essay } = result;

  return (
    <div className="hidden print:block font-sans text-slate-900 leading-normal text-[11px] max-w-[190mm] mx-auto">
      {/* ═══════════ PAGE 1: 寫作診斷報告書 ═══════════ */}
      <div className="print-page print-page-1 min-h-[270mm] flex flex-col justify-between py-2">
        <div>
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-2 mb-3 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-indigo-700 font-bold uppercase tracking-wider flex items-center gap-2">
                <span>朕的會考六級分作文AI診斷室</span>
                <span className="text-[9px] px-1.5 py-0.2 bg-indigo-50 border border-indigo-200 rounded text-indigo-800">
                  研發設計：偉朕老師
                </span>
              </div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight mt-0.5">
                A4 寫作診斷報告書：{meta.title}
              </h1>
              <div className="text-[10px] text-slate-500 mt-0.5">
                評估日期：{new Date().toLocaleDateString('zh-TW')} · 四向度全面診斷與修辭達成追蹤
              </div>
            </div>

            {/* Seal Stamp */}
            <div className="border-2 border-slate-900 px-4 py-1.5 rounded-lg text-center bg-slate-50 shrink-0">
              <div className="text-[9px] font-bold text-slate-600 tracking-wider">會考評定</div>
              <div className="text-base font-black text-slate-900">{overall.grade_name || `${overall.score} 級分`}</div>
            </div>
          </div>

          {/* Meta Statistics Bar */}
          <div className="grid grid-cols-3 gap-2 bg-slate-100 p-2 rounded-md mb-3 text-[10px]">
            <div>
              <strong>實際字數：</strong>{meta.actual_word_count} 字（目標：{meta.target_word_count}）
            </div>
            <div>
              <strong>字數判定：</strong>{meta.word_count_status}
            </div>
            <div>
              <strong>修辭達成率：</strong>{rhetoric_diagnosis.achieved_count}/{rhetoric_diagnosis.total_target_count} 項（{rhetoric_diagnosis.achievement_rate}）
            </div>
          </div>

          {/* 閱卷導師綜合短評 */}
          <div className="mb-3">
            <h2 className="text-[11px] font-bold bg-slate-200 px-2 py-0.5 rounded-sm mb-1 text-slate-800">
              🏆 閱卷導師綜合評語（100~150 字評定）
            </h2>
            <p className="p-2 border border-slate-200 rounded-sm bg-slate-50 text-[10px] leading-relaxed text-slate-800 font-medium">
              {overall.summary_comment}
            </p>
          </div>

          {/* 四向度深度診斷 (2x2 Grid) */}
          <div className="mb-3">
            <h2 className="text-[11px] font-bold bg-slate-200 px-2 py-0.5 rounded-sm mb-1 text-slate-800">
              🔍 四向度深度診斷
            </h2>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="p-2 border border-slate-200 rounded-sm bg-white">
                <strong className="text-slate-900 block mb-0.5 font-bold">【一、立意取材】</strong>
                <p className="mb-1"><span className="font-bold text-emerald-800">亮點：</span>{four_dimensions.theme_and_materials.highlights}</p>
                <p><span className="font-bold text-indigo-800">建議：</span>{four_dimensions.theme_and_materials.suggestions}</p>
              </div>

              <div className="p-2 border border-slate-200 rounded-sm bg-white">
                <strong className="text-slate-900 block mb-0.5 font-bold">【二、結構組織】</strong>
                <p className="mb-1"><span className="font-bold text-emerald-800">亮點：</span>{four_dimensions.structure_and_organization.highlights}</p>
                <p><span className="font-bold text-indigo-800">建議：</span>{four_dimensions.structure_and_organization.suggestions}</p>
              </div>

              <div className="p-2 border border-slate-200 rounded-sm bg-white">
                <strong className="text-slate-900 block mb-0.5 font-bold">【三、遣詞造句】</strong>
                <p className="mb-1"><span className="font-bold text-emerald-800">亮點：</span>{four_dimensions.vocabulary_and_sentences.highlights}</p>
                <p><span className="font-bold text-indigo-800">建議：</span>{four_dimensions.vocabulary_and_sentences.suggestions}</p>
              </div>

              <div className="p-2 border border-slate-200 rounded-sm bg-white">
                <strong className="text-slate-900 block mb-0.5 font-bold">【四、錯別字與標點診療】</strong>
                {four_dimensions.orthography_and_punctuation.typo_corrections?.length > 0 ? (
                  <ul className="list-disc list-inside space-y-0.5">
                    {four_dimensions.orthography_and_punctuation.typo_corrections.slice(0, 4).map((t, idx) => (
                      <li key={idx}>
                        <span className="line-through text-rose-600">{t.original}</span> ➔ <strong>{t.correction}</strong>（{t.explanation}）
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-emerald-800">未發現明顯錯字，書寫精確。</p>
                )}
              </div>
            </div>
          </div>

          {/* 指定修辭技巧達成狀況 (2 Column Grid) */}
          <div className="mb-3">
            <h2 className="text-[11px] font-bold bg-slate-200 px-2 py-0.5 rounded-sm mb-1 text-slate-800">
              🎨 指定修辭技巧達成清單
            </h2>
            <div className="grid grid-cols-2 gap-1.5 text-[10px]">
              {rhetoric_diagnosis.details?.map((item, idx) => (
                <div key={idx} className="p-1.5 border border-slate-200 rounded-sm flex items-start justify-between gap-1 bg-white">
                  <div>
                    <strong>{item.name}：</strong>
                    {item.detected ? (
                      <span>已達成。{item.sample_sentence && `「${item.sample_sentence.slice(0, 32)}...」`}</span>
                    ) : (
                      <span className="text-slate-500">未達成。{item.evaluation.slice(0, 35)}...</span>
                    )}
                  </div>
                  <span className={`px-1 py-0.2 rounded text-[9px] font-bold shrink-0 ${item.detected ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                    {item.detected ? '達成' : '未達'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 句子升級魔法 */}
          {interactive_learning?.sentence_upgrade && (
            <div className="mb-2">
              <h2 className="text-[11px] font-bold bg-slate-200 px-2 py-0.5 rounded-sm mb-1 text-slate-800">
                ✍️ 實戰修訂：句子升級魔法
              </h2>
              <div className="p-2 border border-slate-200 rounded-sm bg-white text-[10px]">
                <div className="text-slate-500 mb-0.5">【原句】：{interactive_learning.sentence_upgrade.original}</div>
                <div className="font-bold text-slate-900 mb-0.5">【升級示範】：{interactive_learning.sentence_upgrade.upgraded}</div>
                <div className="text-[9px] text-indigo-700">升級要點：{interactive_learning.sentence_upgrade.upgrade_tip}</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer for Page 1 */}
        <div className="border-t border-slate-300 pt-1 text-[9px] text-slate-500 flex justify-between">
          <span>朕的會考六級分作文AI診斷室 · 偉朕老師 研發製作</span>
          <span>第 1 頁，共 2 頁</span>
        </div>
      </div>

      {/* ═══════════ PAGE 2: 六級分原創昇華範文 ═══════════ */}
      {level_6_model_essay && (
        <div className="print-page print-page-2 min-h-[270mm] flex flex-col justify-between py-2">
          <div>
            {/* Header */}
            <div className="border-b-2 border-slate-900 pb-2 mb-3 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-amber-700 font-bold uppercase tracking-wider flex items-center gap-2">
                  <span>原創情節 · 六級分昇華典範</span>
                  <span className="text-[9px] px-1.5 py-0.2 bg-amber-50 border border-amber-200 rounded text-amber-900">
                    研發設計：偉朕老師
                  </span>
                </div>
                <h2 className="text-base font-black text-slate-900 tracking-tight mt-0.5">
                  {level_6_model_essay.essay_title || '原創六級分示範升級範文'}
                </h2>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  字數約 {level_6_model_essay.word_count} 字 · 嚴格保留學生真實經歷與情節骨架
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-md bg-amber-100 text-amber-900 font-bold border border-amber-300">
                六級分示範
              </span>
            </div>

            {/* 範文主文 (舒朗閱讀排版) */}
            <div className="p-4 border border-slate-300 rounded-md text-[11px] leading-relaxed whitespace-pre-line bg-slate-50/70 mb-3 font-sans">
              {level_6_model_essay.model_content}
            </div>

            {/* 升級解密 */}
            {level_6_model_essay.elevation_highlights?.length > 0 && (
              <div className="mb-3">
                <h3 className="text-[11px] font-bold bg-slate-200 px-2 py-0.5 rounded-sm mb-1.5 text-slate-800">
                  💡 晉級六級分關鍵秘笈（升級解密）
                </h3>
                <div className="grid grid-cols-3 gap-2 text-[10px]">
                  {level_6_model_essay.elevation_highlights.map((h, i) => (
                    <div key={i} className="p-2 border border-slate-200 rounded-sm bg-white">
                      <strong className="text-indigo-800 block mb-0.5">{h.aspect}</strong>
                      <p className="text-slate-600 leading-normal">{h.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 深度思考題與導師期勉 */}
            {interactive_learning && (
              <div className="p-2.5 border border-slate-200 rounded-sm bg-white text-[10px] space-y-1.5">
                {interactive_learning.reflection_questions?.length > 0 && (
                  <div>
                    <strong className="text-slate-900 block mb-0.5">🤔 深度思考題（啟發再寫一次）：</strong>
                    <ul className="list-disc list-inside text-slate-700 space-y-0.5">
                      {interactive_learning.reflection_questions.map((q, idx) => (
                        <li key={idx}>{q}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {interactive_learning.teacher_encouragement && (
                  <div className="pt-1 border-t border-slate-100 text-slate-800 italic">
                    💌 <strong>導師期勉：</strong>{interactive_learning.teacher_encouragement}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer for Page 2 */}
          <div className="border-t border-slate-300 pt-1 text-[9px] text-slate-500 flex justify-between">
            <span>朕的會考六級分作文AI診斷室 · 偉朕老師 研發製作</span>
            <span>第 2 頁，共 2 頁</span>
          </div>
        </div>
      )}
    </div>
  );
}
