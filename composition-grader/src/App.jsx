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

export default function App() {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gemini-2.5-flash');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [hasServerKey, setHasServerKey] = useState(false);

  // Input states
  const [title, setTitle] = useState(SAMPLE_ESSAY_BASKETBALL.title);
  const [promptGuide, setPromptGuide] = useState(SAMPLE_ESSAY_BASKETBALL.promptGuide);
  const [targetPreset, setTargetPreset] = useState(SAMPLE_ESSAY_BASKETBALL.presetId);
  const [customWordCount, setCustomWordCount] = useState(SAMPLE_ESSAY_BASKETBALL.targetWordCount);
  const [selectedRhetorics, setSelectedRhetorics] = useState(SAMPLE_ESSAY_BASKETBALL.selectedRhetorics);
  const [content, setContent] = useState(SAMPLE_ESSAY_BASKETBALL.content);
  const [imageFile, setImageFile] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);

  // Evaluation states
  const [result, setResult] = useState(SAMPLE_ESSAY_BASKETBALL.mockResult);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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
    });
  }, []);

  const handleLoadDemo = () => {
    setTitle(SAMPLE_ESSAY_BASKETBALL.title);
    setPromptGuide(SAMPLE_ESSAY_BASKETBALL.promptGuide);
    setTargetPreset(SAMPLE_ESSAY_BASKETBALL.presetId);
    setCustomWordCount(SAMPLE_ESSAY_BASKETBALL.targetWordCount);
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
        selectedRhetorics,
        content,
        imageBase64,
        imageMimeType: imageFile?.type || 'image/jpeg',
      });

      setResult(evaluationResult);

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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-800 text-slate-800">
      {/* Top Header */}
      <Header
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLoadDemo={handleLoadDemo}
        onPrint={handlePrint}
        hasResult={Boolean(result)}
        apiKey={apiKey}
        hasServerKey={hasServerKey}
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
              originalContent={content}
              isLoading={isLoading}
              onLoadDemo={handleLoadDemo}
            />
          </div>
        </div>
      </main>

      {/* Printable Report Component (hidden in web view, rendered when printing) */}
      <PrintReport result={result} originalContent={content} />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-6 text-center text-sm text-slate-500 no-print mt-auto">
        <div className="max-w-7xl mx-auto px-4">
          <p className="font-semibold text-slate-700 mb-1">
            國中教育會考六級分作文 AI 診斷室 · 專為中小學師生打造之語文教學與自學鷹架平台
          </p>
          <p className="text-xs text-slate-400">
            具備四向度規準評定 · 修辭技巧檢驗 · 錯別字診療 · 原汁原味六級分示範昇華
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
