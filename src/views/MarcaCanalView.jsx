import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Home, RefreshCw } from 'lucide-react';

// ==========================================
// CONFIGURACIÓN DE MARCAS Y PALETA POWER BI
// ==========================================
const BRANDS_CONFIG = [
  { id: 'Electrolit', name: 'Electrolit', color: '#0066c0', stroke: '#0066c0', bg: '#e0f2fe', text: '#0369a1', strokeWidth: 2.6 },
  { id: 'Electrolife', name: 'Electrolife', color: '#38bdf8', stroke: '#0284c7', bg: '#e0f7fa', text: '#0284c7', strokeWidth: 2.2 },
  { id: 'Gatorade', name: 'Gatorade', color: '#ea580c', stroke: '#ea580c', bg: '#ffedd5', text: '#c2410c', strokeWidth: 2.4 },
  { id: 'Gatorlyte', name: 'Gatorlyte', color: '#fdba74', stroke: '#f97316', bg: '#fed7aa', text: '#c2410c', strokeWidth: 2 },
  { id: 'Powerade', name: 'Powerade', color: '#6b21a8', stroke: '#6b21a8', bg: '#ede9fe', text: '#581c87', strokeWidth: 2.6 },
  { id: 'Pedialyte', name: 'Pedialyte', color: '#dc2626', stroke: '#dc2626', bg: '#fee2e2', text: '#b91c1c', strokeWidth: 2 },
  { id: 'Prime', name: 'Prime', color: '#db2777', stroke: '#db2777', bg: '#fce7f3', text: '#be185d', strokeWidth: 2 },
  { id: 'Suerox', name: 'Suerox', color: '#991b1b', stroke: '#991b1b', bg: '#ffe4e6', text: '#9f1239', strokeWidth: 2 },
  { id: 'Dilyte', name: 'Dilyte', color: '#ca8a04', stroke: '#ca8a04', bg: '#fef9c3', text: '#a16207', strokeWidth: 2 },
  { id: 'Fastlyte', name: 'Fastlyte', color: '#c084fc', stroke: '#a855f7', bg: '#f3e8ff', text: '#7e22ce', strokeWidth: 2 },
  { id: 'Resto Marcas', name: 'Resto Marcas', color: '#94a3b8', stroke: '#94a3b8', bg: '#f1f5f9', text: '#475569', strokeWidth: 1.6, isDashed: true }
];

const CHANNELS = ['COSTA RICA', 'MODERNO', 'TRADICIONAL'];

