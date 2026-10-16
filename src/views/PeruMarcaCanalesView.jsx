import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Home, ChevronDown } from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

const MARCAS_LIST = ['ELECTROLIFE', 'SPORADE', 'GATORADE', 'POWERADE', 'SUEROX', 'DILYTE'];
const CANALES_CONFIG = [
  { key: 'Supermercados + Discounters', label: 'Supermercados + Discounters', color: '#65A30D' },
  { key: 'Conveniencia', label: 'Conveniencia', color: '#D97706' },
  { key: 'Cash & Carry', label: 'Cash & Carry', color: '#005EA8' }
];

export default function PeruMarcaCanalesView({ onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedBrand, setSelectedBrand] = useState('ELECTROLIFE');
  const [activeChannels, setActiveChannels] = useState({
    'Supermercados + Discounters': true,
    'Conveniencia': true,
    'Cash & Carry': true
  });

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch('/api/nielsen/pe/marca-canales');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error('Error al cargar datos marca-canales:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const periods = useMemo(() => {
    if (!data || !data.periodosLabels) return [];
    return data.periodosLabels.slice(-13);
  }, [data]);

  // Mix de Canales
  const mixCanales = useMemo(() => {
    if (!data || !data.brandCanalRows) return null;
    const periodSet = new Set(periods.map((p) => p.periodo));

    const canalSums = {
      'Supermercados + Discounters': 0,
      'Conveniencia': 0,
      'Cash & Carry': 0
    };
    let totalBrand = 0;

    data.brandCanalRows.forEach((r) => {
      if (periodSet.has(r.periodo) && r.marca === selectedBrand) {
        if (canalSums[r.canal] !== undefined) {
          canalSums[r.canal] += (r.unds || 0) / 1000;
          totalBrand += (r.unds || 0) / 1000;
        }
      }
    });

    return CANALES_CONFIG.map((c) => ({
      key: c.key,
      label: c.label,
      color: c.color,
      unds: canalSums[c.key],
      pct: totalBrand > 0 ? (canalSums[c.key] / totalBrand) * 100 : 0
    }));
  }, [data, selectedBrand, periods]);

  // Tendencia Mensual por Canal
  const channelTrends = useMemo(() => {
    if (!data || !data.brandCanalRows) return [];
    
    return periods.map(({ periodo, label }) => {
      const row = { periodo, label };
      CANALES_CONFIG.forEach((c) => {
        const item = data.brandCanalRows.find((r) => r.periodo === periodo && r.marca === selectedBrand && r.canal === c.key);
        row[c.key] = item ? (item.unds || 0) / 1000 : 0;
      });
      return row;
    });
  }, [data, selectedBrand, periods]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f3f6f9] flex flex-col items-center justify-center p-6">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0066c0] mb-3" />
        <p className="text-xs font-bold text-slate-600">Cargando Marca - Canales Perú...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f6f9] text-slate-800 pb-12 font-sans select-none">
      
      {/* HEADER */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 md:px-8 py-2.5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img src="/assets/competencia/Peru/Electrolife.png" alt="Electrolife" className="h-8 md:h-9 w-auto object-contain" onError={(e) => { e.target.src = '/assets/LOGOS/Electrolit-color.png'; }} />
          <span className="text-sm font-black text-slate-300">|</span>
          <img src="/assets/LOGOS/Nielsen-logo.png" alt="Nielsen" className="h-6 md:h-7 w-auto object-contain" />
        </div>

        <div className="text-center">
          <h1 className="text-lg md:text-xl font-black text-[#0066c0] tracking-tight">Marca vs Canales • Perú</h1>
          <p className="text-[11px] font-bold text-slate-500">Desglose Multicanal para {selectedBrand}</p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium">
            <span className="text-slate-500 font-bold">Marca:</span>
            <select value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)} className="bg-transparent font-bold text-[#0066c0] focus:outline-hidden cursor-pointer">
              {MARCAS_LIST.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <button onClick={onBack} title="Regresar a Portada de Perú" className="flex items-center justify-center p-2 rounded-lg bg-[#0066c0] text-white hover:bg-[#0055a5] transition-colors shadow-xs cursor-pointer">
            <Home className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* CONTENIDO */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 mt-6 space-y-6">
        
        {/* FILA 1: MIX CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {mixCanales?.map((c) => (
            <div key={c.key} className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">{c.label}</span>
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-900">{c.pct.toFixed(1)}%</span>
                <span className="text-xs font-bold text-slate-400">{Math.round(c.unds).toLocaleString()} k Unds</span>
              </div>
            </div>
          ))}
        </div>

        {/* FILA 2: GRÁFICO DE TENDENCIA */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <h3 className="font-bold text-xs md:text-sm text-[#0066c0] mb-3">Ventas Mensuales por Canal (k Unidades)</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={channelTrends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                {CANALES_CONFIG.map((c) => (
                  <Bar key={c.key} dataKey={c.key} fill={c.color} name={c.label} stackId="a" />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

      </main>

    </div>
  );
}
