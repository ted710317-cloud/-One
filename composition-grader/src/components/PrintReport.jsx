import React from 'react';

export default function PrintReport({ result, originalContent }) {
  if (!result) return null;

  const { meta, overall, four_dimensions, rhetoric_diagnosis, interactive_learning, level_6_model_essay } = result;

  return (
    <div
      id="print-report-container"
      className="print-report-wrapper"
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang TC", "Microsoft JhengHei", sans-serif',
        color: '#0f172a',
        lineHeight: 1.45,
        fontSize: '11px',
      }}
    >
      {/* ═══════════ PAGE 1: 寫作診斷報告書 ═══════════ */}
      <div
        id="print-page-1"
        className="print-page print-page-1"
        style={{
          width: '794px',
          height: '1123px',
          padding: '38px 44px',
          boxSizing: 'border-box',
          backgroundColor: '#ffffff',
          color: '#0f172a',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div>
          {/* Header */}
          <div
            style={{
              borderBottom: '2px solid #0f172a',
              paddingBottom: '10px',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', color: '#4338ca', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>朕的會考六級分作文AI診斷室</span>
                <span style={{ fontSize: '10px', padding: '1px 6px', backgroundColor: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: '4px', color: '#3730a3' }}>
                  研發設計：偉朕老師
                </span>
              </div>
              <h1 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: '4px 0 2px 0' }}>
                A4 寫作診斷報告書：{meta.title}
              </h1>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                評估日期：{new Date().toLocaleDateString('zh-TW')} · 四向度全面診斷與修辭達成追蹤
              </div>
            </div>

            {/* Seal Stamp */}
            <div
              style={{
                border: '2px solid #0f172a',
                padding: '6px 16px',
                borderRadius: '8px',
                textAlign: 'center',
                backgroundColor: '#f8fafc',
                flexShrink: 0,
              }}
            >
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#475569' }}>會考評定</div>
              <div style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>{overall.grade_name || `${overall.score} 級分`}</div>
            </div>
          </div>

          {/* Meta Statistics Bar */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1.2fr',
              gap: '8px',
              backgroundColor: '#f1f5f9',
              padding: '10px 12px',
              borderRadius: '6px',
              marginBottom: '12px',
              fontSize: '11px',
            }}
          >
            <div><strong>實際字數：</strong>{meta.actual_word_count} 字（目標：{meta.target_word_count}）</div>
            <div><strong>字數判定：</strong>{meta.word_count_status}</div>
            <div><strong>修辭達成率：</strong>{rhetoric_diagnosis.achieved_count}/{rhetoric_diagnosis.total_target_count} 項（{rhetoric_diagnosis.achievement_rate}）</div>
          </div>

          {/* 閱卷導師綜合短評 */}
          <div style={{ marginBottom: '12px' }}>
            <h2 style={{ fontSize: '12px', fontWeight: 'bold', backgroundColor: '#e2e8f0', padding: '3px 10px', borderRadius: '3px', marginBottom: '6px', color: '#1e293b' }}>
              🏆 閱卷導師綜合評語（100~150 字評定）
            </h2>
            <p style={{ padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '4px', backgroundColor: '#f8fafc', fontSize: '11px', lineHeight: '1.6', color: '#1e293b', fontWeight: '500', margin: 0 }}>
              {overall.summary_comment}
            </p>
          </div>

          {/* 四向度深度診斷 (2x2 Grid) */}
          <div style={{ marginBottom: '12px' }}>
            <h2 style={{ fontSize: '12px', fontWeight: 'bold', backgroundColor: '#e2e8f0', padding: '3px 10px', borderRadius: '3px', marginBottom: '6px', color: '#1e293b' }}>
              🔍 四向度深度診斷
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
              <div style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '4px', backgroundColor: '#ffffff' }}>
                <strong style={{ color: '#0f172a', display: 'block', marginBottom: '2px', fontWeight: 'bold' }}>【一、立意取材】</strong>
                <p style={{ margin: '0 0 3px 0' }}><span style={{ fontWeight: 'bold', color: '#065f46' }}>亮點：</span>{four_dimensions.theme_and_materials.highlights}</p>
                <p style={{ margin: 0 }}><span style={{ fontWeight: 'bold', color: '#4338ca' }}>建議：</span>{four_dimensions.theme_and_materials.suggestions}</p>
              </div>

              <div style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '4px', backgroundColor: '#ffffff' }}>
                <strong style={{ color: '#0f172a', display: 'block', marginBottom: '2px', fontWeight: 'bold' }}>【二、結構組織】</strong>
                <p style={{ margin: '0 0 3px 0' }}><span style={{ fontWeight: 'bold', color: '#065f46' }}>亮點：</span>{four_dimensions.structure_and_organization.highlights}</p>
                <p style={{ margin: 0 }}><span style={{ fontWeight: 'bold', color: '#4338ca' }}>建議：</span>{four_dimensions.structure_and_organization.suggestions}</p>
              </div>

              <div style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '4px', backgroundColor: '#ffffff' }}>
                <strong style={{ color: '#0f172a', display: 'block', marginBottom: '2px', fontWeight: 'bold' }}>【三、遣詞造句】</strong>
                <p style={{ margin: '0 0 3px 0' }}><span style={{ fontWeight: 'bold', color: '#065f46' }}>亮點：</span>{four_dimensions.vocabulary_and_sentences.highlights}</p>
                <p style={{ margin: 0 }}><span style={{ fontWeight: 'bold', color: '#4338ca' }}>建議：</span>{four_dimensions.vocabulary_and_sentences.suggestions}</p>
              </div>

              <div style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '4px', backgroundColor: '#ffffff' }}>
                <strong style={{ color: '#0f172a', display: 'block', marginBottom: '2px', fontWeight: 'bold' }}>【四、錯別字與標點診療】</strong>
                {four_dimensions.orthography_and_punctuation.typo_corrections?.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: '16px' }}>
                    {four_dimensions.orthography_and_punctuation.typo_corrections.slice(0, 4).map((t, idx) => (
                      <li key={idx} style={{ marginBottom: '2px' }}>
                        <span style={{ textDecoration: 'line-through', color: '#dc2626' }}>{t.original}</span> ➔ <strong style={{ color: '#065f46' }}>{t.correction}</strong>（{t.explanation}）
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ color: '#065f46', margin: 0 }}>未發現明顯錯字，書寫精確。</p>
                )}
              </div>
            </div>
          </div>

          {/* 指定修辭技巧達成狀況 (2 Column Grid) */}
          <div style={{ marginBottom: '12px' }}>
            <h2 style={{ fontSize: '12px', fontWeight: 'bold', backgroundColor: '#e2e8f0', padding: '3px 10px', borderRadius: '3px', marginBottom: '6px', color: '#1e293b' }}>
              🎨 指定修辭技巧達成清單
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11px' }}>
              {rhetoric_diagnosis.details?.map((item, idx) => (
                <div key={idx} style={{ padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: '4px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '6px', backgroundColor: '#ffffff' }}>
                  <div>
                    <strong>{item.name}：</strong>
                    {item.detected ? (
                      <span>已達成。{item.sample_sentence && `「${item.sample_sentence.slice(0, 28)}...」`}</span>
                    ) : (
                      <span style={{ color: '#64748b' }}>未達成。{item.evaluation.slice(0, 30)}...</span>
                    )}
                  </div>
                  <span
                    style={{
                      padding: '1px 5px',
                      borderRadius: '3px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      flexShrink: 0,
                      backgroundColor: item.detected ? '#d1fae5' : '#e2e8f0',
                      color: item.detected ? '#065f46' : '#475569',
                    }}
                  >
                    {item.detected ? '達成' : '未達'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 句子升級魔法 */}
          {interactive_learning?.sentence_upgrade && (
            <div style={{ marginBottom: '8px' }}>
              <h2 style={{ fontSize: '12px', fontWeight: 'bold', backgroundColor: '#e2e8f0', padding: '3px 10px', borderRadius: '3px', marginBottom: '6px', color: '#1e293b' }}>
                ✍️ 實戰修訂：句子升級魔法
              </h2>
              <div style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '4px', backgroundColor: '#ffffff', fontSize: '11px' }}>
                <div style={{ color: '#64748b', marginBottom: '2px' }}>【原句】：{interactive_learning.sentence_upgrade.original}</div>
                <div style={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '2px' }}>【升級示範】：{interactive_learning.sentence_upgrade.upgraded}</div>
                <div style={{ fontSize: '10px', color: '#4338ca' }}>升級要點：{interactive_learning.sentence_upgrade.upgrade_tip}</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer for Page 1 */}
        <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '4px', fontSize: '10px', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
          <span>朕的會考六級分作文AI診斷室 · 偉朕老師 研發製作</span>
          <span>第 1 頁，共 2 頁</span>
        </div>
      </div>

      {/* ═══════════ PAGE 2: 六級分原創昇華範文 ═══════════ */}
      {level_6_model_essay && (
        <div
          id="print-page-2"
          className="print-page print-page-2"
          style={{
            width: '794px',
            height: '1123px',
            padding: '38px 44px',
            boxSizing: 'border-box',
            backgroundColor: '#ffffff',
            color: '#0f172a',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            {/* Header */}
            <div
              style={{
                borderBottom: '2px solid #0f172a',
                paddingBottom: '10px',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: '#b45309', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>原創情節 · 六級分昇華典範</span>
                  <span style={{ fontSize: '10px', padding: '1px 6px', backgroundColor: '#fef3c7', border: '1px solid #fde68a', borderRadius: '4px', color: '#78350f' }}>
                    研發設計：偉朕老師
                  </span>
                </div>
                <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', margin: '4px 0 2px 0' }}>
                  {level_6_model_essay.essay_title || '原創六級分示範升級範文'}
                </h2>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  字數約 {level_6_model_essay.word_count} 字 · 嚴格保留學生真實經歷與情節骨架
                </div>
              </div>
              <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', backgroundColor: '#fef3c7', color: '#78350f', fontWeight: 'bold', border: '1px solid #fde68a' }}>
                六級分示範
              </span>
            </div>

            {/* 範文主文 (舒朗閱讀排版) */}
            <div
              style={{
                padding: '16px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '12px',
                lineHeight: '1.75',
                whiteSpace: 'pre-line',
                backgroundColor: '#f8fafc',
                marginBottom: '12px',
                color: '#1e293b',
              }}
            >
              {level_6_model_essay.model_content}
            </div>

            {/* 升級解密 */}
            {level_6_model_essay.elevation_highlights?.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <h3 style={{ fontSize: '12px', fontWeight: 'bold', backgroundColor: '#e2e8f0', padding: '3px 10px', borderRadius: '3px', marginBottom: '6px', color: '#1e293b' }}>
                  💡 晉級六級分關鍵秘笈（升級解密）
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '11px' }}>
                  {level_6_model_essay.elevation_highlights.map((h, i) => (
                    <div key={i} style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '4px', backgroundColor: '#ffffff' }}>
                      <strong style={{ color: '#4338ca', display: 'block', marginBottom: '2px' }}>{h.aspect}</strong>
                      <p style={{ color: '#475569', margin: 0, lineHeight: '1.4' }}>{h.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 深度思考題與導師期勉 */}
            {interactive_learning && (
              <div style={{ padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '4px', backgroundColor: '#ffffff', fontSize: '11px' }}>
                {interactive_learning.reflection_questions?.length > 0 && (
                  <div style={{ marginBottom: '6px' }}>
                    <strong style={{ color: '#0f172a', display: 'block', marginBottom: '2px' }}>🤔 深度思考題（啟發再寫一次）：</strong>
                    <ul style={{ margin: 0, paddingLeft: '16px', color: '#334155' }}>
                      {interactive_learning.reflection_questions.map((q, idx) => (
                        <li key={idx} style={{ marginBottom: '2px' }}>{q}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {interactive_learning.teacher_encouragement && (
                  <div style={{ paddingTop: '6px', borderTop: '1px solid #f1f5f9', color: '#1e293b', fontStyle: 'italic' }}>
                    💌 <strong>導師期勉：</strong>{interactive_learning.teacher_encouragement}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer for Page 2 */}
          <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '4px', fontSize: '10px', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
            <span>朕的會考六級分作文AI診斷室 · 偉朕老師 研發製作</span>
            <span>第 2 頁，共 2 頁</span>
          </div>
        </div>
      )}
    </div>
  );
}
