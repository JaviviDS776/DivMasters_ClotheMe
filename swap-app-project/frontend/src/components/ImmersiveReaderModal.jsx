import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Volume2, 
  MapPin, 
  Sliders, 
  Check, 
  Gauge,
  FileText,
  Bookmark,
  Sparkles
} from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';

const THEMES = {
  light: {
    id: 'light',
    name: 'Claro',
    bg: 'bg-white',
    text: 'text-slate-900',
    subtext: 'text-slate-500',
    panel: 'bg-slate-50 border-slate-200',
    card: 'bg-slate-50/80 border-slate-200/80',
    highlight: 'bg-indigo-100 text-indigo-950 font-bold shadow-sm',
    accent: 'bg-indigo-600 text-white hover:bg-indigo-700'
  },
  sepia: {
    id: 'sepia',
    name: 'Sepia Cálido',
    bg: 'bg-[#fbf0d9]',
    text: 'text-[#433422]',
    subtext: 'text-[#7f694e]',
    panel: 'bg-[#f3e3c3] border-[#e2cca4]',
    card: 'bg-[#f5e7ce] border-[#dfc69c]',
    highlight: 'bg-[#ebd09e] text-[#2c2013] font-bold shadow-sm',
    accent: 'bg-[#8a5d3b] text-white hover:bg-[#734c2e]'
  },
  dark: {
    id: 'dark',
    name: 'Noche',
    bg: 'bg-[#121212]',
    text: 'text-[#e2e8f0]',
    subtext: 'text-[#94a3b8]',
    panel: 'bg-[#1e1e1e] border-[#333333]',
    card: 'bg-[#181818] border-[#2c2c2c]',
    highlight: 'bg-indigo-900/90 text-white font-bold border border-indigo-400',
    accent: 'bg-indigo-500 text-white hover:bg-indigo-600'
  },
  highContrast: {
    id: 'highContrast',
    name: 'Alto Contraste',
    bg: 'bg-black',
    text: 'text-[#ffff00]',
    subtext: 'text-white',
    panel: 'bg-black border-2 border-white',
    card: 'bg-black border-2 border-[#ffff00]',
    highlight: 'bg-[#ffff00] text-black font-black',
    accent: 'bg-[#ffff00] text-black border-2 border-white font-black'
  }
};

