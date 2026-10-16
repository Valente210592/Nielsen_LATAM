import React, { useState, useEffect, useMemo } from 'react';
import { Home } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';

export default function PeruMarcaCanalView({ onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState('UNDS'); // 'UNDS' o 'VALOR'

  useEffect(() => {
    setLoading(true);
    fetch('/api/nielsen/pe/marca-canales')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const marcas = ['ELECTROLIFE', 'SPORADE', 'GATORADE', 'POWERADE', 'SUEROX', 'DILYTE'];

  const chartData = useMemo(() => {
    if (!data?.brandCanalRows) return [];
    
    return marcas.map(m => {
      const mRows = data.brandCanalRows.filter(r => r.marca === m);
      const supDisc = mRows.filter(r => r.canal === 'Supermercados + Discounters').reduce((acc, r) => acc + (metric === 'UNDS' ? r.unds : r.valor), 0);
      const conv = mRows.filter(r => r.canal === 'Conveniencia').reduce((acc, r) => acc + (metric === 'UNDS' ? r.unds : r.valor), 0);
      const cc = mRows.filter(r => r.canal === 'Cash & Carry').reduce((acc, r) => acc + (metric === 'UNDS' ? r.unds : r.valor), 0);

      const tot = supDisc + conv + cc;

      return {
        name: m,
        'Supermercados + Discounters': tot > 0 ? (supDisc / tot) * 100 : 0,
        'Conveniencia': tot > 0 ? (conv / tot) * 100 : 0,
        'Cash & Carry': tot > 0 ? (cc / tot) * 100 : 0,
        totalAbs: tot
      };
    });
  }, [data, metric]);

  return (
    <div className="min-h-screen bg-[#f3f6f9] flex flex-col font-sans select-none">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-500 hover:text-[#0066c0] flex items-center gap-1.5 text-xs font-bold cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Inicio</span>
          </button>
          <div className="h-5 w-px bg-slate-200" />
          <h1 className="text-xl font-black text-[#0066c0] tracking-tight">
            Marcas - Canales • Distribución de Canales por Marca Perú
          </h1>
        </div>

        {/* Toggle Métrica */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setMetric('UNDS')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              metric === 'UNDS' ? 'bg-[#0066c0] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Base Unidades
          </button>
          <button
            onClick={() => setMetric('VALOR')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              metric === 'VALOR' ? 'bg-[#0066c0] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Base Valor S/.
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <h2 className="text-base font-black text-slate-800 tracking-tight mb-4">
            Mix Porcentual de Canales por Marca (%)
          </h2>

          <div className="h-[420px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 20, right: 30, left: 60, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" fontSize={11} fontWeight={600} unit="%" />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} fontWeight={700} />
                <Tooltip 
                  formatter={(val) => `${Number(val).toFixed(1)}%`}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                />
                <Legend wrapperStyle={{ paddingTop: '15px' }} />
                <Bar dataKey="Supermercados + Discounters" fill="#004B93" stackId="a" />
                <Bar dataKey="Conveniencia" fill="#00c0f3" stackId="a" />
                <Bar dataKey="Cash & Carry" fill="#ca8a04" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </div>
  );
}
