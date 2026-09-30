import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Home, RefreshCw } from 'lucide-react';

// ==========================================
// CONFIGURACIÓN DE MARCAS Y PALETA GUATEMALA
// ==========================================
const BRANDS_CONFIG = [
  { id: 'Hidravida', name: 'HIDRAVIDA', color: '#0066c0', stroke: '#0066c0', bg: '#e0f2fe', text: '#0369a1', strokeWidth: 2.6 },
  { id: 'Hidralife', name: 'HIDRALIFE', color: '#38bdf8', stroke: '#0284c7', bg: '#e0f7fa', text: '#0284c7', strokeWidth: 2.2 },
  { id: 'Gatorade', name: 'GATORADE', color: '#ea580c', stroke: '#ea580c', bg: '#ffedd5', text: '#c2410c', strokeWidth: 2.4 },
  { id: 'Gatorlyte', name: 'GATORLYTE', color: '#fdba74', stroke: '#f97316', bg: '#fed7aa', text: '#c2410c', strokeWidth: 2 },
  { id: 'Powerade', name: 'POWERADE', color: '#6b21a8', stroke: '#6b21a8', bg: '#ede9fe', text: '#581c87', strokeWidth: 2.6 },
  { id: 'Pedialyte', name: 'PEDIALYTE', color: '#dc2626', stroke: '#dc2626', bg: '#fee2e2', text: '#b91c1c', strokeWidth: 2 },
  { id: 'Isomax', name: 'ISOMAX', color: '#db2777', stroke: '#db2777', bg: '#fce7f3', text: '#be185d', strokeWidth: 2 },
  { id: 'Suerox', name: 'SUEROX', color: '#991b1b', stroke: '#991b1b', bg: '#ffe4e6', text: '#9f1239', strokeWidth: 2 },
  { id: 'Sporade', name: 'SPORADE', color: '#ca8a04', stroke: '#ca8a04', bg: '#fef9c3', text: '#a16207', strokeWidth: 2 },
  { id: 'Revive', name: 'REVIVE', color: '#c084fc', stroke: '#a855f7', bg: '#f3e8ff', text: '#7e22ce', strokeWidth: 2 },
  { id: 'Glucosoral', name: 'GLUCOSORAL', color: '#10b981', stroke: '#059669', bg: '#d1fae5', text: '#047857', strokeWidth: 2 },
  { id: 'Resto Marcas', name: 'RESTO MARCAS', color: '#94a3b8', stroke: '#94a3b8', bg: '#f1f5f9', text: '#475569', strokeWidth: 1.6, isDashed: true }
];

const METRIC_CONFIGS = [
  { id: 'unidades', label: 'Unidades (000)', slicerLabel: 'Unidades', format: 'k' },
  { id: 'som', label: 'SOM Unidades', slicerLabel: 'SOM Unidades', format: 'percent' },
  { id: 'dist', label: 'Dist. Numérica', slicerLabel: 'Dist.Num', slicerLabelRegion: 'Dist.Num_Marca', format: 'percent' },
  { id: 'precio', label: 'Precio', slicerLabel: 'Precio/Unit', format: 'currency' },
  { id: 'rotacion', label: 'Rotación', slicerLabel: 'Rotación', format: 'decimal' }
];

const REGIONES = [
  'METRO',
  'NORORIENTE',
  'OCCIDENTE',
  'OCCIDENTE CHICO',
  'ORIENTE CHICO',
  'ORIENTE GRANDE',
  'SUR',
  'VERAPACES'
];

