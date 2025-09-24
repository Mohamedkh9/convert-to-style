
import React, { useState } from 'react';
import type { EditType, StyleOption, ManualTool } from '../types';
import Spinner from './Spinner';

interface CreativeToolsProps {
  isEditing: boolean;
  onEdit: (prompt: string, editType: EditType) => Promise<void>;
  onReset: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  styleOptions: StyleOption[];
  // Manual tool props
  activeManualTool: ManualTool;
  onManualToolChange: (tool: ManualTool) => void;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  brushColor: string;
  onBrushColorChange: (color: string) => void;
}

const CreativeTools: React.FC<CreativeToolsProps> = ({ 
    isEditing, onEdit, onReset, onUndo, onRedo, canUndo, canRedo, styleOptions,
    activeManualTool, onManualToolChange, brushSize, onBrushSizeChange, brushColor, onBrushColorChange
}) => {
  const [prompt, setPrompt] = useState<string>('');
  const [activeEdit, setActiveEdit] = useState<EditType | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>('');

  const handleSubmit = async (editType: EditType) => {
    if (!prompt.trim() || isEditing) {
      return;
    }
    setActiveEdit(editType);
    await onEdit(prompt, editType);
    setActiveEdit(null);
  };
  
  const handleAddStyle = () => {
    if (selectedStyle) {
      const selectedLabel = styleOptions.find(opt => opt.value === selectedStyle)?.label || selectedStyle;
      setPrompt(prev => prev ? `${prev}, ${selectedLabel}`.trim() : selectedLabel);
    }
  };

  const handleToolToggle = (tool: 'draw' | 'erase') => {
    onManualToolChange(activeManualTool === tool ? null : tool);
  };

  const aiButtons: { type: EditType; label: string; icon: React.ReactElement; tooltip: string }[] = [
    {
      type: 'background',
      label: 'تغيير الخلفية',
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 rtl:ml-2 rtl:mr-0" viewBox="0 0 20 20" fill="currentColor"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 11.668l1.9-1.9a1 1 0 011.414 0l.707.707a1 1 0 001.414 0l2.122-2.121a1 1 0 011.414 0l2.474 2.474A5.985 5.985 0 014 10c0 .63.1 1.234.273 1.801l.059-.133zM10 12a2 2 0 100-4 2 2 0 000 4z"/></svg>,
      tooltip: "استبدل الخلفية الموجودة. مثال: 'شاطئ مشمس'"
    },
    {
      type: 'color',
      label: 'إعادة تلوين',
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 rtl:ml-2 rtl:mr-0" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a6 6 0 00-6 6c0 1.887.832 3.565 2.146 4.681A5.516 5.516 0 004.5 18a5.506 5.506 0 005.5 2c1.887 0 3.565-.832 4.681-2.146A5.516 5.516 0 0018 15.5a5.506 5.506 0 00-2-5.5C17.168 8.435 18 6.757 18 5a5.006 5.006 0 00-5-5zm0 2a3 3 0 013 3c0 1.887-.832 3.565-2.146 4.681A5.516 5.516 0 009.5 16a5.506 5.506 0 00-1.319-3.854A6.006 6.006 0 007 7a3 3 0 013-3z" /></svg>,
      tooltip: "غيّر ألوان الصورة بأكملها. مثال: 'ألوان مائية هادئة'"
    },
    {
      type: 'design',
      label: 'إعادة التصميم',
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 rtl:ml-2 rtl:mr-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 2a1 1 0 00-1 1v1.586l-1.707 1.707A1 1 0 003 8v6a1 1 0 001 1h2a1 1 0 001-1V8a1 1 0 00-1-1H5V2zm5 0a1 1 0 00-1 1v8a1 1 0 001 1h2a1 1 0 001-1V3a1 1 0 00-1-1h-2zM2 13.5a1.5 1.5 0 011.5-1.5h13A1.5 1.5 0 0118 13.5v1a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 012 14.5v-1z" clipRule="evenodd" /></svg>,
      tooltip: "حوّل الصورة بأسلوب جديد. مثال: 'بأسلوب فن البكسل'"
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex justify-end items-center space-x-2 rtl:space-x-reverse">
        <button
            onClick={onUndo}
            disabled={isEditing || !canUndo}
            className="p-2 rounded-lg text-slate-300 bg-slate-700/60 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="تراجع"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" transform="scale(-1, 1) translate(-24, 0)"/></svg>
        </button>
          <button
            onClick={onRedo}
            disabled={isEditing || !canRedo}
            className="p-2 rounded-lg text-slate-300 bg-slate-700/60 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="إعادة"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
        </button>
        <button
            onClick={onReset}
            disabled={isEditing || !canUndo}
            className="p-2 rounded-lg text-slate-300 bg-slate-700/60 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="إعادة تعيين"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.898 2.166A1 1 0 1115.15 8.85a5 5 0 00-8.303-1.411V5a1 1 0 01-2 0V3a1 1 0 011-1zm12 16a1 1 0 01-1-1v-2.101a7.002 7.002 0 01-11.898-2.166A1 1 0 014.85 11.15a5 5 0 008.303 1.411V15a1 1 0 012 0v2a1 1 0 01-1 1z" clipRule="evenodd" /></svg>
        </button>
      </div>

      {/* Manual Tools Section */}
      <div className="p-3 bg-slate-800/50 rounded-lg space-y-3">
        <label className="block text-sm font-medium text-slate-300">أدوات يدوية</label>
        <div className="grid grid-cols-2 gap-2">
            <button
                onClick={() => handleToolToggle('draw')}
                disabled={isEditing}
                className={`w-full inline-flex items-center justify-center px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                    activeManualTool === 'draw' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                }`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 rtl:ml-2 rtl:mr-0" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                رسم
            </button>
            <button
                onClick={() => handleToolToggle('erase')}
                disabled={isEditing}
                className={`w-full inline-flex items-center justify-center px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                    activeManualTool === 'erase' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                }`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 rtl:ml-2 rtl:mr-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                مسح
            </button>
        </div>
        {activeManualTool && (
            <div className="space-y-3 pt-2 animate-fade-in">
                 {activeManualTool === 'draw' && (
                    <div className="flex items-center justify-between">
                        <label htmlFor="brush-color" className="text-sm font-medium text-slate-300">اللون</label>
                        <input
                            id="brush-color"
                            type="color"
                            value={brushColor}
                            onChange={(e) => onBrushColorChange(e.target.value)}
                            className="p-1 h-8 w-14 block bg-slate-700 border border-slate-600 cursor-pointer rounded-lg disabled:opacity-50"
                            disabled={isEditing}
                        />
                    </div>
                )}
                <div>
                    <label htmlFor="brush-size" className="block text-sm font-medium text-slate-300 mb-1">حجم الفرشاة: {brushSize}px</label>
                    <input
                        id="brush-size"
                        type="range"
                        min="1"
                        max="100"
                        value={brushSize}
                        onChange={(e) => onBrushSizeChange(parseInt(e.target.value, 10))}
                        className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        disabled={isEditing}
                    />
                </div>
            </div>
        )}
      </div>

      {/* AI Tools Section */}
      <div className="space-y-4">
        <div className="space-y-2">
            <label htmlFor="style-select-creative" className="block text-sm font-medium text-slate-300">إضافة نمط سريع (للذكاء الاصطناعي)</label>
            <div className="flex gap-2">
                <select
                    id="style-select-creative"
                    value={selectedStyle}
                    onChange={(e) => setSelectedStyle(e.target.value)}
                    className="w-full bg-slate-700/80 border border-slate-700 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5"
                    disabled={isEditing}
                >
                    <option value="">اختر نمطًا لإضافته للوصف...</option>
                    {styleOptions.map(style => (
                        <option key={style.value} value={style.value}>{style.label}</option>
                    ))}
                </select>
                <button
                    onClick={handleAddStyle}
                    disabled={!selectedStyle || isEditing}
                    className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-slate-600 hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                    title="إضافة النمط المحدد إلى الوصف أدناه"
                >
                    إضافة
                </button>
            </div>
        </div>

        <div>
            <label htmlFor="creative-prompt" className="block text-sm font-medium text-slate-300 mb-2">وصف التعديل (للذكاء الاصطناعي)</label>
            <textarea
            id="creative-prompt"
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isEditing}
            placeholder="صف التغيير الذي تريده... مثال: 'سماء ليلية مع شفق قطبي زاهي'"
            className="w-full p-2.5 bg-slate-700/80 border border-slate-700 rounded-lg text-slate-200 text-sm placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors disabled:opacity-50"
            />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {aiButtons.map(({ type, label, icon, tooltip }) => (
            <div key={type} className="relative group flex">
                <button
                onClick={() => handleSubmit(type)}
                disabled={isEditing || !prompt.trim()}
                className="w-full inline-flex items-center justify-center px-3 py-2 text-sm font-semibold rounded-lg text-white bg-slate-600/80 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500"
                >
                {isEditing && activeEdit === type ? (
                    <Spinner />
                ) : (
                    <>
                        {icon}
                        {label}
                    </>
                )}
                </button>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs p-2 text-xs text-white bg-slate-950 border border-slate-700 rounded-md shadow-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                {tooltip}
                </div>
            </div>
            ))}
        </div>
        {isEditing && (
                <p className="mt-3 text-center text-xs text-slate-400 animate-pulse">الذكاء الاصطناعي يبدع...</p>
            )}
        </div>
    </div>
  );
};

export default CreativeTools;
