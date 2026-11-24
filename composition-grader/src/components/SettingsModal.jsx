import React, { useState } from 'react';
import { X, Key, ExternalLink, Check, AlertCircle, ShieldCheck, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose, apiKey, setApiKey, model, setModel, hasServerKey }) {
  if (!isOpen) return null;
  return (
    <SettingsModalForm
      onClose={onClose}
      apiKey={apiKey}
      setApiKey={setApiKey}
      model={model}
      setModel={setModel}
      hasServerKey={hasServerKey}
    />
  );
}

function SettingsModalForm({ onClose, apiKey, setApiKey, model, setModel, hasServerKey }) {
  const [inputKey, setInputKey] = useState(apiKey || '');
  const [selectedModel, setSelectedModel] = useState(model || 'gemini-flash-lite-latest');
  const [showCustomKey, setShowCustomKey] = useState(() => Boolean(!hasServerKey || apiKey));
  const [testingStatus, setTestingStatus] = useState(null); // null | 'testing' | 'success' | 'error'
  const [testMessage, setTestMessage] = useState('');

  const handleSave = (e) => {
    if (e) e.preventDefault();
    const trimmedKey = inputKey.trim();
    setApiKey(trimmedKey);
    setModel(selectedModel);
    try {
      localStorage.setItem('GEMINI_API_KEY', trimmedKey);
      localStorage.setItem('GEMINI_MODEL', selectedModel);
    } catch {
      // Ignore storage errors
    }
    onClose();
  };

  const handleTestKey = async () => {
    if (!inputKey.trim()) {
      setTestingStatus('error');
      setTestMessage('請先填寫 API Key');
      return;
    }
    setTestingStatus('testing');
    setTestMessage('連線測試中...');
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${inputKey.trim()}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: '請回覆「連線成功」四個字' }] }],
          }),
        }
      );
      if (res.ok) {
        setTestingStatus('success');
        setTestMessage('API Key 連線成功！可正常使用。');
      } else {
        const data = await res.json().catch(() => ({}));
        setTestingStatus('error');
        setTestMessage(data?.error?.message || `連線失敗 (HTTP ${res.status})`);
      }
    } catch (err) {
      setTestingStatus('error');
      setTestMessage(`網路連線異常: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2.5 text-slate-900 font-bold text-base sm:text-lg">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <span>AI 模型與進階設定</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="p-6 sm:p-7 space-y-5">
          {/* Server Key Status Banner */}
          {hasServerKey ? (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-sm text-emerald-950 leading-relaxed">
                <strong className="font-bold block text-emerald-800 mb-0.5">
                  已啟用雲端「免 Key」模式
                </strong>
                系統伺服器已內建好 AI 金鑰，一般老師與全班學生
                <strong className="font-bold underline decoration-emerald-400">無須填寫任何 API Key</strong>
                ，關閉此視窗即可直接使用。
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-950 leading-relaxed">
                <strong className="font-bold block text-amber-800 mb-0.5">
                  未偵測到伺服器內建金鑰
                </strong>
                目前為純靜態或尚未設定後端金鑰之環境，請於下方輸入您的 Google Gemini API Key 以啟用評閱功能。
              </div>
            </div>
          )}

          {/* Model Selection */}
          <div>
            <label htmlFor="gemini-model-select" className="block text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">
              AI 評閱模型選擇
            </label>
            <select
              id="gemini-model-select"
              name="geminiModel"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full px-4 py-3 text-base rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white text-slate-800 font-medium"
            >
              <option value="gemini-flash-lite-latest">Gemini Flash Lite（推薦，文字評改速度最快）</option>
              <option value="gemini-3.5-flash">Gemini 3.5 Flash（均衡高效且穩定）</option>
              <option value="gemini-3.6-flash">Gemini 3.6 Flash（進階推論與文采）</option>
              <option value="gemini-3.8-flash">Gemini 3.8 Flash（手寫照片 OCR 與深度辨析首選）</option>
            </select>
            <p className="mt-1.5 text-xs text-slate-500">
              註：上傳「手寫稿紙照片」時，系統會自動優先調用高敏度視覺模型進行繁體筆畫辨識。
            </p>
          </div>

          {/* Collapsible Optional Custom API Key Section */}
          <div className="border border-slate-200/90 rounded-2xl overflow-hidden bg-slate-50/50">
            <button
              type="button"
              onClick={() => setShowCustomKey(!showCustomKey)}
              className="w-full px-4 py-3 flex items-center justify-between text-left text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-100/70 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Key className="w-4 h-4 text-slate-500" />
                <span>
                  進階備援：自訂個人 API Key
                  {hasServerKey && !inputKey && (
                    <span className="ml-1.5 text-[11px] font-medium text-slate-400">（選填，免 Key 正常時免填）</span>
                  )}
                </span>
              </span>
              {showCustomKey ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {showCustomKey && (
              <div className="p-4 pt-2 border-t border-slate-200/80 space-y-3 bg-white">
                <p className="text-xs text-slate-500 leading-relaxed">
                  若全校多人同時使用導致共用額度滿載，老師可填入自己的免費 Gemini Key 作為個人獨立備援通道（僅儲存於您的瀏覽器本機）。
                </p>
                <div>
                  <label htmlFor="gemini-api-key" className="block text-xs font-bold text-slate-700 mb-1.5">
                    Google Gemini API Key
                  </label>
                  <input
                    id="gemini-api-key"
                    name="geminiApiKey"
                    type="password"
                    autoComplete="off"
                    value={inputKey}
                    onChange={(e) => {
                      setInputKey(e.target.value);
                      setTestingStatus(null);
                    }}
                    placeholder="AIzaSy...（留空則使用伺服器免 Key 模式）"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono transition-all"
                  />
                  <div className="mt-2 flex items-center justify-between flex-wrap gap-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <span>申請方式：</span>
                      <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 hover:underline inline-flex items-center gap-0.5 font-semibold"
                      >
                        Google AI Studio
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <span>免費取得</span>
                    </span>
                    <div className="flex items-center gap-2">
                      {inputKey && (
                        <button
                          type="button"
                          onClick={() => {
                            setInputKey('');
                            setTestingStatus(null);
                          }}
                          className="text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                        >
                          清除恢復免 Key
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleTestKey}
                        disabled={testingStatus === 'testing' || !inputKey.trim()}
                        className="text-indigo-600 hover:text-indigo-800 disabled:text-slate-300 font-bold cursor-pointer"
                      >
                        測試個人 Key
                      </button>
                    </div>
                  </div>
                </div>

                {testingStatus && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                      testingStatus === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : testingStatus === 'error'
                        ? 'bg-rose-50 text-rose-800 border border-rose-200'
                        : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                    }`}
                  >
                    {testingStatus === 'success' ? (
                      <Check className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                    ) : testingStatus === 'error' ? (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                    ) : (
                      <div className="w-4 h-4 shrink-0 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mt-0.5" />
                    )}
                    <span className="leading-relaxed font-medium">{testMessage}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4.5 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors font-semibold cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs shadow-indigo-200 transition-colors font-bold cursor-pointer"
            >
              儲存設定
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
