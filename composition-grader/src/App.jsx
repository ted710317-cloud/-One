import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { AlertCircle, X, ShieldCheck } from 'lucide-react';
import Header from './components/Header';
import SettingsModal from './components/SettingsModal';
import InputSection from './components/InputSection';
import ReportSection from './components/ReportSection';
import PrintReport from './components/PrintReport';
import { SAMPLE_ESSAY_BASKETBALL } from './constants/presets';
import { gradeEssay, checkServerStatus } from './services/gemini';
import { exportReportToPdf } from './utils/pdfExport';

export default function App() {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gemini-flash-lite-latest');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [hasServerKey, setHasServerKey] = useState(false);

  // Input states: 預設為乾淨空白，方便使用者直接貼上文章，無須先手動刪除範例文字
  const [title, setTitle] = useState('');
  const [promptGuide, setPromptGuide] = useState('');
  const [targetPreset, setTargetPreset] = useState('primary-high');
  const [customWordCount, setCustomWordCount] = useState('400~550字');
  const [selectedGenre, setSelectedGenre] = useState(''); // 文體限定：預設不勾選（不限文體），老師有需要時再自由點選
  const [selectedRhetorics, setSelectedRhetorics] = useState([]); // 預設清除所有勾選，老師有需要時再自由勾選
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);

  // Evaluation states: 預設為 null，右側顯示指引狀態
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // PDF Export states: 控制直接下載 PDF 的載入狀態
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfProgressMsg, setPdfProgressMsg] = useState('');

  // Usage count state: 記錄系統累計評閱人次（學生貼上作文評改即加 1）
  const [usageCount, setUsageCount] = useState(18);

  // Load API key from localStorage and check backend status on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('GEMINI_API_KEY');
    if (savedKey) setApiKey(savedKey);
    const savedModel = localStorage.getItem('GEMINI_MODEL');
    if (savedModel) setModel(savedModel);

    // Check server status
    checkServerStatus().then((status) => {
      setHasServerKey(Boolean(status?.hasServerKey));
      if (status?.model) setModel(status.model);
      if (status?.usageCount) setUsageCount(status.usageCount);
    });
  }, []);

  // 點擊「體驗示範資料」時才載入範例文章
  const handleLoadDemo = () => {
    setTitle(SAMPLE_ESSAY_BASKETBALL.title);
    setPromptGuide(SAMPLE_ESSAY_BASKETBALL.promptGuide);
    setTargetPreset(SAMPLE_ESSAY_BASKETBALL.presetId);
    setCustomWordCount(SAMPLE_ESSAY_BASKETBALL.targetWordCount);
    setSelectedGenre('記敘文');
    setSelectedRhetorics(SAMPLE_ESSAY_BASKETBALL.selectedRhetorics);
    setContent(SAMPLE_ESSAY_BASKETBALL.content);
    setImageFile(null);
    setImageBase64(null);
    setResult(SAMPLE_ESSAY_BASKETBALL.mockResult);
    setErrorMessage('');

    // Trigger celebratory confetti for demonstration!
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
    });
  };

  const handleGrade = async () => {
    if (!content.trim() && !imageBase64) {
      setErrorMessage('請先輸入學生作文內容或上傳作文照片。');
      return;
    }

    // If neither server key nor local client key exists, prompt settings modal
    if (!hasServerKey && !apiKey) {
      setIsSettingsOpen(true);
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const evaluationResult = await gradeEssay({
        apiKey,
        model,
        title,
        promptGuide,
        targetWordCount: customWordCount,
        genre: selectedGenre,
        selectedRhetorics,
        content,
        imageBase64,
        imageMimeType: imageFile?.type || 'image/jpeg',
      });

      setResult(evaluationResult);

      // 評閱成功：使用人次加 1
      if (evaluationResult?.usageCount) {
        setUsageCount(evaluationResult.usageCount);
      } else {
        setUsageCount((prev) => prev + 1);
      }

      // Celebrate high scores!
      if (evaluationResult?.overall?.score >= 5) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.5 },
        });
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || '評改過程發生未預期的錯誤，請重試。');
    } finally {
      setIsLoading(false);
    }
  };

  // 一鍵直接產出並下載 .pdf 檔案
  const handleDownloadPdf = async () => {
    if (isExportingPdf || !result) return;
    setIsExportingPdf(true);
    setPdfProgressMsg('準備繪製報告...');

    try {
      const reportTitle = title || result?.meta?.title || '作文診斷報告書';
      await exportReportToPdf(reportTitle, (msg) => setPdfProgressMsg(msg));
    } catch (err) {
      console.error('下載 PDF 失敗:', err);
      // 若有異常，呼叫原生列印作為備援
      window.print();
    } finally {
      setIsExportingPdf(false);
      setPdfProgressMsg('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-800 text-slate-800">
      {/* Top Header */}
      <Header
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLoadDemo={handleLoadDemo}
        onDownloadPdf={handleDownloadPdf}
        isExportingPdf={isExportingPdf}
        pdfProgressMsg={pdfProgressMsg}
        hasResult={Boolean(result)}
        apiKey={apiKey}
        hasServerKey={hasServerKey}
        usageCount={usageCount}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 no-print">
        {/* Error Notification Alert */}
        {errorMessage && (
          <div className="mb-6 p-4.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm sm:text-base flex items-start justify-between gap-3.5 animate-in fade-in shadow-xs">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong className="font-bold">評閱提示：</strong> {errorMessage}
              </div>
            </div>
            <button
              onClick={() => setErrorMessage('')}
              className="text-rose-400 hover:text-rose-600 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Two-column layout: Left = Inputs & Settings, Right = Diagnostics & Model Essay */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* Left Column: Settings and Input (5 cols on lg) */}
          <div className="lg:col-span-5 sticky lg:top-24">
            <InputSection
              title={title}
              setTitle={setTitle}
              promptGuide={promptGuide}
              setPromptGuide={setPromptGuide}
              targetPreset={targetPreset}
              setTargetPreset={setTargetPreset}
              customWordCount={customWordCount}
              setCustomWordCount={setCustomWordCount}
              selectedGenre={selectedGenre}
              setSelectedGenre={setSelectedGenre}
              selectedRhetorics={selectedRhetorics}
              setSelectedRhetorics={setSelectedRhetorics}
              content={content}
              setContent={setContent}
              imageFile={imageFile}
              setImageFile={setImageFile}
              imageBase64={imageBase64}
              setImageBase64={setImageBase64}
              onGrade={handleGrade}
              isLoading={isLoading}
              onLoadDemo={handleLoadDemo}
            />
          </div>

          {/* Right Column: Diagnostic Report & Model Essay (7 cols on lg) */}
          <div className="lg:col-span-7">
            <ReportSection
              result={result}
              originalContent={content || result?.meta?.ocr_transcript || ''}
              isLoading={isLoading}
              onLoadDemo={handleLoadDemo}
              onDownloadPdf={handleDownloadPdf}
              isExportingPdf={isExportingPdf}
              pdfProgressMsg={pdfProgressMsg}
            />
          </div>
        </div>
      </main>

      {/* Printable Report Component (hidden in web view, rendered when exporting PDF) */}
      <PrintReport result={result} originalContent={content || result?.meta?.ocr_transcript || ''} />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-7 text-center text-sm text-slate-500 no-print mt-auto">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="font-bold text-slate-800 text-base">
              朕的會考六級分作文AI診斷室
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
              系統設計與研發：偉朕老師
            </span>
          </div>
          <p className="text-sm text-slate-600">
            專為中小學師生打造之語文教學與自學鷹架平台 · 具備四向度規準評定 · 修辭技巧檢驗 · 錯別字診療 · 原汁原味六級分示範昇華
          </p>
          <p className="text-xs text-slate-400 pt-0.5">
            © 偉朕老師 研發製作 · 歡迎教學推廣與課堂應用
          </p>
        </div>
      </footer>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKey={apiKey}
        setApiKey={setApiKey}
        model={model}
        setModel={setModel}
      />
    </div>
  );
}
