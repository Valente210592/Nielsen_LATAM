import React, { useState, useEffect, useMemo } from 'react';

// Configuración de Marcas para Perú
const PE_BRANDS = [
  { key: 'ELECTROLIFE', logo: '/assets/competencia/Peru/Electrolife.png', name: 'Electrolife' },
  { key: 'SPORADE', logo: '/assets/competencia/Peru/Sporade.png', name: 'Sporade' },
  { key: 'GATORADE', logo: '/assets/competencia/Peru/Gatorade.png', name: 'Gatorade' },
  { key: 'POWERADE', logo: '/assets/competencia/Peru/Powerade.png', name: 'Powerade' },
  { key: 'SUEROX', logo: '/assets/competencia/Peru/Suerox.png', name: 'Suerox' },
  { key: 'DILYTE', logo: '/assets/competencia/Peru/Dilyte.png', name: 'Dilyte' }
];

// Configuración de Canales para Perú
const PE_CHANNELS = [
  { key: 'C&C', label: 'C&C', apiKey: 'Cash & Carry' },
  { key: 'Conveniencia', label: 'Conveniencia', apiKey: 'Conveniencia' },
  { key: 'Sup + Disc', label: 'Sup + Disc', apiKey: 'Supermercados + Discounters' },
  { key: 'Total', label: 'Total', apiKey: 'Total' }
];

// Función para calcular color de celda por fila con la paleta de mapa de calor oficial:
// Inferior: #FD9696 (Rojo/Rosa suave)
// Centro:   #F3F08F (Amarillo suave)
// Superior: #B1EE93 (Verde suave)
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

