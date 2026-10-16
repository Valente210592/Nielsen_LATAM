import React, { useState, useEffect, useMemo } from 'react';
import RibbonChart from '../components/RibbonChart';

// Paleta oficial de marcas para Perú
const PE_BRAND_COLORS = {
  'Electrolife': '#0066c0',
  'ELECTROLIFE': '#0066c0',
  'Electrolit': '#0066c0',
  'ELECTROLIT': '#0066c0',
  'Gatorade': '#ea580c',
  'GATORADE': '#ea580c',
  'Powerade': '#6b21a8',
  'POWERADE': '#6b21a8',
  'Suerox': '#991b1b',
  'SUEROX': '#991b1b',
  'Sporade': '#22c55e',
  'SPORADE': '#22c55e',
  'Dilyte': '#eab308',
  'DILYTE': '#eab308',
  'Electrolight': '#0284c7',
  'ELECTROLIGHT': '#0284c7',
  'Flashlyte': '#c084fc',
  'FLASHLYTE': '#c084fc',
  'Gatorlit': '#f97316',
  'GATORLIT': '#f97316',
  'Otras Marcas': '#94a3b8',
  'OTRAS MARCAS': '#94a3b8',
  'Generade': '#14b8a6',
  'GENERADE': '#14b8a6',
  'Pedialyte': '#dc2626',
  'PEDIALYTE': '#dc2626',
  'Powerade Zero': '#a855f7',
  'POWERADE ZERO': '#a855f7',
  'Powerade On': '#7c3aed',
  'POWERADE ON': '#7c3aed',
  'G Active': '#fb923c',
  'G ACTIVE': '#fb923c'
};

const PE_ALL_BRANDS_ORDER = [
  'Electrolife',
  'Gatorade',
  'Powerade',
  'Suerox',
  'Sporade',
  'Dilyte'
];

const PE_CANALES_LIST = [
  { id: 'TOTAL', label: 'TOTAL (Todos los Canales)' },
  { id: 'Supermercados + Discounters', label: 'Supermercados + Discounters' },
  { id: 'Conveniencia', label: 'Conveniencia' },
  { id: 'Cash & Carry', label: 'Cash & Carry' }
];

const PE_BRAND_FLAVORS = {
  'ELECTROLIFE': [
    { name: 'FRESA-KIWI', pct: 0.35 },
    { name: 'UVA', pct: 0.27 },
    { name: 'FRESA', pct: 0.20 },
    { name: 'MARACUYÁ', pct: 0.11 },
    { name: 'MANZANA VERDE', pct: 0.04 },
    { name: 'NARANJA', pct: 0.03 }
  ],
  'SPORADE': [
    { name: 'MANDARINA', pct: 0.38 },
    { name: 'BLUE RASPBERRY', pct: 0.28 },
    { name: 'MANZANA', pct: 0.18 },
    { name: 'TROPICAL', pct: 0.10 },
    { name: 'UVA', pct: 0.06 }
  ],
  'GATORADE': [
    { name: 'COOL BLUE', pct: 0.42 },
    { name: 'NARANJA', pct: 0.28 },
    { name: 'FRUIT PUNCH', pct: 0.18 },
    { name: 'LIMÓN', pct: 0.12 }
  ],
  'POWERADE': [
    { name: 'MOUNTAIN BERRY', pct: 0.45 },
    { name: 'FRUIT PUNCH', pct: 0.30 },
    { name: 'ORANGE', pct: 0.15 },
    { name: 'LIME', pct: 0.10 }
  ],
  'SUEROX': [
    { name: 'FRESA-KIWI', pct: 0.36 },
    { name: 'ARÁNDANO', pct: 0.28 },
    { name: 'MANZANA', pct: 0.20 },
    { name: 'COCO', pct: 0.16 }
  ],
  'DILYTE': [
    { name: 'NARANJA', pct: 0.40 },
    { name: 'FRESA', pct: 0.32 },
    { name: 'UVA', pct: 0.18 },
    { name: 'MANZANA', pct: 0.10 }
  ]
};

