
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { AppStatus } from './types';
import type { ImageFile, LineArtStyle, EditType, Resolution, StyleOption, ManualTool } from './types';
import { generateLineArt, applyCreativeEdit } from './services/geminiService';
import Spinner from './components/Spinner';
import CreativeTools from './components/CreativeTools';
import StyleSelector from './components/StyleSelector';

declare const jspdf: any;

// --- Helper Functions ---
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });
};

const styleOptions: StyleOption[] = [
    { value: 'Realistic / Photorealistic', label: 'واقعي / فوتوغرافي' },
    { value: 'Minimalist', label: 'بسيط' },
    { value: 'Geometric / Polygonal', label: 'هندسي / مضلع' },
    { value: 'Abstract', label: 'تجريدي' },
    { value: 'Tapestry Style', label: 'أسلوب نسيج' },
    { value: 'Traditional Weaving Style', label: 'أسلوب نسج تقليدي' },
    { value: 'Textile Texture', label: 'ملمس نسيج' },
    { value: 'Flat Design', label: 'تصميم مسطح' },
    { value: '3D Render', label: 'تصيير ثلاثي الأبعاد' },
    { value: 'Pixel Art', label: 'فن البكسل' },
    { value: 'Vector Art', label: 'فن المتجهات' },
    { value: 'Line Art', label: 'فن خطي' },
    { value: 'Hand-drawn / Sketch', label: 'رسم يدوي / اسكتش' },
    { value: 'Watercolor', label: 'ألوان مائية' },
    { value: 'Oil Painting', label: 'لوحة زيتية' },
    { value: 'Digital Painting', label: 'رسم رقمي' },
    { value: 'Pop Art', label: 'فن البوب' },
    { value: 'Retro / Vintage', label: 'ريترو / عتيق' },
    { value: 'Futuristic / Sci-Fi', label: 'مستقبلي / خيال علمي' },
    { value: 'Cyberpunk', label: 'سايبربانك' },
    { value: 'Steampunk', label: 'ستيم بانك' },
    { value: 'Cartoon / Comic Style', label: 'أسلوب كرتوني / كوميك' },
    { value: 'Collage', label: 'كولاج' },
    { value: 'Paper-cut Style', label: 'أسلوب قص الورق' },
    { value: 'Isometric Design', label: 'تصميم متساوي القياس' },
    { value: 'Low Poly', label: 'بولي منخفض' },
    { value: 'Surrealism', label: 'سريالية' },
    { value: 'Fantasy Style', label: 'أسلوب خيالي' },
    { value: 'Neon / Glow Effect', label: 'تأثير نيون / توهج' },
    { value: 'Monochrome / Black & White', label: 'أحادي اللون / أبيض وأسود' },
];

// --- UI Components ---

const Header: React.FC = () => (
  <header className="w-full text-center p-4 md:p-5 border-b border-slate-800/60">
    <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">
      محول الفن بالذكاء الاصطناعي
    </h1>
    <p className="text-slate-400 mt-1 text-xs md:text-sm">
      حوّل صورك إلى أعمال فنية فريدة بلمسة زر.
    </p>
  </header>
);

