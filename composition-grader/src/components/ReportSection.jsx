import React, { useState } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Sparkles,
  HelpCircle,
  Flame,
  ArrowRight,
  SplitSquareVertical,
  Maximize2,
  AlertTriangle,
  Lightbulb,
  Download
} from 'lucide-react';

export default function ReportSection({
  result,
  originalContent,
  isLoading,
  onLoadDemo,
  onDownloadPdf,
  isExportingPdf,
  pdfProgressMsg,
}) {
  const [activeTab, setActiveTab] = useState('model_essay'); // 'model_essay' | 'four_dimensions' | 'rhetoric' | 'interactive'
  const [copied, setCopied] = useState(false);
  const [compareMode, setCompareMode] = useState(false);

  // If loading
  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-xs border border-slate-200/80 flex flex-col items-center justify-center text-center min-h-[520px]">
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-indigo-600">
            <Sparkles className="w-8 h-8 animate-pulse" />
          </div>
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">會考六級分規準深度評閱中</h3>
        <p className="text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
          AI 正在比對立意取材、結構組織、遣詞造句與錯別字向度，同時檢測指定修辭並為您量身改寫六級分示範範文...
        </p>

        <div className="w-full max-w-sm space-y-2.5 text-left text-sm text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-2.5 text-indigo-700 font-semibold">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-ping" />
            <span>1. 審題、文章脈絡與字數統計</span>
          </div>
          <div className="flex items-center gap-2.5 text-indigo-700 font-semibold">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-ping" />
            <span>2. 必備修辭與亮點佳句識別</span>
          </div>
          <div className="flex items-center gap-2.5 text-indigo-700 font-semibold">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-ping" />
            <span>3. 會考級分判定與錯別字診療</span>
          </div>
          <div className="flex items-center gap-2.5 text-indigo-700 font-semibold">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-ping" />
            <span>4. 原創情節六級分昇華範文生成</span>
          </div>
        </div>
      </div>
    );
  }

  // If no result yet
  if (!result) {
    return (
      <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-xs border border-slate-200/80 flex flex-col items-center justify-center text-center min-h-[520px]">
        <div className="w-18 h-18 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4 shadow-sm">
          <Award className="w-9 h-9" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">尚未進行評閱</h3>
        <p className="text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
          請在左側設定題目、目標字數與修辭要求，並貼上學生作文或上傳手寫照片，即可一鍵獲得六級分診斷報告與改寫示範！
        </p>
        <button
          onClick={onLoadDemo}
          className="px-6 py-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-sm sm:text-base transition-colors border border-indigo-200 flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <span>立刻載入實測範本體驗</span>
        </button>
      </div>
    );
  }

  const { meta, overall, four_dimensions, rhetoric_diagnosis, interactive_learning, level_6_model_essay } = result;

  // Grade badge color mapping
  const getGradeStyle = (score) => {
    switch (score) {
      case 6:
        return {
          border: 'border-amber-500',
          bg: 'bg-amber-50',
          text: 'text-amber-800',
          badge: 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white',
        };
      case 5:
        return {
          border: 'border-purple-500',
          bg: 'bg-purple-50',
          text: 'text-purple-800',
          badge: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white',
        };
      case 4:
        return {
          border: 'border-blue-500',
          bg: 'bg-blue-50',
          text: 'text-blue-800',
          badge: 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white',
        };
      case 3:
        return {
          border: 'border-teal-500',
          bg: 'bg-teal-50',
          text: 'text-teal-800',
          badge: 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white',
        };
      default:
        return {
          border: 'border-rose-500',
          bg: 'bg-rose-50',
          text: 'text-rose-800',
          badge: 'bg-gradient-to-r from-rose-600 to-red-600 text-white',
        };
    }
  };

  const gradeStyle = getGradeStyle(overall.score);

  const handleCopyModelEssay = () => {
    if (!level_6_model_essay?.model_content) return;
    navigator.clipboard.writeText(level_6_model_essay.model_content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* 總結與評定徽章 Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-slate-200/80">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-5">
            {/* 會考級分印章 Seal Stamp */}
            <div
              className={`w-24 h-24 rounded-2xl border-4 ${gradeStyle.border} ${gradeStyle.bg} flex flex-col items-center justify-center shadow-md rotate-[-2deg] shrink-0 select-none`}
            >
              <span className="text-xs font-bold text-slate-500 tracking-wider">會考評定</span>
              <span className={`text-3xl font-black ${gradeStyle.text}`}>{overall.grade_name || `${overall.score} 級分`}</span>
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{meta.title}</h2>
                <span className={`text-xs sm:text-sm px-3 py-1 rounded-full font-bold ${gradeStyle.badge}`}>
                  {overall.score >= 5 ? '精熟級作答' : overall.score === 4 ? '基礎穩健' : '待加強'}
                </span>
              </div>
              {/* Meta statistics */}
              <div className="flex items-center gap-3 mt-2.5 text-xs sm:text-sm text-slate-600 flex-wrap">
                <span className="bg-slate-100 px-3 py-1 rounded-lg font-semibold">
                  實際字數：<strong className="text-slate-900">{meta.actual_word_count}</strong> 字
                </span>
                <span className="bg-slate-100 px-3 py-1 rounded-lg font-medium">
                  目標：{meta.target_word_count}
                </span>
                <span className="bg-emerald-50 text-emerald-800 px-3 py-1 rounded-lg font-bold border border-emerald-200/80">
                  {meta.word_count_status}
                </span>
              </div>
            </div>
          </div>

          <div className="text-right sm:self-center shrink-0">
            <div className="text-xs text-slate-400 mb-0.5">指定修辭達成率</div>
            <div className="text-3xl font-black text-indigo-600">
              {rhetoric_diagnosis.achievement_rate || `${Math.round((rhetoric_diagnosis.achieved_count / rhetoric_diagnosis.total_target_count) * 100)}%`}
            </div>
            <div className="text-xs text-slate-500 font-medium">
              達成 {rhetoric_diagnosis.achieved_count} / {rhetoric_diagnosis.total_target_count} 項
            </div>
          </div>
        </div>

        {/* 導師總評（100~150字標準短評） */}
        <div className="mt-5 pt-1">
          <div className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <span>閱卷導師綜合短評（100~150 字評定）</span>
          </div>
          <p className="text-base sm:text-lg text-slate-800 leading-relaxed bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80 font-sans shadow-xs">
            {overall.summary_comment}
          </p>
        </div>

        {/* 一鍵下載 PDF 評分報告快捷列 */}
        {onDownloadPdf && (
          <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-gradient-to-r from-indigo-50/70 via-indigo-50/40 to-emerald-50/70 p-4 rounded-2xl border border-indigo-100">
            <div className="flex items-center gap-2.5 text-xs sm:text-sm text-indigo-950 font-medium">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-slate-900">標準 A4 兩頁式寫作診斷報告書</div>
                <div className="text-slate-500 text-xs">內含規準評定、修辭追蹤、錯字診療與六級分原創昇華範文</div>
              </div>
            </div>
            <button
              onClick={onDownloadPdf}
              disabled={isExportingPdf}
              className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all cursor-pointer shadow-md ${
                isExportingPdf
                  ? 'bg-emerald-400 cursor-wait'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:scale-98 shadow-emerald-200'
              }`}
            >
              {isExportingPdf ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                  <span>{pdfProgressMsg || '正在產出 PDF...'}</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 shrink-0" />
                  <span>下載評分報告 (PDF)</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* 導航分頁 Tabs */}
      <div className="flex rounded-2xl bg-slate-200/80 p-1.5 text-sm sm:text-base font-bold text-slate-600 gap-1.5 overflow-x-auto no-print">
        <button
          onClick={() => setActiveTab('model_essay')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'model_essay'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>六級分示範範文</span>
          <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">核心亮點</span>
        </button>

        <button
          onClick={() => setActiveTab('four_dimensions')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'four_dimensions'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'hover:text-slate-900'
          }`}
        >
          <Award className="w-4 h-4 text-indigo-600" />
          <span>四向度深度診斷</span>
        </button>

        <button
          onClick={() => setActiveTab('rhetoric')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'rhetoric'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'hover:text-slate-900'
          }`}
        >
          <Flame className="w-4 h-4 text-rose-500" />
          <span>指定修辭檢測</span>
        </button>

        <button
          onClick={() => setActiveTab('interactive')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'interactive'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'hover:text-slate-900'
          }`}
        >
          <Lightbulb className="w-4 h-4 text-emerald-600" />
          <span>實戰修訂與引導思考</span>
        </button>
      </div>

      {/* Tab 1: 六級分示範範文 */}
      {activeTab === 'model_essay' && level_6_model_essay && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/80 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-xl font-bold text-slate-900">
                  {level_6_model_essay.essay_title || '原創六級分示範範文'}
                </h3>
                <span className="text-xs sm:text-sm px-3 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                  字數約 {level_6_model_essay.word_count} 字
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                本篇嚴格保留學生原本的故事經歷與情節骨架，巧妙補齊缺失之修辭，並將立意深化至六級分標準。
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setCompareMode(!compareMode)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer ${
                  compareMode
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <SplitSquareVertical className="w-4 h-4" />
                <span>{compareMode ? '關閉對照' : '原稿對照'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyModelEssay}
                className="px-4 py-2 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? '已複製全文' : '複製範文'}</span>
              </button>
            </div>
          </div>

          {/* 範文內容區 (支援對照) */}
          {compareMode ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 原稿 */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80">
                <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                  <span>學生原始作文稿件</span>
                  <span className="text-xs font-semibold text-slate-400">{meta.actual_word_count} 字</span>
                </div>
                <div className="text-base text-slate-700 leading-relaxed font-sans whitespace-pre-line max-h-[500px] overflow-y-auto pr-2">
                  {originalContent}
                </div>
              </div>

              {/* 六級分範文 */}
              <div className="bg-gradient-to-b from-amber-50/50 to-white rounded-2xl p-6 border border-amber-200/80 shadow-xs">
                <div className="text-sm font-bold text-amber-800 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    六級分示範昇華版
                  </span>
                  <span className="text-xs font-semibold text-amber-700">{level_6_model_essay.word_count} 字</span>
                </div>
                <div className="text-base text-slate-800 leading-relaxed font-sans whitespace-pre-line max-h-[500px] overflow-y-auto pr-2">
                  {level_6_model_essay.model_content}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-b from-amber-50/40 via-white to-white rounded-2xl p-6 sm:p-8 border border-amber-200/70 shadow-xs">
              <div className="text-base sm:text-lg text-slate-800 leading-loose font-sans whitespace-pre-line">
                {level_6_model_essay.model_content}
              </div>
            </div>
          )}

          {/* 升級解密卡片 */}
          {level_6_model_essay.elevation_highlights?.length > 0 && (
            <div className="pt-2">
              <div className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>晉級六級分關鍵秘笈（升級解密剖析）</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {level_6_model_essay.elevation_highlights.map((h, i) => (
                  <div key={i} className="bg-slate-50 p-4.5 rounded-2xl border border-slate-100 flex flex-col justify-between">
                    <div>
                      <span className="inline-block text-xs font-bold px-2.5 py-1 rounded-md bg-indigo-100 text-indigo-800 mb-2">
                        {h.aspect}
                      </span>
                      <p className="text-sm text-slate-700 leading-relaxed font-normal">
                        {h.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: 四向度深度診斷 */}
      {activeTab === 'four_dimensions' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 立意取材 */}
            <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-3.5 pb-2.5 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-sm">
                    一
                  </div>
                  <h4 className="font-bold text-base text-slate-900">立意取材</h4>
                </div>
                <div className="space-y-3.5 text-sm">
                  <div>
                    <span className="font-bold text-emerald-700 flex items-center gap-1.5 mb-1.5">
                      <Sparkles className="w-4 h-4" /> 表現亮點
                    </span>
                    <p className="text-slate-700 leading-relaxed bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                      {four_dimensions.theme_and_materials.highlights}
                    </p>
                  </div>
                  <div>
                    <span className="font-bold text-indigo-700 flex items-center gap-1.5 mb-1.5">
                      <Lightbulb className="w-4 h-4" /> 深度建議
                    </span>
                    <p className="text-slate-700 leading-relaxed bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
                      {four_dimensions.theme_and_materials.suggestions}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 結構組織 */}
            <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-3.5 pb-2.5 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-sm">
                    二
                  </div>
                  <h4 className="font-bold text-base text-slate-900">結構組織</h4>
                </div>
                <div className="space-y-3.5 text-sm">
                  <div>
                    <span className="font-bold text-emerald-700 flex items-center gap-1.5 mb-1.5">
                      <Sparkles className="w-4 h-4" /> 表現亮點
                    </span>
                    <p className="text-slate-700 leading-relaxed bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                      {four_dimensions.structure_and_organization.highlights}
                    </p>
                  </div>
                  <div>
                    <span className="font-bold text-indigo-700 flex items-center gap-1.5 mb-1.5">
                      <Lightbulb className="w-4 h-4" /> 深度建議
                    </span>
                    <p className="text-slate-700 leading-relaxed bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
                      {four_dimensions.structure_and_organization.suggestions}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 遣詞造句 */}
            <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-3.5 pb-2.5 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-sm">
                    三
                  </div>
                  <h4 className="font-bold text-base text-slate-900">遣詞造句</h4>
                </div>
                <div className="space-y-3.5 text-sm">
                  <div>
                    <span className="font-bold text-emerald-700 flex items-center gap-1.5 mb-1.5">
                      <Sparkles className="w-4 h-4" /> 表現亮點
                    </span>
                    <p className="text-slate-700 leading-relaxed bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                      {four_dimensions.vocabulary_and_sentences.highlights}
                    </p>
                  </div>
                  <div>
                    <span className="font-bold text-indigo-700 flex items-center gap-1.5 mb-1.5">
                      <Lightbulb className="w-4 h-4" /> 深度建議
                    </span>
                    <p className="text-slate-700 leading-relaxed bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
                      {four_dimensions.vocabulary_and_sentences.suggestions}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 第四向度：錯別字與標點診療室 */}
          <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-xs border border-slate-200/80">
            <div className="flex items-center gap-3 mb-4 pb-2.5 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold text-sm">
                四
              </div>
              <div>
                <h4 className="font-bold text-base text-slate-900">錯別字與標點診療室</h4>
                <p className="text-sm text-slate-500 mt-0.5">
                  {four_dimensions.orthography_and_punctuation.punctuation_comment}
                </p>
              </div>
            </div>

            {four_dimensions.orthography_and_punctuation.typo_corrections?.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {four_dimensions.orthography_and_punctuation.typo_corrections.map((typo, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 flex items-start gap-3.5"
                  >
                    <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      !
                    </div>
                    <div className="text-sm">
                      <div className="flex items-center gap-2.5 font-bold mb-1">
                        <span className="line-through text-rose-600">{typo.original}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          {typo.correction}
                        </span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">{typo.explanation}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-sm flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="font-medium">恭喜！全文未發現明顯錯別字或重大格式瑕疵，字形書寫精確。</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: 指定修辭達成追蹤 */}
      {activeTab === 'rhetoric' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/80 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-900">指定修辭技巧達成清單</h3>
              <p className="text-sm text-slate-500 mt-0.5">
                比對老師所指定的修辭項目，驗證學生是否實際運用於作文情境中。
              </p>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-indigo-700 bg-indigo-50 px-3.5 py-1 rounded-full border border-indigo-200">
                達成率 {rhetoric_diagnosis.achievement_rate}
              </span>
            </div>
          </div>

          <div className="space-y-3.5">
            {rhetoric_diagnosis.details?.map((item, idx) => (
              <div
                key={idx}
                className={`p-5 rounded-2xl border transition-all ${
                  item.detected
                    ? 'bg-emerald-50/40 border-emerald-200'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2.5">
                    {item.detected ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-slate-400" />
                    )}
                    <h4 className="font-bold text-base text-slate-900">{item.name}</h4>
                  </div>
                  <span
                    className={`text-xs sm:text-sm px-3 py-0.5 rounded-full font-bold ${
                      item.detected
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {item.detected ? '已達成' : '未發現使用'}
                  </span>
                </div>

                {item.detected && item.sample_sentence && (
                  <div className="mb-2.5 p-3 rounded-xl bg-white border border-emerald-200/70 text-sm text-slate-800 font-sans leading-relaxed">
                    <strong className="text-emerald-700 mr-2">【原文摘錄】</strong>
                    {item.sample_sentence}
                  </div>
                )}

                <p className="text-sm text-slate-700 leading-relaxed">
                  <strong className="text-slate-800 mr-1.5">評語建議：</strong>
                  {item.evaluation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: 實戰修訂與引導思考 */}
      {activeTab === 'interactive' && interactive_learning && (
        <div className="space-y-5">
          {/* 句子升級魔法 */}
          {interactive_learning.sentence_upgrade && (
            <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-xs border border-slate-200/80">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h4 className="font-bold text-base sm:text-lg text-slate-900">✍️ 句子升級魔法（修辭潤飾示範）</h4>
              </div>
              <p className="text-sm text-slate-500 mb-4">
                挑選原文中具有潛力的句子，示範如何藉由更具張力的遣詞與修辭使其更生動：
              </p>

              <div className="space-y-3.5 text-sm">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70">
                  <span className="font-bold text-slate-500 block mb-1">【原句】</span>
                  <p className="text-base text-slate-700 leading-relaxed font-sans">{interactive_learning.sentence_upgrade.original}</p>
                </div>

                <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-5 rounded-xl border border-amber-200">
                  <span className="font-bold text-amber-800 block mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    【六級分升級範例】
                  </span>
                  <p className="text-slate-900 font-medium leading-relaxed font-sans text-base sm:text-lg">
                    {interactive_learning.sentence_upgrade.upgraded}
                  </p>
                  <p className="text-sm text-amber-900/80 mt-2.5 pt-2.5 border-t border-amber-200/70">
                    💡 <strong>升級要點：</strong>{interactive_learning.sentence_upgrade.upgrade_tip}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 深度思考題 */}
          {interactive_learning.reflection_questions?.length > 0 && (
            <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-xs border border-slate-200/80">
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="w-5 h-5 text-indigo-600" />
                <h4 className="font-bold text-base sm:text-lg text-slate-900">🤔 深度思考題（引導再寫一次）</h4>
              </div>
              <div className="space-y-3">
                {interactive_learning.reflection_questions.map((q, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm text-slate-800 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0 text-xs mt-0.5">
                      {i + 1}
                    </span>
                    <p className="leading-relaxed font-medium">{q}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 導師期勉 */}
          {interactive_learning.teacher_encouragement && (
            <div className="bg-gradient-to-r from-indigo-500 via-indigo-600 to-amber-500 text-white rounded-2xl p-6 sm:p-7 shadow-md shadow-indigo-100">
              <h4 className="font-bold text-base mb-2 flex items-center gap-2">
                <span>💌 導師的溫暖期勉</span>
              </h4>
              <p className="text-base sm:text-lg leading-relaxed text-indigo-50 font-sans font-medium">
                {interactive_learning.teacher_encouragement}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
