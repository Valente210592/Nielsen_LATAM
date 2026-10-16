import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Home, ChevronDown, Check, Search, Filter, Calendar, Store, MapPin, CheckSquare, Square } from 'lucide-react';

export const BRANDS = [
  { id: 'ELECTROLIT', name: 'Electrolit', logo: '/assets/competencia/Colombia/Electrolit.png', color: '#118DFF' },
  { id: 'GATORADE', name: 'Gatorade', logo: '/assets/competencia/Colombia/Gatorade.png', color: '#E66C37' },
  { id: 'PL', name: 'Private Label', logo: '/assets/competencia/Colombia/PL.png', color: '#4d7c0f' },
  { id: 'SPORADE', name: 'Sporade', logo: '/assets/competencia/Colombia/Sporade.png', color: '#3DB548' },
  { id: 'PEDIALYTE', name: 'Pedialyte', logo: '/assets/competencia/Colombia/Pedialyte.png', color: '#D64550' },
  { id: 'POWERADE', name: 'Powerade', logo: '/assets/competencia/Colombia/Powerade.png', color: '#744EC2' },
  { id: 'SQUASH', name: 'Squash', logo: '/assets/competencia/Colombia/Squash.png', color: '#DC2626' }
];

export const CHANNELS = ['TOTAL', 'Droguerias', 'Super Cadena', 'Superetes', 'Tradicional'];
export const REGIONS = ['TOTAL', 'ANTIOQUIA-CHOCO', 'ATLANTICO', 'CENTRO', 'CUNDI-BOY', 'EJE CAFETERO', 'LLANOS', 'PACIFICO', 'SANTANDERES'];
export const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return '-';
  return Math.round(num).toLocaleString('es-CO');
}

function formatPercent(num, decimals = 1) {
  if (num === null || num === undefined || isNaN(num)) return '-';
  return `${num.toFixed(decimals)}%`;
}

