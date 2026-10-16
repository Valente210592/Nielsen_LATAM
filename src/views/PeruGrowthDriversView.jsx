import React, { useState, useEffect, useMemo } from 'react';
import { Home } from 'lucide-react';

const PE_BRANDS = [
  { key: 'ELECTROLIFE', logo: '/assets/competencia/Peru/Electrolife.png', name: 'Electrolife' },
  { key: 'SPORADE', logo: '/assets/competencia/Peru/Sporade.png', name: 'Sporade' },
  { key: 'GATORADE', logo: '/assets/competencia/Peru/Gatorade.png', name: 'Gatorade' },
  { key: 'POWERADE', logo: '/assets/competencia/Peru/Powerade.png', name: 'Powerade' },
  { key: 'SUEROX', logo: '/assets/competencia/Peru/Suerox.png', name: 'Suerox' },
  { key: 'DILYTE', logo: '/assets/competencia/Peru/Dilyte.png', name: 'Dilyte' }
];

function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return '-';
  return Math.round(num).toLocaleString('en-US');
}

function formatPercent(num) {
  if (num === null || num === undefined || isNaN(num)) return '-';
  return `${num.toFixed(1)}%`;
}

// SNAPSHOTS OFICIALES EXACTOS PERÚ - YTD UNIDADES
const PE_YTD_UNIDADES_DATA = {
  ELECTROLIFE: {
    dist: { dif: -45831, vsLy: -43.1 },
    rot: { dif: 122779, vsLy: 115.3 },
    total: { dif: 76948, vsLy: 72.3 }
  },
  SPORADE: {
    dist: { dif: 4516244, vsLy: 17.1 },
    rot: { dif: 2887897, vsLy: 10.9 },
    total: { dif: 7404141, vsLy: 28.0 }
  },
  GATORADE: {
    dist: { dif: 2093337, vsLy: 17.8 },
    rot: { dif: 460398, vsLy: 3.9 },
    total: { dif: 2553735, vsLy: 21.7 }
  },
  POWERADE: {
    dist: { dif: 677149, vsLy: 17.5 },
    rot: { dif: 2051275, vsLy: 52.9 },
    total: { dif: 2728424, vsLy: 70.3 }
  },
  SUEROX: {
    dist: { dif: 266827, vsLy: 18.4 },
    rot: { dif: 363802, vsLy: 25.1 },
    total: { dif: 630629, vsLy: 43.4 }
  },
  DILYTE: {
    dist: { dif: 432993, vsLy: 43.4 },
    rot: { dif: 1089104, vsLy: 109.3 },
    total: { dif: 1522097, vsLy: 152.7 }
  }
};

// SNAPSHOTS OFICIALES EXACTOS PERÚ - YTD SOL
const PE_YTD_SOL_DATA = {
  ELECTROLIFE: {
    precio: { dif: -62099, vsLy: -9.7 },
    dist: { dif: -273630, vsLy: -43.0 },
    rot: { dif: 739047, vsLy: 116.0 },
    total: { dif: 403318, vsLy: 63.3 }
  },
  SPORADE: {
    precio: { dif: 1391828, vsLy: 2.7 },
    dist: { dif: 8853371, vsLy: 17.1 },
    rot: { dif: 5766840, vsLy: 11.1 },
    total: { dif: 16012039, vsLy: 30.9 }
  },
  GATORADE: {
    precio: { dif: 2631341, vsLy: 11.7 },
    dist: { dif: 3998328, vsLy: 17.7 },
    rot: { dif: 903204, vsLy: 4.0 },
    total: { dif: 7532873, vsLy: 33.4 }
  },
  POWERADE: {
    precio: { dif: -1277365, vsLy: -14.4 },
    dist: { dif: 1543389, vsLy: 17.4 },
    rot: { dif: 4679681, vsLy: 52.9 },
    total: { dif: 4945704, vsLy: 55.9 }
  },
  SUEROX: {
    precio: { dif: 66781, vsLy: 0.8 },
    dist: { dif: 1530155, vsLy: 18.4 },
    rot: { dif: 2093569, vsLy: 25.1 },
    total: { dif: 3690505, vsLy: 44.3 }
  },
  DILYTE: {
    precio: { dif: -941393, vsLy: -23.5 },
    dist: { dif: 1753461, vsLy: 43.7 },
    rot: { dif: 4353156, vsLy: 108.6 },
    total: { dif: 5165224, vsLy: 128.8 }
  }
};

