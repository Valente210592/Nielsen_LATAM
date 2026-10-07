import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Home, ChevronDown, Check, CheckSquare, Square } from 'lucide-react';
import PowerBiRibbonChart from '../components/PowerBiRibbonChart';
import homologateFlavor from '../utils/flavorHomologation';

const CHANNEL_CONFIG = {
  'Droguerias': {
    name: 'Droguerías',
    color: '#6aa84f',
    bgPill: '#e2f4db',
    textPill: '#274e13',
    borderPill: '#b6d7a8',
    labelOffset: -12
  },
  'Super Cadena': {
    name: 'Super Cadena',
    color: '#3c78d8',
    bgPill: '#d9e8fb',
    textPill: '#1155cc',
    borderPill: '#a4c2f4',
    labelOffset: 12
  },
  'Superetes': {
    name: 'Superetes',
    color: '#a64d79',
    bgPill: '#ead1dc',
    textPill: '#741b47',
    borderPill: '#d5a6bd',
    labelOffset: 12
  },
  'Tradicional': {
    name: 'Tradicional',
    color: '#c05621',
    bgPill: '#fce5cd',
    textPill: '#783f04',
    borderPill: '#f9cb9c',
    labelOffset: -12
  }
};

const CHANNEL_ORDER = ['Droguerias', 'Super Cadena', 'Superetes', 'Tradicional'];
const STACK_ORDER = ['Droguerias', 'Super Cadena', 'Superetes', 'Tradicional'];

const FLAVOR_COLORS = [
  '#d4a373', '#e07a5f', '#3d5a80', '#98c1d9', '#ee6c4d',
  '#293241', '#81b29a', '#f2cc8f', '#e76f51', '#2a9d8f',
  '#e9c46a', '#f4a261', '#457b9d', '#1d3557', '#6b705c'
];

const REGIONES_LIST = [
  'ANTIOQUIA-CHOCO',
  'ATLANTICO',
  'CENTRO',
  'CUNDI-BOY',
  'EJE CAFETERO',
  'LLANOS',
  'PACIFICO',
  'SANTANDERES'
];

const SPANISH_MONTH_SHORT = ['', 'ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const ALL_MONTH_ITEMS = [
  { num: 1, short: 'Ene' },
  { num: 2, short: 'Feb' },
  { num: 3, short: 'Mar' },
  { num: 4, short: 'Abr' },
  { num: 5, short: 'May' },
  { num: 6, short: 'Jun' },
  { num: 7, short: 'Jul' },
  { num: 8, short: 'Ago' },
  { num: 9, short: 'Sep' },
  { num: 10, short: 'Oct' },
  { num: 11, short: 'Nov' },
  { num: 12, short: 'Dic' },
];

