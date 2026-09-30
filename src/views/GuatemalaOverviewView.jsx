import React, { useState, useEffect, useMemo } from 'react';
import { Home, RefreshCw, Award } from 'lucide-react';

export default function GuatemalaOverviewView({ onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [anio, setAnio] = useState('2026');
  const [mes, setMes] = useState('Todas');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/nielsen/gt/overview-dashboard?anio=${anio}&mes=${mes}`)
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [anio, mes]);

  // Cálculos de los 5 KPI Cards Superiores
  const kpiCards = useMemo(() => {
    if (!data?.kpiRows) return null;
    const anioAct = Number(anio);
    const anioAnt = anioAct - 1;

    // Extraer registros
    const isoAct = data.kpiRows.find(r => Number(r.anio) === anioAct && r.CATEGORIA.includes('ISOTONIC')) || {};
    const sueAct = data.kpiRows.find(r => Number(r.anio) === anioAct && !r.CATEGORIA.includes('ISOTONIC')) || {};
    const isoAnt = data.kpiRows.find(r => Number(r.anio) === anioAnt && r.CATEGORIA.includes('ISOTONIC')) || {};
    const sueAnt = data.kpiRows.find(r => Number(r.anio) === anioAnt && !r.CATEGORIA.includes('ISOTONIC')) || {};

    const calcVar = (act, ant) => {
      if (!ant || ant === 0) return 0;
      return ((act - ant) / ant) * 100;
    };

    // 1. Unidades
    const undsIsoAct = Number(isoAct.unds_k || 0);
    const undsSueAct = Number(sueAct.unds_k || 0);
    const undsTotAct = undsIsoAct + undsSueAct;

    const undsIsoAnt = Number(isoAnt.unds_k || 0);
    const undsSueAnt = Number(sueAnt.unds_k || 0);
    const undsTotAnt = undsIsoAnt + undsSueAnt;

    // 2. Litros
    const ltIsoAct = Number(isoAct.lt_k || 0);
    const ltSueAct = Number(sueAct.lt_k || 0);
    const ltTotAct = ltIsoAct + ltSueAct;

    const ltIsoAnt = Number(isoAnt.lt_k || 0);
    const ltSueAnt = Number(sueAnt.lt_k || 0);
    const ltTotAnt = ltIsoAnt + ltSueAnt;

    // 3. Valor USD
    const valIsoAct = Number(isoAct.valor_k || 0);
    const valSueAct = Number(sueAct.valor_k || 0);
    const valTotAct = valIsoAct + valSueAct;

    const valIsoAnt = Number(isoAnt.valor_k || 0);
    const valSueAnt = Number(sueAnt.valor_k || 0);
    const valTotAnt = valIsoAnt + valSueAnt;

    // 4. Precio Promedio
    const prIsoAct = Number(isoAct.precio_unit || 0);
    const prSueAct = Number(sueAct.precio_unit || 0);
    const prTotAct = undsTotAct > 0 ? (valTotAct * 1000) / (undsTotAct * 1000) : 0;

    const prIsoAnt = Number(isoAnt.precio_unit || 0);
    const prSueAnt = Number(sueAnt.precio_unit || 0);
    const prTotAnt = undsTotAnt > 0 ? (valTotAnt * 1000) / (undsTotAnt * 1000) : 0;

    // 5. Distribución Numérica
    const distIsoAct = Number(isoAct.dist_num || 0);
    const distSueAct = Number(sueAct.dist_num || 0);

    const distIsoAnt = Number(isoAnt.dist_num || 0);
    const distSueAnt = Number(sueAnt.dist_num || 0);

    return {
      unidades: {
        ant: { iso: undsIsoAnt, sue: undsSueAnt, total: undsTotAnt },
        act: { iso: undsIsoAct, sue: undsSueAct, total: undsTotAct },
        varTotal: calcVar(undsTotAct, undsTotAnt),
        varIso: calcVar(undsIsoAct, undsIsoAnt),
        varSue: calcVar(undsSueAct, undsSueAnt)
      },
      litros: {
        ant: { iso: ltIsoAnt, sue: ltSueAnt, total: ltTotAnt },
        act: { iso: ltIsoAct, sue: ltSueAct, total: ltTotAct },
        varTotal: calcVar(ltTotAct, ltTotAnt),
        varIso: calcVar(ltIsoAct, ltIsoAnt),
        varSue: calcVar(ltSueAct, ltSueAnt)
      },
      valor: {
        ant: { iso: valIsoAnt, sue: valSueAnt, total: valTotAnt },
        act: { iso: valIsoAct, sue: valSueAct, total: valTotAct },
        varTotal: calcVar(valTotAct, valTotAnt),
        varIso: calcVar(valIsoAct, valIsoAnt),
        varSue: calcVar(valSueAct, valSueAnt)
      },
      precio: {
        ant: { iso: prIsoAnt, sue: prSueAnt, total: prTotAnt },
        act: { iso: prIsoAct, sue: prSueAct, total: prTotAct },
        varTotal: calcVar(prTotAct, prTotAnt),
        varIso: calcVar(prIsoAct, prIsoAnt),
        varSue: calcVar(prSueAct, prSueAnt)
      },
      distNum: {
        ant: { iso: distIsoAnt, sue: distSueAnt },
        act: { iso: distIsoAct, sue: distSueAct },
        varTotal: ((distIsoAct + distSueAct) / 2) - ((distIsoAnt + distSueAnt) / 2),
        varIso: distIsoAct - distIsoAnt,
        varSue: distSueAct - distSueAnt
      }
    };
  }, [data, anio]);

  // Función para calcular formato condicional MoM (+0.2 verde, -0.2 rojizo)
  const getSomDeltaStyle = (currentVal, previousVal) => {
    if (currentVal === undefined || currentVal === null) return 'text-slate-400 bg-transparent';
    if (previousVal === undefined || previousVal === null) return 'text-slate-700 bg-transparent';
    
    const delta = Number((currentVal - previousVal).toFixed(2));
    if (delta >= 0.2) {
      return 'bg-[#7cd294] text-slate-900 font-bold'; // Verde
    }
    if (delta <= -0.2) {
      return 'bg-[#fca5a5] text-slate-900 font-bold'; // Rojizo
    }
    return 'text-slate-700 bg-transparent';
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans p-4 md:p-6 space-y-4">
      
      {/* 1. CABECERA SUPERIOR: LOGOS, TITULO, LEYENDA Y FILTROS */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs px-5 py-3 flex flex-wrap items-center justify-between gap-4">
        
        {/* Logos Oficiales: Hidravida | Nielsen */}
        <div className="flex items-center gap-4">
          <img 
            src="/assets/LOGOS/Hidravida-color.png" 
            alt="Hidravida" 
            className="h-8 object-contain" 
            onError={(e) => {
              e.target.src = "/assets/LOGOS/Electrolit-color.png";
            }}
          />
          <div className="h-6 w-px bg-slate-300" />
          <img src="/assets/LOGOS/Nielsen-logo.png" alt="Nielsen" className="h-7 object-contain" />
        </div>

        {/* Título Central */}
        <div className="text-center flex-1 min-w-[200px]">
          <h1 className="text-2xl font-black text-[#0066c0] tracking-tight">Overview</h1>
        </div>

        {/* Leyenda de Categorías */}
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#f28e2c]"></span>
            <span className="text-slate-700">Bebidas Isotónicas</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#1ba3b8]"></span>
            <span className="text-slate-700">Sueros Orales</span>
          </div>
        </div>

        {/* Filtros Año, Mes y Home */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <span className="text-slate-500 font-semibold">Año:</span>
            <select
              value={anio}
              onChange={e => {
                const newAnio = e.target.value;
                setAnio(newAnio);
                const monthsInNewYear = data?.availableMonthsByYear?.[newAnio] || [];
                const exists = monthsInNewYear.some(m => m.id === mes);
                if (!exists) {
                  setMes('Todas');
                }
              }}
              className="bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1 text-xs font-bold text-slate-700 outline-hidden cursor-pointer"
            >
              {(data?.availableYears || ['2026', '2025', '2024']).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-medium">
            <span className="text-slate-500 font-semibold">Mes:</span>
            <select
              value={mes}
              onChange={e => setMes(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1 text-xs font-bold text-slate-700 outline-hidden cursor-pointer"
            >
              {(data?.availableMonthsByYear?.[anio] || (
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
              )).map(m => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>

          <button
            onClick={onBack}
            title="Volver a la Portada de Guatemala"
            className="p-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-[#0066c0] transition cursor-pointer shadow-2xs"
          >
            <Home className="w-5 h-5" />
          </button>
        </div>

      </div>

      {loading ? (
        <div className="p-20 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
          <RefreshCw className="w-10 h-10 animate-spin mx-auto mb-3 text-[#0066c0]" />
          <p className="font-semibold text-slate-600">Consultando datos analíticos de Guatemala en BigQuery...</p>
          <span className="text-xs text-slate-400">Calculando YTD, series temporales y matrices de Share of Market</span>
        </div>
      ) : (
        <>
          {/* LEYENDA GLOBAL SUPERIOR */}
          <div className="flex items-center justify-center gap-8 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-[#f28e2c] shadow-2xs inline-block"></span>
              <span className="text-xs md:text-sm font-bold text-slate-800">Bebidas Isotónicas</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-[#1ba3b8] shadow-2xs inline-block"></span>
              <span className="text-xs md:text-sm font-bold text-slate-800">Sueros Orales</span>
            </div>
          </div>

          {/* 2. FILA 1: 5 TARJETAS DE COMPARACIÓN KPI (AÑO VS AÑO ANTERIOR Y % VAR) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            
            {/* Card 1: Unidades (000) */}
            <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs flex flex-col justify-between">
              <div className="border-b border-blue-200 border-dashed pb-2 mb-2 text-center">
                <h3 className="font-bold text-xs md:text-sm text-[#0066c0]">Unidades (000)</h3>
              </div>
              <div className="flex items-end justify-between gap-2 h-56 pt-2">
                {/* Columna Año Anterior */}
                <div className="flex-1 flex flex-col items-center h-full justify-end">
                  <span className="bg-slate-100 border border-slate-300 rounded-xs text-[9.5px] font-bold text-slate-700 px-1.5 py-0.5 mb-1 shadow-2xs">
                    {Math.round(kpiCards?.unidades?.ant.total).toLocaleString()}
                  </span>
                  <div className="w-full max-w-[52px] flex flex-col rounded-t-xs overflow-hidden h-[82%] border border-slate-300 shadow-2xs">
                    {/* Sueros (Arriba) */}
                    <div 
                      style={{ height: `${(kpiCards?.unidades?.ant.sue / (kpiCards?.unidades?.ant.total || 1)) * 100}%` }} 
                      className="bg-[#1ba3b8] flex flex-col items-center justify-center text-white leading-tight p-0.5"
                    >
                      <span className="text-[10px] font-bold">{Math.round(kpiCards?.unidades?.ant.sue).toLocaleString()}</span>
                      <span className="text-[8.5px] font-medium opacity-95">{((kpiCards?.unidades?.ant.sue / (kpiCards?.unidades?.ant.total || 1)) * 100).toFixed(1)}%</span>
                    </div>
                    {/* Isotónicas (Abajo) */}
                    <div 
                      style={{ height: `${(kpiCards?.unidades?.ant.iso / (kpiCards?.unidades?.ant.total || 1)) * 100}%` }} 
                      className="bg-[#f28e2c] flex flex-col items-center justify-center text-white leading-tight p-0.5"
                    >
                      <span className="text-[10px] font-bold">{Math.round(kpiCards?.unidades?.ant.iso).toLocaleString()}</span>
                      <span className="text-[8.5px] font-medium opacity-95">{((kpiCards?.unidades?.ant.iso / (kpiCards?.unidades?.ant.total || 1)) * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-700 font-bold mt-2">{data?.anioAnterior}</span>
                </div>

                {/* Columna Año Actual */}
                <div className="flex-1 flex flex-col items-center h-full justify-end">
                  <span className="bg-slate-100 border border-slate-300 rounded-xs text-[9.5px] font-bold text-slate-700 px-1.5 py-0.5 mb-1 shadow-2xs">
                    {Math.round(kpiCards?.unidades?.act.total).toLocaleString()}
                  </span>
                  <div className="w-full max-w-[52px] flex flex-col rounded-t-xs overflow-hidden h-[92%] border border-slate-300 shadow-2xs">
                    {/* Sueros (Arriba) */}
                    <div 
                      style={{ height: `${(kpiCards?.unidades?.act.sue / (kpiCards?.unidades?.act.total || 1)) * 100}%` }} 
                      className="bg-[#1ba3b8] flex flex-col items-center justify-center text-white leading-tight p-0.5"
                    >
                      <span className="text-[10px] font-bold">{Math.round(kpiCards?.unidades?.act.sue).toLocaleString()}</span>
                      <span className="text-[8.5px] font-medium opacity-95">{((kpiCards?.unidades?.act.sue / (kpiCards?.unidades?.act.total || 1)) * 100).toFixed(1)}%</span>
                    </div>
                    {/* Isotónicas (Abajo) */}
                    <div 
                      style={{ height: `${(kpiCards?.unidades?.act.iso / (kpiCards?.unidades?.act.total || 1)) * 100}%` }} 
                      className="bg-[#f28e2c] flex flex-col items-center justify-center text-white leading-tight p-0.5"
                    >
                      <span className="text-[10px] font-bold">{Math.round(kpiCards?.unidades?.act.iso).toLocaleString()}</span>
                      <span className="text-[8.5px] font-medium opacity-95">{((kpiCards?.unidades?.act.iso / (kpiCards?.unidades?.act.total || 1)) * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-700 font-bold mt-2">{data?.anioActual}</span>
                </div>

                {/* Pilar % Var */}
                <div className="flex-1 flex flex-col items-center h-full justify-end">
                  <span className="bg-slate-100 border border-slate-300 rounded-xs text-[9.5px] font-bold text-slate-800 px-1.5 py-0.5 mb-1 shadow-2xs">
                    {kpiCards?.unidades?.varTotal >= 0 ? `+${kpiCards?.unidades?.varTotal.toFixed(2)}%` : `${kpiCards?.unidades?.varTotal.toFixed(2)}%`}
                  </span>
                  <div className="w-full max-w-[52px] flex flex-col rounded-t-xs overflow-hidden h-[92%] bg-[#b0b6bf] p-1.5 justify-around shadow-2xs border border-slate-400/40">
                    <div className="bg-[#1ba3b8] rounded-xs text-[9.5px] text-white font-bold text-center py-0.5 shadow-xs">
                      {kpiCards?.unidades?.varSue >= 0 ? `+${kpiCards?.unidades?.varSue.toFixed(1)}%` : `${kpiCards?.unidades?.varSue.toFixed(1)}%`}
                    </div>
                    <div className="bg-[#f28e2c] rounded-xs text-[9.5px] text-white font-bold text-center py-0.5 shadow-xs">
                      {kpiCards?.unidades?.varIso >= 0 ? `+${kpiCards?.unidades?.varIso.toFixed(1)}%` : `${kpiCards?.unidades?.varIso.toFixed(1)}%`}
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-700 font-bold mt-2">%Var.</span>
                </div>
              </div>
            </div>

            {/* Card 2: Litros (000) */}
            <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs flex flex-col justify-between">
              <div className="border-b border-blue-200 border-dashed pb-2 mb-2 text-center">
                <h3 className="font-bold text-xs md:text-sm text-[#0066c0]">Litros (000)</h3>
              </div>
              <div className="flex items-end justify-between gap-2 h-56 pt-2">
                <div className="flex-1 flex flex-col items-center h-full justify-end">
                  <span className="bg-slate-100 border border-slate-300 rounded-xs text-[9.5px] font-bold text-slate-700 px-1.5 py-0.5 mb-1 shadow-2xs">
                    {Math.round(kpiCards?.litros?.ant.total).toLocaleString()}
                  </span>
                  <div className="w-full max-w-[52px] flex flex-col rounded-t-xs overflow-hidden h-[82%] border border-slate-300 shadow-2xs">
                    <div 
                      style={{ height: `${(kpiCards?.litros?.ant.sue / (kpiCards?.litros?.ant.total || 1)) * 100}%` }} 
                      className="bg-[#1ba3b8] flex flex-col items-center justify-center text-white leading-tight p-0.5"
                    >
                      <span className="text-[10px] font-bold">{Math.round(kpiCards?.litros?.ant.sue).toLocaleString()}</span>
                      <span className="text-[8.5px] font-medium opacity-95">{((kpiCards?.litros?.ant.sue / (kpiCards?.litros?.ant.total || 1)) * 100).toFixed(1)}%</span>
                    </div>
                    <div 
                      style={{ height: `${(kpiCards?.litros?.ant.iso / (kpiCards?.litros?.ant.total || 1)) * 100}%` }} 
                      className="bg-[#f28e2c] flex flex-col items-center justify-center text-white leading-tight p-0.5"
                    >
                      <span className="text-[10px] font-bold">{Math.round(kpiCards?.litros?.ant.iso).toLocaleString()}</span>
                      <span className="text-[8.5px] font-medium opacity-95">{((kpiCards?.litros?.ant.iso / (kpiCards?.litros?.ant.total || 1)) * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-700 font-bold mt-2">{data?.anioAnterior}</span>
                </div>

                <div className="flex-1 flex flex-col items-center h-full justify-end">
                  <span className="bg-slate-100 border border-slate-300 rounded-xs text-[9.5px] font-bold text-slate-700 px-1.5 py-0.5 mb-1 shadow-2xs">
                    {Math.round(kpiCards?.litros?.act.total).toLocaleString()}
                  </span>
                  <div className="w-full max-w-[52px] flex flex-col rounded-t-xs overflow-hidden h-[92%] border border-slate-300 shadow-2xs">
                    <div 
                      style={{ height: `${(kpiCards?.litros?.act.sue / (kpiCards?.litros?.act.total || 1)) * 100}%` }} 
                      className="bg-[#1ba3b8] flex flex-col items-center justify-center text-white leading-tight p-0.5"
                    >
                      <span className="text-[10px] font-bold">{Math.round(kpiCards?.litros?.act.sue).toLocaleString()}</span>
                      <span className="text-[8.5px] font-medium opacity-95">{((kpiCards?.litros?.act.sue / (kpiCards?.litros?.act.total || 1)) * 100).toFixed(1)}%</span>
                    </div>
                    <div 
                      style={{ height: `${(kpiCards?.litros?.act.iso / (kpiCards?.litros?.act.total || 1)) * 100}%` }} 
                      className="bg-[#f28e2c] flex flex-col items-center justify-center text-white leading-tight p-0.5"
                    >
                      <span className="text-[10px] font-bold">{Math.round(kpiCards?.litros?.act.iso).toLocaleString()}</span>
                      <span className="text-[8.5px] font-medium opacity-95">{((kpiCards?.litros?.act.iso / (kpiCards?.litros?.act.total || 1)) * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-700 font-bold mt-2">{data?.anioActual}</span>
                </div>

                <div className="flex-1 flex flex-col items-center h-full justify-end">
                  <span className="bg-slate-100 border border-slate-300 rounded-xs text-[9.5px] font-bold text-slate-800 px-1.5 py-0.5 mb-1 shadow-2xs">
                    {kpiCards?.litros?.varTotal >= 0 ? `+${kpiCards?.litros?.varTotal.toFixed(2)}%` : `${kpiCards?.litros?.varTotal.toFixed(2)}%`}
                  </span>
                  <div className="w-full max-w-[52px] flex flex-col rounded-t-xs overflow-hidden h-[92%] bg-[#b0b6bf] p-1.5 justify-around shadow-2xs border border-slate-400/40">
                    <div className="bg-[#1ba3b8] rounded-xs text-[9.5px] text-white font-bold text-center py-0.5 shadow-xs">
                      {kpiCards?.litros?.varSue >= 0 ? `+${kpiCards?.litros?.varSue.toFixed(1)}%` : `${kpiCards?.litros?.varSue.toFixed(1)}%`}
                    </div>
                    <div className="bg-[#f28e2c] rounded-xs text-[9.5px] text-white font-bold text-center py-0.5 shadow-xs">
                      {kpiCards?.litros?.varIso >= 0 ? `+${kpiCards?.litros?.varIso.toFixed(1)}%` : `${kpiCards?.litros?.varIso.toFixed(1)}%`}
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-700 font-bold mt-2">%Var.</span>
                </div>
              </div>
            </div>

            {/* Card 3: Valor USD (000) */}
            <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs flex flex-col justify-between">
              <div className="border-b border-blue-200 border-dashed pb-2 mb-2 text-center">
                <h3 className="font-bold text-xs md:text-sm text-[#0066c0]">Valor USD (000)</h3>
              </div>
              <div className="flex items-end justify-between gap-2 h-56 pt-2">
                <div className="flex-1 flex flex-col items-center h-full justify-end">
                  <span className="bg-slate-100 border border-slate-300 rounded-xs text-[9.5px] font-bold text-slate-700 px-1.5 py-0.5 mb-1 shadow-2xs">
                    {Math.round(kpiCards?.valor?.ant.total).toLocaleString()}
                  </span>
                  <div className="w-full max-w-[52px] flex flex-col rounded-t-xs overflow-hidden h-[78%] border border-slate-300 shadow-2xs">
                    <div 
                      style={{ height: `${(kpiCards?.valor?.ant.sue / (kpiCards?.valor?.ant.total || 1)) * 100}%` }} 
                      className="bg-[#1ba3b8] flex flex-col items-center justify-center text-white leading-tight p-0.5"
                    >
                      <span className="text-[10px] font-bold">{Math.round(kpiCards?.valor?.ant.sue).toLocaleString()}</span>
                      <span className="text-[8.5px] font-medium opacity-95">{((kpiCards?.valor?.ant.sue / (kpiCards?.valor?.ant.total || 1)) * 100).toFixed(1)}%</span>
                    </div>
                    <div 
                      style={{ height: `${(kpiCards?.valor?.ant.iso / (kpiCards?.valor?.ant.total || 1)) * 100}%` }} 
                      className="bg-[#f28e2c] flex flex-col items-center justify-center text-white leading-tight p-0.5"
                    >
                      <span className="text-[10px] font-bold">{Math.round(kpiCards?.valor?.ant.iso).toLocaleString()}</span>
                      <span className="text-[8.5px] font-medium opacity-95">{((kpiCards?.valor?.ant.iso / (kpiCards?.valor?.ant.total || 1)) * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-700 font-bold mt-2">{data?.anioAnterior}</span>
                </div>

                <div className="flex-1 flex flex-col items-center h-full justify-end">
                  <span className="bg-slate-100 border border-slate-300 rounded-xs text-[9.5px] font-bold text-slate-700 px-1.5 py-0.5 mb-1 shadow-2xs">
                    {Math.round(kpiCards?.valor?.act.total).toLocaleString()}
                  </span>
                  <div className="w-full max-w-[52px] flex flex-col rounded-t-xs overflow-hidden h-[95%] border border-slate-300 shadow-2xs">
                    <div 
                      style={{ height: `${(kpiCards?.valor?.act.sue / (kpiCards?.valor?.act.total || 1)) * 100}%` }} 
                      className="bg-[#1ba3b8] flex flex-col items-center justify-center text-white leading-tight p-0.5"
                    >
                      <span className="text-[10px] font-bold">{Math.round(kpiCards?.valor?.act.sue).toLocaleString()}</span>
                      <span className="text-[8.5px] font-medium opacity-95">{((kpiCards?.valor?.act.sue / (kpiCards?.valor?.act.total || 1)) * 100).toFixed(1)}%</span>
                    </div>
                    <div 
                      style={{ height: `${(kpiCards?.valor?.act.iso / (kpiCards?.valor?.act.total || 1)) * 100}%` }} 
                      className="bg-[#f28e2c] flex flex-col items-center justify-center text-white leading-tight p-0.5"
                    >
                      <span className="text-[10px] font-bold">{Math.round(kpiCards?.valor?.act.iso).toLocaleString()}</span>
                      <span className="text-[8.5px] font-medium opacity-95">{((kpiCards?.valor?.act.iso / (kpiCards?.valor?.act.total || 1)) * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-700 font-bold mt-2">{data?.anioActual}</span>
                </div>

                <div className="flex-1 flex flex-col items-center h-full justify-end">
                  <span className="bg-slate-100 border border-slate-300 rounded-xs text-[9.5px] font-bold text-slate-800 px-1.5 py-0.5 mb-1 shadow-2xs">
                    {kpiCards?.valor?.varTotal >= 0 ? `+${kpiCards?.valor?.varTotal.toFixed(2)}%` : `${kpiCards?.valor?.varTotal.toFixed(2)}%`}
                  </span>
                  <div className="w-full max-w-[52px] flex flex-col rounded-t-xs overflow-hidden h-[95%] bg-[#b0b6bf] p-1.5 justify-around shadow-2xs border border-slate-400/40">
                    <div className="bg-[#1ba3b8] rounded-xs text-[9.5px] text-white font-bold text-center py-0.5 shadow-xs">
                      {kpiCards?.valor?.varSue >= 0 ? `+${kpiCards?.valor?.varSue.toFixed(1)}%` : `${kpiCards?.valor?.varSue.toFixed(1)}%`}
                    </div>
                    <div className="bg-[#f28e2c] rounded-xs text-[9.5px] text-white font-bold text-center py-0.5 shadow-xs">
                      {kpiCards?.valor?.varIso >= 0 ? `+${kpiCards?.valor?.varIso.toFixed(1)}%` : `${kpiCards?.valor?.varIso.toFixed(1)}%`}
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-700 font-bold mt-2">%Var.</span>
                </div>
              </div>
            </div>

            {/* Card 4: Valor USD (Precio Promedio) */}
            <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs flex flex-col justify-between">
              <div className="border-b border-blue-200 border-dashed pb-2 mb-2 text-center">
                <h3 className="font-bold text-xs md:text-sm text-[#0066c0]">Valor USD (000)</h3>
              </div>
              <div className="flex items-end justify-between gap-2 h-56 pt-2">
                {/* Gráfico de Líneas (2025 vs 2026) */}
                <div className="flex-[2] flex flex-col justify-between h-full">
                  <div className="relative flex-1 w-full flex items-center justify-center">
                    <svg viewBox="0 0 200 140" className="w-full h-full overflow-visible">
                      {/* Línea Sueros (Cyan/Teal #1ba3b8) */}
                      <line x1="35" y1="45" x2="165" y2="43" stroke="#1ba3b8" strokeWidth="3" strokeLinecap="round" />
                      <circle cx="35" cy="45" r="4.5" fill="#1ba3b8" stroke="#ffffff" strokeWidth="2" />
                      <circle cx="165" cy="43" r="4.5" fill="#1ba3b8" stroke="#ffffff" strokeWidth="2" />
                      
                      {/* Badge Sueros 2025 */}
                      <rect x="18" y="18" width="34" height="15" rx="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                      <text x="35" y="29" textAnchor="middle" fill="#0f172a" fontSize="9.5" fontWeight="bold">
                        {kpiCards?.precio?.ant.sue.toFixed(2)}
                      </text>

                      {/* Badge Sueros 2026 */}
                      <rect x="148" y="16" width="34" height="15" rx="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                      <text x="165" y="27" textAnchor="middle" fill="#0f172a" fontSize="9.5" fontWeight="bold">
                        {kpiCards?.precio?.act.sue.toFixed(2)}
                      </text>

                      {/* Línea Isotónicas (Naranja #f28e2c) */}
                      <line x1="35" y1="105" x2="165" y2="108" stroke="#f28e2c" strokeWidth="3" strokeLinecap="round" />
                      <circle cx="35" cy="105" r="4.5" fill="#f28e2c" stroke="#ffffff" strokeWidth="2" />
                      <circle cx="165" cy="108" r="4.5" fill="#f28e2c" stroke="#ffffff" strokeWidth="2" />

                      {/* Badge Isotónicas 2025 */}
                      <rect x="18" y="78" width="34" height="15" rx="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                      <text x="35" y="89" textAnchor="middle" fill="#0f172a" fontSize="9.5" fontWeight="bold">
                        {kpiCards?.precio?.ant.iso < 1 ? `.${(kpiCards?.precio?.ant.iso * 100).toFixed(0)}` : kpiCards?.precio?.ant.iso.toFixed(2)}
                      </text>

                      {/* Badge Isotónicas 2026 */}
                      <rect x="148" y="81" width="34" height="15" rx="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                      <text x="165" y="92" textAnchor="middle" fill="#0f172a" fontSize="9.5" fontWeight="bold">
                        {kpiCards?.precio?.act.iso < 1 ? `.${(kpiCards?.precio?.act.iso * 100).toFixed(0)}` : kpiCards?.precio?.act.iso.toFixed(2)}
                      </text>
                    </svg>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-slate-700 font-bold px-4 mt-2">
                    <span>{data?.anioAnterior}</span>
                    <span>{data?.anioActual}</span>
                  </div>
                </div>

                {/* Pilar % Var */}
                <div className="flex-1 flex flex-col items-center h-full justify-end">
                  <span className="bg-slate-100 border border-slate-300 rounded-xs text-[9.5px] font-bold text-slate-800 px-1.5 py-0.5 mb-1 shadow-2xs">
                    {kpiCards?.precio?.varTotal >= 0 ? `+${kpiCards?.precio?.varTotal.toFixed(2)}%` : `${kpiCards?.precio?.varTotal.toFixed(2)}%`}
                  </span>
                  <div className="w-full max-w-[52px] flex flex-col rounded-t-xs overflow-hidden h-[92%] bg-[#b0b6bf] p-1.5 justify-around shadow-2xs border border-slate-400/40">
                    <div className="bg-[#1ba3b8] rounded-xs text-[9.5px] text-white font-bold text-center py-0.5 shadow-xs">
                      {kpiCards?.precio?.varSue >= 0 ? `+${kpiCards?.precio?.varSue.toFixed(1)}%` : `${kpiCards?.precio?.varSue.toFixed(1)}%`}
                    </div>
                    <div className="bg-[#f28e2c] rounded-xs text-[9.5px] text-white font-bold text-center py-0.5 shadow-xs">
                      {kpiCards?.precio?.varIso >= 0 ? `+${kpiCards?.precio?.varIso.toFixed(1)}%` : `${kpiCards?.precio?.varIso.toFixed(1)}%`}
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-700 font-bold mt-2">%Var.</span>
                </div>
              </div>
            </div>

            {/* Card 5: Dist. Num. */}
            <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs flex flex-col justify-between">
              <div className="border-b border-blue-200 border-dashed pb-2 mb-2 text-center">
                <h3 className="font-bold text-xs md:text-sm text-[#0066c0]">Dist. Num. (000)</h3>
              </div>
              <div className="flex items-end justify-between gap-2 h-56 pt-2">
                {/* Gráfico de Líneas (2025 vs 2026) */}
                <div className="flex-[2] flex flex-col justify-between h-full">
                  <div className="relative flex-1 w-full flex items-center justify-center">
                    <svg viewBox="0 0 200 140" className="w-full h-full overflow-visible">
                      {/* Línea Isotónicas (Arriba, Naranja #f28e2c) */}
                      <line x1="35" y1="42" x2="165" y2="40" stroke="#f28e2c" strokeWidth="3" strokeLinecap="round" />
                      <circle cx="35" cy="42" r="4.5" fill="#f28e2c" stroke="#ffffff" strokeWidth="2" />
                      <circle cx="165" cy="40" r="4.5" fill="#f28e2c" stroke="#ffffff" strokeWidth="2" />

                      {/* Badge Isotónicas 2025 */}
                      <rect x="20" y="14" width="30" height="15" rx="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                      <text x="35" y="25" textAnchor="middle" fill="#0f172a" fontSize="9.5" fontWeight="bold">
                        {kpiCards?.distNum?.ant.iso.toFixed(1)}
                      </text>

                      {/* Badge Isotónicas 2026 */}
                      <rect x="150" y="12" width="30" height="15" rx="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                      <text x="165" y="23" textAnchor="middle" fill="#0f172a" fontSize="9.5" fontWeight="bold">
                        {kpiCards?.distNum?.act.iso.toFixed(1)}
                      </text>

                      {/* Línea Sueros (Abajo, Cyan/Teal #1ba3b8) */}
                      <line x1="35" y1="98" x2="165" y2="88" stroke="#1ba3b8" strokeWidth="3" strokeLinecap="round" />
                      <circle cx="35" cy="98" r="4.5" fill="#1ba3b8" stroke="#ffffff" strokeWidth="2" />
                      <circle cx="165" cy="88" r="4.5" fill="#1ba3b8" stroke="#ffffff" strokeWidth="2" />

                      {/* Badge Sueros 2025 */}
                      <rect x="20" y="70" width="30" height="15" rx="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                      <text x="35" y="81" textAnchor="middle" fill="#0f172a" fontSize="9.5" fontWeight="bold">
                        {kpiCards?.distNum?.ant.sue.toFixed(1)}
                      </text>

                      {/* Badge Sueros 2026 */}
                      <rect x="150" y="60" width="30" height="15" rx="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                      <text x="165" y="71" textAnchor="middle" fill="#0f172a" fontSize="9.5" fontWeight="bold">
                        {kpiCards?.distNum?.act.sue.toFixed(1)}
                      </text>
                    </svg>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-slate-700 font-bold px-4 mt-2">
                    <span>{data?.anioAnterior}</span>
                    <span>{data?.anioActual}</span>
                  </div>
                </div>

                {/* Pilar % Var */}
                <div className="flex-1 flex flex-col items-center h-full justify-end">
                  <span className="bg-slate-100 border border-slate-300 rounded-xs text-[9.5px] font-bold text-slate-800 px-1.5 py-0.5 mb-1 shadow-2xs">
                    0.0
                  </span>
                  <div className="w-full max-w-[52px] flex flex-col rounded-t-xs overflow-hidden h-[92%] bg-[#b0b6bf] p-1.5 justify-around shadow-2xs border border-slate-400/40">
                    <div className="bg-[#1ba3b8] rounded-xs text-[9.5px] text-white font-bold text-center py-0.5 shadow-xs">
                      {kpiCards?.distNum?.varSue >= 0 ? `+${kpiCards?.distNum?.varSue.toFixed(1)}` : `${kpiCards?.distNum?.varSue.toFixed(1)}`}
                    </div>
                    <div className="bg-[#f28e2c] rounded-xs text-[9.5px] text-white font-bold text-center py-0.5 shadow-xs">
                      {kpiCards?.distNum?.varIso >= 0 ? `+${kpiCards?.distNum?.varIso.toFixed(1)}` : `${kpiCards?.distNum?.varIso.toFixed(1)}`}
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-700 font-bold mt-2">%Var.</span>
                </div>
              </div>
            </div>

          </div>

          {/* 3. FILAS 2 & 3: GRÁFICAS MENSUALES HISTÓRICAS (L12M) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Gráfica 1: Unidades Mensual (Barras Apiladas) */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
              <div className="border-b border-blue-200 border-dashed pb-2 mb-3 text-center">
                <h3 className="font-bold text-sm text-[#0066c0]">Unidades (000)</h3>
              </div>
              <div className="flex items-end justify-between gap-1.5 h-64 pt-2 border-b border-slate-200">
                {data?.monthlyTrends?.map((m, idx) => {
                  const maxUnds = 34000; // Escala máxima Guatemala (~32k max)
                  const total = m.unds_total || 1;
                  const hPct = Math.min(100, (total / maxUnds) * 100);
                  const suePct = (m.unds_sueros / total) * 100;
                  const isoPct = (m.unds_isotonicas / total) * 100;
                  const [mon, yr] = m.mes_label.split('-');
                  const esMon = { Jan: 'ene', Feb: 'feb', Mar: 'mar', Apr: 'abr', May: 'may', Jun: 'jun', Jul: 'jul', Aug: 'ago', Sep: 'sep', Oct: 'oct', Nov: 'nov', Dec: 'dic' }[mon] || mon.toLowerCase();

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end">
                      {/* Badge Total Superior */}
                      <span className="bg-slate-100 border border-slate-300/80 rounded-xs text-[9px] font-bold text-slate-700 px-1 py-0.5 mb-1 shadow-2xs">
                        {Math.round(total).toLocaleString()}
                      </span>
                      {/* Columna Apilada Ancha */}
                      <div style={{ height: `${hPct}%` }} className="w-full max-w-[46px] flex flex-col rounded-t-xs overflow-hidden border border-slate-300 shadow-2xs">
                        {/* Sueros (Arriba) */}
                        <div style={{ height: `${suePct}%` }} className="bg-[#1ba3b8] flex flex-col items-center justify-center text-white leading-tight p-0.5">
                          <span className="text-[9.5px] font-bold">{Math.round(m.unds_sueros).toLocaleString()}</span>
                          <span className="text-[8px] font-medium opacity-90">{suePct.toFixed(0)}%</span>
                        </div>
                        {/* Isotónicas (Abajo) */}
                        <div style={{ height: `${isoPct}%` }} className="bg-[#f28e2c] flex flex-col items-center justify-center text-white leading-tight p-0.5">
                          <span className="text-[9.5px] font-bold">{Math.round(m.unds_isotonicas).toLocaleString()}</span>
                          <span className="text-[8px] font-medium opacity-90">{isoPct.toFixed(0)}%</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-600 font-bold mt-1.5 truncate">
                        {esMon}-{yr}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Gráfica 2: Precio/Unidad USD Mensual (Líneas con puntos y etiquetas) */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
              <div className="border-b border-blue-200 border-dashed pb-2 mb-3 text-center">
                <h3 className="font-bold text-sm text-[#0066c0]">Precio/Unidad USD</h3>
              </div>
              <div className="flex flex-col justify-between h-64 pt-2 border-b border-slate-200">
                <div className="relative h-52 w-full">
                  <svg viewBox="0 0 1000 200" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                    {/* Línea Sueros (Cyan/Teal #1ba3b8 ~2.18 - 2.26) */}
                    <polyline
                      fill="none"
                      stroke="#1ba3b8"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={data?.monthlyTrends?.map((m, idx) => {
                        const count = data.monthlyTrends.length;
                        const x = 40 + (idx / (count - 1)) * 920;
                        const y = 80 - ((m.precio_sueros - 2.10) / 0.40) * 60;
                        return `${x},${y}`;
                      }).join(' ')}
                    />
                    {/* Línea Isotónicas (Naranja #f28e2c ~0.60 - 0.68) */}
                    <polyline
                      fill="none"
                      stroke="#f28e2c"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={data?.monthlyTrends?.map((m, idx) => {
                        const count = data.monthlyTrends.length;
                        const x = 40 + (idx / (count - 1)) * 920;
                        const y = 175 - ((m.precio_isotonicas - 0.55) / 0.30) * 45;
                        return `${x},${y}`;
                      }).join(' ')}
                    />

                    {/* Puntos y Etiquetas de Sueros */}
                    {data?.monthlyTrends?.map((m, idx) => {
                      const count = data.monthlyTrends.length;
                      const x = 40 + (idx / (count - 1)) * 920;
                      const y = 80 - ((m.precio_sueros - 2.10) / 0.40) * 60;
                      return (
                        <g key={`sue-${idx}`}>
                          <circle cx={x} cy={y} r="5" fill="#1ba3b8" stroke="#ffffff" strokeWidth="2.5" />
                          <rect x={x - 17} y={y - 23} width="34" height="16" rx="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                          <text x={x} y={y - 11} textAnchor="middle" fill="#0f172a" fontSize="11" fontWeight="bold">
                            {m.precio_sueros.toFixed(2)}
                          </text>
                        </g>
                      );
                    })}

                    {/* Puntos y Etiquetas de Isotónicas */}
                    {data?.monthlyTrends?.map((m, idx) => {
                      const count = data.monthlyTrends.length;
                      const x = 40 + (idx / (count - 1)) * 920;
                      const y = 175 - ((m.precio_isotonicas - 0.55) / 0.30) * 45;
                      return (
                        <g key={`iso-${idx}`}>
                          <circle cx={x} cy={y} r="5" fill="#f28e2c" stroke="#ffffff" strokeWidth="2.5" />
                          <rect x={x - 17} y={y - 23} width="34" height="16" rx="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                          <text x={x} y={y - 11} textAnchor="middle" fill="#0f172a" fontSize="11" fontWeight="bold">
                            {m.precio_isotonicas.toFixed(2)}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* Eje X de Meses */}
                <div className="flex justify-between items-center text-[10px] text-slate-600 font-bold px-4 pb-1">
                  {data?.monthlyTrends?.map((m, idx) => {
                    const [mon, yr] = m.mes_label.split('-');
                    const esMon = { Jan: 'ene', Feb: 'feb', Mar: 'mar', Apr: 'abr', May: 'may', Jun: 'jun', Jul: 'jul', Aug: 'ago', Sep: 'sep', Oct: 'oct', Nov: 'nov', Dec: 'dic' }[mon] || mon.toLowerCase();
                    return <span key={idx} className="truncate">{esMon}-{yr}</span>;
                  })}
                </div>
              </div>
            </div>

            {/* Gráfica 3: Valor USD Mensual (Barras Apiladas) */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
              <div className="border-b border-blue-200 border-dashed pb-2 mb-3 text-center">
                <h3 className="font-bold text-sm text-[#0066c0]">Valor USD (000)</h3>
              </div>
              <div className="flex items-end justify-between gap-1.5 h-64 pt-2 border-b border-slate-200">
                {data?.monthlyTrends?.map((m, idx) => {
                  const maxVal = 26000; // Escala máxima Guatemala (~24k max)
                  const total = m.valor_total || 1;
                  const hPct = Math.min(100, (total / maxVal) * 100);
                  const suePct = (m.valor_sueros / total) * 100;
                  const isoPct = (m.valor_isotonicas / total) * 100;
                  const [mon, yr] = m.mes_label.split('-');
                  const esMon = { Jan: 'ene', Feb: 'feb', Mar: 'mar', Apr: 'abr', May: 'may', Jun: 'jun', Jul: 'jul', Aug: 'ago', Sep: 'sep', Oct: 'oct', Nov: 'nov', Dec: 'dic' }[mon] || mon.toLowerCase();

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end">
                      {/* Badge Total Superior */}
                      <span className="bg-slate-100 border border-slate-300/80 rounded-xs text-[9px] font-bold text-slate-700 px-1 py-0.5 mb-1 shadow-2xs">
                        {Math.round(total).toLocaleString()}
                      </span>
                      {/* Columna Apilada Ancha */}
                      <div style={{ height: `${hPct}%` }} className="w-full max-w-[46px] flex flex-col rounded-t-xs overflow-hidden border border-slate-300 shadow-2xs">
                        {/* Sueros (Arriba) */}
                        <div style={{ height: `${suePct}%` }} className="bg-[#1ba3b8] flex flex-col items-center justify-center text-white leading-tight p-0.5">
                          <span className="text-[9.5px] font-bold">{Math.round(m.valor_sueros).toLocaleString()}</span>
                          <span className="text-[8px] font-medium opacity-90">{suePct.toFixed(0)}%</span>
                        </div>
                        {/* Isotónicas (Abajo) */}
                        <div style={{ height: `${isoPct}%` }} className="bg-[#f28e2c] flex flex-col items-center justify-center text-white leading-tight p-0.5">
                          <span className="text-[9.5px] font-bold">{Math.round(m.valor_isotonicas).toLocaleString()}</span>
                          <span className="text-[8px] font-medium opacity-90">{isoPct.toFixed(0)}%</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-600 font-bold mt-1.5 truncate">
                        {esMon}-{yr}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Gráfica 4: Dist. Num. Mensual (Líneas con puntos y etiquetas) */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
              <div className="border-b border-blue-200 border-dashed pb-2 mb-3 text-center">
                <h3 className="font-bold text-sm text-[#0066c0]">Dist. Num.</h3>
              </div>
              <div className="flex flex-col justify-between h-64 pt-2 border-b border-slate-200">
                <div className="relative h-52 w-full">
                  <svg viewBox="0 0 1000 200" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                    {/* Línea Isotónicas (Naranja, arriba ~77-80%) */}
                    <polyline
                      fill="none"
                      stroke="#f28e2c"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={data?.monthlyTrends?.map((m, idx) => {
                        const count = data.monthlyTrends.length;
                        const x = 40 + (idx / (count - 1)) * 920;
                        const y = 80 - ((m.dist_isotonicas - 75) / 10) * 55;
                        return `${x},${y}`;
                      }).join(' ')}
                    />
                    {/* Línea Sueros (Cyan/Teal, abajo ~40-48%) */}
                    <polyline
                      fill="none"
                      stroke="#1ba3b8"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={data?.monthlyTrends?.map((m, idx) => {
                        const count = data.monthlyTrends.length;
                        const x = 40 + (idx / (count - 1)) * 920;
                        const y = 175 - ((m.dist_sueros - 38) / 15) * 50;
                        return `${x},${y}`;
                      }).join(' ')}
                    />

                    {/* Puntos y Etiquetas Isotónicas */}
                    {data?.monthlyTrends?.map((m, idx) => {
                      const count = data.monthlyTrends.length;
                      const x = 40 + (idx / (count - 1)) * 920;
                      const y = 80 - ((m.dist_isotonicas - 75) / 10) * 55;
                      return (
                        <g key={`dist-iso-${idx}`}>
                          <circle cx={x} cy={y} r="5" fill="#f28e2c" stroke="#ffffff" strokeWidth="2.5" />
                          <rect x={x - 14} y={y - 23} width="28" height="16" rx="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                          <text x={x} y={y - 11} textAnchor="middle" fill="#0f172a" fontSize="11" fontWeight="bold">
                            {Math.round(m.dist_isotonicas)}
                          </text>
                        </g>
                      );
                    })}

                    {/* Puntos y Etiquetas Sueros */}
                    {data?.monthlyTrends?.map((m, idx) => {
                      const count = data.monthlyTrends.length;
                      const x = 40 + (idx / (count - 1)) * 920;
                      const y = 175 - ((m.dist_sueros - 38) / 15) * 50;
                      return (
                        <g key={`dist-sue-${idx}`}>
                          <circle cx={x} cy={y} r="5" fill="#1ba3b8" stroke="#ffffff" strokeWidth="2.5" />
                          <rect x={x - 14} y={y - 23} width="28" height="16" rx="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                          <text x={x} y={y - 11} textAnchor="middle" fill="#0f172a" fontSize="11" fontWeight="bold">
                            {Math.round(m.dist_sueros)}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* Eje X de Meses */}
                <div className="flex justify-between items-center text-[10px] text-slate-600 font-bold px-4 pb-1">
                  {data?.monthlyTrends?.map((m, idx) => {
                    const [mon, yr] = m.mes_label.split('-');
                    const esMon = { Jan: 'ene', Feb: 'feb', Mar: 'mar', Apr: 'abr', May: 'may', Jun: 'jun', Jul: 'jul', Aug: 'ago', Sep: 'sep', Oct: 'oct', Nov: 'nov', Dec: 'dic' }[mon] || mon.toLowerCase();
                    return <span key={idx} className="truncate">{esMon}-{yr}</span>;
                  })}
                </div>
              </div>
            </div>

          </div>

          {/* 4. FILA 4: MATRICES HEATMAP SOM (UNIDADES & USD) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Tabla Izquierda: SOM Unidades */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs overflow-x-auto">
              <h3 className="text-center font-bold text-xs text-[#0066c0] mb-2">SOM Unidades</h3>
              <table className="w-full text-[10px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-300 bg-slate-200/80 text-slate-700 font-bold">
                    <th className="py-1.5 px-2">MARCA GUATEMALA</th>
                    {data?.uniqueMonths?.map((m, idx) => {
                      const [mon, yr] = m.split('-');
                      const esMon = { Jan: 'ene', Feb: 'feb', Mar: 'mar', Apr: 'abr', May: 'may', Jun: 'jun', Jul: 'jul', Aug: 'ago', Sep: 'sep', Oct: 'oct', Nov: 'nov', Dec: 'dic' }[mon] || mon.toLowerCase();
                      return (
                        <th key={idx} className="py-1.5 px-1 text-center font-bold border-l border-slate-300/60">
                          {esMon}-{yr}
                        </th>
                      );
                    })}
                    <th className="py-1.5 px-2 text-center font-black bg-slate-300 text-slate-900 border-l border-slate-400">
                      Total ▾
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {data?.somUnidades?.map((row, idx) => {
                    const isPisa = ['HIDRAVIDA', 'HIDRALIFE', 'ELECTROLIT', 'ELECTROLIFE'].includes(row.MARCA);
                    return (
                      <tr key={idx} className={isPisa ? 'font-bold bg-blue-50/50' : 'hover:bg-slate-50/60'}>
                        <td className="py-1 px-2 font-bold text-slate-800 flex items-center gap-1 border-r border-slate-200">
                          {row.MARCA === 'HIDRAVIDA' && <Award className="w-3 h-3 text-cyan-600 shrink-0" />}
                          <span className="truncate max-w-[90px]">{row.MARCA}</span>
                        </td>
                        {data?.uniqueMonths?.map((m, mIdx) => {
                          const val = row[m];
                          const prevMonth = mIdx > 0 ? data.uniqueMonths[mIdx - 1] : (data?.baselineMonth || null);
                          const prevVal = prevMonth ? row[prevMonth] : undefined;
                          const cellStyle = getSomDeltaStyle(val, prevVal);

                          return (
                            <td key={mIdx} className={`py-1 px-1 text-center text-[9px] border-r border-slate-200/70 transition-colors ${cellStyle}`}>
                              {val !== undefined ? `${val.toFixed(1)}%` : '-'}
                            </td>
                          );
                        })}
                        <td className="py-1 px-2 text-center text-[9.5px] font-black bg-slate-200/90 text-slate-900 border-l border-slate-300">
                          {row.Total !== undefined ? `${row.Total.toFixed(1)}%` : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Tabla Derecha: SOM USD */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs overflow-x-auto">
              <h3 className="text-center font-bold text-xs text-[#0066c0] mb-2">SOM USD</h3>
              <table className="w-full text-[10px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-300 bg-slate-200/80 text-slate-700 font-bold">
                    <th className="py-1.5 px-2">MARCA GUATEMALA</th>
                    {data?.uniqueMonths?.map((m, idx) => {
                      const [mon, yr] = m.split('-');
                      const esMon = { Jan: 'ene', Feb: 'feb', Mar: 'mar', Apr: 'abr', May: 'may', Jun: 'jun', Jul: 'jul', Aug: 'ago', Sep: 'sep', Oct: 'oct', Nov: 'nov', Dec: 'dic' }[mon] || mon.toLowerCase();
                      return (
                        <th key={idx} className="py-1.5 px-1 text-center font-bold border-l border-slate-300/60">
                          {esMon}-{yr}
                        </th>
                      );
                    })}
                    <th className="py-1.5 px-2 text-center font-black bg-slate-300 text-slate-900 border-l border-slate-400">
                      Total ▾
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {data?.somUSD?.map((row, idx) => {
                    const isPisa = ['HIDRAVIDA', 'HIDRALIFE', 'ELECTROLIT', 'ELECTROLIFE'].includes(row.MARCA);
                    return (
                      <tr key={idx} className={isPisa ? 'font-bold bg-blue-50/50' : 'hover:bg-slate-50/60'}>
                        <td className="py-1 px-2 font-bold text-slate-800 flex items-center gap-1 border-r border-slate-200">
                          {row.MARCA === 'HIDRAVIDA' && <Award className="w-3 h-3 text-cyan-600 shrink-0" />}
                          <span className="truncate max-w-[90px]">{row.MARCA}</span>
                        </td>
                        {data?.uniqueMonths?.map((m, mIdx) => {
                          const val = row[m];
                          const prevMonth = mIdx > 0 ? data.uniqueMonths[mIdx - 1] : (data?.baselineMonth || null);
                          const prevVal = prevMonth ? row[prevMonth] : undefined;
                          const cellStyle = getSomDeltaStyle(val, prevVal);

                          return (
                            <td key={mIdx} className={`py-1 px-1 text-center text-[9px] border-r border-slate-200/70 transition-colors ${cellStyle}`}>
                              {val !== undefined ? `${val.toFixed(1)}%` : '-'}
                            </td>
                          );
                        })}
                        <td className="py-1 px-2 text-center text-[9.5px] font-black bg-slate-200/90 text-slate-900 border-l border-slate-300">
                          {row.Total !== undefined ? `${row.Total.toFixed(1)}%` : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        </>
      )}

    </div>
  );
}
