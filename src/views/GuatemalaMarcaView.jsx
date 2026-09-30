import React, { useState, useEffect, useMemo } from 'react';
import RibbonChart from '../components/RibbonChart';

const GT_BRAND_COLORS = {
  'HIDRAVIDA': '#0066c0',
  'Hidravida': '#0066c0',
  'HIDRALIFE': '#38bdf8',
  'Hidralife': '#38bdf8',
  'ELECTROLIT': '#0066c0',
  'Electrolit': '#0066c0',
  'ELECTROLIFE': '#38bdf8',
  'Electrolife': '#38bdf8',
  'ISOMAX': '#db2777',
  'Isomax': '#db2777',
  'GATORADE': '#ea580c',
  'Gatorade': '#ea580c',
  'GATORLYTE': '#f97316',
  'Gatorlyte': '#f97316',
  'SPORADE': '#ca8a04',
  'Sporade': '#ca8a04',
  'REVIVE': '#c084fc',
  'Revive': '#c084fc',
  'POWERADE': '#6b21a8',
  'Powerade': '#6b21a8',
  'SUEROX': '#991b1b',
  'Suerox': '#991b1b',
  'GLUCOSORAL': '#10b981',
  'Glucosoral': '#10b981',
  'PEDIALYTE': '#dc2626',
  'Pedialyte': '#dc2626',
  'RESTO MARCAS': '#94a3b8',
  'Resto Marcas': '#94a3b8'
};

const GT_ALL_BRANDS_ORDER = [
  'HIDRAVIDA', 'ISOMAX', 'GATORADE', 'SPORADE', 'REVIVE', 'POWERADE',
  'SUEROX', 'GLUCOSORAL', 'PEDIALYTE', 'GATORLYTE', 'HIDRALIFE', 'RESTO MARCAS'
];