function getRolling13Months(endYear, endMonthNum) {
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

// =========================================================================
// COMPONENTE: TARJETA MIX UNIDADES CON ETIQUETAS Y TOOLTIP CON SMART FLIP
// =========================================================================
const MixUnidadesCard = ({ title, mixData }) => {
  const [hoveredSegment, setHoveredSegment] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  return (
    <div className="bg-white rounded-xl p-2.5 border border-slate-200/90 shadow-2xs flex flex-col justify-between relative">
      <div className="text-center font-bold text-[#00529B] text-[11px] border-b border-dashed border-blue-200 pb-1 mb-1">
        {title}
      </div>

      <div className="h-[280px] flex items-end justify-center gap-4 px-2 relative">
        {mixData.map((item) => {
          const totalUnds = item.totalUnds || 0;

          return (
            <div key={item.name} className="flex-1 flex flex-col items-center max-w-[85px] h-full justify-end">
              {/* Badge superior con el Total redondeado */}
              <div className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-[10px] font-black text-slate-800 mb-1.5 shadow-2xs text-center w-full max-w-[70px]">
                {Math.round(totalUnds).toLocaleString()}
              </div>

              {/* Barra Apilada */}
              <div className="w-full flex flex-col-reverse rounded-t overflow-hidden h-[215px] border border-slate-300 bg-slate-100">
                {STACK_ORDER.map((canal) => {
                  const cfg = CHANNEL_CONFIG[canal];
                  const val = item[canal] || 0;
                  const pct = totalUnds > 0 ? (val / totalUnds) * 100 : 0;
                  if (pct <= 0) return null;

                  return (
                    <div
                      key={canal}
                      style={{ height: `${pct}%`, backgroundColor: cfg.color }}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const isRightSide = rect.left > window.innerWidth / 2;
                        const posX = isRightSide ? rect.left - 180 : rect.right + 10;
                        setMousePos({ x: posX, y: rect.top });
                        setHoveredSegment({
                          canal,
                          val,
                          pct,
                          total: totalUnds,
                          barName: item.name
                        });
                      }}
                      onMouseLeave={() => setHoveredSegment(null)}
                      className="w-full flex flex-col items-center justify-center text-white font-black leading-tight border-b border-white/20 transition-opacity hover:opacity-90 cursor-pointer"
                    >
                      <span className="text-[9.5px] drop-shadow-xs">
                        {Math.round(val).toLocaleString()}
                      </span>
                      <span className="text-[8.5px] opacity-95">
                        {pct.toFixed(1)} %
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Nombre de la barra (TOTAL / MARCA / REGIÓN) */}
              <span className="text-[9px] font-bold text-slate-700 mt-1 uppercase truncate w-full text-center">
                {item.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Tooltip oscuro de Mix Unidades con Smart Flip */}
      {hoveredSegment && (
        <div 
          className="fixed z-50 pointer-events-none bg-[#1e293b]/95 text-white rounded-lg p-2.5 shadow-2xl border border-slate-700 text-[11px] space-y-1 backdrop-blur-xs min-w-[170px]"
          style={{
            left: mousePos.x,
            top: mousePos.y
          }}
        >
          <div className="flex items-center justify-between border-b border-slate-700 pb-1 mb-1">
            <span className="text-slate-400 font-bold">CANAL</span>
            <span className="font-black text-white">{hoveredSegment.canal}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Vta KPI_Cat</span>
            <span className="font-black text-white">{Math.round(hoveredSegment.val).toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Share Marca x Canal</span>
            <span className="font-black text-emerald-400">{hoveredSegment.pct.toFixed(1)} %</span>
          </div>
          <div className="flex items-center justify-between border-t border-slate-700 pt-1 mt-1">
            <span className="text-slate-400 font-bold">Total</span>
            <span className="font-black text-white">{Math.round(hoveredSegment.total).toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// =========================================================================
// COMPONENTE DE LÍNEAS TIPO POWER BI (CON DISTRIBUCIÓN RESPONSIVA EXACTA)
// =========================================================================
const PowerBiLineChart = ({ data, metricPrefix, type = 'pct', minVal = 0, maxVal = null }) => {
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

  // Soporte de desplazamiento horizontal fluido con la rueda del ratón
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
    return <div className="h-[280px] flex items-center justify-center text-xs text-slate-400">Sin datos</div>;
  }

  const paddingLeft = 24;
  const paddingRight = 24;
  const minStep = 28;

  // Distribuir de forma uniforme en el ancho disponible de la tarjeta
  const availableWidth = Math.max(120, containerWidth - paddingLeft - paddingRight);
  const stepX = data.length > 1 ? Math.max(minStep, availableWidth / (data.length - 1)) : 40;
  const svgWidth = Math.max(containerWidth, paddingLeft + (data.length - 1) * stepX + paddingRight);
  const svgHeight = 280;
  const chartTop = 20;
  const chartBottom = 225;
  const chartHeight = chartBottom - chartTop;

  let computedMin = minVal;
  let computedMax = maxVal;

  if (computedMax === null) {
    let allValues = [];
    data.forEach(d => {
      CHANNEL_ORDER.forEach(c => {
        const val = d[`${metricPrefix}_${c}`];
        if (typeof val === 'number' && !isNaN(val) && val !== null && val > 0) {
          allValues.push(val);
        }
      });
    });
    if (allValues.length > 0) {
      const minD = Math.min(...allValues);
      const maxD = Math.max(...allValues);
      computedMin = minVal !== null ? minVal : Math.floor(minD * 0.9);
      computedMax = Math.ceil(maxD * 1.06) || 100;
    } else {
      computedMax = 100;
    }
  }

  const range = (computedMax - computedMin) || 1;
  const getY = (val) => {
    if (typeof val !== 'number' || isNaN(val) || val === null) return chartBottom;
    const clamped = Math.max(computedMin, Math.min(computedMax, val));
    return chartBottom - ((clamped - computedMin) / range) * chartHeight;
  };

  const getX = (idx) => {
    if (data.length === 1) return containerWidth / 2;
    return paddingLeft + idx * stepX;
  };

  const formatLabel = (val) => {
    if (typeof val !== 'number' || isNaN(val) || val === null || val === 0) return '';
    if (type === 'pct') return `${Math.round(val)} %`;
    if (type === 'currency') return Math.round(val).toLocaleString();
    if (type === 'int') return Math.round(val).toLocaleString();
    return Math.round(val).toString();
  };

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;
    const relX = clientX - rect.left;
    const scrollLeft = e.currentTarget.scrollLeft || 0;
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

    if (minDiff < stepX * 0.9) {
      setHoveredIndex(closestIdx);
    } else {
      setHoveredIndex(null);
    }

    const tooltipWidth = 150;
    const tooltipHeight = 110;
    let tooltipX = clientX + 12;
    if (relX > rect.width * 0.52 || clientX + tooltipWidth + 15 > window.innerWidth) {
      tooltipX = clientX - tooltipWidth - 12;
    }

    let tooltipY = clientY - 50;
    if (tooltipY < 15) tooltipY = 15;
    if (tooltipY + tooltipHeight > window.innerHeight - 15) {
      tooltipY = window.innerHeight - tooltipHeight - 15;
    }

    setTooltipPos({ x: tooltipX, y: tooltipY });
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  const hoveredData = hoveredIndex !== null ? data[hoveredIndex] : null;

  // Segmentar puntos continuos válidos
  const getChannelSegments = (channel) => {
    const segments = [];
    let currentSegment = [];

    data.forEach((d, idx) => {
      const val = d[`${metricPrefix}_${channel}`];
      if (typeof val === 'number' && !isNaN(val) && val !== null && val > 0) {
        const x = getX(idx);
        const y = getY(val);
        currentSegment.push(`${x},${y}`);
      } else {
        if (currentSegment.length > 1) {
          segments.push(currentSegment);
        }
        currentSegment = [];
      }
    });

    if (currentSegment.length > 1) {
      segments.push(currentSegment);
    }

    return segments;
  };

  return (
    <div 
      ref={containerRef}
      className="w-full h-[280px] overflow-x-auto overflow-y-hidden hada-scrollbar select-none relative"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <svg width={svgWidth} height={svgHeight} className="block">
        
        {/* Guías de fondo tenues */}
        <line x1={0} y1={chartTop} x2={svgWidth} y2={chartTop} stroke="#f8fafc" strokeDasharray="2 2" />
        <line x1={0} y1={chartBottom} x2={svgWidth} y2={chartBottom} stroke="#f1f5f9" />

        {/* Línea vertical de hover */}
        {hoveredIndex !== null && (
          <line
            x1={getX(hoveredIndex)}
            y1={chartTop}
            x2={getX(hoveredIndex)}
            y2={chartBottom}
            stroke="#94a3b8"
            strokeWidth="1.2"
            strokeDasharray="3 3"
          />
        )}

        {/* 1. TRAZADO DE LÍNEAS */}
        {CHANNEL_ORDER.map((channel) => {
          const cfg = CHANNEL_CONFIG[channel];
          const segments = getChannelSegments(channel);

          return segments.map((seg, sIdx) => (
            <polyline
              key={`${channel}-seg-${sIdx}`}
              fill="none"
              stroke={cfg.color}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={seg.join(' ')}
            />
          ));
        })}

        {/* 2. PUNTOS Y NODOS */}
        {CHANNEL_ORDER.map((channel) => {
          const cfg = CHANNEL_CONFIG[channel];
          return data.map((d, idx) => {
            const val = d[`${metricPrefix}_${channel}`];
            if (typeof val !== 'number' || isNaN(val) || val === null || val <= 0) return null;
            const x = getX(idx);
            const y = getY(val);
            return (
              <circle
                key={`dot-${channel}-${idx}`}
                cx={x}
                cy={y}
                r="3.2"
                fill={cfg.color}
                stroke="#ffffff"
                strokeWidth="1.2"
              />
            );
          });
        })}

        {/* 3. CAPA SUPERIOR: PASTILLAS DE DATOS ESCALONADAS SIN SOBREPOSICIONES */}
        <g className="data-labels-layer">
          {data.map((d, idx) => {
            const monthPoints = [];
            CHANNEL_ORDER.forEach(channel => {
              const val = d[`${metricPrefix}_${channel}`];
              if (typeof val === 'number' && !isNaN(val) && val !== null && val > 0) {
                monthPoints.push({
                  channel,
                  val,
                  y: getY(val),
                  cfg: CHANNEL_CONFIG[channel],
                  labelText: formatLabel(val)
                });
              }
            });

            if (monthPoints.length === 0) return null;
            const x = getX(idx);

            // Ordenar por posición vertical
            monthPoints.sort((a, b) => a.y - b.y);

            // Resolver colisiones verticales entre canales
            const placedBadges = [];
            monthPoints.forEach((pt) => {
              // Secuencia escalonada (arriba / abajo) para separar meses adyacentes
              const baseOffset = (idx % 2 === 0) ? -10 : -19;
              let targetY = pt.y + baseOffset;

              if (placedBadges.length > 0) {
                const prevBadge = placedBadges[placedBadges.length - 1];
                if (targetY < prevBadge.badgeY + 12.5) {
                  targetY = prevBadge.badgeY + 12.5;
                }
              }

              const badgeY = Math.max(chartTop + 6, Math.min(chartBottom - 6, targetY));
              placedBadges.push({ ...pt, badgeY });
            });

            return placedBadges.map(pt => {
              const badgeW = pt.labelText.length > 4 ? 26 : 21;
              const badgeH = 11.5;

              return (
                <g key={`badge-${pt.channel}-${idx}`}>
                  {/* Pastilla sólida de alto contraste */}
                  <rect
                    x={x - badgeW / 2}
                    y={pt.badgeY - badgeH / 2}
                    width={badgeW}
                    height={badgeH}
                    rx="3"
                    fill="#ffffff"
                    stroke={pt.cfg.color}
                    strokeWidth="0.9"
                    className="filter drop-shadow-2xs"
                  />

                  {/* Texto numérico */}
                  <text
                    x={x}
                    y={pt.badgeY + 3.2}
                    textAnchor="middle"
                    fill={pt.cfg.textPill}
                    fontSize="7.5"
                    fontWeight="900"
                    fontFamily="system-ui, -apple-system, sans-serif"
                  >
                    {pt.labelText}
                  </text>
                </g>
              );
            });
          })}
        </g>

        {/* 3. ETIQUETAS DE MES EN EJE X (INCLINADAS A -45°) */}
        {data.map((d, idx) => {
          const x = getX(idx);
          const y = chartBottom + 10;

          return (
            <text
              key={`label-${d.mesCode}-${idx}`}
              x={x}
              y={y}
              transform={`rotate(-45, ${x}, ${y})`}
              textAnchor="end"
              fill="#1e293b"
              fontSize="8"
              fontWeight="800"
              fontFamily="system-ui, -apple-system, sans-serif"
            >
              {d.mesCode}
            </text>
          );
        })}

      </svg>

      {/* TOOLTIP OSCURO POWER BI INTELIGENTE FLOTANTE */}
      {hoveredData && (
        <div 
          className="fixed z-50 pointer-events-none bg-[#1e293b]/95 text-white rounded-lg p-2 shadow-2xl border border-slate-700 text-[10px] space-y-1 backdrop-blur-xs min-w-[145px]"
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y
          }}
        >
          <div className="font-black text-slate-200 border-b border-slate-700/80 pb-0.5 mb-1">
            {hoveredData.mesCode}
          </div>
          {CHANNEL_ORDER.map(channel => {
            const cfg = CHANNEL_CONFIG[channel];
            const val = hoveredData[`${metricPrefix}_${channel}`];
            return (
              <div key={channel} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                  <span className="text-slate-300 font-medium">{channel}</span>
                </span>
                <span className="font-black text-white">
                  {typeof val === 'number' && val > 0 
                    ? (type === 'pct' ? `${val.toFixed(1)}%` : (Number.isInteger(val) ? val.toLocaleString() : Number(val).toFixed(1))) 
                    : '-'}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// =========================================================================
// VISTA PRINCIPAL: MARCA X CANALES
// =========================================================================
const ColombiaMarcaCanalesView = ({ onBackToPortada }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // SEGMENTADOR DE AÑO: SINGLE SELECT (2026 | 2025 | 2024)
  const [selectedYear, setSelectedYear] = useState(2026);
  
  // SEGMENTADOR DE MESES: MULTI-SELECT O ÚNICO (Por defecto YTD 1..8 para 2026)
  const [selectedMonths, setSelectedMonths] = useState([1, 2, 3, 4, 5, 6, 7, 8]);
  const [selectedMarca, setSelectedMarca] = useState('ELECTROLIT');
  
  // Segmentadores específicos de sección
  const [selectedRegion, setSelectedRegion] = useState('ANTIOQUIA-CHOCO');
  const [selectedFlavorCanal, setSelectedFlavorCanal] = useState('Droguerias');

  // Control de dropdowns
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
  const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);
  const [marcaDropdownOpen, setMarcaDropdownOpen] = useState(false);

  useEffect(() => {
    fetch('/api/nielsen/co/brand-channels')
      .then(r => r.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching brand channels:', err);
        setLoading(false);
      });
  }, []);

  const maxAvailableMonthForYear = useMemo(() => {
    if (selectedYear === 2026) return 8;
    return 12;
  }, [selectedYear]);

  const availableMonthItems = useMemo(() => {
    return ALL_MONTH_ITEMS.filter(m => m.num <= maxAvailableMonthForYear);
  }, [maxAvailableMonthForYear]);

  const handleYearChange = (newYear) => {
    setSelectedYear(newYear);
    setYearDropdownOpen(false);
    const maxM = newYear === 2026 ? 8 : 12;
    const allM = Array.from({ length: maxM }, (_, i) => i + 1);
    setSelectedMonths(allM);
  };

  const toggleMonth = (mNum) => {
    setSelectedMonths(prev => {
      if (prev.includes(mNum)) {
        return prev.filter(m => m !== mNum);
      } else {
        return [...prev, mNum].sort((a, b) => a - b);
      }
    });
  };

  const handleToggleAllMonths = () => {
    if (selectedMonths.length === availableMonthItems.length) {
      setSelectedMonths([]);
    } else {
      setSelectedMonths(availableMonthItems.map(m => m.num));
    }
  };

  const monthButtonLabel = useMemo(() => {
    if (selectedMonths.length === 0) {
      return 'Mes: Ninguno';
    }
    if (selectedMonths.length === availableMonthItems.length) {
      return 'Mes: Todos';
    }
    if (selectedMonths.length === 1) {
      const mObj = ALL_MONTH_ITEMS.find(m => m.num === selectedMonths[0]);
      return `Mes: ${mObj ? mObj.short : 'Ago'}`;
    }
    return `Meses (${selectedMonths.length})`;
  }, [selectedMonths, availableMonthItems]);

  const availableMarcas = useMemo(() => {
    if (!data?.nationalChannelBrandRows) return ['ELECTROLIT'];
    const brandVolumeMap = {};
    data.nationalChannelBrandRows
      .filter(r => r.anio === selectedYear)
      .forEach(r => {
        if (r.marca) {
          brandVolumeMap[r.marca] = (brandVolumeMap[r.marca] || 0) + (r.unds_k || 0);
        }
      });

    // Considerar marcas presentes en flavorRows
    if (data?.flavorRows) {
      data.flavorRows
        .filter(r => r.anio === selectedYear)
        .forEach(r => {
          if (r.marca) {
            brandVolumeMap[r.marca] = (brandVolumeMap[r.marca] || 0) + (r.unds_k || 0);
          }
        });
    }

    // Orden alfabético estricto A-Z (sin priorizar ni alterar el orden por marca)
    return Object.entries(brandVolumeMap)
      .filter(([_, vol]) => vol > 0.05)
      .map(([m]) => m)
      .sort((a, b) => a.localeCompare(b));
  }, [data, selectedYear]);

  useEffect(() => {
    if (availableMarcas.length > 0 && !availableMarcas.includes(selectedMarca)) {
      setSelectedMarca(availableMarcas.includes('ELECTROLIT') ? 'ELECTROLIT' : availableMarcas[0]);
    }
  }, [availableMarcas, selectedMarca]);

  // Regiones disponibles activas para la marca seleccionada
  const availableRegionsForBrand = useMemo(() => {
    if (!data?.regionChannelBrandRows) return REGIONES_LIST;
    const regionSet = new Set();
    data.regionChannelBrandRows
      .filter(r => r.anio === selectedYear && r.marca === selectedMarca && r.unds_k > 0)
      .forEach(r => {
        if (r.region) regionSet.add(r.region);
      });

    if (data?.flavorRows) {
      data.flavorRows
        .filter(r => r.anio === selectedYear && r.marca === selectedMarca && r.unds_k > 0)
        .forEach(r => {
          if (r.region) regionSet.add(r.region);
        });
    }

    const filtered = REGIONES_LIST.filter(reg => regionSet.has(reg));
    return filtered.length > 0 ? filtered : REGIONES_LIST;
  }, [data, selectedYear, selectedMarca]);

  useEffect(() => {
    if (availableRegionsForBrand.length > 0 && !availableRegionsForBrand.includes(selectedRegion)) {
      setSelectedRegion(availableRegionsForBrand[0]);
    }
  }, [availableRegionsForBrand, selectedRegion]);

  const targetEndMonthNum = useMemo(() => {
    if (selectedMonths.length === 0) return maxAvailableMonthForYear;
    return Math.max(...selectedMonths);
  }, [selectedMonths, maxAvailableMonthForYear]);

  const rolling13MonthWindow = useMemo(() => {
    return getRolling13Months(selectedYear, targetEndMonthNum);
  }, [selectedYear, targetEndMonthNum]);

  // =========================================================================
  // FILA 1: DATOS NACIONALES POR CANAL (TRIM MESES INICIALES VACÍOS)
  // =========================================================================
  const nationalData = useMemo(() => {
    if (!data?.nationalChannelBrandRows) return { mix: [], series: [] };

    let mixRows = data.nationalChannelBrandRows.filter(
      r => r.anio === selectedYear && selectedMonths.includes(r.mesNum)
    );

    const canalTotals = {};
    const canalMarca = {};
    CHANNEL_ORDER.forEach(c => {
      canalTotals[c] = 0;
      canalMarca[c] = 0;
    });

    let grandTotalUnds = 0;
    let brandTotalUnds = 0;

    mixRows.forEach(r => {
      if (canalTotals[r.canal] !== undefined) {
        canalTotals[r.canal] += r.unds_k;
        grandTotalUnds += r.unds_k;
        if (r.marca === selectedMarca) {
          canalMarca[r.canal] += r.unds_k;
          brandTotalUnds += r.unds_k;
        }
      }
    });

    const mix = [
      {
        name: 'TOTAL',
        totalUnds: grandTotalUnds,
        ...canalTotals,
        drogPct: grandTotalUnds > 0 ? (canalTotals['Droguerias'] / grandTotalUnds) * 100 : 0,
        cadPct: grandTotalUnds > 0 ? (canalTotals['Super Cadena'] / grandTotalUnds) * 100 : 0,
        supPct: grandTotalUnds > 0 ? (canalTotals['Superetes'] / grandTotalUnds) * 100 : 0,
        tradPct: grandTotalUnds > 0 ? (canalTotals['Tradicional'] / grandTotalUnds) * 100 : 0,
      },
      {
        name: selectedMarca,
        totalUnds: brandTotalUnds,
        ...canalMarca,
        drogPct: brandTotalUnds > 0 ? (canalMarca['Droguerias'] / brandTotalUnds) * 100 : 0,
        cadPct: brandTotalUnds > 0 ? (canalMarca['Super Cadena'] / brandTotalUnds) * 100 : 0,
        supPct: brandTotalUnds > 0 ? (canalMarca['Superetes'] / brandTotalUnds) * 100 : 0,
        tradPct: brandTotalUnds > 0 ? (canalMarca['Tradicional'] / brandTotalUnds) * 100 : 0,
      }
    ];

    // SERIES DE LÍNEAS
    const rawSeries = rolling13MonthWindow.map(mItem => {
      const monthRows = data.nationalChannelBrandRows.filter(
        r => r.anio === mItem.anio && r.mesNum === mItem.mesNum
      );
      const point = { mesCode: mItem.mesCode };

      const mCanalTot = {};
      const mBrandCanal = {};
      CHANNEL_ORDER.forEach(c => {
        mCanalTot[c] = 0;
      });

      monthRows.forEach(r => {
        if (mCanalTot[r.canal] !== undefined) {
          mCanalTot[r.canal] += r.unds_k;
          if (r.marca === selectedMarca && r.unds_k > 0) {
            mBrandCanal[r.canal] = {
              unds: r.unds_k,
              val: r.val_m,
              precio: r.precio,
              rot: r.rotacion,
              dist: r.dist_num
            };
          }
        }
      });

      let mBrandGrandTotal = Object.values(mBrandCanal).reduce((a, b) => a + (b.unds || 0), 0);

      CHANNEL_ORDER.forEach(c => {
        if (mBrandCanal[c] && mBrandCanal[c].unds > 0) {
          point[`part_${c}`] = mBrandGrandTotal > 0 ? (mBrandCanal[c].unds / mBrandGrandTotal) * 100 : null;
          point[`dist_${c}`] = mBrandCanal[c].dist > 0 ? mBrandCanal[c].dist : null;
          point[`precio_${c}`] = mBrandCanal[c].precio > 0 ? mBrandCanal[c].precio : null;
          point[`rot_${c}`] = mBrandCanal[c].rot > 0 ? mBrandCanal[c].rot : null;
          point[`share_${c}`] = mCanalTot[c] > 0 ? (mBrandCanal[c].unds / mCanalTot[c]) * 100 : null;
        } else {
          point[`part_${c}`] = null;
          point[`dist_${c}`] = null;
          point[`precio_${c}`] = null;
          point[`rot_${c}`] = null;
          point[`share_${c}`] = null;
        }
      });

      return point;
    });

    // OMITIR MESES PREVIOS SIN INFORMACIÓN PARA LA MARCA
    const firstValidIdx = rawSeries.findIndex(pt => 
      CHANNEL_ORDER.some(c => typeof pt[`part_${c}`] === 'number' && pt[`part_${c}`] > 0)
    );
    const monthlySeries = firstValidIdx !== -1 ? rawSeries.slice(firstValidIdx) : rawSeries;

    return { mix, series: monthlySeries };
  }, [data, selectedYear, selectedMonths, selectedMarca, rolling13MonthWindow]);

  // =========================================================================
  // FILA 2: DATOS REGIONALES POR CANAL (TRIM MESES INICIALES VACÍOS)
  // =========================================================================
  const regionData = useMemo(() => {
    if (!data?.regionChannelBrandRows) return { mix: [], series: [] };

    let mixRows = data.regionChannelBrandRows.filter(
      r => r.region === selectedRegion && r.anio === selectedYear && selectedMonths.includes(r.mesNum)
    );

    const natMarca = nationalData.mix[1] || { totalUnds: 0, Droguerias: 0, 'Super Cadena': 0, Superetes: 0, Tradicional: 0 };

    const regCanalMarca = {};
    CHANNEL_ORDER.forEach(c => { regCanalMarca[c] = 0; });
    let regTotalUnds = 0;

    mixRows.forEach(r => {
      if (r.marca === selectedMarca && regCanalMarca[r.canal] !== undefined) {
        regCanalMarca[r.canal] += r.unds_k;
        regTotalUnds += r.unds_k;
      }
    });

    const mix = [
      {
        name: selectedMarca,
        totalUnds: natMarca.totalUnds,
        ...natMarca
      },
      {
        name: selectedRegion,
        totalUnds: regTotalUnds,
        ...regCanalMarca,
        drogPct: regTotalUnds > 0 ? (regCanalMarca['Droguerias'] / regTotalUnds) * 100 : 0,
        cadPct: regTotalUnds > 0 ? (regCanalMarca['Super Cadena'] / regTotalUnds) * 100 : 0,
        supPct: regTotalUnds > 0 ? (regCanalMarca['Superetes'] / regTotalUnds) * 100 : 0,
        tradPct: regTotalUnds > 0 ? (regCanalMarca['Tradicional'] / regTotalUnds) * 100 : 0,
      }
    ];

    const rawSeries = rolling13MonthWindow.map(mItem => {
      const monthRows = data.regionChannelBrandRows.filter(
        r => r.region === selectedRegion && r.anio === mItem.anio && r.mesNum === mItem.mesNum
      );
      const point = { mesCode: mItem.mesCode };

      const mCanalTot = {};
      const mBrandCanal = {};
      CHANNEL_ORDER.forEach(c => {
        mCanalTot[c] = 0;
      });

      monthRows.forEach(r => {
        if (mCanalTot[r.canal] !== undefined) {
          mCanalTot[r.canal] += r.unds_k;
          if (r.marca === selectedMarca && r.unds_k > 0) {
            mBrandCanal[r.canal] = {
              unds: r.unds_k,
              val: r.val_m,
              precio: r.precio,
              rot: r.rotacion,
              dist: r.dist_num
            };
          }
        }
      });

      let mBrandGrandTotal = Object.values(mBrandCanal).reduce((a, b) => a + (b.unds || 0), 0);

      CHANNEL_ORDER.forEach(c => {
        if (mBrandCanal[c] && mBrandCanal[c].unds > 0) {
          point[`part_${c}`] = mBrandGrandTotal > 0 ? (mBrandCanal[c].unds / mBrandGrandTotal) * 100 : null;
          point[`dist_${c}`] = mBrandCanal[c].dist > 0 ? mBrandCanal[c].dist : null;
          point[`precio_${c}`] = mBrandCanal[c].precio > 0 ? mBrandCanal[c].precio : null;
          point[`rot_${c}`] = mBrandCanal[c].rot > 0 ? mBrandCanal[c].rot : null;
          point[`share_${c}`] = mCanalTot[c] > 0 ? (mBrandCanal[c].unds / mCanalTot[c]) * 100 : null;
        } else {
          point[`part_${c}`] = null;
          point[`dist_${c}`] = null;
          point[`precio_${c}`] = null;
          point[`rot_${c}`] = null;
          point[`share_${c}`] = null;
        }
      });

      return point;
    });

    const firstValidIdx = rawSeries.findIndex(pt => 
      CHANNEL_ORDER.some(c => typeof pt[`part_${c}`] === 'number' && pt[`part_${c}`] > 0)
    );
    const monthlySeries = firstValidIdx !== -1 ? rawSeries.slice(firstValidIdx) : rawSeries;

    return { mix, series: monthlySeries };
  }, [data, selectedYear, selectedMonths, selectedMarca, selectedRegion, nationalData, rolling13MonthWindow]);

  // =========================================================================
  // FILA 3: DATOS DE SABORES (POWER BI RIBBON CHART POR SABOR)
  // =========================================================================
  const flavorData = useMemo(() => {
    if (!data?.flavorRows) return { flavorsList: [], natSeries: [], regSeries: [], regCanalSeries: [] };

    let fRowsBrand = data.flavorRows
      .filter(r => r.marca === selectedMarca)
      .map(r => ({
        ...r,
        sabor: homologateFlavor(r.sabor, r.marca)
      }));

    const flavorTotals = {};
    fRowsBrand.forEach(r => {
      flavorTotals[r.sabor] = (flavorTotals[r.sabor] || 0) + (r.unds_k || 0);
    });

    const flavorsList = Object.keys(flavorTotals)
      .filter(s => flavorTotals[s] > 0)
      .sort((a, b) => flavorTotals[b] - flavorTotals[a])
      .slice(0, 15);

    const buildSeries = (filterFn) => {
      const raw = rolling13MonthWindow.map(mItem => {
        const point = { mesCode: mItem.mesCode, total: 0 };
        flavorsList.forEach(f => { point[f] = 0; });

        fRowsBrand
          .filter(r => r.anio === mItem.anio && r.mesNum === mItem.mesNum && filterFn(r))
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

    // 1. Serie Nacional: Apertura Total o (TOTAL y Total)
    let natSeries = buildSeries(r => r.apertura_cr === 'Total' || (r.region === 'TOTAL' && r.canal === 'Total'));
    if (!natSeries.some(pt => pt.total > 0)) {
      natSeries = buildSeries(r => r.region === 'TOTAL' || r.canal === 'Total' || r.apertura_cr === 'Total');
    }

    // 2. Serie Regional Total: Apertura Region para la región seleccionada
    let regSeries = buildSeries(r => r.apertura_cr === 'Region' && r.region === selectedRegion);
    if (!regSeries.some(pt => pt.total > 0)) {
      regSeries = buildSeries(r => r.region === selectedRegion && (r.canal === 'Total' || !r.canal));
    }

    // 3. Serie Regional x Canal: Apertura Canal/Region para región y canal seleccionados
    const regCanalSeries = buildSeries(r => 
      (r.apertura_cr === 'Canal/Region' || r.apertura_cr === 'Canal/Region/Drog' || !r.apertura_cr) &&
      r.region === selectedRegion && 
      (r.canal === selectedFlavorCanal || (selectedFlavorCanal === 'Droguerias' && r.canal && r.canal.toLowerCase().includes('drogueria')))
    );

    return { flavorsList, natSeries, regSeries, regCanalSeries };
  }, [data, selectedMarca, selectedRegion, selectedFlavorCanal, rolling13MonthWindow]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-600">Cargando Marca x Canales...</p>
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

        {/* Centro: Título Centrado y Canales Centrados debajo */}
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <h1 className="text-base md:text-xl font-black text-[#00529B] tracking-tight">
            Marca x Canales
          </h1>
          <div className="flex items-center justify-center gap-3.5 text-[11px] font-bold mt-0.5">
            <span className="flex items-center gap-1.5 text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHANNEL_CONFIG['Droguerias'].color }} />
              Droguerías
            </span>
            <span className="flex items-center gap-1.5 text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHANNEL_CONFIG['Super Cadena'].color }} />
              Super Cadena
            </span>
            <span className="flex items-center gap-1.5 text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHANNEL_CONFIG['Superetes'].color }} />
              Superetes
            </span>
            <span className="flex items-center gap-1.5 text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHANNEL_CONFIG['Tradicional'].color }} />
              Tradicional
            </span>
          </div>
        </div>

        {/* SEGMENTADORES (AÑO 2026/2025/2024, MES MULTI-SELECT Y MARCA) + BOTÓN HOME */}
        <div className="flex items-center gap-2.5">
          
          {/* SEGMENTADOR: AÑO (SINGLE SELECT: 2026 | 2025 | 2024) */}
          <div className="relative">
            <button
              onClick={() => { setYearDropdownOpen(!yearDropdownOpen); setMonthDropdownOpen(false); setMarcaDropdownOpen(false); }}
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
              onClick={() => { setMonthDropdownOpen(!monthDropdownOpen); setYearDropdownOpen(false); setMarcaDropdownOpen(false); }}
              className="flex items-center justify-between gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 min-w-[95px] shadow-2xs hover:border-[#0066c0] cursor-pointer"
            >
              <span className="truncate max-w-[80px]">{monthButtonLabel}</span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>

            {monthDropdownOpen && (
              <div className="absolute right-0 top-9 bg-white border border-slate-200 shadow-xl rounded-xl p-2 w-48 z-50 animate-in fade-in space-y-1">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100 text-[11px]">
                  <span className="font-bold text-slate-600">Filtrar Meses</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedMonths(availableMonthItems.map(m => m.num))}
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

                <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto pt-1 hada-scrollbar">
                  {availableMonthItems.map(m => {
                    const isSelected = selectedMonths.includes(m.num);
                    return (
                      <button
                        key={m.num}
                        onClick={() => toggleMonth(m.num)}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-semibold text-left transition-colors cursor-pointer ${
                          isSelected ? 'bg-blue-50 text-[#00529B] font-bold' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-3.5 h-3.5 text-[#00529B] shrink-0" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                        <span>{m.short}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* SEGMENTADOR: MARCA */}
          <div className="relative">
            <button
              onClick={() => { setMarcaDropdownOpen(!marcaDropdownOpen); setYearDropdownOpen(false); setMonthDropdownOpen(false); }}
              className="flex items-center justify-between gap-1.5 bg-blue-50 border border-blue-300 rounded-lg px-2.5 py-1 text-xs font-black text-[#00529B] min-w-[110px] shadow-2xs hover:border-[#00529B] cursor-pointer uppercase"
            >
              <span className="truncate max-w-[90px]">{selectedMarca}</span>
              <ChevronDown className="w-3 h-3 text-[#00529B]" />
            </button>

            {marcaDropdownOpen && (
              <div className="absolute right-0 top-9 bg-white border border-slate-200 shadow-xl rounded-xl p-1 w-36 max-h-56 overflow-y-auto z-50 animate-in fade-in">
                {availableMarcas.map(m => (
                  <button
                    key={m}
                    onClick={() => { setSelectedMarca(m); setMarcaDropdownOpen(false); }}
                    className={`w-full text-left px-2 py-1 text-xs font-bold rounded-lg flex items-center justify-between uppercase transition-colors ${
                      selectedMarca === m ? 'bg-[#00529B] text-white' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="truncate">{m}</span>
                    {selectedMarca === m && <Check className="w-3 h-3 text-white" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Botón Home */}
          <button
            onClick={onBackToPortada}
            title="Regresar a Portada de Colombia"
            className="p-1.5 text-[#00529B] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
          >
            <Home className="w-5 h-5 stroke-[2]" />
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. FILA 1: CANALES NACIONAL */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
        
        {/* CARD 1: MIX UNIDADES (000) NACIONAL */}
        <MixUnidadesCard
          title="Mix Unidades (000)"
          mixData={nationalData.mix}
        />

        {/* CARD 2: PART. VENTA / CANALES (POWER BI STYLE) */}
        <div className="bg-white rounded-xl p-2.5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="text-center font-bold text-[#00529B] text-[11px] border-b border-dashed border-blue-200 pb-1 mb-1">
            Part. Venta / Canales
          </div>
          <PowerBiLineChart
            data={nationalData.series}
            metricPrefix="part"
            type="pct"
            minVal={0}
            maxVal={75}
          />
        </div>

        {/* CARD 3: DIST. NUMÉRICA (POWER BI STYLE) */}
        <div className="bg-white rounded-xl p-2.5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="text-center font-bold text-[#00529B] text-[11px] border-b border-dashed border-blue-200 pb-1 mb-1">
            Dist. Numérica
          </div>
          <PowerBiLineChart
            data={nationalData.series}
            metricPrefix="dist"
            type="pct"
            minVal={null}
            maxVal={null}
          />
        </div>

        {/* CARD 4: PRECIO (POWER BI STYLE) */}
        <div className="bg-white rounded-xl p-2.5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="text-center font-bold text-[#00529B] text-[11px] border-b border-dashed border-blue-200 pb-1 mb-1">
            Precio
          </div>
          <PowerBiLineChart
            data={nationalData.series}
            metricPrefix="precio"
            type="currency"
            minVal={null}
            maxVal={null}
          />
        </div>

        {/* CARD 5: ROTACIÓN (POWER BI STYLE) */}
        <div className="bg-white rounded-xl p-2.5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="text-center font-bold text-[#00529B] text-[11px] border-b border-dashed border-blue-200 pb-1 mb-1">
            Rotación
          </div>
          <PowerBiLineChart
            data={nationalData.series}
            metricPrefix="rot"
            type="int"
            minVal={0}
            maxVal={null}
          />
        </div>

        {/* CARD 6: SHARE MARCA EN CANAL (POWER BI STYLE) */}
        <div className="bg-white rounded-xl p-2.5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="text-center font-bold text-[#00529B] text-[11px] border-b border-dashed border-blue-200 pb-1 mb-1">
            Share Marca en Canal
          </div>
          <PowerBiLineChart
            data={nationalData.series}
            metricPrefix="share"
            type="pct"
            minVal={0}
            maxVal={null}
          />
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. FILA 2: SEGMENTADOR DE REGIONES AUTOAJUSTABLE (SIN ESPACIOS BLANCOS LATERALES) */}
      {/* ========================================================================= */}
      <div className="flex justify-center w-full">
        <div className="inline-flex flex-wrap items-center justify-center gap-1.5 bg-white rounded-xl px-3 py-1.5 border border-slate-200/90 shadow-2xs">
          {availableRegionsForBrand.map(reg => (
            <button
              key={reg}
              onClick={() => setSelectedRegion(reg)}
              className={`px-3 py-1 rounded-full text-[10.5px] font-black transition-all cursor-pointer border ${
                selectedRegion === reg
                  ? 'bg-[#00529B] text-white border-[#00529B] shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
              }`}
            >
              {reg}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
        
        {/* CARD 1: MIX UNIDADES (000) REGIONAL */}
        <MixUnidadesCard
          title="Mix Unidades (000)"
          mixData={regionData.mix}
        />

        {/* CARD 2: PART. VENTA / CANALES REGIONAL (POWER BI STYLE) */}
        <div className="bg-white rounded-xl p-2.5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="text-center font-bold text-[#00529B] text-[11px] border-b border-dashed border-blue-200 pb-1 mb-1">
            Part. Venta / Canales
          </div>
          <PowerBiLineChart
            data={regionData.series}
            metricPrefix="part"
            type="pct"
            minVal={0}
            maxVal={75}
          />
        </div>

        {/* CARD 3: DIST. NUMÉRICA REGIONAL (POWER BI STYLE) */}
        <div className="bg-white rounded-xl p-2.5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="text-center font-bold text-[#00529B] text-[11px] border-b border-dashed border-blue-200 pb-1 mb-1">
            Dist. Numérica
          </div>
          <PowerBiLineChart
            data={regionData.series}
            metricPrefix="dist"
            type="pct"
            minVal={null}
            maxVal={null}
          />
        </div>

        {/* CARD 4: PRECIO REGIONAL (POWER BI STYLE) */}
        <div className="bg-white rounded-xl p-2.5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="text-center font-bold text-[#00529B] text-[11px] border-b border-dashed border-blue-200 pb-1 mb-1">
            Precio
          </div>
          <PowerBiLineChart
            data={regionData.series}
            metricPrefix="precio"
            type="currency"
            minVal={null}
            maxVal={null}
          />
        </div>

        {/* CARD 5: ROTACIÓN REGIONAL (POWER BI STYLE) */}
        <div className="bg-white rounded-xl p-2.5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="text-center font-bold text-[#00529B] text-[11px] border-b border-dashed border-blue-200 pb-1 mb-1">
            Rotación
          </div>
          <PowerBiLineChart
            data={regionData.series}
            metricPrefix="rot"
            type="int"
            minVal={0}
            maxVal={null}
          />
        </div>

        {/* CARD 6: SHARE MARCA EN CANAL REGIONAL (POWER BI STYLE) */}
        <div className="bg-white rounded-xl p-2.5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="text-center font-bold text-[#00529B] text-[11px] border-b border-dashed border-blue-200 pb-1 mb-1">
            Share Marca en Canal
          </div>
          <PowerBiLineChart
            data={regionData.series}
            metricPrefix="share"
            type="pct"
            minVal={0}
            maxVal={null}
          />
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. FILA 3: SABORES (POWER BI RIBBON CHARTS DE CINTAS POR SABOR) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        
        {/* GRÁFICA SABORES 1: NACIONAL (ELECTROLIT / MARCA SELECCIONADA) */}
        <div className="bg-white rounded-xl p-3 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="text-center border-b border-dashed border-blue-200 pb-1 mb-1.5">
            <h3 className="font-bold text-[#00529B] text-xs">Unidades (000)</h3>
            <p className="text-[10px] font-black text-slate-700 uppercase">{selectedMarca}</p>
          </div>
          <PowerBiRibbonChart
            series={flavorData.natSeries}
            flavorsList={flavorData.flavorsList}
            height={230}
          />
        </div>

        {/* GRÁFICA SABORES 2: REGIONAL */}
        <div className="bg-white rounded-xl p-3 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="text-center border-b border-dashed border-blue-200 pb-1 mb-1.5">
            <h3 className="font-bold text-[#00529B] text-xs">Unidades (000)</h3>
            <p className="text-[10px] font-black text-slate-700 uppercase">{selectedRegion}</p>
          </div>
          <PowerBiRibbonChart
            series={flavorData.regSeries}
            flavorsList={flavorData.flavorsList}
            height={230}
          />
        </div>

        {/* GRÁFICA SABORES 3: REGIONAL + CANAL FILTER (CENTRADOS) */}
        <div className="bg-white rounded-xl p-3 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="relative text-center border-b border-dashed border-blue-200 pb-1 mb-1.5">
            <h3 className="font-bold text-[#00529B] text-xs">Unidades (000)</h3>
            <p className="text-[10px] font-black text-slate-700 uppercase">{selectedRegion}</p>
            <div className="absolute right-0 top-0 bottom-0 flex items-center">
              <select
                value={selectedFlavorCanal}
                onChange={(e) => setSelectedFlavorCanal(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-0.5 text-[10px] font-bold text-slate-800 cursor-pointer focus:ring-1 focus:ring-blue-500 shadow-2xs"
              >
                {CHANNEL_ORDER.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <PowerBiRibbonChart
            series={flavorData.regCanalSeries}
            flavorsList={flavorData.flavorsList}
            height={230}
          />
        </div>

      </div>

    </div>
  );
};

export default ColombiaMarcaCanalesView;