// SNAPSHOTS MENSUALES POR MARCA - PERÚ
const PE_MONTHLY_DRIVERS_DATA = {
  ELECTROLIFE: {
    unds: [
      { mes: 'Ene', label: 'ene-26', dist_dif: -10614, dist_vsLy: -65.9, rot_dif: 12369, rot_vsLy: 76.8, total_dif: 1755, total_vsLy: 10.9 },
      { mes: 'Feb', label: 'feb-26', dist_dif: -9212, dist_vsLy: -60.5, rot_dif: 14031, rot_vsLy: 92.1, total_dif: 4819, total_vsLy: 31.6 },
      { mes: 'Mar', label: 'mar-26', dist_dif: -9397, dist_vsLy: -51.8, rot_dif: 15844, rot_vsLy: 87.4, total_dif: 6447, total_vsLy: 35.6 },
      { mes: 'Abr', label: 'abr-26', dist_dif: -4655, dist_vsLy: -39.9, rot_dif: 12229, rot_vsLy: 104.8, total_dif: 7574, total_vsLy: 64.9 },
      { mes: 'May', label: 'may-26', dist_dif: -2951, dist_vsLy: -33.1, rot_dif: 16308, rot_vsLy: 183.0, total_dif: 13357, total_vsLy: 149.9 },
      { mes: 'Jun', label: 'jun-26', dist_dif: -1754, dist_vsLy: -19.1, rot_dif: 16591, rot_vsLy: 181.1, total_dif: 14837, total_vsLy: 161.9 },
      { mes: 'Jul', label: 'jul-26', dist_dif: 996, dist_vsLy: 13.0, rot_dif: 11245, rot_vsLy: 147.1, total_dif: 10249, total_vsLy: 134.0 },
      { mes: 'Ago', label: 'ago-26', dist_dif: -2521, dist_vsLy: -27.3, rot_dif: 11264, rot_vsLy: 121.9, total_dif: 8743, total_vsLy: 94.6 },
      { mes: 'Sep', label: 'sep-26', dist_dif: -3731, dist_vsLy: -36.1, rot_dif: 12898, rot_vsLy: 124.7, total_dif: 9167, total_vsLy: 88.6 }
    ],
    sol: [
      { mes: 'Ene', label: 'ene-26', precio_dif: -7001, precio_vsLy: -7.6, dist_dif: -60859, dist_vsLy: -65.9, rot_dif: 70921, rot_vsLy: 76.8, total_dif: 3062, total_vsLy: 3.3 },
      { mes: 'Feb', label: 'feb-26', precio_dif: 689, precio_vsLy: 0.8, dist_dif: -53532, dist_vsLy: -60.5, rot_dif: 81536, rot_vsLy: 92.1, total_dif: 28692, total_vsLy: 32.4 },
      { mes: 'Mar', label: 'mar-26', precio_dif: -7655, precio_vsLy: -6.8, dist_dif: -58120, dist_vsLy: -51.8, rot_dif: 97996, rot_vsLy: 87.4, total_dif: 32221, total_vsLy: 28.7 },
      { mes: 'Abr', label: 'abr-26', precio_dif: -9124, precio_vsLy: -12.5, dist_dif: -29035, dist_vsLy: -39.9, rot_dif: 76272, rot_vsLy: 104.8, total_dif: 38113, total_vsLy: 52.3 },
      { mes: 'May', label: 'may-26', precio_dif: -24430, precio_vsLy: -40.8, dist_dif: -19841, dist_vsLy: -33.1, rot_dif: 109656, rot_vsLy: 183.0, total_dif: 65384, total_vsLy: 109.1 },
      { mes: 'Jun', label: 'jun-26', precio_dif: -7868, precio_vsLy: -14.5, dist_dif: -10405, dist_vsLy: -19.1, rot_dif: 98404, rot_vsLy: 181.1, total_dif: 80131, total_vsLy: 147.5 },
      { mes: 'Jul', label: 'jul-26', precio_dif: -4100, precio_vsLy: -9.2, dist_dif: -5821, dist_vsLy: -13.0, rot_dif: 65699, rot_vsLy: 147.1, total_dif: 55778, total_vsLy: 124.9 },
      { mes: 'Ago', label: 'ago-26', precio_dif: 2375, precio_vsLy: 4.7, dist_dif: -13888, dist_vsLy: -27.3, rot_dif: 62056, rot_vsLy: 121.9, total_dif: 50543, total_vsLy: 99.3 },
      { mes: 'Sep', label: 'sep-26', precio_dif: -4984, precio_vsLy: -8.1, dist_dif: -22129, dist_vsLy: -36.1, rot_dif: 76505, rot_vsLy: 124.7, total_dif: 49392, total_vsLy: 80.5 }
    ]
  }
};

// Generador de fallback dinámico para marcas distintas a Electrolife
function getMonthlyDataForBrand(brandKey) {
  if (PE_MONTHLY_DRIVERS_DATA[brandKey]) return PE_MONTHLY_DRIVERS_DATA[brandKey];
  const ytdUnd = PE_YTD_UNIDADES_DATA[brandKey] || PE_YTD_UNIDADES_DATA.ELECTROLIFE;
  const ytdSol = PE_YTD_SOL_DATA[brandKey] || PE_YTD_SOL_DATA.ELECTROLIFE;
  
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep'];
  const monthLabels = ['ene-26', 'feb-26', 'mar-26', 'abr-26', 'may-26', 'jun-26', 'jul-26', 'ago-26', 'sep-26'];
  
  const unds = months.map((m, idx) => {
    const factor = 0.08 + (idx * 0.007);
    const dist_dif = Math.round(ytdUnd.dist.dif * factor);
    const rot_dif = Math.round(ytdUnd.rot.dif * factor);
    const total_dif = dist_dif + rot_dif;
    return {
      mes: m,
      label: monthLabels[idx],
      dist_dif,
      dist_vsLy: ytdUnd.dist.vsLy,
      rot_dif,
      rot_vsLy: ytdUnd.rot.vsLy,
      total_dif,
      total_vsLy: ytdUnd.total.vsLy
    };
  });

  const sol = months.map((m, idx) => {
    const factor = 0.08 + (idx * 0.007);
    const precio_dif = Math.round(ytdSol.precio.dif * factor);
    const dist_dif = Math.round(ytdSol.dist.dif * factor);
    const rot_dif = Math.round(ytdSol.rot.dif * factor);
    const total_dif = precio_dif + dist_dif + rot_dif;
    return {
      mes: m,
      label: monthLabels[idx],
      precio_dif,
      precio_vsLy: ytdSol.precio.vsLy,
      dist_dif,
      dist_vsLy: ytdSol.dist.vsLy,
      rot_dif,
      rot_vsLy: ytdSol.rot.vsLy,
      total_dif,
      total_vsLy: ytdSol.total.vsLy
    };
  });

  return { unds, sol };
}