const ImmersiveReaderModal = () => {
  const { readerState, closeReader } = useAccessibility();
  const { isOpen, title, description, location, imageUrl } = readerState;

  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rate, setRate] = useState(1);
  const [themeId, setThemeId] = useState('light');
  const [fontSizePx, setFontSizePx] = useState(22);
  const [lineHeight, setLineHeight] = useState('relaxed');
  const [isDyslexicFont, setIsDyslexicFont] = useState(false);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(-1);
  const [showSettings, setShowSettings] = useState(false);

  const speechSegmentsRef = useRef([]);

  const currentTheme = THEMES[themeId] || THEMES.light;

  // Filtrar y preparar ÚNICAMENTE el contenido esencial (Título, Descripción, Ubicación)
  useEffect(() => {
    if (isOpen) {
      const cleanTitle = (title || '').trim();
      const cleanDesc = (description || 'Sin descripción adicional.').trim();
      const cleanLoc = location ? `Se entrega en casillero de ${location}.` : '';

      // Dividir la descripción en frases concisas
      const descSentences = cleanDesc
        .split(/(?<=[.?!])\s+/)
        .map(s => s.trim())
        .filter(s => s.length > 0);

      // Segmentos estructurados para lectura y resaltado
      const segments = [
        { type: 'title', text: cleanTitle, label: 'Título' },
        ...descSentences.map(sentence => ({
          type: 'description',
          text: sentence,
          label: 'Descripción'
        }))
      ];

      if (cleanLoc) {
        segments.push({
          type: 'location',
          text: cleanLoc,
          label: 'Ubicación'
        });
      }

      speechSegmentsRef.current = segments;
      setActiveSegmentIndex(-1);
      setIsPlaying(false);
      setIsPaused(false);
    }
  }, [isOpen, title, description, location]);

  // Cancelar audio al cerrar o desmontar
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Tecla Escape para salir
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && isOpen) closeReader();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, closeReader]);

  if (!isOpen) return null;

  const speakSegment = (startIndex = 0) => {
    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const segments = speechSegmentsRef.current;
    if (startIndex >= segments.length) {
      setIsPlaying(false);
      setIsPaused(false);
      setActiveSegmentIndex(-1);
      return;
    }

    const currentItem = segments[startIndex];
    const utterance = new SpeechSynthesisUtterance(currentItem.text);
    utterance.lang = 'es-MX';
    utterance.rate = rate;

    // Buscar voz en español nativa
    const voices = window.speechSynthesis.getVoices();
    const spanishVoice = voices.find(v => v.lang.startsWith('es'));
    if (spanishVoice) utterance.voice = spanishVoice;

    utterance.onstart = () => {
      setActiveSegmentIndex(startIndex);
      setIsPlaying(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      if (startIndex + 1 < segments.length) {
        speakSegment(startIndex + 1);
      } else {
        setIsPlaying(false);
        setIsPaused(false);
        setActiveSegmentIndex(-1);
      }
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handlePlayPause = () => {
    if (!window.speechSynthesis) return;

    if (isPlaying && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    } else if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    } else {
      speakSegment(activeSegmentIndex >= 0 ? activeSegmentIndex : 0);
    }
  };

  const handleStop = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsPaused(false);
    setActiveSegmentIndex(-1);
  };

  const speakOnlyDescription = () => {
    const descIndex = speechSegmentsRef.current.findIndex(s => s.type === 'description');
    if (descIndex >= 0) speakSegment(descIndex);
  };

  const speakOnlyLocation = () => {
    const locIndex = speechSegmentsRef.current.findIndex(s => s.type === 'location');
    if (locIndex >= 0) speakSegment(locIndex);
  };

  const lineHeights = {
    normal: 'leading-normal',
    relaxed: 'leading-relaxed',
    loose: 'leading-loose'
  };

  return (
    <div className="fixed inset-0 z-[150] flex flex-col animate-in fade-in duration-300">
      <div className={`w-full h-full flex flex-col ${currentTheme.bg} ${currentTheme.text} transition-colors duration-300`}>
        
        {/* BARRA SUPERIOR DE HERRAMIENTAS */}
        <header className={`px-4 sm:px-8 py-3.5 border-b flex items-center justify-between shadow-sm z-20 ${currentTheme.panel}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl flex items-center gap-1.5 ${currentTheme.accent}`}>
              <Volume2 size={16} />
              <span className="text-xs font-black uppercase tracking-wider hidden sm:inline">Lector Enfocado</span>
            </div>
            <span className={`text-xs font-bold ${currentTheme.subtext} hidden md:inline`}>
              • Lectura limpia de título y descripción
            </span>
          </div>

          {/* Acciones Rápidas de Lectura y Ajustes */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all ${
                showSettings ? currentTheme.accent : 'bg-transparent hover:opacity-80'
              }`}
              title="Ajustes de Lectura"
            >
              <Sliders size={16} />
              <span className="hidden sm:inline">Ajustes</span>
            </button>

            <button
              onClick={closeReader}
              className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold transition-all flex items-center gap-1 text-xs"
              title="Salir del Lector (Esc)"
            >
              <X size={18} />
              <span className="hidden sm:inline">Cerrar</span>
            </button>
          </div>
        </header>

        {/* PANEL DESPLEGABLE DE AJUSTES */}
        {showSettings && (
          <div className={`border-b p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-6 shadow-inner animate-in slide-in-from-top-2 ${currentTheme.panel}`}>
            {/* Temas de Fondo */}
            <div>
              <h4 className={`text-xs font-black uppercase tracking-wider mb-2.5 ${currentTheme.subtext}`}>Fondo Visual</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(THEMES).map(t => (
                  <button
                    key={t.id}
                    onClick={() => setThemeId(t.id)}
                    className={`py-2 px-3 rounded-xl text-xs font-black border flex items-center justify-between transition-all ${
                      themeId === t.id ? 'ring-2 ring-indigo-500 font-black' : 'opacity-70 hover:opacity-100'
                    } ${t.bg} ${t.text}`}
                  >
                    <span>{t.name}</span>
                    {themeId === t.id && <Check size={14} className="shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Tamaño y Tipografía */}
            <div>
              <h4 className={`text-xs font-black uppercase tracking-wider mb-2.5 ${currentTheme.subtext}`}>Tamaño de Letra</h4>
              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={() => setFontSizePx(prev => Math.max(16, prev - 2))}
                  className="px-3 py-1.5 rounded-xl border bg-black/5 hover:bg-black/10 font-black text-sm"
                >
                  A-
                </button>
                <span className="text-xs font-black flex-1 text-center">{fontSizePx}px</span>
                <button
                  onClick={() => setFontSizePx(prev => Math.min(38, prev + 2))}
                  className="px-3 py-1.5 rounded-xl border bg-black/5 hover:bg-black/10 font-black text-sm"
                >
                  A+
                </button>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-bold">Fuente Accesible (Mono)</span>
                <input
                  type="checkbox"
                  checked={isDyslexicFont}
                  onChange={(e) => setIsDyslexicFont(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Interlineado */}
            <div>
              <h4 className={`text-xs font-black uppercase tracking-wider mb-2.5 ${currentTheme.subtext}`}>Espaciado de Líneas</h4>
              <div className="flex gap-2">
                {[
                  { id: 'normal', label: '1.0' },
                  { id: 'relaxed', label: '1.5' },
                  { id: 'loose', label: '2.0' }
                ].map(lh => (
                  <button
                    key={lh.id}
                    onClick={() => setLineHeight(lh.id)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                      lineHeight === lh.id ? currentTheme.accent : 'bg-black/5 hover:bg-black/10'
                    }`}
                  >
                    {lh.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ACCESOS DIRECTOS DE VOZ EN PANTALLA */}
        <div className={`px-6 sm:px-12 py-3 border-b flex items-center gap-2 overflow-x-auto ${currentTheme.panel}`}>
          <span className={`text-[11px] font-bold ${currentTheme.subtext} mr-1 shrink-0`}>Lectura rápida:</span>
          
          <button
            onClick={() => speakSegment(0)}
            className="px-3 py-1.5 rounded-xl bg-black/5 hover:bg-black/10 text-xs font-black flex items-center gap-1.5 transition-all shrink-0 active:scale-95"
          >
            <Sparkles size={13} />
            <span>Leer todo</span>
          </button>

          <button
            onClick={speakOnlyDescription}
            className="px-3 py-1.5 rounded-xl bg-black/5 hover:bg-black/10 text-xs font-black flex items-center gap-1.5 transition-all shrink-0 active:scale-95"
          >
            <FileText size={13} />
            <span>Solo descripción</span>
          </button>

          {location && (
            <button
              onClick={speakOnlyLocation}
              className="px-3 py-1.5 rounded-xl bg-black/5 hover:bg-black/10 text-xs font-black flex items-center gap-1.5 transition-all shrink-0 active:scale-95"
            >
              <MapPin size={13} />
              <span>Solo ubicación</span>
            </button>
          )}
        </div>

        {/* ÁREA PRINCIPAL: CONTENIDO ESENCIAL LIMPIO */}
        <main className="flex-grow overflow-y-auto px-6 sm:px-12 md:px-24 lg:px-48 py-8 md:py-12">
          <div className="max-w-3xl mx-auto space-y-6">
            
            {/* Fotografía de la prenda */}
            {imageUrl && (
              <div className="mb-6 rounded-3xl overflow-hidden shadow-md max-h-[260px] flex items-center justify-center bg-black/5 p-2">
                <img src={imageUrl} alt={title} className="max-h-[250px] w-auto object-contain rounded-2xl" />
              </div>
            )}

            {/* SECCIÓN 1: TÍTULO DEL ARTÍCULO */}
            <div 
              onClick={() => speakSegment(0)}
              className={`p-5 rounded-3xl border transition-all cursor-pointer ${currentTheme.card} ${
                activeSegmentIndex === 0 ? currentTheme.highlight : 'hover:border-indigo-400'
              }`}
              title="Haz clic para escuchar el título"
            >
              <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${currentTheme.subtext}`}>
                Artículo / Prenda
              </div>
              <h1 
                style={{ fontSize: `${fontSizePx * 1.3}px` }} 
                className={`font-black tracking-tight ${isDyslexicFont ? 'font-mono' : 'font-sans'}`}
              >
                {title}
              </h1>
            </div>

            {/* SECCIÓN 2: DESCRIPCIÓN DEL ARTÍCULO */}
            <div className={`p-6 rounded-3xl border ${currentTheme.card}`}>
              <div className={`text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5 ${currentTheme.subtext}`}>
                <FileText size={13} /> Descripción
              </div>
              
              <div 
                style={{ fontSize: `${fontSizePx}px` }}
                className={`${lineHeights[lineHeight]} ${isDyslexicFont ? 'font-mono tracking-wider' : 'font-sans'} space-y-2`}
              >
                {speechSegmentsRef.current
                  .filter(s => s.type === 'description')
                  .map((segment, idx) => {
                    // El índice absoluto en speechSegmentsRef es idx + 1 (después del título)
                    const absoluteIndex = idx + 1;
                    const isActive = activeSegmentIndex === absoluteIndex;

                    return (
                      <span
                        key={idx}
                        onClick={() => speakSegment(absoluteIndex)}
                        className={`cursor-pointer transition-all duration-200 px-1.5 py-0.5 rounded-xl inline-block my-0.5 ${
                          isActive ? currentTheme.highlight : 'hover:bg-black/5'
                        }`}
                        title="Haz clic para escuchar desde aquí"
                      >
                        {segment.text}{' '}
                      </span>
                    );
                  })}
              </div>
            </div>

            {/* SECCIÓN 3: UBICACIÓN DE ENTREGA */}
            {location && (
              <div 
                onClick={speakOnlyLocation}
                className={`p-4 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all ${currentTheme.card} ${
                  activeSegmentIndex === speechSegmentsRef.current.length - 1 ? currentTheme.highlight : 'hover:border-indigo-400'
                }`}
                title="Haz clic para escuchar la ubicación"
              >
                <div className={`p-2.5 rounded-xl ${currentTheme.accent}`}>
                  <MapPin size={18} />
                </div>
                <div>
                  <div className={`text-[10px] font-black uppercase tracking-widest ${currentTheme.subtext}`}>
                    Lugar de Entrega
                  </div>
                  <div className="text-sm font-bold">
                    {location}
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>

        {/* BARRA INFERIOR DE CONTROLES DE REPRODUCCIÓN */}
        <footer className={`px-4 sm:px-8 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg ${currentTheme.panel}`}>
          
          {/* Indicador de estado */}
          <div className="flex items-center gap-2.5">
            <div className={`w-3 h-3 rounded-full ${isPlaying && !isPaused ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`} />
            <span className="text-xs font-bold">
              {isPlaying && !isPaused ? 'Leyendo contenido...' : isPaused ? 'Pausado' : 'Listo para reproducir'}
            </span>
          </div>

          {/* Botones Play / Pause / Stop */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => speakSegment(0)}
              className="p-3 rounded-2xl bg-black/5 hover:bg-black/10 text-xs font-bold transition-all active:scale-95"
              title="Reiniciar lectura desde el título"
            >
              <RotateCcw size={18} />
            </button>

            <button
              onClick={handlePlayPause}
              className={`px-7 py-3.5 rounded-2xl font-black text-xs flex items-center gap-2 shadow-lg transition-all active:scale-95 ${currentTheme.accent}`}
            >
              {isPlaying && !isPaused ? (
                <>
                  <Pause size={18} /> PAUSAR
                </>
              ) : (
                <>
                  <Play size={18} /> {isPaused ? 'REANUDAR' : 'ESCUCHAR TODO'}
                </>
              )}
            </button>

            {isPlaying && (
              <button
                onClick={handleStop}
                className="p-3 rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all font-bold active:scale-95"
                title="Detener lectura"
              >
                <Square size={18} />
              </button>
            )}
          </div>

          {/* Selector de Velocidad */}
          <div className="flex items-center gap-1 bg-black/5 p-1 rounded-2xl border border-black/10">
            <Gauge size={14} className="ml-2 text-slate-400 shrink-0" />
            {[0.75, 1, 1.25, 1.5].map((speed) => (
              <button
                key={speed}
                onClick={() => {
                  setRate(speed);
                  if (isPlaying) speakSegment(activeSegmentIndex >= 0 ? activeSegmentIndex : 0);
                }}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-black transition-all ${
                  rate === speed ? currentTheme.accent : 'opacity-60 hover:opacity-100'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>

        </footer>

      </div>
    </div>
  );
};

export default ImmersiveReaderModal;
