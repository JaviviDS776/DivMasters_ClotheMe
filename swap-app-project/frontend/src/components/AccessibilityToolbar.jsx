import React, { useState } from 'react';
import { 
  Eye, 
  Palette, 
  Sparkles, 
  Sun, 
  Moon,
  Volume2, 
  X, 
  Check, 
  Sliders, 
  ZoomIn, 
  Contrast, 
  HelpCircle,
  Accessibility
} from 'lucide-react';
import { useAccessibility, PALETTES } from '../context/AccessibilityContext';

const AccessibilityToolbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    palette, 
    setPalette, 
    darkMode,
    toggleDarkMode,
    highContrast, 
    toggleHighContrast, 
    fontSize, 
    setFontSize,
    openReader 
  } = useAccessibility();

  const handleGlobalReader = () => {
    openReader({
      title: 'ClotheMe - Plataforma de Trueques CUALTOS',
      description: 'Bienvenido a ClotheMe, el sistema de intercambio sustentable de ropa para estudiantes del Centro Universitario de los Altos (CUALTOS). Puedes explorar prendas, proponer trueques y coordinar entregas anónimas y seguras en casilleros automatizados.',
      author: 'Comunidad CUALTOS',
      location: 'CUALTOS - Módulos de Casilleros',
      imageUrl: ''
    });
    setIsOpen(false);
  };

  return (
    <>
      {/* Botón Flotante Disparador de Accesibilidad */}
      <aside 
        aria-label="Herramientas de accesibilidad"
        className="fixed bottom-20 md:bottom-6 right-6 z-[90] flex items-center"
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`p-3.5 rounded-full shadow-2xl transition-all duration-300 flex items-center gap-2 font-black text-xs active:scale-95 ${
            isOpen || highContrast
              ? 'bg-black text-white ring-4 ring-indigo-500/30'
              : 'bg-white text-slate-800 border border-slate-200 hover:bg-slate-50'
          }`}
          title="Opciones de Accesibilidad, Paletas y Lector"
          aria-label="Abrir panel de accesibilidad"
        >
          <Accessibility size={22} className="text-indigo-600 animate-pulse" />
          <span className="hidden sm:inline font-black tracking-wider text-[11px]">ACCESIBILIDAD</span>
        </button>
      </aside>

      {/* Modal / Panel Desplegable de Accesibilidad */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-end sm:justify-center p-3 sm:p-6 z-[100] animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="bg-white rounded-[2.5rem] p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 relative animate-in slide-in-from-bottom-6 duration-300 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Accessibility size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 leading-tight">Accesibilidad y Tema</h3>
                  <p className="text-xs text-slate-500 font-medium">Personaliza tu experiencia visual</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* SECCIÓN 1: PALETAS DE COLORES */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Palette size={14} className="text-indigo-600" /> Paleta de Colores
                </h4>
                <span className="text-[10px] font-bold text-slate-500 capitalize">{palette}</span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {PALETTES.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setPalette(p.id);
                    }}
                    className={`p-2.5 rounded-2xl border-2 transition-all flex flex-col items-center gap-1.5 group ${
                      palette === p.id && !highContrast
                        ? 'border-slate-800 bg-slate-50 shadow-sm scale-105'
                        : 'border-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div 
                      className="w-7 h-7 rounded-full shadow-inner flex items-center justify-center text-white"
                      style={{ backgroundColor: p.color }}
                    >
                      {palette === p.id && !highContrast && <Check size={14} strokeWidth={3} />}
                    </div>
                    <span className="text-[10px] font-black text-slate-700 truncate max-w-full">
                      {p.name.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* SECCIÓN 2: MODO OSCURO */}
            <div className="mb-4 bg-slate-50 p-4 rounded-3xl border border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${darkMode ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 shadow-sm'}`}>
                    {darkMode ? <Moon size={18} /> : <Sun size={18} />}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">Modo Oscuro</h4>
                    <p className="text-[11px] text-slate-500">{darkMode ? 'Tema oscuro activado' : 'Tema claro estándar'}</p>
                  </div>
                </div>

                <button
                  onClick={toggleDarkMode}
                  className={`w-12 h-7 rounded-full p-1 transition-all duration-300 flex items-center ${
                    darkMode ? 'bg-indigo-600 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-md" />
                </button>
              </div>
            </div>

            {/* SECCIÓN 3: MODO DE ALTO CONTRASTE */}
            <div className="mb-6 bg-slate-50 p-4 rounded-3xl border border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${highContrast ? 'bg-black text-yellow-300' : 'bg-white text-slate-700 shadow-sm'}`}>
                    <Contrast size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">Modo Alto Contraste</h4>
                    <p className="text-[11px] text-slate-500">Máxima legibilidad y contraste oscuro</p>
                  </div>
                </div>

                <button
                  onClick={toggleHighContrast}
                  className={`w-12 h-7 rounded-full p-1 transition-all duration-300 flex items-center ${
                    highContrast ? 'bg-black justify-end border-2 border-yellow-300' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full ${highContrast ? 'bg-yellow-300' : 'bg-white shadow-md'}`} />
                </button>
              </div>
            </div>

            {/* SECCIÓN 3: ESCALA DE TAMAÑO DE TEXTO */}
            <div className="mb-6">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <ZoomIn size={14} className="text-indigo-600" /> Tamaño de Texto
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'normal', label: 'Normal', scale: '100%' },
                  { id: 'large', label: 'Grande', scale: '112%' },
                  { id: 'xlarge', label: 'Muy Grande', scale: '125%' }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFontSize(f.id)}
                    className={`py-2.5 px-3 rounded-2xl text-xs font-black border-2 transition-all flex flex-col items-center ${
                      fontSize === f.id
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-sm'
                        : 'border-slate-100 text-slate-600 hover:border-slate-200'
                    }`}
                  >
                    <span>{f.label}</span>
                    <span className="text-[9px] opacity-60 font-semibold">{f.scale}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* SECCIÓN 4: ACCESO AL LECTOR INMERSIVO */}
            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={handleGlobalReader}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 px-4 rounded-2xl font-black text-xs tracking-wider transition-all shadow-lg shadow-indigo-100 active:scale-95 flex items-center justify-center gap-2"
              >
                <Volume2 size={16} />
                ABRIR LECTOR INMERSIVO (VOZ)
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default AccessibilityToolbar;
