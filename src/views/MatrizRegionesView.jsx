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

const REGIONS = [
  { key: 'ATLANTICO', label: 'ATLANTICO' },
  { key: 'CENTRAL', label: 'CENTRAL' },
  { key: 'METRO', label: 'METRO' },
  { key: 'NORTE', label: 'NORTE' },
  { key: 'SUR', label: 'SUR' },
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

// Componente para una Tabla de KPI por Región
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
            {REGIONS.map(reg => {
              const rowData = matrix[reg.key] || {};
              const values = BRANDS.map(b => Number(rowData[b.key] || 0));
              const minVal = Math.min(...values);
              const maxVal = Math.max(...values);
              const isTotal = reg.key === 'TOTAL';

              return (
                <React.Fragment key={reg.key}>
                  {/* Fila en blanco de separación antes de TOTAL */}
                  {isTotal && (
                    <tr className="h-3.5">
                      <td colSpan={8} className="p-0 border-0 bg-transparent"></td>
                    </tr>
                  )}
                  <tr 
                    className={`border-b border-slate-200/70 ${isTotal ? 'border-t border-slate-200 shadow-2xs' : ''}`}
                  >
                    {/* Etiqueta de la Región en Negritas */}
                    <td className={`py-2 px-3 text-[13px] md:text-[14px] font-bold text-left tracking-wide ${isTotal ? 'text-slate-900 bg-slate-100/90 font-black' : 'text-slate-800 bg-slate-50/70'}`}>
                      {reg.label}
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
                          className={`py-2 px-1 text-center font-normal text-[13.5px] md:text-[14.5px] text-slate-900 border-l border-white/60 select-none ${isTotal ? 'font-medium' : ''}`}
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

export default function MatrizRegionesView({ onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [anio, setAnio] = useState('2026');
  const [mes, setMes] = useState('Todas');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/nielsen/cr/matriz-regiones?anio=${anio}&mes=${mes}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Error al cargar datos de Matriz Regiones:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [anio, mes]);

  const availableMonths = useMemo(() => {
    return data?.availableMonthsByYear?.[anio] || (
      anio === '2026' ? [
        { id: 'Todas', label: 'Todas' },
        { id: '1', label: 'Enero' },
        { id: '2', label: 'Febrero' },
        { id: '3', label: 'Marzo' },
        { id: '4', label: 'Abril' },
        { id: '5', label: 'Mayo' },
        { id: '6', label: 'Junio' },
        { id: '7', label: 'Julio' },
        { id: '8', label: 'Agosto' }
      ] : [
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
      ]
    );
  }, [anio, data]);

  return (
    <div className="w-full bg-[#f3f6f9] p-4 md:p-6 space-y-5 select-none font-sans min-h-screen">
      
      {/* HEADER HOMOLOGADO */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white px-6 py-3.5 rounded-xl border border-slate-200/80 shadow-xs">
        
        {/* LOGOS Y TÍTULO */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <img 
              src="/assets/LOGOS/Electrolit-color.png" 
              alt="Electrolit" 
              className="h-8 md:h-9 object-contain"
            />
            <div className="h-6 w-px bg-slate-300" />
            <img 
              src="/assets/LOGOS/Nielsen-logo.png" 
              alt="Nielsen" 
              className="h-7 md:h-8 object-contain"
            />
          </div>

          <h1 className="text-xl md:text-2xl font-bold text-[#0066c0] tracking-tight ml-2">
            Matriz Regiones
          </h1>
        </div>

        {/* FILTROS Y BOTÓN HOME */}
        <div className="flex items-center gap-4">
          
          {/* Selector de Año */}
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <span className="text-slate-500 font-semibold">Año:</span>
            <select
              value={anio}
              onChange={e => {
                const newYr = e.target.value;
                setAnio(newYr);
                setMes('Todas');
              }}
              className="bg-slate-50 border border-slate-300 rounded-md px-3 py-1.5 text-xs font-bold text-slate-700 outline-hidden cursor-pointer hover:border-slate-400 focus:ring-1 focus:ring-blue-500"
            >
              {(data?.availableYears || ['2026', '2025', '2024']).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Selector de Mes Dinámico */}
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <span className="text-slate-500 font-semibold">Mes:</span>
            <select
              value={mes}
              onChange={e => setMes(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-md px-3 py-1.5 text-xs font-bold text-slate-700 outline-hidden cursor-pointer hover:border-slate-400 focus:ring-1 focus:ring-blue-500"
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
            className="p-2 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-[#0066c0] transition cursor-pointer shadow-2xs ml-2"
          >
            <Home className="w-5 h-5" />
          </button>
        </div>

      </div>

      {/* CONTENIDO PRINCIPAL: 5 TABLAS DE MATRIZ DE KPIS */}
      {loading && !data ? (
        <div className="p-24 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
          <RefreshCw className="w-10 h-10 animate-spin mx-auto mb-3 text-[#0066c0]" />
          <p className="font-semibold text-slate-600">Calculando métricas regionales en BigQuery...</p>
          <span className="text-xs text-slate-400">Share Unidades, Share $, Rotación, Precio y Dist. Numérica</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          
          {/* Fila 1: Share Unidades (Izquierda) */}
          <KpiMatrixCard 
            title="Share Unidades" 
            matrix={data?.matrix?.share_unds || {}} 
            suffix="%" 
            decimals={1} 
          />

          {/* Fila 1: Share $ (Derecha) */}
          <KpiMatrixCard 
            title="Share $" 
            matrix={data?.matrix?.share_valor || {}} 
            suffix="%" 
            decimals={1} 
          />

          {/* Fila 2: Rotación (Izquierda) */}
          <KpiMatrixCard 
            title="Rotación" 
            matrix={data?.matrix?.rotacion || {}} 
            decimals={2} 
          />

          {/* Fila 2: Precio (Derecha) */}
          <KpiMatrixCard 
            title="Precio" 
            matrix={data?.matrix?.precio || {}} 
            prefix="$" 
            decimals={2} 
          />

          {/* Fila 3: Dist. Numérica (Izquierda) */}
          <div className="lg:col-span-1">
            <KpiMatrixCard 
              title="Dist. Numerica" 
              matrix={data?.matrix?.dist_num || {}} 
              decimals={2} 
            />
          </div>

        </div>
      )}

    </div>
  );
}
