import React, { useState } from 'react';
import { X, Key, ExternalLink, Check, AlertCircle } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose, apiKey, setApiKey, model, setModel }) {
  if (!isOpen) return null;

  const [inputKey, setInputKey] = useState(apiKey || '');
  const [selectedModel, setSelectedModel] = useState(model || 'gemini-2.5-flash');
  const [testingStatus, setTestingStatus] = useState(null); // null | 'testing' | 'success' | 'error'
  const [testMessage, setTestMessage] = useState('');

  const handleSave = () => {
    setApiKey(inputKey.trim());
    setModel(selectedModel);
    localStorage.setItem('GEMINI_API_KEY', inputKey.trim());
    localStorage.setItem('GEMINI_MODEL', selectedModel);
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
            <Key className="w-5 h-5 text-indigo-600" />
            <span>AI 模型與 API Key 設定</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-7 space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">
              Google Gemini API Key
            </label>
            <input
              type="password"
              value={inputKey}
              onChange={(e) => {
                setInputKey(e.target.value);
                setTestingStatus(null);
              }}
              placeholder="AIzaSy..."
              className="w-full px-4 py-3 text-base rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono transition-all"
            />
            <p className="mt-2 text-sm text-slate-500 flex items-center gap-1.5">
              <span>尚無 Key？可在</span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 hover:underline inline-flex items-center gap-0.5 font-semibold"
              >
                Google AI Studio
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <span>免費申請（無須綁定信用卡）。</span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">
              AI 模型選擇
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full px-4 py-3 text-base rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white text-slate-800 font-medium"
            >
              <option value="gemini-2.5-flash">Gemini 2.5 Flash（推薦，速度最快且繁體中文理解極佳）</option>
              <option value="gemini-1.5-flash">Gemini 1.5 Flash（穩定高效）</option>
              <option value="gemini-2.0-flash">Gemini 2.0 Flash（新一代多模態）</option>
            </select>
          </div>

          {testingStatus && (
            <div
              className={`p-3.5 rounded-xl text-sm flex items-start gap-2.5 ${
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

          <div className="pt-3 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={handleTestKey}
              disabled={testingStatus === 'testing'}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-bold px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer"
            >
              測試連線
            </button>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4.5 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors font-semibold cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs shadow-indigo-200 transition-colors font-bold cursor-pointer"
              >
                儲存設定
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
