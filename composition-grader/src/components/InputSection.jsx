import React, { useState } from 'react';
import {
  PenTool,
  Sliders,
  Type,
  Camera,
  FileText,
  Sparkles,
  RotateCcw,
  Upload,
  X,
  CheckSquare,
  Square
} from 'lucide-react';
import { AVAILABLE_RHETORICS, WORD_COUNT_PRESETS } from '../constants/presets';

export default function InputSection({
  title,
  setTitle,
  promptGuide,
  setPromptGuide,
  targetPreset,
  setTargetPreset,
  customWordCount,
  setCustomWordCount,
  selectedRhetorics,
  setSelectedRhetorics,
  content,
  setContent,
  imageFile,
  setImageFile,
  imageBase64,
  setImageBase64,
  onGrade,
  isLoading,
  onLoadDemo,
}) {
  const [inputMode, setInputMode] = useState('text'); // 'text' | 'image'
  const [showGuideInput, setShowGuideInput] = useState(false);

  // Calculate live word count (excluding whitespace)
  const currentWordCount = content.replace(/\s+/g, '').length;

  const toggleRhetoric = (rhetoricId) => {
    if (selectedRhetorics.includes(rhetoricId)) {
      setSelectedRhetorics(selectedRhetorics.filter((r) => r !== rhetoricId));
    } else {
      setSelectedRhetorics([...selectedRhetorics, rhetoricId]);
    }
  };

  const selectCommonRhetorics = () => {
    setSelectedRhetorics(['譬喻', '摹寫', '引用', '設問']);
  };

  const clearAllRhetorics = () => {
    setSelectedRhetorics([]);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      // Get base64 string without data prefix
      const base64 = reader.result.split(',')[1];
      setImageBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImageBase64(null);
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-slate-200/80 space-y-6">
      {/* Step 1: 題目與引導 */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <label className="flex items-center gap-2.5 text-base sm:text-lg font-bold text-slate-800">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">1</span>
            作文題目與寫作引導
          </label>
          <button
            type="button"
            onClick={() => setShowGuideInput(!showGuideInput)}
            className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
          >
            {showGuideInput ? '收起引導說明' : '+ 加入寫作引導說明'}
          </button>
        </div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例如：校園中的一角、那一次，我真有成就感"
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-slate-900 transition-all text-base"
        />

        {showGuideInput && (
          <div className="mt-2.5 animate-in fade-in duration-150">
            <textarea
              value={promptGuide}
              onChange={(e) => setPromptGuide(e.target.value)}
              placeholder="老師的出題引導（例如：請融入五感觀察校園角落，寫出對該角落的記憶與深層情感...）"
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm text-slate-700 transition-all resize-none leading-relaxed"
            />
          </div>
        )}
      </div>

      {/* Step 2: 目標字數 */}
      <div>
        <label className="flex items-center gap-2.5 text-base sm:text-lg font-bold text-slate-800 mb-2.5">
          <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">2</span>
          目標字數設定
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {WORD_COUNT_PRESETS.map((p) => {
            const isSelected = targetPreset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setTargetPreset(p.id);
                  setCustomWordCount(p.range);
                }}
                className={`px-3.5 py-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-xs ring-1 ring-indigo-500/30'
                    : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="text-sm font-bold text-slate-900">{p.label}</div>
                <div className="text-xs text-slate-500 mt-0.5">{p.range}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 3: 指定修辭要求 */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <label className="flex items-center gap-2.5 text-base sm:text-lg font-bold text-slate-800">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">3</span>
            指定必備修辭（{selectedRhetorics.length > 0 ? `已選 ${selectedRhetorics.length} 項` : '選填'}）
          </label>
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <button
              type="button"
              onClick={selectCommonRhetorics}
              className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
            >
              常用四項
            </button>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={clearAllRhetorics}
              className="text-slate-500 hover:text-slate-700 cursor-pointer"
            >
              清空
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {AVAILABLE_RHETORICS.map((r) => {
            const isChecked = selectedRhetorics.includes(r.id);
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => toggleRhetoric(r.id)}
                className={`px-3.5 py-2 rounded-xl text-sm font-semibold border transition-all flex items-center gap-2 cursor-pointer ${
                  isChecked
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs scale-102'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                }`}
                title={r.desc}
              >
                {isChecked ? (
                  <CheckSquare className="w-4 h-4" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
                <span>{r.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 4: 作文輸入區 */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <label className="flex items-center gap-2.5 text-base sm:text-lg font-bold text-slate-800">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">4</span>
            作文內容輸入
          </label>
          <div className="flex rounded-xl bg-slate-100 p-1 text-xs sm:text-sm font-medium">
            <button
              type="button"
              onClick={() => setInputMode('text')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer font-semibold ${
                inputMode === 'text'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Type className="w-4 h-4" />
              <span>文字貼上</span>
            </button>
            <button
              type="button"
              onClick={() => setInputMode('image')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer font-semibold ${
                inputMode === 'image'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>手寫拍照上傳</span>
            </button>
          </div>
        </div>

        {inputMode === 'text' ? (
          <div className="relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="請將學生作文貼在此處，段落前空兩格佳..."
              rows={12}
              className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-base sm:text-lg text-slate-800 leading-relaxed font-sans transition-all resize-y"
            />
            <div className="flex items-center justify-between mt-2 px-1 text-sm text-slate-600">
              <span className="font-semibold">
                當前字數：<strong className={currentWordCount > 0 ? 'text-indigo-600 text-base' : ''}>{currentWordCount}</strong> 字
              </span>
              {content && (
                <button
                  type="button"
                  onClick={() => setContent('')}
                  className="text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors cursor-pointer text-xs sm:text-sm"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>清空內容</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {!imageBase64 ? (
              <label className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/40 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-indigo-50/70 group">
                <div className="w-14 h-14 rounded-full bg-white shadow-xs flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform mb-3">
                  <Upload className="w-7 h-7" />
                </div>
                <p className="text-base font-bold text-slate-800 mb-1">點擊上傳或將學生作文照片拖曳至此</p>
                <p className="text-sm text-slate-500">支援 JPG、PNG 格式之手寫稿紙清晰照片</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 group bg-slate-900">
                <img
                  src={`data:image/jpeg;base64,${imageBase64}`}
                  alt="學生作文原稿照片"
                  className="w-full max-h-80 object-contain bg-slate-950"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-3 right-3 p-2 bg-slate-900/80 hover:bg-rose-600 text-white rounded-full transition-colors cursor-pointer shadow-md"
                  title="移除照片"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-2 left-3 text-sm bg-slate-900/80 text-white px-3 py-1 rounded-md backdrop-blur-xs font-medium">
                  已載入手寫照片（將透過 Gemini 多模態進行繁中 OCR 與診斷）
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
        <button
          type="button"
          onClick={onGrade}
          disabled={isLoading || (!content.trim() && !imageBase64)}
          className={`w-full py-4 px-6 rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-2.5 shadow-lg transition-all cursor-pointer ${
            isLoading || (!content.trim() && !imageBase64)
              ? 'bg-slate-300 shadow-none cursor-not-allowed text-slate-500'
              : 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-amber-500 hover:opacity-95 shadow-indigo-200 active:scale-98'
          }`}
        >
          {isLoading ? (
            <>
              <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
              <span>六級分規準深度評閱中...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-6 h-6" />
              <span>開始會考六級分深度評改</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