interface ImageUploaderProps {
  onFileSelect: (file: File) => void;
  originalFile: ImageFile | null;
  status: AppStatus;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onFileSelect, originalFile, status }) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const uploaderClasses = useMemo(() => {
    const baseClasses = "relative flex flex-col items-center justify-center w-full aspect-[16/10] rounded-xl cursor-pointer transition-all duration-300";

    if (isDragging) {
      return `${baseClasses} border-2 border-dashed border-indigo-500 bg-slate-700/50 scale-105`;
    }

    if (originalFile) {
      // When an image is present, the uploader has a clean, solid border and no internal padding.
      return `${baseClasses} border-2 border-solid border-slate-700 bg-slate-900 p-0 overflow-hidden`;
    }

    // Default placeholder state with a dashed border.
    return `${baseClasses} border-2 border-dashed border-slate-700 bg-slate-800/50 hover:border-slate-500 hover:bg-slate-700/30`;
  }, [isDragging, originalFile]);

  return (
    <div
      className={uploaderClasses}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      {originalFile ? (
        <>
          <img
            src={`data:${originalFile.mimeType};base64,${originalFile.base64}`}
            alt="Original"
            className="object-contain h-full w-full"
          />
          <div className="absolute inset-0 bg-black/70 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity duration-300 rounded-xl">
             <span className="text-white font-semibold text-lg">تغيير الصورة</span>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center text-center p-4">
          <svg className="w-10 h-10 mb-4 text-slate-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2" />
          </svg>
          <p className="mb-1 text-base text-slate-300"><span className="font-semibold text-indigo-400">انقر للرفع</span> أو اسحب وأفلت</p>
          <p className="text-xs text-slate-500">PNG, JPG, WEBP</p>
        </div>
      )}
      <input ref={inputRef} id="dropzone-file" type="file" className="hidden" onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" disabled={status === AppStatus.LOADING} />
    </div>
  );
};

