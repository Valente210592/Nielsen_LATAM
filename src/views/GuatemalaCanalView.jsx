import React, { useState, useEffect, useMemo } from 'react';
import RibbonChart from '../components/RibbonChart';

export const GT_BRAND_COLORS = {
  'Hidravida': '#0066c0',
  'HIDRAVIDA': '#0066c0',
  'Hidralife': '#38bdf8',
  'HIDRALIFE': '#38bdf8',
  'Electrolit': '#0066c0',
  'ELECTROLIT': '#0066c0',
  'Electrolife': '#38bdf8',
  'ELECTROLIFE': '#38bdf8',
  'Gatorade': '#ea580c',
  'GATORADE': '#ea580c',
  'Gatorlyte': '#f97316',
  'GATORLYTE': '#f97316',
  'Powerade': '#6b21a8',
  'POWERADE': '#6b21a8',
  'Pedialyte': '#dc2626',
  'PEDIALYTE': '#dc2626',
  'Isomax': '#db2777',
  'ISOMAX': '#db2777',
  'Suerox': '#991b1b',
  'SUEROX': '#991b1b',
  'Sporade': '#ca8a04',
  'SPORADE': '#ca8a04',
  'Revive': '#c084fc',
  'REVIVE': '#c084fc',
  'Glucosoral': '#10b981',
  'GLUCOSORAL': '#10b981',
  'Resto Marcas': '#94a3b8',
  'RESTO MARCAS': '#94a3b8'
};

const GT_ALL_BRANDS_ORDER = [
  'Hidravida',
  'Hidralife',
  'Gatorade',
  'Gatorlyte',
  'Powerade',
  'Pedialyte',
  'Isomax',
  'Suerox',
  'Sporade',
  'Revive',
  'Glucosoral',
  'Resto Marcas'
];

