import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Home, ChevronDown, Check, CheckSquare, Square, Calendar, Store } from 'lucide-react';
import PowerBiRibbonChart from '../components/PowerBiRibbonChart';
import homologateFlavor from '../utils/flavorHomologation';

// =========================================================================
// CONFIGURACIÓN DE MARCAS Y COLORES CORPORATIVOS OFICIALES (NIELSEN COLOMBIA)
// =========================================================================
export const BRAND_CONFIG = {
  'ELECTROLIT': {
    name: 'Electrolit',
    color: '#118DFF',
    bgPill: '#d0e5f7',
    textPill: '#003a6b',
    borderPill: '#99c7ef'
  },
  'ELECTROLIFE': {
    name: 'Electrolife',
    color: '#70BBFF',
    bgPill: '#d5f1fc',
    textPill: '#0a6384',
    borderPill: '#8ddbf9'
  },
  'GATORADE': {
    name: 'Gatorade',
    color: '#E66C37',
    bgPill: '#ffe0cc',
    textPill: '#8f2e00',
    borderPill: '#ffb380'
  },
  'POWERADE': {
    name: 'Powerade',
    color: '#744EC2',
    bgPill: '#ede2fe',
    textPill: '#4e1088',
    borderPill: '#c9a8fc'
  },
  'PL': {
    name: 'PL',
    color: '#C9F459',
    bgPill: '#ecf8d4',
    textPill: '#3b5f06',
    borderPill: '#c5ea7c'
  },
  'PEDIALYTE': {
    name: 'Pedialyte',
    color: '#D64550',
    bgPill: '#fde2e2',
    textPill: '#881313',
    borderPill: '#f89a9a'
  },
  'SPORADE': {
    name: 'Sporade',
    color: '#3DB548',
    bgPill: '#dcfce7',
    textPill: '#14532d',
    borderPill: '#86efac'
  },
  'SUEROX': {
    name: 'Suerox',
    color: '#99700A',
    bgPill: '#fef3c7',
    textPill: '#713f12',
    borderPill: '#fcd34d'
  },
  'HIDRALYTE': {
    name: 'Hidralyte',
    color: '#F2D136',
    bgPill: '#fef9c3',
    textPill: '#854d0e',
    borderPill: '#fde047'
  },
  'GATORLIT': {
    name: 'Gatorlit',
    color: '#FF8C42',
    bgPill: '#ffedd5',
    textPill: '#9a3412',
    borderPill: '#fed7aa'
  },
  'SQUASH': {
    name: 'Squash',
    color: '#00B4D8',
    bgPill: '#cffafe',
    textPill: '#155e75',
    borderPill: '#67e8f9'
  },
  'SOLHIDREX': {
    name: 'Solhidrex',
    color: '#9D4EDD',
    bgPill: '#ede9fe',
    textPill: '#5b21b6',
    borderPill: '#c4b5fd'
  },
  'HIDRAPLUS': {
    name: 'Hidraplus',
    color: '#E056FD',
    bgPill: '#fce7f3',
    textPill: '#9d174d',
    borderPill: '#f9a8d4'
  },
  'SPORT MAS': {
    name: 'Sport Mas',
    color: '#06D6A0',
    bgPill: '#ccfbf1',
    textPill: '#115e59',
    borderPill: '#5eead4'
  },
  'HIDRASOL': {
    name: 'Hidrasol',
    color: '#4361EE',
    bgPill: '#e0e7ff',
    textPill: '#3730a3',
    borderPill: '#a5b4fc'
  },
  'ENERSAL': {
    name: 'Enersal',
    color: '#10B981',
    bgPill: '#d1fae5',
    textPill: '#065f46',
    borderPill: '#a7f3d0'
  },
  'HIDRAPLEN': {
    name: 'Hidraplen',
    color: '#06B6D4',
    bgPill: '#cffafe',
    textPill: '#155e75',
    borderPill: '#a5f3fc'
  },
  'HIDRALITOS': {
    name: 'Hidralitos',
    color: '#F59E0B',
    bgPill: '#fef3c7',
    textPill: '#92400e',
    borderPill: '#fde68a'
  },
  'SUERO ORAL': {
    name: 'Suero Oral',
    color: '#8B5CF6',
    bgPill: '#ede9fe',
    textPill: '#5b21b6',
    borderPill: '#ddd6fe'
  },
  'MAXLIT': {
    name: 'Maxlit',
    color: '#EC4899',
    bgPill: '#fce7f3',
    textPill: '#9d174d',
    borderPill: '#fbcfe8'
  },
  'FLASHLYTE': {
    name: 'Flashlyte',
    color: '#14B8A6',
    bgPill: '#ccfbf1',
    textPill: '#115e59',
    borderPill: '#99f6e4'
  },
  'PEDIASOL': {
    name: 'Pediasol',
    color: '#F43F5E',
    bgPill: '#ffe4e6',
    textPill: '#9f1239',
    borderPill: '#fecdd3'
  },
  'SALYDRAT': {
    name: 'Salydrat',
    color: '#6366F1',
    bgPill: '#e0e7ff',
    textPill: '#3730a3',
    borderPill: '#c7d2fe'
  },
  'OTRAS MARCAS': {
    name: 'Otras Marcas',
    color: '#64748B',
    bgPill: '#e2e8f0',
    textPill: '#334155',
    borderPill: '#cbd5e1'
  }
};

// Helper dinámico para obtener la configuración visual de cualquier marca
export function getBrandConfig(brandName) {
  if (!brandName) return { name: 'Desconocido', color: '#64748B', bgPill: '#e2e8f0', textPill: '#334155', borderPill: '#cbd5e1' };
  const upper = brandName.toUpperCase().trim();
  if (BRAND_CONFIG[upper]) return BRAND_CONFIG[upper];
  return {
    name: brandName,
    color: '#64748B',
    bgPill: '#e2e8f0',
    textPill: '#334155',
    borderPill: '#cbd5e1'
  };
}

// Orden de marcas estratégicas para visualización
export const STRATEGIC_BRANDS_ORDER = [
  'ELECTROLIT',
  'ELECTROLIFE',
  'GATORADE',
  'POWERADE',
  'PL',
  'PEDIALYTE',
  'SPORADE',
  'SUEROX',
  'HIDRALYTE'
];

export const ALL_CHANNELS = ['Total', 'Droguerias', 'Super Cadena', 'Superetes', 'Tradicional'];

export const REGIONS_LIST = [
  'ANTIOQUIA-CHOCO',
  'ATLANTICO',
  'CENTRO',
  'CUNDI-BOY',
  'EJE CAFETERO',
  'LLANOS',
  'PACIFICO',
  'SANTANDERES'
];

export const MONTH_NAMES_SHORT = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