// --------------------------------------------------------------------------
// GRÁFICO 1: WATERFALL / BARRAS APILADAS UNIDADES CON DISTRIBUCIÓN INTELIGENTE
// --------------------------------------------------------------------------
const UnitGrowthChart = ({ monthlyData, brandName }) => {
  if (!monthlyData || monthlyData.length === 0) return null;

  const height = 340;
  const padding = { top: 40, right: 30, bottom: 45, left: 75 };
  const width = 1100;

  let minVal = 0;
  let maxVal = 0;

  monthlyData.forEach(d => {
    const pos = (d.distUnds > 0 ? d.distUnds : 0) + (d.rotUnds > 0 ? d.rotUnds : 0);
    const neg = (d.distUnds < 0 ? d.distUnds : 0) + (d.rotUnds < 0 ? d.rotUnds : 0);
    const tot = d.totalUnds || 0;
    if (pos > maxVal) maxVal = pos;
    if (tot > maxVal) maxVal = tot;
    if (neg < minVal) minVal = neg;
    if (tot < minVal) minVal = tot;
  });

  const range = Math.max(Math.abs(maxVal), Math.abs(minVal));
  const tickStep = range > 1000 ? 500 : range > 500 ? 250 : range > 200 ? 100 : 50;
  const yMax = Math.ceil((maxVal * 1.25) / tickStep) * tickStep || tickStep;
  const yMin = Math.floor((minVal * 1.25) / tickStep) * tickStep || -tickStep;

  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const yScale = (val) => padding.top + innerHeight - ((val - yMin) / (yMax - yMin)) * innerHeight;
  const zeroY = yScale(0);
  const colWidth = innerWidth / monthlyData.length;
  const barWidth = Math.min(54, colWidth * 0.65);

  const ticks = [];
  for (let t = yMax; t >= yMin; t -= tickStep) {
    ticks.push(t);
  }

  const linePoints = monthlyData.map((d, i) => {
    const x = padding.left + i * colWidth + colWidth / 2;
    const y = yScale(d.totalUnds || 0);
    return { x, y, val: d.totalUnds || 0, d };
  });

  const pathD = linePoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-xs sm:text-sm font-black text-[#00529B] uppercase tracking-wide">
          Growth Drivers Unidades ({brandName})
        </h3>
        <div className="flex items-center gap-4 text-xs font-bold text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#7bc5d4]" />
            <span>Distribución</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#2c6ea6]" />
            <span>Rotación</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#d9383a]" />
            <span>Total</span>
          </div>
        </div>
      </div>

      <div className="w-full overflow-x-auto hada-scrollbar">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[780px] font-sans select-none">
          {/* LÍNEAS GUÍA HORIZONTALES */}
          {ticks.map(tick => {
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
                  className={`text-[10.5px] font-bold ${isZero ? 'fill-sky-600 font-black' : 'fill-slate-400'}`}
                >
                  {tick === 0 ? '0' : `${Math.round(tick).toLocaleString('es-CO')} k`}
                </text>
              </g>
            );
          })}

          {/* BARRAS MENSUALES APILADAS */}
          {monthlyData.map((d, i) => {
            const centerX = padding.left + i * colWidth + colWidth / 2;
            const barX = centerX - barWidth / 2;

            const distVal = d.distUnds || 0;
            const rotVal = d.rotUnds || 0;

            const distH = Math.abs(yScale(distVal) - zeroY);
            const distY = distVal < 0 ? zeroY : yScale(distVal);

            const rotH = Math.abs(yScale(rotVal) - zeroY);
            const rotY = rotVal < 0 ? zeroY : yScale(rotVal);

            // Evitar colisión de badges: calcular posiciones verticales separadas
            return (
              <g key={d.mesNum}>
                {/* Segmento Rotación */}
                {rotH > 0 && (
                  <rect
                    x={barX}
                    y={rotY}
                    width={barWidth}
                    height={Math.max(2, rotH)}
                    fill="#2c6ea6"
                    rx={2.5}
                  />
                )}

                {/* Segmento Distribución */}
                {distH > 0 && (
                  <rect
                    x={barX}
                    y={distY}
                    width={barWidth}
                    height={Math.max(2, distH)}
                    fill="#7bc5d4"
                    rx={2.5}
                  />
                )}

                {/* Badge Rotación */}
                {rotH >= 24 && (
                  <g>
                    <rect
                      x={centerX - 24}
                      y={rotY + rotH / 2 - 12}
                      width={48}
                      height={24}
                      fill="white"
                      fillOpacity={0.96}
                      rx={3}
                      stroke="#2c6ea6"
                      strokeWidth={0.8}
                    />
                    <text x={centerX} y={rotY + rotH / 2 - 2} textAnchor="middle" className="text-[9px] font-black fill-slate-800">
                      {formatNumber(rotVal)}
                    </text>
                    <text x={centerX} y={rotY + rotH / 2 + 8} textAnchor="middle" className="text-[8px] font-bold fill-slate-500">
                      {formatPercent(d.rotUndsPct, 1)}
                    </text>
                  </g>
                )}

                {/* Badge Distribución */}
                {distH >= 24 && (
                  <g>
                    <rect
                      x={centerX - 24}
                      y={distY + distH / 2 - 12}
                      width={48}
                      height={24}
                      fill="white"
                      fillOpacity={0.96}
                      rx={3}
                      stroke="#0284c7"
                      strokeWidth={0.8}
                    />
                    <text x={centerX} y={distY + distH / 2 - 2} textAnchor="middle" className="text-[9px] font-black fill-slate-800">
                      {formatNumber(distVal)}
                    </text>
                    <text x={centerX} y={distY + distH / 2 + 8} textAnchor="middle" className="text-[8px] font-bold fill-slate-500">
                      {formatPercent(d.distUndsPct, 1)}
                    </text>
                  </g>
                )}

                {/* Etiqueta Eje X */}
                <text x={centerX} y={height - padding.bottom + 22} textAnchor="middle" className="text-[11px] font-bold fill-slate-600">
                  {d.mesCode}
                </text>
              </g>
            );
          })}

          {/* LÍNEA TOTAL ROJA CON PUNTOS Y ETIQUETAS INTELIGENTES */}
          <path d={pathD} fill="none" stroke="#d9383a" strokeWidth={2.4} strokeDasharray="4 3" />

          {linePoints.map((p, idx) => {
            const isNearZero = Math.abs(p.y - zeroY) < 25;
            const badgeY = p.val >= 0 ? p.y - 20 : p.y + 8;

            return (
              <g key={idx}>
                <circle cx={p.x} cy={p.y} r={4.5} fill="#d9383a" stroke="white" strokeWidth={2} />
                <rect
                  x={p.x - 22}
                  y={badgeY}
                  width={44}
                  height={15}
                  fill="white"
                  fillOpacity={0.98}
                  rx={3}
                  stroke="#d9383a"
                  strokeWidth={1}
                />
                <text x={p.x} y={badgeY + 11} textAnchor="middle" className="text-[9px] font-black fill-[#d9383a]">
                  {formatNumber(p.val)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

// --------------------------------------------------------------------------
// GRÁFICO 2: WATERFALL / BARRAS APILADAS COP CON DISTRIBUCIÓN INTELIGENTE
// --------------------------------------------------------------------------
const CopGrowthChart = ({ monthlyData, brandName }) => {
  if (!monthlyData || monthlyData.length === 0) return null;

  const height = 340;
  const padding = { top: 40, right: 30, bottom: 45, left: 80 };
  const width = 1100;

  let minVal = 0;
  let maxVal = 0;

  monthlyData.forEach(d => {
    const pos = (d.precioVal > 0 ? d.precioVal : 0) + (d.distVal > 0 ? d.distVal : 0) + (d.rotVal > 0 ? d.rotVal : 0);
    const neg = (d.precioVal < 0 ? d.precioVal : 0) + (d.distVal < 0 ? d.distVal : 0) + (d.rotVal < 0 ? d.rotVal : 0);
    const tot = d.totalVal || 0;
    if (pos > maxVal) maxVal = pos;
    if (tot > maxVal) maxVal = tot;
    if (neg < minVal) minVal = neg;
    if (tot < minVal) minVal = tot;
  });

  const range = Math.max(Math.abs(maxVal), Math.abs(minVal));
  const tickStep = range > 4e6 ? 2e6 : range > 2e6 ? 1e6 : range > 1e6 ? 5e5 : 25e4;
  const yMax = Math.ceil((maxVal * 1.25) / tickStep) * tickStep || tickStep;
  const yMin = Math.floor((minVal * 1.25) / tickStep) * tickStep || -tickStep;

  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const yScale = (val) => padding.top + innerHeight - ((val - yMin) / (yMax - yMin)) * innerHeight;
  const zeroY = yScale(0);
  const colWidth = innerWidth / monthlyData.length;
  const barWidth = Math.min(54, colWidth * 0.65);

  const ticks = [];
  for (let t = yMax; t >= yMin; t -= tickStep) {
    ticks.push(t);
  }

  const linePoints = monthlyData.map((d, i) => {
    const x = padding.left + i * colWidth + colWidth / 2;
    const y = yScale(d.totalVal || 0);
    return { x, y, val: d.totalVal || 0, d };
  });

  const pathD = linePoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-xs sm:text-sm font-black text-[#00529B] uppercase tracking-wide">
          Growth Drivers COP ({brandName})
        </h3>
        <div className="flex items-center gap-4 text-xs font-bold text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#ea580c]" />
            <span>Precio</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#7bc5d4]" />
            <span>Distribución</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#2c6ea6]" />
            <span>Rotación</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#d9383a]" />
            <span>Total</span>
          </div>
        </div>
      </div>

      <div className="w-full overflow-x-auto hada-scrollbar">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[780px] font-sans select-none">
          {/* LÍNEAS GUÍA HORIZONTALES */}
          {ticks.map(tick => {
            const y = yScale(tick);
            const isZero = tick === 0;
            const absTick = Math.abs(tick);
            const labelStr = absTick >= 1e6 ? `${(tick / 1e6).toFixed(1).replace('.0', '')} mill.` : `${Math.round(tick / 1e3)} k`;

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
                  className={`text-[10.5px] font-bold ${isZero ? 'fill-sky-600 font-black' : 'fill-slate-400'}`}
                >
                  {tick === 0 ? '0' : labelStr}
                </text>
              </g>
            );
          })}

          {/* BARRAS MENSUALES APILADAS */}
          {monthlyData.map((d, i) => {
            const centerX = padding.left + i * colWidth + colWidth / 2;
            const barX = centerX - barWidth / 2;

            const precioVal = d.precioVal || 0;
            const distVal = d.distVal || 0;
            const rotVal = d.rotVal || 0;

            const precioH = Math.abs(yScale(precioVal) - zeroY);
            const precioY = precioVal < 0 ? zeroY : yScale(precioVal);

            const distH = Math.abs(yScale(distVal) - zeroY);
            const distY = distVal < 0 ? zeroY : yScale(distVal);

            const rotH = Math.abs(yScale(rotVal) - zeroY);
            const rotY = rotVal < 0 ? zeroY : yScale(rotVal);

            return (
              <g key={d.mesNum}>
                {/* Segmento Precio */}
                {precioH > 0 && (
                  <rect
                    x={barX}
                    y={precioY}
                    width={barWidth}
                    height={Math.max(2, precioH)}
                    fill="#ea580c"
                    rx={2.5}
                  />
                )}

                {/* Segmento Distribución */}
                {distH > 0 && (
                  <rect
                    x={barX}
                    y={distY}
                    width={barWidth}
                    height={Math.max(2, distH)}
                    fill="#7bc5d4"
                    rx={2.5}
                  />
                )}

                {/* Segmento Rotación */}
                {rotH > 0 && (
                  <rect
                    x={barX}
                    y={rotY}
                    width={barWidth}
                    height={Math.max(2, rotH)}
                    fill="#2c6ea6"
                    rx={2.5}
                  />
                )}

                {/* Badge Precio */}
                {precioH >= 24 && (
                  <g>
                    <rect
                      x={centerX - 24}
                      y={precioY + precioH / 2 - 12}
                      width={48}
                      height={24}
                      fill="white"
                      fillOpacity={0.96}
                      rx={3}
                      stroke="#ea580c"
                      strokeWidth={0.8}
                    />
                    <text x={centerX} y={precioY + precioH / 2 - 2} textAnchor="middle" className="text-[9px] font-black fill-slate-800">
                      {Math.round(precioVal / 1e3).toLocaleString('es-CO')} k
                    </text>
                    <text x={centerX} y={precioY + precioH / 2 + 8} textAnchor="middle" className="text-[8px] font-bold fill-slate-500">
                      {formatPercent(d.precioValPct, 1)}
                    </text>
                  </g>
                )}

                {/* Badge Distribución */}
                {distH >= 24 && (
                  <g>
                    <rect
                      x={centerX - 24}
                      y={distY + distH / 2 - 12}
                      width={48}
                      height={24}
                      fill="white"
                      fillOpacity={0.96}
                      rx={3}
                      stroke="#0284c7"
                      strokeWidth={0.8}
                    />
                    <text x={centerX} y={distY + distH / 2 - 2} textAnchor="middle" className="text-[9px] font-black fill-slate-800">
                      {Math.round(distVal / 1e3).toLocaleString('es-CO')} k
                    </text>
                    <text x={centerX} y={distY + distH / 2 + 8} textAnchor="middle" className="text-[8px] font-bold fill-slate-500">
                      {formatPercent(d.distValPct, 1)}
                    </text>
                  </g>
                )}

                {/* Badge Rotación */}
                {rotH >= 24 && (
                  <g>
                    <rect
                      x={centerX - 24}
                      y={rotY + rotH / 2 - 12}
                      width={48}
                      height={24}
                      fill="white"
                      fillOpacity={0.96}
                      rx={3}
                      stroke="#2c6ea6"
                      strokeWidth={0.8}
                    />
                    <text x={centerX} y={rotY + rotH / 2 - 2} textAnchor="middle" className="text-[9px] font-black fill-slate-800">
                      {Math.round(rotVal / 1e3).toLocaleString('es-CO')} k
                    </text>
                    <text x={centerX} y={rotY + rotH / 2 + 8} textAnchor="middle" className="text-[8px] font-bold fill-slate-500">
                      {formatPercent(d.rotValPct, 1)}
                    </text>
                  </g>
                )}

                {/* Etiqueta Eje X */}
                <text x={centerX} y={height - padding.bottom + 22} textAnchor="middle" className="text-[11px] font-bold fill-slate-600">
                  {d.mesCode}
                </text>
              </g>
            );
          })}

          {/* LÍNEA TOTAL ROJA CON PUNTOS Y ETIQUETAS INTELIGENTES */}
          <path d={pathD} fill="none" stroke="#d9383a" strokeWidth={2.4} strokeDasharray="4 3" />

          {linePoints.map((p, idx) => {
            const badgeY = p.val >= 0 ? p.y - 20 : p.y + 8;

            return (
              <g key={idx}>
                <circle cx={p.x} cy={p.y} r={4.5} fill="#d9383a" stroke="white" strokeWidth={2} />
                <rect
                  x={p.x - 24}
                  y={badgeY}
                  width={48}
                  height={15}
                  fill="white"
                  fillOpacity={0.98}
                  rx={3}
                  stroke="#d9383a"
                  strokeWidth={1}
                />
                <text x={p.x} y={badgeY + 11} textAnchor="middle" className="text-[9px] font-black fill-[#d9383a]">
                  {Math.round(p.val / 1e3).toLocaleString('es-CO')} k
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

// --------------------------------------------------------------------------
// VISTA PRINCIPAL GROWTH DRIVERS COLOMBIA
// --------------------------------------------------------------------------
const ColombiaGrowthDriversView = ({ onBackToPortada }) => {
  const [data, setData] = useState({ regionChannelBrandRows: [] });
  const [loading, setLoading] = useState(true);

  const [selectedBrand, setSelectedBrand] = useState('ELECTROLIT');
  const [brandSearch, setBrandSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonths, setSelectedMonths] = useState([1, 2, 3, 4, 5, 6, 7, 8]);
  const [selectedChannel, setSelectedChannel] = useState('TOTAL');
  const [selectedRegion, setSelectedRegion] = useState('TOTAL');

  // Dropdowns
  const [brandOpen, setBrandOpen] = useState(false);
  const [yearOpen, setYearOpen] = useState(false);
  const [monthOpen, setMonthOpen] = useState(false);
  const [channelOpen, setChannelOpen] = useState(false);
  const [regionOpen, setRegionOpen] = useState(false);

  const brandRef = useRef(null);
  const yearRef = useRef(null);
  const monthRef = useRef(null);
  const channelRef = useRef(null);
  const regionRef = useRef(null);

  useEffect(() => {
    fetch('/api/nielsen/co/brand-channels')
      .then(res => res.json())
      .then(payload => {
        setData(payload);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error cargando brand-channels:', err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (brandRef.current && !brandRef.current.contains(e.target)) setBrandOpen(false);
      if (yearRef.current && !yearRef.current.contains(e.target)) setYearOpen(false);
      if (monthRef.current && !monthRef.current.contains(e.target)) setMonthOpen(false);
      if (channelRef.current && !channelRef.current.contains(e.target)) setChannelOpen(false);
      if (regionRef.current && !regionRef.current.contains(e.target)) setRegionOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const availableBrands = useMemo(() => {
    const list = BRANDS.map(b => b.id);
    if (!brandSearch) return list;
    return list.filter(b => b.toLowerCase().includes(brandSearch.toLowerCase()));
  }, [brandSearch]);

  const maxAvailableMonths = selectedYear === 2026 ? 8 : 12;

  const handleYearChange = (yr) => {
    setSelectedYear(yr);
    setYearOpen(false);
    const mCount = yr === 2026 ? 8 : 12;
    setSelectedMonths(Array.from({ length: mCount }, (_, i) => i + 1));
  };

  const toggleMonth = (mNum) => {
    if (selectedMonths.includes(mNum)) {
      if (selectedMonths.length > 1) {
        setSelectedMonths(selectedMonths.filter(m => m !== mNum).sort((a, b) => a - b));
      }
    } else {
      setSelectedMonths([...selectedMonths, mNum].sort((a, b) => a - b));
    }
  };

  const selectAllMonths = () => {
    setSelectedMonths(Array.from({ length: maxAvailableMonths }, (_, i) => i + 1));
  };

  const monthSummary = useMemo(() => {
    if (selectedMonths.length === maxAvailableMonths) return 'Todos';
    if (selectedMonths.length === 1) return MONTHS_SHORT[selectedMonths[0] - 1];
    return `${selectedMonths.length} meses`;
  }, [selectedMonths, maxAvailableMonths]);

  // CÁLCULO CENTRAL DE GROWTH DRIVERS
  const calculatedDrivers = useMemo(() => {
    const rows = data.regionChannelBrandRows || [];
    if (rows.length === 0) return null;

    let baseRows = rows.filter(r => ['Droguerias', 'Super Cadena', 'Superetes', 'Tradicional'].includes(r.canal));
    if (selectedChannel !== 'TOTAL') baseRows = baseRows.filter(r => r.canal === selectedChannel);
    if (selectedRegion !== 'TOTAL') baseRows = baseRows.filter(r => r.region === selectedRegion);

    const prevYear = selectedYear - 1;

    const calcForBrand = (brandId) => {
      const monthly = [];
      let sumDistUnds = 0, sumRotUnds = 0, sumTotalUnds = 0, sumUndsLY = 0;
      let sumPrecioVal = 0, sumDistVal = 0, sumRotVal = 0, sumTotalVal = 0, sumValLY = 0;

      selectedMonths.forEach(mNum => {
        const curRows = baseRows.filter(r => r.anio === selectedYear && r.mesNum === mNum && r.marca === brandId);
        const lyRows = baseRows.filter(r => r.anio === prevYear && r.mesNum === mNum && r.marca === brandId);

        const vtasUndsTY = curRows.reduce((a, r) => a + (r.unds_k || 0) * 1000, 0);
        const vtasUndsLY = lyRows.reduce((a, r) => a + (r.unds_k || 0) * 1000, 0);

        const vtasValTY = curRows.reduce((a, r) => a + (r.val_m || 0) * 1000000, 0);
        const vtasValLY = lyRows.reduce((a, r) => a + (r.val_m || 0) * 1000000, 0);

        const tiendasTY = curRows.reduce((a, r) => a + (r.tiendas_venden || 0), 0);
        const tiendasLY = lyRows.reduce((a, r) => a + (r.tiendas_venden || 0), 0);

        const precioTY = vtasUndsTY > 0 ? vtasValTY / vtasUndsTY : 0;
        const precioLY = vtasUndsLY > 0 ? vtasValLY / vtasUndsLY : 0;

        const rotTY = tiendasTY > 0 ? vtasUndsTY / tiendasTY : 0;
        const rotLY = tiendasLY > 0 ? vtasUndsLY / tiendasLY : 0;

        // Fórmulas Nielsen Growth Drivers
        const distUnds = tiendasLY > 0 ? (tiendasTY - tiendasLY) * rotLY : 0;
        const rotUnds = tiendasTY > 0 ? (rotTY - rotLY) * tiendasTY : 0;
        const totalUnds = vtasUndsTY - vtasUndsLY;

        const distUndsPct = vtasUndsLY > 0 ? (distUnds / vtasUndsLY) * 100 : 0;
        const rotUndsPct = vtasUndsLY > 0 ? (rotUnds / vtasUndsLY) * 100 : 0;
        const totalUndsPct = vtasUndsLY > 0 ? (totalUnds / vtasUndsLY) * 100 : 0;

        // En Valores (miles de COP)
        const precioVal = (precioTY - precioLY) * vtasUndsTY;
        const distVal = distUnds * precioLY;
        const rotVal = rotUnds * precioLY;
        const totalVal = vtasValTY - vtasValLY;

        const precioValPct = vtasValLY > 0 ? (precioVal / vtasValLY) * 100 : 0;
        const distValPct = vtasValLY > 0 ? (distVal / vtasValLY) * 100 : 0;
        const rotValPct = vtasValLY > 0 ? (rotVal / vtasValLY) * 100 : 0;
        const totalValPct = vtasValLY > 0 ? (totalVal / vtasValLY) * 100 : 0;

        sumDistUnds += distUnds;
        sumRotUnds += rotUnds;
        sumTotalUnds += totalUnds;
        sumUndsLY += vtasUndsLY;

        sumPrecioVal += precioVal;
        sumDistVal += distVal;
        sumRotVal += rotVal;
        sumTotalVal += totalVal;
        sumValLY += vtasValLY;

        monthly.push({
          mesNum: mNum,
          mesLabel: MONTHS_SHORT[mNum - 1],
          mesCode: `${MONTHS_SHORT[mNum - 1]}-${String(selectedYear).slice(-2)}`,
          distUnds: distUnds / 1000,
          distUndsPct,
          rotUnds: rotUnds / 1000,
          rotUndsPct,
          totalUnds: totalUnds / 1000,
          totalUndsPct,
          precioVal,
          precioValPct,
          distVal,
          distValPct,
          rotVal,
          rotValPct,
          totalVal,
          totalValPct
        });
      });

      const ytd = {
        distUnds: sumDistUnds / 1000,
        distUndsPct: sumUndsLY > 0 ? (sumDistUnds / sumUndsLY) * 100 : 0,
        rotUnds: sumRotUnds / 1000,
        rotUndsPct: sumUndsLY > 0 ? (sumRotUnds / sumUndsLY) * 100 : 0,
        totalUnds: sumTotalUnds / 1000,
        totalUndsPct: sumUndsLY > 0 ? (sumTotalUnds / sumUndsLY) * 100 : 0,
        precioVal: sumPrecioVal,
        precioValPct: sumValLY > 0 ? (sumPrecioVal / sumValLY) * 100 : 0,
        distVal: sumDistVal,
        distValPct: sumValLY > 0 ? (sumDistVal / sumValLY) * 100 : 0,
        rotVal: sumRotVal,
        rotValPct: sumValLY > 0 ? (sumRotVal / sumValLY) * 100 : 0,
        totalVal: sumTotalVal,
        totalValPct: sumValLY > 0 ? (sumTotalVal / sumValLY) * 100 : 0
      };

      return { monthly, ytd };
    };

    const brandsYtd = {};
    BRANDS.forEach(b => {
      brandsYtd[b.id] = calcForBrand(b.id).ytd;
    });

    const selectedBrandData = calcForBrand(selectedBrand);

    return { brandsYtd, selectedBrandData };
  }, [data, selectedBrand, selectedYear, selectedMonths, selectedChannel, selectedRegion]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center font-sans">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl border border-slate-200">
          <div className="w-12 h-12 border-4 border-[#00529B] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-bold text-slate-700">Cargando Growth Drivers Colombia...</p>
        </div>
      </div>
    );
  }

  const { brandsYtd, selectedBrandData } = calculatedDrivers || { brandsYtd: {}, selectedBrandData: { monthly: [], ytd: {} } };

  return (
    <div className="min-h-screen bg-[#f4f7fb] flex flex-col font-sans select-none pb-12">
      {/* HEADER CON CONTROLES */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-2xs px-4 sm:px-6 py-2.5">
        <div className="max-w-[1550px] mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <img src="/assets/LOGOS/Electrolit-color.png" alt="Electrolit" className="h-8 sm:h-9 object-contain" />
            <span className="text-xl font-light text-slate-400">✕</span>
            <img src="/assets/LOGOS/Nielsen-logo.png" alt="Nielsen" className="h-6 sm:h-7 object-contain" />
          </div>

          <div className="text-center flex-1 min-w-[200px]">
            <h1 className="text-xl sm:text-2xl font-black text-[#00529B] tracking-tight">
              Growth Drivers
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            {/* Selector de Marca */}
            <div className="relative" ref={brandRef}>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 ml-1">Marca</div>
              <button
                onClick={() => { setBrandOpen(!brandOpen); setYearOpen(false); setMonthOpen(false); setChannelOpen(false); setRegionOpen(false); }}
                className="flex items-center justify-between gap-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-[#00529B] min-w-[130px] shadow-2xs hover:border-[#00529B] transition-all cursor-pointer"
              >
                <span className="truncate">{selectedBrand}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#00529B] shrink-0" />
              </button>
              {brandOpen && (
                <div className="absolute right-0 top-14 bg-white border border-slate-200 shadow-xl rounded-2xl p-2 w-52 z-50 animate-in fade-in">
                  <div className="relative mb-2">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Buscar marca..."
                      value={brandSearch}
                      onChange={e => setBrandSearch(e.target.value)}
                      className="w-full pl-8 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#00529B]"
                    />
                  </div>
                  <div className="max-h-56 overflow-y-auto space-y-0.5">
                    {availableBrands.map(b => (
                      <button
                        key={b}
                        onClick={() => { setSelectedBrand(b); setBrandOpen(false); setBrandSearch(''); }}
                        className={`w-full text-left px-2.5 py-1.5 text-xs font-bold rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                          selectedBrand === b ? 'bg-[#00529B] text-white' : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="truncate">{b}</span>
                        {selectedBrand === b && <Check className="w-3.5 h-3.5 text-white shrink-0 ml-1.5" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Selector de Año */}
            <div className="relative" ref={yearRef}>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 ml-1">Año</div>
              <button
                onClick={() => { setYearOpen(!yearOpen); setBrandOpen(false); setMonthOpen(false); setChannelOpen(false); setRegionOpen(false); }}
                className="flex items-center justify-between gap-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-[#00529B] min-w-[75px] shadow-2xs hover:border-[#00529B] transition-all cursor-pointer"
              >
                <span>{selectedYear}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#00529B]" />
              </button>
              {yearOpen && (
                <div className="absolute right-0 top-14 bg-white border border-slate-200 shadow-xl rounded-xl p-1.5 w-28 z-50 animate-in fade-in">
                  {[2024, 2025, 2026].map(yr => (
                    <button
                      key={yr}
                      onClick={() => handleYearChange(yr)}
                      className={`w-full text-left px-2.5 py-1.5 text-xs font-bold rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                        selectedYear === yr ? 'bg-[#00529B] text-white' : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>{yr}</span>
                      {selectedYear === yr && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selector de Meses */}
            <div className="relative" ref={monthRef}>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 ml-1">Mes</div>
              <button
                onClick={() => { setMonthOpen(!monthOpen); setBrandOpen(false); setYearOpen(false); setChannelOpen(false); setRegionOpen(false); }}
                className="flex items-center justify-between gap-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-[#00529B] min-w-[90px] shadow-2xs hover:border-[#00529B] transition-all cursor-pointer"
              >
                <span className="truncate max-w-[75px]">{monthSummary}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#00529B]" />
              </button>
              {monthOpen && (
                <div className="absolute right-0 top-14 bg-white border border-slate-200 shadow-xl rounded-2xl p-2.5 w-52 z-50 animate-in fade-in">
                  <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100 text-[11px]">
                    <span className="font-bold text-slate-700">Filtrar Meses</span>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <button onClick={selectAllMonths} className="text-[#00529B] hover:underline font-bold cursor-pointer">
                        Todos
                      </button>
                      <span className="text-slate-300 font-normal">|</span>
                      <button onClick={() => setSelectedMonths([])} className="text-slate-500 hover:text-red-600 hover:underline font-bold cursor-pointer">
                        Limpiar
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 max-h-52 overflow-y-auto pt-0.5">
                    {Array.from({ length: maxAvailableMonths }, (_, i) => i + 1).map(mNum => {
                      const isChecked = selectedMonths.includes(mNum);
                      return (
                        <button
                          key={mNum}
                          onClick={() => toggleMonth(mNum)}
                          className={`flex items-center gap-2 px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors text-left cursor-pointer ${
                            isChecked ? 'bg-blue-50/90 text-[#00529B]' : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {isChecked ? (
                            <CheckSquare className="w-3.5 h-3.5 text-[#00529B] shrink-0" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          )}
                          <span>{MONTHS_SHORT[mNum - 1]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Selector de Canal */}
            <div className="relative" ref={channelRef}>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 ml-1">Canal</div>
              <button
                onClick={() => { setChannelOpen(!channelOpen); setBrandOpen(false); setYearOpen(false); setMonthOpen(false); setRegionOpen(false); }}
                className="flex items-center justify-between gap-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-[#00529B] min-w-[100px] shadow-2xs hover:border-[#00529B] transition-all cursor-pointer"
              >
                <span>{selectedChannel}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#00529B]" />
              </button>
              {channelOpen && (
                <div className="absolute right-0 top-14 bg-white border border-slate-200 shadow-xl rounded-xl p-1.5 w-40 z-50 animate-in fade-in">
                  {CHANNELS.map(ch => (
                    <button
                      key={ch}
                      onClick={() => { setSelectedChannel(ch); setChannelOpen(false); }}
                      className={`w-full text-left px-2.5 py-1.5 text-xs font-bold rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                        selectedChannel === ch ? 'bg-[#00529B] text-white' : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>{ch}</span>
                      {selectedChannel === ch && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selector de Región */}
            <div className="relative" ref={regionRef}>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 ml-1">Región</div>
              <button
                onClick={() => { setRegionOpen(!regionOpen); setBrandOpen(false); setYearOpen(false); setMonthOpen(false); setChannelOpen(false); }}
                className="flex items-center justify-between gap-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-[#00529B] min-w-[110px] shadow-2xs hover:border-[#00529B] transition-all cursor-pointer"
              >
                <span className="truncate max-w-[85px]">{selectedRegion}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#00529B]" />
              </button>
              {regionOpen && (
                <div className="absolute right-0 top-14 bg-white border border-slate-200 shadow-xl rounded-xl p-1.5 w-48 z-50 animate-in fade-in max-h-60 overflow-y-auto">
                  {REGIONS.map(reg => (
                    <button
                      key={reg}
                      onClick={() => { setSelectedRegion(reg); setRegionOpen(false); }}
                      className={`w-full text-left px-2.5 py-1.5 text-xs font-bold rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                        selectedRegion === reg ? 'bg-[#00529B] text-white' : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>{reg}</span>
                      {selectedRegion === reg && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Botón Home */}
            <div className="pt-3">
              <button
                onClick={onBackToPortada}
                title="Regresar a Portada de Colombia"
                className="p-2 text-[#00529B] hover:bg-blue-50 border border-slate-200 hover:border-[#00529B] rounded-xl transition-all cursor-pointer shadow-2xs group"
              >
                <Home className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-[1550px] w-full mx-auto p-4 sm:p-6 space-y-8 flex-1">
        {/* ======================================================== */}
        {/* SECCIÓN 1: UNIDADES */}
        {/* ======================================================== */}
        <section className="bg-white rounded-2xl border border-blue-200 shadow-xs p-4 sm:p-6 space-y-6">
          {/* TABLA YTD UNIDADES */}
          <div className="space-y-2">
            <h2 className="text-center text-sm sm:text-base font-black text-[#00529B] uppercase tracking-wide">
              Growth Drivers YTD Unidades
            </h2>
            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-white border-b border-slate-200">
                    <th className="p-2 w-32 border-r border-slate-200 bg-white" />
                    {BRANDS.map(brand => (
                      <th key={brand.id} colSpan={2} className="p-2 text-center border-r border-slate-200 last:border-r-0 bg-white">
                        <div className="flex items-center justify-center h-12 w-full px-1">
                          <img
                            src={brand.logo}
                            alt={brand.name}
                            className="h-10 sm:h-12 w-auto max-w-[105px] object-contain mix-blend-multiply drop-shadow-2xs transition-transform hover:scale-105"
                          />
                        </div>
                      </th>
                    ))}
                  </tr>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-bold text-slate-600">
                    <th className="p-1.5 border-r border-slate-200" />
                    {BRANDS.map(brand => (
                      <React.Fragment key={brand.id}>
                        <th className="p-1 text-center font-bold text-slate-700 w-16">Dif. LY</th>
                        <th className="p-1 text-center font-bold text-slate-700 w-16 border-r border-slate-200 last:border-r-0">Vs LY</th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-semibold">
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-2 bg-[#d8ecf8] text-[#003876] font-bold border-r border-slate-200">Distribución</td>
                    {BRANDS.map(brand => {
                      const bData = brandsYtd[brand.id] || {};
                      return (
                        <React.Fragment key={brand.id}>
                          <td className="p-1.5 text-center text-slate-900">{formatNumber(bData.distUnds)}</td>
                          <td className="p-1.5 text-center text-slate-900 border-r border-slate-200 last:border-r-0">{formatPercent(bData.distUndsPct, 1)}</td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-2 bg-[#d8ecf8] text-[#003876] font-bold border-r border-slate-200">Rotación</td>
                    {BRANDS.map(brand => {
                      const bData = brandsYtd[brand.id] || {};
                      return (
                        <React.Fragment key={brand.id}>
                          <td className="p-1.5 text-center text-slate-900">{formatNumber(bData.rotUnds)}</td>
                          <td className="p-1.5 text-center text-slate-900 border-r border-slate-200 last:border-r-0">{formatPercent(bData.rotUndsPct, 1)}</td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors font-black bg-slate-50/50">
                    <td className="p-2 bg-[#bfe0f5] text-[#003876] font-black border-r border-slate-200">Total</td>
                    {BRANDS.map(brand => {
                      const bData = brandsYtd[brand.id] || {};
                      return (
                        <React.Fragment key={brand.id}>
                          <td className="p-1.5 text-center text-slate-950 font-black">{formatNumber(bData.totalUnds)}</td>
                          <td className="p-1.5 text-center text-slate-950 font-black border-r border-slate-200 last:border-r-0">{formatPercent(bData.totalUndsPct, 1)}</td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* TABLA MENSUAL UNIDADES */}
          <div className="space-y-2 pt-2">
            <h2 className="text-center text-sm sm:text-base font-black text-[#00529B] uppercase tracking-wide">
              Growth Drivers Unidades ({selectedBrand})
            </h2>
            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="p-2 w-32 border-r border-slate-200" />
                    {selectedBrandData.monthly.map(m => (
                      <th key={m.mesNum} colSpan={2} className="p-2 text-center border-r border-slate-200 font-black text-slate-800">
                        {m.mesLabel}
                      </th>
                    ))}
                    <th colSpan={2} className="p-2 text-center bg-blue-50/60 font-black text-[#00529B]">
                      YTD
                    </th>
                  </tr>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-bold text-slate-600">
                    <th className="p-1.5 border-r border-slate-200" />
                    {selectedBrandData.monthly.map(m => (
                      <React.Fragment key={m.mesNum}>
                        <th className="p-1 text-center font-bold text-slate-700 w-16">Dif. LY</th>
                        <th className="p-1 text-center font-bold text-slate-700 w-16 border-r border-slate-200">Vs LY</th>
                      </React.Fragment>
                    ))}
                    <th className="p-1 text-center font-bold text-[#00529B] w-16 bg-blue-50/60">Dif. LY</th>
                    <th className="p-1 text-center font-bold text-[#00529B] w-16 bg-blue-50/60">Vs LY</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-semibold">
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-2 bg-[#d8ecf8] text-[#003876] font-bold border-r border-slate-200">Distribución</td>
                    {selectedBrandData.monthly.map(m => (
                      <React.Fragment key={m.mesNum}>
                        <td className="p-1.5 text-center text-slate-900">{formatNumber(m.distUnds)}</td>
                        <td className="p-1.5 text-center text-slate-900 border-r border-slate-200">{formatPercent(m.distUndsPct, 1)}</td>
                      </React.Fragment>
                    ))}
                    <td className="p-1.5 text-center text-slate-950 font-bold bg-blue-50/40">{formatNumber(selectedBrandData.ytd.distUnds)}</td>
                    <td className="p-1.5 text-center text-slate-950 font-bold bg-blue-50/40">{formatPercent(selectedBrandData.ytd.distUndsPct, 1)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-2 bg-[#d8ecf8] text-[#003876] font-bold border-r border-slate-200">Rotación</td>
                    {selectedBrandData.monthly.map(m => (
                      <React.Fragment key={m.mesNum}>
                        <td className="p-1.5 text-center text-slate-900">{formatNumber(m.rotUnds)}</td>
                        <td className="p-1.5 text-center text-slate-900 border-r border-slate-200">{formatPercent(m.rotUndsPct, 1)}</td>
                      </React.Fragment>
                    ))}
                    <td className="p-1.5 text-center text-slate-950 font-bold bg-blue-50/40">{formatNumber(selectedBrandData.ytd.rotUnds)}</td>
                    <td className="p-1.5 text-center text-slate-950 font-bold bg-blue-50/40">{formatPercent(selectedBrandData.ytd.rotUndsPct, 1)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors font-black bg-slate-50/50">
                    <td className="p-2 bg-[#bfe0f5] text-[#003876] font-black border-r border-slate-200">Total</td>
                    {selectedBrandData.monthly.map(m => (
                      <React.Fragment key={m.mesNum}>
                        <td className="p-1.5 text-center text-slate-950 font-black">{formatNumber(m.totalUnds)}</td>
                        <td className="p-1.5 text-center text-slate-950 font-black border-r border-slate-200">{formatPercent(m.totalUndsPct, 1)}</td>
                      </React.Fragment>
                    ))}
                    <td className="p-1.5 text-center text-slate-950 font-black bg-blue-100/60">{formatNumber(selectedBrandData.ytd.totalUnds)}</td>
                    <td className="p-1.5 text-center text-slate-950 font-black bg-blue-100/60">{formatPercent(selectedBrandData.ytd.totalUndsPct, 1)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* GRÁFICO UNIDADES */}
          <div className="pt-2">
            <UnitGrowthChart monthlyData={selectedBrandData.monthly} brandName={selectedBrand} />
          </div>
        </section>

        {/* ======================================================== */}
        {/* SECCIÓN 2: VALOR COP */}
        {/* ======================================================== */}
        <section className="bg-white rounded-2xl border border-blue-200 shadow-xs p-4 sm:p-6 space-y-6">
          {/* TABLA YTD COP */}
          <div className="space-y-2">
            <h2 className="text-center text-sm sm:text-base font-black text-[#00529B] uppercase tracking-wide">
              Growth Drivers YTD COP
            </h2>
            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-white border-b border-slate-200">
                    <th className="p-2 w-32 border-r border-slate-200 bg-white" />
                    {BRANDS.map(brand => (
                      <th key={brand.id} colSpan={2} className="p-2 text-center border-r border-slate-200 last:border-r-0 bg-white">
                        <div className="flex items-center justify-center h-12 w-full px-1">
                          <img
                            src={brand.logo}
                            alt={brand.name}
                            className="h-10 sm:h-12 w-auto max-w-[105px] object-contain mix-blend-multiply drop-shadow-2xs transition-transform hover:scale-105"
                          />
                        </div>
                      </th>
                    ))}
                  </tr>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-bold text-slate-600">
                    <th className="p-1.5 border-r border-slate-200" />
                    {BRANDS.map(brand => (
                      <React.Fragment key={brand.id}>
                        <th className="p-1 text-center font-bold text-slate-700 w-20">Dif. LY</th>
                        <th className="p-1 text-center font-bold text-slate-700 w-16 border-r border-slate-200 last:border-r-0">Vs LY</th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-semibold">
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-2 bg-[#d8ecf8] text-[#003876] font-bold border-r border-slate-200">Precio</td>
                    {BRANDS.map(brand => {
                      const bData = brandsYtd[brand.id] || {};
                      return (
                        <React.Fragment key={brand.id}>
                          <td className="p-1.5 text-center text-slate-900">{formatNumber(bData.precioVal)}</td>
                          <td className="p-1.5 text-center text-slate-900 border-r border-slate-200 last:border-r-0">{formatPercent(bData.precioValPct, 1)}</td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-2 bg-[#d8ecf8] text-[#003876] font-bold border-r border-slate-200">Distribución</td>
                    {BRANDS.map(brand => {
                      const bData = brandsYtd[brand.id] || {};
                      return (
                        <React.Fragment key={brand.id}>
                          <td className="p-1.5 text-center text-slate-900">{formatNumber(bData.distVal)}</td>
                          <td className="p-1.5 text-center text-slate-900 border-r border-slate-200 last:border-r-0">{formatPercent(bData.distValPct, 1)}</td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-2 bg-[#d8ecf8] text-[#003876] font-bold border-r border-slate-200">Rotación</td>
                    {BRANDS.map(brand => {
                      const bData = brandsYtd[brand.id] || {};
                      return (
                        <React.Fragment key={brand.id}>
                          <td className="p-1.5 text-center text-slate-900">{formatNumber(bData.rotVal)}</td>
                          <td className="p-1.5 text-center text-slate-900 border-r border-slate-200 last:border-r-0">{formatPercent(bData.rotValPct, 1)}</td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors font-black bg-slate-50/50">
                    <td className="p-2 bg-[#bfe0f5] text-[#003876] font-black border-r border-slate-200">Total</td>
                    {BRANDS.map(brand => {
                      const bData = brandsYtd[brand.id] || {};
                      return (
                        <React.Fragment key={brand.id}>
                          <td className="p-1.5 text-center text-slate-950 font-black">{formatNumber(bData.totalVal)}</td>
                          <td className="p-1.5 text-center text-slate-950 font-black border-r border-slate-200 last:border-r-0">{formatPercent(bData.totalValPct, 1)}</td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* TABLA MENSUAL COP */}
          <div className="space-y-2 pt-2">
            <h2 className="text-center text-sm sm:text-base font-black text-[#00529B] uppercase tracking-wide">
              Growth Drivers COP ({selectedBrand})
            </h2>
            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="p-2 w-32 border-r border-slate-200" />
                    {selectedBrandData.monthly.map(m => (
                      <th key={m.mesNum} colSpan={2} className="p-2 text-center border-r border-slate-200 font-black text-slate-800">
                        {m.mesLabel}
                      </th>
                    ))}
                    <th colSpan={2} className="p-2 text-center bg-blue-50/60 font-black text-[#00529B]">
                      YTD
                    </th>
                  </tr>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-bold text-slate-600">
                    <th className="p-1.5 border-r border-slate-200" />
                    {selectedBrandData.monthly.map(m => (
                      <React.Fragment key={m.mesNum}>
                        <th className="p-1 text-center font-bold text-slate-700 w-20">Dif. LY</th>
                        <th className="p-1 text-center font-bold text-slate-700 w-16 border-r border-slate-200">Vs LY</th>
                      </React.Fragment>
                    ))}
                    <th className="p-1 text-center font-bold text-[#00529B] w-20 bg-blue-50/60">Dif. LY</th>
                    <th className="p-1 text-center font-bold text-[#00529B] w-16 bg-blue-50/60">Vs LY</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-semibold">
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-2 bg-[#d8ecf8] text-[#003876] font-bold border-r border-slate-200">Precio</td>
                    {selectedBrandData.monthly.map(m => (
                      <React.Fragment key={m.mesNum}>
                        <td className="p-1.5 text-center text-slate-900">{formatNumber(m.precioVal)}</td>
                        <td className="p-1.5 text-center text-slate-900 border-r border-slate-200">{formatPercent(m.precioValPct, 1)}</td>
                      </React.Fragment>
                    ))}
                    <td className="p-1.5 text-center text-slate-950 font-bold bg-blue-50/40">{formatNumber(selectedBrandData.ytd.precioVal)}</td>
                    <td className="p-1.5 text-center text-slate-950 font-bold bg-blue-50/40">{formatPercent(selectedBrandData.ytd.precioValPct, 1)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-2 bg-[#d8ecf8] text-[#003876] font-bold border-r border-slate-200">Distribución</td>
                    {selectedBrandData.monthly.map(m => (
                      <React.Fragment key={m.mesNum}>
                        <td className="p-1.5 text-center text-slate-900">{formatNumber(m.distVal)}</td>
                        <td className="p-1.5 text-center text-slate-900 border-r border-slate-200">{formatPercent(m.distValPct, 1)}</td>
                      </React.Fragment>
                    ))}
                    <td className="p-1.5 text-center text-slate-950 font-bold bg-blue-50/40">{formatNumber(selectedBrandData.ytd.distVal)}</td>
                    <td className="p-1.5 text-center text-slate-950 font-bold bg-blue-50/40">{formatPercent(selectedBrandData.ytd.distValPct, 1)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-2 bg-[#d8ecf8] text-[#003876] font-bold border-r border-slate-200">Rotación</td>
                    {selectedBrandData.monthly.map(m => (
                      <React.Fragment key={m.mesNum}>
                        <td className="p-1.5 text-center text-slate-900">{formatNumber(m.rotVal)}</td>
                        <td className="p-1.5 text-center text-slate-900 border-r border-slate-200">{formatPercent(m.rotValPct, 1)}</td>
                      </React.Fragment>
                    ))}
                    <td className="p-1.5 text-center text-slate-950 font-bold bg-blue-50/40">{formatNumber(selectedBrandData.ytd.rotVal)}</td>
                    <td className="p-1.5 text-center text-slate-950 font-bold bg-blue-50/40">{formatPercent(selectedBrandData.ytd.rotValPct, 1)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors font-black bg-slate-50/50">
                    <td className="p-2 bg-[#bfe0f5] text-[#003876] font-black border-r border-slate-200">Total</td>
                    {selectedBrandData.monthly.map(m => (
                      <React.Fragment key={m.mesNum}>
                        <td className="p-1.5 text-center text-slate-950 font-black">{formatNumber(m.totalVal)}</td>
                        <td className="p-1.5 text-center text-slate-950 font-black border-r border-slate-200">{formatPercent(m.totalValPct, 1)}</td>
                      </React.Fragment>
                    ))}
                    <td className="p-1.5 text-center text-slate-950 font-black bg-blue-100/60">{formatNumber(selectedBrandData.ytd.totalVal)}</td>
                    <td className="p-1.5 text-center text-slate-950 font-black bg-blue-100/60">{formatPercent(selectedBrandData.ytd.totalValPct, 1)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* GRÁFICO COP */}
          <div className="pt-2">
            <CopGrowthChart monthlyData={selectedBrandData.monthly} brandName={selectedBrand} />
          </div>
        </section>
      </main>
    </div>
  );
};

export default ColombiaGrowthDriversView;