// Componente para Gráfica de Líneas Multi-Marca (Ventas, SOM, Dist, Precio, Rotación)
function MultiBrandTrendCard({ 
  title, 
  data = [], 
  metricKey, 
  valuePrefix = '', 
  valueSuffix = '', 
  isPercent = false, 
  isCurrency = false,
  selectedBrand
}) {
  const width = 340;
  const height = 350;
  const paddingLeft = 18;
  const paddingRight = 18;
  const paddingTop = 22;
  const paddingBottom = 44;

  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;
  const numMonths = data.length || 1;

  // Encontrar valor máximo y mínimo global para escalar Y
  let maxVal = 0;
  let minVal = Infinity;

  data.forEach(m => {
    Object.entries(m.brands || {}).forEach(([brand, valObj]) => {
      const v = Number(valObj[metricKey] || 0);
      if (v > maxVal) maxVal = v;
      if (v < minVal && v > 0) minVal = v;
    });
  });

  if (maxVal === 0) maxVal = 10;
  if (minVal === Infinity) minVal = 0;

  // Escala Y adaptada específicamente a cada indicador
  let yDomainMin = 0;
  let yDomainMax = 100;

  if (metricKey === 'som_unds_pct') {
    yDomainMin = 0;
    yDomainMax = Math.min(100, Math.ceil((maxVal * 1.15) / 5) * 5 || 40);
  } else if (metricKey === 'unds_k') {
    yDomainMin = 0;
    yDomainMax = Math.ceil((maxVal * 1.10) / 50) * 50 || 1000;
  } else if (metricKey === 'dist_num') {
    yDomainMin = 0;
    yDomainMax = 105;
  } else if (metricKey === 'precio_unit') {
    const nonZeroMin = minVal > 0 ? minVal : 0.5;
    yDomainMin = Math.max(0, Math.floor((nonZeroMin * 0.8) * 2) / 2);
    yDomainMax = Math.ceil((maxVal * 1.12) * 2) / 2 || 4;
  } else if (metricKey === 'rotacion') {
    yDomainMin = 0;
    yDomainMax = Math.ceil((maxVal * 1.15) * 2) / 2 || 16;
  } else {
    yDomainMin = Math.max(0, isPercent ? 0 : minVal * 0.85);
    yDomainMax = maxVal * 1.15 || 100;
  }

  const valRange = yDomainMax - yDomainMin || 1;

  // Puntos por cada marca
  const brandLines = GT_ALL_BRANDS_ORDER.map(brand => {
    const points = data.map((d, i) => {
      const x = paddingLeft + (i * (chartW / (numMonths > 1 ? numMonths - 1 : 1)));
      const brandData = d.brands?.[brand];
      const rawVal = brandData ? Number(brandData[metricKey] || 0) : 0;
      const yNorm = Math.max(0, Math.min(1, (rawVal - yDomainMin) / valRange));
      const y = paddingTop + chartH - (yNorm * chartH);
      return {
        x,
        y,
        rawVal,
        mes_label: d.mes_label
      };
    });

    return {
      brand,
      color: GT_BRAND_COLORS[brand] || '#94a3b8',
      points
    };
  });

  const lastMonthBrands = [...brandLines].sort((a, b) => {
    const valA = a.points[a.points.length - 1]?.rawVal || 0;
    const valB = b.points[b.points.length - 1]?.rawVal || 0;
    return valB - valA;
  });

  const topBrandNames = new Set(lastMonthBrands.slice(0, 5).map(b => b.brand));

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-3.5 flex flex-col justify-between hover:shadow-sm transition-shadow h-[420px]">
      <h3 className="text-center font-black text-[#0066c0] text-sm md:text-[15px] tracking-tight pb-1 border-b border-slate-100">
        {title}
      </h3>

      <div className="flex-1 w-full flex items-center justify-center relative py-1">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible select-none">
          {/* Líneas de cuadrícula sutiles */}
          <line x1={paddingLeft} y1={paddingTop} x2={width - paddingRight} y2={paddingTop} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
          <line x1={paddingLeft} y1={paddingTop + chartH * 0.5} x2={width - paddingRight} y2={paddingTop + chartH * 0.5} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
          <line x1={paddingLeft} y1={paddingTop + chartH} x2={width - paddingRight} y2={paddingTop + chartH} stroke="#e2e8f0" strokeWidth="1" />

          {/* Líneas de cada marca */}
          {brandLines.map(({ brand, color, points }) => {
            if (!points.length) return null;

            let pathD = '';
            let inSegment = false;
            points.forEach(p => {
              const isValid = p.rawVal !== null && p.rawVal !== undefined && p.rawVal > 0;
              if (isValid) {
                if (!inSegment) {
                  pathD += ` M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
                  inSegment = true;
                } else {
                  pathD += ` L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
                }
              } else {
                inSegment = false;
              }
            });

            if (!pathD) return null;

            const isSelected = selectedBrand === brand;
            const isDimmed = selectedBrand && !isSelected;

            return (
              <g key={brand}>
                <path
                  d={pathD}
                  fill="none"
                  stroke={color}
                  strokeWidth={isSelected ? 4 : isDimmed ? 1.2 : 2.2}
                  strokeOpacity={isDimmed ? 0.15 : 1}
                  className="transition-all duration-200 pointer-events-none"
                />
                
                {/* Puntos de datos */}
                {points.map((p, pIdx) => {
                  if (p.rawVal <= 0) return null;
                  return (
                    <circle
                      key={pIdx}
                      cx={p.x}
                      cy={p.y}
                      r={isSelected ? 5.5 : isDimmed ? 2 : 3}
                      fill={isSelected ? '#ffffff' : color}
                      stroke={color}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                      strokeOpacity={isDimmed ? 0.2 : 1}
                      className="transition-all duration-200 pointer-events-none"
                    >
                      <title>{`${brand} (${p.mes_label}): ${valuePrefix}${p.rawVal.toLocaleString()}${valueSuffix}`}</title>
                    </circle>
                  );
                })}
              </g>
            );
          })}

          {/* Etiquetas de datos inteligentes: Intermitentes/Alternadas */}
          {(() => {
            const labelsToRender = [];

            for (let pIdx = 0; pIdx < numMonths; pIdx++) {
              const candidatesInMonth = [];
              brandLines.forEach(({ brand, color, points }) => {
                const isTarget = selectedBrand ? selectedBrand === brand : topBrandNames.has(brand);
                const p = points[pIdx];
                if (isTarget && p && p.rawVal > 0) {
                  candidatesInMonth.push({
                    brand,
                    color,
                    point: p,
                    y: p.y,
                    x: p.x,
                    rawVal: p.rawVal
                  });
                }
              });

              if (!candidatesInMonth.length) continue;

              candidatesInMonth.sort((a, b) => a.y - b.y);

              const clusters = [];
              let currentCluster = [candidatesInMonth[0]];

              for (let cIdx = 1; cIdx < candidatesInMonth.length; cIdx++) {
                const prev = currentCluster[currentCluster.length - 1];
                const curr = candidatesInMonth[cIdx];
                if (Math.abs(curr.y - prev.y) < 18) {
                  currentCluster.push(curr);
                } else {
                  clusters.push(currentCluster);
                  currentCluster = [curr];
                }
              }
              if (currentCluster.length) clusters.push(currentCluster);

              clusters.forEach(cluster => {
                const isFirstOrLast = pIdx === 0 || pIdx === numMonths - 1;

                if (cluster.length === 1) {
                  const item = cluster[0];
                  const shouldShow = selectedBrand ? (selectedBrand === item.brand) : (isFirstOrLast || pIdx % 2 === 0);
                  if (shouldShow) {
                    labelsToRender.push({ ...item, pIdx });
                  }
                } else {
                  cluster.forEach((item, itemRank) => {
                    let shouldShow = false;
                    if (selectedBrand) {
                      shouldShow = selectedBrand === item.brand;
                    } else {
                      shouldShow = (pIdx + itemRank) % cluster.length === 0;
                    }

                    if (shouldShow) {
                      labelsToRender.push({ ...item, pIdx });
                    }
                  });
                }
              });
            }

            return labelsToRender.map((lbl, idx) => {
              let formattedVal = '';
              if (isCurrency) {
                formattedVal = lbl.rawVal.toFixed(2);
              } else if (isPercent) {
                formattedVal = `${Math.round(lbl.rawVal)}%`;
              } else {
                formattedVal = lbl.rawVal >= 100 ? Math.round(lbl.rawVal).toLocaleString() : lbl.rawVal.toFixed(1);
              }

              const badgeY = lbl.y - 8;

              return (
                <text
                  key={`lbl-${lbl.brand}-${lbl.pIdx}-${idx}`}
                  x={lbl.x}
                  y={badgeY}
                  textAnchor="middle"
                  fontSize={9.5}
                  fontWeight="600"
                  fill={lbl.color}
                  stroke="#ffffff"
                  strokeWidth={2.5}
                  paintOrder="stroke fill"
                  className="pointer-events-none select-none"
                >
                  {formattedVal}
                </text>
              );
            });
          })()}

          {/* Eje X: Meses en Vertical */}
          {data.map((d, i) => {
            const x = paddingLeft + (i * (chartW / (numMonths > 1 ? numMonths - 1 : 1)));
            const y = paddingTop + chartH + 10;
            return (
              <text
                key={i}
                x={x}
                y={y}
                textAnchor="end"
                transform={`rotate(-90, ${x}, ${y})`}
                fontSize={10}
                fill="#475569"
                fontWeight="700"
              >
                {d.mes_label ? d.mes_label.toLowerCase() : ''}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// Componente para MIX Unidades (000): 2 Barras Apiladas (TOTAL YTD vs CANAL YTD)
function MixStackedBarCard({ mixData = [], canalName = 'AUTOSERVICIOS' }) {
  const width = 240;
  const height = 300;
  const paddingTop = 12;
  const paddingBottom = 32;
  const barWidth = 60;
  const chartH = height - paddingTop - paddingBottom;

  const totalBarSegments = [];
  const canalBarSegments = [];

  let cumTotal = 0;
  let cumCanal = 0;

  mixData.forEach(item => {
    const brand = item.marca_norm;
    const color = GT_BRAND_COLORS[brand] || '#94a3b8';
    const totalVal = Number(item.total_unds_k || 0);
    const totalPct = Number(item.total_pct || 0);
    const canalVal = Number(item.canal_unds_k || 0);
    const canalPct = Number(item.canal_pct || 0);

    if (totalVal > 0) {
      totalBarSegments.push({
        brand,
        color,
        val: totalVal,
        pct: totalPct
      });
      cumTotal += totalVal;
    }

    if (canalVal > 0) {
      canalBarSegments.push({
        brand,
        color,
        val: canalVal,
        pct: canalPct
      });
      cumCanal += canalVal;
    }
  });

  // Ordenar cada barra de mayor a menor (de abajo hacia arriba)
  totalBarSegments.sort((a, b) => b.val - a.val);
  canalBarSegments.sort((a, b) => b.val - a.val);

  const renderColumnSegments = (segments, cx, label) => {
    let currentBottom = paddingTop + chartH;
    return (
      <g>
        {segments.map((seg, idx) => {
          const segHeight = (seg.pct / 100) * chartH;
          const y = currentBottom - segHeight;
          currentBottom = y;

          return (
            <g key={idx}>
              <rect
                x={cx - barWidth / 2}
                y={y}
                width={barWidth}
                height={Math.max(1, segHeight)}
                fill={seg.color}
                stroke="#ffffff"
                strokeWidth={0.8}
              >
                <title>{`${seg.brand}: ${seg.val.toLocaleString()}k (${seg.pct}%)`}</title>
              </rect>

              {segHeight > 20 && (
                <g className="pointer-events-none select-none">
                  <text
                    x={cx}
                    y={y + segHeight / 2 - 3}
                    textAnchor="middle"
                    fontSize={10}
                    fontWeight="700"
                    fill="#ffffff"
                  >
                    {seg.val.toLocaleString()}
                  </text>
                  <text
                    x={cx}
                    y={y + segHeight / 2 + 8}
                    textAnchor="middle"
                    fontSize={8.5}
                    fontWeight="700"
                    fill="#ffffff"
                    opacity={0.95}
                  >
                    {seg.pct.toFixed(1)}%
                  </text>
                </g>
              )}
            </g>
          );
        })}

        <text
          x={cx}
          y={paddingTop + chartH + 18}
          textAnchor="middle"
          fontSize={10.5}
          fontWeight="800"
          fill="#1e293b"
        >
          {label}
        </text>
      </g>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-3.5 flex flex-col justify-between hover:shadow-sm transition-shadow h-[420px]">
      <h3 className="text-center font-black text-[#0066c0] text-sm md:text-[15px] tracking-tight pb-1 border-b border-slate-100">
        MIX Unidades (000)
      </h3>

      <div className="flex-1 w-full flex items-center justify-center relative py-1 overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full max-h-[320px] select-none" preserveAspectRatio="xMidYMid meet">
          {renderColumnSegments(totalBarSegments, 65, 'TOTAL YTD')}
          {renderColumnSegments(canalBarSegments, 175, `${canalName.toUpperCase()} YTD`)}
        </svg>
      </div>
    </div>
  );
}

export default function GuatemalaCanalView({ onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [canal, setCanal] = useState('Moderno');
  const [marca, setMarca] = useState('HIDRAVIDA');
  const [anio, setAnio] = useState('2026');
  const [mes, setMes] = useState('Todas');
  const [selectedBrand, setSelectedBrand] = useState(null);

  const handleBrandClick = (brandName) => {
    if (selectedBrand === brandName) {
      setSelectedBrand(null);
    } else {
      setSelectedBrand(brandName);
      const matched = availableBrands.find(b => b.toUpperCase() === brandName.toUpperCase()) || brandName;
      setMarca(matched);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetch(`/api/nielsen/gt/canal-dashboard?canal=${encodeURIComponent(canal)}&marca=${encodeURIComponent(marca)}&anio=${anio}&mes=${mes}`)
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error al cargar datos de Canal Guatemala:', err);
        setLoading(false);
      });
  }, [canal, marca, anio, mes]);

  const monthOptions = useMemo(() => {
    if (data?.availableMonthsByYear?.[anio]) {
      return data.availableMonthsByYear[anio];
    }
    if (anio === '2026') {
      return [
        { id: 'Todas', label: 'Todas' },
        { id: '1', label: 'Enero' },
        { id: '2', label: 'Febrero' },
        { id: '3', label: 'Marzo' },
        { id: '4', label: 'Abril' },
        { id: '5', label: 'Mayo' },
        { id: '6', label: 'Junio' },
        { id: '7', label: 'Julio' },
        { id: '8', label: 'Agosto' }
      ];
    }
    return [
      { id: 'Todas', label: 'Todas' },
      { id: '1', label: 'Enero' },
      { id: '2', label: 'Febrero' },
      { id: '3', label: 'Marzo' },
      { id: '4', label: 'Abril' },
      { id: '5', label: 'Mayo' },
      { id: '6', label: 'Junio' },
      { id: '7', label: 'Julio' },
      { id: '8', label: 'Agosto' },
      { id: '9', label: 'Septiembre' },
      { id: '10', label: 'Octubre' },
      { id: '11', label: 'Noviembre' },
      { id: '12', label: 'Diciembre' }
    ];
  }, [data, anio]);

  const availableBrands = data?.availableBrands || [
    'HIDRAVIDA', 'ISOMAX', 'GATORADE', 'SPORADE', 'REVIVE', 'POWERADE',
    'SUEROX', 'GLUCOSORAL', 'PEDIALYTE', 'GATORLYTE', 'HIDRALIFE', 'RESTO MARCAS'
  ];

  return (
    <div className="w-full min-h-screen bg-[#f8fafc] p-4 md:p-6 space-y-4">
      
      {/* 1. CABECERA SUPERIOR */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-3.5 md:p-4.5 flex flex-wrap items-center justify-between gap-4">
        
        {/* Logos & Título */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <img 
              src="/assets/LOGOS/Hidravida-color.png" 
              alt="Hidravida Logo" 
              className="h-9 md:h-10 object-contain"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/assets/LOGOS/Electrolit-color.png";
              }}
            />

            <div className="h-6 w-px bg-slate-200 mx-1"></div>

            <img 
              src="/assets/LOGOS/Nielsen-logo.png" 
              alt="Nielsen" 
              className="h-7 md:h-8 object-contain"
            />
          </div>

          <h1 className="text-2xl md:text-3xl font-black text-[#0066c0] tracking-tight">
            Canal
          </h1>
        </div>

        {/* Filtros Superiores */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Segmentador Canal */}
          <div className="flex flex-col">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Canal</label>
            <select
              value={canal}
              onChange={(e) => setCanal(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer"
            >
              <option value="Moderno">Moderno</option>
              <option value="Tradicional">Tradicional</option>
            </select>
          </div>

          {/* Segmentador Marca */}
          <div className="flex flex-col">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Marca</label>
            <select
              value={marca}
              onChange={(e) => {
                setMarca(e.target.value);
                setSelectedBrand(e.target.value);
              }}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer"
            >
              {availableBrands.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Segmentador Año */}
          <div className="flex flex-col">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Año</label>
            <select
              value={anio}
              onChange={(e) => {
                setAnio(e.target.value);
                setMes('Todas');
              }}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>

          {/* Segmentador Mes Dinámico */}
          <div className="flex flex-col">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Mes</label>
            <select
              value={mes}
              onChange={(e) => setMes(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer"
            >
              {monthOptions.map(m => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Botón Home */}
          <button
            onClick={onBack}
            className="p-2 ml-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0066c0] transition-colors shadow-2xs cursor-pointer flex items-center justify-center self-end border border-blue-200"
            title="Regresar a Portada"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-current fill-none stroke-2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </button>
        </div>
      </div>

      {/* 2. BARRA DE BOTONES DE MARCAS */}
      <div className="bg-white rounded-xl shadow-2xs border border-slate-200/80 px-4 py-2.5 flex flex-wrap items-center justify-center gap-2">
        {GT_ALL_BRANDS_ORDER.map(brand => {
          const isSelected = selectedBrand?.toUpperCase() === brand.toUpperCase();
          return (
            <button
              key={brand}
              onClick={() => handleBrandClick(brand)}
              title={`Click para seleccionar y destacar ${brand}`}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all duration-150 cursor-pointer border ${
                isSelected
                  ? 'bg-slate-900 border-slate-900 text-white shadow-md scale-105 ring-2 ring-sky-400'
                  : 'bg-white border-slate-200 text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                style={{ backgroundColor: GT_BRAND_COLORS[brand] || '#94a3b8' }}
              />
              <span className="uppercase tracking-tight text-[11px]">{brand}</span>
            </button>
          );
        })}
      </div>

      {/* 3. FILA SUPERIOR: 6 CARDS DE INDICADORES */}
      {loading ? (
        <div className="flex items-center justify-center h-72 bg-white rounded-2xl border border-slate-200 text-slate-400 font-semibold">
          Cargando métricas de Canal...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3.5">
          {/* Card 1: MIX Unidades (000) */}
          <MixStackedBarCard 
            mixData={data?.mixBrands || []} 
            canalName={canal === 'Moderno' ? 'MODERNO' : 'TRADICIONAL'} 
          />

          {/* Card 2: Venta Marca en Canal */}
          <MultiBrandTrendCard
            title="Venta Marca en Canal"
            data={data?.monthlyTrends || []}
            metricKey="unds_k"
            selectedBrand={selectedBrand}
          />

          {/* Card 3: SOM Unidades */}
          <MultiBrandTrendCard
            title="SOM Unidades"
            data={data?.monthlyTrends || []}
            metricKey="som_unds_pct"
            isPercent={true}
            selectedBrand={selectedBrand}
          />

          {/* Card 4: Dist. Numérica */}
          <MultiBrandTrendCard
            title="Dist. Numérica"
            data={data?.monthlyTrends || []}
            metricKey="dist_num"
            isPercent={true}
            selectedBrand={selectedBrand}
          />

          {/* Card 5: Precio */}
          <MultiBrandTrendCard
            title="Precio"
            data={data?.monthlyTrends || []}
            metricKey="precio_unit"
            isCurrency={true}
            valuePrefix="$"
            selectedBrand={selectedBrand}
          />

          {/* Card 6: Rotación */}
          <MultiBrandTrendCard
            title="Rotación"
            data={data?.monthlyTrends || []}
            metricKey="rotacion"
            selectedBrand={selectedBrand}
          />
        </div>
      )}

      {/* 4. DIVISOR CENTRAL Y SUBTÍTULO SABORES */}
      <div className="relative flex items-center justify-center py-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200"></div>
        </div>
        <div className="relative bg-[#f8fafc] px-6">
          <span className="text-xl md:text-2xl font-black text-[#0066c0] tracking-tight">
            Sabores
          </span>
        </div>
      </div>

      {/* 5. FILA INFERIOR: 2 RIBBON CHARTS DE SABORES */}
      {loading ? (
        <div className="flex items-center justify-center h-72 bg-white rounded-2xl border border-slate-200 text-slate-400 font-semibold">
          Cargando gráficas de sabores...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* Gráfica Izquierda: Unidades (000) Total Canales */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 md:p-5 flex flex-col justify-between hover:shadow-xs transition-shadow">
            <div className="text-center mb-2">
              <h3 className="font-bold text-[#0066c0] text-base md:text-lg tracking-tight">
                Unidades (000)
              </h3>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Canales ({marca})
              </p>
            </div>
            <RibbonChart
              data={data?.saboresTotalCanales || []}
              title="Total Canales"
              height={320}
            />
          </div>

          {/* Gráfica Derecha: Unidades (000) Canal Seleccionado */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 md:p-5 flex flex-col justify-between hover:shadow-xs transition-shadow">
            <div className="text-center mb-2">
              <h3 className="font-bold text-[#0066c0] text-base md:text-lg tracking-tight">
                Unidades (000)
              </h3>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {canal === 'Moderno' ? 'MODERNO' : 'TRADICIONAL'} ({marca})
              </p>
            </div>
            <RibbonChart
              data={data?.saboresCanal || []}
              title={canal === 'Moderno' ? 'MODERNO' : 'TRADICIONAL'}
              height={320}
            />
          </div>

        </div>
      )}

      {/* PIE DE PÁGINA */}
      <div className="flex items-center justify-between text-xs text-slate-400 font-medium pt-2">
        <span>Laboratorios PiSA • Hidravida Centroamérica</span>
        <span>Fuente: BigQuery • psa-eltr-latam-pr.Nielsen</span>
      </div>

    </div>
  );
}