// ==========================================
// COMPONENTE: GRÁFICA MULTI-LÍNEA SVG AMPLIA
// ==========================================
function MultiLineChart({ 
  channel, 
  metricKey, 
  data, 
  periods, 
  activeBrands, 
  selectedBrand, 
  formatType = 'number'
}) {
  const containerRef = useRef(null);
  const [hoverIndex, setHoverIndex] = useState(null);

  // Dimensiones ampliadas para aprovechar todo el ancho y dar altura visual nítida
  const width = 540;
  const height = 430;
  const padding = { top: 36, right: 26, bottom: 64, left: 26 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // Encontrar valor min y max global para el eje Y
  const { minY, maxY, series } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    const seriesList = [];

    BRANDS_CONFIG.forEach(b => {
      const isVisible = activeBrands.includes(b.id);
      const points = data?.[metricKey]?.[channel]?.[b.id] || [];
      
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
    const padFactor = range === 0 ? 1 : range * 0.14;
    const adjustedMin = Math.max(0, min - padFactor);
    const adjustedMax = max + padFactor;

    return { minY: adjustedMin, maxY: adjustedMax, series: seriesList };
  }, [data, metricKey, channel, activeBrands]);

  // Funciones de escala
  const getX = (idx) => {
    if (!periods || periods.length <= 1) return padding.left;
    return padding.left + (idx / (periods.length - 1)) * chartW;
  };

  const getY = (val) => {
    if (val === null || val === undefined || isNaN(val)) return null;
    if (maxY === minY) return padding.top + chartH / 2;
    return padding.top + chartH - ((val - minY) / (maxY - minY)) * chartH;
  };

  // Formateador de valores
  const formatVal = (val) => {
    if (val === null || val === undefined || isNaN(val)) return '-';
    if (formatType === 'percent') return `${Math.round(val)}%`;
    if (formatType === 'currency') return `${val.toFixed(2)}`;
    if (formatType === 'decimal') return `${val.toFixed(1)}`;
    if (formatType === 'k') return Math.round(val).toLocaleString();
    return Math.round(val).toLocaleString();
  };

  // Motor inteligente de distribución de etiquetas alternadas y limpias (staggered):
  // - En mes 0 y mes 11: Top marcas líderes + PiSA (máx 4 para evitar saturación de torres)
  // - En meses intermedios: alternancia intercalada tipo ajedrez (máx 2-3 por columna)
  // - Ruptura de segmentos en valores nulos (evita líneas artificiales a cero)
  // - En hover: muestra todos los meses de la marca seleccionada
  const columnBadges = useMemo(() => {
    if (!periods || periods.length === 0) return [];

    return periods.map((p, colIdx) => {
      const colPoints = [];

      series.forEach(s => {
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
            badgeY: rawY - 12
          });
        }
      });

      // Ordenar por valor descendente (mayor valor = menor Y en pantalla / rank 0)
      colPoints.sort((a, b) => b.val - a.val);

      const filtered = [];

      if (selectedBrand) {
        // En selección: mostrar siempre la marca focalizada en cada mes
        colPoints.forEach(item => {
          if (item.brandId === selectedBrand) {
            filtered.push(item);
          }
        });
      } else {
        const isFirstOrLastMonth = colIdx === 0 || colIdx === periods.length - 1;
        const restoPoint = colPoints.find(p => p.brandId === 'Resto Marcas' || p.brandId === 'Resto de Marcas');
        const restoVal = (restoPoint && restoPoint.val !== null) ? restoPoint.val : -Infinity;

        const priorityBrands = [
          'hidravida', 'hidralife', 'electrolit', 'electrolife',
          'gatorade', 'powerade', 'suerox', 'pedialyte', 'isomax', 'revive', 'sporade'
        ];
        const isPriorityBrand = (brandId) => priorityBrands.includes(String(brandId).toLowerCase().trim());
        const isPisaBrand = (brandId) => ['hidravida', 'hidralife', 'electrolit', 'electrolife'].includes(String(brandId).toLowerCase().trim());

        // Filtrar candidatos respetando exclusión de Resto Marcas salvo marcas clave protegidas
        const candidates = colPoints.filter((item, rank) => {
          const isRestoBrand = item.brandId === 'Resto Marcas' || item.brandId === 'Resto de Marcas';
          const isPriority = isPriorityBrand(item.brandId);
          const isBelowResto = restoPoint && item.val <= restoVal;

          if (isRestoBrand || (!isPriority && isBelowResto)) {
            return false;
          }
          return true;
        });

        const brandPhases = {
          'electrolit': 0,
          'hidravida': 0,
          'powerade': 0,
          'suerox': 0,
          'isomax': 0,
          'revive': 0,
          'electrolife': 1,
          'hidralife': 1,
          'gatorade': 1,
          'pedialyte': 1,
          'sporade': 1,
          'glucosoral': 1
        };

        const getBrandPhase = (brandId) => {
          const key = String(brandId).toLowerCase().trim();
          return brandPhases[key] !== undefined ? brandPhases[key] : 0;
        };

        if (isFirstOrLastMonth) {
          // En mes 0 y mes 11: Mostrar marcas clave y líderes, evitando torres saturadas
          candidates.forEach(item => {
            const tooClose = filtered.some(f => Math.abs(f.rawY - item.rawY) < 16);
            const isPisa = isPisaBrand(item.brandId);
            const isPriority = isPriorityBrand(item.brandId);
            if (!tooClose || isPisa || isPriority) {
              if (!tooClose) {
                filtered.push(item);
              } else if ((isPisa || isPriority) && !filtered.some(f => f.brandId === item.brandId)) {
                filtered.push(item);
              }
            }
          });
        } else {
          // Meses intermedios (1 al 10): Criterio estricto y balanceado "uno sí, uno no" por marca
          const isEvenMonth = colIdx % 2 === 0;
          candidates.forEach(item => {
            const phase = getBrandPhase(item.brandId);
            const shouldShow = (phase === 0 && isEvenMonth) || (phase === 1 && !isEvenMonth);

            if (shouldShow) {
              filtered.push(item);
            }
          });
        }
      }

      // Ordenar de arriba a abajo en pantalla (menor Y = más arriba)
      filtered.sort((a, b) => a.badgeY - b.badgeY);

      // Relajación vertical para evitar colisiones entre líneas cercanas
      const minSpacing = 22;
      for (let i = 1; i < filtered.length; i++) {
        const prev = filtered[i - 1];
        const curr = filtered[i];
        if (curr.badgeY - prev.badgeY < minSpacing) {
          curr.badgeY = prev.badgeY + minSpacing;
        }
      }

      // Eliminar etiquetas que se empalmen con fechas o elementos de texto del eje X
      const bottomLimit = padding.top + chartH - 12;
      return filtered.filter(item => item.badgeY <= bottomLimit && item.rawY <= padding.top + chartH - 6);
    });
  }, [periods, series, minY, maxY, formatType, selectedBrand]);

  const isMarketShare = metricKey === 'som' || String(metricKey).toLowerCase().includes('share');

  // Datos calculados para la Tarjeta Visual de MS (Share Mes y Share YTD acumulado anual)
  const msTooltipData = useMemo(() => {
    if (!isMarketShare || hoverIndex === null || !periods || !periods[hoverIndex]) return null;

    const curPeriod = periods[hoverIndex];
    let periodYear = 2026;
    if (curPeriod?.key) {
      periodYear = new Date(curPeriod.key).getUTCFullYear();
    } else if (curPeriod?.label && curPeriod.label.includes('-')) {
      periodYear = 2000 + parseInt(curPeriod.label.split('-')[1], 10);
    }

    const ytdIndices = [];
    periods.forEach((p, idx) => {
      if (idx <= hoverIndex) {
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

    let totalMarketYtdUnits = 0;
    series.forEach(s => {
      ytdIndices.forEach(idx => {
        const val = data?.['unidades']?.[channel]?.[s.id]?.[idx] || 0;
        totalMarketYtdUnits += val;
      });
    });

    const brandItems = [];
    series.forEach(s => {
      const shareMes = data?.[metricKey]?.[channel]?.[s.id]?.[hoverIndex];
      if (shareMes !== null && shareMes !== undefined && !isNaN(shareMes)) {
        const brandYtdUnits = ytdIndices.reduce((acc, idx) => {
          const val = data?.['unidades']?.[channel]?.[s.id]?.[idx] || 0;
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

    brandItems.sort((a, b) => b.shareMes - a.shareMes);

    return {
      label: curPeriod.label,
      brands: brandItems
    };
  }, [isMarketShare, hoverIndex, periods, series, data, channel, metricKey]);

  return (
    <div className="relative flex flex-col bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-sky-300 transition-all">
      {/* HEADER DE CANAL */}
      <div className="bg-[#f0f6fc] border-b border-sky-100 py-2 px-3 rounded-t-xl text-center">
        <span className="text-xs font-black text-[#0066c0] tracking-wider uppercase">
          {channel}
        </span>
      </div>

      {/* SVG CANVAS */}
      <div className="relative w-full p-1" ref={containerRef}>
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-auto select-none overflow-visible"
        >
          {/* LÍNEAS DE GUÍA HORIZONTALES (GRID LIMPIO) */}
          <line 
            x1={padding.left} 
            y1={padding.top} 
            x2={width - padding.right} 
            y2={padding.top} 
            stroke="#e2e8f0" 
            strokeDasharray="3,3" 
            strokeWidth="0.8" 
          />
          <line 
            x1={padding.left} 
            y1={padding.top + chartH * 0.25} 
            x2={width - padding.right} 
            y2={padding.top + chartH * 0.25} 
            stroke="#f1f5f9" 
            strokeDasharray="3,3" 
            strokeWidth="0.8" 
          />
          <line 
            x1={padding.left} 
            y1={padding.top + chartH * 0.5} 
            x2={width - padding.right} 
            y2={padding.top + chartH * 0.5} 
            stroke="#e2e8f0" 
            strokeDasharray="3,3" 
            strokeWidth="0.8" 
          />
          <line 
            x1={padding.left} 
            y1={padding.top + chartH * 0.75} 
            x2={width - padding.right} 
            y2={padding.top + chartH * 0.75} 
            stroke="#f1f5f9" 
            strokeDasharray="3,3" 
            strokeWidth="0.8" 
          />
          <line 
            x1={padding.left} 
            y1={padding.top + chartH} 
            x2={width - padding.right} 
            y2={padding.top + chartH} 
            stroke="#cbd5e1" 
            strokeWidth="1.2" 
          />

          {/* LÍNEAS DE TENDENCIA DE CADA MARCA (CON DISCONTINUIDAD LIMPIA EN NULOS/CERO) */}
          {series.map(s => {
            if (!s.isVisible) return null;
            const isSelected = selectedBrand === s.id;
            const isDimmed = selectedBrand && selectedBrand !== s.id;

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
                inSegment = false; // Rompe el segmento en meses sin datos/nulos
              }
            });

            if (!pathD) return null;

            return (
              <g 
                key={s.id} 
                className="transition-all duration-200 pointer-events-none"
                style={{ opacity: isDimmed ? 0.12 : 1 }}
              >
                {/* LÍNEA PRINCIPAL VISIBLE */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={s.stroke}
                  strokeWidth={isSelected ? 4.5 : isDimmed ? 1.2 : s.strokeWidth}
                  strokeDasharray={s.isDashed ? '3,3' : 'none'}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-200"
                />

                {/* PUNTOS EN CADA MES (SOLO PARA PUNTOS VÁLIDOS) */}
                {s.points.map((pt, idx) => {
                  const isValid = pt && pt.val !== null && pt.val !== undefined && !isNaN(pt.val) && !(formatType === 'currency' && pt.val <= 0);
                  if (!isValid) return null;
                  const cx = getX(idx);
                  const cy = getY(pt.val);
                  if (cy === null) return null;

                  return (
                    <g key={idx}>
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isSelected ? 5.5 : isDimmed ? 1.8 : 3.0}
                        fill={isSelected ? '#ffffff' : s.color}
                        stroke={s.color}
                        strokeWidth={isSelected ? 2.8 : isDimmed ? 0.5 : 1.2}
                        className="transition-all duration-200"
                      />
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* PASTILLAS / BADGES DE DATOS HOMOLOGADOS CON TAMAÑO AMPLIADO Y ALTERNANCIA */}
          {columnBadges.map((col, colIdx) => {
            const cx = getX(colIdx);

            return (
              <g key={colIdx}>
                {col.map(b => {
                  const isSelected = selectedBrand === b.brandId;
                  const isDimmed = selectedBrand && selectedBrand !== b.brandId;

                  if (selectedBrand && !isSelected) return null;

                  // Ancho dinámico del badge ajustado con +1.5 puntos de tamaño
                  const textLen = b.formatted.length;
                  const badgeW = Math.max(32, textLen * 8 + 12);
                  const badgeH = 19.5;

                  return (
                    <g 
                      key={b.brandId} 
                      transform={`translate(${cx}, ${b.badgeY})`}
                      style={{ 
                        opacity: isDimmed ? 0.12 : 1,
                        transform: isSelected ? `translate(${cx}px, ${b.badgeY}px) scale(1.12)` : `translate(${cx}px, ${b.badgeY}px)`
                      }}
                      className="transition-all duration-200 pointer-events-none"
                    >
                      <rect
                        x={-badgeW / 2}
                        y={-badgeH / 2}
                        width={badgeW}
                        height={badgeH}
                        rx={5}
                        fill={b.bg}
                        stroke={b.color}
                        strokeWidth={isSelected ? 1.8 : 1.1}
                        opacity={0.98}
                        className={isSelected ? "drop-shadow-md" : "drop-shadow-xs"}
                      />
                      <text
                        x={0}
                        y={4.4}
                        textAnchor="middle"
                        fill={b.text}
                        fontSize={isSelected ? "14" : "12.5"}
                        fontWeight="600"
                        fontFamily="sans-serif"
                        letterSpacing="-0.2px"
                      >
                        {b.formatted}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* EJE X: ETIQUETAS DE MESES ROTADAS */}
          {periods?.map((p, idx) => {
            const x = getX(idx);
            const y = padding.top + chartH + 10;
            const isActive = hoverIndex === idx;
            return (
              <g key={p.key} transform={`translate(${x}, ${y})`}>
                <text
                  x={0}
                  y={0}
                  transform="rotate(-90)"
                  textAnchor="end"
                  fill={isActive ? '#0066c0' : '#334155'}
                  fontSize={isActive ? "10.5" : "9.5"}
                  fontWeight="bold"
                  fontFamily="sans-serif"
                >
                  {p.label}
                </text>
              </g>
            );
          })}

          {/* ÁREA INTERACTIVA HOVER */}
          {periods?.map((p, idx) => {
            const x = getX(idx);
            const colW = chartW / (periods.length - 1 || 1);
            return (
              <rect
                key={p.key}
                x={x - colW / 2}
                y={padding.top}
                width={colW}
                height={chartH + padding.bottom}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoverIndex(idx)}
                onMouseLeave={() => setHoverIndex(null)}
              />
            );
          })}

          {/* LÍNEA GUÍA HOVER */}
          {hoverIndex !== null && (
            <line
              x1={getX(hoverIndex)}
              y1={padding.top}
              x2={getX(hoverIndex)}
              y2={padding.top + chartH}
              stroke="#0f172a"
              strokeDasharray="3,3"
              strokeWidth="1.6"
            />
          )}
        </svg>

        {/* TARJETA VISUAL ESTILO POWER BI (MS MES + MS YTD) O TOOLTIP ESTÁNDAR */}
        {hoverIndex !== null && periods[hoverIndex] && (
          isMarketShare && msTooltipData && msTooltipData.brands.length > 0 ? (
            <div
              className="absolute z-50 pointer-events-none transition-all duration-100 ease-out"
              style={{
                top: '32px',
                left: hoverIndex >= (periods.length / 2)
                  ? `${Math.max(4, (getX(hoverIndex) / width) * 100 - 45)}%`
                  : `${Math.min(56, (getX(hoverIndex) / width) * 100 + 4)}%`,
                width: '215px'
              }}
            >
              <div className="bg-[#262626] text-white rounded-md p-3 shadow-2xl border border-slate-700 font-sans backdrop-blur-xs select-none">
                <div className="text-[12.5px] font-extrabold text-slate-100 border-b border-slate-700 pb-1 mb-2 flex items-center justify-between">
                  <span>{msTooltipData.label}</span>
                  <span className="text-[10px] text-sky-400 font-normal uppercase">{channel}</span>
                </div>
                <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto pr-0.5 scrollbar-thin scrollbar-thumb-slate-600">
                  {msTooltipData.brands.map((b) => (
                    <div key={`tt-${b.brandId}`} className="flex items-start gap-2 text-xs">
                      <span
                        className="w-2.5 h-2.5 rounded-full mt-1 shrink-0 ring-1 ring-white/20"
                        style={{ backgroundColor: b.color }}
                      />
                      <div className="flex flex-col flex-1 leading-tight">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">MARCA</span>
                          <span className="text-[11px] font-bold text-slate-200 uppercase truncate">{b.brandName}</span>
                        </div>
                        <div className="flex items-center justify-between mt-0.5 text-slate-300">
                          <span className="text-[10.5px] text-slate-400">Share Mes</span>
                          <span className="text-[11px] font-black text-white">{b.shareMes.toFixed(1)} %</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="text-[10.5px] text-slate-400">Share YTD</span>
                          <span className="text-[11px] font-black text-white">{b.shareYtd.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="absolute top-6 left-2 right-2 bg-slate-900/95 text-white text-[11px] rounded-lg p-2.5 shadow-2xl backdrop-blur-xs z-30 pointer-events-none border border-slate-700 max-w-[300px] mx-auto">
              <div className="flex justify-between items-center border-b border-slate-700 pb-1 mb-1.5 font-bold text-sky-400">
                <span>{channel} • {periods[hoverIndex].label}</span>
                <span className="text-[10px] text-slate-300 uppercase">{metricKey}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
                {series
                  .filter(s => s.isVisible && s.points[hoverIndex]?.val !== null)
                  .sort((a, b) => (b.points[hoverIndex]?.val || 0) - (a.points[hoverIndex]?.val || 0))
                  .slice(0, 8)
                  .map(s => (
                    <div key={s.id} className="flex items-center justify-between gap-1">
                      <span className="flex items-center gap-1.5 truncate text-slate-300">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                        <span className="truncate">{s.name}</span>
                      </span>
                      <span className="font-bold text-white shrink-0">
                        {formatVal(s.points[hoverIndex]?.val)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

// ==========================================
// COMPONENTE: BLOQUE KPI (CONTIENE 3 CANALES)
// ==========================================
function KpiSectionCard({ 
  title, 
  metricKey, 
  data, 
  periods, 
  activeBrands, 
  selectedBrand,
  formatType = 'number'
}) {
  return (
    <div className="bg-white rounded-2xl border border-sky-200 shadow-xs p-4 md:p-5 flex flex-col gap-4 w-full">
      {/* TÍTULO KPI PRINCIPAL */}
      <div className="border-b border-sky-100 pb-2 text-center">
        <h2 className="font-black text-[#0066c0] text-base md:text-lg tracking-wide uppercase">
          {title}
        </h2>
      </div>

      {/* 3 SUB-COLUMNAS POR CANAL CON MÁXIMO ANCHO Y ALTURA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full">
        {CHANNELS.map(ch => (
          <MultiLineChart
            key={ch}
            channel={ch}
            metricKey={metricKey}
            data={data}
            periods={periods}
            activeBrands={activeBrands}
            selectedBrand={selectedBrand}
            formatType={formatType}
          />
        ))}
      </div>
    </div>
  );
}

// ==========================================
// VISTA PRINCIPAL: MARCA X CANAL
// ==========================================
export default function MarcaCanalView({ onBack }) {
  const [anio, setAnio] = useState('2026');
  const [mes, setMes] = useState('Todas');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados de interacción
  const [activeBrands, setActiveBrands] = useState(BRANDS_CONFIG.map(b => b.id));
  const [selectedBrand, setSelectedBrand] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const url = `/api/nielsen/cr/marca-canal?anio=${anio}&mes=${mes}`;

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return res.json();
      })
      .then(json => {
        if (isMounted) {
          setData(json);
          setLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          console.error('Error fetching marca x canal:', err);
          setError(err.message);
          setLoading(false);
        }
      });

    return () => { isMounted = false; };
  }, [anio, mes]);

  const handleAnioChange = (newAnio) => {
    setAnio(newAnio);
    setMes('Todas');
  };

  const mesesDisponibles = useMemo(() => {
    if (!data?.mesesPorAnio) return [{ id: 'Todas', label: 'Todas' }];
    return data.mesesPorAnio[anio] || [{ id: 'Todas', label: 'Todas' }];
  }, [data, anio]);

  const handleBrandClick = (brandId) => {
    setSelectedBrand(prev => prev === brandId ? null : brandId);
  };

  return (
    <div className="min-h-screen bg-[#f4f7fa] flex flex-col font-sans pb-16">
      {/* HEADER HOMOLOGADO */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40 shadow-xs">
        {/* LOGOS ELECTROLIT | NIELSEN */}
        <div className="flex items-center gap-3">
          <img 
            src="/assets/LOGOS/Electrolit-color.png" 
            alt="Electrolit Logo" 
            className="h-8 md:h-9 object-contain"
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
            Marca X Canal
          </h1>
        </div>

        {/* SELECTORES Y BOTON HOME */}
        <div className="flex items-center gap-3">
          {/* SELECTOR AÑO */}
          <div className="flex flex-col items-start">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Año</span>
            <select
              value={anio}
              onChange={(e) => handleAnioChange(e.target.value)}
              className="bg-white border border-slate-300 rounded text-xs font-bold px-2.5 py-1 text-slate-700 shadow-xs hover:border-slate-400 focus:outline-hidden focus:ring-1 focus:ring-sky-500 cursor-pointer"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>

          {/* SELECTOR MES */}
          <div className="flex flex-col items-start">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Mes</span>
            <select
              value={mes}
              onChange={(e) => setMes(e.target.value)}
              className="bg-white border border-slate-300 rounded text-xs font-bold px-2.5 py-1 text-slate-700 shadow-xs hover:border-slate-400 focus:outline-hidden focus:ring-1 focus:ring-sky-500 cursor-pointer min-w-[90px]"
            >
              {mesesDisponibles.map(m => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* BOTON HOME */}
          <div className="flex flex-col items-start justify-end pt-2.5">
            <button
              onClick={onBack}
              title="Regresar a Portada"
              className="p-1.5 rounded-lg hover:bg-slate-100 text-[#0066c0] hover:text-[#00509e] transition-colors"
            >
              <Home className="w-5 h-5 stroke-[2.4]" />
            </button>
          </div>
        </div>
      </header>

      {/* BARRA SUPERIOR DE LEYENDA Y FILTRO DE MARCAS */}
      <div className="bg-white border-b border-slate-200 px-4 py-2 sticky top-[57px] z-30 shadow-2xs">
        <div className="max-w-[1920px] mx-auto flex flex-wrap items-center justify-center gap-2.5 text-xs">
          {BRANDS_CONFIG.map(b => {
            const isSelected = selectedBrand === b.id;

            return (
              <button
                key={b.id}
                onClick={() => handleBrandClick(b.id)}
                title={`Click para enfocar ${b.name}`}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all duration-150 cursor-pointer border ${
                  isSelected
                    ? 'bg-slate-900 border-slate-900 text-white shadow-md scale-105 ring-2 ring-sky-400'
                    : selectedBrand
                      ? 'bg-slate-100/60 border-transparent text-slate-400 opacity-60 hover:opacity-100'
                      : 'bg-white border-slate-300 text-slate-800 shadow-2xs hover:bg-slate-50'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                  style={{ backgroundColor: b.color }}
                />
                <span>{b.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* CONTENEDOR PRINCIPAL: ANCHO TOTAL */}
      <main className="max-w-[1920px] w-full mx-auto px-4 md:px-8 py-6 flex flex-col gap-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[500px] gap-3">
            <RefreshCw className="w-8 h-8 text-sky-600 animate-spin" />
            <p className="text-slate-600 text-sm font-semibold">Cargando tablero Marca X Canal...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700">
            <p className="font-bold">Error al cargar datos</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-8 w-full">
            {/* KPI 1: UNIDADES (000) */}
            <KpiSectionCard
              title="Unidades (000)"
              metricKey="unidades"
              data={data?.data}
              periods={data?.periods}
              activeBrands={activeBrands}
              selectedBrand={selectedBrand}
              formatType="k"
            />

            {/* KPI 2: SOM UNIDADES */}
            <KpiSectionCard
              title="SOM Unidades"
              metricKey="som"
              data={data?.data}
              periods={data?.periods}
              activeBrands={activeBrands}
              selectedBrand={selectedBrand}
              formatType="percent"
            />

            {/* KPI 3: DIST. NUMÉRICA */}
            <KpiSectionCard
              title="Dist. Numérica"
              metricKey="dist"
              data={data?.data}
              periods={data?.periods}
              activeBrands={activeBrands}
              selectedBrand={selectedBrand}
              formatType="number"
            />

            {/* KPI 4: PRECIO */}
            <KpiSectionCard
              title="Precio"
              metricKey="precio"
              data={data?.data}
              periods={data?.periods}
              activeBrands={activeBrands}
              selectedBrand={selectedBrand}
              formatType="currency"
            />

            {/* KPI 5: ROTACIÓN */}
            <KpiSectionCard
              title="Rotación"
              metricKey="rotacion"
              data={data?.data}
              periods={data?.periods}
              activeBrands={activeBrands}
              selectedBrand={selectedBrand}
              formatType="decimal"
            />
          </div>
        )}
      </main>
    </div>
  );
}
