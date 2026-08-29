// frontend/src/services/aiModerationService.js
import * as tf from '@tensorflow/tfjs';
import * as nsfwjs from 'nsfwjs';

let modelPromise = null;

/**
 * Carga el modelo de Red Neuronal Profunda de NSFWJS (MobileNetV2)
 */
export const loadNSFWModel = async () => {
  if (!modelPromise) {
    console.log('🤖 Cargando modelo de Inteligencia Artificial NSFW...');
    // Carga el modelo preentrenado optimizado para navegador
    modelPromise = nsfwjs.load('MobileNetV2');
  }
  return modelPromise;
};

/**
 * Clasifica una imagen mediante Deep Learning en 5 categorías:
 * - Porn (Pornografía / Actividad explícita)
 * - Hentai (Anime / Ilustración explícita)
 * - Sexy (Desnudez parcial / Lencería / Escote excesivo)
 * - Neutral (Ropa normal / Objetos / Seguro)
 * - Drawing (Dibujos seguros)
 */
export const checkImageNSFW = async (imageElement) => {
  try {
    const model = await loadNSFWModel();
    const predictions = await model.classify(imageElement);
    console.log('📊 Predicciones de IA para la imagen:', predictions);

    const pornProb = predictions.find(p => p.className === 'Porn')?.probability || 0;
    const hentaiProb = predictions.find(p => p.className === 'Hentai')?.probability || 0;
    const sexyProb = predictions.find(p => p.className === 'Sexy')?.probability || 0;
    const neutralProb = predictions.find(p => p.className === 'Neutral')?.probability || 0;
    const drawingProb = predictions.find(p => p.className === 'Drawing')?.probability || 0;

    // Reglas de decisión estrictas:
    // 1. Pornografía o Hentai superior al 20%
    if (pornProb > 0.20 || hentaiProb > 0.20) {
      return {
        safe: false,
        reason: `La IA detectó contenido explícito o pornográfico (${((Math.max(pornProb, hentaiProb)) * 100).toFixed(0)}% de coincidencia).`,
        category: 'Porn / Hentai',
        predictions
      };
    }

    // 2. Contenido altamente provocativo / lencería / desnudez parcial superior al 50%
    if (sexyProb > 0.50) {
      return {
        safe: false,
        reason: `La IA detectó contenido con desnudez parcial o no apto (${(sexyProb * 100).toFixed(0)}% de coincidencia). Por favor sube una foto clara de la prenda.`,
        category: 'Sexy / Revealing',
        predictions
      };
    }

    return {
      safe: true,
      category: 'Neutral / Safe',
      confidence: ((neutralProb + drawingProb) * 100).toFixed(0),
      predictions
    };
  } catch (error) {
    console.error('Error al clasificar imagen con IA:', error);
    // En caso de error técnico del modelo, permitir continuar con los filtros del servidor
    return { safe: true, warning: 'No se pudo completar el análisis local de IA' };
  }
};
