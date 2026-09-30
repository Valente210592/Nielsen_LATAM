import React, { useState, useEffect, useMemo } from 'react';
import { Home, RefreshCw } from 'lucide-react';

const BRANDS = [
  { key: 'Electrolit', logo: '/assets/competencia/Costa Rica/Electrolit.png', name: 'Electrolit' },
  { key: 'Electrolife', logo: '/assets/competencia/Costa Rica/Electrolife.png', name: 'Electrolife' },
  { key: 'Gatorade', logo: '/assets/competencia/Costa Rica/Gatorade.png', name: 'Gatorade' },
  { key: 'Gatorlyte', logo: '/assets/competencia/Costa Rica/Gatorlyte.png', name: 'Gatorlyte' },
  { key: 'Powerade', logo: '/assets/competencia/Costa Rica/Powerade.png', name: 'Powerade' },
  { key: 'Suerox', logo: '/assets/competencia/Costa Rica/Suerox.png', name: 'Suerox' },
  { key: 'Prime', logo: '/assets/competencia/Costa Rica/Prime.png', name: 'Prime' }
];

const CHANNELS = [
  { key: 'MODERNO', label: 'MODERNO' },
  { key: 'TRADICIONAL', label: 'TRADICIONAL' },
  { key: 'TOTAL', label: 'TOTAL' }
];

// Función para calcular color de celda por fila con la paleta exacta:
// Inferior: #FD9696 (253, 150, 150)
// Centro:   #F3F08F (243, 240, 143)
// Superior: #B1EE93 (177, 238, 147)
function getHeatmapColor(val, min, max) {
  if (val === null || val === undefined || isNaN(val)) return '#ffffff';
  if (max === min) return '#F3F08F';
  
  const t = Math.max(0, Math.min(1, (val - min) / (max - min)));

  let r, g, b;
  if (t < 0.5) {
    // Interpolar de Inferior (#FD9696) a Centro (#F3F08F)
    const localT = t / 0.5;
    r = Math.round(253 + (243 - 253) * localT);
    g = Math.round(150 + (240 - 150) * localT);
    b = Math.round(150 + (143 - 150) * localT);
  } else {
    // Interpolar de Centro (#F3F08F) a Superior (#B1EE93)
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
              {BRANDS.map(b => (
                <th key={b.key} className="py-3 px-2 text-center align-middle min-w-[85px] md:min-w-[95px]">
                  <div className="h-14 md:h-16 flex items-center justify-center px-1">
                    <img 
                      src={b.logo} 
                      alt={b.name} 
                      className="h-12 md:h-14 w-auto max-w-[95px] object-contain drop-shadow-xs transition-transform hover:scale-105"
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
              const values = BRANDS.map(b => Number(rowData[b.key] || 0));
              const minVal = Math.min(...values);
              const maxVal = Math.max(...values);
              const isTotal = ch.key === 'TOTAL';

              return (
                <React.Fragment key={ch.key}>
                  {/* Fila en blanco de separación antes de TOTAL */}
                  {isTotal && (
                    <tr className="h-3.5">
                      <td colSpan={8} className="p-0 border-0 bg-transparent"></td>
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
                    {BRANDS.map(b => {
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
                          className={`py-2.5 px-1.5 text-center font-normal text-[13.5px] md:text-[14.5px] text-slate-900 border-l border-white/60 select-none ${isTotal ? 'font-medium' : ''}`}
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

export default function MatrizKpisView({ onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [anio, setAnio] = useState('2026');
  const [mes, setMes] = useState('Todas');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/nielsen/cr/matriz-kpis?anio=${anio}&mes=${mes}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Error cargando datos de Matriz KPI:', err);
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
      {/* 1. CABECERA SUPERIOR HOMOLOGADA */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-3.5 md:p-4.5 flex flex-wrap items-center justify-between gap-4">
        
        {/* Logos & Título */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <img 
              src="/assets/LOGOS/Electrolit-color.png" 
              alt="Electrolit Logo" 
              className="h-9 md:h-11 object-contain cursor-pointer"
              onClick={onBack}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="hidden text-2xl font-black italic tracking-wide text-[#004B93] cursor-pointer" onClick={onBack}>
              Electrolit
            </div>

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

        {/* Filtros Superiores Homologados */}
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
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs cursor-pointer"
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
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs cursor-pointer"
            >
              {monthOptions.map(m => (
                <option key={m.id} value={m.id}>{m.label || m.name}</option>
              ))}
            </select>
          </div>

          {/* Botón Home */}
          <button
            onClick={onBack}
            title="Volver a la Portada"
            className="p-2 text-slate-500 hover:text-[#004B93] hover:bg-slate-100 rounded-lg transition-colors ml-1 border border-slate-200 shadow-xs"
          >
            <Home className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 text-[#0066c0] animate-spin" />
            <span className="text-sm font-semibold text-slate-500">Consultando BigQuery y calculando mapa de calor...</span>
          </div>
        </div>
      )}

      {/* Grid de Matrices de KPIs */}
      {!loading && (
        <div className="flex-1 flex flex-col gap-4 w-full">
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
              decimals={2} 
            />
            {/* Espacio reservado para futuras métricas o balance visual */}
            <div className="hidden lg:flex items-center justify-center bg-blue-50/10 rounded-xl border border-dashed border-blue-200/50 p-4">
              <span className="text-xs font-semibold text-slate-400 italic">Matriz Comparativa de Marcas y Canales</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
