// backend/src/services/moderationService.js

// Lista de términos prohibidos / inapropiados y filtro anti-pornografía (NSFW)
const PROHIBITED_KEYWORDS = [
  // Filtro Anti-Pornografía y Contenido Explícito
  'porno', 'porn', 'pornografía', 'pornografia', 'xxx', 'hentai', 'nsfw', 
  'erotico', 'erotica', 'erótico', 'erótica', 'nude', 'nudes', 'desnudo', 
  'desnuda', 'desnudez', 'topless', 'pack', 'fotos intimas', 'sexo', 'sexual', 
  'anal', 'onlyfans', 'escort', 'camgirl', 'prostitución', 'fetiche', 'fetish',
  'lencería usada', 'lenceria usada', 'ropa interior usada', 'calzones usados',
  'tangas usadas', 'pack de fotos', 'contenido para adultos', '+18',
  
  // Sustancias y Drogas
  'droga', 'drogas', 'marihuana', 'cocaína', 'cocaina', 'metanfetamina', 'fentanilo', 'tachas',
  
  // Armas y Violencia
  'arma', 'armas', 'pistola', 'cuchillo', 'navaja', 'munición', 'municion',
  'violencia', 'amenaza', 'suicidio',
  
  // Fraude y Odio
  'fraude', 'estafa', 'hack', 'tarjeta clonada', 'odio', 'nazi', 'racista', 'discriminación'
];

const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Valida si un texto contiene lenguaje ofensivo, prohibido o de riesgo.
 */
const moderateText = (title = '', description = '') => {
  const fullText = ` ${title} ${description} `.toLowerCase();

  for (const word of PROHIBITED_KEYWORDS) {
    const escaped = escapeRegex(word.toLowerCase());
    // Si la palabra contiene espacios o símbolos, usar coincidencia directa
    if (/\W/.test(word)) {
      if (fullText.includes(word.toLowerCase())) {
        return {
          approved: false,
          reason: `El contenido contiene términos inapropiados o prohibidos ("${word}"). Recuerda que ClotheMe es una plataforma universitaria para ropa y accesorios.`
        };
      }
    } else {
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      if (regex.test(fullText)) {
        return {
          approved: false,
          reason: `El contenido contiene términos inapropiados o prohibidos ("${word}"). Recuerda que ClotheMe es una plataforma universitaria para ropa y accesorios.`
        };
      }
    }
  }

  // Título demasiado corto o sin sentido
  if (title.trim().length < 3) {
    return {
      approved: false,
      reason: 'El título debe tener al menos 3 caracteres descriptivos.'
    };
  }

  return { approved: true };
};

/**
 * Valida la integridad y seguridad del archivo de imagen antes de procesarlo.
 */
const moderateImageBuffer = (file) => {
  if (!file || !file.buffer) {
    return {
      approved: false,
      reason: 'No se recibió ningún archivo de imagen válido.'
    };
  }

  // 1. Validar Tipo MIME
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (!allowedMimeTypes.includes(file.mimetype.toLowerCase())) {
    return {
      approved: false,
      reason: 'Formato de imagen no permitido. Solo se aceptan JPEG, PNG y WEBP.'
    };
  }

  // 2. Validar tamaño máximo (5MB)
  const MAX_SIZE = 5 * 1024 * 1024;
  if (file.buffer.length > MAX_SIZE) {
    return {
      approved: false,
      reason: 'El tamaño de la imagen excede el límite permitido de 5 MB.'
    };
  }

  // 3. Inspeccionar firmas de bytes mágicos (Magic Bytes) para evitar scripts camuflados
  const buffer = file.buffer;
  const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
  const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
  const isWebp = buffer.slice(0, 4).toString('ascii') === 'RIFF' && buffer.slice(8, 12).toString('ascii') === 'WEBP';

  if (!isJpeg && !isPng && !isWebp) {
    return {
      approved: false,
      reason: 'La estructura interna del archivo no corresponde a una imagen válida.'
    };
  }

  // 4. Búsqueda de scripts maliciosos incrustados en metadatos
  const bufferString = buffer.toString('utf-8', 0, Math.min(buffer.length, 4096)).toLowerCase();
  const dangerousPatterns = ['<script', 'javascript:', '<?php', 'eval(', 'onerror=', 'onload='];
  for (const pattern of dangerousPatterns) {
    if (bufferString.includes(pattern)) {
      return {
        approved: false,
        reason: 'La imagen contiene metadatos potencialmente maliciosos o corruptos.'
      };
    }
  }

  return { approved: true };
};

module.exports = {
  moderateText,
  moderateImageBuffer
};
