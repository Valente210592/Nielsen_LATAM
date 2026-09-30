import React, { useState, useEffect, useMemo } from 'react';

const GT_BRANDS = [
  { key: 'Hidravida', logo: '/assets/competencia/Guatemala/Hidravida.png', name: 'Hidravida' },
  { key: 'Hidralife', logo: '/assets/competencia/Guatemala/Hidralife.png', name: 'Hidralife' },
  { key: 'Gatorade', logo: '/assets/competencia/Guatemala/Gatorade.png', name: 'Gatorade' },
  { key: 'Gatorlyte', logo: '/assets/competencia/Guatemala/Gatorlyte.png', name: 'Gatorlyte' },
  { key: 'Powerade', logo: '/assets/competencia/Guatemala/Powerade.png', name: 'Powerade' },
  { key: 'Isomax', logo: '/assets/competencia/Guatemala/Isomax.png', name: 'Isomax' },
  { key: 'Suerox', logo: '/assets/competencia/Guatemala/Suerox.png', name: 'Suerox' },
  { key: 'Sporade', logo: '/assets/competencia/Guatemala/Sporade.png', name: 'Sporade' },
  { key: 'Revive', logo: '/assets/competencia/Guatemala/Revive.png', name: 'Revive' }
];

const CHANNELS = [
  { key: 'MODERNO', label: 'MODERNO' },
  { key: 'TRADICIONAL', label: 'TRADICIONAL' },
  { key: 'TOTAL', label: 'TOTAL' }
];

// Función para calcular color de celda por fila con la paleta de calor corporativa:
// Inferior: #FD9696 (253, 150, 150)
// Centro:   #F3F08F (243, 240, 143)
// Superior: #B1EE93 (177, 238, 147)
function getHeatmapColor(val, min, max) {
  if (val === null || val === undefined || isNaN(val)) return '#ffffff';
  if (max === min) return '#F3F08F';
  
  const t = Math.max(0, Math.min(1, (val - min) / (max - min)));

  let r, g, b;
  if (t < 0.5) {
    const localT = t / 0.5;
    r = Math.round(253 + (243 - 253) * localT);
    g = Math.round(150 + (240 - 150) * localT);
    b = Math.round(150 + (143 - 150) * localT);
  } else {
    const localT = (t - 0.5) / 0.5;
    r = Math.round(243 + (177 - 243) * localT);
    g = Math.round(240 + (238 - 240) * localT);
    b = Math.round(143 + (147 - 143) * localT);
  }
  return `rgb(${r}, ${g}, ${b})`;
}

