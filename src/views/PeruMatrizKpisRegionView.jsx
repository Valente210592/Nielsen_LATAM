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

// Configuración de Regiones para Perú
const PE_REGIONES = [
  { key: 'Arequipa', label: 'Arequipa' },
  { key: 'Chiclayo', label: 'Chiclayo' },
  { key: 'Ica', label: 'Ica' },
  { key: 'Lima', label: 'Lima' },
  { key: 'Piura', label: 'Piura' },
  { key: 'Provincias', label: 'Provincias' },
  { key: 'Resto Peru Norte', label: 'Resto Peru Norte' },
  { key: 'Resto Peru Sur', label: 'Resto Peru Sur' },
  { key: 'Trujillo + Chimbote', label: 'Trujillo + Chimbote' },
  { key: 'Total', label: 'Total' }
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

// Componente para una Tarjeta de Matriz de KPI Regional
function PeruKpiMatrixRegionCard({
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
              <th className="w-28 md:w-32 py-1 px-2 text-left"></th>
              {PE_BRANDS.map(b => (
                <th key={b.key} className="py-1.5 px-1 text-center align-middle min-w-[65px] md:min-w-[80px]">
                  <div className="h-9 md:h-11 flex items-center justify-center px-0.5">
                    <img
                      src={b.logo}
                      alt={b.name}
                      className="h-7 md:h-9 w-auto max-w-[75px] object-contain drop-shadow-2xs transition-transform hover:scale-105"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        if (e.target.parentElement) {
                          e.target.parentElement.innerHTML = `<span class="text-[10px] font-black text-slate-700">${b.name}</span>`;
                        }
                      }}
                    />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PE_REGIONES.map(reg => {
              const rowData = matrix[reg.key] || matrix[reg.label] || {};
              const numValues = PE_BRANDS.map(b => {
                const val = rowData[b.key] ?? rowData[b.name];
                return (val !== undefined && val !== null && !isNaN(val) && typeof val === 'number') ? val : null;
              }).filter(v => v !== null);

              const minVal = numValues.length ? Math.min(...numValues) : 0;
              const maxVal = numValues.length ? Math.max(...numValues) : 0;
              const isTotal = reg.key === 'Total';

              return (
                <tr
                  key={reg.key}
                  className={`border-b border-slate-200/70 ${isTotal ? 'border-t-2 border-slate-300' : ''}`}
                >
                  {/* Etiqueta de la Región */}
                  <td className={`py-1.5 px-2 text-[11px] font-bold text-left tracking-tight whitespace-nowrap ${
                    isTotal ? 'text-slate-900 bg-slate-100/90 font-black' : 'text-slate-800 bg-slate-50/70'
                  }`}>
                    {reg.label}
                  </td>

                  {/* Celdas con Mapa de Calor y Estrella en el Máximo */}
                  {PE_BRANDS.map(b => {
                    const raw = rowData[b.key] ?? rowData[b.name];
                    const isNullVal = raw === null || raw === undefined || raw === '-';
                    const rawVal = isNullVal ? null : Number(raw);

                    if (isNullVal || rawVal === null || isNaN(rawVal)) {
                      return (
                        <td
                          key={b.key}
                          className="py-1.5 px-1 text-center text-[11px] font-bold text-slate-400 bg-slate-50/50 border-l border-white/60 select-none"
                        >
                          -
                        </td>
                      );
                    }

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
                        className={`py-1.5 px-1 text-center text-[11px] text-slate-900 border-l border-white/60 select-none ${
                          isTotal ? 'font-black' : 'font-bold'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-0.5 whitespace-nowrap">
                          {isMax && (
                            <span className="text-yellow-600 text-[10px] leading-none drop-shadow-2xs">⭐</span>
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

// SNAPSHOTS OFICIALES EXACTOS PARA MATRIZ REGIONAL DE PERÚ
const DEFAULT_PERU_REG_SHARE_UNDS = {
  'Arequipa': { ELECTROLIFE: 0.4, SPORADE: 7.2, GATORADE: 5.0, POWERADE: 76.2, SUEROX: 3.8, DILYTE: 2.5 },
  'Chiclayo': { ELECTROLIFE: 0.4, SPORADE: 61.1, GATORADE: 8.3, POWERADE: 16.0, SUEROX: 3.5, DILYTE: 4.9 },
  'Ica': { ELECTROLIFE: 0.3, SPORADE: 48.5, GATORADE: 6.2, POWERADE: 31.6, SUEROX: 2.9, DILYTE: 5.3 },
  'Lima': { ELECTROLIFE: 0.5, SPORADE: 43.1, GATORADE: 20.2, POWERADE: 15.2, SUEROX: 6.7, DILYTE: 7.8 },
  'Piura': { ELECTROLIFE: 0.1, SPORADE: 62.6, GATORADE: 17.8, POWERADE: 10.0, SUEROX: 2.0, DILYTE: 3.6 },
  'Provincias': { ELECTROLIFE: 0.0, SPORADE: 32.8, GATORADE: 23.6, POWERADE: 23.3, SUEROX: 6.4, DILYTE: 6.8 },
  'Resto Peru Norte': { ELECTROLIFE: 0.2, SPORADE: 66.4, GATORADE: 8.4, POWERADE: 13.1, SUEROX: 2.6, DILYTE: 3.8 },
  'Resto Peru Sur': { ELECTROLIFE: 0.6, SPORADE: 30.1, GATORADE: 10.8, POWERADE: 40.7, SUEROX: 4.9, DILYTE: 4.8 },
  'Trujillo + Chimbote': { ELECTROLIFE: 0.3, SPORADE: 69.2, GATORADE: 9.3, POWERADE: 10.6, SUEROX: 3.7, DILYTE: 2.9 },
  'Total': { ELECTROLIFE: 0.5, SPORADE: 44.0, GATORADE: 17.8, POWERADE: 18.8, SUEROX: 5.8, DILYTE: 6.8 }
};

const DEFAULT_PERU_REG_SHARE_VALOR = {
  'Arequipa': { ELECTROLIFE: 1.3, SPORADE: 8.7, GATORADE: 6.7, POWERADE: 61.1, SUEROX: 10.7, DILYTE: 4.7 },
  'Chiclayo': { ELECTROLIFE: 1.0, SPORADE: 51.7, GATORADE: 9.5, POWERADE: 14.6, SUEROX: 8.9, DILYTE: 7.6 },
  'Ica': { ELECTROLIFE: 0.8, SPORADE: 42.4, GATORADE: 7.4, POWERADE: 27.1, SUEROX: 7.6, DILYTE: 8.3 },
  'Lima': { ELECTROLIFE: 1.1, SPORADE: 33.7, GATORADE: 19.4, POWERADE: 12.3, SUEROX: 13.5, DILYTE: 10.4 },
  'Piura': { ELECTROLIFE: 0.2, SPORADE: 55.6, GATORADE: 19.1, POWERADE: 9.5, SUEROX: 4.6, DILYTE: 5.3 },
  'Provincias': { ELECTROLIFE: 0.0, SPORADE: 25.2, GATORADE: 23.2, POWERADE: 18.9, SUEROX: 12.6, DILYTE: 8.4 },
  'Resto Peru Norte': { ELECTROLIFE: 0.6, SPORADE: 59.0, GATORADE: 9.3, POWERADE: 12.1, SUEROX: 6.9, DILYTE: 6.2 },
  'Resto Peru Sur': { ELECTROLIFE: 1.5, SPORADE: 27.4, GATORADE: 12.0, POWERADE: 29.1, SUEROX: 12.3, DILYTE: 7.6 },
  'Trujillo + Chimbote': { ELECTROLIFE: 0.7, SPORADE: 58.5, GATORADE: 11.0, POWERADE: 9.9, SUEROX: 9.5, DILYTE: 4.7 },
  'Total': { ELECTROLIFE: 1.0, SPORADE: 35.1, GATORADE: 18.1, POWERADE: 14.6, SUEROX: 12.6, DILYTE: 9.5 }
};

const DEFAULT_PERU_REG_ROTACION = {
  'Arequipa': { ELECTROLIFE: 2.96, SPORADE: 25.61, GATORADE: 17.58, POWERADE: 269.79, SUEROX: 13.84, DILYTE: 9.16 },
  'Chiclayo': { ELECTROLIFE: 1.91, SPORADE: 102.69, GATORADE: 19.29, POWERADE: 26.98, SUEROX: 8.12, DILYTE: 10.29 },
  'Ica': { ELECTROLIFE: 2.09, SPORADE: 108.59, GATORADE: 20.49, POWERADE: 70.42, SUEROX: 12.29, DILYTE: 13.02 },
  'Lima': { ELECTROLIFE: 4.75, SPORADE: 25.73, GATORADE: 12.19, POWERADE: 9.13, SUEROX: 4.21, DILYTE: 4.85 },
  'Piura': { ELECTROLIFE: 1.07, SPORADE: 67.68, GATORADE: 20.63, POWERADE: 11.01, SUEROX: 8.93, DILYTE: 9.86 },
  'Provincias': { ELECTROLIFE: '-', SPORADE: 9.95, GATORADE: 7.31, POWERADE: 7.10, SUEROX: 2.01, DILYTE: 2.19 },
  'Resto Peru Norte': { ELECTROLIFE: 1.36, SPORADE: 145.49, GATORADE: 23.77, POWERADE: 29.07, SUEROX: 8.69, DILYTE: 9.30 },
  'Resto Peru Sur': { ELECTROLIFE: 3.03, SPORADE: 96.79, GATORADE: 38.13, POWERADE: 130.59, SUEROX: 18.35, DILYTE: 16.06 },
  'Trujillo + Chimbote': { ELECTROLIFE: 1.74, SPORADE: 152.40, GATORADE: 23.58, POWERADE: 23.37, SUEROX: 9.48, DILYTE: 10.36 },
  'Total': { ELECTROLIFE: 3.97, SPORADE: 30.04, GATORADE: 12.44, POWERADE: 12.93, SUEROX: 4.34, DILYTE: 4.91 }
};

const DEFAULT_PERU_REG_PRECIO = {
  'Arequipa': { ELECTROLIFE: 5.77, SPORADE: 2.28, GATORADE: 2.57, POWERADE: 1.52, SUEROX: 5.36, DILYTE: 3.52 },
  'Chiclayo': { ELECTROLIFE: 5.94, SPORADE: 1.82, GATORADE: 2.47, POWERADE: 1.97, SUEROX: 5.49, DILYTE: 3.30 },
  'Ica': { ELECTROLIFE: 5.95, SPORADE: 1.83, GATORADE: 2.50, POWERADE: 1.79, SUEROX: 5.41, DILYTE: 3.32 },
  'Lima': { ELECTROLIFE: 5.96, SPORADE: 2.31, GATORADE: 2.83, POWERADE: 2.39, SUEROX: 5.98, DILYTE: 3.90 },
  'Piura': { ELECTROLIFE: 5.64, SPORADE: 2.07, GATORADE: 2.50, POWERADE: 2.22, SUEROX: 5.50, DILYTE: 3.50 },
  'Provincias': { ELECTROLIFE: '-', SPORADE: 2.49, GATORADE: 3.18, POWERADE: 2.63, SUEROX: 6.37, DILYTE: 4.05 },
  'Resto Peru Norte': { ELECTROLIFE: 5.74, SPORADE: 1.83, GATORADE: 2.28, POWERADE: 1.91, SUEROX: 5.44, DILYTE: 3.34 },
  'Resto Peru Sur': { ELECTROLIFE: 5.89, SPORADE: 1.98, GATORADE: 2.41, POWERADE: 1.56, SUEROX: 5.44, DILYTE: 3.42 },
  'Trujillo + Chimbote': { ELECTROLIFE: 5.80, SPORADE: 1.78, GATORADE: 2.47, POWERADE: 1.97, SUEROX: 5.43, DILYTE: 3.42 },
  'Total': { ELECTROLIFE: 5.94, SPORADE: 2.20, GATORADE: 2.80, POWERADE: 2.14, SUEROX: 5.92, DILYTE: 3.83 }
};

const DEFAULT_PERU_REG_DIST_NUM = {
  'Arequipa': { ELECTROLIFE: 53.9, SPORADE: 100.0, GATORADE: 100.0, POWERADE: 100.0, SUEROX: 97.6, DILYTE: 97.3 },
  'Chiclayo': { ELECTROLIFE: 32.1, SPORADE: 100.0, GATORADE: 72.5, POWERADE: 100.0, SUEROX: 72.7, DILYTE: 81.0 },
  'Ica': { ELECTROLIFE: 30.0, SPORADE: 99.1, GATORADE: 67.1, POWERADE: 99.5, SUEROX: 52.8, DILYTE: 90.4 },
  'Lima': { ELECTROLIFE: 6.9, SPORADE: 99.7, GATORADE: 98.6, POWERADE: 98.7, SUEROX: 93.8, DILYTE: 95.5 },
  'Piura': { ELECTROLIFE: 6.9, SPORADE: 100.0, GATORADE: 93.4, POWERADE: 98.3, SUEROX: 23.7, DILYTE: 50.2 },
  'Provincias': { ELECTROLIFE: 0.0, SPORADE: 99.8, GATORADE: 97.9, POWERADE: 99.4, SUEROX: 96.5, DILYTE: 92.1 },
  'Resto Peru Norte': { ELECTROLIFE: 33.8, SPORADE: 100.0, GATORADE: 77.5, POWERADE: 98.3, SUEROX: 65.6, DILYTE: 89.4 },
  'Resto Peru Sur': { ELECTROLIFE: 56.7, SPORADE: 100.0, GATORADE: 91.4, POWERADE: 100.0, SUEROX: 86.6, DILYTE: 96.3 },
  'Trujillo + Chimbote': { ELECTROLIFE: 32.1, SPORADE: 96.4, GATORADE: 84.4, POWERADE: 96.4, SUEROX: 82.3, DILYTE: 59.3 },
  'Total': { ELECTROLIFE: 9.3, SPORADE: 99.7, GATORADE: 97.4, POWERADE: 98.8, SUEROX: 91.8, DILYTE: 93.6 }
};

const DEFAULT_PERU_REG_SABORES = {
  'Arequipa': { ELECTROLIFE: 9, SPORADE: 12, GATORADE: 13, POWERADE: 15, SUEROX: 11, DILYTE: 9 },
  'Chiclayo': { ELECTROLIFE: 8, SPORADE: 12, GATORADE: 13, POWERADE: 14, SUEROX: 11, DILYTE: 8 },
  'Ica': { ELECTROLIFE: 7, SPORADE: 12, GATORADE: 13, POWERADE: 13, SUEROX: 11, DILYTE: 9 },
  'Lima': { ELECTROLIFE: 9, SPORADE: 24, GATORADE: 28, POWERADE: 39, SUEROX: 17, DILYTE: 14 },
  'Piura': { ELECTROLIFE: 9, SPORADE: 12, GATORADE: 14, POWERADE: 14, SUEROX: 11, DILYTE: 9 },
  'Provincias': { ELECTROLIFE: '-', SPORADE: 18, GATORADE: 13, POWERADE: 23, SUEROX: 11, DILYTE: 10 },
  'Resto Peru Norte': { ELECTROLIFE: 9, SPORADE: 12, GATORADE: 13, POWERADE: 16, SUEROX: 11, DILYTE: 9 },
  'Resto Peru Sur': { ELECTROLIFE: 8, SPORADE: 13, GATORADE: 13, POWERADE: 17, SUEROX: 11, DILYTE: 9 },
  'Trujillo + Chimbote': { ELECTROLIFE: 9, SPORADE: 11, GATORADE: 13, POWERADE: 17, SUEROX: 11, DILYTE: 9 },
  'Total': { ELECTROLIFE: 9, SPORADE: 24, GATORADE: 28, POWERADE: 42, SUEROX: 17, DILYTE: 14 }
};

export default function PeruMatrizKpisRegionView({ onBack }) {
  const [anio, setAnio] = useState('2026');
  const [mes, setMes] = useState('Selección múltiple');
  const [loading, setLoading] = useState(false);
  const [apiData, setApiData] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetch(`/api/nielsen/pe/marca-regiones?anio=${anio}&mes=${mes}`)
      .then(res => res.json())
      .then(d => {
        if (isMounted) {
          setApiData(d);
          setLoading(false);
        }
      })
      .catch(err => {
        console.warn('Error fetching Peru Matriz Regiones data, using fallback snapshots:', err);
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [anio, mes]);

  const shareUnidades = apiData?.matrixShareUnds || DEFAULT_PERU_REG_SHARE_UNDS;
  const shareValor = apiData?.matrixShareValor || DEFAULT_PERU_REG_SHARE_VALOR;
  const rotacion = apiData?.matrixRotacion || DEFAULT_PERU_REG_ROTACION;
  const precio = apiData?.matrixPrecio || DEFAULT_PERU_REG_PRECIO;
  const distNum = apiData?.matrixDistNum || DEFAULT_PERU_REG_DIST_NUM;
  const sabores = apiData?.matrixSabores || DEFAULT_PERU_REG_SABORES;

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
        <div className="text-center flex-1 min-w-[220px]">
          <h1 className="text-lg md:text-2xl font-black text-[#0066c0] tracking-tight">
            Matriz KPI's - Sup + Disc + Conv
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
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="Todas">Todas</option>
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
              <option value="Selección múltiple">Selección múltiple</option>
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
      {/* 2. GRID DE 6 MATRICES KPI REGIONALES (2 COLUMNAS X 3 FILAS) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* 1. Share Unidades */}
        <PeruKpiMatrixRegionCard
          title="Share Unidades"
          matrix={shareUnidades}
          suffix="%"
          decimals={1}
        />

        {/* 2. Share $ */}
        <PeruKpiMatrixRegionCard
          title="Share $"
          matrix={shareValor}
          suffix="%"
          decimals={1}
        />

        {/* 3. Rotación */}
        <PeruKpiMatrixRegionCard
          title="Rotación"
          matrix={rotacion}
          decimals={2}
        />

        {/* 4. Precio */}
        <PeruKpiMatrixRegionCard
          title="Precio"
          matrix={precio}
          decimals={2}
        />

        {/* 5. Dist. Num. */}
        <PeruKpiMatrixRegionCard
          title="Dist. Num."
          matrix={distNum}
          suffix="%"
          decimals={1}
        />

        {/* 6. Sabores */}
        <PeruKpiMatrixRegionCard
          title="Sabores"
          matrix={sabores}
          decimals={0}
        />

      </div>

    </div>
  );
}