// =========================================================================
// COMPONENTE: GRÁFICA DE LÍNEAS MULTI-MARCA (UNDS, SOM, DIST, PRECIO, ROTACIÓN)
// =========================================================================
function PeruMultiBrandTrendCard({
  title,
  data = [],
  metricKey,
  valuePrefix = '',
  valueSuffix = '',
  isPercent = false,
  isCurrency = false,
  selectedBrand,
  onBrandClick
}) {
  const width = 340;
  const height = 350;
  const paddingLeft = 18;
  const paddingRight = 18;
  const paddingTop = 22;
  const paddingBottom = 48;

  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;
  const numMonths = data.length || 1;

  // Encontrar valores máximos y mínimos para escalar Y
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

  // Escala Y adaptada específicamente
  let yDomainMin = 0;
  let yDomainMax = 100;

  if (metricKey === 'som_unds_pct') {
    yDomainMin = 0;
    yDomainMax = Math.min(100, Math.ceil((maxVal * 1.15) / 5) * 5 || 65);
  } else if (metricKey === 'unds_k') {
    yDomainMin = 0;
    yDomainMax = Math.ceil((maxVal * 1.12) / 500) * 500 || 6000;
  } else if (metricKey === 'dist_num') {
    yDomainMin = 0;
    yDomainMax = 105;
  } else if (metricKey === 'precio_unit') {
    const nonZeroMin = minVal > 0 ? minVal : 1.5;
    yDomainMin = Math.max(0, Math.floor((nonZeroMin * 0.8) * 2) / 2);
    yDomainMax = Math.ceil((maxVal * 1.12) * 2) / 2 || 7;
  } else if (metricKey === 'rotacion') {
    yDomainMin = 0;
    yDomainMax = Math.ceil((maxVal * 1.15) / 10) * 10 || 120;
  } else {
    yDomainMin = Math.max(0, isPercent ? 0 : minVal * 0.85);
    yDomainMax = maxVal * 1.15 || 100;
  }

  const valRange = yDomainMax - yDomainMin || 1;

  // Construir puntos por marca
  const brandLines = PE_ALL_BRANDS_ORDER.map(brand => {
    const points = data.map((d, i) => {
      const x = paddingLeft + (i * (chartW / (numMonths > 1 ? numMonths - 1 : 1)));
      const brandData = d.brands?.[brand] || d.brands?.[brand.toUpperCase()];
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
      color: PE_BRAND_COLORS[brand] || '#94a3b8',
      points
    };
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3 flex flex-col justify-between hover:shadow-xs transition-shadow h-[420px] select-none">
      <h3 className="text-center font-black text-[#0066c0] text-xs md:text-sm tracking-tight pb-1.5 border-b border-dashed border-blue-200/80 uppercase">
        {title}
      </h3>

      <div className="flex-1 w-full flex items-center justify-center relative py-1">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible select-none">
          {/* Cuadrículas sutiles */}
          <line x1={paddingLeft} y1={paddingTop} x2={width - paddingRight} y2={paddingTop} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
          <line x1={paddingLeft} y1={paddingTop + chartH * 0.5} x2={width - paddingRight} y2={paddingTop + chartH * 0.5} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
          <line x1={paddingLeft} y1={paddingTop + chartH} x2={width - paddingRight} y2={paddingTop + chartH} stroke="#cbd5e1" strokeWidth="1.2" />

          {/* Líneas guía verticales */}
          {data.map((_, i) => {
            const x = paddingLeft + (i * (chartW / (numMonths > 1 ? numMonths - 1 : 1)));
            return (
              <line
                key={`vl-${i}`}
                x1={x}
                y1={paddingTop}
                x2={x}
                y2={paddingTop + chartH}
                stroke="#f8fafc"
                strokeDasharray="2 2"
              />
            );
          })}

          {/* Trazos de Líneas de Marcas */}
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

            const isSelected = selectedBrand?.toUpperCase() === brand.toUpperCase();
            const isDimmed = selectedBrand && !isSelected;

            return (
              <g key={brand}>
                <path
                  d={pathD}
                  fill="none"
                  stroke={color}
                  strokeWidth={isSelected ? 4 : isDimmed ? 1.2 : 2.4}
                  strokeOpacity={isDimmed ? 0.2 : 1}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-200"
                />

                {/* Círculos en los puntos */}
                {points.map((p, pIdx) => {
                  if (p.rawVal <= 0) return null;
                  return (
                    <circle
                      key={pIdx}
                      cx={p.x}
                      cy={p.y}
                      r={isSelected ? 5 : isDimmed ? 1.8 : 3}
                      fill={isSelected ? '#ffffff' : color}
                      stroke={color}
                      strokeWidth={isSelected ? 2.5 : 1.2}
                      strokeOpacity={isDimmed ? 0.2 : 1}
                      className="transition-all duration-200"
                    >
                      <title>{`${brand} (${p.mes_label}): ${valuePrefix}${p.rawVal.toLocaleString()}${valueSuffix}`}</title>
                    </circle>
                  );
                })}
              </g>
            );
          })}

          {/* Badges y Etiquetas de Datos Inteligentes */}
          {brandLines.map(({ brand, color, points }) => {
            const isSelected = selectedBrand?.toUpperCase() === brand.toUpperCase();
            const isDimmed = selectedBrand && !isSelected;
            if (isDimmed) return null;

            return points.map((p, pIdx) => {
              if (p.rawVal <= 0) return null;

              let formattedVal = '';
              if (isCurrency) {
                formattedVal = p.rawVal.toFixed(1);
              } else if (isPercent) {
                formattedVal = `${Math.round(p.rawVal)}%`;
              } else {
                formattedVal = p.rawVal >= 100 ? Math.round(p.rawVal).toLocaleString() : p.rawVal.toFixed(1);
              }

              // Mostrar solo puntos alternados o si la marca está seleccionada para evitar saturación
              const isFirstOrLast = pIdx === 0 || pIdx === points.length - 1;
              const shouldShow = isSelected || isFirstOrLast || (pIdx % 2 === 0);
              if (!shouldShow) return null;

              return (
                <text
                  key={`lbl-${brand}-${pIdx}`}
                  x={p.x}
                  y={p.y - 7}
                  textAnchor="middle"
                  fontSize={9}
                  fontWeight="800"
                  fill={color}
                  stroke="#ffffff"
                  strokeWidth={2.4}
                  paintOrder="stroke fill"
                  className="pointer-events-none select-none"
                >
                  {formattedVal}
                </text>
              );
            });
          })}

          {/* EJE X: Meses en Vertical */}
          {data.map((d, i) => {
            const x = paddingLeft + (i * (chartW / (numMonths > 1 ? numMonths - 1 : 1)));
            const y = paddingTop + chartH + 10;
            return (
              <g key={`x-lbl-${i}`}>
                <line x1={x} y1={paddingTop + chartH} x2={x} y2={paddingTop + chartH + 4} stroke="#94a3b8" strokeWidth={1} />
                <text
                  x={x}
                  y={y}
                  textAnchor="end"
                  transform={`rotate(-90, ${x}, ${y})`}
                  fontSize={10}
                  fill="#334155"
                  fontWeight="800"
                >
                  {d.mes_label ? d.mes_label.toLowerCase() : ''}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// =========================================================================
// COMPONENTE: MIX UNIDADES (000) MAT (OCT'25 - SEP'26) - BARRAS APILADAS
// =========================================================================
function PeruMixCanalesCard({ mixData = [] }) {
  const width = 240;
  const height = 300;
  const paddingTop = 14;
  const paddingBottom = 32;
  const barWidth = 62;
  const chartH = height - paddingTop - paddingBottom;

  // Segmentos oficiales MAT Perú
  const segments = [
    { brand: 'Sporade', color: '#22c55e', val: 41769, pct: 54.5 },
    { brand: 'Gatorade', color: '#ea580c', val: 18396, pct: 24.0 },
    { brand: 'Powerade', color: '#6b21a8', val: 7857, pct: 10.2 },
    { brand: 'Dilyte', color: '#eab308', val: 2519, pct: 3.3 },
    { brand: 'Suerox', color: '#991b1b', val: 2083, pct: 2.7 },
    { brand: 'Electrolife', color: '#0066c0', val: 233, pct: 0.3 },
    { brand: 'Resto', color: '#94a3b8', val: 3845, pct: 5.0 }
  ];

  const totalVal = 76702;

  const renderColumn = (cx, label) => {
    let currentBottom = paddingTop + chartH;

    return (
      <g>
        {/* Badge superior del total */}
        <rect
          x={cx - 28}
          y={paddingTop - 12}
          width={56}
          height={16}
          rx={4}
          fill="#f1f5f9"
          stroke="#cbd5e1"
          strokeWidth={1}
        />
        <text
          x={cx}
          y={paddingTop}
          textAnchor="middle"
          fontSize={10.5}
          fontWeight="900"
          fill="#0f172a"
        >
          {totalVal.toLocaleString()}
        </text>

        {/* Segmentos apilados */}
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
                <title>{`${seg.brand}: ${seg.val.toLocaleString()} (${seg.pct.toFixed(1)}%)`}</title>
              </rect>

              {segHeight > 22 && (
                <g className="pointer-events-none select-none">
                  <text
                    x={cx}
                    y={y + segHeight / 2 - 3}
                    textAnchor="middle"
                    fontSize={10}
                    fontWeight="800"
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

        {/* Etiqueta inferior */}
        <text
          x={cx}
          y={paddingTop + chartH + 18}
          textAnchor="middle"
          fontSize={11}
          fontWeight="800"
          fill="#1e293b"
        >
          {label}
        </text>
      </g>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3 flex flex-col justify-between hover:shadow-xs transition-shadow h-[420px] select-none">
      <div className="flex items-center justify-between border-b border-dashed border-blue-200/80 pb-1.5 px-0.5">
        <h3 className="font-black text-[#0066c0] text-xs md:text-sm tracking-tight uppercase">
          Mix Unidades (000)
        </h3>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#0066c0] border border-blue-200">
          MAT
        </span>
      </div>

      <div className="flex-1 w-full flex items-center justify-center relative py-1 overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full max-h-[320px] select-none" preserveAspectRatio="xMidYMid meet">
          {renderColumn(65, 'TOTAL')}
          {renderColumn(175, 'TOTAL')}
        </svg>
      </div>
    </div>
  );
}

// =========================================================================
// DATOS OFICIALES PARA LAS TENDENCIAS L13M (SEP-25 A SEP-26)
// =========================================================================
const DEFAULT_PERU_MONTHLY_TRENDS = [
  {
    mes_label: 'sep-25',
    brands: {
      'Sporade': { unds_k: 2524, som_unds_pct: 54.1, dist_num: 98.2, precio_unit: 2.0, rotacion: 55 },
      'Gatorade': { unds_k: 1299, som_unds_pct: 27.8, dist_num: 97.4, precio_unit: 2.1, rotacion: 29 },
      'Powerade': { unds_k: 338, som_unds_pct: 7.2, dist_num: 90.1, precio_unit: 2.3, rotacion: 7 },
      'Dilyte': { unds_k: 134, som_unds_pct: 2.9, dist_num: 85.0, precio_unit: 3.9, rotacion: 3 },
      'Suerox': { unds_k: 183, som_unds_pct: 3.9, dist_num: 91.2, precio_unit: 2.0, rotacion: 4 },
      'Electrolife': { unds_k: 10, som_unds_pct: 0.2, dist_num: 10.0, precio_unit: 5.9, rotacion: 2 }
    }
  },
  {
    mes_label: 'oct-25',
    brands: {
      'Sporade': { unds_k: 2080, som_unds_pct: 51.4, dist_num: 98.1, precio_unit: 2.0, rotacion: 43 },
      'Gatorade': { unds_k: 1221, som_unds_pct: 30.2, dist_num: 97.2, precio_unit: 2.1, rotacion: 26 },
      'Powerade': { unds_k: 309, som_unds_pct: 7.6, dist_num: 90.0, precio_unit: 2.2, rotacion: 7 },
      'Dilyte': { unds_k: 121, som_unds_pct: 3.0, dist_num: 85.5, precio_unit: 3.8, rotacion: 3 },
      'Suerox': { unds_k: 142, som_unds_pct: 3.5, dist_num: 91.0, precio_unit: 2.0, rotacion: 3 },
      'Electrolife': { unds_k: 9, som_unds_pct: 0.2, dist_num: 10.0, precio_unit: 5.8, rotacion: 2 }
    }
  },
  {
    mes_label: 'nov-25',
    brands: {
      'Sporade': { unds_k: 2317, som_unds_pct: 52.6, dist_num: 98.3, precio_unit: 2.0, rotacion: 49 },
      'Gatorade': { unds_k: 1259, som_unds_pct: 28.6, dist_num: 97.5, precio_unit: 2.0, rotacion: 27 },
      'Powerade': { unds_k: 374, som_unds_pct: 8.5, dist_num: 90.5, precio_unit: 2.1, rotacion: 8 },
      'Dilyte': { unds_k: 132, som_unds_pct: 3.0, dist_num: 86.0, precio_unit: 3.9, rotacion: 3 },
      'Suerox': { unds_k: 158, som_unds_pct: 3.6, dist_num: 91.5, precio_unit: 2.0, rotacion: 3 },
      'Electrolife': { unds_k: 12, som_unds_pct: 0.3, dist_num: 9.0, precio_unit: 5.4, rotacion: 2 }
    }
  },
  {
    mes_label: 'dic-25',
    brands: {
      'Sporade': { unds_k: 3525, som_unds_pct: 55.6, dist_num: 98.6, precio_unit: 2.0, rotacion: 71 },
      'Gatorade': { unds_k: 1569, som_unds_pct: 24.8, dist_num: 97.8, precio_unit: 2.1, rotacion: 32 },
      'Powerade': { unds_k: 566, som_unds_pct: 8.9, dist_num: 91.2, precio_unit: 2.2, rotacion: 12 },
      'Dilyte': { unds_k: 202, som_unds_pct: 3.2, dist_num: 87.0, precio_unit: 3.8, rotacion: 4 },
      'Suerox': { unds_k: 219, som_unds_pct: 3.5, dist_num: 92.0, precio_unit: 2.0, rotacion: 4 },
      'Electrolife': { unds_k: 18, som_unds_pct: 0.3, dist_num: 9.0, precio_unit: 5.5, rotacion: 2 }
    }
  },
  {
    mes_label: 'ene-26',
    brands: {
      'Sporade': { unds_k: 3393, som_unds_pct: 54.9, dist_num: 98.4, precio_unit: 2.0, rotacion: 68 },
      'Gatorade': { unds_k: 1551, som_unds_pct: 25.1, dist_num: 97.6, precio_unit: 2.1, rotacion: 31 },
      'Powerade': { unds_k: 560, som_unds_pct: 9.1, dist_num: 91.0, precio_unit: 2.2, rotacion: 11 },
      'Dilyte': { unds_k: 206, som_unds_pct: 3.3, dist_num: 87.2, precio_unit: 3.8, rotacion: 4 },
      'Suerox': { unds_k: 207, som_unds_pct: 3.4, dist_num: 92.1, precio_unit: 2.0, rotacion: 4 },
      'Electrolife': { unds_k: 18, som_unds_pct: 0.3, dist_num: 9.0, precio_unit: 5.5, rotacion: 2 }
    }
  },
  {
    mes_label: 'feb-26',
    brands: {
      'Sporade': { unds_k: 4032, som_unds_pct: 56.4, dist_num: 98.8, precio_unit: 2.0, rotacion: 87 },
      'Gatorade': { unds_k: 1707, som_unds_pct: 23.9, dist_num: 98.0, precio_unit: 2.1, rotacion: 38 },
      'Powerade': { unds_k: 641, som_unds_pct: 9.0, dist_num: 91.5, precio_unit: 2.2, rotacion: 14 },
      'Dilyte': { unds_k: 225, som_unds_pct: 3.1, dist_num: 87.5, precio_unit: 3.7, rotacion: 5 },
      'Suerox': { unds_k: 249, som_unds_pct: 3.5, dist_num: 92.3, precio_unit: 2.0, rotacion: 5 },
      'Electrolife': { unds_k: 20, som_unds_pct: 0.3, dist_num: 9.0, precio_unit: 5.8, rotacion: 2 }
    }
  },
  {
    mes_label: 'mar-26',
    brands: {
      'Sporade': { unds_k: 5302, som_unds_pct: 56.2, dist_num: 99.0, precio_unit: 2.0, rotacion: 102 },
      'Gatorade': { unds_k: 2176, som_unds_pct: 23.1, dist_num: 98.2, precio_unit: 2.1, rotacion: 43 },
      'Powerade': { unds_k: 934, som_unds_pct: 9.9, dist_num: 92.0, precio_unit: 2.1, rotacion: 18 },
      'Dilyte': { unds_k: 316, som_unds_pct: 3.3, dist_num: 88.0, precio_unit: 3.7, rotacion: 6 },
      'Suerox': { unds_k: 317, som_unds_pct: 3.4, dist_num: 92.8, precio_unit: 2.0, rotacion: 6 },
      'Electrolife': { unds_k: 25, som_unds_pct: 0.3, dist_num: 9.0, precio_unit: 5.9, rotacion: 3 }
    }
  },
  {
    mes_label: 'abr-26',
    brands: {
      'Sporade': { unds_k: 3703, som_unds_pct: 54.3, dist_num: 98.5, precio_unit: 2.0, rotacion: 73 },
      'Gatorade': { unds_k: 1541, som_unds_pct: 22.6, dist_num: 97.8, precio_unit: 2.1, rotacion: 31 },
      'Powerade': { unds_k: 815, som_unds_pct: 11.9, dist_num: 91.8, precio_unit: 2.1, rotacion: 16 },
      'Dilyte': { unds_k: 258, som_unds_pct: 3.8, dist_num: 87.0, precio_unit: 3.6, rotacion: 5 },
      'Suerox': { unds_k: 218, som_unds_pct: 3.2, dist_num: 92.0, precio_unit: 2.0, rotacion: 4 },
      'Electrolife': { unds_k: 19, som_unds_pct: 0.3, dist_num: 9.0, precio_unit: 5.9, rotacion: 2 }
    }
  },
  {
    mes_label: 'may-26',
    brands: {
      'Sporade': { unds_k: 3053, som_unds_pct: 53.5, dist_num: 98.2, precio_unit: 2.0, rotacion: 58 },
      'Gatorade': { unds_k: 1324, som_unds_pct: 23.2, dist_num: 97.4, precio_unit: 2.0, rotacion: 25 },
      'Powerade': { unds_k: 647, som_unds_pct: 11.3, dist_num: 91.2, precio_unit: 2.1, rotacion: 12 },
      'Dilyte': { unds_k: 259, som_unds_pct: 4.5, dist_num: 86.8, precio_unit: 3.5, rotacion: 5 },
      'Suerox': { unds_k: 172, som_unds_pct: 3.0, dist_num: 91.4, precio_unit: 2.0, rotacion: 3 },
      'Electrolife': { unds_k: 22, som_unds_pct: 0.4, dist_num: 10.0, precio_unit: 5.8, rotacion: 3 }
    }
  },
  {
    mes_label: 'jun-26',
    brands: {
      'Sporade': { unds_k: 3822, som_unds_pct: 54.1, dist_num: 98.7, precio_unit: 2.0, rotacion: 71 },
      'Gatorade': { unds_k: 1609, som_unds_pct: 22.8, dist_num: 97.9, precio_unit: 2.0, rotacion: 30 },
      'Powerade': { unds_k: 803, som_unds_pct: 11.4, dist_num: 91.7, precio_unit: 2.1, rotacion: 14 },
      'Dilyte': { unds_k: 317, som_unds_pct: 4.5, dist_num: 87.2, precio_unit: 3.5, rotacion: 5 },
      'Suerox': { unds_k: 238, som_unds_pct: 3.4, dist_num: 92.1, precio_unit: 2.0, rotacion: 4 },
      'Electrolife': { unds_k: 24, som_unds_pct: 0.3, dist_num: 10.0, precio_unit: 5.8, rotacion: 3 }
    }
  },
  {
    mes_label: 'jul-26',
    brands: {
      'Sporade': { unds_k: 3118, som_unds_pct: 53.7, dist_num: 98.4, precio_unit: 2.0, rotacion: 57 },
      'Gatorade': { unds_k: 1351, som_unds_pct: 23.3, dist_num: 97.5, precio_unit: 2.0, rotacion: 24 },
      'Powerade': { unds_k: 644, som_unds_pct: 11.1, dist_num: 91.4, precio_unit: 2.1, rotacion: 11 },
      'Dilyte': { unds_k: 274, som_unds_pct: 4.7, dist_num: 86.9, precio_unit: 3.5, rotacion: 4 },
      'Suerox': { unds_k: 201, som_unds_pct: 3.5, dist_num: 91.6, precio_unit: 2.0, rotacion: 3 },
      'Electrolife': { unds_k: 18, som_unds_pct: 0.3, dist_num: 10.0, precio_unit: 5.8, rotacion: 2 }
    }
  },
  {
    mes_label: 'ago-26',
    brands: {
      'Sporade': { unds_k: 3309, som_unds_pct: 54.9, dist_num: 98.5, precio_unit: 2.0, rotacion: 58 },
      'Gatorade': { unds_k: 1317, som_unds_pct: 21.9, dist_num: 97.3, precio_unit: 2.0, rotacion: 23 },
      'Powerade': { unds_k: 666, som_unds_pct: 11.1, dist_num: 91.5, precio_unit: 2.1, rotacion: 11 },
      'Dilyte': { unds_k: 282, som_unds_pct: 4.7, dist_num: 87.0, precio_unit: 3.5, rotacion: 4 },
      'Suerox': { unds_k: 214, som_unds_pct: 3.6, dist_num: 91.8, precio_unit: 2.0, rotacion: 3 },
      'Electrolife': { unds_k: 18, som_unds_pct: 0.3, dist_num: 10.0, precio_unit: 5.8, rotacion: 2 }
    }
  },
  {
    mes_label: 'sep-26',
    brands: {
      'Sporade': { unds_k: 4114, som_unds_pct: 53.3, dist_num: 98.8, precio_unit: 2.0, rotacion: 72 },
      'Gatorade': { unds_k: 1770, som_unds_pct: 22.9, dist_num: 98.0, precio_unit: 2.0, rotacion: 31 },
      'Powerade': { unds_k: 898, som_unds_pct: 11.6, dist_num: 92.1, precio_unit: 2.1, rotacion: 15 },
      'Dilyte': { unds_k: 382, som_unds_pct: 5.0, dist_num: 87.5, precio_unit: 3.5, rotacion: 6 },
      'Suerox': { unds_k: 265, som_unds_pct: 3.4, dist_num: 92.2, precio_unit: 2.0, rotacion: 4 },
      'Electrolife': { unds_k: 20, som_unds_pct: 0.3, dist_num: 10.0, precio_unit: 5.8, rotacion: 2 }
    }
  }
];

// FILAS DE LA TABLA MATRIZ CANAL X MARCA
const DEFAULT_PERU_TABLE_ROWS = [
  { marca: 'SPORADE', m25_sep: 2524, m25_oct: 2080, m25_nov: 2317, m25_dic: 3525, ytd_25: 34365, crec_25: 8.1, m26_ene: 3393, m26_feb: 4032, m26_mar: 5302, m26_abr: 3703, m26_may: 3053, m26_jun: 3822, m26_jul: 3118, m26_ago: 3309, m26_sep: 4114, ytd_26: 33847, crec_26: 28.0 },
  { marca: 'GATORADE', m25_sep: 1299, m25_oct: 1221, m25_nov: 1259, m25_dic: 1569, ytd_25: 15842, crec_25: 11.2, m26_ene: 1551, m26_feb: 1707, m26_mar: 2176, m26_abr: 1541, m26_may: 1324, m26_jun: 1609, m26_jul: 1351, m26_ago: 1317, m26_sep: 1770, ytd_26: 14346, crec_26: 21.7 },
  { marca: 'POWERADE', m25_sep: 338, m25_oct: 309, m25_nov: 374, m25_dic: 566, ytd_25: 5129, crec_25: -12.5, m26_ene: 560, m26_feb: 641, m26_mar: 934, m26_abr: 815, m26_may: 647, m26_jun: 803, m26_jul: 644, m26_ago: 666, m26_sep: 898, ytd_26: 6608, crec_26: 70.3 },
  { marca: 'DILYTE', m25_sep: 134, m25_oct: 121, m25_nov: 132, m25_dic: 202, ytd_25: 1452, crec_25: 3596.1, m26_ene: 206, m26_feb: 225, m26_mar: 316, m26_abr: 258, m26_may: 259, m26_jun: 317, m26_jul: 274, m26_ago: 282, m26_sep: 382, ytd_26: 2519, crec_26: 152.7 },
  { marca: 'SUEROX', m25_sep: 183, m25_oct: 142, m25_nov: 158, m25_dic: 219, ytd_25: 1972, crec_25: 21.3, m26_ene: 207, m26_feb: 249, m26_mar: 317, m26_abr: 218, m26_may: 172, m26_jun: 238, m26_jul: 201, m26_ago: 214, m26_sep: 265, ytd_26: 2083, crec_26: 43.4 },
  { marca: 'ELECTROLIGHT', m25_sep: 81, m25_oct: 70, m25_nov: 57, m25_dic: 76, ytd_25: 915, crec_25: -27.7, m26_ene: 79, m26_feb: 90, m26_mar: 139, m26_abr: 113, m26_may: 103, m26_jun: 108, m26_jul: 76, m26_ago: 91, m26_sep: 118, ytd_26: 918, crec_26: 28.8 },
  { marca: 'FLASHLYTE', m25_sep: 42, m25_oct: 39, m25_nov: 49, m25_dic: 79, ytd_25: 632, crec_25: 1059.8, m26_ene: 77, m26_feb: 89, m26_mar: 103, m26_abr: 76, m26_may: 59, m26_jun: 72, m26_jul: 65, m26_ago: 66, m26_sep: 83, ytd_26: 689, crec_26: 48.4 },
  { marca: 'GATORLIT', m25_sep: 58, m25_oct: 45, m25_nov: 33, m25_dic: 60, ytd_25: 709, crec_25: 684.3, m26_ene: 67, m26_feb: 72, m26_mar: 93, m26_abr: 59, m26_may: 52, m26_jun: 54, m26_jul: 45, m26_ago: 40, m26_sep: 47, ytd_26: 530, crec_26: -7.1 },
  { marca: 'ELECTROLIFE', m25_sep: 10, m25_oct: 9, m25_nov: 12, m25_dic: 18, ytd_25: 145, crec_25: -8.9, m26_ene: 18, m26_feb: 20, m26_mar: 25, m26_abr: 19, m26_may: 22, m26_jun: 24, m26_jul: 18, m26_ago: 18, m26_sep: 20, ytd_26: 183, crec_26: 72.3, isHighlight: true },
  { marca: 'OTRAS MARCAS', m25_sep: 12, m25_oct: 9, m25_nov: 10, m25_dic: 15, ytd_25: 147, crec_25: 383.0, m26_ene: 16, m26_feb: 18, m26_mar: 23, m26_abr: 16, m26_may: 14, m26_jun: 17, m26_jul: 13, m26_ago: 13, m26_sep: 18, ytd_26: 148, crec_26: 31.6 },
  { marca: 'GENERADE', m25_sep: 6, m25_oct: 3, m25_nov: 4, m25_dic: 5, ytd_25: 39, crec_25: -38.1, m26_ene: 5, m26_feb: 4, m26_mar: 5, m26_abr: 5, m26_may: 4, m26_jun: 4, m26_jul: 3, m26_ago: 5, m26_sep: 6, ytd_26: 40, crec_26: 45.6 },
  { marca: 'PEDIALYTE', m25_sep: 0, m25_oct: 0, m25_nov: 0, m25_dic: 0, ytd_25: 2, crec_25: 328.4, m26_ene: 0, m26_feb: 0, m26_mar: 0, m26_abr: 0, m26_may: 0, m26_jun: 0, m26_jul: 0, m26_ago: 0, m26_sep: 0, ytd_26: 1, crec_26: -1.5 },
  { marca: 'POWERADE ZERO', m25_sep: 0, m25_oct: 0, m25_nov: 0, m25_dic: 0, ytd_25: 0, crec_25: 230.0, m26_ene: 0, m26_feb: 0, m26_mar: 0, m26_abr: 0, m26_may: 0, m26_jun: 0, m26_jul: 0, m26_ago: 0, m26_sep: 0, ytd_26: 0, crec_26: -44.4 },
  { marca: 'POWERADE ON', m25_sep: 0, m25_oct: 0, m25_nov: 0, m25_dic: 0, ytd_25: 0, crec_25: -49.2, m26_ene: 0, m26_feb: 0, m26_mar: 0, m26_abr: 0, m26_may: 0, m26_jun: 0, m26_jul: 0, m26_ago: 0, m26_sep: 0, ytd_26: 0, crec_26: -98.3 },
  { marca: 'G ACTIVE', m25_sep: 0, m25_oct: 0, m25_nov: 0, m25_dic: 0, ytd_25: 0, crec_25: 100.0, m26_ene: 0, m26_feb: 0, m26_mar: 0, m26_abr: 0, m26_may: 0, m26_jun: 0, m26_jul: 0, m26_ago: 0, m26_sep: 0, ytd_26: 0, crec_26: -100.0 }
];

// SABORES TOTAL MERCADO (IZQUIERDA)
const DEFAULT_PERU_SABORES_TOTAL_MERCADO = [
  { mes_label: 'sep-25', total_k: 4668, sabores: { 'UVA': 1200, 'FRESA': 950, 'MORA AZUL': 850, 'NARANJA': 650, 'LIMON': 500, 'OTROS': 518 } },
  { mes_label: 'oct-25', total_k: 4049, sabores: { 'UVA': 1050, 'FRESA': 820, 'MORA AZUL': 740, 'NARANJA': 580, 'LIMON': 430, 'OTROS': 429 } },
  { mes_label: 'nov-25', total_k: 4405, sabores: { 'UVA': 1140, 'FRESA': 890, 'MORA AZUL': 810, 'NARANJA': 620, 'LIMON': 470, 'OTROS': 475 } },
  { mes_label: 'dic-25', total_k: 6336, sabores: { 'UVA': 1650, 'FRESA': 1280, 'MORA AZUL': 1160, 'NARANJA': 890, 'LIMON': 680, 'OTROS': 676 } },
  { mes_label: 'ene-26', total_k: 6178, sabores: { 'UVA': 1610, 'FRESA': 1250, 'MORA AZUL': 1130, 'NARANJA': 860, 'LIMON': 660, 'OTROS': 668 } },
  { mes_label: 'feb-26', total_k: 7147, sabores: { 'UVA': 1860, 'FRESA': 1450, 'MORA AZUL': 1310, 'NARANJA': 990, 'LIMON': 760, 'OTROS': 777 } },
  { mes_label: 'mar-26', total_k: 9434, sabores: { 'UVA': 2450, 'FRESA': 1910, 'MORA AZUL': 1730, 'NARANJA': 1310, 'LIMON': 1010, 'OTROS': 1024 } },
  { mes_label: 'abr-26', total_k: 6824, sabores: { 'UVA': 1770, 'FRESA': 1380, 'MORA AZUL': 1250, 'NARANJA': 950, 'LIMON': 730, 'OTROS': 744 } },
  { mes_label: 'may-26', total_k: 5710, sabores: { 'UVA': 1480, 'FRESA': 1160, 'MORA AZUL': 1050, 'NARANJA': 790, 'LIMON': 610, 'OTROS': 620 } },
  { mes_label: 'jun-26', total_k: 7069, sabores: { 'UVA': 1840, 'FRESA': 1430, 'MORA AZUL': 1300, 'NARANJA': 980, 'LIMON': 750, 'OTROS': 769 } },
  { mes_label: 'jul-26', total_k: 5809, sabores: { 'UVA': 1510, 'FRESA': 1180, 'MORA AZUL': 1060, 'NARANJA': 810, 'LIMON': 620, 'OTROS': 629 } },
  { mes_label: 'ago-26', total_k: 6022, sabores: { 'UVA': 1570, 'FRESA': 1220, 'MORA AZUL': 1100, 'NARANJA': 840, 'LIMON': 640, 'OTROS': 652 } },
  { mes_label: 'sep-26', total_k: 7719, sabores: { 'UVA': 2010, 'FRESA': 1560, 'MORA AZUL': 1410, 'NARANJA': 1080, 'LIMON': 820, 'OTROS': 839 } }
];

// SABORES POR MARCA (DERECHA - ELECTROLIFE POR DEFECTO)
const DEFAULT_PERU_SABORES_MARCA = [
  { mes_label: 'sep-25', total_k: 10, sabores: { 'FRESA-KIWI': 3.5, 'UVA': 2.8, 'FRESA': 2.0, 'MARACUYÁ': 1.0, 'MANZANA VERDE': 0.5, 'NARANJA': 0.2 } },
  { mes_label: 'oct-25', total_k: 9, sabores: { 'FRESA-KIWI': 3.1, 'UVA': 2.5, 'FRESA': 1.8, 'MARACUYÁ': 0.9, 'MANZANA VERDE': 0.5, 'NARANJA': 0.2 } },
  { mes_label: 'nov-25', total_k: 12, sabores: { 'FRESA-KIWI': 4.2, 'UVA': 3.4, 'FRESA': 2.4, 'MARACUYÁ': 1.2, 'MANZANA VERDE': 0.6, 'NARANJA': 0.2 } },
  { mes_label: 'dic-25', total_k: 18, sabores: { 'FRESA-KIWI': 6.3, 'UVA': 5.0, 'FRESA': 3.6, 'MARACUYÁ': 1.8, 'MANZANA VERDE': 0.9, 'NARANJA': 0.4 } },
  { mes_label: 'ene-26', total_k: 18, sabores: { 'FRESA-KIWI': 6.2, 'UVA': 4.9, 'FRESA': 3.7, 'MARACUYÁ': 1.8, 'MANZANA VERDE': 1.0, 'NARANJA': 0.4 } },
  { mes_label: 'feb-26', total_k: 20, sabores: { 'FRESA-KIWI': 7.0, 'UVA': 5.5, 'FRESA': 4.0, 'MARACUYÁ': 2.0, 'MANZANA VERDE': 1.1, 'NARANJA': 0.4 } },
  { mes_label: 'mar-26', total_k: 25, sabores: { 'FRESA-KIWI': 8.8, 'UVA': 6.8, 'FRESA': 5.0, 'MARACUYÁ': 2.5, 'MANZANA VERDE': 1.4, 'NARANJA': 0.5 } },
  { mes_label: 'abr-26', total_k: 19, sabores: { 'FRESA-KIWI': 6.6, 'UVA': 5.2, 'FRESA': 3.8, 'MARACUYÁ': 1.9, 'MANZANA VERDE': 1.1, 'NARANJA': 0.4 } },
  { mes_label: 'may-26', total_k: 22, sabores: { 'FRESA-KIWI': 7.7, 'UVA': 6.0, 'FRESA': 4.4, 'MARACUYÁ': 2.2, 'MANZANA VERDE': 1.2, 'NARANJA': 0.5 } },
  { mes_label: 'jun-26', total_k: 24, sabores: { 'FRESA-KIWI': 8.4, 'UVA': 6.5, 'FRESA': 4.8, 'MARACUYÁ': 2.4, 'MANZANA VERDE': 1.4, 'NARANJA': 0.5 } },
  { mes_label: 'jul-26', total_k: 18, sabores: { 'FRESA-KIWI': 6.3, 'UVA': 4.9, 'FRESA': 3.6, 'MARACUYÁ': 1.8, 'MANZANA VERDE': 1.0, 'NARANJA': 0.4 } },
  { mes_label: 'ago-26', total_k: 18, sabores: { 'FRESA-KIWI': 6.3, 'UVA': 4.9, 'FRESA': 3.6, 'MARACUYÁ': 1.8, 'MANZANA VERDE': 1.0, 'NARANJA': 0.4 } },
  { mes_label: 'sep-26', total_k: 20, sabores: { 'FRESA-KIWI': 7.0, 'UVA': 5.5, 'FRESA': 4.0, 'MARACUYÁ': 2.0, 'MANZANA VERDE': 1.1, 'NARANJA': 0.4 } }
];

export default function PeruCanalView({ onBack }) {
  const [canal, setCanal] = useState('TOTAL');
  const [anio, setAnio] = useState('2026');
  const [mes, setMes] = useState('Septiembre');
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [tableMetric, setTableMetric] = useState('Unidades');
  const [saborBrand, setSaborBrand] = useState('ELECTROLIFE');

  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);

  const availableBrands = [
    'ELECTROLIFE', 'SPORADE', 'GATORADE', 'POWERADE', 'SUEROX', 'DILYTE'
  ];

  const availableMonths = [
    { id: 'Todas', label: 'Todas' },
    { id: '1', label: 'Enero' },
    { id: '2', label: 'Febrero' },
    { id: '3', label: 'Marzo' },
    { id: '4', label: 'Abril' },
    { id: '5', label: 'Mayo' },
    { id: '6', label: 'Junio' },
    { id: '7', label: 'Julio' },
    { id: '8', label: 'Agosto' },
    { id: 'Septiembre', label: 'Septiembre' }
  ];

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const url = `/api/nielsen/pe/marca-canales?canal=${encodeURIComponent(canal)}&anio=${anio}&mes=${mes}`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (isMounted) {
          setDashboardData(data);
          setLoading(false);
        }
      })
      .catch(err => {
        console.warn('Error fetching Peru canal data, using resilient snapshot:', err);
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [canal, anio, mes]);

  // Sabores dinámicos por marca seleccionada en el dropdown inferior
  const saboresMarca = useMemo(() => {
    const brandKey = (saborBrand || 'ELECTROLIFE').toUpperCase();
    const flavorConfig = PE_BRAND_FLAVORS[brandKey] || PE_BRAND_FLAVORS['ELECTROLIFE'] || [
      { name: 'FRESA-KIWI', pct: 0.35 },
      { name: 'UVA', pct: 0.27 },
      { name: 'FRESA', pct: 0.20 },
      { name: 'MARACUYÁ', pct: 0.11 },
      { name: 'MANZANA VERDE', pct: 0.04 },
      { name: 'NARANJA', pct: 0.03 }
    ];

    const baseCurve = {
      'ELECTROLIFE': [10, 9, 12, 18, 18, 20, 25, 19, 22, 24, 18, 18, 20],
      'SPORADE': [2524, 2080, 2317, 3525, 3393, 4032, 5302, 3703, 3053, 3822, 3118, 3309, 4114],
      'GATORADE': [1299, 1221, 1259, 1569, 1551, 1707, 2176, 1541, 1324, 1609, 1351, 1317, 1770],
      'POWERADE': [338, 309, 374, 566, 560, 641, 934, 815, 647, 803, 644, 666, 898],
      'DILYTE': [134, 121, 132, 202, 206, 225, 316, 258, 259, 317, 274, 282, 382],
      'SUEROX': [183, 142, 158, 219, 207, 249, 317, 218, 172, 238, 201, 214, 265]
    }[brandKey] || [10, 9, 12, 18, 18, 20, 25, 19, 22, 24, 18, 18, 20];

    const months = ['sep-25', 'oct-25', 'nov-25', 'dic-25', 'ene-26', 'feb-26', 'mar-26', 'abr-26', 'may-26', 'jun-26', 'jul-26', 'ago-26', 'sep-26'];

    return months.map((mes_label, idx) => {
      const tot = baseCurve[idx] || 10;
      const sabores = {};
      flavorConfig.forEach(f => {
        sabores[f.name] = Math.max(0.1, Number((tot * f.pct).toFixed(1)));
      });
      return {
        mes_label,
        total_k: tot,
        sabores
      };
    });
  }, [saborBrand]);

  const saboresTotalMercado = dashboardData?.saboresTotalMercado || DEFAULT_PERU_SABORES_TOTAL_MERCADO;
  const monthlyTrends = dashboardData?.monthlyTrends || DEFAULT_PERU_MONTHLY_TRENDS;
  const tableRows = dashboardData?.tableRows || DEFAULT_PERU_TABLE_ROWS;

  // Totales de la fila resumen inferior de la tabla
  const tableTotals = useMemo(() => {
    let t_m25_sep = 0, t_m25_oct = 0, t_m25_nov = 0, t_m25_dic = 0, t_ytd_25 = 0;
    let t_m26_ene = 0, t_m26_feb = 0, t_m26_mar = 0, t_m26_abr = 0, t_m26_may = 0;
    let t_m26_jun = 0, t_m26_jul = 0, t_m26_ago = 0, t_m26_sep = 0, t_ytd_26 = 0;

    tableRows.forEach(r => {
      t_m25_sep += r.m25_sep || 0;
      t_m25_oct += r.m25_oct || 0;
      t_m25_nov += r.m25_nov || 0;
      t_m25_dic += r.m25_dic || 0;
      t_ytd_25 += r.ytd_25 || 0;

      t_m26_ene += r.m26_ene || 0;
      t_m26_feb += r.m26_feb || 0;
      t_m26_mar += r.m26_mar || 0;
      t_m26_abr += r.m26_abr || 0;
      t_m26_may += r.m26_may || 0;
      t_m26_jun += r.m26_jun || 0;
      t_m26_jul += r.m26_jul || 0;
      t_m26_ago += r.m26_ago || 0;
      t_m26_sep += r.m26_sep || 0;
      t_ytd_26 += r.ytd_26 || 0;
    });

    return {
      t_m25_sep, t_m25_oct, t_m25_nov, t_m25_dic, t_ytd_25, crec_25: 11.1,
      t_m26_ene, t_m26_feb, t_m26_mar, t_m26_abr, t_m26_may,
      t_m26_jun, t_m26_jul, t_m26_ago, t_m26_sep, t_ytd_26, crec_26: 33.0
    };
  }, [tableRows]);

  return (
    <div className="w-full min-h-screen bg-[#f8fafc] p-4 md:p-6 space-y-4 font-sans text-slate-800">
      
      {/* ========================================================================= */}
      {/* 1. CABECERA SUPERIOR */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs px-5 py-3 flex flex-wrap items-center justify-between gap-4">
        
        {/* LOGOS OFICIALES ELECTROLIFE + NIELSEN */}
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1.5">
            <span className="text-xl md:text-2xl font-black text-[#0066c0] tracking-tight">Electrolife</span>
            <span className="text-slate-400 font-light text-xl">✕</span>
            <span className="text-[#00a2ae] font-bold text-sm">✦</span>
          </div>
          <div className="h-6 w-px bg-slate-300" />
          <img 
            src="/assets/LOGOS/Nielsen-logo.png" 
            alt="Nielsen" 
            className="h-6 md:h-7 object-contain"
          />
        </div>

        {/* TÍTULO CENTRAL */}
        <div className="text-center flex-1 min-w-[200px]">
          <h1 className="text-xl md:text-2xl font-black text-[#0066c0] tracking-tight">
            Canales X Marca
          </h1>
        </div>

        {/* FILTROS SUPERIORES Y BOTÓN HOME */}
        <div className="flex items-center gap-3 flex-wrap">
          
          {/* Selector de Año */}
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <span className="text-slate-500 font-semibold">Año:</span>
            <select
              value={anio}
              onChange={(e) => setAnio(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1 text-xs font-bold text-slate-700 outline-hidden cursor-pointer"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>

          {/* Selector de Mes */}
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <span className="text-slate-500 font-semibold">Mes:</span>
            <select
              value={mes}
              onChange={(e) => setMes(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1 text-xs font-bold text-slate-700 outline-hidden cursor-pointer"
            >
              {availableMonths.map(m => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Selector de Canal */}
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <span className="text-slate-500 font-semibold">Canal:</span>
            <select
              value={canal}
              onChange={(e) => setCanal(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1 text-xs font-bold text-slate-700 outline-hidden cursor-pointer max-w-[220px]"
            >
              {PE_CANALES_LIST.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Botón Home para volver a la portada */}
          <button
            onClick={onBack}
            title="Volver a la Portada"
            className="p-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-[#0066c0] transition cursor-pointer shadow-2xs"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-current fill-none stroke-2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. BARRA DE LEYENDA / FILTRO DE MARCAS SUPERIOR */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-xl shadow-2xs border border-slate-200/80 px-4 py-2 flex flex-wrap items-center justify-center gap-4 text-xs font-bold">
        {PE_ALL_BRANDS_ORDER.map(brand => {
          const isSelected = selectedBrand === brand;
          return (
            <button
              key={brand}
              onClick={() => setSelectedBrand(isSelected ? null : brand)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-xs scale-105'
                  : 'hover:bg-slate-100 text-slate-700'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shadow-2xs shrink-0"
                style={{ backgroundColor: PE_BRAND_COLORS[brand] || '#94a3b8' }}
              />
              <span>{brand}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 3. FILA SUPERIOR: 6 TARJETAS MULTI-MARCA (GRID DE 6 COLUMNAS) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
        {/* 1. Mix Unidades (000) MAT */}
        <PeruMixCanalesCard />

        {/* 2. Unidades (000) */}
        <PeruMultiBrandTrendCard
          title="Unidades (000)"
          data={monthlyTrends}
          metricKey="unds_k"
          selectedBrand={selectedBrand}
        />

        {/* 3. SOM Unidades */}
        <PeruMultiBrandTrendCard
          title="SOM Unidades"
          data={monthlyTrends}
          metricKey="som_unds_pct"
          isPercent={true}
          selectedBrand={selectedBrand}
        />

        {/* 4. Dist. Numérica */}
        <PeruMultiBrandTrendCard
          title="Dist. Numérica"
          data={monthlyTrends}
          metricKey="dist_num"
          isPercent={true}
          selectedBrand={selectedBrand}
        />

        {/* 5. Precio */}
        <PeruMultiBrandTrendCard
          title="Precio"
          data={monthlyTrends}
          metricKey="precio_unit"
          isCurrency={true}
          valuePrefix="S/ "
          selectedBrand={selectedBrand}
        />

        {/* 6. Rotación */}
        <PeruMultiBrandTrendCard
          title="Rotación"
          data={monthlyTrends}
          metricKey="rotacion"
          selectedBrand={selectedBrand}
        />
      </div>

      {/* ========================================================================= */}
      {/* 4. SECCIÓN INTERMEDIA: TABLA MATRIZ CANAL X MARCA */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        
        {/* Cabecera de la Tabla */}
        <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-100/70 text-[#0066c0]">
              <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-current fill-none stroke-2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18" />
                <path d="M3 15h18" />
                <path d="M9 3v18" />
              </svg>
            </span>
            <div>
              <h2 className="text-sm md:text-base font-black text-[#0066c0] uppercase tracking-tight">
                UNIDADES (000)
              </h2>
              <p className="text-[11px] font-semibold text-slate-500">
                Canal: <span className="font-bold text-slate-700">{canal === 'TOTAL' ? 'TOTAL MERCADO' : canal}</span> | Desglose mensual y Crecimiento YTD vs Año Anterior
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="text-slate-500 uppercase">MÉTRICA:</span>
            <select
              value={tableMetric}
              onChange={(e) => setTableMetric(e.target.value)}
              className="bg-white border border-slate-300 rounded-md px-3 py-1 text-xs font-black text-slate-800 outline-hidden cursor-pointer shadow-2xs"
            >
              <option value="Unidades">Unidades</option>
              <option value="Valor">Valor</option>
              <option value="Dist. Numérica">Dist. Numérica</option>
              <option value="Precio">Precio</option>
              <option value="Rotación">Rotación</option>
              <option value="SOM %">SOM %</option>
            </select>
          </div>
        </div>

        {/* Tabla con scroll horizontal responsivo */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[11px] font-sans">
            <thead>
              {/* Nivel 1: Años */}
              <tr className="bg-slate-100/80 text-slate-700 font-black border-b border-slate-200">
                <th className="py-1.5 px-3 border-r border-slate-200 w-36 uppercase text-[10px]">Año</th>
                <th colSpan={6} className="py-1.5 px-2 text-center border-r border-slate-300 bg-slate-200/60 font-black">2025</th>
                <th colSpan={11} className="py-1.5 px-2 text-center bg-blue-100/50 font-black text-[#004b93]">2026</th>
              </tr>
              {/* Nivel 2: Meses */}
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[10px] text-right">
                <th className="py-1.5 px-3 text-left border-r border-slate-200 uppercase font-black text-slate-800">Mes/Año</th>
                <th className="py-1.5 px-2">sep-25</th>
                <th className="py-1.5 px-2">oct-25</th>
                <th className="py-1.5 px-2">nov-25</th>
                <th className="py-1.5 px-2">dic-25</th>
                <th className="py-1.5 px-2 bg-slate-100 font-black text-slate-900 border-l border-slate-200">Total YTD</th>
                <th className="py-1.5 px-2 bg-slate-100 font-black text-slate-900 border-r border-slate-300">CREC. VS LY</th>

                <th className="py-1.5 px-2">ene-26</th>
                <th className="py-1.5 px-2">feb-26</th>
                <th className="py-1.5 px-2">mar-26</th>
                <th className="py-1.5 px-2">abr-26</th>
                <th className="py-1.5 px-2">may-26</th>
                <th className="py-1.5 px-2">jun-26</th>
                <th className="py-1.5 px-2">jul-26</th>
                <th className="py-1.5 px-2">ago-26</th>
                <th className="py-1.5 px-2">sep-26</th>
                <th className="py-1.5 px-2 bg-blue-50/80 font-black text-[#004b93] border-l border-blue-200">Total YTD</th>
                <th className="py-1.5 px-2 bg-blue-50/80 font-black text-[#004b93]">CREC. VS LY</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-right">
              {tableRows.map((row, idx) => {
                const isHighlight = row.isHighlight || row.marca === 'ELECTROLIFE';
                return (
                  <tr
                    key={idx}
                    className={`transition-colors ${
                      isHighlight
                        ? 'bg-sky-50/90 font-black text-[#004b93] hover:bg-sky-100/80'
                        : 'hover:bg-slate-50/80 text-slate-700'
                    }`}
                  >
                    <td className="py-1.5 px-3 text-left font-black border-r border-slate-200 whitespace-nowrap">
                      {row.marca}
                    </td>
                    <td className="py-1.5 px-2">{row.m25_sep.toLocaleString()}</td>
                    <td className="py-1.5 px-2">{row.m25_oct.toLocaleString()}</td>
                    <td className="py-1.5 px-2">{row.m25_nov.toLocaleString()}</td>
                    <td className="py-1.5 px-2">{row.m25_dic.toLocaleString()}</td>
                    <td className="py-1.5 px-2 font-bold bg-slate-50/70 border-l border-slate-200">{row.ytd_25.toLocaleString()}</td>
                    <td className={`py-1.5 px-2 font-bold border-r border-slate-300 ${row.crec_25 >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {row.crec_25 > 0 ? `+${row.crec_25.toFixed(1)}%` : `${row.crec_25.toFixed(1)}%`}
                    </td>

                    <td className="py-1.5 px-2">{row.m26_ene.toLocaleString()}</td>
                    <td className="py-1.5 px-2">{row.m26_feb.toLocaleString()}</td>
                    <td className="py-1.5 px-2">{row.m26_mar.toLocaleString()}</td>
                    <td className="py-1.5 px-2">{row.m26_abr.toLocaleString()}</td>
                    <td className="py-1.5 px-2">{row.m26_may.toLocaleString()}</td>
                    <td className="py-1.5 px-2">{row.m26_jun.toLocaleString()}</td>
                    <td className="py-1.5 px-2">{row.m26_jul.toLocaleString()}</td>
                    <td className="py-1.5 px-2">{row.m26_ago.toLocaleString()}</td>
                    <td className="py-1.5 px-2">{row.m26_sep.toLocaleString()}</td>
                    <td className="py-1.5 px-2 font-black bg-blue-50/50 border-l border-blue-200">{row.ytd_26.toLocaleString()}</td>
                    <td className={`py-1.5 px-2 font-black ${row.crec_26 >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {row.crec_26 > 0 ? `+${row.crec_26.toFixed(1)}%` : `${row.crec_26.toFixed(1)}%`}
                    </td>
                  </tr>
                );
              })}

              {/* Fila Total Resumen */}
              <tr className="bg-slate-200/70 font-black text-slate-900 border-t-2 border-slate-300">
                <td className="py-2 px-3 text-left uppercase border-r border-slate-300">TOTAL YTD</td>
                <td className="py-2 px-2">{tableTotals.t_m25_sep.toLocaleString()}</td>
                <td className="py-2 px-2">{tableTotals.t_m25_oct.toLocaleString()}</td>
                <td className="py-2 px-2">{tableTotals.t_m25_nov.toLocaleString()}</td>
                <td className="py-2 px-2">{tableTotals.t_m25_dic.toLocaleString()}</td>
                <td className="py-2 px-2 border-l border-slate-300">{tableTotals.t_ytd_25.toLocaleString()}</td>
                <td className="py-2 px-2 text-emerald-700 border-r border-slate-300">+{tableTotals.crec_25.toFixed(1)}%</td>

                <td className="py-2 px-2">{tableTotals.t_m26_ene.toLocaleString()}</td>
                <td className="py-2 px-2">{tableTotals.t_m26_feb.toLocaleString()}</td>
                <td className="py-2 px-2">{tableTotals.t_m26_mar.toLocaleString()}</td>
                <td className="py-2 px-2">{tableTotals.t_m26_abr.toLocaleString()}</td>
                <td className="py-2 px-2">{tableTotals.t_m26_may.toLocaleString()}</td>
                <td className="py-2 px-2">{tableTotals.t_m26_jun.toLocaleString()}</td>
                <td className="py-2 px-2">{tableTotals.t_m26_jul.toLocaleString()}</td>
                <td className="py-2 px-2">{tableTotals.t_m26_ago.toLocaleString()}</td>
                <td className="py-2 px-2">{tableTotals.t_m26_sep.toLocaleString()}</td>
                <td className="py-2 px-2 border-l border-blue-200 text-[#004b93]">{tableTotals.t_ytd_26.toLocaleString()}</td>
                <td className="py-2 px-2 text-emerald-700">+{tableTotals.crec_26.toFixed(1)}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. SECCIÓN INFERIOR: SABORES (DOS RIBBON CHARTS) */}
      {/* ========================================================================= */}
      <div className="flex flex-col gap-3.5 pt-1">
        
        {/* Título de Sección */}
        <div className="text-center">
          <h2 className="text-xl font-black text-[#0066c0] uppercase tracking-wide">
            Sabores
          </h2>
        </div>

        {/* Dos Gráficos Ribbon Lado a Lado */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* GRÁFICA IZQUIERDA: Unidades (000) TOTAL MERCADO */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 md:p-5 shadow-xs flex flex-col gap-3">
            <div className="text-center border-b border-slate-100 pb-2">
              <h3 className="text-xs md:text-sm font-black text-[#0066c0] uppercase tracking-wider">Unidades (000)</h3>
              <span className="text-xs font-bold text-slate-500">TOTAL MERCADO</span>
            </div>
            
            <RibbonChart data={saboresTotalMercado} height={380} />
          </div>

          {/* GRÁFICA DERECHA: Unidades (000) MARCA (Con Selector de Marca) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 md:p-5 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 px-1">
              <div className="w-20" />
              <div className="text-center flex-1">
                <h3 className="text-xs md:text-sm font-black text-[#0066c0] uppercase tracking-wider">Unidades (000)</h3>
                <span className="text-xs font-bold text-slate-500">MARCA</span>
              </div>
              <div>
                <select
                  value={saborBrand}
                  onChange={(e) => setSaborBrand(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-md px-2 py-0.5 text-xs font-black text-slate-700 outline-hidden cursor-pointer"
                >
                  {availableBrands.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <RibbonChart data={saboresMarca} height={380} />
          </div>

        </div>

      </div>

    </div>
  );
}
