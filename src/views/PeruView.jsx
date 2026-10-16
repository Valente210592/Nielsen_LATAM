import React, { useState, useEffect, useMemo } from 'react';
import { Home } from 'lucide-react';

const PE_REGIONES = [
  'LIMA',
  'AREQUIPA',
  'CHICLAYO',
  'ICA',
  'PIURA',
  'TRUJILLO+CHIMBOTE',
  'RESTO PERU NORTE',
  'RESTO PERU SUR',
  'PROVINCIAS'
];

const BRANDS_CONFIG = [
  { id: 'Electrolife', name: 'ELECTROLIFE', color: '#0066c0', stroke: '#0066c0' },
  { id: 'Sporade', name: 'SPORADE', color: '#ca8a04', stroke: '#ca8a04' },
  { id: 'Gatorade', name: 'GATORADE', color: '#ea580c', stroke: '#ea580c' },
  { id: 'Powerade', name: 'POWERADE', color: '#6b21a8', stroke: '#6b21a8' },
  { id: 'Suerox', name: 'SUEROX', color: '#991b1b', stroke: '#991b1b' },
  { id: 'Dilyte', name: 'DILYTE', color: '#10b981', stroke: '#10b981' }
];

export default function PeruView({ onBack }) {
  const [selectedRegion, setSelectedRegion] = useState('LIMA');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch('/api/nielsen/pe/marca-regiones')
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

  const regionRows = useMemo(() => {
    if (!data?.brandRegionRows) return [];
    return data.brandRegionRows.filter(r => r.region === selectedRegion);
  }, [data, selectedRegion]);

  return (
    <div className="min-h-screen bg-[#f3f6f9] flex flex-col font-sans select-none">
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
            Perú • Vista Territorial y Regional
          </h1>
        </div>

        <select
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
          className="bg-white border border-slate-300 text-xs font-bold text-slate-700 rounded-xl px-3 py-2 shadow-2xs focus:outline-none focus:border-[#0066c0]"
        >
          {PE_REGIONES.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card Región */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-[#0066c0] uppercase tracking-wider">Región Seleccionada</span>
              <h2 className="text-2xl font-black text-slate-800 mt-1">{selectedRegion}</h2>
              <p className="text-xs text-slate-500 mt-2">
                Monitoreo de participación de marcas y volumen auditado en territorio peruano.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600">
              <span>País: Perú</span>
              <span>Fuente: Nielsen IQ</span>
            </div>
          </div>

          {/* Card Resumen Marcas */}
          <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-4">
              Participación de Marcas en {selectedRegion}
            </h3>
            <div className="space-y-3">
              {BRANDS_CONFIG.map(b => {
                const bRow = regionRows.find(r => r.marca === b.name);
                const unds = bRow ? bRow.unds : 0;
                return (
                  <div key={b.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: b.color }} />
                      <span className="text-xs font-bold text-slate-800">{b.name}</span>
                    </div>
                    <span className="text-xs font-extrabold text-slate-700">
                      {unds.toLocaleString('es-PE', { maximumFractionDigits: 0 })} unds
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
