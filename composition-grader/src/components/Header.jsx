import React from 'react';
import { Sparkles, Settings, FileText, Download, BookOpen, ShieldCheck, UserCheck } from 'lucide-react';

export default function Header({
  onOpenSettings,
  onLoadDemo,
  onDownloadPdf,
  isExportingPdf,
  pdfProgressMsg,
  hasResult,
  apiKey,
  hasServerKey,
}) {
  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 shadow-xs no-print">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 min-h-[76px] flex items-center justify-between gap-3">
        {/* Brand Group */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-amber-500 flex items-center justify-center text-white shadow-md shadow-indigo-100 shrink-0">
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            {/* Title & Badges */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h1 className="text-base sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                朕的會考六級分作文AI診斷室
              </h1>
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[11px] sm:text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200/80 flex items-center gap-1 shrink-0">
                  <UserCheck className="w-3 h-3 text-indigo-600" />
                  偉朕老師 製作
                </span>
                {hasServerKey && (
                  <span className="text-[11px] sm:text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1 border border-emerald-200 shrink-0">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    內建 AI · 學生免 Key
                  </span>
                )}
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 hidden sm:block mt-0.5">
              臺灣會考規準評估 · 四向度深度診斷 · 修辭達成追蹤 · 偉朕老師研發設計
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <button
            onClick={onLoadDemo}
            className="flex items-center gap-1 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-base font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer border border-indigo-200/70"
            title="載入《校園中的一角》實測範例文章"
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600" />
            <span className="hidden sm:inline">體驗示範資料</span>
            <span className="sm:hidden font-bold">示範</span>
          </button>

          {hasResult && (
            <button
              onClick={onDownloadPdf}
              disabled={isExportingPdf}
              className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-base font-bold text-white transition-all cursor-pointer shadow-xs ${
                isExportingPdf
                  ? 'bg-emerald-400 cursor-wait'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:scale-98'
              }`}
              title="直接產出並下載為標準 A4 兩頁式 PDF 診斷報告書"
            >
              {isExportingPdf ? (
                <>
                  <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                  <span className="hidden sm:inline">{pdfProgressMsg || '正在產出 PDF...'}</span>
                  <span className="sm:hidden">產製中</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span className="hidden sm:inline">下載 PDF 報告</span>
                  <span className="sm:hidden">下載 PDF</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={onOpenSettings}
            className={`flex items-center gap-1 p-2 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-base font-semibold border transition-colors cursor-pointer ${
              hasServerKey || apiKey
                ? 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 animate-pulse'
            }`}
            title="AI 模型與自訂金鑰設定"
          >
            <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">{hasServerKey ? '伺服器設定' : apiKey ? '自訂 Key' : '設定 Key'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
