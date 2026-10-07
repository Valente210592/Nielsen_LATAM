/**
 * Diccionario de Homologación de Sabores Nielsen Colombia
 * Homologación oficial proporcionada por el usuario para clasificación limpia y unificada.
 */

// Mapeo específico por [Sabor_Raw + Marca] o [Sabor_Raw general]
const EXACT_HOMOLOGATION_RULES = [
  // BLUE RASPBERRY
  { raw: 'BLUEBERRY', marca: 'HIDRALYTE', target: 'BLUE RASPBERRY' },
  { raw: 'BLUEBERRY', marca: 'SPORADE', target: 'BLUE RASPBERRY' },
  { raw: 'COOL CITRUS', marca: 'POWERADE', target: 'BLUE RASPBERRY' },
  { raw: 'FRUTOS AZULES', target: 'BLUE RASPBERRY' },
  { raw: 'MOUNTAIN BLAST', marca: 'POWERADE', target: 'BLUE RASPBERRY' },
  { raw: 'RADICAL BLUE', marca: 'ELECTROLIFE', target: 'BLUE RASPBERRY' },

  // CEREZA
  { raw: 'CEREZA', target: 'CEREZA' },
  { raw: 'CEREZA LIMON', target: 'CEREZA' },

  // COCO
  { raw: 'COCO', target: 'COCO' },
  { raw: 'COCO LIMON', target: 'COCO' },

  // FRESA
  { raw: 'FRESA', target: 'FRESA' },

  // FRESA/KIWI
  { raw: 'FRESA/KIWI', target: 'FRESA/KIWI' },
  { raw: 'FRESA-KIWI', target: 'FRESA/KIWI' },
  { raw: 'KIWI FRESA', target: 'FRESA/KIWI' },

  // PONCHE DE FRUTAS
  { raw: 'PONCHE DE FRUTAS', target: 'PONCHE DE FRUTAS' },
  { raw: 'PONCHE', target: 'PONCHE DE FRUTAS' },
  { raw: 'FRUTAS TROPICALES', target: 'PONCHE DE FRUTAS' },
  { raw: 'FRUTOS TROPICALES', target: 'PONCHE DE FRUTAS' },
  { raw: 'FRUTOS ROJOS', target: 'PONCHE DE FRUTAS' },
  { raw: 'TROPICAL', target: 'PONCHE DE FRUTAS' },
  { raw: 'TROPICAL CITRUS', target: 'PONCHE DE FRUTAS' },

  // GUARANA
  { raw: 'GUARANA', target: 'GUARANA' },

  // JAMAICA
  { raw: 'JAMAICA', target: 'JAMAICA' },

  // LIMON
  { raw: 'LIMA/LIMON', target: 'LIMON' },
  { raw: 'LIMA', target: 'LIMON' },
  { raw: 'LIMON', target: 'LIMON' },
  { raw: 'LIMON CEREZA', target: 'LIMON' },
  { raw: 'LIMONADA', target: 'LIMON' },
  { raw: 'LIMONADA ROSADA', target: 'LIMON' },
  { raw: 'LIMON ICE', target: 'LIMON' },

  // NARANJA
  { raw: 'MANDARINA', target: 'NARANJA' },
  { raw: 'NARANJA', target: 'NARANJA' },
  { raw: 'NARANJA BANANO', target: 'NARANJA' },
  { raw: 'NARANJA FRESA', target: 'NARANJA' },
  { raw: 'NARANJA MANDARINA', target: 'NARANJA' },
  { raw: 'NARANJA PINA', target: 'NARANJA' },
  { raw: 'NARANJA/MANDARINA', target: 'NARANJA' },

  // MANZANA
  { raw: 'MANZANA', target: 'MANZANA' },

  // MARACUYA
  { raw: 'MARACUYA', target: 'MARACUYA' },
  { raw: 'MARACUYÁ', target: 'MARACUYA' },
  { raw: 'MARACUYA LULO', target: 'MARACUYA' },

  // MORA AZUL
  { raw: 'MORA', target: 'MORA AZUL' },
  { raw: 'MORA AZUL', target: 'MORA AZUL' },
  { raw: 'MORA AZUL/HIERBABUENA', target: 'MORA AZUL' },

  // PIÑA
  { raw: 'PIÑA', target: 'PIÑA' },
  { raw: 'PINA', target: 'PIÑA' },
  { raw: 'PINA COCO', target: 'PIÑA' },

  // UVA
  { raw: 'UVA', target: 'UVA' },

  // OTROS SABORES
  { raw: 'DURAZNO', target: 'OTROS SABORES' },
  { raw: 'FRAMBUESA', target: 'OTROS SABORES' },
  { raw: 'FRESANDIA', target: 'OTROS SABORES' },
  { raw: 'FRUTO DEL DRAGON', target: 'OTROS SABORES' },
  { raw: 'FRUTOS AMARILLOS', target: 'OTROS SABORES' },
  { raw: 'FRUTOS SILVESTRES', target: 'OTROS SABORES' },
  { raw: 'FRUTOS VERDES', target: 'OTROS SABORES' },
  { raw: 'MANZANA ROJA', target: 'OTROS SABORES' },
  { raw: 'MANZANA VERDE', target: 'OTROS SABORES' },
  { raw: 'MIX FRUTAL', target: 'OTROS SABORES' },
  { raw: 'NOT DETERMINED', target: 'OTROS SABORES' },
  { raw: 'OTROS SABORES', target: 'OTROS SABORES' },
  { raw: 'SANDIA', target: 'OTROS SABORES' },
  { raw: 'SANDIA CEREZA', target: 'OTROS SABORES' },
  { raw: 'SANDIA LIMON', target: 'OTROS SABORES' },
  { raw: 'SURTIDO', target: 'OTROS SABORES' },
  { raw: 'TORONJA', target: 'OTROS SABORES' },
  { raw: 'TUTTI FRUTTI', target: 'OTROS SABORES' },
  { raw: 'VAINILLA', target: 'OTROS SABORES' }
];

