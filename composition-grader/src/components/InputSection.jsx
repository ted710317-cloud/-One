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
  Square,
  BookOpen,
  CheckCircle2
} from 'lucide-react';
import { AVAILABLE_RHETORICS, AVAILABLE_GENRES, WORD_COUNT_PRESETS } from '../constants/presets';
import { optimizeManuscriptImage } from '../utils/imageOptimizer';

export default function InputSection({
  title,
  setTitle,
  promptGuide,
  setPromptGuide,
  targetPreset,
  setTargetPreset,
  customWordCount,
  setCustomWordCount,
  selectedGenre,
  setSelectedGenre,
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
  const [isOptimizingImage, setIsOptimizingImage] = useState(false);
  const [imageMeta, setImageMeta] = useState(null);

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

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsOptimizingImage(true);
    try {
      const optimized = await optimizeManuscriptImage(file, 2048, 0.92);
      setImageFile(file);
      setImageBase64(optimized.base64);
      setImageMeta({
        width: optimized.width,
        height: optimized.height,
        sizeKb: optimized.optimizedSizeKb,
        originalSizeKb: optimized.originalSizeKb,
      });
    } catch (err) {
      console.warn('圖片優化失敗，採用原始讀取方式:', err);
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        setImageBase64(base64);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsOptimizingImage(false);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImageBase64(null);
    setImageMeta(null);
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

      {/* Step 3: 文體規範限定 */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <label className="flex items-center gap-2.5 text-base sm:text-lg font-bold text-slate-800">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">3</span>
            文體規範限定（{selectedGenre ? `已選：${selectedGenre}` : '選填，未選則不限文體'}）
          </label>
          {selectedGenre && (
            <button
              type="button"
              onClick={() => setSelectedGenre('')}
              className="text-xs sm:text-sm text-slate-500 hover:text-slate-700 cursor-pointer font-medium"
            >
              不限文體 (清除)
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {AVAILABLE_GENRES.map((g) => {
            const isSelected = selectedGenre === g.id;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => setSelectedGenre(isSelected ? '' : g.id)}
                className={`px-3.5 py-2 rounded-xl text-sm font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs scale-102 ring-2 ring-indigo-600/20'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                }`}
                title={g.desc}
              >
                <span>{g.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 4: 指定修辭要求 */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <label className="flex items-center gap-2.5 text-base sm:text-lg font-bold text-slate-800">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">4</span>
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

      {/* Step 5: 作文輸入區 */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <label className="flex items-center gap-2.5 text-base sm:text-lg font-bold text-slate-800">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">5</span>
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
            {isOptimizingImage ? (
              <div className="border-2 border-dashed border-indigo-300 bg-indigo-50/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center animate-pulse">
                <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-base font-bold text-indigo-950 mb-1">正在校正手寫照片解析度與方向...</p>
                <p className="text-xs text-indigo-700">自動修正手機 EXIF 旋轉並進行筆畫清晰化，確保錯別字檢測極致精確</p>
              </div>
            ) : !imageBase64 ? (
              <label className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/40 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-indigo-50/70 group">
                <div className="w-14 h-14 rounded-full bg-white shadow-xs flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform mb-3">
                  <Upload className="w-7 h-7" />
                </div>
                <p className="text-base font-bold text-slate-800 mb-1">點擊上傳或將學生作文照片拖曳至此</p>
                <p className="text-sm text-slate-500">支援手機拍照、JPG、PNG 稿紙照片（自動優化解析度與筆畫辨識）</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            ) : (
              <div>
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
                  <div className="absolute bottom-2 left-3 text-xs sm:text-sm bg-slate-900/80 text-white px-3 py-1 rounded-md backdrop-blur-xs font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>已載入手寫照片（將以 Gemini 3.8 視覺多模態進行繁中 OCR 與錯字診療）</span>
                  </div>
                </div>
                {imageMeta && (
                  <div className="flex items-center justify-between text-xs text-slate-500 mt-2 px-1">
                    <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      已校正手機方向與稿紙解析度（有效杜絕連筆假錯字）
                    </span>
                    <span className="font-mono text-slate-400">{imageMeta.width}×{imageMeta.height} px · {imageMeta.sizeKb} KB</span>
                  </div>
                )}
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
