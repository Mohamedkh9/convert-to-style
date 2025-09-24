import React from 'react';
import type { LineArtStyle, StyleOption } from '../types';

interface StyleSelectorProps {
  selectedStyle: LineArtStyle;
  onStyleChange: (style: LineArtStyle) => void;
  disabled: boolean;
  styleOptions: StyleOption[];
}

const StyleSelector: React.FC<StyleSelectorProps> = ({ selectedStyle, onStyleChange, disabled, styleOptions }) => {
  return (
    <div>
        <label htmlFor="style-select-main" className="block text-sm font-medium text-slate-300 mb-2">النمط الفني</label>
        <select
          id="style-select-main"
          value={selectedStyle}
          onChange={(e) => onStyleChange(e.target.value)}
          disabled={disabled}
          className="w-full bg-slate-700/80 border border-slate-700 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-3 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {styleOptions.map((style) => (
            <option key={style.value} value={style.value}>{style.label}</option>
          ))}
        </select>
    </div>
  );
};

export default StyleSelector;