interface DrawingCanvasProps {
    src: string;
    alt: string;
    activeTool: ManualTool;
    brushSize: number;
    brushColor: string;
    onDrawEnd: (dataUrl: string) => void;
    useCheckerboardBg?: boolean;
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ src, alt, activeTool, brushSize, brushColor, onDrawEnd, useCheckerboardBg = false }) => {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);
    
    const imageContainerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawingRef = useRef(false);
    const lastPointRef = useRef<{ x: number, y: number } | null>(null);

    // Effect to draw image onto canvas when src changes (e.g., on load, undo, redo, reset)
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx || !src) return;

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        };
        img.src = src;
    }, [src]);
    
    const setBoundedPosition = useCallback((newPos: { x: number; y: number }, currentScale: number) => {
      if (!imageContainerRef.current) {
          setPosition(newPos);
          return;
      };
  
      const { width, height } = imageContainerRef.current.getBoundingClientRect();
      const extraWidth = (width * currentScale - width) / 2;
      const extraHeight = (height * currentScale - height) / 2;
      
      const boundedX = Math.max(-extraWidth, Math.min(extraWidth, newPos.x));
      const boundedY = Math.max(-extraHeight, Math.min(extraHeight, newPos.y));
      
      setPosition({ x: boundedX, y: boundedY });
    }, []);
  
    const handleZoom = useCallback((delta: number) => {
      const newScale = Math.max(1, Math.min(scale + delta, 5));
      
      if (newScale === 1) {
        setPosition({ x: 0, y: 0 });
      } else {
        const scaleRatio = newScale / scale;
        const newPos = {
          x: position.x * scaleRatio,
          y: position.y * scaleRatio,
        };
        setBoundedPosition(newPos, newScale);
      }
      setScale(newScale);
    }, [scale, position, setBoundedPosition]);
  
    const handleWheel = useCallback((e: React.WheelEvent) => {
      e.preventDefault();
      handleZoom(e.deltaY * -0.01);
    }, [handleZoom]);

    const getCanvasPoint = useCallback((e: React.MouseEvent): { x: number, y: number } | null => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / scale;
        const y = (e.clientY - rect.top) / scale;
        return { x, y };
    }, [scale]);
  
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        const point = getCanvasPoint(e);
        if (!point) return;

        if (activeTool) {
            e.preventDefault();
            isDrawingRef.current = true;
            lastPointRef.current = point;

            const ctx = canvasRef.current?.getContext('2d');
            if (!ctx) return;

            ctx.lineWidth = brushSize;
            ctx.strokeStyle = brushColor;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.globalCompositeOperation = activeTool === 'draw' ? 'source-over' : 'destination-out';
            
            ctx.beginPath();
            ctx.moveTo(point.x, point.y);
        } else if (scale > 1) {
            e.preventDefault();
            setIsPanning(true);
            setPanStart({ x: e.clientX - position.x, y: e.clientY - position.y });
        }
    }, [scale, position.x, position.y, activeTool, brushSize, brushColor, getCanvasPoint]);
  
    // This function is called when the user releases the mouse button.
    const handleMouseUp = useCallback(() => {
        // If the user was in the middle of a drawing stroke...
        if (isDrawingRef.current) {
            const canvas = canvasRef.current;
            if (canvas) {
                // ...capture the final state of the canvas as a data URL.
                // This is robustly called *after* the drawing operation is fully complete.
                // The resulting data URL is then passed to the parent component's callback.
                onDrawEnd(canvas.toDataURL());
            }
        }
        // Reset drawing and panning states.
        isDrawingRef.current = false;
        lastPointRef.current = null;
        setIsPanning(false);
    }, [onDrawEnd]);
    
    const handleMouseLeave = useCallback(() => {
        handleMouseUp();
        setIsHovered(false);
    }, [handleMouseUp]);
  
    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (isDrawingRef.current) {
            e.preventDefault();
            const point = getCanvasPoint(e);
            if (!point) return;

            const ctx = canvasRef.current?.getContext('2d');
            if (ctx && lastPointRef.current) {
                ctx.lineTo(point.x, point.y);
                ctx.stroke();
                lastPointRef.current = point;
            }
        } else if (isPanning) {
            e.preventDefault();
            const newPos = {
                x: e.clientX - panStart.x,
                y: e.clientY - panStart.y,
            };
            setBoundedPosition(newPos, scale);
        }
    }, [isPanning, panStart, scale, setBoundedPosition, getCanvasPoint]);
  
    const handleReset = useCallback(() => {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }, []);
  
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (!isHovered) return;
  
          const target = e.target as HTMLElement;
          if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
              return;
          }
  
          if (e.key === '=' || e.key === '+') {
              e.preventDefault();
              handleZoom(0.25);
          } else if (e.key === '-') {
              e.preventDefault();
              handleZoom(-0.25);
          }
      };
  
      window.addEventListener('keydown', handleKeyDown);
      return () => {
          window.removeEventListener('keydown', handleKeyDown);
      };
    }, [isHovered, handleZoom]);
  
    const checkerboardBg = useMemo(() => ({
      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none'%3e%3cpath d='M0 0H16V16H0V0ZM16 16H32V32H16V16Z' fill='%23cbd5e1'/%3e%3c/svg%3e")`,
      backgroundColor: '#e2e8f0'
    }), []);
    
    const cursorStyle = useMemo(() => {
        if (activeTool) return 'crosshair';
        if (scale > 1) return isPanning ? 'grabbing' : 'grab';
        return 'auto';
    }, [activeTool, scale, isPanning]);

    return (
      <div
        ref={imageContainerRef}
        className={`relative p-2 rounded-lg shadow-inner w-full aspect-square overflow-hidden select-none bg-slate-800`}
        style={useCheckerboardBg ? checkerboardBg : {}}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
      >
        <canvas
          ref={canvasRef}
          aria-label={alt}
          className="object-contain w-full h-full rounded-md transition-transform duration-100 ease-out"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            cursor: cursorStyle,
            willChange: 'transform'
          }}
          draggable="false"
        />
        <div className="absolute bottom-3 right-3 flex items-center bg-slate-900/60 backdrop-blur-sm p-1 rounded-full shadow-lg space-x-1 rtl:space-x-reverse z-10">
          <button 
            onClick={() => handleZoom(-0.25)} 
            className="w-8 h-8 flex items-center justify-center text-white bg-slate-700/50 hover:bg-slate-600/50 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
            aria-label="Zoom out"
            disabled={scale <= 1}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" /></svg>
          </button>
          <button 
            onClick={handleReset} 
            className="px-3 h-8 text-xs font-semibold text-white bg-slate-700/50 hover:bg-slate-600/50 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
            disabled={scale === 1 && position.x === 0 && position.y === 0}
            aria-label="Reset zoom and pan"
          >
            {Math.round(scale * 100)}%
          </button>
          <button 
            onClick={() => handleZoom(0.25)} 
            className="w-8 h-8 flex items-center justify-center text-white bg-slate-700/50 hover:bg-slate-600/50 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
            aria-label="Zoom in"
            disabled={scale >= 5}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          </button>
        </div>
      </div>
    );
};