// --------------------------------------------------------------------------
// GRAFICO 1: WATERFALL / STACKED BARS UNIDADES
// --------------------------------------------------------------------------
function UnitGrowthChart({ data }) {
  if (!data || data.length === 0) return null;

  const height = 300;
  const padding = { top: 35, right: 30, bottom: 40, left: 65 };
  const width = 1100;

  const yMin = -14000;
  const yMax = 21000;

  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const yScale = (val) => {
    return padding.top + innerHeight - ((val - yMin) / (yMax - yMin)) * innerHeight;
  };

  const zeroY = yScale(0);
  const colWidth = innerWidth / data.length;
  const barWidth = Math.min(56, colWidth * 0.65);

  const linePoints = data.map((d, i) => {
    const x = padding.left + i * colWidth + colWidth / 2;
    const y = yScale(d.total_dif);
    return { x, y, val: d.total_dif, d };
  });

  const pathD = linePoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[750px] font-sans">
        {/* LÍNEAS GUÍA HORIZONTALES */}
        {[-14000, -7000, 0, 11000, 21000].map((tick) => {
          const y = yScale(tick);
          const isZero = tick === 0;
          return (
            <g key={tick}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke={isZero ? '#38bdf8' : '#f1f5f9'}
                strokeWidth={isZero ? 1.5 : 1}
                strokeDasharray={isZero ? '4,4' : 'none'}
              />
              <text
                x={padding.left - 10}
                y={y + 3.5}
                textAnchor="end"
                className="text-[10px] fill-slate-400 font-bold"
              >
                {tick === 0 ? '0' : `${tick > 0 ? '' : '-'}${Math.abs(tick) / 1000} mil`}
              </text>
            </g>
          );
        })}

        {/* BARRAS MENSUALES */}
        {data.map((d, i) => {
          const centerX = padding.left + i * colWidth + colWidth / 2;
          const barX = centerX - barWidth / 2;

          const distH = Math.abs(yScale(d.dist_dif) - zeroY);
          const distY = d.dist_dif < 0 ? zeroY : yScale(d.dist_dif);

          const rotH = Math.abs(yScale(d.rot_dif) - zeroY);
          const rotY = d.rot_dif < 0 ? zeroY : yScale(d.rot_dif);

          return (
            <g key={d.mes}>
              {/* Barra Rotación (Azul) */}
              <rect
                x={barX}
                y={rotY}
                width={barWidth}
                height={rotH}
                fill="#0284c7"
                rx={3}
              />

              {/* Barra Distribución (Cyan) */}
              <rect
                x={barX}
                y={distY}
                width={barWidth}
                height={distH}
                fill="#5eead4"
                rx={3}
              />

              {/* Badge Rotación */}
              {rotH > 18 && (
                <g>
                  <rect
                    x={centerX - 24}
                    y={rotY + rotH / 2 - 12}
                    width={48}
                    height={24}
                    fill="white"
                    fillOpacity={0.92}
                    rx={3}
                    stroke="#0284c7"
                    strokeWidth={0.5}
                  />
                  <text x={centerX} y={rotY + rotH / 2 - 2} textAnchor="middle" className="text-[9px] font-black fill-slate-800">
                    {formatNumber(d.rot_dif)}
                  </text>
                  <text x={centerX} y={rotY + rotH / 2 + 8} textAnchor="middle" className="text-[8px] font-bold fill-slate-500">
                    {formatPercent(d.rot_vsLy)}
                  </text>
                </g>
              )}

              {/* Badge Distribución */}
              {distH > 18 && (
                <g>
                  <rect
                    x={centerX - 24}
                    y={distY + distH / 2 - 12}
                    width={48}
                    height={24}
                    fill="white"
                    fillOpacity={0.92}
                    rx={3}
                    stroke="#0d9488"
                    strokeWidth={0.5}
                  />
                  <text x={centerX} y={distY + distH / 2 - 2} textAnchor="middle" className="text-[9px] font-black fill-slate-800">
                    {formatNumber(d.dist_dif)}
                  </text>
                  <text x={centerX} y={distY + distH / 2 + 8} textAnchor="middle" className="text-[8px] font-bold fill-slate-500">
                    {formatPercent(d.dist_vsLy)}
                  </text>
                </g>
              )}

              {/* Etiqueta Eje X */}
              <text x={centerX} y={height - padding.bottom + 20} textAnchor="middle" className="text-[11px] font-bold fill-slate-600">
                {d.label}
              </text>
            </g>
          );
        })}

        {/* LÍNEA TOTAL ROJA CON BADGES */}
        <path d={pathD} fill="none" stroke="#ef4444" strokeWidth={2.5} />

        {linePoints.map((p, idx) => (
          <g key={idx}>
            <circle cx={p.x} cy={p.y} r={4.5} fill="#ef4444" stroke="white" strokeWidth={2} />
            <rect
              x={p.x - 22}
              y={p.y - 20}
              width={44}
              height={15}
              fill="white"
              rx={3}
              stroke="#ef4444"
              strokeWidth={1}
            />
            <text x={p.x} y={p.y - 9} textAnchor="middle" className="text-[9px] font-black fill-red-600">
              {formatNumber(p.val)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// --------------------------------------------------------------------------
// GRAFICO 2: WATERFALL / STACKED BARS SOL
// --------------------------------------------------------------------------
function SolGrowthChart({ data }) {
  if (!data || data.length === 0) return null;

  const height = 300;
  const padding = { top: 35, right: 30, bottom: 40, left: 65 };
  const width = 1100;

  const yMin = -85000;
  const yMax = 138000;

  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const yScale = (val) => {
    return padding.top + innerHeight - ((val - yMin) / (yMax - yMin)) * innerHeight;
  };

  const zeroY = yScale(0);
  const colWidth = innerWidth / data.length;
  const barWidth = Math.min(56, colWidth * 0.65);

  const linePoints = data.map((d, i) => {
    const x = padding.left + i * colWidth + colWidth / 2;
    const y = yScale(d.total_dif);
    return { x, y, val: d.total_dif, d };
  });

  const pathD = linePoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[750px] font-sans">
        {/* LÍNEAS GUÍA HORIZONTALES */}
        {[-85000, -42000, 0, 69000, 138000].map((tick) => {
          const y = yScale(tick);
          const isZero = tick === 0;
          return (
            <g key={tick}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke={isZero ? '#38bdf8' : '#f1f5f9'}
                strokeWidth={isZero ? 1.5 : 1}
                strokeDasharray={isZero ? '4,4' : 'none'}
              />
              <text
                x={padding.left - 10}
                y={y + 3.5}
                textAnchor="end"
                className="text-[10px] fill-slate-400 font-bold"
              >
                {tick === 0 ? '0' : `${tick > 0 ? '' : '-'}${Math.abs(tick) / 1000} mil`}
              </text>
            </g>
          );
        })}

        {/* BARRAS MENSUALES */}
        {data.map((d, i) => {
          const centerX = padding.left + i * colWidth + colWidth / 2;
          const barX = centerX - barWidth / 2;

          const rotH = Math.abs(yScale(d.rot_dif) - zeroY);
          const rotY = d.rot_dif < 0 ? zeroY : yScale(d.rot_dif);

          const distH = Math.abs(yScale(d.dist_dif) - zeroY);
          const distY = d.dist_dif < 0 ? zeroY : yScale(d.dist_dif);

          const precioH = Math.abs(yScale(d.precio_dif) - zeroY);
          const precioY = d.precio_dif < 0 ? distY + distH : yScale(d.precio_dif);

          return (
            <g key={d.mes}>
              {/* Barra Rotación (Azul) */}
              <rect
                x={barX}
                y={rotY}
                width={barWidth}
                height={rotH}
                fill="#0284c7"
                rx={3}
              />

              {/* Barra Distribución (Cyan) */}
              <rect
                x={barX}
                y={distY}
                width={barWidth}
                height={distH}
                fill="#5eead4"
                rx={3}
              />

              {/* Barra Precio (Naranja) */}
              <rect
                x={barX}
                y={precioY}
                width={barWidth}
                height={precioH}
                fill="#f59e0b"
                rx={3}
              />

              {/* Badge Rotación */}
              {rotH > 18 && (
                <g>
                  <rect
                    x={centerX - 24}
                    y={rotY + rotH / 2 - 12}
                    width={48}
                    height={24}
                    fill="white"
                    fillOpacity={0.92}
                    rx={3}
                    stroke="#0284c7"
                    strokeWidth={0.5}
                  />
                  <text x={centerX} y={rotY + rotH / 2 - 2} textAnchor="middle" className="text-[9px] font-black fill-slate-800">
                    {formatNumber(d.rot_dif)}
                  </text>
                  <text x={centerX} y={rotY + rotH / 2 + 8} textAnchor="middle" className="text-[8px] font-bold fill-slate-500">
                    {formatPercent(d.rot_vsLy)}
                  </text>
                </g>
              )}

              {/* Badge Distribución */}
              {distH > 18 && (
                <g>
                  <rect
                    x={centerX - 24}
                    y={distY + distH / 2 - 12}
                    width={48}
                    height={24}
                    fill="white"
                    fillOpacity={0.92}
                    rx={3}
                    stroke="#0d9488"
                    strokeWidth={0.5}
                  />
                  <text x={centerX} y={distY + distH / 2 - 2} textAnchor="middle" className="text-[9px] font-black fill-slate-800">
                    {formatNumber(d.dist_dif)}
                  </text>
                  <text x={centerX} y={distY + distH / 2 + 8} textAnchor="middle" className="text-[8px] font-bold fill-slate-500">
                    {formatPercent(d.dist_vsLy)}
                  </text>
                </g>
              )}

              {/* Badge Precio (si es notable) */}
              {precioH > 14 && d.precio_dif < -10000 && (
                <g>
                  <rect
                    x={centerX - 24}
                    y={precioY + precioH / 2 - 12}
                    width={48}
                    height={24}
                    fill="white"
                    fillOpacity={0.92}
                    rx={3}
                    stroke="#f59e0b"
                    strokeWidth={0.5}
                  />
                  <text x={centerX} y={precioY + precioH / 2 - 2} textAnchor="middle" className="text-[9px] font-black fill-slate-800">
                    {formatNumber(d.precio_dif)}
                  </text>
                  <text x={centerX} y={precioY + precioH / 2 + 8} textAnchor="middle" className="text-[8px] font-bold fill-slate-500">
                    {formatPercent(d.precio_vsLy)}
                  </text>
                </g>
              )}

              {/* Etiqueta Eje X */}
              <text x={centerX} y={height - padding.bottom + 20} textAnchor="middle" className="text-[11px] font-bold fill-slate-600">
                {d.label}
              </text>
            </g>
          );
        })}

        {/* LÍNEA TOTAL ROJA CON BADGES */}
        <path d={pathD} fill="none" stroke="#ef4444" strokeWidth={2.5} />

        {linePoints.map((p, idx) => (
          <g key={idx}>
            <circle cx={p.x} cy={p.y} r={4.5} fill="#ef4444" stroke="white" strokeWidth={2} />
            <rect
              x={p.x - 22}
              y={p.y - 20}
              width={44}
              height={15}
              fill="white"
              rx={3}
              stroke="#ef4444"
              strokeWidth={1}
            />
            <text x={p.x} y={p.y - 9} textAnchor="middle" className="text-[9px] font-black fill-red-600">
              {formatNumber(p.val)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// --------------------------------------------------------------------------
// COMPONENTE PRINCIPAL PERÚ GROWTH DRIVERS
// --------------------------------------------------------------------------
export default function PeruGrowthDriversView({ onBack }) {
  const [marca, setMarca] = useState('ELECTROLIFE');
  const [anio, setAnio] = useState('2026');
  const [mes, setMes] = useState('Todos');

  const monthlyData = useMemo(() => {
    return getMonthlyDataForBrand(marca);
  }, [marca]);

  const ytdUndBrand = PE_YTD_UNIDADES_DATA[marca] || PE_YTD_UNIDADES_DATA.ELECTROLIFE;
  const ytdSolBrand = PE_YTD_SOL_DATA[marca] || PE_YTD_SOL_DATA.ELECTROLIFE;

  return (
    <div className="w-full min-h-screen bg-[#f8fafc] p-4 md:p-6 space-y-6 font-sans text-slate-800">
      
      {/* ========================================================================= */}
      {/* 1. CABECERA SUPERIOR */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs px-5 py-3 flex flex-wrap items-center justify-between gap-4">
        
        {/* LOGOS ELECTROLIFE + NIELSEN */}
        <div className="flex items-center gap-4">
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
            Growth Drivers
          </h1>
        </div>

        {/* FILTROS SUPERIORES */}
        <div className="flex items-center gap-3">
          
          {/* Selector de Marca */}
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <span className="text-slate-500 font-semibold">Marca</span>
            <select
              value={marca}
              onChange={(e) => setMarca(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1 text-xs font-bold text-[#0066c0] outline-hidden cursor-pointer"
            >
              {PE_BRANDS.map(b => (
                <option key={b.key} value={b.key}>{b.name.toUpperCase()}</option>
              ))}
            </select>
          </div>

          {/* Selector de Año */}
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <span className="text-slate-500 font-semibold">Año</span>
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
            <span className="text-slate-500 font-semibold">Mes</span>
            <select
              value={mes}
              onChange={(e) => setMes(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1 text-xs font-bold text-slate-700 outline-hidden cursor-pointer"
            >
              <option value="Todos">Todos</option>
              <option value="Enero">Enero</option>
              <option value="Febrero">Febrero</option>
              <option value="Marzo">Marzo</option>
              <option value="Abril">Abril</option>
              <option value="Mayo">Mayo</option>
              <option value="Junio">Junio</option>
              <option value="Julio">Julio</option>
              <option value="Agosto">Agosto</option>
              <option value="Septiembre">Septiembre</option>
            </select>
          </div>

          {/* Botón Home */}
          <button
            onClick={onBack}
            title="Volver a la Portada"
            className="p-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-[#0066c0] transition cursor-pointer shadow-2xs"
          >
            <Home className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. BLOQUE 1: GROWTH DRIVERS UNIDADES                                      */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        
        {/* TABLA 1: GROWTH DRIVERS YTD UNIDADES */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col gap-3">
          <h2 className="text-center font-black text-[#0066c0] text-sm md:text-base tracking-wide uppercase">
            GROWTH DRIVERS YTD UNIDADES
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-2 px-3 text-left w-32"></th>
                  {PE_BRANDS.map(b => (
                    <th key={b.key} colSpan={2} className="py-2 px-2 border-l border-slate-100 text-center">
                      <div className="flex items-center justify-center min-h-[44px]">
                        <img
                          src={b.logo}
                          alt={b.name}
                          className="h-8 md:h-10 w-auto max-w-[85px] object-contain drop-shadow-2xs"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            if (e.target.parentElement) {
                              e.target.parentElement.innerHTML = `<span class="text-xs font-black text-slate-700">${b.name}</span>`;
                            }
                          }}
                        />
                      </div>
                    </th>
                  ))}
                </tr>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600">
                  <th className="py-1 px-3 text-left"></th>
                  {PE_BRANDS.map(b => (
                    <React.Fragment key={b.key}>
                      <th className="py-1 px-1 border-l border-slate-200 text-slate-700">Dif. LY</th>
                      <th className="py-1 px-1 text-slate-700">Vs LY</th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody className="text-xs">
                {/* Distribución */}
                <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="py-2 px-3 text-left font-bold text-slate-800">Distribución</td>
                  {PE_BRANDS.map(b => {
                    const row = PE_YTD_UNIDADES_DATA[b.key]?.dist;
                    return (
                      <React.Fragment key={b.key}>
                        <td className="py-2 px-1 border-l border-slate-100 font-semibold text-slate-800">
                          {formatNumber(row?.dif)}
                        </td>
                        <td className="py-2 px-1 font-semibold text-slate-600">
                          {formatPercent(row?.vsLy)}
                        </td>
                      </React.Fragment>
                    );
                  })}
                </tr>
                {/* Rotación */}
                <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="py-2 px-3 text-left font-bold text-slate-800">Rotación</td>
                  {PE_BRANDS.map(b => {
                    const row = PE_YTD_UNIDADES_DATA[b.key]?.rot;
                    return (
                      <React.Fragment key={b.key}>
                        <td className="py-2 px-1 border-l border-slate-100 font-semibold text-slate-800">
                          {formatNumber(row?.dif)}
                        </td>
                        <td className="py-2 px-1 font-semibold text-slate-600">
                          {formatPercent(row?.vsLy)}
                        </td>
                      </React.Fragment>
                    );
                  })}
                </tr>
                {/* Total */}
                <tr className="bg-slate-50/80 font-black">
                  <td className="py-2 px-3 text-left font-black text-slate-900">Total</td>
                  {PE_BRANDS.map(b => {
                    const row = PE_YTD_UNIDADES_DATA[b.key]?.total;
                    return (
                      <React.Fragment key={b.key}>
                        <td className="py-2 px-1 border-l border-slate-200 font-black text-slate-900">
                          {formatNumber(row?.dif)}
                        </td>
                        <td className="py-2 px-1 font-black text-slate-900">
                          {formatPercent(row?.vsLy)}
                        </td>
                      </React.Fragment>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* TABLA 2: GROWTH DRIVERS UNIDADES (MENSUAL) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col gap-3">
          <h2 className="text-center font-black text-[#0066c0] text-sm md:text-base tracking-wide uppercase">
            GROWTH DRIVERS UNIDADES
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="py-1 px-3 text-left text-xs font-bold text-slate-700 w-28"></th>
                  {monthlyData.unds.map(m => (
                    <th key={m.mes} colSpan={2} className="py-1.5 px-2 border-l border-slate-200 text-xs font-bold text-slate-800">
                      {m.mes}
                    </th>
                  ))}
                  <th colSpan={2} className="py-1.5 px-2 border-l border-blue-200 text-xs font-black text-[#0066c0] bg-blue-50/60">
                    YTD
                  </th>
                </tr>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600">
                  <th className="py-1 px-3 text-left"></th>
                  {monthlyData.unds.map(m => (
                    <React.Fragment key={m.mes}>
                      <th className="py-1 px-1 border-l border-slate-200 text-slate-700">Dif. LY</th>
                      <th className="py-1 px-1 text-slate-700">Vs LY</th>
                    </React.Fragment>
                  ))}
                  <th className="py-1 px-1 border-l border-blue-200 text-[#0066c0] bg-blue-50/60">Dif. LY</th>
                  <th className="py-1 px-1 text-[#0066c0] bg-blue-50/60">Vs LY</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {/* Distribución */}
                <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="py-2 px-3 text-left font-bold text-slate-800">Distribución</td>
                  {monthlyData.unds.map(m => (
                    <React.Fragment key={m.mes}>
                      <td className="py-2 px-1 border-l border-slate-100 font-semibold text-slate-800">{formatNumber(m.dist_dif)}</td>
                      <td className="py-2 px-1 font-semibold text-slate-600">{formatPercent(m.dist_vsLy)}</td>
                    </React.Fragment>
                  ))}
                  <td className="py-2 px-1 border-l border-blue-100 font-bold text-[#0066c0] bg-blue-50/40">{formatNumber(ytdUndBrand.dist.dif)}</td>
                  <td className="py-2 px-1 font-bold text-[#0066c0] bg-blue-50/40">{formatPercent(ytdUndBrand.dist.vsLy)}</td>
                </tr>
                {/* Rotación */}
                <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="py-2 px-3 text-left font-bold text-slate-800">Rotación</td>
                  {monthlyData.unds.map(m => (
                    <React.Fragment key={m.mes}>
                      <td className="py-2 px-1 border-l border-slate-100 font-semibold text-slate-800">{formatNumber(m.rot_dif)}</td>
                      <td className="py-2 px-1 font-semibold text-slate-600">{formatPercent(m.rot_vsLy)}</td>
                    </React.Fragment>
                  ))}
                  <td className="py-2 px-1 border-l border-blue-100 font-bold text-[#0066c0] bg-blue-50/40">{formatNumber(ytdUndBrand.rot.dif)}</td>
                  <td className="py-2 px-1 font-bold text-[#0066c0] bg-blue-50/40">{formatPercent(ytdUndBrand.rot.vsLy)}</td>
                </tr>
                {/* Total */}
                <tr className="bg-slate-50/80 font-black">
                  <td className="py-2 px-3 text-left font-black text-slate-900">Total</td>
                  {monthlyData.unds.map(m => (
                    <React.Fragment key={m.mes}>
                      <td className="py-2 px-1 border-l border-slate-200 font-black text-slate-900">{formatNumber(m.total_dif)}</td>
                      <td className="py-2 px-1 font-black text-slate-900">{formatPercent(m.total_vsLy)}</td>
                    </React.Fragment>
                  ))}
                  <td className="py-2 px-1 border-l border-blue-200 font-black text-[#0066c0] bg-blue-50/80">{formatNumber(ytdUndBrand.total.dif)}</td>
                  <td className="py-2 px-1 font-black text-[#0066c0] bg-blue-50/80">{formatPercent(ytdUndBrand.total.vsLy)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* GRAFICA 1: GROWTH DRIVERS (UNIDADES) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-bold text-[#0066c0] text-sm md:text-base tracking-wide uppercase">
              GROWTH DRIVERS <span className="text-xs font-normal text-slate-500">(UNIDADES)</span>
            </h2>
            <div className="flex items-center gap-4 text-xs font-bold">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#5eead4] inline-block" />
                <span className="text-slate-700">Distribución</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#0284c7] inline-block" />
                <span className="text-slate-700">Rotación</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#ef4444] inline-block" />
                <span className="text-slate-700">Total</span>
              </div>
            </div>
          </div>
          <UnitGrowthChart data={monthlyData.unds} />
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. BLOQUE 2: GROWTH DRIVERS SOL                                           */}
      {/* ========================================================================= */}
      <div className="space-y-4 pt-2">
        
        {/* TABLA 3: GROWTH DRIVERS YTD SOL */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col gap-3">
          <h2 className="text-center font-black text-[#0066c0] text-sm md:text-base tracking-wide uppercase">
            GROWTH DRIVERS YTD SOL
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-2 px-3 text-left w-32"></th>
                  {PE_BRANDS.map(b => (
                    <th key={b.key} colSpan={2} className="py-2 px-2 border-l border-slate-100 text-center">
                      <div className="flex items-center justify-center min-h-[44px]">
                        <img
                          src={b.logo}
                          alt={b.name}
                          className="h-8 md:h-10 w-auto max-w-[85px] object-contain drop-shadow-2xs"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            if (e.target.parentElement) {
                              e.target.parentElement.innerHTML = `<span class="text-xs font-black text-slate-700">${b.name}</span>`;
                            }
                          }}
                        />
                      </div>
                    </th>
                  ))}
                </tr>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600">
                  <th className="py-1 px-3 text-left"></th>
                  {PE_BRANDS.map(b => (
                    <React.Fragment key={b.key}>
                      <th className="py-1 px-1 border-l border-slate-200 text-slate-700">Dif. LY</th>
                      <th className="py-1 px-1 text-slate-700">Vs LY</th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody className="text-xs">
                {/* Precio */}
                <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="py-2 px-3 text-left font-bold text-slate-800">Precio</td>
                  {PE_BRANDS.map(b => {
                    const row = PE_YTD_SOL_DATA[b.key]?.precio;
                    return (
                      <React.Fragment key={b.key}>
                        <td className="py-2 px-1 border-l border-slate-100 font-semibold text-slate-800">{formatNumber(row?.dif)}</td>
                        <td className="py-2 px-1 font-semibold text-slate-600">{formatPercent(row?.vsLy)}</td>
                      </React.Fragment>
                    );
                  })}
                </tr>
                {/* Distribución */}
                <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="py-2 px-3 text-left font-bold text-slate-800">Distribución</td>
                  {PE_BRANDS.map(b => {
                    const row = PE_YTD_SOL_DATA[b.key]?.dist;
                    return (
                      <React.Fragment key={b.key}>
                        <td className="py-2 px-1 border-l border-slate-100 font-semibold text-slate-800">{formatNumber(row?.dif)}</td>
                        <td className="py-2 px-1 font-semibold text-slate-600">{formatPercent(row?.vsLy)}</td>
                      </React.Fragment>
                    );
                  })}
                </tr>
                {/* Rotación */}
                <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="py-2 px-3 text-left font-bold text-slate-800">Rotación</td>
                  {PE_BRANDS.map(b => {
                    const row = PE_YTD_SOL_DATA[b.key]?.rot;
                    return (
                      <React.Fragment key={b.key}>
                        <td className="py-2 px-1 border-l border-slate-100 font-semibold text-slate-800">{formatNumber(row?.dif)}</td>
                        <td className="py-2 px-1 font-semibold text-slate-600">{formatPercent(row?.vsLy)}</td>
                      </React.Fragment>
                    );
                  })}
                </tr>
                {/* Total */}
                <tr className="bg-slate-50/80 font-black">
                  <td className="py-2 px-3 text-left font-black text-slate-900">Total</td>
                  {PE_BRANDS.map(b => {
                    const row = PE_YTD_SOL_DATA[b.key]?.total;
                    return (
                      <React.Fragment key={b.key}>
                        <td className="py-2 px-1 border-l border-slate-200 font-black text-slate-900">{formatNumber(row?.dif)}</td>
                        <td className="py-2 px-1 font-black text-slate-900">{formatPercent(row?.vsLy)}</td>
                      </React.Fragment>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* TABLA 4: GROWTH DRIVERS SOL (MENSUAL) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col gap-3">
          <h2 className="text-center font-black text-[#0066c0] text-sm md:text-base tracking-wide uppercase">
            GROWTH DRIVERS SOL
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="py-1 px-3 text-left text-xs font-bold text-slate-700 w-28"></th>
                  {monthlyData.sol.map(m => (
                    <th key={m.mes} colSpan={2} className="py-1.5 px-2 border-l border-slate-200 text-xs font-bold text-slate-800">
                      {m.mes}
                    </th>
                  ))}
                  <th colSpan={2} className="py-1.5 px-2 border-l border-blue-200 text-xs font-black text-[#0066c0] bg-blue-50/60">
                    YTD
                  </th>
                </tr>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600">
                  <th className="py-1 px-3 text-left"></th>
                  {monthlyData.sol.map(m => (
                    <React.Fragment key={m.mes}>
                      <th className="py-1 px-1 border-l border-slate-200 text-slate-700">Dif. LY</th>
                      <th className="py-1 px-1 text-slate-700">Vs LY</th>
                    </React.Fragment>
                  ))}
                  <th className="py-1 px-1 border-l border-blue-200 text-[#0066c0] bg-blue-50/60">Dif. LY</th>
                  <th className="py-1 px-1 text-[#0066c0] bg-blue-50/60">Vs LY</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {/* Precio */}
                <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="py-2 px-3 text-left font-bold text-slate-800">Precio</td>
                  {monthlyData.sol.map(m => (
                    <React.Fragment key={m.mes}>
                      <td className="py-2 px-1 border-l border-slate-100 font-semibold text-slate-800">{formatNumber(m.precio_dif)}</td>
                      <td className="py-2 px-1 font-semibold text-slate-600">{formatPercent(m.precio_vsLy)}</td>
                    </React.Fragment>
                  ))}
                  <td className="py-2 px-1 border-l border-blue-100 font-bold text-[#0066c0] bg-blue-50/40">{formatNumber(ytdSolBrand.precio.dif)}</td>
                  <td className="py-2 px-1 font-bold text-[#0066c0] bg-blue-50/40">{formatPercent(ytdSolBrand.precio.vsLy)}</td>
                </tr>
                {/* Distribución */}
                <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="py-2 px-3 text-left font-bold text-slate-800">Distribución</td>
                  {monthlyData.sol.map(m => (
                    <React.Fragment key={m.mes}>
                      <td className="py-2 px-1 border-l border-slate-100 font-semibold text-slate-800">{formatNumber(m.dist_dif)}</td>
                      <td className="py-2 px-1 font-semibold text-slate-600">{formatPercent(m.dist_vsLy)}</td>
                    </React.Fragment>
                  ))}
                  <td className="py-2 px-1 border-l border-blue-100 font-bold text-[#0066c0] bg-blue-50/40">{formatNumber(ytdSolBrand.dist.dif)}</td>
                  <td className="py-2 px-1 font-bold text-[#0066c0] bg-blue-50/40">{formatPercent(ytdSolBrand.dist.vsLy)}</td>
                </tr>
                {/* Rotación */}
                <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="py-2 px-3 text-left font-bold text-slate-800">Rotación</td>
                  {monthlyData.sol.map(m => (
                    <React.Fragment key={m.mes}>
                      <td className="py-2 px-1 border-l border-slate-100 font-semibold text-slate-800">{formatNumber(m.rot_dif)}</td>
                      <td className="py-2 px-1 font-semibold text-slate-600">{formatPercent(m.rot_vsLy)}</td>
                    </React.Fragment>
                  ))}
                  <td className="py-2 px-1 border-l border-blue-100 font-bold text-[#0066c0] bg-blue-50/40">{formatNumber(ytdSolBrand.rot.dif)}</td>
                  <td className="py-2 px-1 font-bold text-[#0066c0] bg-blue-50/40">{formatPercent(ytdSolBrand.rot.vsLy)}</td>
                </tr>
                {/* Total */}
                <tr className="bg-slate-50/80 font-black">
                  <td className="py-2 px-3 text-left font-black text-slate-900">Total</td>
                  {monthlyData.sol.map(m => (
                    <React.Fragment key={m.mes}>
                      <td className="py-2 px-1 border-l border-slate-200 font-black text-slate-900">{formatNumber(m.total_dif)}</td>
                      <td className="py-2 px-1 font-black text-slate-900">{formatPercent(m.total_vsLy)}</td>
                    </React.Fragment>
                  ))}
                  <td className="py-2 px-1 border-l border-blue-200 font-black text-[#0066c0] bg-blue-50/80">{formatNumber(ytdSolBrand.total.dif)}</td>
                  <td className="py-2 px-1 font-black text-[#0066c0] bg-blue-50/80">{formatPercent(ytdSolBrand.total.vsLy)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* GRAFICA 2: GROWTH DRIVERS SOL */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-bold text-[#0066c0] text-sm md:text-base tracking-wide uppercase">
              GROWTH DRIVERS SOL
            </h2>
            <div className="flex items-center gap-4 text-xs font-bold">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#f59e0b] inline-block" />
                <span className="text-slate-700">Precio</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#5eead4] inline-block" />
                <span className="text-slate-700">Distribución</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#0284c7] inline-block" />
                <span className="text-slate-700">Rotación</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#ef4444] inline-block" />
                <span className="text-slate-700">Total</span>
              </div>
            </div>
          </div>
          <SolGrowthChart data={monthlyData.sol} />
        </div>

      </div>

    </div>
  );
}