// ==========================================
// COMPONENTE: MINI GRÁFICA DE LÍNEAS LIMPIA Y ESTÉTICA
// ==========================================
function LineChartCard({
  title,
  scope,
  metricKey,
  data,
  periods,
  activeBrands,
  selectedBrand,
  formatType = 'number'
}) {
  const width = 570;
  const height = 800;
  const padding = { top: 48, right: 28, bottom: 96, left: 28 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const { minY, maxY, series } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    const seriesList = [];

    BRANDS_CONFIG.forEach(b => {
      const isVisible = activeBrands.includes(b.id);
      const points = data?.[scope]?.[metricKey]?.[b.id] || [];

      const validPoints = points.map((val, idx) => {
        if (val !== null && val !== undefined && !isNaN(val)) {
          if (isVisible) {
            if (val < min) min = val;
            if (val > max) max = val;
          }
          return { xIdx: idx, val };
        }
        return { xIdx: idx, val: null };
      });

      seriesList.push({
        ...b,
        isVisible,
        points: validPoints
      });
    });

    if (min === Infinity || max === -Infinity) {
      min = 0;
      max = 100;
    }

    const range = max - min;
    const padFactor = range === 0 ? 1 : range * 0.12;
    const adjustedMin = Math.max(0, min - padFactor);
    const adjustedMax = max + padFactor;

    return { minY: adjustedMin, maxY: adjustedMax, series: seriesList };
  }, [data, metricKey, scope, activeBrands]);

  const getX = (idx) => {
    if (!periods || periods.length <= 1) return padding.left;
    return padding.left + (idx / (periods.length - 1)) * chartW;
  };

  const getY = (val) => {
    if (val === null || val === undefined || isNaN(val)) return null;
    if (maxY === minY) return padding.top + chartH / 2;
    return padding.top + chartH - ((val - minY) / (maxY - minY)) * chartH;
  };

  const formatVal = (val) => {
    if (val === null || val === undefined || isNaN(val)) return '-';
    if (formatType === 'percent') return `${Math.round(val)}%`;
    if (formatType === 'currency') return `${val.toFixed(2)}`;
    if (formatType === 'decimal') return `${val.toFixed(1)}`;
    if (formatType === 'k') return Math.round(val).toLocaleString();
    return Math.round(val).toLocaleString();
  };

  // Familias prioritarias requeridas con etiquetas de datos
  const priorityBrands = ['hidravida', 'hidralife', 'electrolit', 'electrolife', 'gatorade', 'gatorlyte', 'powerade', 'suerox', 'pedialyte', 'isomax', 'revive', 'sporade'];
  const isPriorityBrand = (brandId) => priorityBrands.includes(String(brandId).toLowerCase().trim());

  // Fases alternadas para distribución limpia "uno sí, uno no" para marcas prioritarias
  const brandPhases = {
    'hidravida': 0,
    'electrolit': 0,
    'powerade': 0,
    'suerox': 0,
    'isomax': 0,
    'sporade': 0,
    'hidralife': 1,
    'electrolife': 1,
    'gatorade': 1,
    'pedialyte': 1,
    'revive': 1,
    'gatorlyte': 0
  };

  const getBrandPhase = (brandId) => {
    const key = String(brandId).toLowerCase().trim();
    return brandPhases[key] !== undefined ? brandPhases[key] : 0;
  };

  const columnBadges = useMemo(() => {
    if (!periods || periods.length === 0) return [];

    return periods.map((p, colIdx) => {
      const isFirstOrLastMonth = colIdx === 0 || colIdx === periods.length - 1;
      const isEvenMonth = colIdx % 2 === 0;
      const colPoints = [];

      series.forEach((s) => {
        if (!s.isVisible) return;
        const pt = s.points[colIdx];
        const isValid = pt && pt.val !== null && pt.val !== undefined && !isNaN(pt.val) && !(formatType === 'currency' && pt.val <= 0);
        if (isValid) {
          const rawY = getY(pt.val);
          colPoints.push({
            brandId: s.id,
            brandName: s.name,
            color: s.color,
            stroke: s.stroke,
            bg: s.bg,
            text: s.text,
            val: pt.val,
            formatted: formatVal(pt.val),
            rawY,
            badgeY: rawY - 14
          });
        }
      });

      // Ordenar por valor descendente (mayor valor primero)
      colPoints.sort((a, b) => b.val - a.val);

      const filtered = [];

      if (selectedBrand) {
        // Al seleccionar marca por botón superior, mostrar únicamente la marca seleccionada con foco absoluto
        colPoints.forEach(item => {
          if (item.brandId === selectedBrand) {
            filtered.push(item);
          }
        });
      } else {
        // Solo las marcas prioritarias solicitadas expresamente: Familia Electrolit, Familia Gatorade, Familia Powerade, Suerox
        const priorityPoints = colPoints.filter(item => isPriorityBrand(item.brandId));

        if (isFirstOrLastMonth) {
          // En extremos (primer mes y último mes): Forzosamente todas las marcas prioritarias con datos
          priorityPoints.forEach(item => {
            filtered.push(item);
          });
        } else {
          // Meses intermedios: Criterio "uno sí, uno no" estricto para marcas prioritarias
          priorityPoints.forEach(item => {
            const phase = getBrandPhase(item.brandId);
            const shouldShow = (phase === 0 && isEvenMonth) || (phase === 1 && !isEvenMonth);

            if (shouldShow) {
              filtered.push(item);
            }
          });
        }
      }

      // Ordenar verticalmente en pantalla
      filtered.sort((a, b) => a.badgeY - b.badgeY);

      // Relajación vertical para garantizar separación y evitar amontonamiento
      const minSpacing = 28;
      for (let i = 1; i < filtered.length; i++) {
        const prev = filtered[i - 1];
        const curr = filtered[i];
        if (curr.badgeY - prev.badgeY < minSpacing) {
          curr.badgeY = prev.badgeY + minSpacing;
        }
      }

      // Proteger el eje X: eliminar etiquetas que choquen con la base
      const bottomLimit = padding.top + chartH - 18;
      return filtered.filter(item => item.badgeY <= bottomLimit && item.rawY <= padding.top + chartH - 10);
    });
  }, [periods, series, minY, maxY, formatType, selectedBrand]);

  const svgRef = useRef(null);
  const isMarketShare = metricKey === 'som' || String(title).toLowerCase().includes('som') || String(title).toLowerCase().includes('share') || String(title).toLowerCase().includes('ms');
  const [activeColIdx, setActiveColIdx] = useState(null);

  // Manejador fluido de movimiento del mouse sobre el canvas
  const handleMouseMove = (e) => {
    if (!svgRef.current || !periods || periods.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const clientX = e.clientX - rect.left;
    const svgX = (clientX / rect.width) * width;

    let closestIdx = 0;
    let minDiff = Infinity;
    for (let i = 0; i < periods.length; i++) {
      const px = getX(i);
      const diff = Math.abs(svgX - px);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    }

    if (svgX >= padding.left - 30 && svgX <= width - padding.right + 30) {
      setActiveColIdx(closestIdx);
    }
  };

  // Datos calculados para la Tarjeta Visual de MS (Share Mes y Share YTD acumulado anual)
  const tooltipData = useMemo(() => {
    if (!isMarketShare || activeColIdx === null || !periods || !periods[activeColIdx]) return null;

    const curPeriod = periods[activeColIdx];
    let periodYear = 2026;
    if (curPeriod?.key) {
      periodYear = new Date(curPeriod.key).getUTCFullYear();
    } else if (curPeriod?.label && curPeriod.label.includes('-')) {
      periodYear = 2000 + parseInt(curPeriod.label.split('-')[1], 10);
    }

    // Filtrar periodos YTD pertenecientes al mismo año calendario hasta el mes seleccionado
    const ytdIndices = [];
    periods.forEach((p, idx) => {
      if (idx <= activeColIdx) {
        let pYear = 2026;
        if (p?.key) {
          pYear = new Date(p.key).getUTCFullYear();
        } else if (p?.label && p.label.includes('-')) {
          pYear = 2000 + parseInt(p.label.split('-')[1], 10);
        }
        if (pYear === periodYear) {
          ytdIndices.push(idx);
        }
      }
    });

    // Calcular suma total de mercado en unidades para el periodo YTD
    let totalMarketYtdUnits = 0;
    series.forEach(s => {
      ytdIndices.forEach(idx => {
        const val = data?.[scope]?.['unidades']?.[s.id]?.[idx] || 0;
        totalMarketYtdUnits += val;
      });
    });

    // Construir métricas por marca para la tarjeta
    const brandItems = [];
    series.forEach(s => {
      const shareMes = data?.[scope]?.[metricKey]?.[s.id]?.[activeColIdx];
      if (shareMes !== null && shareMes !== undefined && !isNaN(shareMes)) {
        const brandYtdUnits = ytdIndices.reduce((acc, idx) => {
          const val = data?.[scope]?.['unidades']?.[s.id]?.[idx] || 0;
          return acc + val;
        }, 0);

        const shareYtd = totalMarketYtdUnits > 0 ? (brandYtdUnits / totalMarketYtdUnits) * 100 : shareMes;

        brandItems.push({
          brandId: s.id,
          brandName: s.name || s.id,
          color: s.color || s.stroke,
          shareMes: Number(shareMes),
          shareYtd: Number(shareYtd)
        });
      }
    });

    // Ordenar de mayor a menor participación mensual
    brandItems.sort((a, b) => b.shareMes - a.shareMes);

    return {
      label: curPeriod.label,
      brands: brandItems,
      xPos: getX(activeColIdx)
    };
  }, [isMarketShare, activeColIdx, periods, series, data, scope, metricKey]);

  return (
    <div 
      className="flex flex-col bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all relative"
      onMouseLeave={() => setActiveColIdx(null)}
    >
      {/* TÍTULO DEL KPI */}
      <div className="bg-[#f8fafc] border-b border-slate-200/80 py-3 px-4 text-center rounded-t-xl">
        <span className="text-sm md:text-base font-black text-[#0066c0] tracking-wide">
          {title}
        </span>
      </div>

      {/* CANVAS SVG */}
      <div 
        className="relative w-full p-2 cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setActiveColIdx(null)}
      >
        <svg 
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-auto select-none overflow-visible"
        >
          {/* LÍNEAS GUÍA HORIZONTALES */}
          <line x1={padding.left} y1={padding.top} x2={width - padding.right} y2={padding.top} stroke="#e2e8f0" strokeDasharray="5,5" strokeWidth="1" />
          <line x1={padding.left} y1={padding.top + chartH * 0.33} x2={width - padding.right} y2={padding.top + chartH * 0.33} stroke="#f1f5f9" strokeDasharray="5,5" strokeWidth="1" />
          <line x1={padding.left} y1={padding.top + chartH * 0.66} x2={width - padding.right} y2={padding.top + chartH * 0.66} stroke="#f1f5f9" strokeDasharray="5,5" strokeWidth="1" />
          <line x1={padding.left} y1={padding.top + chartH} x2={width - padding.right} y2={padding.top + chartH} stroke="#cbd5e1" strokeWidth="1.2" />

          {/* LÍNEAS GUÍA VERTICALES */}
          {periods && periods.map((p, idx) => (
            <line
              key={`grid-x-${idx}`}
              x1={getX(idx)}
              y1={padding.top}
              x2={getX(idx)}
              y2={padding.top + chartH}
              stroke="#f8fafc"
              strokeWidth="1.2"
            />
          ))}

          {/* TRAZADOS DE LÍNEAS DE MARCAS (SEGMENTADAS) */}
          {series.map(s => {
            if (!s.isVisible) return null;
            let pathD = '';
            let inSegment = false;
            s.points.forEach((pt, idx) => {
              const isValid = pt && pt.val !== null && pt.val !== undefined && !isNaN(pt.val) && !(formatType === 'currency' && pt.val <= 0);
              if (isValid) {
                const x = getX(idx);
                const y = getY(pt.val);
                if (y !== null) {
                  if (!inSegment) {
                    pathD += ` M ${x.toFixed(1)} ${y.toFixed(1)}`;
                    inSegment = true;
                  } else {
                    pathD += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
                  }
                }
              } else {
                inSegment = false;
              }
            });

            if (!pathD) return null;
            const isSelected = selectedBrand === s.id;
            const isOtherDimmed = selectedBrand && !isSelected;

            return (
              <path
                key={`path-${s.id}`}
                d={pathD}
                fill="none"
                stroke={s.stroke}
                strokeWidth={isSelected ? 5.5 : (s.strokeWidth ? s.strokeWidth * 1.4 : 3.5)}
                strokeDasharray={s.isDashed ? '5,5' : 'none'}
                strokeOpacity={isOtherDimmed ? 0.15 : 1}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-150 pointer-events-none"
              />
            );
          })}

          {/* PUNTOS */}
          {series.map(s => {
            if (!s.isVisible) return null;
            const isSelected = selectedBrand === s.id;
            const isOtherDimmed = selectedBrand && !isSelected;

            return (
              <g key={`pts-${s.id}`}>
                {s.points.map((pt, idx) => {
                  const isValid = pt && pt.val !== null && pt.val !== undefined && !isNaN(pt.val) && !(formatType === 'currency' && pt.val <= 0);
                  if (!isValid) return null;
                  const cx = getX(idx);
                  const cy = getY(pt.val);
                  if (cy === null) return null;

                  return (
                    <g key={`pt-${s.id}-${idx}`}>
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isSelected ? 8 : 5}
                        fill={isSelected ? '#ffffff' : s.stroke}
                        stroke={s.stroke}
                        strokeWidth={isSelected ? 3.6 : 1.8}
                        opacity={isOtherDimmed ? 0.1 : 1}
                        className="pointer-events-none transition-all duration-150"
                      />
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* PASTILLAS / BADGES DE VALORES (CON FORMATO NEGRITAS) */}
          {columnBadges.map((colItems, colIdx) => {
            const x = getX(colIdx);
            return (
              <g key={`col-badges-${colIdx}`}>
                {colItems.map((badge, bIdx) => {
                  const isSelected = selectedBrand === badge.brandId;
                  const badgeW = Math.max(42, String(badge.formatted).length * 10.5 + 14);
                  const badgeH = 26;

                  return (
                    <g
                      key={`badge-${colIdx}-${badge.brandId}-${bIdx}`}
                      transform={`translate(${x - badgeW / 2}, ${badge.badgeY - badgeH / 2})`}
                      className="pointer-events-none transition-transform"
                    >
                      <rect
                        width={badgeW}
                        height={badgeH}
                        rx="5"
                        fill={isSelected ? badge.color : badge.bg}
                        stroke={badge.stroke}
                        strokeWidth={isSelected ? 2 : 1}
                        style={{
                          filter: isSelected ? 'drop-shadow(0px 2px 6px rgba(0,0,0,0.35))' : 'drop-shadow(0px 1px 3px rgba(0,0,0,0.08))'
                        }}
                      />
                      <text
                        x={badgeW / 2}
                        y={badgeH / 2 + 4.5}
                        textAnchor="middle"
                        fill={isSelected ? '#ffffff' : badge.text}
                        fontSize={isSelected ? '15px' : '13.5px'}
                        fontWeight="bold"
                        fontFamily="ui-sans-serif, system-ui, sans-serif"
                      >
                        {badge.formatted}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* LÍNEA GUÍA VERTICAL INTERACTIVA (CROSSHAIR EN MES ACTIVO) */}
          {isMarketShare && activeColIdx !== null && (
            <line
              x1={getX(activeColIdx)}
              y1={padding.top}
              x2={getX(activeColIdx)}
              y2={padding.top + chartH}
              stroke="#0f172a"
              strokeWidth="2"
              strokeDasharray="4,3"
              className="pointer-events-none transition-all"
            />
          )}

          {/* ETIQUETAS EJE X (MESES / FECHAS CON TAMAÑO INCREMENTADO) */}
          {periods && periods.map((p, idx) => {
            const x = getX(idx);
            const y = height - padding.bottom + 28;
            const isActive = isMarketShare && activeColIdx === idx;
            return (
              <g key={`x-lbl-${idx}`} transform={`translate(${x}, ${y})`}>
                <text
                  x="0"
                  y="0"
                  transform="rotate(-90)"
                  textAnchor="end"
                  fill={isActive ? '#0066c0' : '#1e293b'}
                  fontSize={isActive ? '16.5px' : '15.5px'}
                  fontWeight={isActive ? '900' : '700'}
                  fontFamily="ui-sans-serif, system-ui, sans-serif"
                >
                  {p.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* TARJETA VISUAL FLOTANTE POWER BI (MS MES + MS YTD) */}
        {isMarketShare && tooltipData && tooltipData.brands.length > 0 && (
          <div
            className="absolute z-50 pointer-events-none transition-all duration-75 ease-out"
            style={{
              top: '16px',
              left: activeColIdx >= (periods.length / 2)
                ? `${Math.max(2, (getX(activeColIdx) / width) * 100 - 46)}%`
                : `${Math.min(54, (getX(activeColIdx) / width) * 100 + 4)}%`,
              width: '210px'
            }}
          >
            <div className="bg-[#262626] text-white rounded-md p-3 shadow-2xl border border-slate-700 font-sans backdrop-blur-xs select-none">
              {/* ENCABEZADO: MES SELECCIONADO */}
              <div className="text-[12.5px] font-extrabold text-slate-100 border-b border-slate-700 pb-1 mb-2 flex items-center justify-between">
                <span>{tooltipData.label}</span>
                <span className="text-[10px] text-sky-400 font-normal uppercase tracking-wider">SOM</span>
              </div>

              {/* LISTA DE MARCAS CON SHARE MES Y SHARE YTD */}
              <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-0.5 scrollbar-thin scrollbar-thumb-slate-600">
                {tooltipData.brands.map((b) => (
                  <div key={`tt-${b.brandId}`} className="flex items-start gap-2 text-xs">
                    <span
                      className="w-2.5 h-2.5 rounded-full mt-1 shrink-0 ring-1 ring-white/20 shadow-xs"
                      style={{ backgroundColor: b.color }}
                    />
                    <div className="flex flex-col flex-1 leading-tight">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">MARCA</span>
                        <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wide truncate">{b.brandName}</span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5 text-slate-300">
                        <span className="text-[10.5px] text-slate-400 font-medium">Share Mes</span>
                        <span className="text-[11.5px] font-black text-white">{b.shareMes.toFixed(1)} %</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-[10.5px] text-slate-400 font-medium">Share YTD</span>
                        <span className="text-[11.5px] font-black text-white">{b.shareYtd.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// COMPONENTE: TABLA DE DATOS HOMOLOGADA
// ==========================================
function DataTable({
  tableData,
  periods,
  selectedMetric,
  formatType = 'k'
}) {
  const formatCell = (val) => {
    if (val === null || val === undefined || isNaN(val)) return '-';
    if (formatType === 'percent') return `${Math.round(val)}%`;
    if (formatType === 'currency') return `$${Number(val).toFixed(2)}`;
    if (formatType === 'decimal') return Number(val).toFixed(1);
    if (formatType === 'k') return Math.round(val).toLocaleString();
    return Math.round(val).toLocaleString();
  };

  const rows = tableData?.rows || [];
  const totalRow = tableData?.totalRow || null;

  return (
    <div className="flex-1 overflow-x-auto max-h-[535px] overflow-y-auto bg-white rounded-lg border border-slate-300/80 shadow-2xs relative scrollbar-thin scrollbar-thumb-slate-300">
      <table className="w-full text-left border-collapse font-sans">
        <thead className="sticky top-0 z-20 shadow-xs">
          <tr className="bg-[#e2e8f0] text-slate-900 border-b border-slate-300 font-extrabold uppercase text-xs md:text-[13px] tracking-wide">
            <th className="py-3 px-4 border-r border-slate-300 min-w-[150px] bg-[#e2e8f0]">MARCA/RESTO</th>
            {periods && periods.map((p, idx) => (
              <th key={`th-${idx}`} className="py-3 px-3 text-right border-r border-slate-300/70 font-extrabold min-w-[60px] text-xs md:text-[13px] bg-[#e2e8f0]">
                {p.label}
              </th>
            ))}
            <th className="py-3 px-3.5 text-right font-black bg-[#cbd5e1] text-slate-950 min-w-[70px] text-xs md:text-[13.5px]">
              TOTAL
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {rows.map((row, idx) => {
            const upper = (row.brand || '').toUpperCase().trim();
            const isPisaBrand = upper.includes('ELECTROLIT') || upper.includes('ELECTROLIFE') || upper.includes('HIDRAVIDA') || upper.includes('HIDRALIFE');

            return (
              <tr 
                key={`tr-${idx}`} 
                className={`transition-colors ${
                  isPisaBrand 
                    ? 'bg-[#e0f2fe] hover:bg-[#bae6fd] text-[#004B93]' 
                    : 'hover:bg-slate-50/90 text-slate-700'
                }`}
              >
                <td className={`py-2.5 px-4 border-r border-slate-200/80 text-xs md:text-[13.5px] ${isPisaBrand ? 'font-black text-[#004B93]' : 'font-bold'}`}>
                  {row.brand}
                </td>
                {row.monthly.map((val, mIdx) => (
                  <td 
                    key={`td-${idx}-${mIdx}`} 
                    className={`py-2.5 px-3 text-right border-r border-slate-200/50 font-mono text-xs md:text-[13.5px] ${
                      isPisaBrand ? 'font-bold text-[#004B93]' : 'font-semibold text-slate-800'
                    }`}
                  >
                    {formatCell(val)}
                  </td>
                ))}
                <td 
                  className={`py-2.5 px-3.5 text-right font-mono text-xs md:text-[14px] font-black border-l border-slate-200 ${
                    isPisaBrand ? 'bg-[#bae6fd]/60 text-[#003870]' : 'bg-slate-100/90 text-slate-950'
                  }`}
                >
                  {formatCell(row.total)}
                </td>
              </tr>
            );
          })}
        </tbody>
        {/* FILA DE TOTAL GENERAL FIJA EN EL PIE DE TABLA */}
        {totalRow && (
          <tfoot className="sticky bottom-0 z-20 shadow-xs">
            <tr className="bg-[#f1f5f9] font-black text-slate-950 border-t-2 border-slate-300/90">
              <td className="py-3 px-4 border-r border-slate-300 font-black uppercase text-xs md:text-[13.5px] bg-[#f1f5f9]">
                {totalRow.label || 'TOTAL'}
              </td>
              {totalRow.monthly.map((val, mIdx) => (
                <td key={`td-tot-${mIdx}`} className="py-3 px-3 text-right border-r border-slate-200 font-mono text-xs md:text-[13.5px] font-black text-slate-950 bg-[#f1f5f9]">
                  {formatCell(val)}
                </td>
              ))}
              <td className="py-3 px-3.5 text-right font-black bg-[#cbd5e1] text-slate-950 font-mono text-xs md:text-[14px]">
                {formatCell(totalRow.total)}
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

// ==========================================
// COMPONENTE: SEGMENTADOR DE MÉTRICAS (RADIO BUTTONS)
// ==========================================
function MetricSlicer({
  title,
  options,
  selectedMetric,
  onSelect,
  isRegion = false
}) {
  return (
    <div className="w-[195px] bg-white rounded-lg border border-slate-300/80 shadow-2xs p-2.5 flex flex-col shrink-0">
      {/* HEADER DEL SEGMENTADOR */}
      <div className="bg-[#0066c0] text-white py-1.5 px-2 rounded-xs font-black text-xs md:text-[12.5px] text-center mb-2.5 shadow-2xs">
        {title}
      </div>

      {/* LISTA DE RADIOS */}
      <div className="flex flex-col gap-2 px-1 py-0.5">
        {options.map((opt) => {
          const isSelected = selectedMetric === opt.id;
          const displayLabel = isRegion && opt.slicerLabelRegion ? opt.slicerLabelRegion : opt.slicerLabel;

          return (
            <label
              key={opt.id}
              onClick={() => onSelect(opt.id)}
              className="flex items-center gap-2.5 cursor-pointer text-xs md:text-[12.5px] font-medium text-slate-700 hover:text-[#0066c0] select-none py-0.5 transition-colors"
            >
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                isSelected 
                  ? 'border-[#0066c0] bg-white ring-1 ring-[#0066c0]' 
                  : 'border-slate-400 bg-white hover:border-slate-600'
              }`}>
                {isSelected && (
                  <div className="w-2.5 h-2.5 rounded-full bg-[#0066c0]" />
                )}
              </div>
              <span className={isSelected ? 'font-black text-[#0066c0]' : 'font-semibold text-slate-800'}>
                {displayLabel}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

// ==========================================
// VISTA PRINCIPAL: GUATEMALA VIEW (MARCA X REGIÓN)
// ==========================================
export default function GuatemalaView({ onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [anio, setAnio] = useState('2026');
  const [mes, setMes] = useState('Todas');
  
  // Región activa para el bloque 2
  const [selectedRegion, setSelectedRegion] = useState('METRO');

  // Segmentador 1 (Totales País) & Segmentador 2 (Regiones) - 100% INDEPENDIENTES
  const [metricTableTotales, setMetricTableTotales] = useState('dist');
  const [metricTableRegiones, setMetricTableRegiones] = useState('precio');

  // Marca seleccionada por botón superior para destacar entre todas las gráficas de la pantalla
  const [selectedBrand, setSelectedBrand] = useState(null);

  // Filtro de marcas activas
  const [activeBrands, setActiveBrands] = useState(BRANDS_CONFIG.map(b => b.id));

  // Cargar datos del endpoint
  useEffect(() => {
    setLoading(true);
    fetch(`/api/nielsen/gt/guatemala?anio=${anio}&mes=${mes}`)
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching guatemala data:', err);
        setLoading(false);
      });
  }, [anio, mes]);

  const handleBrandClick = (brandId) => {
    setSelectedBrand(prev => prev === brandId ? null : brandId);
  };

  const getFormatForMetric = (metricId) => {
    const m = METRIC_CONFIGS.find(c => c.id === metricId);
    return m ? m.format : 'k';
  };

  const getSlicerTitle = (metricId, isRegion = false) => {
    const m = METRIC_CONFIGS.find(c => c.id === metricId);
    if (!m) return isRegion ? 'Región' : 'Totales';
    const label = isRegion && m.slicerLabelRegion ? m.slicerLabelRegion : m.slicerLabel;
    return isRegion ? 'Región' : `Totales: ${label}`;
  };

  return (
    <div className="min-h-screen bg-[#f4f7fa] flex flex-col font-sans pb-16">
      
      {/* HEADER HOMOLOGADO FULL-WIDTH */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40 shadow-xs">
        {/* LOGOS OFICIALES: HIDRAVIDA | NIELSEN */}
        <div className="flex items-center gap-3">
          <img 
            src="/assets/LOGOS/Hidravida-color.png" 
            alt="Hidravida Logo" 
            className="h-8 md:h-9 object-contain"
            onError={(e) => {
              e.target.src = "/assets/LOGOS/Electrolit-color.png";
            }}
          />
          <div className="h-6 w-px bg-slate-300" />
          <img 
            src="/assets/LOGOS/Nielsen-logo.png" 
            alt="Nielsen Logo" 
            className="h-7 md:h-8 object-contain"
          />
        </div>

        {/* TITULO CENTRAL */}
        <div className="flex-1 text-center min-w-[200px]">
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-[#0066c0]">
            Marca X Región
          </h1>
        </div>

        {/* SELECTORES Y BOTON HOME */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-start">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Año</span>
            <select
              value={anio}
              onChange={(e) => setAnio(e.target.value)}
              className="bg-white border border-slate-300 rounded text-xs font-bold px-2.5 py-1 text-slate-700 shadow-xs hover:border-slate-400 focus:outline-hidden focus:ring-1 focus:ring-sky-500 cursor-pointer"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>

          <div className="flex flex-col items-start">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Mes</span>
            <select
              value={mes}
              onChange={(e) => setMes(e.target.value)}
              className="bg-white border border-slate-300 rounded text-xs font-bold px-2.5 py-1 text-slate-700 shadow-xs hover:border-slate-400 focus:outline-hidden focus:ring-1 focus:ring-sky-500 cursor-pointer"
            >
              <option value="Todas">Todas</option>
              <option value="1">Enero</option>
              <option value="2">Febrero</option>
              <option value="3">Marzo</option>
              <option value="4">Abril</option>
              <option value="5">Mayo</option>
              <option value="6">Junio</option>
              <option value="7">Julio</option>
              <option value="8">Agosto</option>
              {anio !== '2026' && (
                <>
                  <option value="9">Septiembre</option>
                  <option value="10">Octubre</option>
                  <option value="11">Noviembre</option>
                  <option value="12">Diciembre</option>
                </>
              )}
            </select>
          </div>

          <button
            onClick={onBack}
            className="flex items-center justify-center p-2 rounded-lg bg-blue-50 text-[#0066c0] hover:bg-blue-100 transition shadow-xs border border-blue-200 cursor-pointer mt-3.5"
            title="Volver a la Portada"
          >
            <Home className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* BARRA DE CHIPS DE MARCAS (FULL-WIDTH) */}
      <div className="bg-white border-b border-slate-200 px-6 py-2.5 shadow-2xs sticky top-[61px] z-30">
        <div className="max-w-[1920px] mx-auto flex flex-wrap items-center justify-center gap-2">
          {BRANDS_CONFIG.map(brand => {
            const isSelected = selectedBrand === brand.id;

            return (
              <button
                key={brand.id}
                onClick={() => handleBrandClick(brand.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                  isSelected 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-105 ring-2 ring-sky-400' 
                    : selectedBrand 
                      ? 'bg-slate-100 text-slate-400 border-slate-200 opacity-60 hover:opacity-100'
                      : 'bg-white text-slate-800 border-slate-300 shadow-2xs hover:bg-slate-50'
                }`}
              >
                <span 
                  className="w-3 h-3 rounded-full shrink-0 shadow-xs" 
                  style={{ backgroundColor: brand.color }} 
                />
                <span className="truncate">{brand.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL FULL-WIDTH */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-16">
          <RefreshCw className="w-10 h-10 animate-spin mb-3 text-[#0066c0]" />
          <h3 className="text-base font-black text-[#004B93]">Cargando datos de Nielsen Guatemala...</h3>
          <p className="text-xs text-slate-400 mt-1">Sincronizando métricas territoriales desde BigQuery</p>
        </div>
      ) : (
        <main className="w-full px-2 md:px-4 py-4 space-y-8">
          
          {/* ========================================== */}
          {/* BLOQUE 1: TOTALES PAÍS (GUATEMALA)         */}
          {/* ========================================== */}
          <section className="bg-white rounded-2xl border border-slate-200/60 shadow-xs p-3 md:p-4 space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-black text-[#0066c0] tracking-tight inline-block border-b-2 border-[#0066c0] pb-1 px-4">
                Totales
              </h2>
            </div>

            {/* 5 MINI GRÁFICAS DE TOTALES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
              {METRIC_CONFIGS.map(m => (
                <LineChartCard
                  key={`totales-${m.id}`}
                  title={m.label}
                  scope="TOTAL"
                  metricKey={m.id}
                  data={data?.charts}
                  periods={data?.periods}
                  activeBrands={activeBrands}
                  selectedBrand={selectedBrand}
                  formatType={m.format}
                />
              ))}
            </div>

            {/* TABLA DE TOTALES + SEGMENTADOR 1 */}
            <div className="flex flex-col md:flex-row gap-4 items-start pt-2">
              <DataTable
                tableData={data?.tables?.TOTAL?.[metricTableTotales]}
                periods={data?.periods}
                selectedMetric={metricTableTotales}
                formatType={getFormatForMetric(metricTableTotales)}
              />

              <MetricSlicer
                title={getSlicerTitle(metricTableTotales, false)}
                options={METRIC_CONFIGS}
                selectedMetric={metricTableTotales}
                onSelect={(id) => setMetricTableTotales(id)}
                isRegion={false}
              />
            </div>
          </section>

          {/* ========================================== */}
          {/* BLOQUE 2: REGIONES (GUATEMALA)             */}
          {/* ========================================== */}
          <section className="bg-white rounded-2xl border border-slate-200/60 shadow-xs p-3 md:p-4 space-y-6">
            <div className="text-center space-y-3">
              <h2 className="text-2xl font-black text-[#0066c0] tracking-tight inline-block border-b-2 border-[#0066c0] pb-1 px-4">
                Regiones
              </h2>

              {/* SELECTOR DE PESTAÑAS DE REGIONES */}
              <div className="flex flex-wrap justify-center p-1 bg-slate-200/80 rounded-lg gap-1 border border-slate-300 shadow-2xs max-w-fit mx-auto">
                {REGIONES.map(reg => {
                  const isSelected = selectedRegion === reg;
                  return (
                    <button
                      key={reg}
                      onClick={() => setSelectedRegion(reg)}
                      className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#004B93] text-white shadow-xs scale-102'
                          : 'bg-white text-slate-700 hover:bg-slate-100 hover:text-[#004B93]'
                      }`}
                    >
                      {reg}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5 MINI GRÁFICAS DE LA REGIÓN SELECCIONADA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
              {METRIC_CONFIGS.map(m => (
                <LineChartCard
                  key={`region-${selectedRegion}-${m.id}`}
                  title={m.label}
                  scope={selectedRegion}
                  metricKey={m.id}
                  data={data?.charts}
                  periods={data?.periods}
                  activeBrands={activeBrands}
                  selectedBrand={selectedBrand}
                  formatType={m.format}
                />
              ))}
            </div>

            {/* TABLA DE REGIÓN + SEGMENTADOR 2 (INDEPENDIENTE) */}
            <div className="flex flex-col md:flex-row gap-4 items-start pt-2">
              <DataTable
                tableData={data?.tables?.[selectedRegion]?.[metricTableRegiones]}
                periods={data?.periods}
                selectedMetric={metricTableRegiones}
                formatType={getFormatForMetric(metricTableRegiones)}
              />

              <MetricSlicer
                title={getSlicerTitle(metricTableRegiones, true)}
                options={METRIC_CONFIGS}
                selectedMetric={metricTableRegiones}
                onSelect={(id) => setMetricTableRegiones(id)}
                isRegion={true}
              />
            </div>
          </section>
        </main>
      )}

    </div>
  );
}