// Componente para gráficos de líneas con 2 series (Tradicional vs Moderno) con posicionamiento inteligente de etiquetas
function TrendLineCard({ title, data = [], modernKey, tradKey, formatValue, yRange }) {
  const [hoveredSeries, setHoveredSeries] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-blue-200/60 p-4 shadow-xs flex flex-col justify-between h-[420px]">
        <div className="text-sm font-black text-[#004B93] text-center border-b border-blue-100 pb-2 uppercase tracking-wide">{title}</div>
        <div className="flex items-center justify-center flex-1 text-slate-400 text-sm font-medium">Cargando...</div>
      </div>
    );
  }

  const svgWidth = 340;
  const svgHeight = 310;
  const padLeft = 24;
  const padRight = 24;
  const padTop = 36;
  const padBottom = 68; // Espacio vertical generoso para las etiquetas de mes rotadas
  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  const numPoints = data.length;
  const stepX = numPoints > 1 ? chartW / (numPoints - 1) : chartW;

  // Extraer valores
  const modVals = data.map(d => Number(d[modernKey] || 0));
  const tradVals = data.map(d => Number(d[tradKey] || 0));
  const allVals = [...modVals, ...tradVals];

  const minV = yRange ? yRange[0] : Math.min(...allVals) * 0.9;
  const maxV = yRange ? yRange[1] : Math.max(...allVals) * 1.1 || 1;
  const range = maxV - minV || 1;

  const getY = (v) => padTop + chartH - ((v - minV) / range) * chartH;
  const getX = (idx) => padLeft + idx * stepX;

  // Puntos SVG para las líneas continuas (filtrando meses en cero / previo a lanzamiento)
  const buildPath = (vals) => {
    let d = '';
    let inSeg = false;
    vals.forEach((v, i) => {
      if (v > 0) {
        const x = getX(i);
        const y = getY(v);
        if (!inSeg) {
          d += ` M ${x.toFixed(1)} ${y.toFixed(1)}`;
          inSeg = true;
        } else {
          d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
        }
      } else {
        inSeg = false;
      }
    });
    return d;
  };

  const modPathD = buildPath(modVals);
  const tradPathD = buildPath(tradVals);

  const isModHovered = hoveredSeries === 'moderno';
  const isTradHovered = hoveredSeries === 'tradicional';

  return (
    <div className="bg-white rounded-2xl border border-blue-200/70 p-4 shadow-xs flex flex-col justify-between h-[420px] select-none hover:shadow-sm transition-shadow">
      <div className="text-xs md:text-sm font-black text-[#004B93] text-center border-b border-blue-100 pb-2 uppercase tracking-tight flex items-center justify-between px-1">
        <span className="flex-1 text-center">{title}</span>
        {/* Leyenda interactiva rápida */}
        <div className="flex items-center gap-2 text-[10px] font-bold">
          <span 
            className={`flex items-center gap-1 cursor-pointer transition-opacity ${isTradHovered ? 'opacity-30' : 'opacity-100'}`}
            onMouseEnter={() => setHoveredSeries('moderno')}
            onMouseLeave={() => setHoveredSeries(null)}
          >
            <span className="w-2 h-2 rounded-full bg-[#00a2ae]" />
            <span className="text-[#006978]">MOD</span>
          </span>
          <span 
            className={`flex items-center gap-1 cursor-pointer transition-opacity ${isModHovered ? 'opacity-30' : 'opacity-100'}`}
            onMouseEnter={() => setHoveredSeries('tradicional')}
            onMouseLeave={() => setHoveredSeries(null)}
          >
            <span className="w-2 h-2 rounded-full bg-[#f28e2c]" />
            <span className="text-[#b85a00]">TRAD</span>
          </span>
        </div>
      </div>

      <div className="relative w-full flex-1 flex items-center justify-center my-1">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full overflow-visible">
          {/* Líneas de cuadrícula horizontales */}
          <line x1={padLeft} y1={padTop} x2={svgWidth - padRight} y2={padTop} stroke="#f1f5f9" strokeDasharray="3 3" />
          <line x1={padLeft} y1={padTop + chartH / 4} x2={svgWidth - padRight} y2={padTop + chartH / 4} stroke="#f8fafc" strokeDasharray="2 2" />
          <line x1={padLeft} y1={padTop + chartH / 2} x2={svgWidth - padRight} y2={padTop + chartH / 2} stroke="#f1f5f9" strokeDasharray="3 3" />
          <line x1={padLeft} y1={padTop + (3 * chartH) / 4} x2={svgWidth - padRight} y2={padTop + (3 * chartH) / 4} stroke="#f8fafc" strokeDasharray="2 2" />
          <line x1={padLeft} y1={padTop + chartH} x2={svgWidth - padRight} y2={padTop + chartH} stroke="#cbd5e1" strokeWidth={1.2} />

          {/* Líneas guía verticales sutiles en cada mes */}
          {data.map((_, i) => (
            <line
              key={`vline-${i}`}
              x1={getX(i)}
              y1={padTop}
              x2={getX(i)}
              y2={padTop + chartH}
              stroke="#f1f5f9"
              strokeDasharray="2 2"
            />
          ))}

          {/* Línea Moderno (Teal) */}
          {modPathD && (
            <path
              d={modPathD}
              fill="none"
              stroke="#00a2ae"
              strokeWidth={isModHovered ? 4.5 : isTradHovered ? 1.5 : 3.2}
              strokeOpacity={isTradHovered ? 0.2 : 1}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-200 cursor-pointer"
              onMouseEnter={() => setHoveredSeries('moderno')}
              onMouseLeave={() => setHoveredSeries(null)}
            />
          )}

          {/* Línea Tradicional (Naranja) */}
          {tradPathD && (
            <path
              d={tradPathD}
              fill="none"
              stroke="#f28e2c"
              strokeWidth={isTradHovered ? 4.5 : isModHovered ? 1.5 : 3.2}
              strokeOpacity={isModHovered ? 0.2 : 1}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-200 cursor-pointer"
              onMouseEnter={() => setHoveredSeries('tradicional')}
              onMouseLeave={() => setHoveredSeries(null)}
            />
          )}

          {/* Puntos y Etiquetas Inteligentes sin Colisiones */}
          {data.map((_, i) => {
            const x = getX(i);
            const modV = modVals[i];
            const tradV = tradVals[i];
            const yMod = getY(modV);
            const yTrad = getY(tradV);
            const axisBottom = padTop + chartH;

            const showModLabel = isModHovered || (!isTradHovered && (i % 2 === 0 || i === numPoints - 1));
            const showTradLabel = isTradHovered || (!isModHovered && (i % 2 === 0 || i === numPoints - 1));

            // Orden relativo visual
            const isModHigher = yMod < yTrad;

            let modPos = isModHigher ? 'top' : 'bottom';
            let tradPos = isModHigher ? 'bottom' : 'top';

            // Evitar colisión con el eje X y fechas inferiores
            if (modPos === 'bottom' && (yMod + 23 > axisBottom)) {
              modPos = 'top';
            }
            if (tradPos === 'bottom' && (yTrad + 23 > axisBottom)) {
              tradPos = 'top';
            }

            // Evitar salir por el borde superior
            if (modPos === 'top' && (yMod - 23 < padTop - 12)) {
              modPos = 'bottom';
            }
            if (tradPos === 'top' && (yTrad - 23 < padTop - 12)) {
              tradPos = 'bottom';
            }

            let yBadgeMod = modPos === 'top' ? yMod - 21 : yMod + 6;
            let yBadgeTrad = tradPos === 'top' ? yTrad - 21 : yTrad + 6;

            // Desempate y separación si ambos quedaron en 'top'
            if (modPos === 'top' && tradPos === 'top') {
              if (Math.abs(yBadgeMod - yBadgeTrad) < 18) {
                if (yMod <= yTrad) {
                  yBadgeMod = yBadgeTrad - 19;
                } else {
                  yBadgeTrad = yBadgeMod - 19;
                }
              }
            }

            // Desempate y separación si ambos quedaron en 'bottom'
            if (modPos === 'bottom' && tradPos === 'bottom') {
              if (Math.abs(yBadgeMod - yBadgeTrad) < 18) {
                if (yMod >= yTrad) {
                  yBadgeMod = yBadgeTrad + 19;
                } else {
                  yBadgeTrad = yBadgeMod + 19;
                }
              }
            }

            const formattedMod = formatValue ? formatValue(modV) : Math.round(modV);
            const formattedTrad = formatValue ? formatValue(tradV) : Math.round(tradV);

            return (
              <g key={`data-point-grp-${i}`}>
                {/* Punto Moderno */}
                {modV > 0 && (
                  <circle 
                    cx={x} 
                    cy={yMod} 
                    r={isModHovered ? 6 : isTradHovered ? 2.5 : 5} 
                    fill={isModHovered ? '#ffffff' : '#00a2ae'} 
                    stroke="#00a2ae" 
                    strokeWidth={isModHovered ? 2.8 : 2} 
                    opacity={isTradHovered ? 0.25 : 1}
                    className="transition-all duration-200 cursor-pointer"
                    onMouseEnter={() => setHoveredSeries('moderno')}
                    onMouseLeave={() => setHoveredSeries(null)}
                  />
                )}

                {/* Punto Tradicional */}
                {tradV > 0 && (
                  <circle 
                    cx={x} 
                    cy={yTrad} 
                    r={isTradHovered ? 6 : isModHovered ? 2.5 : 5} 
                    fill={isTradHovered ? '#ffffff' : '#f28e2c'} 
                    stroke="#f28e2c" 
                    strokeWidth={isTradHovered ? 2.8 : 2} 
                    opacity={isModHovered ? 0.25 : 1}
                    className="transition-all duration-200 cursor-pointer"
                    onMouseEnter={() => setHoveredSeries('tradicional')}
                    onMouseLeave={() => setHoveredSeries(null)}
                  />
                )}

                {/* Badge Moderno */}
                {showModLabel && modV > 0 && (
                  <g 
                    className="transition-all duration-200 cursor-pointer"
                    style={{ opacity: isTradHovered ? 0.2 : 1 }}
                    onMouseEnter={() => setHoveredSeries('moderno')}
                    onMouseLeave={() => setHoveredSeries(null)}
                  >
                    <rect
                      x={x - 18}
                      y={yBadgeMod}
                      width={36}
                      height={17}
                      rx={4}
                      fill="#e0f7fa"
                      stroke="#00a2ae"
                      strokeWidth={isModHovered ? 1.5 : 1}
                      opacity={0.97}
                      className={isModHovered ? "drop-shadow-md" : ""}
                    />
                    <text
                      x={x}
                      y={yBadgeMod + 12.5}
                      textAnchor="middle"
                      fontSize={isModHovered ? 12 : 11.5}
                      fill="#006978"
                      fontWeight="500"
                    >
                      {formattedMod}
                    </text>
                  </g>
                )}

                {/* Badge Tradicional */}
                {showTradLabel && tradV > 0 && (
                  <g 
                    className="transition-all duration-200 cursor-pointer"
                    style={{ opacity: isModHovered ? 0.2 : 1 }}
                    onMouseEnter={() => setHoveredSeries('tradicional')}
                    onMouseLeave={() => setHoveredSeries(null)}
                  >
                    <rect
                      x={x - 18}
                      y={yBadgeTrad}
                      width={36}
                      height={17}
                      rx={4}
                      fill="#fff3e0"
                      stroke="#f28e2c"
                      strokeWidth={isTradHovered ? 1.5 : 1}
                      opacity={0.97}
                      className={isTradHovered ? "drop-shadow-md" : ""}
                    />
                    <text
                      x={x}
                      y={yBadgeTrad + 12.5}
                      textAnchor="middle"
                      fontSize={isTradHovered ? 12 : 11.5}
                      fill="#b85a00"
                      fontWeight="500"
                    >
                      {formattedTrad}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Eje X: Etiquetas de Mes en VERTICAL Grandes */}
          {data.map((d, i) => {
            const x = getX(i);
            const label = d.mes_label ? d.mes_label.toLowerCase() : '';
            return (
              <g key={`lbl-grp-${i}`}>
                <line x1={x} y1={padTop + chartH} x2={x} y2={padTop + chartH + 5} stroke="#94a3b8" strokeWidth={1.2} />
                <text
                  x={x}
                  y={padTop + chartH + 10}
                  textAnchor="end"
                  transform={`rotate(-90, ${x}, ${padTop + chartH + 10})`}
                  fontSize={11}
                  fill="#334155"
                  fontWeight="800"
                >
                  {label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// Componente para MIX Unidades (000) - Estilo Power BI
function MixUnidadesCard({ mixData }) {
  const totalMercado = mixData?.totalMercado || { moderno: 20716, tradicional: 211607, modernoPct: 8.9, tradicionalPct: 91.1 };
  const marcaData = mixData?.marca || { nombre: 'HIDRAVIDA', moderno: 4651, tradicional: 10621, modernoPct: 30.5, tradicionalPct: 69.5 };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3.5 flex flex-col justify-between h-[420px] select-none hover:shadow-xs transition-shadow">
      <div className="text-sm font-bold text-[#0066c0] text-center border-b border-dashed border-blue-200/80 pb-2 tracking-tight">
        MIX Unidades (000)
      </div>

      <div className="flex items-end justify-center gap-6 md:gap-8 px-2 my-auto">
        {/* Barra 1: TOTAL YTD */}
        <div className="flex flex-col items-center gap-2 flex-1 max-w-[125px]">
          <div className="w-full h-64 rounded-xs overflow-hidden flex flex-col shadow-xs border border-slate-300/70">
            {/* Segmento Tradicional (Naranja Power BI) */}
            <div
              style={{ height: `${totalMercado.tradicionalPct}%` }}
              className="bg-[#f59842] flex flex-col items-center justify-center text-white px-1 transition-all duration-300"
            >
              <span className="text-xs md:text-sm font-medium tracking-tight drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]">{Math.round(totalMercado.tradicional).toLocaleString()}</span>
              <span className="text-[10px] md:text-xs font-normal opacity-95 drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]">{totalMercado.tradicionalPct.toFixed(1)}%</span>
            </div>
            {/* Segmento Moderno (Teal Power BI) */}
            <div
              style={{ height: `${totalMercado.modernoPct}%` }}
              className="bg-[#009ca6] flex flex-col items-center justify-center text-white px-1 transition-all duration-300 flex-1"
            >
              <span className="text-xs md:text-sm font-medium tracking-tight drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]">{Math.round(totalMercado.moderno).toLocaleString()}</span>
              <span className="text-[10px] md:text-xs font-normal opacity-95 drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]">{totalMercado.modernoPct.toFixed(1)}%</span>
            </div>
          </div>
          <div className="h-5 flex items-center justify-center">
            <span className="text-[11px] font-semibold text-slate-800 text-center uppercase tracking-tight whitespace-nowrap">
              TOTAL YTD
            </span>
          </div>
        </div>

        {/* Barra 2: MARCA YTD */}
        <div className="flex flex-col items-center gap-2 flex-1 max-w-[125px]">
          <div className="w-full h-64 rounded-xs overflow-hidden flex flex-col shadow-xs border border-slate-300/70">
            {/* Segmento Tradicional (Naranja Power BI) */}
            <div
              style={{ height: `${marcaData.tradicionalPct}%` }}
              className="bg-[#f59842] flex flex-col items-center justify-center text-white px-1 transition-all duration-300"
            >
              <span className="text-xs md:text-sm font-medium tracking-tight drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]">{Math.round(marcaData.tradicional).toLocaleString()}</span>
              <span className="text-[10px] md:text-xs font-normal opacity-95 drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]">{marcaData.tradicionalPct.toFixed(1)}%</span>
            </div>
            {/* Segmento Moderno (Teal Power BI) */}
            <div
              style={{ height: `${marcaData.modernoPct}%` }}
              className="bg-[#009ca6] flex flex-col items-center justify-center text-white px-1 transition-all duration-300 flex-1"
            >
              <span className="text-xs md:text-sm font-medium tracking-tight drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]">{Math.round(marcaData.moderno).toLocaleString()}</span>
              <span className="text-[10px] md:text-xs font-normal opacity-95 drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]">{marcaData.modernoPct.toFixed(1)}%</span>
            </div>
          </div>
          <div className="h-5 flex items-center justify-center">
            <span className="text-[11px] font-semibold text-slate-800 text-center uppercase tracking-tight whitespace-nowrap">
              {marcaData.nombre} YTD
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GuatemalaMarcaView({ onBack }) {
  const [marca, setMarca] = useState('HIDRAVIDA');
  const [anio, setAnio] = useState('2026');
  const [mes, setMes] = useState('Todas');
  const [region, setRegion] = useState('METRO');

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const url = `/api/nielsen/gt/marca-dashboard?marca=${encodeURIComponent(marca)}&anio=${anio}&mes=${mes}&region=${encodeURIComponent(region)}`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (isMounted) {
          setDashboardData(data);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('Error fetching Guatemala marca dashboard data:', err);
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [marca, anio, mes, region]);

  // Lista de marcas homologadas en Guatemala
  const availableBrands = dashboardData?.availableBrands || [
    'HIDRAVIDA', 'ISOMAX', 'GATORADE', 'SPORADE', 'REVIVE', 'POWERADE',
    'SUEROX', 'GLUCOSORAL', 'PEDIALYTE', 'GATORLYTE', 'HIDRALIFE', 'RESTO MARCAS'
  ];

  // Lista dinámica de meses de acuerdo al año seleccionado
  const availableMonths = useMemo(() => {
    if (dashboardData?.availableMonthsByYear?.[anio]) {
      return dashboardData.availableMonthsByYear[anio];
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
  }, [dashboardData, anio]);

  // Manejar cambio de año asegurando que el mes seleccionado exista
  const handleAnioChange = (newAnio) => {
    setAnio(newAnio);
    if (newAnio === '2026' && mes !== 'Todas' && parseInt(mes, 10) > 8) {
      setMes('Todas');
    }
  };

  const availableRegions = dashboardData?.availableRegions || [
    'METRO', 'NORORIENTE', 'OCCIDENTE', 'OCCIDENTE CHICO',
    'ORIENTE CHICO', 'ORIENTE GRANDE', 'SUR', 'VERAPACES'
  ];

  const monthlyTrends = dashboardData?.monthlyTrends || [];
  const mixResult = dashboardData?.mixResult;
  const saboresPais = dashboardData?.saboresPais || [];
  const saboresRegion = dashboardData?.saboresRegion || [];

  return (
    <div className="w-full min-h-screen bg-[#f8fafc] p-4 md:p-6 space-y-4 font-sans text-slate-800">
      
      {/* CABECERA SUPERIOR TIPO OVERVIEW */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs px-5 py-3 flex flex-wrap items-center justify-between gap-4">
        
        {/* LOGOS OFICIALES */}
        <div className="flex items-center gap-6">
          <img 
            src="/assets/LOGOS/Hidravida-color.png" 
            alt="Hidravida Logo" 
            className="h-8 object-contain"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/assets/LOGOS/Electrolit-color.png";
            }}
          />
          <div className="h-6 w-px bg-slate-300" />
          <img 
            src="/assets/LOGOS/Nielsen-logo.png" 
            alt="Nielsen" 
            className="h-7 md:h-8 object-contain"
          />
        </div>

        {/* TÍTULO CENTRAL */}
        <div className="text-center flex-1 min-w-[180px]">
          <h1 className="text-2xl font-black text-[#0066c0] tracking-tight">
            Marca
          </h1>
        </div>

        {/* LEYENDA GLOBAL DE CANALES */}
        <div className="flex items-center gap-5 text-xs font-bold">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#f28e2c] shadow-xs"></span>
            <span className="text-slate-700">Tradicional</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#00a2ae] shadow-xs"></span>
            <span className="text-slate-700">Moderno</span>
          </div>
        </div>

        {/* FILTROS Y ACCIONES */}
        <div className="flex items-center gap-3">
          
          {/* Selector de Marca */}
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <span className="text-slate-500 font-semibold">Marca:</span>
            <select
              value={marca}
              onChange={(e) => setMarca(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1 text-xs font-bold text-slate-700 outline-hidden cursor-pointer"
            >
              {availableBrands.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Selector de Año */}
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <span className="text-slate-500 font-semibold">Año:</span>
            <select
              value={anio}
              onChange={(e) => handleAnioChange(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1 text-xs font-bold text-slate-700 outline-hidden cursor-pointer"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>

          {/* Selector de Mes Dinámico */}
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

          {/* Botón Home */}
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

      {/* BARRA DE BOTONES DE MARCAS */}
      <div className="bg-white rounded-xl shadow-2xs border border-slate-200/80 px-4 py-2.5 flex flex-wrap items-center justify-center gap-2">
        {GT_ALL_BRANDS_ORDER.map(brand => {
          const isSelected = marca?.toUpperCase() === brand.toUpperCase();
          return (
            <button
              key={brand}
              onClick={() => setMarca(brand)}
              title={`Click para seleccionar y ver análisis de ${brand}`}
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

      {/* FILA SUPERIOR: 6 TARJETAS DE INDICADORES CON POSICIONAMIENTO INTELIGENTE DE ETIQUETAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
        {/* 1. MIX Unidades */}
        <MixUnidadesCard mixData={mixResult} />

        {/* 2. Part. Venta / Canales */}
        <TrendLineCard
          title="Part. Venta / Canales"
          data={monthlyTrends}
          modernKey="part_moderno_pct"
          tradKey="part_tradicional_pct"
          formatValue={(v) => `${Math.round(v)}%`}
          yRange={[0, 100]}
        />

        {/* 3. Dist. Numérica */}
        <TrendLineCard
          title="Dist. Numérica"
          data={monthlyTrends}
          modernKey="dist_moderno"
          tradKey="dist_tradicional"
          formatValue={(v) => Math.round(v)}
          yRange={[0, 100]}
        />

        {/* 4. Precio */}
        <TrendLineCard
          title="Precio"
          data={monthlyTrends}
          modernKey="moderno_precio"
          tradKey="tradicional_precio"
          formatValue={(v) => `$${v.toFixed(1)}`}
        />

        {/* 5. Rotación */}
        <TrendLineCard
          title="Rotación"
          data={monthlyTrends}
          modernKey="moderno_rotacion"
          tradKey="tradicional_rotacion"
          formatValue={(v) => v.toFixed(1)}
        />

        {/* 6. Share Marca en Canal */}
        <TrendLineCard
          title="Share Marca en Canal"
          data={monthlyTrends}
          modernKey="moderno_share"
          tradKey="tradicional_share"
          formatValue={(v) => `${Math.round(v)}%`}
        />
      </div>

      {/* LÍNEA DIVISORIA ESTRUCTURAL */}
      <div className="w-full border-t border-slate-300/80 my-1"></div>

      {/* SECCIÓN INFERIOR: ANÁLISIS GEOGRÁFICO Y SABORES */}
      <div className="flex flex-col gap-3.5">
        
        {/* SELECTOR DE PESTAÑAS DE REGIÓN */}
        <div className="flex items-center justify-center">
          <div className="inline-flex bg-white p-1 rounded-full border border-slate-200 shadow-xs gap-1.5 flex-wrap justify-center">
            {availableRegions.map(reg => {
              const isActive = region === reg;
              return (
                <button
                  key={reg}
                  onClick={() => setRegion(reg)}
                  className={`px-6 py-2 rounded-full text-xs font-black tracking-wider transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-[#0066c0] text-white shadow-xs'
                      : 'bg-transparent text-slate-600 hover:text-[#0066c0] hover:bg-slate-100/70'
                  }`}
                >
                  {reg}
                </button>
              );
            })}
          </div>
        </div>

        {/* DOS GRÁFICAS DE FLUJO / RIBBONS AMPLIADAS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* Gráfica Izquierda: Unidades (000) MARCA (Nivel País) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col gap-3">
            <div className="text-center border-b border-slate-100 pb-2">
              <h3 className="text-xs md:text-sm font-black text-[#0066c0] uppercase tracking-wider">Unidades (000)</h3>
              <span className="text-xs font-bold text-slate-500">{marca}</span>
            </div>
            <RibbonChart data={saboresPais} height={380} />
          </div>

          {/* Gráfica Derecha: Unidades (000) REGIÓN ACTIVA */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col gap-3">
            <div className="text-center border-b border-slate-100 pb-2">
              <h3 className="text-xs md:text-sm font-black text-[#0066c0] uppercase tracking-wider">Unidades (000)</h3>
              <span className="text-xs font-bold text-slate-500">{region}</span>
            </div>
            <RibbonChart data={saboresRegion} height={380} />
          </div>

        </div>

      </div>

    </div>
  );
}