interface ControlSectionProps {
    title: string;
    children: React.ReactNode;
    isDisabled?: boolean;
}

const ControlSection: React.FC<ControlSectionProps> = ({ title, children, isDisabled = false }) => (
    <div className={`border-t border-slate-700/50 pt-5 mt-5 first:mt-0 first:pt-0 first:border-none ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <h3 className="text-lg font-bold text-slate-200 tracking-wide mb-4">
            {title}
        </h3>
        {children}
    </div>
);

interface ResolutionSelectorProps {
    selectedResolution: Resolution;
    onResolutionChange: (resolution: Resolution) => void;
    disabled: boolean;
}

const ResolutionSelector: React.FC<ResolutionSelectorProps> = ({ selectedResolution, onResolutionChange, disabled }) => {
    const resolutions: { id: Resolution; label: string }[] = [
        { id: 'Low', label: 'منخفضة' },
        { id: 'Medium', label: 'متوسطة' },
        { id: 'High', label: 'عالية' },
    ];

    return (
        <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">الدقة</label>
            <div className="flex w-full bg-slate-700/80 rounded-lg p-1">
                {resolutions.map((res) => (
                    <button
                        key={res.id}
                        onClick={() => onResolutionChange(res.id)}
                        disabled={disabled}
                        className={`w-full text-center px-3 py-1.5 text-sm font-semibold rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed
                            ${selectedResolution === res.id
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'text-slate-300 hover:bg-slate-600/70'
                            }`}
                    >
                        {res.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

// --- Main App Component ---

const App: React.FC = () => {
  const [originalFile, setOriginalFile] = useState<ImageFile | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [initialLineArt, setInitialLineArt] = useState<string | null>(null);
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [style, setStyle] = useState<LineArtStyle>(styleOptions[0].value);
  const [resolution, setResolution] = useState<Resolution>('Medium');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<'png' | 'jpeg' | 'webp' | 'pdf'>('png');
  const [exportQuality, setExportQuality] = useState(92);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Manual editing state
  const [activeManualTool, setActiveManualTool] = useState<ManualTool>(null);
  const [brushSize, setBrushSize] = useState(20);
  const [brushColor, setBrushColor] = useState('#ffffff');

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
        setError("يرجى اختيار ملف صورة صالح (PNG, JPG, WEBP).");
        return;
    }
    setStatus(AppStatus.IDLE);
    setError(null);
    setGeneratedImage(null);
    setInitialLineArt(null);
    setHistory([]);
    setHistoryIndex(-1);
    setActiveManualTool(null);
    try {
        const base64 = await fileToBase64(file);
        setOriginalFile({ base64, mimeType: file.type, name: file.name });
    } catch (err) {
        setError("فشل في قراءة ملف الصورة.");
        setOriginalFile(null);
    }
  }, []);

  const handleConvert = useCallback(async () => {
    if (!originalFile) {
      setError("يرجى اختيار صورة أولاً.");
      return;
    }
    setStatus(AppStatus.LOADING);
    setError(null);
    setGeneratedImage(null);
    setInitialLineArt(null);
    setHistory([]);
    setHistoryIndex(-1);
    setActiveManualTool(null);

    try {
      const result = await generateLineArt(originalFile.base64, originalFile.mimeType, style, resolution);
      setGeneratedImage(result);
      setInitialLineArt(result);
      setHistory([result]);
      setHistoryIndex(0);
      setStatus(AppStatus.SUCCESS);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "حدث خطأ غير متوقع.";
      setError(errorMessage);
      setStatus(AppStatus.ERROR);
    }
  }, [originalFile, style, resolution]);
  
  const handleCreativeEdit = useCallback(async (prompt: string, editType: EditType) => {
    if (!generatedImage) {
        setError("لا توجد صورة لتعديلها.");
        return;
    }
    setIsEditing(true);
    setError(null);
    setActiveManualTool(null);
    try {
        const [header, base64Data] = generatedImage.split(',');
        if (!header || !base64Data) {
            throw new Error("تنسيق بيانات الصورة غير صالح.");
        }
        const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';
        const result = await applyCreativeEdit(base64Data, mimeType, prompt, editType);
        
        // The history management logic here is identical to handleDrawEnd, ensuring consistency.
        // 1. Branch history: Correctly creates a new branch if the user has undone manual or AI edits.
        const newHistory = history.slice(0, historyIndex + 1);
        
        // 2. Add new state: The new AI-generated image is pushed as the latest state.
        newHistory.push(result);
        setHistory(newHistory);

        // 3. Update index: The history index is correctly set to the new head of the history.
        const newIndex = newHistory.length - 1;
        setHistoryIndex(newIndex);
        setGeneratedImage(newHistory[newIndex]);
        
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "حدث خطأ إبداعي غير متوقع.";
        setError(errorMessage);
    } finally {
        setIsEditing(false);
    }
  }, [generatedImage, history, historyIndex]);

  const handleCreativeReset = useCallback(() => {
    if (initialLineArt) {
        // This function correctly resets the state, regardless of whether the last action
        // was a manual edit or an AI edit.
        // 1. Reset displayed image: The canvas is reverted to the initial generated art.
        setGeneratedImage(initialLineArt);
        // 2. Reset history: The entire history array is replaced with a new array containing only the initial state.
        setHistory([initialLineArt]);
        // 3. Reset index: The index is set back to 0, pointing to the single item in the history.
        setHistoryIndex(0);
        setError(null);
        setActiveManualTool(null);
    }
  }, [initialLineArt]);
  
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setGeneratedImage(history[newIndex]);
        setActiveManualTool(null);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setGeneratedImage(history[newIndex]);
        setActiveManualTool(null);
    }
  }, [history, historyIndex]);

  const handleDrawEnd = useCallback((dataUrl: string) => {
    // This function robustly handles manual canvas edits and integrates them into the history.
    // 1. Branch history: If the user has undone previous steps, this slice discards the "redo" states,
    // creating a new history branch from the current state.
    const newHistory = history.slice(0, historyIndex + 1);
    
    // 2. Add new state: The new canvas state (from the manual edit) is pushed to the end of this new branch.
    newHistory.push(dataUrl);
    setHistory(newHistory);
    
    // 3. Update index: The history index is updated to point to this new state.
    const newIndex = newHistory.length - 1;
    setHistoryIndex(newIndex);

    // 4. Update UI: The displayed image is set to the new state.
    setGeneratedImage(newHistory[newIndex]);
  }, [history, historyIndex]);

  const handleClear = useCallback(() => {
    setOriginalFile(null);
    setGeneratedImage(null);
    setInitialLineArt(null);
    setStatus(AppStatus.IDLE);
    setError(null);
    setHistory([]);
    setHistoryIndex(-1);
    setActiveManualTool(null);
  }, []);

  const handleDownload = useCallback(() => {
    if (!generatedImage || !originalFile) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (exportFormat === 'pdf') {
        try {
            const { jsPDF } = jspdf;
            const orientation = img.naturalWidth > img.naturalHeight ? 'l' : 'p';
            const doc = new jsPDF({
                orientation: orientation,
                unit: 'px',
                format: [img.naturalWidth, img.naturalHeight],
                compress: true,
            });
            doc.addImage(generatedImage, 'PNG', 0, 0, img.naturalWidth, img.naturalHeight);
            doc.save(`generated_art_${originalFile.name.split('.')[0]}.pdf`);
        } catch (pdfError) {
            console.error("Failed to generate PDF:", pdfError);
            setError("فشل في إنشاء ملف PDF. قد تكون هناك مشكلة في المكتبة أو المتصفح.");
        }
        return;
      }
      
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setError("لا يمكن الوصول إلى سياق الرسم للتحويل.");
        return;
      };
      
      if (exportFormat === 'jpeg') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      ctx.drawImage(img, 0, 0);

      const mimeType = `image/${exportFormat}`;
      const quality = exportFormat === 'png' ? undefined : exportQuality / 100;
      const dataUrl = canvas.toDataURL(mimeType, quality);
      
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `generated_art_${originalFile.name.split('.')[0]}.${exportFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    img.onerror = () => {
        setError("فشل تحميل الصورة للتصدير.");
    };
    img.src = generatedImage;
  }, [generatedImage, originalFile, exportFormat, exportQuality]);
  
  const isLoading = status === AppStatus.LOADING;
  const showCreativeTools = status === AppStatus.SUCCESS && generatedImage && initialLineArt;
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  const selectedStyleLabel = useMemo(() => styleOptions.find(opt => opt.value === style)?.label || style, [style]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />
      <main className="flex-grow grid grid-cols-1 md:grid-cols-12 gap-6 p-4 md:p-6">

        {/* --- Control Panel --- */}
        <aside className="md:col-span-4 lg:col-span-3 bg-slate-900 p-5 rounded-xl border border-slate-800 self-start md:sticky md:top-6">
            <ControlSection title="١. رفع الصورة">
                <ImageUploader onFileSelect={handleFileSelect} originalFile={originalFile} status={status} />
                 {originalFile && (
                    <button
                        onClick={handleClear}
                        disabled={isLoading || isEditing}
                        className="w-full mt-3 px-4 py-2 text-sm font-semibold rounded-lg text-slate-300 bg-slate-700/60 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                        إزالة الصورة
                    </button>
                 )}
            </ControlSection>
            
            <ControlSection title="٢. إعدادات الإنشاء" isDisabled={!originalFile}>
                <div className="space-y-4">
                    <StyleSelector
                        styleOptions={styleOptions}
                        selectedStyle={style}
                        onStyleChange={setStyle}
                        disabled={isLoading || isEditing || !originalFile}
                    />
                    <ResolutionSelector
                        selectedResolution={resolution}
                        onResolutionChange={setResolution}
                        disabled={isLoading || isEditing}
                    />
                </div>
                <button
                    onClick={handleConvert}
                    disabled={!originalFile || isLoading || isEditing}
                    className="w-full px-6 py-3.5 mt-5 text-base font-bold rounded-lg text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-300 flex items-center justify-center shadow-lg shadow-indigo-600/20"
                    >
                    {isLoading ? (
                        <>
                        <Spinner />
                        <span className="mr-3">جاري الإنشاء...</span>
                        </>
                    ) : (
                        `إنشاء بأسلوب: ${selectedStyleLabel}`
                    )}
                </button>
                {isLoading && (
                    <p className="mt-3 text-center text-xs text-slate-400 animate-pulse">قد يستغرق هذا بضع لحظات...</p>
                )}
            </ControlSection>
            
            {showCreativeTools && (
                <div className="animate-fade-in">
                    <ControlSection title="٣. لمسات إبداعية">
                        <CreativeTools 
                            isEditing={isEditing}
                            onEdit={handleCreativeEdit}
                            onReset={handleCreativeReset}
                            onUndo={handleUndo}
                            onRedo={handleRedo}
                            canUndo={canUndo}
                            canRedo={canRedo}
                            styleOptions={styleOptions}
                            activeManualTool={activeManualTool}
                            onManualToolChange={setActiveManualTool}
                            brushSize={brushSize}
                            onBrushSizeChange={setBrushSize}
                            brushColor={brushColor}
                            onBrushColorChange={setBrushColor}
                        />
                    </ControlSection>
                </div>
            )}
            
            {error && (
                <div className="mt-4 text-center bg-red-900/50 border border-red-500/30 text-red-200 px-4 py-3 rounded-lg text-sm" role="alert">
                    <strong className="font-bold block mb-1">حدث خطأ</strong> {error}
                </div>
            )}
        </aside>

        {/* --- Workspace --- */}
        <section className="md:col-span-8 lg:col-span-9">
            {status === AppStatus.SUCCESS && generatedImage && originalFile ? (
                 <div className="flex flex-col">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
                        <div className="flex flex-col">
                            <h3 className="text-lg font-semibold text-slate-300 mb-3 text-center">الصورة الأصلية</h3>
                            <DrawingCanvas 
                                src={`data:${originalFile.mimeType};base64,${originalFile.base64}`} 
                                alt="Original"
                                activeTool={null}
                                brushSize={0}
                                brushColor=""
                                onDrawEnd={() => {}}
                            />
                        </div>
                        <div className="flex flex-col">
                            <h3 className="text-lg font-semibold text-slate-300 mb-3 text-center">النتيجة</h3>
                            <DrawingCanvas 
                                src={generatedImage} 
                                alt="Generated Line Art" 
                                useCheckerboardBg={true}
                                activeTool={activeManualTool}
                                brushSize={brushSize}
                                brushColor={brushColor}
                                onDrawEnd={handleDrawEnd}
                            />
                        </div>
                    </div>

                    {showCreativeTools && (
                         <div className="mt-8 p-6 bg-slate-900 rounded-xl border border-slate-800 animate-fade-in">
                            <h3 className="text-xl font-semibold text-slate-200 mb-5">تصدير الصورة</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                <div className="md:col-span-1">
                                    <label htmlFor="format-select" className="block text-sm font-medium text-slate-300 mb-2">التنسيق</label>
                                    <select
                                        id="format-select"
                                        value={exportFormat}
                                        onChange={(e) => setExportFormat(e.target.value as 'png' | 'jpeg' | 'webp' | 'pdf')}
                                        className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 transition"
                                    >
                                        <option value="png">PNG</option>
                                        <option value="jpeg">JPG (خلفية بيضاء)</option>
                                        <option value="webp">WebP</option>
                                        <option value="pdf">PDF (مستند)</option>
                                    </select>
                                </div>
                                {(exportFormat === 'jpeg' || exportFormat === 'webp') ? (
                                    <div className="md:col-span-1 animate-fade-in">
                                        <label htmlFor="quality-slider" className="block text-sm font-medium text-slate-300 mb-2">الجودة: {exportQuality}%</label>
                                        <input
                                            id="quality-slider"
                                            type="range"
                                            min="1"
                                            max="100"
                                            value={exportQuality}
                                            onChange={(e) => setExportQuality(parseInt(e.target.value, 10))}
                                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                        />
                                    </div>
                                ) : <div className="md:col-span-1 hidden md:block"></div>}
                                <div className="md:col-span-1">
                                    <button
                                        onClick={handleDownload}
                                        className="w-full inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-semibold rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-slate-900 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 ml-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                        تحميل
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[60vh] bg-slate-900 border-2 border-dashed border-slate-800 rounded-xl p-8 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-20 h-20 text-slate-700 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <h2 className="text-2xl font-bold text-slate-300">مساحة العمل الإبداعية</h2>
                    <p className="text-slate-500 mt-2 max-w-sm">ابدأ برفع صورة من لوحة التحكم على اليمين لرؤية السحر يحدث هنا.</p>
                </div>
            )}
        </section>

      </main>
    </div>
  );
};

export default App;
