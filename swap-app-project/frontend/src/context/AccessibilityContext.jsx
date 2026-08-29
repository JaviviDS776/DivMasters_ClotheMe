import React, { createContext, useContext, useState, useEffect } from 'react';

const AccessibilityContext = createContext();

export const PALETTES = [
  { id: 'indigo', name: 'Índigo Real', color: '#4f46e5', light: '#eef2ff' },
  { id: 'emerald', name: 'Esmeralda', color: '#059669', light: '#ecfdf5' },
  { id: 'rose', name: 'Rubí / Rosa', color: '#e11d48', light: '#fff1f2' },
  { id: 'amber', name: 'Ámbar Cálido', color: '#d97706', light: '#fffbeb' },
  { id: 'cyan', name: 'Cian Océano', color: '#0891b2', light: '#ecfeff' },
  { id: 'violet', name: 'Violeta Místico', color: '#7c3aed', light: '#f5f3ff' }
];

export const AccessibilityProvider = ({ children }) => {
  const [palette, setPalette] = useState(() => {
    return localStorage.getItem('clotheme_palette') || 'indigo';
  });

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('clotheme_dark_mode') === 'true';
  });

  const [highContrast, setHighContrast] = useState(() => {
    return localStorage.getItem('clotheme_high_contrast') === 'true';
  });

  const [fontSize, setFontSize] = useState(() => {
    return localStorage.getItem('clotheme_font_size') || 'normal'; // 'normal' | 'large' | 'xlarge'
  });

  // Estado del Lector Inmersivo
  const [readerState, setReaderState] = useState({
    isOpen: false,
    title: '',
    description: '',
    author: '',
    location: '',
    imageUrl: ''
  });

  useEffect(() => {
    localStorage.setItem('clotheme_palette', palette);
    document.documentElement.setAttribute('data-palette', palette);
  }, [palette]);

  useEffect(() => {
    localStorage.setItem('clotheme_dark_mode', darkMode);
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('clotheme_high_contrast', highContrast);
    document.documentElement.setAttribute('data-high-contrast', highContrast ? 'true' : 'false');
    if (highContrast) {
      document.body.classList.add('high-contrast-mode');
    } else {
      document.body.classList.remove('high-contrast-mode');
    }
  }, [highContrast]);

  useEffect(() => {
    localStorage.setItem('clotheme_font_size', fontSize);
    document.documentElement.setAttribute('data-font-size', fontSize);
  }, [fontSize]);

  const openReader = (item) => {
    setReaderState({
      isOpen: true,
      title: item.title || 'Prenda en ClotheMe',
      description: item.description || 'Sin descripción detallada.',
      author: item.authorName || 'Estudiante CUALTOS',
      location: item.lockerZone || 'CUALTOS - General',
      imageUrl: item.imageUrl || ''
    });
  };

  const closeReader = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setReaderState(prev => ({ ...prev, isOpen: false }));
  };

  const toggleDarkMode = () => setDarkMode(prev => !prev);
  const toggleHighContrast = () => setHighContrast(prev => !prev);

  return (
    <AccessibilityContext.Provider
      value={{
        palette,
        setPalette,
        darkMode,
        toggleDarkMode,
        highContrast,
        toggleHighContrast,
        fontSize,
        setFontSize,
        readerState,
        openReader,
        closeReader,
        palettes: PALETTES
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility debe ser utilizado dentro de AccessibilityProvider');
  }
  return context;
};
