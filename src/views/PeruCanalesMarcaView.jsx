import React, { useState, useEffect, useMemo } from 'react';
import { Home } from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

const MARCAS_LIST = ['ELECTROLIFE', 'SPORADE', 'GATORADE', 'POWERADE', 'SUEROX', 'DILYTE'];
const BRAND_COLORS = {
  ELECTROLIFE: '#004B93',
  SPORADE: '#E11D48',
  GATORADE: '#F97316',
  POWERADE: '#0284C7',
  SUEROX: '#10B981',
  DILYTE: '#8B5CF6'
};

const CANALES_CONFIG = [
  { key: 'Supermercados + Discounters', label: 'Supermercados + Discounters' },
  { key: 'Conveniencia', label: 'Conveniencia' },
  { key: 'Cash & Carry', label: 'Cash & Carry' }
];

export default function PeruCanalesMarcaView({ onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCanal, setSelectedCanal] = useState('Supermercados + Discounters');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch('/api/nielsen/pe/marca-canales');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error('Error al cargar datos canales-marca:', err);
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

  // Mix de Marcas en Canal
  const mixMarcas = useMemo(() => {
    if (!data || !data.brandCanalRows) return null;
    const periodSet = new Set(periods.map((p) => p.periodo));

    const brandSums = {};
    MARCAS_LIST.forEach((m) => { brandSums[m] = 0; });
    let totalCanal = 0;

    data.brandCanalRows.forEach((r) => {
      if (periodSet.has(r.periodo) && r.canal === selectedCanal) {
        if (brandSums[r.marca] !== undefined) {
          brandSums[r.marca] += (r.unds || 0) / 1000;
          totalCanal += (r.unds || 0) / 1000;
        }
      }
    });

    return MARCAS_LIST.map((m) => ({
      marca: m,
      color: BRAND_COLORS[m] || '#64748B',
      unds: brandSums[m],
      pct: totalCanal > 0 ? (brandSums[m] / totalCanal) * 100 : 0
    }));
  }, [data, selectedCanal, periods]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f3f6f9] flex flex-col items-center justify-center p-6">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0066c0] mb-3" />
        <p className="text-xs font-bold text-slate-600">Cargando Canales - Marca Perú...</p>
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
          <h1 className="text-lg md:text-xl font-black text-[#0066c0] tracking-tight">Canales vs Marcas • Perú</h1>
          <p className="text-[11px] font-bold text-slate-500">Composición de Marcas dentro de {selectedCanal}</p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium">
            <span className="text-slate-500 font-bold">Canal:</span>
            <select value={selectedCanal} onChange={(e) => setSelectedCanal(e.target.value)} className="bg-transparent font-bold text-[#0066c0] focus:outline-hidden cursor-pointer">
              {CANALES_CONFIG.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          </div>

          <button onClick={onBack} title="Regresar a Portada de Perú" className="flex items-center justify-center p-2 rounded-lg bg-[#0066c0] text-white hover:bg-[#0055a5] transition-colors shadow-xs cursor-pointer">
            <Home className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* CONTENIDO */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 mt-6 space-y-6">
        
        {/* MIX CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {mixMarcas?.map((m) => (
            <div key={m.marca} className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 truncate">{m.marca}</span>
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.color }} />
              </div>
              <div className="mt-2">
                <div className="text-xl font-black text-slate-900">{m.pct.toFixed(1)}%</div>
                <div className="text-[10px] font-bold text-slate-400">{Math.round(m.unds).toLocaleString()} k Unds</div>
              </div>
            </div>
          ))}
        </div>

      </main>

    </div>
  );
}