export function homologateFlavor(rawFlavor, brandName = '') {
  if (!rawFlavor) return 'OTROS SABORES';
  const cleanRaw = rawFlavor.trim().toUpperCase();
  const cleanBrand = brandName ? brandName.trim().toUpperCase() : '';

  // 1. Buscar regla exacta combinando Raw + Marca
  if (cleanBrand) {
    const specificMatch = EXACT_HOMOLOGATION_RULES.find(
      r => r.raw.toUpperCase() === cleanRaw && r.marca && r.marca.toUpperCase() === cleanBrand
    );
    if (specificMatch) return specificMatch.target;
  }

  // 2. Buscar regla general por Raw
  const generalMatch = EXACT_HOMOLOGATION_RULES.find(
    r => r.raw.toUpperCase() === cleanRaw && !r.marca
  );
  if (generalMatch) return generalMatch.target;

  // 3. Fallback inteligente
  if (cleanRaw.includes('PONCHE') || cleanRaw.includes('TROPICAL') || cleanRaw.includes('ROJOS')) return 'PONCHE DE FRUTAS';
  if (cleanRaw.includes('NARANJA') || cleanRaw.includes('MANDARINA')) return 'NARANJA';
  if (cleanRaw.includes('KIWI') || cleanRaw.includes('FRESA/KIWI')) return 'FRESA/KIWI';
  if (cleanRaw.includes('FRESA')) return 'FRESA';
  if (cleanRaw.includes('MORA')) return 'MORA AZUL';
  if (cleanRaw.includes('BLUE')) return 'BLUE RASPBERRY';
  if (cleanRaw.includes('MARACUY') || cleanRaw.includes('PIÑA') || cleanRaw.includes('PINA')) return 'MARACUYA';
  if (cleanRaw.includes('LIMON') || cleanRaw.includes('LIMA')) return 'LIMON';
  if (cleanRaw.includes('MANZANA')) return 'MANZANA';
  if (cleanRaw.includes('UVA')) return 'UVA';
  if (cleanRaw.includes('COCO')) return 'COCO';
  if (cleanRaw.includes('JAMAICA')) return 'JAMAICA';

  return 'OTROS SABORES';
}

export default homologateFlavor;