// Componente para una Tabla de KPI
function KpiMatrixCard({ 
  title, 
  matrix = {}, 
  prefix = '', 
  suffix = '', 
  decimals = 1 
}) {
  return (
    <div className="bg-white rounded-xl border border-blue-200/80 shadow-xs hover:shadow-md transition-shadow overflow-hidden flex flex-col">
      {/* Título de la Tarjeta */}
      <div className="py-2.5 px-4 border-b border-blue-100 bg-blue-50/20">
        <h3 className="text-center font-bold text-[#0066c0] text-[16px] md:text-[17px] tracking-tight">
          {title}
        </h3>
      </div>

      {/* Tabla con Logos y Mapa de Calor por Fila */}
      <div className="overflow-x-auto p-2.5">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-200/80">
              <th className="w-32 py-2 px-3 text-left"></th>
              {GT_BRANDS.map(b => (
                <th key={b.key} className="py-3 px-1 text-center align-middle min-w-[75px] md:min-w-[85px]">
                  <div className="h-12 md:h-14 flex items-center justify-center px-1">
                    <img 
                      src={b.logo} 
                      alt={b.name} 
                      className="h-10 md:h-12 w-auto max-w-[80px] object-contain drop-shadow-xs transition-transform hover:scale-105"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = `<span class="text-xs font-bold text-slate-700">${b.name}</span>`;
                      }}
                    />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CHANNELS.map(ch => {
              const rowData = matrix[ch.key] || {};
              const values = GT_BRANDS.map(b => Number(rowData[b.key] || 0));
              const minVal = Math.min(...values);
              const maxVal = Math.max(...values);
              const isTotal = ch.key === 'TOTAL';

              return (
                <React.Fragment key={ch.key}>
                  {/* Fila en blanco de separación antes de TOTAL */}
                  {isTotal && (
                    <tr className="h-3.5">
                      <td colSpan={10} className="p-0 border-0 bg-transparent"></td>
                    </tr>
                  )}
                  <tr 
                    className={`border-b border-slate-200/70 ${isTotal ? 'border-t border-slate-200 shadow-2xs' : ''}`}
                  >
                    {/* Etiqueta del Canal en Negritas */}
                    <td className={`py-2.5 px-3.5 text-[13px] md:text-[14px] font-bold text-left tracking-wide ${isTotal ? 'text-slate-900 bg-slate-100/90 font-black' : 'text-slate-800 bg-slate-50/70'}`}>
                      {ch.label}
                    </td>

                    {/* Celdas con Mapa de Calor y Estrella en el Máximo */}
                    {GT_BRANDS.map(b => {
                      const rawVal = Number(rowData[b.key] || 0);
                      const isMax = rawVal === maxVal && maxVal > 0;
                      const bgColor = getHeatmapColor(rawVal, minVal, maxVal);

                      let formattedVal = rawVal.toFixed(decimals);
                      if (suffix === '%') {
                        formattedVal = `${formattedVal}%`;
                      }
                      if (prefix) {
                        formattedVal = `${prefix}${formattedVal}`;
                      }

                      return (
                        <td 
                          key={b.key}
                          style={{ backgroundColor: bgColor }}
                          className={`py-2 px-1 text-center font-normal text-[13px] md:text-[14px] text-slate-900 border-l border-white/60 select-none ${isTotal ? 'font-medium' : ''}`}
                        >
                          <div className="flex items-center justify-center gap-1 whitespace-nowrap">
                            {isMax && (
                              <span className="text-yellow-600 text-sm leading-none drop-shadow-xs">⭐</span>
                            )}
                            <span>{formattedVal}</span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function GuatemalaMatrizCanalView({ onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [anio, setAnio] = useState('2026');
  const [mes, setMes] = useState('Todas');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/nielsen/gt/matriz-kpis?anio=${anio}&mes=${mes}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Error cargando datos de Matriz Canal Guatemala:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [anio, mes]);

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

  const matrix = data?.matrix || {};

  return (
    <div className="w-full min-h-screen bg-[#f8fafc] text-slate-800 p-4 md:p-6 space-y-4 flex flex-col">
      {/* 1. CABECERA SUPERIOR */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-3.5 md:p-4.5 flex flex-wrap items-center justify-between gap-4">
        
        {/* Logos & Título */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <img 
              src="/assets/LOGOS/Hidravida-color.png" 
              alt="Hidravida Logo" 
              className="h-9 md:h-11 object-contain cursor-pointer"
              onClick={onBack}
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
            Matriz Canal
          </h1>
        </div>

        {/* Filtros Superiores */}
        <div className="flex flex-wrap items-center gap-3">
          
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

      {/* 2. CONTENIDO PRINCIPAL: 5 TABLAS DE MATRIZ DE KPIS */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center min-h-[400px] bg-white rounded-2xl border border-slate-200 text-slate-400 font-semibold">
          Cargando métricas de Matriz Canal...
        </div>
      ) : (
        <div className="flex-1 space-y-4">
          
          {/* Fila 1: Share Unidades y Share $ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <KpiMatrixCard
              title="Share Unidades"
              matrix={matrix.share_unds}
              suffix="%"
              decimals={1}
            />
            <KpiMatrixCard
              title="Share $"
              matrix={matrix.share_valor}
              suffix="%"
              decimals={1}
            />
          </div>

          {/* Fila 2: Rotación y Precio */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <KpiMatrixCard
              title="Rotación"
              matrix={matrix.rotacion}
              decimals={2}
            />
            <KpiMatrixCard
              title="Precio"
              matrix={matrix.precio}
              prefix="$"
              decimals={2}
            />
          </div>

          {/* Fila 3: Dist. Numerica */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <KpiMatrixCard
              title="Dist. Numerica"
              matrix={matrix.dist_num}
              decimals={1}
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
