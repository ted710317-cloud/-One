import React from 'react';
import { Sparkles, Settings, FileText, Download, BookOpen, ShieldCheck } from 'lucide-react';

export default function Header({
  onOpenSettings,
  onLoadDemo,
  onPrint,
  hasResult,
  apiKey,
  hasServerKey,
}) {
  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 shadow-xs no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-amber-500 flex items-center justify-center text-white shadow-md shadow-indigo-100">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">會考六級分作文 AI 診斷室</h1>
              {hasServerKey ? (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1 border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  內建 AI 已就緒 · 學生免 Key
                </span>
              ) : (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
                  教育專用版
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 hidden sm:block mt-0.5">
              臺灣會考規準評估 · 四向度深度診斷 · 修辭達成追蹤 · 原創六級分示範昇華
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            onClick={onLoadDemo}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm sm:text-base font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer border border-indigo-200/70"
            title="載入《校園中的一角》實測範例文章"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span className="hidden sm:inline">體驗示範資料</span>
            <span className="sm:hidden">示範</span>
          </button>

          {hasResult && (
            <button
              onClick={onPrint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm sm:text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shadow-xs"
              title="下載評分報告（格式化為標準 A4 兩頁式 PDF 報告書）"
            >
              <Download className="w-4 h-4" />
              <span>下載評分報告</span>
            </button>
          )}

          <button
            onClick={onOpenSettings}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm sm:text-base font-semibold border transition-colors cursor-pointer ${
              hasServerKey || apiKey
                ? 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 animate-pulse'
            }`}
            title="AI 模型與自訂金鑰設定"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">{hasServerKey ? '伺服器設定' : apiKey ? '自訂 Key' : '設定 Key'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
