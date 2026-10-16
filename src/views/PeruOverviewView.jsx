import React, { useState, useEffect, useMemo } from 'react';
import { Home, RefreshCw } from 'lucide-react';

export default function PeruOverviewView({ onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [anio, setAnio] = useState('2026');
  const [mes, setMes] = useState('Todas');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/nielsen/pe/overview-dashboard?anio=${anio}&mes=${mes}`)
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error al cargar datos de Overview Perú:', err);
        setLoading(false);
      });
  }, [anio, mes]);

  const rawMonthlyTrends = useMemo(() => data?.monthlyTrends || [], [data]);

  // Cálculo de KPIs superiores YTD comparativos (Año Actual vs Año Anterior)
  const kpiCards = useMemo(() => {
    if (!rawMonthlyTrends.length) return null;

    const calcVar = (curr, prev) => (!prev || prev === 0 ? 0 : ((curr - prev) / prev) * 100);
    const yrCurr = anio === '2026' ? '26' : '25';
    const yrPrev = anio === '2026' ? '25' : '24';
    const monthCodes = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

    let maxM = 12;
    if (mes === 'Todas') {
      maxM = anio === '2026' ? 9 : 12;
    } else {
      maxM = parseInt(mes, 10) || 1;
    }

    const visibleMonths = monthCodes.slice(0, maxM);
    const currentMonthsData = visibleMonths
      .map((m) => rawMonthlyTrends.find((t) => t.mes_label.toLowerCase() === `${m}-${yrCurr}`.toLowerCase()))
      .filter(Boolean);
    const prevMonthsData = visibleMonths
      .map((m) => rawMonthlyTrends.find((t) => t.mes_label.toLowerCase() === `${m}-${yrPrev}`.toLowerCase()))
      .filter(Boolean);

    // Sumatorias Unidades (000)
    const undsIsoAct = currentMonthsData.reduce((acc, r) => acc + (r.isotonicos_unds || 0), 0);
    const undsSueAct = currentMonthsData.reduce((acc, r) => acc + (r.sueros_unds || 0), 0);
    const undsIsoAnt = prevMonthsData.reduce((acc, r) => acc + (r.isotonicos_unds || 0), 0);
    const undsSueAnt = prevMonthsData.reduce((acc, r) => acc + (r.sueros_unds || 0), 0);
    const undsTotAct = undsIsoAct + undsSueAct;
    const undsTotAnt = undsIsoAnt + undsSueAnt;

    // Sumatorias Litros (000)
    const ltIsoAct = currentMonthsData.reduce((acc, r) => acc + (r.isotonicos_lt || Math.round((r.isotonicos_unds || 0) * 0.5739)), 0);
    const ltSueAct = currentMonthsData.reduce((acc, r) => acc + (r.sueros_lt || Math.round((r.sueros_unds || 0) * 0.6338)), 0);
    const ltTotAct = ltIsoAct + ltSueAct;

    const ltIsoAnt = prevMonthsData.reduce((acc, r) => acc + (r.isotonicos_lt || Math.round((r.isotonicos_unds || 0) * 0.5739)), 0);
    const ltSueAnt = prevMonthsData.reduce((acc, r) => acc + (r.sueros_lt || Math.round((r.sueros_unds || 0) * 0.6338)), 0);
    const ltTotAnt = ltIsoAnt + ltSueAnt;

    // Sumatorias Valor SOL (000)
    const valIsoAct = currentMonthsData.reduce((acc, r) => acc + (r.isotonicos_val || 0), 0);
    const valSueAct = currentMonthsData.reduce((acc, r) => acc + (r.sueros_val || 0), 0);
    const valTotAct = valIsoAct + valSueAct;

    const valIsoAnt = prevMonthsData.reduce((acc, r) => acc + (r.isotonicos_val || 0), 0);
    const valSueAnt = prevMonthsData.reduce((acc, r) => acc + (r.sueros_val || 0), 0);
    const valTotAnt = valIsoAnt + valSueAnt;

    // Precios Unitarios SOL
    const prIsoAct = undsIsoAct > 0 ? valIsoAct / undsIsoAct : 2.0;
    const prSueAct = undsSueAct > 0 ? valSueAct / undsSueAct : 4.7;
    const prTotAct = undsTotAct > 0 ? valTotAct / undsTotAct : 2.3;

    const prIsoAnt = undsIsoAnt > 0 ? valIsoAnt / undsIsoAnt : 2.0;
    const prSueAnt = undsSueAnt > 0 ? valSueAnt / undsSueAnt : 5.1;
    const prTotAnt = undsTotAnt > 0 ? valTotAnt / undsTotAnt : 2.3;

    // Distribución Numérica Promedio
    const distIsoAct = currentMonthsData.length > 0 ? currentMonthsData.reduce((acc, r) => acc + (r.isotonicos_dist || 0), 0) / currentMonthsData.length : 99.7;
    const distSueAct = currentMonthsData.length > 0 ? currentMonthsData.reduce((acc, r) => acc + (r.sueros_dist || 0), 0) / currentMonthsData.length : 98.3;

    const distIsoAnt = prevMonthsData.length > 0 ? prevMonthsData.reduce((acc, r) => acc + (r.isotonicos_dist || 0), 0) / prevMonthsData.length : 99.7;
    const distSueAnt = prevMonthsData.length > 0 ? prevMonthsData.reduce((acc, r) => acc + (r.sueros_dist || 0), 0) / prevMonthsData.length : 95.4;

    return {
      periodoYTD: mes === 'Todas' ? `YTD ${anio}` : `YTD (Ene-${visibleMonths[maxM - 1].toUpperCase()})`,
      unidades: {
        ant: { iso: Math.round(undsIsoAnt), sue: Math.round(undsSueAnt), total: Math.round(undsTotAnt) },
        act: { iso: Math.round(undsIsoAct), sue: Math.round(undsSueAct), total: Math.round(undsTotAct) },
        varTotal: calcVar(undsTotAct, undsTotAnt),
        varIso: calcVar(undsIsoAct, undsIsoAnt),
        varSue: calcVar(undsSueAct, undsSueAnt)
      },
      litros: {
        ant: { iso: Math.round(ltIsoAnt), sue: Math.round(ltSueAnt), total: Math.round(ltTotAnt) },
        act: { iso: Math.round(ltIsoAct), sue: Math.round(ltSueAct), total: Math.round(ltTotAct) },
        varTotal: calcVar(ltTotAct, ltTotAnt),
        varIso: calcVar(ltIsoAct, ltIsoAnt),
        varSue: calcVar(ltSueAct, ltSueAnt)
      },
      valor: {
        ant: { iso: Math.round(valIsoAnt), sue: Math.round(valSueAnt), total: Math.round(valTotAnt) },
        act: { iso: Math.round(valIsoAct), sue: Math.round(valSueAct), total: Math.round(valTotAct) },
        varTotal: calcVar(valTotAct, valTotAnt),
        varIso: calcVar(valIsoAct, valIsoAnt),
        varSue: calcVar(valSueAct, valSueAnt)
      },
      precio: {
        ant: { iso: Number(prIsoAnt.toFixed(1)), sue: Number(prSueAnt.toFixed(1)), total: Number(prTotAnt.toFixed(1)) },
        act: { iso: Number(prIsoAct.toFixed(1)), sue: Number(prSueAct.toFixed(1)), total: Number(prTotAct.toFixed(1)) },
        varTotal: calcVar(prTotAct, prTotAnt),
        varIso: ((prIsoAct / prIsoAnt) - 1) * 100,
        varSue: ((prSueAct / prSueAnt) - 1) * 100
      },
      distNum: {
        ant: { iso: Number(distIsoAnt.toFixed(1)), sue: Number(distSueAnt.toFixed(1)) },
        act: { iso: Number(distIsoAct.toFixed(1)), sue: Number(distSueAct.toFixed(1)) },
        varTotal: ((distIsoAct + distSueAct) / 2) - ((distIsoAnt + distSueAnt) / 2),
        varIso: distIsoAct - distIsoAnt,
        varSue: distSueAct - distSueAnt
      }
    };
  }, [data, anio, mes, rawMonthlyTrends]);

  // Formateador condicional MoM (+0.2 verde, -0.2 rojizo)
  const getSomDeltaStyle = (currentVal, previousVal) => {
    if (currentVal === undefined || currentVal === null) return 'text-slate-400 bg-transparent';
    if (previousVal === undefined || previousVal === null) return 'text-slate-800 bg-transparent';
    const delta = Number((currentVal - previousVal).toFixed(2));
    if (delta >= 0.2) return 'bg-[#a7f3d0] text-emerald-950 font-bold';
    if (delta <= -0.2) return 'bg-[#fecaca] text-rose-950 font-bold';
    return 'text-slate-800 bg-transparent';
  };

  const fmtNum = (val, dec = 0) => {
    if (val === undefined || val === null || isNaN(val)) return '-';
    return Number(val).toLocaleString('es-PE', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  };

  const allTimelineMonths = useMemo(() => [
    'sep-24', 'oct-24', 'nov-24', 'dic-24',
    'ene-25', 'feb-25', 'mar-25', 'abr-25', 'may-25', 'jun-25', 'jul-25', 'ago-25', 'sep-25', 'oct-25', 'nov-25', 'dic-25',
    'ene-26', 'feb-26', 'mar-26', 'abr-26', 'may-26', 'jun-26', 'jul-26', 'ago-26', 'sep-26'
  ], []);

  const getPreviousTimelineMonth = (monthLabel) => {
    const idx = allTimelineMonths.indexOf(monthLabel);
    return idx > 0 ? allTimelineMonths[idx - 1] : null;
  };

  // Ventana de 13 meses móviles visible
  const visibleMonthlyTrends = useMemo(() => {
    if (!rawMonthlyTrends.length) return [];
    let targetMonth = '';
    const yr = anio === '2026' ? '26' : '25';
    if (mes === 'Todas') {
      targetMonth = anio === '2026' ? 'sep-26' : 'dic-25';
    } else {
      const mNames = { 1: 'ene', 2: 'feb', 3: 'mar', 4: 'abr', 5: 'may', 6: 'jun', 7: 'jul', 8: 'ago', 9: 'sep', 10: 'oct', 11: 'nov', 12: 'dic' };
      targetMonth = `${mNames[mes] || 'mar'}-${yr}`;
    }

    let endIdx = rawMonthlyTrends.findIndex((t) => t.mes_label.toLowerCase() === targetMonth.toLowerCase());
    if (endIdx === -1) {
      const match = [...rawMonthlyTrends].reverse().findIndex((t) => t.mes_label.endsWith(yr));
      endIdx = match !== -1 ? rawMonthlyTrends.length - 1 - match : rawMonthlyTrends.length - 1;
    }
    const startIdx = Math.max(0, endIdx - 12);
    return rawMonthlyTrends.slice(startIdx, endIdx + 1);
  }, [rawMonthlyTrends, anio, mes]);

  const visibleMonthLabels = useMemo(() => visibleMonthlyTrends.map((t) => t.mes_label), [visibleMonthlyTrends]);

  const ytdMonthLabels = useMemo(() => {
    const yr = anio === '2026' ? '26' : '25';
    let maxM = 12;
    if (mes === 'Todas') {
      maxM = anio === '2026' ? 9 : 12;
    } else {
      maxM = parseInt(mes, 10) || 1;
    }
    return ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
      .slice(0, maxM)
      .map((m) => `${m}-${yr}`);
  }, [anio, mes]);

  // Tablas SOM Procesadas con Total Exacto
  const processedSomUnidades = useMemo(() => {
    if (!data?.somUnidades) return [];
    return [...data.somUnidades]
      .map((row) => {
        let ytdNum = 0, ytdDenom = 0;
        const ytdVals = ytdMonthLabels.map((m) => row.meses?.[m]).filter((v) => v !== undefined && v !== null);

        ytdMonthLabels.forEach((m) => {
          const tItem = (data.monthlyTrends || []).find((mt) => mt.mes_label === m);
          if (tItem) {
            const pKey = tItem.periodo;
            ytdNum += row.rawUndsByPeriod?.[pKey] || 0;
            ytdDenom += data.brandTotalsByMonth?.[pKey]?.unds || 0;
          }
        });

        const ytdExact = ytdDenom > 0 && ytdNum > 0 ? (ytdNum / ytdDenom) * 100 : ytdVals.length ? ytdVals.reduce((a, b) => a + b, 0) / ytdVals.length : 0;

        let totNum = 0, totDenom = 0;
        const totVals = visibleMonthLabels.map((m) => row.meses?.[m]).filter((v) => v !== undefined && v !== null);

        visibleMonthLabels.forEach((m) => {
          const tItem = (data.monthlyTrends || []).find((mt) => mt.mes_label === m);
          if (tItem) {
            const pKey = tItem.periodo;
            totNum += row.rawUndsByPeriod?.[pKey] || 0;
            totDenom += data.brandTotalsByMonth?.[pKey]?.unds || 0;
          }
        });

        const totalExact = totDenom > 0 && totNum > 0 ? (totNum / totDenom) * 100 : totVals.length ? totVals.reduce((a, b) => a + b, 0) / totVals.length : 0;

        return {
          ...row,
          totalExact,
          ytdExact
        };
      })
      .sort((a, b) => b.ytdExact - a.ytdExact);
  }, [data?.somUnidades, data?.monthlyTrends, data?.brandTotalsByMonth, visibleMonthLabels, ytdMonthLabels]);

  const processedSomValor = useMemo(() => {
    if (!data?.somValor) return [];
    return [...data.somValor]
      .map((row) => {
        let ytdNum = 0, ytdDenom = 0;
        const ytdVals = ytdMonthLabels.map((m) => row.meses?.[m]).filter((v) => v !== undefined && v !== null);

        ytdMonthLabels.forEach((m) => {
          const tItem = (data.monthlyTrends || []).find((mt) => mt.mes_label === m);
          if (tItem) {
            const pKey = tItem.periodo;
            ytdNum += row.rawValByPeriod?.[pKey] || 0;
            ytdDenom += data.brandTotalsByMonth?.[pKey]?.val || 0;
          }
        });

        const ytdExact = ytdDenom > 0 && ytdNum > 0 ? (ytdNum / ytdDenom) * 100 : ytdVals.length ? ytdVals.reduce((a, b) => a + b, 0) / ytdVals.length : 0;

        let totNum = 0, totDenom = 0;
        const totVals = visibleMonthLabels.map((m) => row.meses?.[m]).filter((v) => v !== undefined && v !== null);

        visibleMonthLabels.forEach((m) => {
          const tItem = (data.monthlyTrends || []).find((mt) => mt.mes_label === m);
          if (tItem) {
            const pKey = tItem.periodo;
            totNum += row.rawValByPeriod?.[pKey] || 0;
            totDenom += data.brandTotalsByMonth?.[pKey]?.val || 0;
          }
        });

        const totalExact = totDenom > 0 && totNum > 0 ? (totNum / totDenom) * 100 : totVals.length ? totVals.reduce((a, b) => a + b, 0) / totVals.length : 0;

        return {
          ...row,
          totalExact,
          ytdExact
        };
      })
      .sort((a, b) => b.ytdExact - a.ytdExact);
  }, [data?.somValor, data?.monthlyTrends, data?.brandTotalsByMonth, visibleMonthLabels, ytdMonthLabels]);

  const availableMonthsList = useMemo(() => {
    return (
      data?.availableMonthsByYear?.[anio] ||
      (anio === '2026'
        ? [
            { id: 'Todas', label: 'Todas' },
            { id: '1', label: 'Enero' },
            { id: '2', label: 'Febrero' },
            { id: '3', label: 'Marzo' },
            { id: '4', label: 'Abril' },
            { id: '5', label: 'Mayo' },
            { id: '6', label: 'Junio' },
            { id: '7', label: 'Julio' },
            { id: '8', label: 'Agosto' },
            { id: '9', label: 'Septiembre' }
          ]
        : [
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
          ])
    );
  }, [data, anio]);

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-800 font-sans p-3 md:p-5 space-y-4 select-none">
      {/* 1. CABECERA SUPERIOR: LOGOS, TITULO, LEYENDA Y FILTROS */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs px-5 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Logos Oficiales: Electrolife | Nielsen */}
        <div className="flex items-center gap-3">
          <img
            src="/assets/LOGOS/Electrolife-color.png"
            alt="Electrolife"
            className="h-8 md:h-9 object-contain"
            onError={(e) => {
              e.target.src = '/assets/LOGOS/Electrolit-color.png';
            }}
          />
          <div className="h-6 w-px bg-slate-300 mx-1" />
          <img src="/assets/LOGOS/Nielsen-logo.png" alt="Nielsen" className="h-7 md:h-8 object-contain" />
        </div>

        {/* Título Central */}
        <div className="text-center flex-1 min-w-[180px]">
          <h1 className="text-2xl font-black text-[#0066c0] tracking-tight">Overview</h1>
        </div>

        {/* Leyenda y Filtros */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Leyenda de Categorías */}
          <div className="flex items-center gap-4 text-xs font-semibold mr-2">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-[#E28843] inline-block shadow-2xs"></span>
              <span className="text-slate-700">Bebidas Isotónicas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-[#16929B] inline-block shadow-2xs"></span>
              <span className="text-slate-700">Sueros Orales</span>
            </div>
          </div>

          {/* Filtro Año */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium">
            <span className="text-slate-500 font-bold">Año:</span>
            <select
              value={anio}
              onChange={(e) => {
                const newY = e.target.value;
                setAnio(newY);
                const months = data?.availableMonthsByYear?.[newY] || [];
                if (!months.some((m) => m.id === mes)) {
                  setMes('Todas');
                }
              }}
              className="bg-transparent font-bold text-[#0066c0] focus:outline-hidden cursor-pointer"
            >
              {(data?.availableYears || ['2026', '2025']).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Mes */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium">
            <span className="text-slate-500 font-bold">Mes:</span>
            <select
              value={mes}
              onChange={(e) => setMes(e.target.value)}
              className="bg-transparent font-bold text-[#0066c0] focus:outline-hidden cursor-pointer"
            >
              {availableMonthsList.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Botón Home */}
          <button
            onClick={onBack}
            title="Regresar a Portada de Perú"
            className="flex items-center justify-center p-2 rounded-lg bg-[#0066c0] text-white hover:bg-[#0055a5] transition-colors shadow-xs cursor-pointer"
          >
            <Home className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-20 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
          <RefreshCw className="w-10 h-10 animate-spin mx-auto mb-3 text-[#0066c0]" />
          <p className="font-semibold text-slate-600">Consultando datos analíticos de Perú en BigQuery...</p>
          <span className="text-xs text-slate-400">Calculando YTD, series temporales y matrices de Share of Market</span>
        </div>
      ) : (
        <>
          {/* 2. FILA 1: 5 TARJETAS DE COMPARACIÓN KPI (AÑO ANTERIOR VS AÑO ACTUAL Y % VAR) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* Card 1: Unidades (000) */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3.5 flex flex-col justify-between">
              <div className="border-b border-blue-200 border-dashed pb-2 mb-2 text-center">
                <h3 className="font-bold text-xs md:text-sm text-[#0066c0]">Unidades (000)</h3>
              </div>
              <div className="flex items-end justify-between gap-2 h-56 pt-2">
                {/* Columna Año Anterior */}
                <div className="flex-1 flex flex-col items-center h-full justify-end">
                  <span className="bg-slate-100 border border-slate-300 rounded-xs text-[9.5px] font-bold text-slate-700 px-1.5 py-0.5 mb-1 shadow-2xs">
                    {fmtNum(kpiCards?.unidades?.ant.total)}
                  </span>
                  <div className="w-full max-w-[50px] flex flex-col rounded-t-xs overflow-hidden h-[84%] border border-slate-300 shadow-2xs">
                    {/* Sueros (Arriba) */}
                    <div
                      style={{ height: `${(kpiCards?.unidades?.ant.sue / (kpiCards?.unidades?.ant.total || 1)) * 100}%` }}
                      className="bg-[#16929B] flex flex-col items-center justify-center text-white leading-tight p-0.5"
                    >
                      <span className="text-[9.5px] font-bold">{fmtNum(kpiCards?.unidades?.ant.sue)}</span>
                      <span className="text-[8px] font-medium opacity-95">
                        {((kpiCards?.unidades?.ant.sue / (kpiCards?.unidades?.ant.total || 1)) * 100).toFixed(1)}%
                      </span>
                    </div>
                    {/* Isotónicas (Abajo) */}
                    <div
                      style={{ height: `${(kpiCards?.unidades?.ant.iso / (kpiCards?.unidades?.ant.total || 1)) * 100}%` }}
                      className="bg-[#E28843] flex flex-col items-center justify-center text-white leading-tight p-0.5"
                    >
                      <span className="text-[9.5px] font-bold">{fmtNum(kpiCards?.unidades?.ant.iso)}</span>
                      <span className="text-[8px] font-medium opacity-95">
                        {((kpiCards?.unidades?.ant.iso / (kpiCards?.unidades?.ant.total || 1)) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-700 font-bold mt-2">{Number(anio) - 1}</span>
                </div>

                {/* Columna Año Actual */}
                <div className="flex-1 flex flex-col items-center h-full justify-end">
                  <span className="bg-slate-100 border border-slate-300 rounded-xs text-[9.5px] font-bold text-slate-700 px-1.5 py-0.5 mb-1 shadow-2xs">
                    {fmtNum(kpiCards?.unidades?.act.total)}
                  </span>
                  <div className="w-full max-w-[50px] flex flex-col rounded-t-xs overflow-hidden h-[74%] border border-slate-300 shadow-2xs">
                    <div
                      style={{ height: `${(kpiCards?.unidades?.act.sue / (kpiCards?.unidades?.act.total || 1)) * 100}%` }}
                      className="bg-[#16929B] flex flex-col items-center justify-center text-white leading-tight p-0.5"
                    >
                      <span className="text-[9.5px] font-bold">{fmtNum(kpiCards?.unidades?.act.sue)}</span>
                      <span className="text-[8px] font-medium opacity-95">
                        {((kpiCards?.unidades?.act.sue / (kpiCards?.unidades?.act.total || 1)) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div
                      style={{ height: `${(kpiCards?.unidades?.act.iso / (kpiCards?.unidades?.act.total || 1)) * 100}%` }}
                      className="bg-[#E28843] flex flex-col items-center justify-center text-white leading-tight p-0.5"
                    >
                      <span className="text-[9.5px] font-bold">{fmtNum(kpiCards?.unidades?.act.iso)}</span>
                      <span className="text-[8px] font-medium opacity-95">
                        {((kpiCards?.unidades?.act.iso / (kpiCards?.unidades?.act.total || 1)) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-700 font-bold mt-2">{Number(anio)}</span>
                </div>

                {/* Pilar % Var */}
                <div className="flex-1 flex flex-col items-center h-full justify-end">
                  <span className="bg-slate-100 border border-slate-300 rounded-xs text-[9.5px] font-bold text-slate-800 px-1.5 py-0.5 mb-1 shadow-2xs">
                    {kpiCards?.unidades?.varTotal >= 0
                      ? `+${kpiCards?.unidades?.varTotal.toFixed(1)}%`
                      : `${kpiCards?.unidades?.varTotal.toFixed(1)}%`}
                  </span>
                  <div className="w-full max-w-[50px] flex flex-col rounded-t-xs overflow-hidden h-[84%] bg-[#b0b6bf] p-1.5 justify-around shadow-2xs border border-slate-400/40">
                    <div className="bg-[#16929B] rounded-xs text-[9.5px] text-white font-bold text-center py-0.5 shadow-xs">
                      {kpiCards?.unidades?.varSue >= 0
                        ? `+${kpiCards?.unidades?.varSue.toFixed(1)}%`
                        : `${kpiCards?.unidades?.varSue.toFixed(1)}%`}
                    </div>
                    <div className="bg-[#E28843] rounded-xs text-[9.5px] text-white font-bold text-center py-0.5 shadow-xs">
                      {kpiCards?.unidades?.varIso >= 0
                        ? `+${kpiCards?.unidades?.varIso.toFixed(1)}%`
                        : `${kpiCards?.unidades?.varIso.toFixed(1)}%`}
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-700 font-bold mt-2">%Var.</span>
                </div>
              </div>
            </div>

            {/* Card 2: Litros (000) */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3.5 flex flex-col justify-between">
              <div className="border-b border-blue-200 border-dashed pb-2 mb-2 text-center">
                <h3 className="font-bold text-xs md:text-sm text-[#0066c0]">Litros (000)</h3>
              </div>
              <div className="flex items-end justify-between gap-2 h-56 pt-2">
                <div className="flex-1 flex flex-col items-center h-full justify-end">
                  <span className="bg-slate-100 border border-slate-300 rounded-xs text-[9.5px] font-bold text-slate-700 px-1.5 py-0.5 mb-1 shadow-2xs">
                    {fmtNum(kpiCards?.litros?.ant.total)}
                  </span>
                  <div className="w-full max-w-[50px] flex flex-col rounded-t-xs overflow-hidden h-[84%] border border-slate-300 shadow-2xs">
                    <div
                      style={{ height: `${(kpiCards?.litros?.ant.sue / (kpiCards?.litros?.ant.total || 1)) * 100}%` }}
                      className="bg-[#16929B] flex flex-col items-center justify-center text-white leading-tight p-0.5"
                    >
                      <span className="text-[9.5px] font-bold">{fmtNum(kpiCards?.litros?.ant.sue)}</span>
                      <span className="text-[8px] font-medium opacity-95">
                        {((kpiCards?.litros?.ant.sue / (kpiCards?.litros?.ant.total || 1)) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div
                      style={{ height: `${(kpiCards?.litros?.ant.iso / (kpiCards?.litros?.ant.total || 1)) * 100}%` }}
                      className="bg-[#E28843] flex flex-col items-center justify-center text-white leading-tight p-0.5"
                    >
                      <span className="text-[9.5px] font-bold">{fmtNum(kpiCards?.litros?.ant.iso)}</span>
                      <span className="text-[8px] font-medium opacity-95">
                        {((kpiCards?.litros?.ant.iso / (kpiCards?.litros?.ant.total || 1)) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-700 font-bold mt-2">{Number(anio) - 1}</span>
                </div>

                <div className="flex-1 flex flex-col items-center h-full justify-end">
                  <span className="bg-slate-100 border border-slate-300 rounded-xs text-[9.5px] font-bold text-slate-700 px-1.5 py-0.5 mb-1 shadow-2xs">
                    {fmtNum(kpiCards?.litros?.act.total)}
                  </span>
                  <div className="w-full max-w-[50px] flex flex-col rounded-t-xs overflow-hidden h-[75%] border border-slate-300 shadow-2xs">
                    <div
                      style={{ height: `${(kpiCards?.litros?.act.sue / (kpiCards?.litros?.act.total || 1)) * 100}%` }}
                      className="bg-[#16929B] flex flex-col items-center justify-center text-white leading-tight p-0.5"
                    >
                      <span className="text-[9.5px] font-bold">{fmtNum(kpiCards?.litros?.act.sue)}</span>
                      <span className="text-[8px] font-medium opacity-95">
                        {((kpiCards?.litros?.act.sue / (kpiCards?.litros?.act.total || 1)) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div
                      style={{ height: `${(kpiCards?.litros?.act.iso / (kpiCards?.litros?.act.total || 1)) * 100}%` }}
                      className="bg-[#E28843] flex flex-col items-center justify-center text-white leading-tight p-0.5"
                    >
                      <span className="text-[9.5px] font-bold">{fmtNum(kpiCards?.litros?.act.iso)}</span>
                      <span className="text-[8px] font-medium opacity-95">
                        {((kpiCards?.litros?.act.iso / (kpiCards?.litros?.act.total || 1)) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-700 font-bold mt-2">{Number(anio)}</span>
                </div>

                <div className="flex-1 flex flex-col items-center h-full justify-end">
                  <span className="bg-slate-100 border border-slate-300 rounded-xs text-[9.5px] font-bold text-slate-800 px-1.5 py-0.5 mb-1 shadow-2xs">
                    {kpiCards?.litros?.varTotal >= 0
                      ? `+${kpiCards?.litros?.varTotal.toFixed(1)}%`
                      : `${kpiCards?.litros?.varTotal.toFixed(1)}%`}
                  </span>
                  <div className="w-full max-w-[50px] flex flex-col rounded-t-xs overflow-hidden h-[84%] bg-[#b0b6bf] p-1.5 justify-around shadow-2xs border border-slate-400/40">
                    <div className="bg-[#16929B] rounded-xs text-[9.5px] text-white font-bold text-center py-0.5 shadow-xs">
                      {kpiCards?.litros?.varSue >= 0
                        ? `+${kpiCards?.litros?.varSue.toFixed(1)}%`
                        : `${kpiCards?.litros?.varSue.toFixed(1)}%`}
                    </div>
                    <div className="bg-[#E28843] rounded-xs text-[9.5px] text-white font-bold text-center py-0.5 shadow-xs">
                      {kpiCards?.litros?.varIso >= 0
                        ? `+${kpiCards?.litros?.varIso.toFixed(1)}%`
                        : `${kpiCards?.litros?.varIso.toFixed(1)}%`}
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-700 font-bold mt-2">%Var.</span>
                </div>
              </div>
            </div>

            {/* Card 3: Valor SOL (000) */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3.5 flex flex-col justify-between">
              <div className="border-b border-blue-200 border-dashed pb-2 mb-2 text-center">
                <h3 className="font-bold text-xs md:text-sm text-[#0066c0]">Valor SOL (000)</h3>
              </div>
              <div className="flex items-end justify-between gap-2 h-56 pt-2">
                <div className="flex-1 flex flex-col items-center h-full justify-end">
                  <span className="bg-slate-100 border border-slate-300 rounded-xs text-[9.5px] font-bold text-slate-700 px-1.5 py-0.5 mb-1 shadow-2xs">
                    {fmtNum(kpiCards?.valor?.ant.total)}
                  </span>
                  <div className="w-full max-w-[50px] flex flex-col rounded-t-xs overflow-hidden h-[84%] border border-slate-300 shadow-2xs">
                    <div
                      style={{ height: `${(kpiCards?.valor?.ant.sue / (kpiCards?.valor?.ant.total || 1)) * 100}%` }}
                      className="bg-[#16929B] flex flex-col items-center justify-center text-white leading-tight p-0.5"
                    >
                      <span className="text-[9.5px] font-bold">{fmtNum(kpiCards?.valor?.ant.sue)}</span>
                      <span className="text-[8px] font-medium opacity-95">
                        {((kpiCards?.valor?.ant.sue / (kpiCards?.valor?.ant.total || 1)) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div
                      style={{ height: `${(kpiCards?.valor?.ant.iso / (kpiCards?.valor?.ant.total || 1)) * 100}%` }}
                      className="bg-[#E28843] flex flex-col items-center justify-center text-white leading-tight p-0.5"
                    >
                      <span className="text-[9.5px] font-bold">{fmtNum(kpiCards?.valor?.ant.iso)}</span>
                      <span className="text-[8px] font-medium opacity-95">
                        {((kpiCards?.valor?.ant.iso / (kpiCards?.valor?.ant.total || 1)) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-700 font-bold mt-2">{Number(anio) - 1}</span>
                </div>

                <div className="flex-1 flex flex-col items-center h-full justify-end">
                  <span className="bg-slate-100 border border-slate-300 rounded-xs text-[9.5px] font-bold text-slate-700 px-1.5 py-0.5 mb-1 shadow-2xs">
                    {fmtNum(kpiCards?.valor?.act.total)}
                  </span>
                  <div className="w-full max-w-[50px] flex flex-col rounded-t-xs overflow-hidden h-[76%] border border-slate-300 shadow-2xs">
                    <div
                      style={{ height: `${(kpiCards?.valor?.act.sue / (kpiCards?.valor?.act.total || 1)) * 100}%` }}
                      className="bg-[#16929B] flex flex-col items-center justify-center text-white leading-tight p-0.5"
                    >
                      <span className="text-[9.5px] font-bold">{fmtNum(kpiCards?.valor?.act.sue)}</span>
                      <span className="text-[8px] font-medium opacity-95">
                        {((kpiCards?.valor?.act.sue / (kpiCards?.valor?.act.total || 1)) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div
                      style={{ height: `${(kpiCards?.valor?.act.iso / (kpiCards?.valor?.act.total || 1)) * 100}%` }}
                      className="bg-[#E28843] flex flex-col items-center justify-center text-white leading-tight p-0.5"
                    >
                      <span className="text-[9.5px] font-bold">{fmtNum(kpiCards?.valor?.act.iso)}</span>
                      <span className="text-[8px] font-medium opacity-95">
                        {((kpiCards?.valor?.act.iso / (kpiCards?.valor?.act.total || 1)) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-700 font-bold mt-2">{Number(anio)}</span>
                </div>

                <div className="flex-1 flex flex-col items-center h-full justify-end">
                  <span className="bg-slate-100 border border-slate-300 rounded-xs text-[9.5px] font-bold text-slate-800 px-1.5 py-0.5 mb-1 shadow-2xs">
                    {kpiCards?.valor?.varTotal >= 0
                      ? `+${kpiCards?.valor?.varTotal.toFixed(1)}%`
                      : `${kpiCards?.valor?.varTotal.toFixed(1)}%`}
                  </span>
                  <div className="w-full max-w-[50px] flex flex-col rounded-t-xs overflow-hidden h-[84%] bg-[#b0b6bf] p-1.5 justify-around shadow-2xs border border-slate-400/40">
                    <div className="bg-[#16929B] rounded-xs text-[9.5px] text-white font-bold text-center py-0.5 shadow-xs">
                      {kpiCards?.valor?.varSue >= 0
                        ? `+${kpiCards?.valor?.varSue.toFixed(1)}%`
                        : `${kpiCards?.valor?.varSue.toFixed(1)}%`}
                    </div>
                    <div className="bg-[#E28843] rounded-xs text-[9.5px] text-white font-bold text-center py-0.5 shadow-xs">
                      {kpiCards?.valor?.varIso >= 0
                        ? `+${kpiCards?.valor?.varIso.toFixed(1)}%`
                        : `${kpiCards?.valor?.varIso.toFixed(1)}%`}
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-700 font-bold mt-2">%Var.</span>
                </div>
              </div>
            </div>

            {/* Card 4: Precio/Unidad SOL */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3.5 flex flex-col justify-between">
              <div className="border-b border-blue-200 border-dashed pb-2 mb-2 text-center">
                <h3 className="font-bold text-xs md:text-sm text-[#0066c0]">Precio/Unidad SOL</h3>
              </div>
              <div className="flex items-end justify-between gap-2 h-56 pt-2">
                {/* Gráfico SVG Dual Sueros vs Isotónicas */}
                <div className="flex-[2] flex flex-col justify-between h-full">
                  <div className="relative flex-1 w-full flex items-center justify-center">
                    <svg viewBox="0 0 200 140" className="w-full h-full overflow-visible">
                      {/* Línea Sueros (Cyan/Teal #16929B) */}
                      <line x1="35" y1="42" x2="165" y2="58" stroke="#16929B" strokeWidth="3" strokeLinecap="round" />
                      <circle cx="35" cy="42" r="4.5" fill="#16929B" stroke="#ffffff" strokeWidth="2" />
                      <circle cx="165" cy="58" r="4.5" fill="#16929B" stroke="#ffffff" strokeWidth="2" />

                      {/* Badge Sueros 2025 */}
                      <rect x="18" y="50" width="34" height="15" rx="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                      <text x="35" y="61" textAnchor="middle" fill="#0f172a" fontSize="9.5" fontWeight="bold">
                        {kpiCards?.precio?.ant.sue.toFixed(1)}
                      </text>

                      {/* Badge Sueros 2026 */}
                      <rect x="148" y="66" width="34" height="15" rx="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                      <text x="165" y="77" textAnchor="middle" fill="#0f172a" fontSize="9.5" fontWeight="bold">
                        {kpiCards?.precio?.act.sue.toFixed(1)}
                      </text>

                      {/* Línea Isotónicas (Naranja #E28843) */}
                      <line x1="35" y1="108" x2="165" y2="105" stroke="#E28843" strokeWidth="3" strokeLinecap="round" />
                      <circle cx="35" cy="108" r="4.5" fill="#E28843" stroke="#ffffff" strokeWidth="2" />
                      <circle cx="165" cy="105" r="4.5" fill="#E28843" stroke="#ffffff" strokeWidth="2" />

                      {/* Badge Isotónicas 2025 */}
                      <rect x="18" y="116" width="34" height="15" rx="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                      <text x="35" y="127" textAnchor="middle" fill="#0f172a" fontSize="9.5" fontWeight="bold">
                        {kpiCards?.precio?.ant.iso.toFixed(1)}
                      </text>

                      {/* Badge Isotónicas 2026 */}
                      <rect x="148" y="113" width="34" height="15" rx="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                      <text x="165" y="124" textAnchor="middle" fill="#0f172a" fontSize="9.5" fontWeight="bold">
                        {kpiCards?.precio?.act.iso.toFixed(1)}
                      </text>
                    </svg>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-slate-700 font-bold px-4 mt-2">
                    <span>{Number(anio) - 1}</span>
                    <span>{Number(anio)}</span>
                  </div>
                </div>

                {/* Pilar % Var */}
                <div className="flex-1 flex flex-col items-center h-full justify-end">
                  <span className="opacity-0 text-[9.5px] px-1.5 py-0.5 mb-1">-</span>
                  <div className="w-full max-w-[50px] flex flex-col rounded-t-xs overflow-hidden h-[84%] bg-[#b0b6bf] p-1.5 justify-around shadow-2xs border border-slate-400/40">
                    <div className="bg-[#E28843] rounded-xs text-[9.5px] text-white font-bold text-center py-0.5 shadow-xs">
                      {kpiCards?.precio?.varIso >= 0
                        ? `+${kpiCards?.precio?.varIso.toFixed(1)}%`
                        : `${kpiCards?.precio?.varIso.toFixed(1)}%`}
                    </div>
                    <div className="bg-[#16929B] rounded-xs text-[9.5px] text-white font-bold text-center py-0.5 shadow-xs">
                      {kpiCards?.precio?.varSue >= 0
                        ? `+${kpiCards?.precio?.varSue.toFixed(1)}%`
                        : `${kpiCards?.precio?.varSue.toFixed(1)}%`}
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-700 font-bold mt-2">%Var.</span>
                </div>
              </div>
            </div>

            {/* Card 5: Dist. Num. */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3.5 flex flex-col justify-between">
              <div className="border-b border-blue-200 border-dashed pb-2 mb-2 text-center">
                <h3 className="font-bold text-xs md:text-sm text-[#0066c0]">Dist. Num.</h3>
              </div>
              <div className="flex items-end justify-between gap-2 h-56 pt-2">
                <div className="flex-[2] flex flex-col justify-between h-full">
                  <div className="relative flex-1 w-full flex items-center justify-center">
                    <svg viewBox="0 0 200 140" className="w-full h-full overflow-visible">
                      {/* Línea Isotónicas (Arriba, Naranja #E28843) */}
                      <line x1="35" y1="36" x2="165" y2="36" stroke="#E28843" strokeWidth="3" strokeLinecap="round" />
                      <circle cx="35" cy="36" r="4.5" fill="#E28843" stroke="#ffffff" strokeWidth="2" />
                      <circle cx="165" cy="36" r="4.5" fill="#E28843" stroke="#ffffff" strokeWidth="2" />

                      {/* Badge Isotónicas 2025 */}
                      <rect x="16" y="44" width="38" height="15" rx="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                      <text x="35" y="55" textAnchor="middle" fill="#0f172a" fontSize="9" fontWeight="bold">
                        {kpiCards?.distNum?.ant.iso.toFixed(1)}%
                      </text>

                      {/* Badge Isotónicas 2026 */}
                      <rect x="146" y="44" width="38" height="15" rx="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                      <text x="165" y="55" textAnchor="middle" fill="#0f172a" fontSize="9" fontWeight="bold">
                        {kpiCards?.distNum?.act.iso.toFixed(1)}%
                      </text>

                      {/* Línea Sueros (Cyan/Teal #16929B) */}
                      <line x1="35" y1="112" x2="165" y2="68" stroke="#16929B" strokeWidth="3" strokeLinecap="round" />
                      <circle cx="35" cy="112" r="4.5" fill="#16929B" stroke="#ffffff" strokeWidth="2" />
                      <circle cx="165" cy="68" r="4.5" fill="#16929B" stroke="#ffffff" strokeWidth="2" />

                      {/* Badge Sueros 2025 */}
                      <rect x="16" y="120" width="38" height="15" rx="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                      <text x="35" y="131" textAnchor="middle" fill="#0f172a" fontSize="9" fontWeight="bold">
                        {kpiCards?.distNum?.ant.sue.toFixed(1)}%
                      </text>

                      {/* Badge Sueros 2026 */}
                      <rect x="146" y="76" width="38" height="15" rx="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                      <text x="165" y="87" textAnchor="middle" fill="#0f172a" fontSize="9" fontWeight="bold">
                        {kpiCards?.distNum?.act.sue.toFixed(1)}%
                      </text>
                    </svg>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-slate-700 font-bold px-4 mt-2">
                    <span>{Number(anio) - 1}</span>
                    <span>{Number(anio)}</span>
                  </div>
                </div>

                {/* Pilar % Var */}
                <div className="flex-1 flex flex-col items-center h-full justify-end">
                  <span className="opacity-0 text-[9.5px] px-1.5 py-0.5 mb-1">-</span>
                  <div className="w-full max-w-[50px] flex flex-col rounded-t-xs overflow-hidden h-[84%] bg-[#b0b6bf] p-1.5 justify-around shadow-2xs border border-slate-400/40">
                    <div className="bg-[#E28843] rounded-xs text-[9.5px] text-white font-bold text-center py-0.5 shadow-xs">
                      {kpiCards?.distNum?.varIso >= 0
                        ? `+${kpiCards?.distNum?.varIso.toFixed(1)} pp`
                        : `${kpiCards?.distNum?.varIso.toFixed(1)} pp`}
                    </div>
                    <div className="bg-[#16929B] rounded-xs text-[9.5px] text-white font-bold text-center py-0.5 shadow-xs">
                      {kpiCards?.distNum?.varSue >= 0
                        ? `+${kpiCards?.distNum?.varSue.toFixed(1)} pp`
                        : `${kpiCards?.distNum?.varSue.toFixed(1)} pp`}
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-700 font-bold mt-2">%Var.</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. FILAS 2 & 3: GRÁFICAS MENSUALES HISTÓRICAS (L13M) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Gráfica 1: Unidades Mensual (Barras Apiladas) */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 flex flex-col">
              <div className="border-b border-blue-200 border-dashed pb-2 mb-3 text-center">
                <h3 className="font-bold text-sm text-[#0066c0]">Unidades (000)</h3>
              </div>
              <div className="flex items-end justify-between gap-1.5 h-64 pt-2 border-b border-slate-200">
                {(() => {
                  const maxVal = Math.max(...visibleMonthlyTrends.map((m) => (m.isotonicos_unds || 0) + (m.sueros_unds || 0)), 1) * 1.15;
                  return visibleMonthlyTrends.map((m, idx) => {
                    const total = (m.isotonicos_unds || 0) + (m.sueros_unds || 0);
                    const hPct = Math.min(100, (total / maxVal) * 100);
                    const suePct = total > 0 ? ((m.sueros_unds || 0) / total) * 100 : 0;
                    const isoPct = total > 0 ? ((m.isotonicos_unds || 0) / total) * 100 : 0;

                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end">
                        <span className="bg-slate-100 border border-slate-300/80 rounded-xs text-[9px] font-bold text-slate-700 px-1 py-0.5 mb-1 shadow-2xs">
                          {fmtNum(total)}
                        </span>
                        <div style={{ height: `${hPct}%` }} className="w-full max-w-[46px] flex flex-col rounded-t-xs overflow-hidden border border-slate-300 shadow-2xs">
                          {/* Sueros (Arriba) */}
                          <div style={{ height: `${suePct}%` }} className="bg-[#16929B] flex flex-col items-center justify-center text-white leading-tight p-0.5">
                            <span className="text-[9.5px] font-bold">{fmtNum(m.sueros_unds)}</span>
                            <span className="text-[8px] font-medium opacity-90">{suePct.toFixed(0)}%</span>
                          </div>
                          {/* Isotónicas (Abajo) */}
                          <div style={{ height: `${isoPct}%` }} className="bg-[#E28843] flex flex-col items-center justify-center text-white leading-tight p-0.5">
                            <span className="text-[9.5px] font-bold">{fmtNum(m.isotonicos_unds)}</span>
                            <span className="text-[8px] font-medium opacity-90">{isoPct.toFixed(0)}%</span>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-600 font-bold mt-1.5 truncate">{m.mes_label}</span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Gráfica 2: Precio/Unidad SOL Mensual (Líneas con puntos y etiquetas) */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 flex flex-col">
              <div className="border-b border-blue-200 border-dashed pb-2 mb-3 text-center">
                <h3 className="font-bold text-sm text-[#0066c0]">Precio/Unidad SOL</h3>
              </div>
              <div className="flex flex-col justify-between h-64 pt-2 border-b border-slate-200">
                <div className="relative h-52 w-full">
                  <svg viewBox="0 0 1000 200" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                    {/* Línea Sueros (Cyan/Teal #16929B) */}
                    <polyline
                      fill="none"
                      stroke="#16929B"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={visibleMonthlyTrends
                        .map((m, idx) => {
                          const count = visibleMonthlyTrends.length;
                          const x = 40 + (idx / (count - 1 || 1)) * 920;
                          const y = 80 - ((m.sueros_precio - 4.6) / 1.0) * 55;
                          return `${x},${y}`;
                        })
                        .join(' ')}
                    />
                    {/* Línea Isotónicas (Naranja #E28843) */}
                    <polyline
                      fill="none"
                      stroke="#E28843"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={visibleMonthlyTrends
                        .map((m, idx) => {
                          const count = visibleMonthlyTrends.length;
                          const x = 40 + (idx / (count - 1 || 1)) * 920;
                          const y = 175 - ((m.isotonicos_precio - 1.8) / 0.6) * 35;
                          return `${x},${y}`;
                        })
                        .join(' ')}
                    />

                    {/* Puntos y Badges Sueros */}
                    {visibleMonthlyTrends.map((m, idx) => {
                      const count = visibleMonthlyTrends.length;
                      const x = 40 + (idx / (count - 1 || 1)) * 920;
                      const y = 80 - ((m.sueros_precio - 4.6) / 1.0) * 55;
                      return (
                        <g key={`sue-${idx}`}>
                          <circle cx={x} cy={y} r="5" fill="#16929B" stroke="#ffffff" strokeWidth="2.5" />
                          <rect x={x - 17} y={y - 23} width="34" height="16" rx="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                          <text x={x} y={y - 11} textAnchor="middle" fill="#0f172a" fontSize="11" fontWeight="bold">
                            {m.sueros_precio.toFixed(1)}
                          </text>
                        </g>
                      );
                    })}

                    {/* Puntos y Badges Isotónicas */}
                    {visibleMonthlyTrends.map((m, idx) => {
                      const count = visibleMonthlyTrends.length;
                      const x = 40 + (idx / (count - 1 || 1)) * 920;
                      const y = 175 - ((m.isotonicos_precio - 1.8) / 0.6) * 35;
                      return (
                        <g key={`iso-${idx}`}>
                          <circle cx={x} cy={y} r="5" fill="#E28843" stroke="#ffffff" strokeWidth="2.5" />
                          <rect x={x - 17} y={y + 8} width="34" height="16" rx="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                          <text x={x} y={y + 20} textAnchor="middle" fill="#0f172a" fontSize="11" fontWeight="bold">
                            {m.isotonicos_precio.toFixed(1)}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-600 font-bold px-4 pb-1">
                  {visibleMonthlyTrends.map((m, idx) => (
                    <span key={idx} className="truncate">
                      {m.mes_label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Gráfica 3: Valor SOL (000) Mensual (Barras Apiladas) */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 flex flex-col">
              <div className="border-b border-blue-200 border-dashed pb-2 mb-3 text-center">
                <h3 className="font-bold text-sm text-[#0066c0]">Valor SOL (000)</h3>
              </div>
              <div className="flex items-end justify-between gap-1.5 h-64 pt-2 border-b border-slate-200">
                {(() => {
                  const maxVal = Math.max(...visibleMonthlyTrends.map((m) => (m.isotonicos_val || 0) + (m.sueros_val || 0)), 1) * 1.15;
                  return visibleMonthlyTrends.map((m, idx) => {
                    const total = (m.isotonicos_val || 0) + (m.sueros_val || 0);
                    const hPct = Math.min(100, (total / maxVal) * 100);
                    const suePct = total > 0 ? ((m.sueros_val || 0) / total) * 100 : 0;
                    const isoPct = total > 0 ? ((m.isotonicos_val || 0) / total) * 100 : 0;

                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end">
                        <span className="bg-slate-100 border border-slate-300/80 rounded-xs text-[9px] font-bold text-slate-700 px-1 py-0.5 mb-1 shadow-2xs">
                          {fmtNum(total)}
                        </span>
                        <div style={{ height: `${hPct}%` }} className="w-full max-w-[46px] flex flex-col rounded-t-xs overflow-hidden border border-slate-300 shadow-2xs">
                          {/* Sueros (Arriba) */}
                          <div style={{ height: `${suePct}%` }} className="bg-[#16929B] flex flex-col items-center justify-center text-white leading-tight p-0.5">
                            <span className="text-[9.5px] font-bold">{fmtNum(m.sueros_val)}</span>
                            <span className="text-[8px] font-medium opacity-90">{suePct.toFixed(0)}%</span>
                          </div>
                          {/* Isotónicas (Abajo) */}
                          <div style={{ height: `${isoPct}%` }} className="bg-[#E28843] flex flex-col items-center justify-center text-white leading-tight p-0.5">
                            <span className="text-[9.5px] font-bold">{fmtNum(m.isotonicos_val)}</span>
                            <span className="text-[8px] font-medium opacity-90">{isoPct.toFixed(0)}%</span>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-600 font-bold mt-1.5 truncate">{m.mes_label}</span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Gráfica 4: Dist. Num. Mensual (Líneas duales) */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 flex flex-col">
              <div className="border-b border-blue-200 border-dashed pb-2 mb-3 text-center">
                <h3 className="font-bold text-sm text-[#0066c0]">Dist. Num.</h3>
              </div>
              <div className="flex flex-col justify-between h-64 pt-2 border-b border-slate-200">
                <div className="relative h-52 w-full">
                  <svg viewBox="0 0 1000 200" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                    {/* Línea Isotónicas (Naranja #E28843) */}
                    <polyline
                      fill="none"
                      stroke="#E28843"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={visibleMonthlyTrends
                        .map((m, idx) => {
                          const count = visibleMonthlyTrends.length;
                          const x = 40 + (idx / (count - 1 || 1)) * 920;
                          const y = 60 - ((m.isotonicos_dist - 98) / 3.0) * 35;
                          return `${x},${y}`;
                        })
                        .join(' ')}
                    />
                    {/* Línea Sueros (Cyan/Teal #16929B) */}
                    <polyline
                      fill="none"
                      stroke="#16929B"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={visibleMonthlyTrends
                        .map((m, idx) => {
                          const count = visibleMonthlyTrends.length;
                          const x = 40 + (idx / (count - 1 || 1)) * 920;
                          const y = 175 - ((m.sueros_dist - 90) / 10.0) * 65;
                          return `${x},${y}`;
                        })
                        .join(' ')}
                    />

                    {/* Puntos y Badges Isotónicas */}
                    {visibleMonthlyTrends.map((m, idx) => {
                      const count = visibleMonthlyTrends.length;
                      const x = 40 + (idx / (count - 1 || 1)) * 920;
                      const y = 60 - ((m.isotonicos_dist - 98) / 3.0) * 35;
                      return (
                        <g key={`dist-iso-${idx}`}>
                          <circle cx={x} cy={y} r="5" fill="#E28843" stroke="#ffffff" strokeWidth="2.5" />
                          <rect x={x - 17} y={y - 23} width="34" height="16" rx="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                          <text x={x} y={y - 11} textAnchor="middle" fill="#0f172a" fontSize="11" fontWeight="bold">
                            {m.isotonicos_dist.toFixed(1)}%
                          </text>
                        </g>
                      );
                    })}

                    {/* Puntos y Badges Sueros */}
                    {visibleMonthlyTrends.map((m, idx) => {
                      const count = visibleMonthlyTrends.length;
                      const x = 40 + (idx / (count - 1 || 1)) * 920;
                      const y = 175 - ((m.sueros_dist - 90) / 10.0) * 65;
                      return (
                        <g key={`dist-sue-${idx}`}>
                          <circle cx={x} cy={y} r="5" fill="#16929B" stroke="#ffffff" strokeWidth="2.5" />
                          <rect x={x - 17} y={y - 23} width="34" height="16" rx="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                          <text x={x} y={y - 11} textAnchor="middle" fill="#0f172a" fontSize="11" fontWeight="bold">
                            {m.sueros_dist.toFixed(1)}%
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-600 font-bold px-4 pb-1">
                  {visibleMonthlyTrends.map((m, idx) => (
                    <span key={idx} className="truncate">
                      {m.mes_label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 4. FILA 4: 2 MATRICES HEATMAP SOM (SOM UNIDADES Y SOM VALOR SOL) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Tabla 1: SOM Unidades */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 overflow-hidden flex flex-col">
              <div className="border-b border-blue-200 border-dashed pb-2 mb-3 text-center">
                <h3 className="font-bold text-sm text-[#0066c0]">SOM Unidades</h3>
              </div>
              <div className="overflow-x-auto max-h-[420px] overflow-y-auto rounded-lg border border-slate-300">
                <table className="w-full text-left text-[11px] border-collapse bg-white">
                  <thead>
                    <tr className="bg-[#cbd5e1] text-slate-900 font-bold border-b border-slate-300 sticky top-0 z-20 shadow-2xs">
                      <th className="py-2 px-2.5 min-w-[125px] bg-[#cbd5e1] border-r border-slate-300 text-left uppercase sticky left-0 z-30">
                        MARCA
                      </th>
                      {visibleMonthLabels.map((lbl) => (
                        <th key={lbl} className="py-2 px-1 text-center whitespace-nowrap bg-[#cbd5e1] border-r border-slate-300 min-w-[50px]">
                          {lbl}
                        </th>
                      ))}
                      <th className="py-2 px-2.5 text-center whitespace-nowrap bg-[#b0b6bf] text-slate-950 font-black border-l border-slate-400 min-w-[65px]">
                        Total YTD ▾
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium">
                    {processedSomUnidades.map((row, rIdx) => {
                      const isElectrolife = (row.marca || row.MARCA || '').toUpperCase().includes('ELECTROLIFE');
                      return (
                        <tr
                          key={rIdx}
                          className={`hover:bg-blue-50/50 transition-colors ${
                            isElectrolife ? 'bg-blue-50/60 font-bold' : ''
                          }`}
                        >
                          <td
                            className={`py-1.5 px-2.5 whitespace-nowrap border-r border-slate-200 sticky left-0 z-10 ${
                              isElectrolife ? 'text-[#0066c0] font-black bg-blue-50' : 'text-slate-900 font-bold bg-white'
                            }`}
                          >
                            {(row.marca || row.MARCA || '').toUpperCase() === 'O. MARCAS' ||
                            (row.marca || row.MARCA || '').toUpperCase() === 'O MARCAS'
                              ? 'OTRAS MARCAS'
                              : (row.marca || row.MARCA || '').toUpperCase()}
                          </td>
                          {visibleMonthLabels.map((mKey, cIdx) => {
                            const val = row.meses?.[mKey];
                            const prevKey = cIdx > 0 ? visibleMonthLabels[cIdx - 1] : getPreviousTimelineMonth(mKey);
                            const prevVal = prevKey ? row.meses?.[prevKey] : null;
                            const deltaStyle = getSomDeltaStyle(val, prevVal);

                            return (
                              <td
                                key={mKey}
                                className={`py-1.5 px-1 text-center whitespace-nowrap border-r border-slate-200 transition-all ${deltaStyle}`}
                              >
                                {val !== undefined && val !== null ? `${val.toFixed(1)}%` : '-'}
                              </td>
                            );
                          })}
                          <td className="py-1.5 px-2 text-center whitespace-nowrap font-black bg-[#cbd5e1]/70 text-slate-950 border-l border-slate-300">
                            {row.ytdExact.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tabla 2: SOM Valor SOL */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 overflow-hidden flex flex-col">
              <div className="border-b border-blue-200 border-dashed pb-2 mb-3 text-center">
                <h3 className="font-bold text-sm text-[#0066c0]">SOM Valor SOL</h3>
              </div>
              <div className="overflow-x-auto max-h-[420px] overflow-y-auto rounded-lg border border-slate-300">
                <table className="w-full text-left text-[11px] border-collapse bg-white">
                  <thead>
                    <tr className="bg-[#cbd5e1] text-slate-900 font-bold border-b border-slate-300 sticky top-0 z-20 shadow-2xs">
                      <th className="py-2 px-2.5 min-w-[125px] bg-[#cbd5e1] border-r border-slate-300 text-left uppercase sticky left-0 z-30">
                        MARCA
                      </th>
                      {visibleMonthLabels.map((lbl) => (
                        <th key={lbl} className="py-2 px-1 text-center whitespace-nowrap bg-[#cbd5e1] border-r border-slate-300 min-w-[50px]">
                          {lbl}
                        </th>
                      ))}
                      <th className="py-2 px-2.5 text-center whitespace-nowrap bg-[#b0b6bf] text-slate-950 font-black border-l border-slate-400 min-w-[65px]">
                        Total YTD ▾
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium">
                    {processedSomValor.map((row, rIdx) => {
                      const isElectrolife = (row.marca || row.MARCA || '').toUpperCase().includes('ELECTROLIFE');
                      return (
                        <tr
                          key={rIdx}
                          className={`hover:bg-blue-50/50 transition-colors ${
                            isElectrolife ? 'bg-blue-50/60 font-bold' : ''
                          }`}
                        >
                          <td
                            className={`py-1.5 px-2.5 whitespace-nowrap border-r border-slate-200 sticky left-0 z-10 ${
                              isElectrolife ? 'text-[#0066c0] font-black bg-blue-50' : 'text-slate-900 font-bold bg-white'
                            }`}
                          >
                            {(row.marca || row.MARCA || '').toUpperCase() === 'O. MARCAS' ||
                            (row.marca || row.MARCA || '').toUpperCase() === 'O MARCAS'
                              ? 'OTRAS MARCAS'
                              : (row.marca || row.MARCA || '').toUpperCase()}
                          </td>
                          {visibleMonthLabels.map((mKey, cIdx) => {
                            const val = row.meses?.[mKey];
                            const prevKey = cIdx > 0 ? visibleMonthLabels[cIdx - 1] : getPreviousTimelineMonth(mKey);
                            const prevVal = prevKey ? row.meses?.[prevKey] : null;
                            const deltaStyle = getSomDeltaStyle(val, prevVal);

                            return (
                              <td
                                key={mKey}
                                className={`py-1.5 px-1 text-center whitespace-nowrap border-r border-slate-200 transition-all ${deltaStyle}`}
                              >
                                {val !== undefined && val !== null ? `${val.toFixed(1)}%` : '-'}
                              </td>
                            );
                          })}
                          <td className="py-1.5 px-2 text-center whitespace-nowrap font-black bg-[#cbd5e1]/70 text-slate-950 border-l border-slate-300">
                            {row.ytdExact.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
