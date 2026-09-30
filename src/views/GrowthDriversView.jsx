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

function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return '-';
  return Math.round(num).toLocaleString('en-US');
}

function formatPercent(num) {
  if (num === null || num === undefined || isNaN(num)) return '-';
  return `${num > 0 ? '' : ''}${num.toFixed(1)}%`;
}

// Formateador de moneda en miles / millones
function formatCurrency(num) {
  if (num === null || num === undefined || isNaN(num)) return '-';
  return `$${Math.round(num).toLocaleString('en-US')}`;
}

export default function GrowthDriversView({ onBack }) {
  const [anio, setAnio] = useState('2026');
  const [mes, setMes] = useState('Todas');
  const [selectedMarca, setSelectedMarca] = useState('ELECTROLIT');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const url = `/api/nielsen/cr/growth-drivers?anio=${anio}&mes=${mes}&marca=${selectedMarca}`;

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return res.json();
      })
      .then(json => {
        if (isMounted) {
          setData(json);
          setLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          console.error('Error fetching growth drivers:', err);
          setError(err.message);
          setLoading(false);
        }
      });

    return () => { isMounted = false; };
  }, [anio, mes, selectedMarca]);

  const handleAnioChange = (newAnio) => {
    setAnio(newAnio);
    setMes('Todas');
  };

  const mesesDisponibles = useMemo(() => {
    if (!data?.mesesPorAnio) return [{ id: 'Todas', label: 'Todas' }];
    return data.mesesPorAnio[anio] || [{ id: 'Todas', label: 'Todas' }];
  }, [data, anio]);

  return (
    <div className="min-h-screen bg-[#f4f7fa] flex flex-col font-sans pb-12">
      {/* HEADER HOMOLOGADO */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40 shadow-xs">
        {/* LOGOS ELECTROLIT | NIELSEN */}
        <div className="flex items-center gap-3">
          <img 
            src="/assets/LOGOS/Electrolit-color.png" 
            alt="Electrolit Logo" 
            className="h-8 md:h-9 object-contain"
          />
          <div className="h-6 w-px bg-slate-300" />
          <img 
            src="/assets/LOGOS/Nielsen-logo.png" 
            alt="Nielsen Logo" 
            className="h-7 md:h-8 object-contain"
          />
        </div>

        {/* TITULO CENTRAL */}
        <div className="flex-1 text-center min-w-[200px]">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#0066c0]">
            Growth Drivers
          </h1>
        </div>

        {/* SELECTORES Y BOTON HOME */}
        <div className="flex items-center gap-3">
          {/* SELECTOR MARCA */}
          <div className="flex flex-col items-start">
            <span className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">Marca</span>
            <select
              value={selectedMarca}
              onChange={(e) => setSelectedMarca(e.target.value)}
              className="bg-white border border-slate-300 rounded-sm text-xs font-semibold px-2 py-1 text-slate-700 shadow-xs hover:border-slate-400 focus:outline-hidden focus:ring-1 focus:ring-sky-500 cursor-pointer min-w-[120px]"
            >
              {(data?.marcasDisponibles || [
                { id: 'ELECTROLIT', label: 'ELECTROLIT' },
                { id: 'ELECTROLIFE', label: 'ELECTROLIFE' },
                { id: 'GATORADE', label: 'GATORADE' },
                { id: 'GATORLYTE', label: 'GATORLYTE' },
                { id: 'POWERADE', label: 'POWERADE' },
                { id: 'SUEROX', label: 'SUEROX' },
                { id: 'PRIME', label: 'PRIME' }
              ]).map(b => (
                <option key={b.id} value={b.id}>{b.label}</option>
              ))}
            </select>
          </div>

          {/* SELECTOR AÑO */}
          <div className="flex flex-col items-start">
            <span className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">Año</span>
            <select
              value={anio}
              onChange={(e) => handleAnioChange(e.target.value)}
              className="bg-white border border-slate-300 rounded-sm text-xs font-semibold px-2 py-1 text-slate-700 shadow-xs hover:border-slate-400 focus:outline-hidden focus:ring-1 focus:ring-sky-500 cursor-pointer"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>

          {/* SELECTOR MES */}
          <div className="flex flex-col items-start">
            <span className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">Mes</span>
            <select
              value={mes}
              onChange={(e) => setMes(e.target.value)}
              className="bg-white border border-slate-300 rounded-sm text-xs font-semibold px-2 py-1 text-slate-700 shadow-xs hover:border-slate-400 focus:outline-hidden focus:ring-1 focus:ring-sky-500 cursor-pointer min-w-[90px]"
            >
              {mesesDisponibles.map(m => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* BOTON HOME */}
          <div className="flex flex-col items-start justify-end pt-3">
            <button
              onClick={onBack}
              title="Regresar a Portada"
              className="p-1.5 rounded-sm hover:bg-slate-100 text-[#0066c0] hover:text-[#00509e] transition-colors"
            >
              <Home className="w-5 h-5 stroke-[2.2]" />
            </button>
          </div>
        </div>
      </header>

      {/* CONTENEDOR PRINCIPAL */}
      <main className="max-w-[1700px] w-full mx-auto px-4 py-5 flex flex-col gap-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[500px] gap-3">
            <RefreshCw className="w-8 h-8 text-sky-600 animate-spin" />
            <p className="text-slate-600 text-sm font-semibold">Calculando Drivers de Crecimiento en BigQuery...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700">
            <p className="font-bold">Error al cargar datos</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        ) : (
          <>
            {/* ============================================================== */}
            {/* BLOQUE 1: UNIDADES (VOLUMEN)                                   */}
            {/* ============================================================== */}
            <div className="flex flex-col gap-5">
              {/* TABLA 1: MATRIZ IMPACTO YTD UND (MARCAS-YTD) */}
              <div className="bg-white rounded-xl border border-sky-200 shadow-xs p-4 flex flex-col gap-3">
                <h2 className="text-center font-bold text-[#0066c0] text-sm md:text-base tracking-wide uppercase">
                  MATRIZ IMPACTO YTD UND (MARCAS-YTD)
                </h2>

                <div className="overflow-x-auto">
                  <table className="w-full text-center border-collapse">
                    <thead>
                      <tr className="border-b border-sky-200">
                        <th className="py-2 px-3 text-left w-32"></th>
                        {BRANDS.map(b => (
                          <th key={b.key} colSpan={2} className="py-3 px-2 border-l border-sky-100 text-center">
                            <div className="flex flex-col items-center justify-center min-h-[50px] p-1">
                              <img
                                src={b.logo}
                                alt={b.name}
                                className="h-12 md:h-14 w-auto max-w-[105px] object-contain drop-shadow-xs transition-transform hover:scale-105"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                            </div>
                          </th>
                        ))}
                      </tr>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600">
                        <th className="py-1.5 px-3 text-left">Impactos</th>
                        {BRANDS.map(b => (
                          <React.Fragment key={b.key}>
                            <th className="py-1 px-1 border-l border-slate-200 w-16 text-slate-700">Dif. LY</th>
                            <th className="py-1 px-1 w-14 text-slate-700">Vs LY</th>
                          </React.Fragment>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="text-xs">
                      {/* FILA DISTRIBUCION */}
                      <tr className="border-b border-slate-100 hover:bg-sky-50/40 transition-colors">
                        <td className="py-2 px-3 text-left font-bold text-slate-800">Distribución</td>
                        {BRANDS.map(b => {
                          const val = data?.marcasYtdUnd?.[b.key]?.dist;
                          return (
                            <React.Fragment key={b.key}>
                              <td className="py-2 px-1 border-l border-slate-100 font-semibold text-slate-800">
                                {formatNumber(val?.dif)}
                              </td>
                              <td className="py-2 px-1 font-semibold text-slate-600">
                                {formatPercent(val?.vsLy)}
                              </td>
                            </React.Fragment>
                          );
                        })}
                      </tr>

                      {/* FILA ROTACION */}
                      <tr className="border-b border-slate-100 hover:bg-sky-50/40 transition-colors">
                        <td className="py-2 px-3 text-left font-bold text-slate-800">Rotación</td>
                        {BRANDS.map(b => {
                          const val = data?.marcasYtdUnd?.[b.key]?.rot;
                          return (
                            <React.Fragment key={b.key}>
                              <td className="py-2 px-1 border-l border-slate-100 font-semibold text-slate-800">
                                {formatNumber(val?.dif)}
                              </td>
                              <td className="py-2 px-1 font-semibold text-slate-600">
                                {formatPercent(val?.vsLy)}
                              </td>
                            </React.Fragment>
                          );
                        })}
                      </tr>

                      {/* FILA TOTAL */}
                      <tr className="bg-sky-50/70 hover:bg-sky-100/50 transition-colors">
                        <td className="py-2 px-3 text-left font-bold text-slate-900">Total</td>
                        {BRANDS.map(b => {
                          const val = data?.marcasYtdUnd?.[b.key]?.total;
                          return (
                            <React.Fragment key={b.key}>
                              <td className="py-2 px-1 border-l border-sky-100 font-bold text-slate-900">
                                {formatNumber(val?.dif)}
                              </td>
                              <td className="py-2 px-1 font-bold text-slate-900">
                                {formatPercent(val?.vsLy)}
                              </td>
                            </React.Fragment>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* TABLA 2: MATRIZ IMPACTO MENSUAL UND MENSUAL */}
              <div className="bg-white rounded-xl border border-sky-200 shadow-xs p-4 flex flex-col gap-3">
                <h2 className="text-center font-bold text-[#0066c0] text-sm md:text-base tracking-wide uppercase">
                  MATRIZ IMPACTO MENSUAL UND MENSUAL
                </h2>

                <div className="overflow-x-auto">
                  <table className="w-full text-center border-collapse">
                    <thead>
                      <tr className="border-b border-sky-200 bg-sky-50/50">
                        <th className="py-1.5 px-3 text-left text-xs font-bold text-slate-700 w-28">Impactos</th>
                        {data?.monthlyDataUnd?.map(m => (
                          <th key={m.mes} colSpan={2} className="py-1.5 px-2 border-l border-sky-200 text-xs font-bold text-slate-800 capitalize">
                            {m.label}
                          </th>
                        ))}
                        <th colSpan={2} className="py-1.5 px-2 border-l border-sky-300 text-xs font-bold text-slate-900 bg-sky-100/70">
                          Total
                        </th>
                      </tr>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600">
                        <th className="py-1 px-3 text-left"></th>
                        {data?.monthlyDataUnd?.map(m => (
                          <React.Fragment key={m.mes}>
                            <th className="py-1 px-1 border-l border-slate-200 text-slate-700">Dif. LY</th>
                            <th className="py-1 px-1 text-slate-700">Vs LY</th>
                          </React.Fragment>
                        ))}
                        <th className="py-1 px-1 border-l border-sky-300 text-slate-900 bg-sky-100/50">Dif. LY</th>
                        <th className="py-1 px-1 text-slate-900 bg-sky-100/50">Vs LY</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs">
                      {/* FILA DISTRIBUCION */}
                      <tr className="border-b border-slate-100 hover:bg-sky-50/40 transition-colors">
                        <td className="py-2 px-3 text-left font-bold text-slate-800">Distribución</td>
                        {data?.monthlyDataUnd?.map(m => (
                          <React.Fragment key={m.mes}>
                            <td className="py-2 px-1 border-l border-slate-100 font-semibold text-slate-800">
                              {formatNumber(m.dist_dif)}
                            </td>
                            <td className="py-2 px-1 font-semibold text-slate-600">
                              {formatPercent(m.dist_vsLy)}
                            </td>
                          </React.Fragment>
                        ))}
                        <td className="py-2 px-1 border-l border-sky-200 font-bold text-slate-900 bg-sky-50/40">
                          {formatNumber(data?.summaryTotalUnd?.dist_dif)}
                        </td>
                        <td className="py-2 px-1 font-bold text-slate-900 bg-sky-50/40">
                          {formatPercent(data?.summaryTotalUnd?.dist_vsLy)}
                        </td>
                      </tr>

                      {/* FILA ROTACION */}
                      <tr className="border-b border-slate-100 hover:bg-sky-50/40 transition-colors">
                        <td className="py-2 px-3 text-left font-bold text-slate-800">Rotación</td>
                        {data?.monthlyDataUnd?.map(m => (
                          <React.Fragment key={m.mes}>
                            <td className="py-2 px-1 border-l border-slate-100 font-semibold text-slate-800">
                              {formatNumber(m.rot_dif)}
                            </td>
                            <td className="py-2 px-1 font-semibold text-slate-600">
                              {formatPercent(m.rot_vsLy)}
                            </td>
                          </React.Fragment>
                        ))}
                        <td className="py-2 px-1 border-l border-sky-200 font-bold text-slate-900 bg-sky-50/40">
                          {formatNumber(data?.summaryTotalUnd?.rot_dif)}
                        </td>
                        <td className="py-2 px-1 font-bold text-slate-900 bg-sky-50/40">
                          {formatPercent(data?.summaryTotalUnd?.rot_vsLy)}
                        </td>
                      </tr>

                      {/* FILA TOTAL */}
                      <tr className="bg-sky-50/70 hover:bg-sky-100/50 transition-colors">
                        <td className="py-2 px-3 text-left font-bold text-slate-900">Total</td>
                        {data?.monthlyDataUnd?.map(m => (
                          <React.Fragment key={m.mes}>
                            <td className="py-2 px-1 border-l border-sky-100 font-bold text-slate-900">
                              {formatNumber(m.total_dif)}
                            </td>
                            <td className="py-2 px-1 font-bold text-slate-900">
                              {formatPercent(m.total_vsLy)}
                            </td>
                          </React.Fragment>
                        ))}
                        <td className="py-2 px-1 border-l border-sky-300 font-bold text-slate-950 bg-sky-100/70">
                          {formatNumber(data?.summaryTotalUnd?.total_dif)}
                        </td>
                        <td className="py-2 px-1 font-bold text-slate-950 bg-sky-100/70">
                          {formatPercent(data?.summaryTotalUnd?.total_vsLy)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* GRAFICA 1: GROWTH DRIVERS (UNIDADES) */}
              <div className="bg-white rounded-xl border border-sky-200 shadow-xs p-5 flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-bold text-[#0066c0] text-sm md:text-base tracking-wide uppercase">
                    GROWTH DRIVERS
                  </h2>

                  {/* LEYENDA */}
                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
                    <span className="text-[11px] text-slate-400 font-bold uppercase">Impactos:</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-xs bg-[#7cc5c0]" />
                      <span>Distribución</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-xs bg-[#33729e]" />
                      <span>Rotación</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-0.5 bg-[#e1143c] border-t-2 border-dashed border-[#e1143c]" />
                      <div className="w-2 h-2 rounded-full bg-[#e1143c] -ml-2" />
                      <span>Total</span>
                    </div>
                  </div>
                </div>

                {/* GRAFICO SVG CASCADA DIVERGENTE UNIDADES */}
                <UnitGrowthChart data={data?.monthlyDataUnd || []} />
              </div>
            </div>

            {/* ============================================================== */}
            {/* BLOQUE 2: USD (VALOR)                                          */}
            {/* ============================================================== */}
            <div className="flex flex-col gap-5 pt-4 border-t border-slate-300">
              {/* TABLA 3: MATRIZ IMPACTO YTD USD (MARCAS-YTD) */}
              <div className="bg-white rounded-xl border border-sky-200 shadow-xs p-4 flex flex-col gap-3">
                <h2 className="text-center font-bold text-[#0066c0] text-sm md:text-base tracking-wide uppercase">
                  MATRIZ IMPACTO YTD USD (MARCAS-YTD)
                </h2>

                <div className="overflow-x-auto">
                  <table className="w-full text-center border-collapse">
                    <thead>
                      <tr className="border-b border-sky-200">
                        <th className="py-2 px-3 text-left w-32"></th>
                        {BRANDS.map(b => (
                          <th key={b.key} colSpan={2} className="py-3 px-2 border-l border-sky-100 text-center">
                            <div className="flex flex-col items-center justify-center min-h-[50px] p-1">
                              <img
                                src={b.logo}
                                alt={b.name}
                                className="h-12 md:h-14 w-auto max-w-[105px] object-contain drop-shadow-xs transition-transform hover:scale-105"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                            </div>
                          </th>
                        ))}
                      </tr>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600">
                        <th className="py-1.5 px-3 text-left">Impactos</th>
                        {BRANDS.map(b => (
                          <React.Fragment key={b.key}>
                            <th className="py-1 px-1 border-l border-slate-200 w-16 text-slate-700">Dif. LY</th>
                            <th className="py-1 px-1 w-14 text-slate-700">Vs LY</th>
                          </React.Fragment>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="text-xs">
                      {/* FILA PRECIO */}
                      <tr className="border-b border-slate-100 hover:bg-sky-50/40 transition-colors">
                        <td className="py-2 px-3 text-left font-bold text-slate-800">Precio</td>
                        {BRANDS.map(b => {
                          const val = data?.marcasYtdUsd?.[b.key]?.precio;
                          return (
                            <React.Fragment key={b.key}>
                              <td className="py-2 px-1 border-l border-slate-100 font-semibold text-slate-800">
                                {val?.dif !== null ? formatNumber(val?.dif) : '-'}
                              </td>
                              <td className="py-2 px-1 font-semibold text-slate-600">
                                {val?.vsLy !== null ? formatPercent(val?.vsLy) : '-'}
                              </td>
                            </React.Fragment>
                          );
                        })}
                      </tr>

                      {/* FILA DISTRIBUCION */}
                      <tr className="border-b border-slate-100 hover:bg-sky-50/40 transition-colors">
                        <td className="py-2 px-3 text-left font-bold text-slate-800">Distribución</td>
                        {BRANDS.map(b => {
                          const val = data?.marcasYtdUsd?.[b.key]?.dist;
                          return (
                            <React.Fragment key={b.key}>
                              <td className="py-2 px-1 border-l border-slate-100 font-semibold text-slate-800">
                                {val?.dif !== null ? formatNumber(val?.dif) : '-'}
                              </td>
                              <td className="py-2 px-1 font-semibold text-slate-600">
                                {val?.vsLy !== null ? formatPercent(val?.vsLy) : '-'}
                              </td>
                            </React.Fragment>
                          );
                        })}
                      </tr>

                      {/* FILA ROTACION */}
                      <tr className="border-b border-slate-100 hover:bg-sky-50/40 transition-colors">
                        <td className="py-2 px-3 text-left font-bold text-slate-800">Rotación</td>
                        {BRANDS.map(b => {
                          const val = data?.marcasYtdUsd?.[b.key]?.rot;
                          return (
                            <React.Fragment key={b.key}>
                              <td className="py-2 px-1 border-l border-slate-100 font-semibold text-slate-800">
                                {val?.dif !== null ? formatNumber(val?.dif) : '-'}
                              </td>
                              <td className="py-2 px-1 font-semibold text-slate-600">
                                {val?.vsLy !== null ? formatPercent(val?.vsLy) : '-'}
                              </td>
                            </React.Fragment>
                          );
                        })}
                      </tr>

                      {/* FILA TOTAL */}
                      <tr className="bg-sky-50/70 hover:bg-sky-100/50 transition-colors">
                        <td className="py-2 px-3 text-left font-bold text-slate-900">Total</td>
                        {BRANDS.map(b => {
                          const val = data?.marcasYtdUsd?.[b.key]?.total;
                          return (
                            <React.Fragment key={b.key}>
                              <td className="py-2 px-1 border-l border-sky-100 font-bold text-slate-900">
                                {formatNumber(val?.dif)}
                              </td>
                              <td className="py-2 px-1 font-bold text-slate-900">
                                {formatPercent(val?.vsLy)}
                              </td>
                            </React.Fragment>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* TABLA 4: MATRIZ IMPACTO MENSUAL USD MENSUAL */}
              <div className="bg-white rounded-xl border border-sky-200 shadow-xs p-4 flex flex-col gap-3">
                <h2 className="text-center font-bold text-[#0066c0] text-sm md:text-base tracking-wide uppercase">
                  MATRIZ IMPACTO MENSUAL USD MENSUAL
                </h2>

                <div className="overflow-x-auto">
                  <table className="w-full text-center border-collapse">
                    <thead>
                      <tr className="border-b border-sky-200 bg-sky-50/50">
                        <th className="py-1.5 px-3 text-left text-xs font-bold text-slate-700 w-28">Impactos</th>
                        {data?.monthlyDataUsd?.map(m => (
                          <th key={m.mes} colSpan={2} className="py-1.5 px-2 border-l border-sky-200 text-xs font-bold text-slate-800 capitalize">
                            {m.label}
                          </th>
                        ))}
                        <th colSpan={2} className="py-1.5 px-2 border-l border-sky-300 text-xs font-bold text-slate-900 bg-sky-100/70">
                          Total
                        </th>
                      </tr>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600">
                        <th className="py-1 px-3 text-left"></th>
                        {data?.monthlyDataUsd?.map(m => (
                          <React.Fragment key={m.mes}>
                            <th className="py-1 px-1 border-l border-slate-200 text-slate-700">Dif. LY</th>
                            <th className="py-1 px-1 text-slate-700">Vs LY</th>
                          </React.Fragment>
                        ))}
                        <th className="py-1 px-1 border-l border-sky-300 text-slate-900 bg-sky-100/50">Dif. LY</th>
                        <th className="py-1 px-1 text-slate-900 bg-sky-100/50">Vs LY</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs">
                      {/* FILA PRECIO */}
                      <tr className="border-b border-slate-100 hover:bg-sky-50/40 transition-colors">
                        <td className="py-2 px-3 text-left font-bold text-slate-800">Precio</td>
                        {data?.monthlyDataUsd?.map(m => (
                          <React.Fragment key={m.mes}>
                            <td className="py-2 px-1 border-l border-slate-100 font-semibold text-slate-800">
                              {formatNumber(m.precio_dif)}
                            </td>
                            <td className="py-2 px-1 font-semibold text-slate-600">
                              {formatPercent(m.precio_vsLy)}
                            </td>
                          </React.Fragment>
                        ))}
                        <td className="py-2 px-1 border-l border-sky-200 font-bold text-slate-900 bg-sky-50/40">
                          {formatNumber(data?.summaryTotalUsd?.precio_dif)}
                        </td>
                        <td className="py-2 px-1 font-bold text-slate-900 bg-sky-50/40">
                          {formatPercent(data?.summaryTotalUsd?.precio_vsLy)}
                        </td>
                      </tr>

                      {/* FILA DISTRIBUCION */}
                      <tr className="border-b border-slate-100 hover:bg-sky-50/40 transition-colors">
                        <td className="py-2 px-3 text-left font-bold text-slate-800">Distribución</td>
                        {data?.monthlyDataUsd?.map(m => (
                          <React.Fragment key={m.mes}>
                            <td className="py-2 px-1 border-l border-slate-100 font-semibold text-slate-800">
                              {formatNumber(m.dist_dif)}
                            </td>
                            <td className="py-2 px-1 font-semibold text-slate-600">
                              {formatPercent(m.dist_vsLy)}
                            </td>
                          </React.Fragment>
                        ))}
                        <td className="py-2 px-1 border-l border-sky-200 font-bold text-slate-900 bg-sky-50/40">
                          {formatNumber(data?.summaryTotalUsd?.dist_dif)}
                        </td>
                        <td className="py-2 px-1 font-bold text-slate-900 bg-sky-50/40">
                          {formatPercent(data?.summaryTotalUsd?.dist_vsLy)}
                        </td>
                      </tr>

                      {/* FILA ROTACION */}
                      <tr className="border-b border-slate-100 hover:bg-sky-50/40 transition-colors">
                        <td className="py-2 px-3 text-left font-bold text-slate-800">Rotación</td>
                        {data?.monthlyDataUsd?.map(m => (
                          <React.Fragment key={m.mes}>
                            <td className="py-2 px-1 border-l border-slate-100 font-semibold text-slate-800">
                              {formatNumber(m.rot_dif)}
                            </td>
                            <td className="py-2 px-1 font-semibold text-slate-600">
                              {formatPercent(m.rot_vsLy)}
                            </td>
                          </React.Fragment>
                        ))}
                        <td className="py-2 px-1 border-l border-sky-200 font-bold text-slate-900 bg-sky-50/40">
                          {formatNumber(data?.summaryTotalUsd?.rot_dif)}
                        </td>
                        <td className="py-2 px-1 font-bold text-slate-900 bg-sky-50/40">
                          {formatPercent(data?.summaryTotalUsd?.rot_vsLy)}
                        </td>
                      </tr>

                      {/* FILA TOTAL */}
                      <tr className="bg-sky-50/70 hover:bg-sky-100/50 transition-colors">
                        <td className="py-2 px-3 text-left font-bold text-slate-900">Total</td>
                        {data?.monthlyDataUsd?.map(m => (
                          <React.Fragment key={m.mes}>
                            <td className="py-2 px-1 border-l border-sky-100 font-bold text-slate-900">
                              {formatNumber(m.total_dif)}
                            </td>
                            <td className="py-2 px-1 font-bold text-slate-900">
                              {formatPercent(m.total_vsLy)}
                            </td>
                          </React.Fragment>
                        ))}
                        <td className="py-2 px-1 border-l border-sky-300 font-bold text-slate-950 bg-sky-100/70">
                          {formatNumber(data?.summaryTotalUsd?.total_dif)}
                        </td>
                        <td className="py-2 px-1 font-bold text-slate-950 bg-sky-100/70">
                          {formatPercent(data?.summaryTotalUsd?.total_vsLy)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* GRAFICA 2: GROWTH DRIVERS (USD) */}
              <div className="bg-white rounded-xl border border-sky-200 shadow-xs p-5 flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-bold text-[#0066c0] text-sm md:text-base tracking-wide uppercase">
                    GROWTH DRIVERS
                  </h2>

                  {/* LEYENDA */}
                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
                    <span className="text-[11px] text-slate-400 font-bold uppercase">Impactos:</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-xs bg-[#ee7c43]" />
                      <span>Precio</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-xs bg-[#7cc5c0]" />
                      <span>Distribución</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-xs bg-[#33729e]" />
                      <span>Rotación</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-0.5 bg-[#e1143c] border-t-2 border-dashed border-[#e1143c]" />
                      <div className="w-2 h-2 rounded-full bg-[#e1143c] -ml-2" />
                      <span>Total_Impacto_Valor</span>
                    </div>
                  </div>
                </div>

                {/* GRAFICO SVG CASCADA DIVERGENTE USD */}
                <ValueGrowthChart data={data?.monthlyDataUsd || []} />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

// --------------------------------------------------------------------------
// ALGORITMO INTELIGENTE DE COLISIONES Y RELAJACIÓN DE ETIQUETAS (1D / 2D)
// --------------------------------------------------------------------------
function resolveColumnBadges(items, yMinLimit = 15, yMaxLimit = 300) {
  if (!items || items.length === 0) return [];
  if (items.length === 1) {
    items[0].y = items[0].idealY;
    return items;
  }

  // Ordenar de arriba hacia abajo según su posición ideal (menor Y está más arriba en SVG)
  const sorted = [...items].sort((a, b) => a.idealY - b.idealY);
  sorted.forEach(item => { item.y = item.idealY; });

  const minGap = 5; // Separación mínima obligatoria en píxeles

  // Paso 1: Empujar hacia abajo si hay colisión
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    const prevBottom = prev.y + prev.height / 2;
    const currTop = curr.y - curr.height / 2;
    if (currTop < prevBottom + minGap) {
      curr.y = prevBottom + minGap + curr.height / 2;
    }
  }

  // Paso 2: Relajación bidireccional iterativa
  for (let iter = 0; iter < 4; iter++) {
    // Empujar hacia arriba
    for (let i = sorted.length - 2; i >= 0; i--) {
      const curr = sorted[i];
      const next = sorted[i + 1];
      const currBottom = curr.y + curr.height / 2;
      const nextTop = next.y - next.height / 2;
      if (currBottom > nextTop - minGap) {
        curr.y = nextTop - minGap - curr.height / 2;
      }
    }
    // Empujar hacia abajo
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      const prevBottom = prev.y + prev.height / 2;
      const currTop = curr.y - curr.height / 2;
      if (currTop < prevBottom + minGap) {
        curr.y = prevBottom + minGap + curr.height / 2;
      }
    }
  }

  // Paso 3: Respetar límites superior e inferior del canvas SVG
  if (sorted[0].y - sorted[0].height / 2 < yMinLimit) {
    const shift = yMinLimit - (sorted[0].y - sorted[0].height / 2);
    sorted.forEach(s => { s.y += shift; });
  }
  const last = sorted[sorted.length - 1];
  if (last.y + last.height / 2 > yMaxLimit) {
    const shift = (last.y + last.height / 2) - yMaxLimit;
    sorted.forEach(s => { s.y -= shift; });
  }

  return sorted;
}

// --------------------------------------------------------------------------
// COMPONENTE HELPER: BADGE / ETIQUETA DE DATOS CON FONDO GRIS CLARO
// --------------------------------------------------------------------------
function SvgDataBadge({ x, y, value, percent, width = 56, height = 26, isTotal = false }) {
  const rx = x - width / 2;
  const ry = y - height / 2;

  return (
    <g className="select-none pointer-events-none">
      {/* FONDO TARJETA / BADGE */}
      <rect
        x={rx}
        y={ry}
        width={width}
        height={height}
        rx={4}
        fill={isTotal ? '#ffffff' : '#f8fafc'}
        fillOpacity={0.96}
        stroke={isTotal ? '#e1143c' : '#cbd5e1'}
        strokeWidth={isTotal ? 1.2 : 0.75}
        className="filter drop-shadow-xs"
      />
      {/* VALOR NUMERICO */}
      <text
        x={x}
        y={percent !== undefined && percent !== null ? y - 3 : y + 3.5}
        textAnchor="middle"
        className={`text-[9.5px] font-bold ${isTotal ? 'fill-rose-700' : 'fill-slate-800'}`}
      >
        {value}
      </text>
      {/* PORCENTAJE */}
      {percent !== undefined && percent !== null && (
        <text
          x={x}
          y={y + 8}
          textAnchor="middle"
          className="text-[8px] font-semibold fill-slate-500"
        >
          {percent}
        </text>
      )}
    </g>
  );
}

// --------------------------------------------------------------------------
// COMPONENTE: GRÁFICO SVG GROWTH DRIVERS UNIDADES
// --------------------------------------------------------------------------
function UnitGrowthChart({ data }) {
  if (!data || data.length === 0) return null;

  const height = 340;
  const padding = { top: 40, right: 30, bottom: 45, left: 65 };
  const width = 1100;

  // Rango Y dinámico
  const yMin = -80000;
  const yMax = 145000;

  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const yScale = (val) => {
    return padding.top + innerHeight - ((val - yMin) / (yMax - yMin)) * innerHeight;
  };

  const zeroY = yScale(0);
  const colWidth = innerWidth / data.length;
  const barWidth = Math.min(64, colWidth * 0.72);

  // Puntos de la línea Total
  const linePoints = data.map((d, i) => {
    const x = padding.left + i * colWidth + colWidth / 2;
    const y = yScale(d.total_dif);
    return { x, y, val: d.total_dif, d };
  });

  const pathD = linePoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[780px] font-sans">
        {/* LÍNEAS DE GUÍA HORIZONTALES */}
        {[-50000, 0, 50000, 100000].map((tick) => {
          const y = yScale(tick);
          const isZero = tick === 0;
          return (
            <g key={tick}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke={isZero ? '#38bdf8' : '#e2e8f0'}
                strokeWidth={isZero ? 1.5 : 1}
                strokeDasharray={isZero ? '4,4' : 'none'}
              />
              <text
                x={padding.left - 10}
                y={y + 3.5}
                textAnchor="end"
                className="text-[10px] fill-slate-400 font-semibold"
              >
                {tick === 0 ? '0 mil' : `${tick / 1000} mil`}
              </text>
            </g>
          );
        })}

        {/* BARRAS Y BADGES CALCULADOS SIN COLISIONES */}
        {data.map((d, i) => {
          const centerX = padding.left + i * colWidth + colWidth / 2;
          const barX = centerX - barWidth / 2;

          // Segmentos de Distribución y Rotación
          const distIsPos = d.dist_dif >= 0;
          const rotIsPos = d.rot_dif >= 0;

          let distY = zeroY, distH = 0;
          let rotY = zeroY, rotH = 0;

          if (distIsPos && rotIsPos) {
            distH = Math.abs(yScale(d.dist_dif) - zeroY);
            distY = yScale(d.dist_dif);
            rotH = Math.abs(yScale(d.rot_dif) - zeroY);
            rotY = distY - rotH;
          } else if (distIsPos && !rotIsPos) {
            distH = Math.abs(yScale(d.dist_dif) - zeroY);
            distY = yScale(d.dist_dif);
            rotH = Math.abs(yScale(d.rot_dif) - zeroY);
            rotY = zeroY;
          } else if (!distIsPos && rotIsPos) {
            distH = Math.abs(yScale(d.dist_dif) - zeroY);
            distY = zeroY;
            rotH = Math.abs(yScale(d.rot_dif) - zeroY);
            rotY = yScale(d.rot_dif);
          } else {
            distH = Math.abs(yScale(d.dist_dif) - zeroY);
            distY = zeroY;
            rotH = Math.abs(yScale(d.rot_dif) - zeroY);
            rotY = distY + distH;
          }

          // Armar conjunto de badges para esta columna y resolver colisiones inteligentemente
          const columnBadges = [];

          // 1. Badge de Distribución
          if (distH > 16) {
            const idealDistY = distIsPos ? distY + distH * 0.45 : distY + distH * 0.55;
            columnBadges.push({
              id: 'dist',
              idealY: idealDistY,
              height: 25,
              width: 54,
              value: formatNumber(d.dist_dif),
              percent: formatPercent(d.dist_vsLy),
              isTotal: false
            });
          }

          // 2. Badge de Rotación
          if (rotH > 16) {
            const idealRotY = rotIsPos ? rotY + rotH * 0.45 : rotY + rotH * 0.55;
            columnBadges.push({
              id: 'rot',
              idealY: idealRotY,
              height: 25,
              width: 54,
              value: formatNumber(d.rot_dif),
              percent: formatPercent(d.rot_vsLy),
              isTotal: false
            });
          }

          // 3. Badge de Total (Punto rojo)
          const totalY = yScale(d.total_dif);
          const topOfPositiveBar = Math.min(distY, rotY);
          let idealTotalY = totalY - 14;

          // Si el total está muy cerca o arriba del pico de la barra (ej. May o Jul)
          if (d.total_dif >= (d.dist_dif > 0 ? d.dist_dif : 0) + (d.rot_dif > 0 ? d.rot_dif : 0) - 5000) {
            idealTotalY = topOfPositiveBar - 15;
          } else if (d.total_dif < 0 && rotIsPos === false && distIsPos === true) {
            // Caso como Feb donde total es negativo (-26k) pero hay barra positiva: colocar en el espacio entre 0 y el punto
            idealTotalY = totalY - 14;
          } else if (d.total_dif > 0 && d.total_dif < (distIsPos ? d.dist_dif : 0) * 0.5) {
            // Total está abajo dentro de la barra positiva (ej. Ene o Mar): colocar abajo
            idealTotalY = totalY + 15;
          } else {
            // Total arriba de la barra
            idealTotalY = topOfPositiveBar - 15;
          }

          columnBadges.push({
            id: 'total',
            idealY: idealTotalY,
            height: 18,
            width: 50,
            value: formatNumber(d.total_dif),
            isTotal: true
          });

          // Resolver colisiones con el algoritmo inteligente
          const resolvedBadges = resolveColumnBadges(columnBadges, 15, height - padding.bottom - 5);

          const monthLabelFormatted = `${d.label}-${String(d.chartLabel || '').split(' ')[1] || '26'}`;

          return (
            <g key={d.mes}>
              {/* RECTÁNGULO DISTRIBUCIÓN (#7cc5c0) */}
              {distH > 0 && (
                <rect
                  x={barX}
                  y={distY}
                  width={barWidth}
                  height={Math.max(2, distH)}
                  fill="#7cc5c0"
                  opacity={0.92}
                  rx={2}
                />
              )}

              {/* RECTÁNGULO ROTACIÓN (#33729e) */}
              {rotH > 0 && (
                <rect
                  x={barX}
                  y={rotY}
                  width={barWidth}
                  height={Math.max(2, rotH)}
                  fill="#33729e"
                  opacity={0.95}
                  rx={2}
                />
              )}

              {/* RENDERIZADO DE BADGES DESCOLISIONADOS */}
              {resolvedBadges.map(b => (
                <SvgDataBadge
                  key={b.id}
                  x={centerX}
                  y={b.y}
                  value={b.value}
                  percent={b.percent}
                  width={b.width}
                  height={b.height}
                  isTotal={b.isTotal}
                />
              ))}

              {/* ETIQUETA EJE X */}
              <text
                x={centerX}
                y={height - padding.bottom + 20}
                textAnchor="middle"
                className="text-[11px] font-semibold fill-slate-500"
              >
                {monthLabelFormatted}
              </text>
            </g>
          );
        })}

        {/* LÍNEA TOTAL IMPACTO (ROJO PUNTEADO) */}
        <path
          d={pathD}
          fill="none"
          stroke="#d62728"
          strokeWidth={2}
          strokeDasharray="4,3"
        />

        {/* PUNTOS ROJOS DE TOTAL */}
        {linePoints.map((p, idx) => (
          <circle
            key={idx}
            cx={p.x}
            cy={p.y}
            r={3.8}
            fill="#d62728"
            stroke="#ffffff"
            strokeWidth={1.8}
            className="filter drop-shadow-xs"
          />
        ))}

        {/* TÍTULO EJE X */}
        <text
          x={width / 2}
          y={height - 8}
          textAnchor="middle"
          className="text-[11px] font-bold fill-slate-500 tracking-wide"
        >
          Mes-Año
        </text>
      </svg>
    </div>
  );
}

// --------------------------------------------------------------------------
// COMPONENTE: GRÁFICO SVG GROWTH DRIVERS USD
// --------------------------------------------------------------------------
function ValueGrowthChart({ data }) {
  if (!data || data.length === 0) return null;

  const height = 350;
  const padding = { top: 40, right: 30, bottom: 45, left: 65 };
  const width = 1100;

  // Rango Y en USD (de -300k a 850k)
  const yMin = -300000;
  const yMax = 850000;

  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const yScale = (val) => {
    return padding.top + innerHeight - ((val - yMin) / (yMax - yMin)) * innerHeight;
  };

  const zeroY = yScale(0);
  const colWidth = innerWidth / data.length;
  const barWidth = Math.min(64, colWidth * 0.72);

  // Línea de Total Impacto Valor
  const linePoints = data.map((d, i) => {
    const x = padding.left + i * colWidth + colWidth / 2;
    const y = yScale(d.total_dif);
    return { x, y, val: d.total_dif, d };
  });

  const pathD = linePoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[780px] font-sans">
        {/* LÍNEAS DE GUÍA HORIZONTALES */}
        {[-200000, 0, 200000, 400000, 600000, 800000].map((tick) => {
          const y = yScale(tick);
          const isZero = tick === 0;
          return (
            <g key={tick}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke={isZero ? '#38bdf8' : '#e2e8f0'}
                strokeWidth={isZero ? 1.5 : 1}
                strokeDasharray={isZero ? '4,4' : 'none'}
              />
              <text
                x={padding.left - 10}
                y={y + 3.5}
                textAnchor="end"
                className="text-[10px] fill-slate-400 font-semibold"
              >
                {tick === 0 ? '0.0 mill.' : `${(tick / 1000000).toFixed(1)} mill.`}
              </text>
            </g>
          );
        })}

        {/* BARRAS MENSUALES APILADAS DIVERGENTES */}
        {data.map((d, i) => {
          const centerX = padding.left + i * colWidth + colWidth / 2;
          const barX = centerX - barWidth / 2;

          // PRECIO (#ee7c43 - Naranja)
          const pIsPos = d.precio_dif >= 0;
          const pHeight = Math.abs(yScale(d.precio_dif) - zeroY);
          const pY = pIsPos ? yScale(d.precio_dif) : zeroY;

          // DISTRIBUCION (#7cc5c0 - Cyan)
          const distIsPos = d.dist_dif >= 0;
          const distHeight = Math.abs(yScale(d.dist_dif) - zeroY);
          const distY = distIsPos ? (pIsPos ? pY - distHeight : yScale(d.dist_dif)) : zeroY;

          // ROTACION (#33729e - Azul)
          const rotIsPos = d.rot_dif >= 0;
          const rotHeight = Math.abs(yScale(d.rot_dif) - zeroY);
          const rotY = rotIsPos
            ? (distIsPos ? distY - rotHeight : yScale(d.rot_dif))
            : (distIsPos ? zeroY + (pIsPos ? 0 : pHeight) : distY + distHeight);

          // Armar conjunto de badges para esta columna y resolver colisiones inteligentemente
          const columnBadges = [];

          // 1. Badge Precio
          if (pHeight > 16) {
            columnBadges.push({
              id: 'precio',
              idealY: pY + pHeight / 2,
              height: 25,
              width: 54,
              value: formatNumber(d.precio_dif),
              percent: formatPercent(d.precio_vsLy),
              isTotal: false
            });
          }

          // 2. Badge Distribución
          if (distHeight > 16) {
            columnBadges.push({
              id: 'dist',
              idealY: distY + distHeight / 2,
              height: 25,
              width: 54,
              value: formatNumber(d.dist_dif),
              percent: formatPercent(d.dist_vsLy),
              isTotal: false
            });
          }

          // 3. Badge Rotación
          if (rotHeight > 16) {
            columnBadges.push({
              id: 'rot',
              idealY: rotY + rotHeight / 2,
              height: 25,
              width: 54,
              value: formatNumber(d.rot_dif),
              percent: formatPercent(d.rot_vsLy),
              isTotal: false
            });
          }

          // 4. Badge Total
          const totalY = yScale(d.total_dif);
          const topOfPositiveBar = Math.min(pY, distY, rotY);
          let idealTotalY = totalY - 14;

          const sumPositives = (pIsPos ? d.precio_dif : 0) + (distIsPos ? d.dist_dif : 0) + (rotIsPos ? d.rot_dif : 0);
          if (d.total_dif >= sumPositives - 20000) {
            idealTotalY = topOfPositiveBar - 15;
          } else {
            idealTotalY = topOfPositiveBar - 15;
          }

          columnBadges.push({
            id: 'total',
            idealY: idealTotalY,
            height: 18,
            width: 54,
            value: formatNumber(d.total_dif),
            isTotal: true
          });

          // Resolver colisiones con el algoritmo inteligente
          const resolvedBadges = resolveColumnBadges(columnBadges, 15, height - padding.bottom - 5);

          const monthLabelFormatted = `${d.label}-${String(d.chartLabel || '').split(' ')[1] || '26'}`;

          return (
            <g key={d.mes}>
              {/* BARRA PRECIO (#ee7c43) */}
              {pHeight > 0 && (
                <rect
                  x={barX}
                  y={pY}
                  width={barWidth}
                  height={Math.max(2, pHeight)}
                  fill="#ee7c43"
                  opacity={0.92}
                  rx={2}
                />
              )}

              {/* BARRA DISTRIBUCION (#7cc5c0) */}
              {distHeight > 0 && (
                <rect
                  x={barX}
                  y={distY}
                  width={barWidth}
                  height={Math.max(2, distHeight)}
                  fill="#7cc5c0"
                  opacity={0.88}
                  rx={2}
                />
              )}

              {/* BARRA ROTACION (#33729e) */}
              {rotHeight > 0 && (
                <rect
                  x={barX}
                  y={rotY}
                  width={barWidth}
                  height={Math.max(2, rotHeight)}
                  fill="#33729e"
                  opacity={0.92}
                  rx={2}
                />
              )}

              {/* RENDERIZADO DE BADGES DESCOLISIONADOS */}
              {resolvedBadges.map(b => (
                <SvgDataBadge
                  key={b.id}
                  x={centerX}
                  y={b.y}
                  value={b.value}
                  percent={b.percent}
                  width={b.width}
                  height={b.height}
                  isTotal={b.isTotal}
                />
              ))}

              {/* EJE X LABEL */}
              <text
                x={centerX}
                y={height - padding.bottom + 20}
                textAnchor="middle"
                className="text-[11px] font-semibold fill-slate-500"
              >
                {monthLabelFormatted}
              </text>
            </g>
          );
        })}

        {/* LÍNEA TOTAL IMPACTO VALOR (ROJO PUNTEADO) */}
        <path
          d={pathD}
          fill="none"
          stroke="#d62728"
          strokeWidth={2}
          strokeDasharray="4,3"
        />

        {/* PUNTOS ROJOS DE TOTAL */}
        {linePoints.map((p, idx) => (
          <circle
            key={idx}
            cx={p.x}
            cy={p.y}
            r={3.8}
            fill="#d62728"
            stroke="#ffffff"
            strokeWidth={1.8}
            className="filter drop-shadow-xs"
          />
        ))}

        {/* TÍTULO EJE X */}
        <text
          x={width / 2}
          y={height - 8}
          textAnchor="middle"
          className="text-[11px] font-bold fill-slate-500 tracking-wide"
        >
          Mes-Año
        </text>
      </svg>
    </div>
  );
}