const SPANISH_MONTH_SHORT = ['', 'ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

// Generador de ventana estándar de 13 meses rolling (ej. ago-25 a ago-26)
export function getRolling13Months(endYear, endMonthNum) {
  const result = [];
  let curY = endYear;
  let curM = endMonthNum;
  for (let i = 0; i < 13; i++) {
    const yrSuffix = String(curY).slice(-2);
    const mStr = SPANISH_MONTH_SHORT[curM];
    result.unshift({
      anio: curY,
      mesNum: curM,
      mesCode: `${mStr}-${yrSuffix}`
    });
    curM--;
    if (curM === 0) {
      curM = 12;
      curY--;
    }
  }
  return result;
}

// Días en el mes (para cálculo exacto de Rotación Diaria)
export function getDaysInMonth(mesNum, anio) {
  if (mesNum === 2) {
    const isLeap = (anio % 4 === 0 && anio % 100 !== 0) || (anio % 400 === 0);
    return isLeap ? 29 : 28;
  }
  if ([4, 6, 9, 11].includes(mesNum)) return 30;
  return 31;
}

// Helper para agrupar micro-marcas y evitar saturación visual en barras apiladas
function groupMicroBrands(brandUndsMap, totalUnds, minShare = 0.02) {
  let otrasUnds = 0;
  const segs = [];
  const ALWAYS_KEEP = [
    'ELECTROLIT', 'ELECTROLIFE', 'GATORADE', 'PEDIALYTE',
    'SOLHIDREX', 'HIDRAPLUS', 'HIDRALYTE', 'PL', 'SPORADE',
    'POWERADE', 'GATORLIT', 'SUEROX'
  ];

  Object.entries(brandUndsMap).forEach(([marca, val]) => {
    if (val <= 0) return;
    const share = totalUnds > 0 ? val / totalUnds : 0;
    if (share >= minShare || ALWAYS_KEEP.includes(marca)) {
      segs.push({ marca, val });
    } else {
      otrasUnds += val;
    }
  });

  if (otrasUnds > 0) {
    segs.push({ marca: 'OTRAS MARCAS', val: otrasUnds });
  }

  return segs.sort((a, b) => a.val - b.val);
}

// =========================================================================
// COMPONENTE: GRÁFICA DE BARRAS APILADAS (MIX DE MARCAS) POWER BI
// =========================================================================
const BrandMixBarChart = ({ dataBars, title = 'Mix Unidades (000)' }) => {
  const [hoveredSegment, setHoveredSegment] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  if (!dataBars || dataBars.length === 0) {
    return <div className="h-[285px] flex items-center justify-center text-xs text-slate-400">Sin datos</div>;
  }

  return (
    <div className="relative w-full h-[285px] flex flex-col justify-between pt-1 select-none">
      <div className="flex-1 flex items-end justify-center gap-6 sm:gap-8 pb-2 px-2">
        {dataBars.map((item, colIdx) => {
          const totalVal = item.totalUnds || 0;
          // Ordenar de menor a mayor para que con flex-col lo menor quede arriba y lo mayor en la base
          const sortedSegments = [...(item.segments || [])]
            .filter(seg => seg.val > 0)
            .sort((a, b) => a.val - b.val);

          // Suma de segmentos para normalizar la altura al 100% exacto de la barra
          const sumOfSegments = sortedSegments.reduce((acc, s) => acc + s.val, 0) || totalVal || 1;

          return (
            <div key={colIdx} className="flex flex-col items-center flex-1 max-w-[85px] h-full justify-end">
              {/* Total encima de la columna con estilo badge gris como Power BI */}
              <span className="text-[10px] font-bold text-slate-800 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded shadow-2xs mb-1">
                {Math.round(totalVal).toLocaleString('de-DE')}
              </span>

              {/* Columna apilada: llena al 100% sin huecos */}
              <div className="w-full bg-slate-100 rounded-sm overflow-hidden flex flex-col justify-end shadow-xs border border-slate-300/80 h-[225px]">
                {sortedSegments.map((seg, sIdx) => {
                  const heightPct = (seg.val / sumOfSegments) * 100;
                  const realPct = totalVal > 0 ? (seg.val / totalVal) * 100 : heightPct;
                  const brandCfg = getBrandConfig(seg.marca);

                  return (
                    <div
                      key={sIdx}
                      style={{
                        height: `${heightPct}%`,
                        backgroundColor: brandCfg.color || '#64748B'
                      }}
                      className="w-full flex flex-col items-center justify-center text-white font-bold leading-tight transition-opacity hover:opacity-85 cursor-pointer border-t border-white/20 overflow-hidden relative"
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoveredSegment({
                          barName: item.name,
                          marca: brandCfg.name || seg.marca,
                          val: seg.val,
                          pct: realPct,
                          total: totalVal
                        });
                        setMousePos({ x: rect.left + rect.width / 2, y: rect.top - 8 });
                      }}
                      onMouseMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setMousePos({ x: rect.left + rect.width / 2, y: rect.top - 8 });
                      }}
                      onMouseLeave={() => setHoveredSegment(null)}
                    >
                      {/* Badge con diseño no invasivo y anti-colisión */}
                      {heightPct >= 5.0 && (
                        <div className="bg-black/45 backdrop-blur-[1px] border border-white/20 px-1.5 py-0.5 rounded-[3px] text-center leading-none text-white shadow-sm pointer-events-none">
                          <span className="block text-[8px] font-black text-white leading-tight drop-shadow-xs">
                            {Math.round(seg.val).toLocaleString('de-DE')}
                          </span>
                          {heightPct >= 8.2 && (
                            <span className="block text-[7px] font-semibold text-white/95 leading-tight mt-0.5">
                              {realPct.toFixed(1)} %
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Nombre de la barra (TOTAL / CANAL / REGIÓN) */}
              <span className="text-[9.5px] font-bold text-slate-700 mt-1 uppercase truncate w-full text-center">
                {item.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Tooltip flotante oscuro */}
      {hoveredSegment && (
        <div
          className="fixed z-50 pointer-events-none bg-[#1e293b]/95 text-white rounded-lg p-2.5 shadow-2xl border border-slate-700 text-[11px] space-y-1 backdrop-blur-xs min-w-[170px]"
          style={{
            left: Math.min(mousePos.x - 85, window.innerWidth - 180),
            top: Math.max(mousePos.y - 100, 10)
          }}
        >
          <div className="flex items-center justify-between border-b border-slate-700 pb-1 mb-1">
            <span className="text-slate-400 font-bold">MARCA</span>
            <span className="font-black text-white">{hoveredSegment.marca}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Vta KPI_Cat</span>
            <span className="font-black text-white">
              {Number.isInteger(hoveredSegment.val) ? hoveredSegment.val.toLocaleString() : Number(hoveredSegment.val).toFixed(1)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Share en {hoveredSegment.barName}</span>
            <span className="font-black text-emerald-400">{hoveredSegment.pct.toFixed(1)}%</span>
          </div>
          <div className="flex items-center justify-between border-t border-slate-700 pt-1 mt-1">
            <span className="text-slate-400 font-bold">Total {hoveredSegment.barName}</span>
            <span className="font-black text-white">
              {Number.isInteger(hoveredSegment.total) ? hoveredSegment.total.toLocaleString() : Number(hoveredSegment.total).toFixed(1)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// =========================================================================
// COMPONENTE: GRÁFICO MULTILÍNEA POWER BI POR MARCA CON ANTI-COLISIÓN
// =========================================================================
const BrandPowerBiLineChart = ({ data, metricPrefix, type = 'pct', minVal = null, maxVal = null, excludeBrands = [] }) => {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(240);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleWheel = (e) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  if (!data || data.length === 0) {
    return <div className="h-[285px] flex items-center justify-center text-xs text-slate-400">Sin datos</div>;
  }

  const paddingLeft = 18;
  const paddingRight = 18;
  const minStep = 22;

  const availableWidth = Math.max(120, containerWidth - paddingLeft - paddingRight);
  const stepX = data.length > 1 ? Math.max(minStep, availableWidth / (data.length - 1)) : 30;
  const svgWidth = Math.max(containerWidth, paddingLeft + (data.length - 1) * stepX + paddingRight);
  const svgHeight = 295;
  const paddingTop = 18;
  const paddingBottom = 48;
  const plotHeight = svgHeight - paddingTop - paddingBottom;

  const activeBrands = STRATEGIC_BRANDS_ORDER
    .filter(brand => !excludeBrands.includes(brand))
    .filter(brand => 
      data.some(d => typeof d[`${metricPrefix}_${brand}`] === 'number' && d[`${metricPrefix}_${brand}`] > 0)
    );

  let globalMin = Infinity;
  let globalMax = -Infinity;

  data.forEach(d => {
    activeBrands.forEach(b => {
      const val = d[`${metricPrefix}_${b}`];
      if (typeof val === 'number' && !isNaN(val) && val > 0) {
        if (val < globalMin) globalMin = val;
        if (val > globalMax) globalMax = val;
      }
    });
  });

  if (globalMin === Infinity) { globalMin = 0; globalMax = 100; }

  let computedMin = 0;
  let computedMax = 100;

  if (type === 'price') {
    computedMin = minVal !== null ? minVal : 0;
    const step = 500;
    computedMax = globalMax > 0 ? Math.ceil((globalMax * 1.08) / step) * step : 10000;
  } else if (type === 'pct') {
    computedMin = minVal !== null ? minVal : 0;
    if (metricPrefix === 'part') {
      const step = globalMax <= 20 ? 5 : (globalMax <= 50 ? 5 : 10);
      computedMax = Math.min(100, Math.max(10, Math.ceil((globalMax * 1.15) / step) * step));
    } else if (metricPrefix === 'dist') {
      const step = 5;
      computedMax = Math.min(100, Math.max(10, Math.ceil((globalMax * 1.12) / step) * step));
    } else {
      computedMax = maxVal !== null ? maxVal : (globalMax > 0 ? Math.min(100, Math.ceil(globalMax * 1.15)) : 100);
    }
  } else if (type === 'rot') {
    computedMin = minVal !== null ? minVal : 0;
    let step = 5;
    if (globalMax <= 20) step = 2;
    else if (globalMax <= 50) step = 5;
    else if (globalMax <= 150) step = 10;
    else step = 25;
    computedMax = globalMax > 0 ? Math.max(10, Math.ceil((globalMax * 1.15) / step) * step) : 50;
  } else if (type === 'units') {
    computedMin = minVal !== null ? minVal : 0;
    let step = 10;
    if (globalMax <= 50) step = 5;
    else if (globalMax <= 200) step = 20;
    else if (globalMax <= 500) step = 50;
    else if (globalMax <= 1500) step = 100;
    else if (globalMax <= 5000) step = 250;
    else step = 500;
    computedMax = globalMax > 0 ? Math.max(10, Math.ceil((globalMax * 1.15) / step) * step) : 100;
  } else {
    computedMin = minVal !== null ? minVal : 0;
    computedMax = globalMax > 0 ? globalMax * 1.15 : 100;
  }

  const getY = (val) => {
    if (val === null || val === undefined || isNaN(val) || val <= 0) return null;
    const clamped = Math.max(computedMin, Math.min(computedMax, val));
    const ratio = (clamped - computedMin) / (computedMax - computedMin || 1);
    return paddingTop + plotHeight - ratio * plotHeight;
  };

  const getX = (idx) => paddingLeft + idx * stepX;

  const formatValue = (v) => {
    if (v === null || v === undefined) return '';
    if (type === 'pct') return `${Math.round(v)}%`;
    if (type === 'price') return `${Math.round(v).toLocaleString()}`;
    if (type === 'units' || type === 'rot') return Math.round(v).toLocaleString();
    return Math.round(v);
  };

  const formatTooltipValue = (v) => {
    if (v === null || v === undefined || isNaN(v)) return '';
    if (typeof v === 'number') {
      if (type === 'pct') {
        return `${Number(v).toFixed(1)}%`;
      }
      if (type === 'price') {
        return `$ ${Number.isInteger(v) ? v.toLocaleString() : Number(v).toFixed(1)}`;
      }
      if (type === 'rot') {
        return Number.isInteger(v) ? `${v}` : `${Number(v).toFixed(1)}`;
      }
      if (type === 'units') {
        return Number.isInteger(v) ? v.toLocaleString() : Number(v).toFixed(1);
      }
      return Number.isInteger(v) ? v.toLocaleString() : Number(v).toFixed(1);
    }
    return v;
  };

  const handleMouseMove = (e) => {
    if (!containerRef.current || !data.length) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;
    const relX = clientX - rect.left;
    const scrollLeft = containerRef.current.scrollLeft || 0;
    const effectiveX = relX + scrollLeft;

    let closestIdx = 0;
    let minDiff = Infinity;
    for (let i = 0; i < data.length; i++) {
      const ptX = getX(i);
      const diff = Math.abs(effectiveX - ptX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    }

    if (minDiff < stepX * 1.5) {
      setHoveredIndex(closestIdx);
    } else {
      setHoveredIndex(null);
    }

    const tooltipWidth = 165;
    const tooltipHeight = 220;
    let tooltipX = clientX + 14;
    if (clientX + tooltipWidth + 20 > window.innerWidth) {
      tooltipX = clientX - tooltipWidth - 14;
    }

    let tooltipY = clientY - 40;
    if (tooltipY < 15) tooltipY = 15;
    if (tooltipY + tooltipHeight > window.innerHeight - 15) {
      tooltipY = window.innerHeight - tooltipHeight - 15;
    }

    setTooltipPos({ x: tooltipX, y: tooltipY });
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[295px] overflow-x-auto overflow-y-hidden select-none custom-scrollbar"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <svg width={svgWidth} height={svgHeight} className="overflow-visible">
        {/* Líneas de cuadrícula horizontales */}
        {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
          const yPos = paddingTop + plotHeight * (1 - r);
          return (
            <line
              key={i}
              x1={paddingLeft}
              y1={yPos}
              x2={svgWidth - paddingRight}
              y2={yPos}
              stroke="#f1f5f9"
              strokeDasharray="2 2"
              strokeWidth="0.8"
            />
          );
        })}

        {/* Línea vertical de Hover */}
        {hoveredIndex !== null && (
          <line
            x1={getX(hoveredIndex)}
            y1={paddingTop - 6}
            x2={getX(hoveredIndex)}
            y2={svgHeight - paddingBottom + 5}
            stroke="#94a3b8"
            strokeDasharray="3 3"
            strokeWidth="1.2"
          />
        )}

        {/* Líneas y Puntos por cada Marca con sus Colores Respectivos */}
        {activeBrands.map(brand => {
          const brandColor = BRAND_CONFIG[brand]?.color || '#64748B';

          const points = data.map((d, i) => {
            const val = d[`${metricPrefix}_${brand}`];
            const y = getY(val);
            return y !== null ? { x: getX(i), y, val, d } : null;
          }).filter(Boolean);

          if (points.length < 1) return null;

          const pathD = points.reduce((acc, curr, idx) => 
            idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`, ''
          );

          return (
            <g key={brand}>
              {/* Línea conectora */}
              <path
                d={pathD}
                fill="none"
                stroke={brandColor}
                strokeWidth={hoveredIndex !== null ? 2.2 : 1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Puntos de datos */}
              {points.map((pt, pIdx) => (
                <circle
                  key={pIdx}
                  cx={pt.x}
                  cy={pt.y}
                  r={hoveredIndex === pIdx ? 3.6 : 2.4}
                  fill={brandColor}
                  stroke="#ffffff"
                  strokeWidth="1.0"
                  className="transition-all"
                />
              ))}
            </g>
          );
        })}

        {/* Capa de etiquetas numéricas con algoritmo alternado inteligente ("uno sí uno no") y color por marca */}
        <g className="data-labels-layer">
          {data.map((d, colIdx) => {
            const x = getX(colIdx);
            const isFirstOrLastMonth = colIdx === 0 || colIdx === data.length - 1;
            const isEvenMonth = colIdx % 2 === 0;

            const brandPhases = {
              'ELECTROLIT': 0,
              'POWERADE': 0,
              'SUEROX': 0,
              'SQUASH': 0,
              'ELECTROLIFE': 1,
              'GATORADE': 1,
              'PEDIALYTE': 1,
              'SPORADE': 1,
              'PL': 1,
              'HIDRALYTE': 1
            };

            const colPoints = [];

            activeBrands.forEach(brand => {
              const val = d[`${metricPrefix}_${brand}`];
              if (typeof val === 'number' && !isNaN(val) && val !== null && val > 0) {
                const y = getY(val);
                if (y !== null) {
                  const phase = brandPhases[brand] !== undefined ? brandPhases[brand] : 0;
                  const shouldShow = isFirstOrLastMonth || (phase === 0 && isEvenMonth) || (phase === 1 && !isEvenMonth);

                  if (shouldShow) {
                    colPoints.push({
                      brand,
                      val,
                      y,
                      color: BRAND_CONFIG[brand]?.color || '#00529B',
                      labelText: formatValue(val)
                    });
                  }
                }
              }
            });

            if (colPoints.length === 0) return null;

            // Ordenar de arriba a abajo por posición Y
            colPoints.sort((a, b) => a.y - b.y);

            // Algoritmo anti-colisión vertical
            const minGap = 12.0;
            const placed = [];

            // Forward pass (top to bottom)
            colPoints.forEach((pt) => {
              let targetY = pt.y - 8;
              if (placed.length > 0) {
                const prev = placed[placed.length - 1];
                if (targetY < prev.labelY + minGap) {
                  targetY = prev.labelY + minGap;
                }
              }
              placed.push({ ...pt, labelY: targetY });
            });

            // Backward pass (si el fondo sobrepasa el eje X inferior)
            const maxY = svgHeight - paddingBottom - 4;
            if (placed.length > 0 && placed[placed.length - 1].labelY > maxY) {
              placed[placed.length - 1].labelY = maxY;
              for (let i = placed.length - 2; i >= 0; i--) {
                if (placed[i].labelY > placed[i + 1].labelY - minGap) {
                  placed[i].labelY = placed[i + 1].labelY - minGap;
                }
              }
            }

            // Asegurar límite superior
            placed.forEach(pt => {
              pt.labelY = Math.max(paddingTop + 4, pt.labelY);
            });

            return placed.map((pt) => (
              <g key={`lbl-${pt.brand}-${colIdx}`} className="pointer-events-none select-none">
                <text
                  x={x}
                  y={pt.labelY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#ffffff"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                  fontSize="7.5"
                  fontWeight="800"
                  fontFamily="system-ui, -apple-system, sans-serif"
                >
                  {pt.labelText}
                </text>
                <text
                  x={x}
                  y={pt.labelY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={pt.color}
                  fontSize="7.5"
                  fontWeight="800"
                  fontFamily="system-ui, -apple-system, sans-serif"
                >
                  {pt.labelText}
                </text>
              </g>
            ));
          })}
        </g>

        {/* Eje X: Meses en la parte inferior */}
        {data.map((d, idx) => {
          const x = getX(idx);
          const y = svgHeight - paddingBottom + 12;
          const isHovered = hoveredIndex === idx;

          return (
            <text
              key={idx}
              x={x}
              y={y}
              transform={`rotate(-90, ${x}, ${y})`}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize="8.5"
              fontWeight={isHovered ? '900' : '600'}
              fill={isHovered ? '#00529B' : '#64748b'}
            >
              {d.mesCode}
            </text>
          );
        })}
      </svg>

      {/* Tooltip interactivo flotante fixed réplica de Marca x Canal */}
      {hoveredIndex !== null && data[hoveredIndex] && (
        <div
          className="fixed z-50 pointer-events-none bg-[#1e293b]/95 text-white rounded-lg p-2.5 shadow-2xl border border-slate-700 text-[10.5px] space-y-1 backdrop-blur-xs min-w-[160px]"
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y
          }}
        >
          <div className="font-extrabold text-slate-200 border-b border-slate-700/80 pb-1 mb-1 flex items-center justify-between">
            <span>{data[hoveredIndex].mesCode}</span>
            <span className="text-[9px] text-slate-400 font-normal">Todas las marcas</span>
          </div>
          {STRATEGIC_BRANDS_ORDER.map(brand => {
            const val = data[hoveredIndex][`${metricPrefix}_${brand}`];
            if (val === null || val === undefined || isNaN(val) || val <= 0) return null;
            return (
              <div key={brand} className="flex items-center justify-between gap-3 text-[10px]">
                <span className="flex items-center gap-1.5 font-bold" style={{ color: BRAND_CONFIG[brand]?.color || '#94a3b8' }}>
                  <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ backgroundColor: BRAND_CONFIG[brand]?.color || '#94a3b8' }} />
                  {BRAND_CONFIG[brand]?.name || brand}
                </span>
                <span className="font-black text-white">{formatTooltipValue(val)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// =========================================================================
// VISTA PRINCIPAL: CANALES X MARCA (NIELSEN COLOMBIA)
// =========================================================================
const ColombiaCanalesMarcaView = ({ onBackToPortada }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Segmentadores persistentes
  const [selectedYear, setSelectedYear] = useState(() => {
    try {
      const saved = localStorage.getItem('nielsen_co_selected_year');
      return saved ? parseInt(saved, 10) : 2026;
    } catch (e) {
      return 2026;
    }
  });
  const [selectedMonths, setSelectedMonths] = useState(() => {
    try {
      const saved = localStorage.getItem('nielsen_co_selected_months');
      return saved ? JSON.parse(saved) : [1, 2, 3, 4, 5, 6, 7, 8];
    } catch (e) {
      return [1, 2, 3, 4, 5, 6, 7, 8];
    }
  });
  const [selectedCanal, setSelectedCanal] = useState(() => {
    try {
      const saved = localStorage.getItem('nielsen_co_selected_canal');
      return saved || 'Total';
    } catch (e) {
      return 'Total';
    }
  });
  const [selectedRegion, setSelectedRegion] = useState(() => {
    try {
      const saved = localStorage.getItem('nielsen_co_selected_region');
      return saved || 'ANTIOQUIA-CHOCO';
    } catch (e) {
      return 'ANTIOQUIA-CHOCO';
    }
  });
  const [selectedFlavorMarca, setSelectedFlavorMarca] = useState(() => {
    try {
      const saved = localStorage.getItem('nielsen_co_selected_flavor_marca');
      return saved || 'ELECTROLIT';
    } catch (e) {
      return 'ELECTROLIT';
    }
  });

  // Guardar cambios en localStorage
  useEffect(() => {
    try {
      localStorage.setItem('nielsen_co_selected_year', String(selectedYear));
    } catch (e) {}
  }, [selectedYear]);

  useEffect(() => {
    try {
      localStorage.setItem('nielsen_co_selected_months', JSON.stringify(selectedMonths));
    } catch (e) {}
  }, [selectedMonths]);

  useEffect(() => {
    try {
      localStorage.setItem('nielsen_co_selected_canal', selectedCanal);
    } catch (e) {}
  }, [selectedCanal]);

  useEffect(() => {
    try {
      localStorage.setItem('nielsen_co_selected_region', selectedRegion);
    } catch (e) {}
  }, [selectedRegion]);

  useEffect(() => {
    try {
      localStorage.setItem('nielsen_co_selected_flavor_marca', selectedFlavorMarca);
    } catch (e) {}
  }, [selectedFlavorMarca]);

  // Estados de apertura de dropdowns
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
  const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);
  const [canalDropdownOpen, setCanalDropdownOpen] = useState(false);
  const [flavorMarcaDropdownOpen, setFlavorMarcaDropdownOpen] = useState(false);

  // Carga de datos unificados desde API Express
  useEffect(() => {
    fetch('/api/nielsen/co/brand-channels')
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching brand-channels data:', err);
        setLoading(false);
      });
  }, []);

  // Mes máximo por año
  const targetEndMonthNum = useMemo(() => {
    if (selectedYear === 2026) return 8;
    return 12;
  }, [selectedYear]);

  // Manejo de cambio de año
  const handleYearChange = (newYear) => {
    setSelectedYear(newYear);
    if (newYear === 2026) {
      setSelectedMonths([1, 2, 3, 4, 5, 6, 7, 8]);
    } else {
      setSelectedMonths([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    }
    setYearDropdownOpen(false);
  };

  // Toggle de selección de meses
  const toggleMonth = (mNum) => {
    if (selectedMonths.includes(mNum)) {
      if (selectedMonths.length > 1) {
        setSelectedMonths(selectedMonths.filter(m => m !== mNum));
      }
    } else {
      setSelectedMonths([...selectedMonths, mNum].sort((a, b) => a - b));
    }
  };

  // Ventana de 13 meses rolling (ej. ago-25 a ago-26)
  const rolling13MonthWindow = useMemo(() => {
    return getRolling13Months(selectedYear, targetEndMonthNum);
  }, [selectedYear, targetEndMonthNum]);

  // Lista de marcas disponibles ordenadas alfabéticamente
  const availableMarcas = useMemo(() => {
    if (!data?.nationalChannelBrandRows) return STRATEGIC_BRANDS_ORDER;
    const distinct = [...new Set(
      data.nationalChannelBrandRows
        .filter(r => r.anio === selectedYear && r.unds_k > 0)
        .map(r => r.marca)
    )];
    return distinct.sort((a, b) => a.localeCompare(b));
  }, [data, selectedYear]);

  // =========================================================================
  // FILA 1: DATOS NACIONALES (MIX DE MARCAS Y MÉTRICAS DEL CANAL SELECCIONADO)
  // =========================================================================
  const nationalData = useMemo(() => {
    if (!data?.nationalChannelBrandRows) return { mix: [], series: [] };

    const isTotalCanal = selectedCanal === 'Total' || selectedCanal === 'TOTAL';
    const BASE_CHANNELS = ['Droguerias', 'Super Cadena', 'Superetes', 'Tradicional'];

    // 1. Mix Total Nacional vs Canal Seleccionado Nacional
    const natYearRows = data.nationalChannelBrandRows.filter(
      r => r.anio === selectedYear && selectedMonths.includes(r.mesNum)
    );

    // Total Mercado Nacional (todas las marcas en canal = 'Total' o suma de 4 canales base)
    let totalNatUnds = 0;
    const totalBrandUnds = {};

    // Total Canal Seleccionado Nacional
    let canalNatUnds = 0;
    const canalBrandUnds = {};

    const hasCanalTotalRows = natYearRows.some(r => r.canal === 'Total' && (r.unds_k || 0) > 0);

    natYearRows.forEach(r => {
      const bUnds = r.unds_k || 0;
      
      // Total Mercado Nacional (sin duplicar canales secundarios)
      if (hasCanalTotalRows) {
        if (r.canal === 'Total') {
          totalNatUnds += bUnds;
          totalBrandUnds[r.marca] = (totalBrandUnds[r.marca] || 0) + bUnds;
        }
      } else if (BASE_CHANNELS.includes(r.canal)) {
        totalNatUnds += bUnds;
        totalBrandUnds[r.marca] = (totalBrandUnds[r.marca] || 0) + bUnds;
      }

      // Canal Seleccionado
      if (isTotalCanal) {
        if (hasCanalTotalRows) {
          if (r.canal === 'Total') {
            canalNatUnds += bUnds;
            canalBrandUnds[r.marca] = (canalBrandUnds[r.marca] || 0) + bUnds;
          }
        } else if (BASE_CHANNELS.includes(r.canal)) {
          canalNatUnds += bUnds;
          canalBrandUnds[r.marca] = (canalBrandUnds[r.marca] || 0) + bUnds;
        }
      } else if (r.canal === selectedCanal) {
        canalNatUnds += bUnds;
        canalBrandUnds[r.marca] = (canalBrandUnds[r.marca] || 0) + bUnds;
      }
    });

    const mix = [
      {
        name: 'TOTAL',
        totalUnds: totalNatUnds,
        segments: groupMicroBrands(totalBrandUnds, totalNatUnds, 0.02)
      },
      {
        name: selectedCanal,
        totalUnds: canalNatUnds,
        segments: groupMicroBrands(canalBrandUnds, canalNatUnds, 0.02)
      }
    ];

    // 2. Series históricas (13 meses) por marca en el canal seleccionado
    const rawSeries = rolling13MonthWindow.map(mItem => {
      const monthRows = data.nationalChannelBrandRows.filter(
        r => (isTotalCanal ? (hasCanalTotalRows ? r.canal === 'Total' : BASE_CHANNELS.includes(r.canal)) : r.canal === selectedCanal) &&
             r.anio === mItem.anio && r.mesNum === mItem.mesNum
      );
      const point = { mesCode: mItem.mesCode };

      let monthCanalTotalUnds = 0;
      monthRows.forEach(r => { monthCanalTotalUnds += (r.unds_k || 0); });

      STRATEGIC_BRANDS_ORDER.forEach(b => {
        const brandRows = monthRows.filter(r => r.marca === b);
        if (brandRows.length > 0) {
          const bUnds = brandRows.reduce((sum, r) => sum + (r.unds_k || 0), 0);
          const bVal = brandRows.reduce((sum, r) => sum + (r.val_m || 0), 0);

          if (bUnds > 0) {
            point[`part_${b}`] = monthCanalTotalUnds > 0 ? (bUnds / monthCanalTotalUnds) * 100 : null;
            point[`unds_${b}`] = bUnds;
            point[`precio_${b}`] = bVal > 0 ? (bVal / bUnds) * 1000 : null;

            // Rotación & Dist. Numérica exactas Nielsen DAX
            let sumStores = 0;
            let sumUniverse = 0;
            brandRows.forEach(r => {
              if (r.unds_k > 0 && r.rotacion > 0) {
                const stores = (r.unds_k * 1000) / r.rotacion;
                sumStores += stores;
                if (r.dist_num > 0) {
                  const universe = stores / (r.dist_num / 100);
                  sumUniverse += universe;
                }
              }
            });
            point[`rot_${b}`] = sumStores > 0 ? ((bUnds * 1000) / sumStores) : null;
            if (sumUniverse > 0 && sumStores > 0) {
              const resDist = (sumStores / sumUniverse) * 100;
              point[`dist_${b}`] = Math.min(100, resDist);
            } else {
              point[`dist_${b}`] = null;
            }
          } else {
            point[`part_${b}`] = null;
            point[`dist_${b}`] = null;
            point[`precio_${b}`] = null;
            point[`rot_${b}`] = null;
            point[`unds_${b}`] = null;
          }
        } else {
          point[`part_${b}`] = null;
          point[`dist_${b}`] = null;
          point[`precio_${b}`] = null;
          point[`rot_${b}`] = null;
          point[`unds_${b}`] = null;
        }
      });

      return point;
    });

    const firstValidIdx = rawSeries.findIndex(pt => 
      STRATEGIC_BRANDS_ORDER.some(b => typeof pt[`part_${b}`] === 'number' && pt[`part_${b}`] > 0)
    );
    const monthlySeries = firstValidIdx !== -1 ? rawSeries.slice(firstValidIdx) : rawSeries;

    return { mix, series: monthlySeries };
  }, [data, selectedYear, selectedMonths, selectedCanal, rolling13MonthWindow]);

  // =========================================================================
  // FILA 2: DATOS REGIONALES (MIX DE MARCAS Y MÉTRICAS EN REGIÓN SELECCIONADA)
  // =========================================================================
  const regionalData = useMemo(() => {
    if (!data?.regionChannelBrandRows) return { mix: [], series: [] };

    const isTotalCanal = selectedCanal === 'Total' || selectedCanal === 'TOTAL';
    const BASE_CHANNELS = ['Droguerias', 'Super Cadena', 'Superetes', 'Tradicional'];

    // 1. Mix Canal Nacional vs Canal en Región Seleccionada
    const regYearRows = data.regionChannelBrandRows.filter(
      r => r.region === selectedRegion && r.anio === selectedYear && selectedMonths.includes(r.mesNum)
    );

    let regCanalUnds = 0;
    const regBrandUnds = {};

    regYearRows.forEach(r => {
      if (isTotalCanal ? BASE_CHANNELS.includes(r.canal) : r.canal === selectedCanal) {
        const bUnds = r.unds_k || 0;
        regCanalUnds += bUnds;
        regBrandUnds[r.marca] = (regBrandUnds[r.marca] || 0) + bUnds;
      }
    });

    const mix = [
      nationalData.mix[1] || { name: selectedCanal, totalUnds: 0, segments: [] },
      {
        name: selectedRegion,
        totalUnds: regCanalUnds,
        segments: groupMicroBrands(regBrandUnds, regCanalUnds, 0.02)
      }
    ];

    // 2. Series históricas (13 meses) por marca en canal y región seleccionados
    const rawSeries = rolling13MonthWindow.map(mItem => {
      const monthRows = data.regionChannelBrandRows.filter(
        r => r.region === selectedRegion && 
             (isTotalCanal ? BASE_CHANNELS.includes(r.canal) : r.canal === selectedCanal) && 
             r.anio === mItem.anio && r.mesNum === mItem.mesNum
      );
      const point = { mesCode: mItem.mesCode };

      let monthRegCanalTotalUnds = 0;
      monthRows.forEach(r => { monthRegCanalTotalUnds += (r.unds_k || 0); });

      STRATEGIC_BRANDS_ORDER.forEach(b => {
        const brandRows = monthRows.filter(r => r.marca === b);
        if (brandRows.length > 0) {
          const bUnds = brandRows.reduce((sum, r) => sum + (r.unds_k || 0), 0);
          const bVal = brandRows.reduce((sum, r) => sum + (r.val_m || 0), 0);

          if (bUnds > 0) {
            point[`part_${b}`] = monthRegCanalTotalUnds > 0 ? (bUnds / monthRegCanalTotalUnds) * 100 : null;
            point[`unds_${b}`] = bUnds;
            point[`precio_${b}`] = bVal > 0 ? (bVal / bUnds) * 1000 : null;

            // Rotación & Dist. Numérica exactas Nielsen DAX
            let sumStores = 0;
            let sumUniverse = 0;
            brandRows.forEach(r => {
              if (r.unds_k > 0 && r.rotacion > 0) {
                const stores = (r.unds_k * 1000) / r.rotacion;
                sumStores += stores;
                if (r.dist_num > 0) {
                  const universe = stores / (r.dist_num / 100);
                  sumUniverse += universe;
                }
              }
            });
            point[`rot_${b}`] = sumStores > 0 ? ((bUnds * 1000) / sumStores) : null;
            if (sumUniverse > 0 && sumStores > 0) {
              const resDist = (sumStores / sumUniverse) * 100;
              point[`dist_${b}`] = Math.min(100, resDist);
            } else {
              point[`dist_${b}`] = null;
            }
          } else {
            point[`part_${b}`] = null;
            point[`dist_${b}`] = null;
            point[`precio_${b}`] = null;
            point[`rot_${b}`] = null;
            point[`unds_${b}`] = null;
          }
        } else {
          point[`part_${b}`] = null;
          point[`dist_${b}`] = null;
          point[`precio_${b}`] = null;
          point[`rot_${b}`] = null;
          point[`unds_${b}`] = null;
        }
      });

      return point;
    });

    const firstValidIdx = rawSeries.findIndex(pt => 
      STRATEGIC_BRANDS_ORDER.some(b => typeof pt[`part_${b}`] === 'number' && pt[`part_${b}`] > 0)
    );
    const monthlySeries = firstValidIdx !== -1 ? rawSeries.slice(firstValidIdx) : rawSeries;

    return { mix, series: monthlySeries };
  }, [data, selectedYear, selectedMonths, selectedCanal, selectedRegion, nationalData.mix, rolling13MonthWindow]);

  // =========================================================================
  // FILA 3: DATOS DE SABORES (POWER BI RIBBON CHART POR SABOR)
  // =========================================================================
  const flavorData = useMemo(() => {
    if (!data?.flavorRows) return { flavorsList: [], natSeries: [], regSeries: [], regBrandSeries: [] };

    const BASE_CHANNELS = ['Droguerias', 'Super Cadena', 'Superetes', 'Tradicional'];
    const isTotalCanal = selectedCanal === 'Total' || selectedCanal === 'TOTAL';

    // Homologar todos los sabores
    const fRowsHomologated = data.flavorRows.map(r => ({
      ...r,
      sabor: homologateFlavor(r.sabor, r.marca)
    }));

    // Sabores del canal seleccionado a nivel nacional
    const fRowsCanal = fRowsHomologated.filter(r => {
      if (isTotalCanal) {
        return (r.region === 'TOTAL' && r.canal === 'Total') || BASE_CHANNELS.includes(r.canal);
      }
      return r.canal === selectedCanal;
    });

    const flavorTotals = {};
    fRowsCanal.forEach(r => {
      flavorTotals[r.sabor] = (flavorTotals[r.sabor] || 0) + (r.unds_k || 0);
    });

    const flavorsList = Object.keys(flavorTotals)
      .filter(s => flavorTotals[s] > 0)
      .sort((a, b) => flavorTotals[b] - flavorTotals[a])
      .slice(0, 15);

    const buildSeries = (rowsFilterFn) => {
      const raw = rolling13MonthWindow.map(mItem => {
        const point = { mesCode: mItem.mesCode, total: 0 };
        flavorsList.forEach(f => { point[f] = 0; });

        fRowsHomologated
          .filter(r => r.anio === mItem.anio && r.mesNum === mItem.mesNum && rowsFilterFn(r))
          .forEach(r => {
            if (point[r.sabor] !== undefined) {
              point[r.sabor] += (r.unds_k || 0);
              point.total += (r.unds_k || 0);
            }
          });

        return point;
      });

      const firstValidIdx = raw.findIndex(pt => pt.total > 0);
      return firstValidIdx !== -1 ? raw.slice(firstValidIdx) : raw;
    };

    // 1. Serie Nacional: Canal seleccionado a nivel nacional (Total País sin duplicar)
    let natSeries = buildSeries(r => {
      if (isTotalCanal) {
        return (r.region === 'TOTAL' && r.canal === 'Total') || (r.region === 'TOTAL' && BASE_CHANNELS.includes(r.canal));
      }
      return (r.region === 'TOTAL' || !r.region) && r.canal === selectedCanal;
    });
    if (!natSeries.some(pt => pt.total > 0)) {
      natSeries = buildSeries(r => {
        if (isTotalCanal) return r.region !== 'TOTAL' && BASE_CHANNELS.includes(r.canal);
        return r.canal === selectedCanal;
      });
    }

    // 2. Serie Regional Total: Canal seleccionado en la región seleccionada
    const regSeries = buildSeries(r => {
      if (isTotalCanal) {
        return r.region === selectedRegion && BASE_CHANNELS.includes(r.canal);
      }
      return r.region === selectedRegion && r.canal === selectedCanal;
    });

    // 3. Serie Regional con Segmentador de Marca (Tarjeta 3)
    const regBrandSeries = buildSeries(r => {
      const matchBrand = r.marca === selectedFlavorMarca;
      if (isTotalCanal) {
        return r.region === selectedRegion && BASE_CHANNELS.includes(r.canal) && matchBrand;
      }
      return r.region === selectedRegion && r.canal === selectedCanal && matchBrand;
    });

    return { flavorsList, natSeries, regSeries, regBrandSeries };
  }, [data, selectedCanal, selectedRegion, selectedFlavorMarca, rolling13MonthWindow]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center font-sans">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-600">Cargando Canales x Marca...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans p-3 md:p-4 select-none space-y-3">
      
      {/* 1. CABECERA SUPERIOR */}
      <header className="bg-white rounded-xl shadow-xs border border-slate-200/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-4">
        {/* Logos (Izquierda) */}
        <div className="flex items-center gap-3">
          <img src="/assets/LOGOS/Electrolit-color.png" alt="Electrolit" className="h-7 object-contain" />
          <span className="text-slate-300 font-bold">X</span>
          <img src="/assets/LOGOS/Nielsen-logo.png" alt="Nielsen" className="h-4 object-contain" />
        </div>

        {/* Centro: Título Canales x Marca y Leyenda de Marcas Debajo */}
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <h1 className="text-base md:text-xl font-black text-[#00529B] tracking-tight">
            Canales x Marca
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-2.5 mt-1">
            {STRATEGIC_BRANDS_ORDER.map(b => (
              <div key={b} className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: BRAND_CONFIG[b]?.color }} />
                <span>{BRAND_CONFIG[b]?.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Segmentadores y Botón Home (Derecha) */}
        <div className="flex items-center gap-2">
          {/* SEGMENTADOR: AÑO (MENOR A MAYOR: 2024 -> 2026) */}
          <div className="relative">
            <button
              onClick={() => { setYearDropdownOpen(!yearDropdownOpen); setMonthDropdownOpen(false); setCanalDropdownOpen(false); }}
              className="flex items-center justify-between gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-[#00529B] min-w-[70px] shadow-2xs hover:border-[#0066c0] cursor-pointer"
            >
              <span>{selectedYear}</span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>

            {yearDropdownOpen && (
              <div className="absolute right-0 top-9 bg-white border border-slate-200 shadow-xl rounded-xl p-1 w-24 z-50 animate-in fade-in">
                {[2024, 2025, 2026].map(y => (
                  <button
                    key={y}
                    onClick={() => handleYearChange(y)}
                    className={`w-full text-left px-2 py-1 text-xs font-bold rounded-lg flex items-center justify-between transition-colors ${
                      selectedYear === y ? 'bg-[#00529B] text-white' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{y}</span>
                    {selectedYear === y && <Check className="w-3 h-3 text-white" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* SEGMENTADOR: MES (MULTI-SELECT / ÚNICO CON CHECKBOXES) */}
          <div className="relative">
            <button
              onClick={() => { setMonthDropdownOpen(!monthDropdownOpen); setYearDropdownOpen(false); setCanalDropdownOpen(false); }}
              className="flex items-center justify-between gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-[#00529B] min-w-[105px] shadow-2xs hover:border-[#0066c0] cursor-pointer"
            >
              <span className="truncate max-w-[80px]">
                {selectedMonths.length === targetEndMonthNum ? 'Todos' : `${selectedMonths.length} Selecc.`}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>

            {monthDropdownOpen && (
              <div className="absolute right-0 top-9 bg-white border border-slate-200 shadow-xl rounded-xl p-2 w-48 z-50 animate-in fade-in space-y-1">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100 text-[11px]">
                  <span className="font-bold text-slate-600">Filtrar Meses</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedMonths(Array.from({ length: targetEndMonthNum }, (_, i) => i + 1))}
                      className="text-[#00529B] hover:underline font-bold"
                    >
                      Todos
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      onClick={() => setSelectedMonths([])}
                      className="text-slate-500 hover:text-red-600 hover:underline font-bold"
                    >
                      Limpiar
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto pt-1">
                  {Array.from({ length: targetEndMonthNum }, (_, i) => i + 1).map(mNum => {
                    const isSelected = selectedMonths.includes(mNum);
                    return (
                      <button
                        key={mNum}
                        onClick={() => toggleMonth(mNum)}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-semibold text-left transition-colors ${
                          isSelected ? 'bg-blue-50 text-[#00529B] font-bold' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-3.5 h-3.5 text-[#00529B]" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        <span>{MONTH_NAMES_SHORT[mNum - 1]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* SEGMENTADOR: CANAL EN HEADER */}
          <div className="relative">
            <button
              onClick={() => { setCanalDropdownOpen(!canalDropdownOpen); setYearDropdownOpen(false); setMonthDropdownOpen(false); }}
              className="flex items-center justify-between gap-1.5 bg-[#00529B] text-white border border-[#004080] rounded-lg px-3 py-1 text-xs font-black min-w-[130px] shadow-xs hover:bg-[#004080] cursor-pointer"
            >
              <Store className="w-3.5 h-3.5 text-blue-200" />
              <span className="truncate">{selectedCanal}</span>
              <ChevronDown className="w-3 h-3 text-blue-200" />
            </button>

            {canalDropdownOpen && (
              <div className="absolute right-0 top-9 bg-white border border-slate-200 shadow-xl rounded-xl p-1 w-44 z-50 animate-in fade-in">
                {ALL_CHANNELS.map(c => (
                  <button
                    key={c}
                    onClick={() => { setSelectedCanal(c); setCanalDropdownOpen(false); }}
                    className={`w-full text-left px-2.5 py-1.5 text-xs font-bold rounded-lg flex items-center justify-between transition-colors ${
                      selectedCanal === c ? 'bg-[#00529B] text-white' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{c}</span>
                    {selectedCanal === c && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* BOTÓN HOME */}
          <button
            onClick={onBackToPortada}
            title="Regresar a Portada de Colombia"
            className="p-1.5 text-slate-500 hover:text-[#00529B] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border border-slate-200"
          >
            <Home className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. FILA 1: DATOS NACIONALES (CANAL SELECCIONADO) */}
      <section className="grid grid-cols-1 md:grid-cols-6 gap-3">
        {/* Tarjeta 1: Mix Unidades (000) */}
        <div className="bg-white rounded-xl shadow-2xs border border-slate-200/80 p-2.5 flex flex-col justify-between">
          <h2 className="text-xs font-black text-[#00529B] text-center tracking-tight mb-1">
            Mix Unidades (000)
          </h2>
          <BrandMixBarChart dataBars={nationalData.mix} />
        </div>

        {/* Tarjeta 2: Unidades (000) (a la derecha de Mix Unidades) */}
        <div className="bg-white rounded-xl shadow-2xs border border-slate-200/80 p-2.5 flex flex-col justify-between">
          <h2 className="text-xs font-black text-[#00529B] text-center tracking-tight mb-1">
            Unidades (000)
          </h2>
          <BrandPowerBiLineChart data={nationalData.series} metricPrefix="unds" type="units" minVal={0} />
        </div>

        {/* Tarjeta 3: SOM Unidades */}
        <div className="bg-white rounded-xl shadow-2xs border border-slate-200/80 p-2.5 flex flex-col justify-between">
          <h2 className="text-xs font-black text-[#00529B] text-center tracking-tight mb-1">
            SOM Unidades
          </h2>
          <BrandPowerBiLineChart data={nationalData.series} metricPrefix="part" type="pct" minVal={0} />
        </div>

        {/* Tarjeta 4: Dist. Numérica */}
        <div className="bg-white rounded-xl shadow-2xs border border-slate-200/80 p-2.5 flex flex-col justify-between">
          <h2 className="text-xs font-black text-[#00529B] text-center tracking-tight mb-1">
            Dist. Numérica
          </h2>
          <BrandPowerBiLineChart data={nationalData.series} metricPrefix="dist" type="pct" minVal={0} />
        </div>

        {/* Tarjeta 5: Precio */}
        <div className="bg-white rounded-xl shadow-2xs border border-slate-200/80 p-2.5 flex flex-col justify-between">
          <h2 className="text-xs font-black text-[#00529B] text-center tracking-tight mb-1">
            Precio
          </h2>
          <BrandPowerBiLineChart
            data={nationalData.series}
            metricPrefix="precio"
            type="price"
            minVal={0}
            excludeBrands={selectedCanal === 'Droguerias' ? ['PL'] : []}
          />
        </div>

        {/* Tarjeta 6: Rotación */}
        <div className="bg-white rounded-xl shadow-2xs border border-slate-200/80 p-2.5 flex flex-col justify-between">
          <h2 className="text-xs font-black text-[#00529B] text-center tracking-tight mb-1">
            Rotación
          </h2>
          <BrandPowerBiLineChart data={nationalData.series} metricPrefix="rot" type="rot" minVal={0} />
        </div>
      </section>

      {/* 3. SEGMENTADOR DE REGIÓN (CENTRADO Y AJUSTADO) */}
      <nav className="flex justify-center py-0.5">
        <div className="inline-flex flex-wrap items-center justify-center gap-1.5 bg-white/90 backdrop-blur-xs p-1.5 rounded-xl border border-slate-200/90 shadow-2xs">
          {REGIONS_LIST.map(r => (
            <button
              key={r}
              onClick={() => setSelectedRegion(r)}
              className={`px-3 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                selectedRegion === r
                  ? 'bg-[#00529B] text-white shadow-xs'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/60'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </nav>

      {/* 4. FILA 2: DATOS REGIONALES (CANAL SELECCIONADO EN REGIÓN SELECCIONADA) */}
      <section className="grid grid-cols-1 md:grid-cols-6 gap-3">
        {/* Tarjeta 1: Mix Unidades (000) */}
        <div className="bg-white rounded-xl shadow-2xs border border-slate-200/80 p-2.5 flex flex-col justify-between">
          <h2 className="text-xs font-black text-[#00529B] text-center tracking-tight mb-1">
            Mix Unidades (000)
          </h2>
          <BrandMixBarChart dataBars={regionalData.mix} />
        </div>

        {/* Tarjeta 2: Unidades (000) (a la derecha de Mix Unidades) */}
        <div className="bg-white rounded-xl shadow-2xs border border-slate-200/80 p-2.5 flex flex-col justify-between">
          <h2 className="text-xs font-black text-[#00529B] text-center tracking-tight mb-1">
            Unidades (000)
          </h2>
          <BrandPowerBiLineChart data={regionalData.series} metricPrefix="unds" type="units" minVal={0} />
        </div>

        {/* Tarjeta 3: SOM Unidades */}
        <div className="bg-white rounded-xl shadow-2xs border border-slate-200/80 p-2.5 flex flex-col justify-between">
          <h2 className="text-xs font-black text-[#00529B] text-center tracking-tight mb-1">
            SOM Unidades
          </h2>
          <BrandPowerBiLineChart data={regionalData.series} metricPrefix="part" type="pct" minVal={0} />
        </div>

        {/* Tarjeta 4: Dist. Numérica */}
        <div className="bg-white rounded-xl shadow-2xs border border-slate-200/80 p-2.5 flex flex-col justify-between">
          <h2 className="text-xs font-black text-[#00529B] text-center tracking-tight mb-1">
            Dist. Numérica
          </h2>
          <BrandPowerBiLineChart data={regionalData.series} metricPrefix="dist" type="pct" minVal={0} />
        </div>

        {/* Tarjeta 5: Precio */}
        <div className="bg-white rounded-xl shadow-2xs border border-slate-200/80 p-2.5 flex flex-col justify-between">
          <h2 className="text-xs font-black text-[#00529B] text-center tracking-tight mb-1">
            Precio
          </h2>
          <BrandPowerBiLineChart
            data={regionalData.series}
            metricPrefix="precio"
            type="price"
            minVal={0}
            excludeBrands={selectedCanal === 'Droguerias' ? ['PL'] : []}
          />
        </div>

        {/* Tarjeta 6: Rotación */}
        <div className="bg-white rounded-xl shadow-2xs border border-slate-200/80 p-2.5 flex flex-col justify-between">
          <h2 className="text-xs font-black text-[#00529B] text-center tracking-tight mb-1">
            Rotación
          </h2>
          <BrandPowerBiLineChart data={regionalData.series} metricPrefix="rot" type="rot" minVal={0} />
        </div>
      </section>

      {/* 5. FILA 3: SABORES / RIBBON CHARTS TIPO POWER BI */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Ribbon Chart 1: Canal Seleccionado Nacional */}
        <div className="bg-white rounded-xl shadow-2xs border border-slate-200/80 p-3 flex flex-col justify-between">
          <div className="text-center mb-1.5">
            <h3 className="text-xs font-black text-[#00529B]">Unidades (000)</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase">{selectedCanal}</p>
          </div>
          <PowerBiRibbonChart
            series={flavorData.natSeries}
            flavorsList={flavorData.flavorsList}
            height={200}
          />
        </div>

        {/* Ribbon Chart 2: Región Seleccionada en Canal Seleccionado */}
        <div className="bg-white rounded-xl shadow-2xs border border-slate-200/80 p-3 flex flex-col justify-between">
          <div className="text-center mb-1.5">
            <h3 className="text-xs font-black text-[#00529B]">Unidades (000)</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase">{selectedRegion}</p>
          </div>
          <PowerBiRibbonChart
            series={flavorData.regSeries}
            flavorsList={flavorData.flavorsList}
            height={200}
          />
        </div>

        {/* Ribbon Chart 3: Región Seleccionada con Segmentador de Marca */}
        <div className="bg-white rounded-xl shadow-2xs border border-slate-200/80 p-3 flex flex-col justify-between">
          <div className="relative flex items-center justify-center mb-1.5">
            <div className="text-center">
              <h3 className="text-xs font-black text-[#00529B]">Unidades (000)</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase">{selectedRegion}</p>
            </div>

            {/* Segmentador de Marca (Tarjeta 3) */}
            <div className="absolute right-0 top-0">
              <button
                onClick={() => setFlavorMarcaDropdownOpen(!flavorMarcaDropdownOpen)}
                className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-md px-2 py-0.5 text-[10px] font-black text-[#00529B] hover:border-[#0066c0] cursor-pointer"
              >
                <span>{BRAND_CONFIG[selectedFlavorMarca]?.name || selectedFlavorMarca}</span>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              {flavorMarcaDropdownOpen && (
                <div className="absolute right-0 top-7 bg-white border border-slate-200 shadow-xl rounded-lg p-1 w-36 z-50 animate-in fade-in max-h-44 overflow-y-auto">
                  {availableMarcas.map(brand => (
                    <button
                      key={brand}
                      onClick={() => { setSelectedFlavorMarca(brand); setFlavorMarcaDropdownOpen(false); }}
                      className={`w-full text-left px-2 py-1 text-[10.5px] font-bold rounded flex items-center justify-between transition-colors ${
                        selectedFlavorMarca === brand ? 'bg-[#00529B] text-white' : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="truncate">{BRAND_CONFIG[brand]?.name || brand}</span>
                      {selectedFlavorMarca === brand && <Check className="w-3 h-3 text-white" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <PowerBiRibbonChart
            series={flavorData.regBrandSeries}
            flavorsList={flavorData.flavorsList}
            height={200}
          />
        </div>
      </section>

    </div>
  );
};

export default ColombiaCanalesMarcaView;