// Componente para una Tarjeta de Matriz de KPI Individual
function PeruKpiMatrixCard({
  title,
  matrix = {},
  prefix = '',
  suffix = '',
  decimals = 1
}) {
  return (
    <div className="bg-white rounded-2xl border border-blue-200/80 shadow-2xs hover:shadow-xs transition-shadow overflow-hidden flex flex-col">
      {/* Título de la Tarjeta */}
      <div className="py-2.5 px-4 border-b border-blue-100 bg-blue-50/20 text-center">
        <h3 className="font-black text-[#0066c0] text-sm md:text-base tracking-tight">
          {title}
        </h3>
      </div>

      {/* Tabla con Logos y Mapa de Calor por Fila */}
      <div className="overflow-x-auto p-2">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-200/80">
              <th className="w-24 md:w-28 py-1 px-2 text-left"></th>
              {PE_BRANDS.map(b => (
                <th key={b.key} className="py-1.5 px-1.5 text-center align-middle min-w-[70px] md:min-w-[85px]">
                  <div className="h-10 md:h-12 flex items-center justify-center px-1">
                    <img
                      src={b.logo}
                      alt={b.name}
                      className="h-8 md:h-10 w-auto max-w-[80px] object-contain drop-shadow-2xs transition-transform hover:scale-105"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        if (e.target.parentElement) {
                          e.target.parentElement.innerHTML = `<span class="text-[11px] font-black text-slate-700">${b.name}</span>`;
                        }
                      }}
                    />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PE_CHANNELS.map(ch => {
              const rowData = matrix[ch.key] || matrix[ch.label] || {};
              const values = PE_BRANDS.map(b => Number(rowData[b.key] ?? rowData[b.name] ?? 0));
              const minVal = values.length ? Math.min(...values) : 0;
              const maxVal = values.length ? Math.max(...values) : 0;
              const isTotal = ch.key === 'Total';

              return (
                <tr
                  key={ch.key}
                  className={`border-b border-slate-200/70 ${isTotal ? 'border-t border-slate-300' : ''}`}
                >
                  {/* Etiqueta del Canal */}
                  <td className={`py-2 px-2.5 text-xs font-bold text-left tracking-wide whitespace-nowrap ${
                    isTotal ? 'text-slate-900 bg-slate-100/90 font-black' : 'text-slate-800 bg-slate-50/70'
                  }`}>
                    {ch.label}
                  </td>

                  {/* Celdas con Mapa de Calor y Estrella en el Máximo */}
                  {PE_BRANDS.map(b => {
                    const rawVal = Number(rowData[b.key] ?? rowData[b.name] ?? 0);
                    const isMax = rawVal === maxVal && maxVal > 0;
                    const bgColor = getHeatmapColor(rawVal, minVal, maxVal);

                    let formattedVal = rawVal.toFixed(decimals);
                    if (decimals === 0) formattedVal = Math.round(rawVal).toString();
                    if (suffix === '%') formattedVal = `${formattedVal}%`;
                    if (prefix) formattedVal = `${prefix}${formattedVal}`;

                    return (
                      <td
                        key={b.key}
                        style={{ backgroundColor: bgColor }}
                        className={`py-2 px-1 text-center text-xs text-slate-900 border-l border-white/60 select-none ${
                          isTotal ? 'font-black' : 'font-bold'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1 whitespace-nowrap">
                          {isMax && (
                            <span className="text-yellow-600 text-xs leading-none drop-shadow-2xs">⭐</span>
                          )}
                          <span>{formattedVal}</span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// SNAPSHOTS OFICIALES EXACTOS PERÚ
const DEFAULT_PERU_SHARE_UNDS = {
  'C&C': { ELECTROLIFE: 0.1, SPORADE: 65.3, GATORADE: 29.2, POWERADE: 2.9, SUEROX: 0.7, DILYTE: 0.6 },
  'Conveniencia': { ELECTROLIFE: 0.3, SPORADE: 42.7, GATORADE: 24.2, POWERADE: 15.9, SUEROX: 6.3, DILYTE: 5.7 },
  'Sup + Disc': { ELECTROLIFE: 0.6, SPORADE: 49.2, GATORADE: 17.7, POWERADE: 17.9, SUEROX: 5.3, DILYTE: 2.6 },
  'Total': { ELECTROLIFE: 0.3, SPORADE: 56.0, GATORADE: 24.9, POWERADE: 9.9, SUEROX: 3.2, DILYTE: 2.2 }
};

const DEFAULT_PERU_SHARE_VALOR = {
  'C&C': { ELECTROLIFE: 0.2, SPORADE: 66.6, GATORADE: 26.3, POWERADE: 2.8, SUEROX: 1.9, DILYTE: 1.0 },
  'Conveniencia': { ELECTROLIFE: 0.6, SPORADE: 34.4, GATORADE: 22.1, POWERADE: 13.9, SUEROX: 12.9, DILYTE: 7.5 },
  'Sup + Disc': { ELECTROLIFE: 1.6, SPORADE: 41.7, GATORADE: 17.6, POWERADE: 14.9, SUEROX: 12.5, DILYTE: 3.9 },
  'Total': { ELECTROLIFE: 0.7, SPORADE: 49.7, GATORADE: 22.5, POWERADE: 9.6, SUEROX: 8.3, DILYTE: 3.8 }
};

const DEFAULT_PERU_ROTACION = {
  'C&C': { ELECTROLIFE: 3.97, SPORADE: 882.81, GATORADE: 396.98, POWERADE: 41.85, SUEROX: 12.93, DILYTE: 10.31 },
  'Conveniencia': { ELECTROLIFE: 0.50, SPORADE: 14.74, GATORADE: 8.39, POWERADE: 5.46, SUEROX: 2.25, DILYTE: 1.92 },
  'Sup + Disc': { ELECTROLIFE: 2.78, SPORADE: 71.68, GATORADE: 27.73, POWERADE: 26.99, SUEROX: 10.90, DILYTE: 5.64 },
  'Total': { ELECTROLIFE: 2.22, SPORADE: 66.79, GATORADE: 30.29, POWERADE: 11.91, SUEROX: 4.15, DILYTE: 2.83 }
};

const DEFAULT_PERU_PRECIO = {
  'C&C': { ELECTROLIFE: 4.88, SPORADE: 1.82, GATORADE: 1.61, POWERADE: 1.70, SUEROX: 4.86, DILYTE: 2.79 },
  'Conveniencia': { ELECTROLIFE: 6.28, SPORADE: 2.54, GATORADE: 2.88, POWERADE: 2.75, SUEROX: 6.42, DILYTE: 4.17 },
  'Sup + Disc': { ELECTROLIFE: 5.99, SPORADE: 1.99, GATORADE: 2.33, POWERADE: 1.95, SUEROX: 5.53, DILYTE: 3.53 },
  'Total': { ELECTROLIFE: 5.90, SPORADE: 1.98, GATORADE: 2.02, POWERADE: 2.19, SUEROX: 5.83, DILYTE: 3.76 }
};

const DEFAULT_PERU_DIST_NUM = {
  'C&C': { ELECTROLIFE: 24.4, SPORADE: 98.5, GATORADE: 97.7, POWERADE: 91.8, SUEROX: 70.6, DILYTE: 71.4 },
  'Conveniencia': { ELECTROLIFE: 18.0, SPORADE: 99.7, GATORADE: 99.1, POWERADE: 99.0, SUEROX: 97.5, DILYTE: 91.2 },
  'Sup + Disc': { ELECTROLIFE: 30.6, SPORADE: 99.4, GATORADE: 92.8, POWERADE: 96.0, SUEROX: 71.3, DILYTE: 62.3 },
  'Total': { ELECTROLIFE: 21.2, SPORADE: 99.6, GATORADE: 97.6, POWERADE: 98.0, SUEROX: 90.2, DILYTE: 84.1 }
};

const DEFAULT_PERU_SABORES = {
  'C&C': { ELECTROLIFE: 8, SPORADE: 6, GATORADE: 8, POWERADE: 7, SUEROX: 8, DILYTE: 6 },
  'Conveniencia': { ELECTROLIFE: 5, SPORADE: 7, GATORADE: 7, POWERADE: 8, SUEROX: 8, DILYTE: 5 },
  'Sup + Disc': { ELECTROLIFE: 8, SPORADE: 7, GATORADE: 8, POWERADE: 8, SUEROX: 8, DILYTE: 6 },
  'Total': { ELECTROLIFE: 8, SPORADE: 7, GATORADE: 8, POWERADE: 8, SUEROX: 8, DILYTE: 6 }
};

export default function PeruMatrizKpisView({ onBack }) {
  const [anio, setAnio] = useState('Todas');
  const [mes, setMes] = useState('Todos');
  const [loading, setLoading] = useState(false);
  const [apiData, setApiData] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetch(`/api/nielsen/pe/marca-canales?anio=${anio}&mes=${mes}`)
      .then(res => res.json())
      .then(d => {
        if (isMounted) {
          setApiData(d);
          setLoading(false);
        }
      })
      .catch(err => {
        console.warn('Error fetching Peru Matriz KPI data, using fallback snapshots:', err);
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [anio, mes]);

  const shareUnidades = apiData?.matrixShareUnds || DEFAULT_PERU_SHARE_UNDS;
  const shareValor = apiData?.matrixShareValor || DEFAULT_PERU_SHARE_VALOR;
  const rotacion = apiData?.matrixRotacion || DEFAULT_PERU_ROTACION;
  const precio = apiData?.matrixPrecio || DEFAULT_PERU_PRECIO;
  const distNum = apiData?.matrixDistNum || DEFAULT_PERU_DIST_NUM;
  const sabores = apiData?.matrixSabores || DEFAULT_PERU_SABORES;

  return (
    <div className="w-full min-h-screen bg-[#f8fafc] p-4 md:p-6 space-y-4 font-sans text-slate-800">
      
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
            Matriz KPI's
          </h1>
        </div>

        {/* FILTROS SUPERIORES Y BOTÓN HOME */}
        <div className="flex items-center gap-3">
          
          {/* Selector de Año */}
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <span className="text-slate-500 font-semibold">Año:</span>
            <select
              value={anio}
              onChange={(e) => setAnio(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1 text-xs font-bold text-slate-700 outline-hidden cursor-pointer"
            >
              <option value="Todas">Todas</option>
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
            <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-current fill-none stroke-2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. GRID DE 6 MATRICES KPI (2 COLUMNAS X 3 FILAS) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* 1. Share Unidades */}
        <PeruKpiMatrixCard
          title="Share Unidades"
          matrix={shareUnidades}
          suffix="%"
          decimals={1}
        />

        {/* 2. Share $ */}
        <PeruKpiMatrixCard
          title="Share $"
          matrix={shareValor}
          suffix="%"
          decimals={1}
        />

        {/* 3. Rotación */}
        <PeruKpiMatrixCard
          title="Rotación"
          matrix={rotacion}
          decimals={2}
        />

        {/* 4. Precio */}
        <PeruKpiMatrixCard
          title="Precio"
          matrix={precio}
          decimals={2}
        />

        {/* 5. Dist. Num. */}
        <PeruKpiMatrixCard
          title="Dist. Num."
          matrix={distNum}
          suffix="%"
          decimals={1}
        />

        {/* 6. Sabores */}
        <PeruKpiMatrixCard
          title="Sabores"
          matrix={sabores}
          decimals={0}
        />

      </div>

    </div>
  );
}
