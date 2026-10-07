import React, { useState, useEffect, useMemo } from 'react';
import { 
  Home, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Award,
  ChevronDown
} from 'lucide-react';
import { 
  Card
} from '@tremor/react';
import MarcaView from './views/MarcaView';
import CanalView from './views/CanalView';
import MatrizKpisView from './views/MatrizKpisView';
import MatrizRegionesView from './views/MatrizRegionesView';
import GrowthDriversView from './views/GrowthDriversView';
import MarcaCanalView from './views/MarcaCanalView';
import CostaRicaView from './views/CostaRicaView';
import MasterPortalView from './views/MasterPortalView';
import GuatemalaPortadaView from './views/GuatemalaPortadaView';
import GuatemalaOverviewView from './views/GuatemalaOverviewView';
import GuatemalaMarcaView from './views/GuatemalaMarcaView';
import GuatemalaCanalView from './views/GuatemalaCanalView';
import GuatemalaMatrizCanalView from './views/GuatemalaMatrizCanalView';
import GuatemalaMatrizRegionesView from './views/GuatemalaMatrizRegionesView';
import GuatemalaGrowthDriversView from './views/GuatemalaGrowthDriversView';
import GuatemalaMarcaCanalView from './views/GuatemalaMarcaCanalView';
import GuatemalaView from './views/GuatemalaView';
import SemanticModelView from './views/SemanticModelView';
import ColombiaPortadaView from './views/ColombiaPortadaView';
import ColombiaOverviewView from './views/ColombiaOverviewView';
import ColombiaMarcaCanalesView from './views/ColombiaMarcaCanalesView';
import ColombiaCanalesMarcaView from './views/ColombiaCanalesMarcaView';
import ColombiaMatrizKpisView from './views/ColombiaMatrizKpisView';
import ColombiaMatrizKpisRegionView from './views/ColombiaMatrizKpisRegionView';

// ==========================================
// ERROR BOUNDARY
// ==========================================
class HadaErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    fetch('/api/report-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error?.message,
        stack: error?.stack,
        componentStack: errorInfo?.componentStack,
        url: window.location.href
      })
    }).catch(console.error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
          <div className="bg-slate-800 border border-red-500/30 rounded-xl p-8 max-w-xl text-center shadow-2xl">
            <span className="text-4xl mb-4 block">🚨</span>
            <h2 className="text-2xl font-bold text-red-400 mb-2">Error de Renderizado</h2>
            <p className="text-slate-300 text-sm mb-6">{this.state.error?.message || 'Ocurrió una excepción imprevista.'}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-[#004B93] hover:bg-[#003870] px-6 py-2.5 rounded-lg text-white font-medium transition"
            >
              🔄 Recargar Aplicación
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ==========================================
// COMPONENTE: PORTADA COSTA RICA (RÉPLICA EXACTA)
// ==========================================
function PortadaCostaRica({ onNavigate, onBackToMaster }) {
  const buttonsCol1 = [
    {
      id: 'overview',
      title: 'Overview',
      icon: (
        <svg viewBox="0 0 44 44" className="w-9 h-9 md:w-10 md:h-10 stroke-[#0066c0] fill-none stroke-[2.4]" strokeLinecap="round" strokeLinejoin="round">
          {/* Marco de Ejes Cartesianos */}
          <path d="M 6 6 L 6 36 L 38 36" strokeWidth="2.4" />
          {/* Línea de Tendencia con Puntos */}
          <path d="M 7 21 L 16 13 L 26 19 L 36 9" strokeWidth="2.4" />
          <circle cx="7" cy="21" r="1.8" fill="#0066c0" stroke="none" />
          <circle cx="16" cy="13" r="1.8" fill="#0066c0" stroke="none" />
          <circle cx="26" cy="19" r="1.8" fill="#0066c0" stroke="none" />
          <circle cx="36" cy="9" r="1.8" fill="#0066c0" stroke="none" />
          {/* Barras Verticales Crecientes */}
          <rect x="9" y="27" width="3.2" height="9" fill="#0066c0" stroke="none" />
          <rect x="16" y="21" width="3.2" height="15" fill="#0066c0" stroke="none" />
          <rect x="23" y="25" width="3.2" height="11" fill="#0066c0" stroke="none" />
          <rect x="30" y="15" width="3.2" height="21" fill="#0066c0" stroke="none" />
        </svg>
      )
    },
    {
      id: 'marca',
      title: 'Marca',
      icon: (
        <svg viewBox="0 0 44 44" className="w-9 h-9 md:w-10 md:h-10 stroke-[#0066c0] fill-none stroke-[2.4]" strokeLinecap="round" strokeLinejoin="round">
          {/* Etiqueta de Precio Inclinada */}
          <path d="M 12 8 L 26 8 L 37 19 L 23 33 L 8 18 Z" strokeWidth="2.4" />
          <circle cx="16" cy="14" r="2.2" strokeWidth="2.2" />
        </svg>
      )
    },
    {
      id: 'canal',
      title: 'Canal',
      icon: (
        <svg viewBox="0 0 44 44" className="w-9 h-9 md:w-10 md:h-10 stroke-[#0066c0] fill-none stroke-[2.4]" strokeLinecap="round" strokeLinejoin="round">
          {/* Nodo Central */}
          <circle cx="22" cy="22" r="4.5" strokeWidth="2.4" />
          {/* 4 Nodos Periféricos */}
          <circle cx="9" cy="9" r="2.8" strokeWidth="2.4" />
          <circle cx="35" cy="9" r="2.8" strokeWidth="2.4" />
          <circle cx="9" cy="35" r="2.8" strokeWidth="2.4" />
          <circle cx="35" cy="35" r="2.8" strokeWidth="2.4" />
          {/* Conexiones */}
          <line x1="18.5" y1="18.5" x2="11.5" y2="11.5" strokeWidth="2.2" />
          <line x1="25.5" y1="18.5" x2="32.5" y2="11.5" strokeWidth="2.2" />
          <line x1="18.5" y1="25.5" x2="11.5" y2="32.5" strokeWidth="2.2" />
          <line x1="25.5" y1="25.5" x2="32.5" y2="32.5" strokeWidth="2.2" />
        </svg>
      )
    },
    {
      id: 'matriz_kpis',
      title: "Matriz KPI's",
      icon: (
        <svg viewBox="0 0 44 44" className="w-9 h-9 md:w-10 md:h-10 stroke-[#0066c0] fill-none stroke-[2.4]" strokeLinecap="round" strokeLinejoin="round">
          {/* Cuadrícula de 4 Cuadros */}
          <rect x="7" y="7" width="12" height="12" rx="2" strokeWidth="2.4" />
          <rect x="25" y="7" width="12" height="12" rx="2" strokeWidth="2.4" />
          <rect x="7" y="25" width="12" height="12" rx="2" strokeWidth="2.4" />
          <rect x="25" y="25" width="12" height="12" rx="2" strokeWidth="2.4" />
        </svg>
      )
    }
  ];

  const buttonsCol2 = [
    {
      id: 'matriz_regiones',
      title: "Matriz KPI's Reg.",
      icon: (
        <svg viewBox="0 0 44 44" className="w-9 h-9 md:w-10 md:h-10 stroke-[#0066c0] fill-none stroke-[2.4]" strokeLinecap="round" strokeLinejoin="round">
          {/* Pin de Ubicación / Mapa */}
          <path d="M 22 6 C 14.5 6 9 11.5 9 18.5 C 9 27.5 22 37 22 37 C 22 37 35 27.5 35 18.5 C 35 11.5 29.5 6 22 6 Z" strokeWidth="2.4" />
          <circle cx="22" cy="18" r="4" strokeWidth="2.4" />
          <ellipse cx="22" cy="38" rx="10" ry="2.5" strokeWidth="1.8" />
        </svg>
      )
    },
    {
      id: 'growth_drivers',
      title: 'Growth Drivers',
      icon: (
        <svg viewBox="0 0 44 44" className="w-9 h-9 md:w-10 md:h-10 stroke-[#0066c0] fill-none stroke-[2.4]" strokeLinecap="round" strokeLinejoin="round">
          {/* Flechas de Ciclo Económico / Rotación */}
          <path d="M 12 12 L 32 12 C 35.5 12 38 14.5 38 18 L 38 21" strokeWidth="2.2" />
          <polyline points="17,7 11,12 17,17" strokeWidth="2.2" />
          <path d="M 32 32 L 12 32 C 8.5 32 6 29.5 6 26 L 6 23" strokeWidth="2.2" />
          <polyline points="27,37 33,32 27,27" strokeWidth="2.2" />
          {/* Símbolo de Dollar */}
          <path d="M 22 15 L 22 29" strokeWidth="2.2" />
          <path d="M 24.5 18 C 24.5 16.5 23.3 15.5 22 15.5 C 20.3 15.5 19 16.5 19 18 C 19 20.5 25 20.5 25 23 C 25 24.5 23.7 25.5 22 25.5 C 20.5 25.5 19 24.5 19 23" strokeWidth="2.2" />
        </svg>
      )
    },
    {
      id: 'marca_canal',
      title: 'Marcas - Canales',
      icon: (
        <svg viewBox="0 0 44 44" className="w-9 h-9 md:w-10 md:h-10 stroke-[#0066c0] fill-none stroke-[2.4]" strokeLinecap="round" strokeLinejoin="round">
          {/* Gráfico Circular con Porción Separada */}
          <path d="M 21 23 L 21 7 A 15 15 0 1 0 37 23 Z" strokeWidth="2.4" />
          <path d="M 25 19 L 25 7 A 15 15 0 0 1 37 19 Z" strokeWidth="2.4" />
        </svg>
      )
    },
    {
      id: 'mapa',
      title: 'Costa Rica',
      icon: (
        <img 
          src="/assets/Mapas/costa_rica_silhouette.png" 
          alt="Costa Rica" 
          className="w-10 h-10 md:w-11 md:h-11 object-contain" 
        />
      )
    }
  ];

  return (
    <div className="min-h-screen bg-[#f3f6f9] relative flex flex-col justify-between overflow-hidden px-6 md:px-12 py-6 select-none font-sans">
      
      {/* Fondo de Nodos y Redes Geométricas estilo Nielsen */}
      <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="network-mesh-bg" width="180" height="180" patternUnits="userSpaceOnUse">
            <circle cx="20" cy="30" r="2" fill="#64748b" />
            <circle cx="120" cy="40" r="2.5" fill="#475569" />
            <circle cx="150" cy="130" r="2" fill="#64748b" />
            <circle cx="70" cy="140" r="2.5" fill="#475569" />
            <line x1="20" y1="30" x2="120" y2="40" stroke="#94a3b8" strokeWidth="0.8" />
            <line x1="120" y1="40" x2="150" y2="130" stroke="#94a3b8" strokeWidth="0.8" />
            <line x1="150" y1="130" x2="70" y2="140" stroke="#94a3b8" strokeWidth="0.8" />
            <line x1="70" y1="140" x2="20" y2="30" stroke="#94a3b8" strokeWidth="0.8" />
            <line x1="20" y1="30" x2="150" y2="130" stroke="#cbd5e1" strokeWidth="0.6" strokeDasharray="3 3" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#network-mesh-bg)" />
      </svg>

      {/* CABECERA SUPERIOR */}
      <div className="flex items-center justify-between w-full max-w-5xl mx-auto z-10 px-2">
        <div className="flex items-center justify-center w-28 md:w-32">
          <img 
            src="/assets/LOGOS/Electrolit-color.png" 
            alt="Electrolit Logo" 
            className="h-10 md:h-12 object-contain"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          <div className="hidden items-center text-3xl font-black italic tracking-wide text-[#004B93]">
            Electrolit
          </div>
        </div>

        <button 
          onClick={onBackToMaster}
          title="Regresar a Portada Maestra de Países"
          className="group flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/80 transition-all cursor-pointer"
        >
          <img 
            src="/assets/LOGOS/Nielsen-logo.png" 
            alt="Nielsen Logo" 
            className="h-8 md:h-10 object-contain group-hover:scale-105 transition-transform" 
          />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-[#0066c0] hidden md:inline-block">
            ← Países
          </span>
        </button>
      </div>

      {/* COMPOSICIÓN ARTÍSTICA CENTRAL */}
      <div className="max-w-5xl w-full mx-auto my-auto z-10 py-2">
        <div className="relative flex flex-col items-center justify-center min-h-[290px]">
          
          {/* LADO IZQUIERDO: Bandera Costa Rica y Título Centrados */}
          <div className="absolute left-0 top-0 w-28 md:w-32 flex flex-col items-center text-center z-20">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white hover:scale-105 transition-transform duration-300 flex items-center justify-center">
              <img 
                src="/assets/Banderas/Costa Rica.png" 
                alt="Bandera Costa Rica" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = "https://flagcdn.com/w160/cr.png";
                }}
              />
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-[#0066c0] mt-3 tracking-tight text-center whitespace-nowrap">
              Costa Rica
            </h2>
          </div>

          {/* CENTRO: ILUSTRACIÓN DE NATURALEZA Y BOTELLA DE ELECTROLIT */}
          <div className="flex items-center justify-center gap-6 md:gap-12 relative">
            <div className="flex flex-col items-center gap-3 select-none">
              <div className="w-28 h-16 relative flex items-center justify-center opacity-90">
                <svg viewBox="0 0 120 70" className="w-full h-full stroke-blue-500 fill-none stroke-[2.5]" strokeLinecap="round">
                  <path d="M 10 50 Q 30 20 55 35 T 90 20 Q 105 10 110 30" />
                  <path d="M 25 55 Q 45 35 70 45 T 100 35" strokeWidth="1.8" className="stroke-cyan-400" />
                  <path d="M 40 60 Q 60 48 85 55" strokeWidth="1.2" className="stroke-blue-300" />
                </svg>
              </div>

              <div className="w-28 h-32 relative flex flex-col items-center justify-center">
                <div className="relative group">
                  <div className="text-emerald-600 text-5xl absolute -bottom-2 -left-3 opacity-90 rotate-[-15deg]">🌿</div>
                  <div className="text-emerald-500 text-5xl absolute -bottom-1 -right-2 opacity-80 rotate-[25deg]">🌿</div>
                  <div className="relative z-10 text-5xl md:text-6xl filter drop-shadow-md transform -scale-x-100 hover:rotate-6 transition-transform">
                    🦜
                  </div>
                </div>
              </div>
            </div>

            <div className="relative flex flex-col items-center justify-center z-10 px-2">
              <div className="absolute inset-0 -m-8 pointer-events-none opacity-80">
                <div className="w-2 h-2 rounded-full bg-cyan-400 absolute top-4 left-6 animate-ping"></div>
                <div className="w-3 h-3 rounded-full bg-blue-400 absolute top-12 right-4"></div>
                <div className="w-2 h-2 rounded-full bg-cyan-300 absolute bottom-14 left-4"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 absolute bottom-8 right-8"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 absolute top-20 left-2"></div>
              </div>

              <div className="relative group cursor-pointer transform hover:scale-105 transition-all duration-300">
                <img 
                  src="/assets/Botellas/Costa_Rica_Uva_Portada.png" 
                  alt="Botella Electrolit" 
                  className="h-64 md:h-72 object-contain filter drop-shadow-2xl"
                  onError={(e) => {
                    e.target.src = "/assets/botella_electrolit.png";
                  }}
                />
                <div className="w-28 h-4 bg-slate-400/30 rounded-full blur-sm mx-auto -mt-2"></div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3 select-none">
              <div className="w-32 h-16 relative flex items-center justify-center opacity-90">
                <svg viewBox="0 0 130 70" className="w-full h-full stroke-emerald-600 fill-none stroke-[2.2]" strokeLinecap="round">
                  <path d="M 50 15 Q 65 10 80 15 Q 90 20 80 25 Q 65 25 50 20 Z" strokeWidth="1.2" className="stroke-slate-400 fill-white/40" />
                  <path d="M 15 60 L 58 22 L 68 22 L 115 60" />
                  <path d="M 30 60 L 62 30 L 98 60" strokeWidth="1.2" className="stroke-emerald-400" />
                </svg>
              </div>

              <div className="w-32 h-32 relative flex flex-col items-center justify-center">
                <div className="w-28 h-2.5 bg-amber-800/80 rounded-full shadow-xs transform rotate-[-8deg] relative">
                  <span className="absolute -top-3 left-2 text-sm">🍃</span>
                  <span className="absolute -bottom-2 right-4 text-xs">🌱</span>
                  <div className="absolute top-1 left-7 text-5xl transform hover:scale-110 transition-transform">
                    🦥
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 8 BOTONES CAPSULARES DE NAVEGACIÓN ESTILO POWER BI */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-5 max-w-4xl mx-auto mt-6 px-4">
          <div className="flex flex-col gap-4">
            {buttonsCol1.map(btn => (
              <button
                key={btn.id}
                onClick={() => onNavigate(btn.id)}
                className="group relative flex items-center bg-gradient-to-r from-[#0066c0] to-[#0055a5] hover:from-[#0073cc] hover:to-[#005bb5] text-white rounded-full p-1 pr-8 shadow-md hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 border border-blue-400/20 text-left cursor-pointer"
              >
                <div className="w-16 h-16 md:w-17 md:h-17 -my-1.5 -ml-1.5 rounded-full bg-white text-[#0066c0] flex items-center justify-center shadow-lg border border-slate-100 group-hover:scale-105 transition-transform shrink-0 z-10">
                  {btn.icon}
                </div>
                <span className="ml-4 md:ml-5 font-bold text-lg md:text-xl tracking-normal text-white drop-shadow-xs">
                  {btn.title}
                </span>
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-4">
            {buttonsCol2.map(btn => (
              <button
                key={btn.id}
                onClick={() => onNavigate(btn.id)}
                className="group relative flex items-center bg-gradient-to-r from-[#0066c0] to-[#0055a5] hover:from-[#0073cc] hover:to-[#005bb5] text-white rounded-full p-1 pr-8 shadow-md hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 border border-blue-400/20 text-left cursor-pointer"
              >
                <div className="w-16 h-16 md:w-17 md:h-17 -my-1.5 -ml-1.5 rounded-full bg-white text-[#0066c0] flex items-center justify-center shadow-lg border border-slate-100 group-hover:scale-105 transition-transform shrink-0 z-10">
                  {btn.icon}
                </div>
                <span className="ml-4 md:ml-5 font-bold text-lg md:text-xl tracking-normal text-white drop-shadow-xs">
                  {btn.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* PIE DE PORTADA */}
      <div className="max-w-5xl w-full mx-auto flex items-center justify-between text-[11px] text-slate-400 font-medium z-10 pt-4">
        <span>Laboratorios PiSA • Electrolit Centroamérica</span>
        <span>Fuente: BigQuery • psa-eltr-latam-pr.Nielsen</span>
      </div>
    </div>
  );
}

// ==========================================
// COMPONENTE: VISTA OVERVIEW (RÉPLICA 1:1 POWER BI)
// ==========================================
function OverviewView({ onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [anio, setAnio] = useState('2026');
  const [mes, setMes] = useState('Todas');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/nielsen/cr/overview-dashboard?anio=${anio}&mes=${mes}`)
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

    // 4. Precio/Unit
    const prIsoAct = Number(isoAct.precio_unit || 0);
    const prSueAct = Number(sueAct.precio_unit || 0);
    const prTotAct = undsTotAct > 0 ? (valTotAct * 1000) / (undsTotAct * 1000) : 0;

    const prIsoAnt = Number(isoAnt.precio_unit || 0);
    const prSueAnt = Number(sueAnt.precio_unit || 0);
    const prTotAnt = undsTotAnt > 0 ? (valTotAnt * 1000) / (undsTotAnt * 1000) : 0;

    // 5. Dist. Num
    const distIsoAct = Number(isoAct.dist_num || 0);
    const distSueAct = Number(sueAct.dist_num || 0);
    const distIsoAnt = Number(isoAnt.dist_num || 0);
    const distSueAnt = Number(sueAnt.dist_num || 0);

    return {
      unidades: {
        ant: { total: undsTotAnt, iso: undsIsoAnt, sue: undsSueAnt },
        act: { total: undsTotAct, iso: undsIsoAct, sue: undsSueAct },
        varTotal: calcVar(undsTotAct, undsTotAnt),
        varIso: calcVar(undsIsoAct, undsIsoAnt),
        varSue: calcVar(undsSueAct, undsSueAnt)
      },
      litros: {
        ant: { total: ltTotAnt, iso: ltIsoAnt, sue: ltSueAnt },
        act: { total: ltTotAct, iso: ltIsoAct, sue: ltSueAct },
        varTotal: calcVar(ltTotAct, ltTotAnt),
        varIso: calcVar(ltIsoAct, ltIsoAnt),
        varSue: calcVar(ltSueAct, ltSueAnt)
      },
      valor: {
        ant: { total: valTotAnt, iso: valIsoAnt, sue: valSueAnt },
        act: { total: valTotAct, iso: valIsoAct, sue: valSueAct },
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
    
    // Diferencia mes a mes en puntos porcentuales
    const delta = Number((currentVal - previousVal).toFixed(2));
    if (delta >= 0.2) {
      return 'bg-[#7cd294] text-slate-900 font-semibold'; // Verde
    }
    if (delta <= -0.2) {
      return 'bg-[#fca5a5] text-slate-900 font-semibold'; // Rojizo
    }
    return 'text-slate-700 bg-transparent';
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans p-4 md:p-6 space-y-4">
      
      {/* 1. CABECERA SUPERIOR: LOGOS, TITULO, LEYENDA Y FILTROS */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs px-5 py-3 flex flex-wrap items-center justify-between gap-4">
        
        {/* Logos Oficiales */}
        <div className="flex items-center gap-4">
          <img src="/assets/LOGOS/Electrolit-color.png" alt="Electrolit" className="h-8 object-contain" />
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
            title="Volver a la Portada"
            className="p-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-[#0066c0] transition cursor-pointer shadow-2xs"
          >
            <Home className="w-5 h-5" />
          </button>
        </div>

      </div>

      {loading ? (
        <div className="p-20 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
          <RefreshCw className="w-10 h-10 animate-spin mx-auto mb-3 text-[#0066c0]" />
          <p className="font-semibold text-slate-600">Consultando datos analíticos en BigQuery...</p>
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
                    {kpiCards?.unidades?.varTotal >= 0 ? `${kpiCards?.unidades?.varTotal.toFixed(2)}%` : `${kpiCards?.unidades?.varTotal.toFixed(2)}%`}
                  </span>
                  <div className="w-full max-w-[52px] flex flex-col rounded-t-xs overflow-hidden h-[92%] bg-[#b0b6bf] p-1.5 justify-around shadow-2xs border border-slate-400/40">
                    <div className="bg-[#1ba3b8] rounded-xs text-[9.5px] text-white font-bold text-center py-0.5 shadow-xs">
                      {kpiCards?.unidades?.varSue >= 0 ? `${kpiCards?.unidades?.varSue.toFixed(1)}%` : `${kpiCards?.unidades?.varSue.toFixed(1)}%`}
                    </div>
                    <div className="bg-[#f28e2c] rounded-xs text-[9.5px] text-white font-bold text-center py-0.5 shadow-xs">
                      {kpiCards?.unidades?.varIso >= 0 ? `${kpiCards?.unidades?.varIso.toFixed(1)}%` : `${kpiCards?.unidades?.varIso.toFixed(1)}%`}
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
                    {kpiCards?.litros?.varTotal >= 0 ? `${kpiCards?.litros?.varTotal.toFixed(2)}%` : `${kpiCards?.litros?.varTotal.toFixed(2)}%`}
                  </span>
                  <div className="w-full max-w-[52px] flex flex-col rounded-t-xs overflow-hidden h-[92%] bg-[#b0b6bf] p-1.5 justify-around shadow-2xs border border-slate-400/40">
                    <div className="bg-[#1ba3b8] rounded-xs text-[9.5px] text-white font-bold text-center py-0.5 shadow-xs">
                      {kpiCards?.litros?.varSue >= 0 ? `${kpiCards?.litros?.varSue.toFixed(1)}%` : `${kpiCards?.litros?.varSue.toFixed(1)}%`}
                    </div>
                    <div className="bg-[#f28e2c] rounded-xs text-[9.5px] text-white font-bold text-center py-0.5 shadow-xs">
                      {kpiCards?.litros?.varIso >= 0 ? `${kpiCards?.litros?.varIso.toFixed(1)}%` : `${kpiCards?.litros?.varIso.toFixed(1)}%`}
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
                    {kpiCards?.valor?.varTotal >= 0 ? `${kpiCards?.valor?.varTotal.toFixed(2)}%` : `${kpiCards?.valor?.varTotal.toFixed(2)}%`}
                  </span>
                  <div className="w-full max-w-[52px] flex flex-col rounded-t-xs overflow-hidden h-[95%] bg-[#b0b6bf] p-1.5 justify-around shadow-2xs border border-slate-400/40">
                    <div className="bg-[#1ba3b8] rounded-xs text-[9.5px] text-white font-bold text-center py-0.5 shadow-xs">
                      {kpiCards?.valor?.varSue >= 0 ? `${kpiCards?.valor?.varSue.toFixed(1)}%` : `${kpiCards?.valor?.varSue.toFixed(1)}%`}
                    </div>
                    <div className="bg-[#f28e2c] rounded-xs text-[9.5px] text-white font-bold text-center py-0.5 shadow-xs">
                      {kpiCards?.valor?.varIso >= 0 ? `${kpiCards?.valor?.varIso.toFixed(1)}%` : `${kpiCards?.valor?.varIso.toFixed(1)}%`}
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-700 font-bold mt-2">%Var.</span>
                </div>
              </div>
            </div>

            {/* Card 4: Valor USD (Precio/Unidad) */}
            <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs flex flex-col justify-between">
              <div className="border-b border-blue-200 border-dashed pb-2 mb-2 text-center">
                <h3 className="font-bold text-xs md:text-sm text-[#0066c0]">Valor USD</h3>
              </div>
              <div className="flex items-end justify-between gap-2 h-56 pt-2">
                {/* Gráfico de Líneas (2025 vs 2026) */}
                <div className="flex-[2] flex flex-col justify-between h-full">
                  <div className="relative flex-1 w-full flex items-center justify-center">
                    <svg viewBox="0 0 200 140" className="w-full h-full overflow-visible">
                      {/* Línea Sueros (Cyan/Teal #1ba3b8) */}
                      <line x1="35" y1="50" x2="165" y2="35" stroke="#1ba3b8" strokeWidth="3" strokeLinecap="round" />
                      <circle cx="35" cy="50" r="4.5" fill="#1ba3b8" stroke="#ffffff" strokeWidth="2" />
                      <circle cx="165" cy="35" r="4.5" fill="#1ba3b8" stroke="#ffffff" strokeWidth="2" />
                      
                      {/* Badge Sueros 2025 */}
                      <rect x="18" y="22" width="34" height="15" rx="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                      <text x="35" y="33" textAnchor="middle" fill="#0f172a" fontSize="9.5" fontWeight="bold">
                        {kpiCards?.precio?.ant.sue.toFixed(2)}
                      </text>

                      {/* Badge Sueros 2026 */}
                      <rect x="148" y="7" width="34" height="15" rx="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                      <text x="165" y="18" textAnchor="middle" fill="#0f172a" fontSize="9.5" fontWeight="bold">
                        {kpiCards?.precio?.act.sue.toFixed(2)}
                      </text>

                      {/* Línea Isotónicas (Naranja #f28e2c) */}
                      <line x1="35" y1="110" x2="165" y2="98" stroke="#f28e2c" strokeWidth="3" strokeLinecap="round" />
                      <circle cx="35" cy="110" r="4.5" fill="#f28e2c" stroke="#ffffff" strokeWidth="2" />
                      <circle cx="165" cy="98" r="4.5" fill="#f28e2c" stroke="#ffffff" strokeWidth="2" />

                      {/* Badge Isotónicas 2025 */}
                      <rect x="18" y="82" width="34" height="15" rx="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                      <text x="35" y="93" textAnchor="middle" fill="#0f172a" fontSize="9.5" fontWeight="bold">
                        {kpiCards?.precio?.ant.iso.toFixed(2)}
                      </text>

                      {/* Badge Isotónicas 2026 */}
                      <rect x="148" y="70" width="34" height="15" rx="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                      <text x="165" y="81" textAnchor="middle" fill="#0f172a" fontSize="9.5" fontWeight="bold">
                        {kpiCards?.precio?.act.iso.toFixed(2)}
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
                    {kpiCards?.precio?.varTotal >= 0 ? `${kpiCards?.precio?.varTotal.toFixed(2)}%` : `${kpiCards?.precio?.varTotal.toFixed(2)}%`}
                  </span>
                  <div className="w-full max-w-[52px] flex flex-col rounded-t-xs overflow-hidden h-[92%] bg-[#b0b6bf] p-1.5 justify-around shadow-2xs border border-slate-400/40">
                    <div className="bg-[#1ba3b8] rounded-xs text-[9.5px] text-white font-bold text-center py-0.5 shadow-xs">
                      {kpiCards?.precio?.varSue >= 0 ? `${kpiCards?.precio?.varSue.toFixed(1)}%` : `${kpiCards?.precio?.varSue.toFixed(1)}%`}
                    </div>
                    <div className="bg-[#f28e2c] rounded-xs text-[9.5px] text-white font-bold text-center py-0.5 shadow-xs">
                      {kpiCards?.precio?.varIso >= 0 ? `${kpiCards?.precio?.varIso.toFixed(1)}%` : `${kpiCards?.precio?.varIso.toFixed(1)}%`}
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-700 font-bold mt-2">%Var.</span>
                </div>
              </div>
            </div>

            {/* Card 5: Dist. Num. */}
            <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs flex flex-col justify-between">
              <div className="border-b border-blue-200 border-dashed pb-2 mb-2 text-center">
                <h3 className="font-bold text-xs md:text-sm text-[#0066c0]">Dist. Num.</h3>
              </div>
              <div className="flex items-end justify-between gap-2 h-56 pt-2">
                {/* Gráfico de Líneas (2025 vs 2026) */}
                <div className="flex-[2] flex flex-col justify-between h-full">
                  <div className="relative flex-1 w-full flex items-center justify-center">
                    <svg viewBox="0 0 200 140" className="w-full h-full overflow-visible">
                      {/* Línea Isotónicas (Arriba, Naranja #f28e2c) */}
                      <line x1="35" y1="35" x2="165" y2="42" stroke="#f28e2c" strokeWidth="3" strokeLinecap="round" />
                      <circle cx="35" cy="35" r="4.5" fill="#f28e2c" stroke="#ffffff" strokeWidth="2" />
                      <circle cx="165" cy="42" r="4.5" fill="#f28e2c" stroke="#ffffff" strokeWidth="2" />

                      {/* Badge Isotónicas 2025 */}
                      <rect x="20" y="7" width="30" height="15" rx="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                      <text x="35" y="18" textAnchor="middle" fill="#0f172a" fontSize="9.5" fontWeight="bold">
                        {kpiCards?.distNum?.ant.iso.toFixed(1)}
                      </text>

                      {/* Badge Isotónicas 2026 */}
                      <rect x="150" y="14" width="30" height="15" rx="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                      <text x="165" y="25" textAnchor="middle" fill="#0f172a" fontSize="9.5" fontWeight="bold">
                        {kpiCards?.distNum?.act.iso.toFixed(1)}
                      </text>

                      {/* Línea Sueros (Abajo, Cyan/Teal #1ba3b8) */}
                      <line x1="35" y1="95" x2="165" y2="75" stroke="#1ba3b8" strokeWidth="3" strokeLinecap="round" />
                      <circle cx="35" cy="95" r="4.5" fill="#1ba3b8" stroke="#ffffff" strokeWidth="2" />
                      <circle cx="165" cy="75" r="4.5" fill="#1ba3b8" stroke="#ffffff" strokeWidth="2" />

                      {/* Badge Sueros 2025 */}
                      <rect x="20" y="67" width="30" height="15" rx="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                      <text x="35" y="78" textAnchor="middle" fill="#0f172a" fontSize="9.5" fontWeight="bold">
                        {kpiCards?.distNum?.ant.sue.toFixed(1)}
                      </text>

                      {/* Badge Sueros 2026 */}
                      <rect x="150" y="47" width="30" height="15" rx="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                      <text x="165" y="58" textAnchor="middle" fill="#0f172a" fontSize="9.5" fontWeight="bold">
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
                    {kpiCards?.distNum?.varTotal >= 0 ? `+${kpiCards?.distNum?.varTotal.toFixed(1)}` : `${kpiCards?.distNum?.varTotal.toFixed(1)}`}
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
                  const maxUnds = 3800; // Escala máxima
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
                    {/* Línea Sueros (Cyan/Teal #1ba3b8) */}
                    <polyline
                      fill="none"
                      stroke="#1ba3b8"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={data?.monthlyTrends?.map((m, idx) => {
                        const count = data.monthlyTrends.length;
                        const x = 40 + (idx / (count - 1)) * 920;
                        const y = 90 - ((m.precio_sueros - 3.40) / 0.80) * 65;
                        return `${x},${y}`;
                      }).join(' ')}
                    />
                    {/* Línea Isotónicas (Naranja #f28e2c) */}
                    <polyline
                      fill="none"
                      stroke="#f28e2c"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={data?.monthlyTrends?.map((m, idx) => {
                        const count = data.monthlyTrends.length;
                        const x = 40 + (idx / (count - 1)) * 920;
                        const y = 175 - ((m.precio_isotonicas - 1.85) / 0.50) * 50;
                        return `${x},${y}`;
                      }).join(' ')}
                    />

                    {/* Puntos y Etiquetas de Sueros */}
                    {data?.monthlyTrends?.map((m, idx) => {
                      const count = data.monthlyTrends.length;
                      const x = 40 + (idx / (count - 1)) * 920;
                      const y = 90 - ((m.precio_sueros - 3.40) / 0.80) * 65;
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
                      const y = 175 - ((m.precio_isotonicas - 1.85) / 0.50) * 50;
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
                  const maxVal = 10500;
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
                    {/* Línea Isotónicas (Naranja, arriba ~90-94%) */}
                    <polyline
                      fill="none"
                      stroke="#f28e2c"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={data?.monthlyTrends?.map((m, idx) => {
                        const count = data.monthlyTrends.length;
                        const x = 40 + (idx / (count - 1)) * 920;
                        const y = 80 - ((m.dist_isotonicas - 86) / 12) * 55;
                        return `${x},${y}`;
                      }).join(' ')}
                    />
                    {/* Línea Sueros (Cyan/Teal, abajo ~74-80%) */}
                    <polyline
                      fill="none"
                      stroke="#1ba3b8"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={data?.monthlyTrends?.map((m, idx) => {
                        const count = data.monthlyTrends.length;
                        const x = 40 + (idx / (count - 1)) * 920;
                        const y = 175 - ((m.dist_sueros - 70) / 14) * 50;
                        return `${x},${y}`;
                      }).join(' ')}
                    />

                    {/* Puntos y Etiquetas Isotónicas */}
                    {data?.monthlyTrends?.map((m, idx) => {
                      const count = data.monthlyTrends.length;
                      const x = 40 + (idx / (count - 1)) * 920;
                      const y = 80 - ((m.dist_isotonicas - 86) / 12) * 55;
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
                      const y = 175 - ((m.dist_sueros - 70) / 14) * 50;
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
                    <th className="py-1.5 px-2">MARCA</th>
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
                  {data?.somUnidades?.map((row, idx) => (
                    <tr key={idx} className={row.MARCA === 'ELECTROLIT' ? 'font-bold bg-blue-50/40' : 'hover:bg-slate-50/60'}>
                      <td className="py-1 px-2 font-bold text-slate-800 flex items-center gap-1 border-r border-slate-200">
                        {row.MARCA === 'ELECTROLIT' && <Award className="w-3 h-3 text-cyan-600 shrink-0" />}
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
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tabla Derecha: SOM USD */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs overflow-x-auto">
              <h3 className="text-center font-bold text-xs text-[#0066c0] mb-2">SOM USD</h3>
              <table className="w-full text-[10px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-300 bg-slate-200/80 text-slate-700 font-bold">
                    <th className="py-1.5 px-2">MARCA</th>
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
                  {data?.somUSD?.map((row, idx) => (
                    <tr key={idx} className={row.MARCA === 'ELECTROLIT' ? 'font-bold bg-blue-50/40' : 'hover:bg-slate-50/60'}>
                      <td className="py-1 px-2 font-bold text-[#004B93] flex items-center gap-1 border-r border-slate-200">
                        {row.MARCA === 'ELECTROLIT' && <Award className="w-3 h-3 text-cyan-600 shrink-0" />}
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
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </>
      )}

    </div>
  );
}

// ==========================================
// COMPONENTES SECUNDARIOS (MARCA, CANAL, ETC.)
// ==========================================
function CanalesRegionesView({ onBack, title, type }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/nielsen/cr/canales-regiones')
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

  const items = type === 'canal' ? (data?.canales || []) : (data?.regiones || []);
  const indexKey = type === 'canal' ? 'Canal' : 'Region';

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#004B93] font-bold transition text-sm shadow-xs cursor-pointer"
          >
            <Home className="w-4 h-4" />
            Volver a la Portada
          </button>
          <div className="ml-2">
            <h2 className="text-xl font-bold text-[#004B93]">{title} • Costa Rica</h2>
            <p className="text-xs text-slate-500">Distribución de ventas e impacto territorial</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#004B93]" />
          Cargando datos desde BigQuery...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-12 shadow-xs">
            <h3 className="text-base font-bold text-slate-800 mb-2">Desglose Numérico</h3>
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <tr>
                    <th className="py-2 px-3">{type === 'canal' ? 'Canal' : 'Región'}</th>
                    <th className="py-2 px-3">Ventas Valor</th>
                    <th className="py-2 px-3">Unidades</th>
                    <th className="py-2 px-3">Dist. Reach</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-semibold text-[#004B93]">{item[indexKey]}</td>
                      <td className="py-2 px-3">${Number(item.ventas_valor).toLocaleString()}</td>
                      <td className="py-2 px-3">{Number(item.ventas_unds).toLocaleString()}</td>
                      <td className="py-2 px-3">{item.dist_pond_prom}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ==========================================
// APLICACIÓN PRINCIPAL (APP)
// ==========================================
export default function App() {
  const [currentCountry, setCurrentCountry] = useState('master');
  const [currentView, setCurrentView] = useState('portada');

  const handleSelectCountry = (countryCode) => {
    setCurrentCountry(countryCode);
    setCurrentView('portada');
  };

  const handleBackToMaster = () => {
    setCurrentCountry('master');
    setCurrentView('portada');
  };

  return (
    <HadaErrorBoundary>
      <div className="min-h-screen bg-[#f3f6f9] font-sans">
        
        {/* 1. PORTADA MAESTRA (HUB DE PAÍSES) */}
        {currentCountry === 'master' && currentView !== 'semantic_model' && (
          <MasterPortalView 
            onSelectCountry={handleSelectCountry} 
            onOpenSemanticModel={() => setCurrentView('semantic_model')}
          />
        )}

        {/* 1.1 VISTA DEL MODELO SEMÁNTICO Y ARQUITECTURA */}
        {currentView === 'semantic_model' && (
          <SemanticModelView onBack={() => {
            setCurrentView('portada');
            setCurrentCountry('master');
          }} />
        )}

        {/* 2. ECOSISTEMA COSTA RICA */}
        {currentCountry === 'CR' && (
          <>
            {currentView === 'portada' && (
              <PortadaCostaRica 
                onNavigate={(viewId) => setCurrentView(viewId)} 
                onBackToMaster={handleBackToMaster}
              />
            )}

            {currentView === 'overview' && (
              <OverviewView onBack={() => setCurrentView('portada')} />
            )}

            {currentView === 'marca' && (
              <MarcaView onBack={() => setCurrentView('portada')} />
            )}

            {currentView === 'canal' && (
              <CanalView onBack={() => setCurrentView('portada')} />
            )}

            {currentView === 'matriz_regiones' && (
              <MatrizRegionesView onBack={() => setCurrentView('portada')} />
            )}

            {currentView === 'matriz_kpis' && (
              <MatrizKpisView onBack={() => setCurrentView('portada')} />
            )}

            {currentView === 'growth_drivers' && (
              <GrowthDriversView onBack={() => setCurrentView('portada')} />
            )}

            {currentView === 'marca_canal' && (
              <MarcaCanalView onBack={() => setCurrentView('portada')} />
            )}

            {currentView === 'mapa' && (
              <CostaRicaView onBack={() => setCurrentView('portada')} />
            )}
          </>
        )}

        {/* 3. ECOSISTEMA GUATEMALA */}
        {currentCountry === 'GT' && (
          <>
            {currentView === 'portada' && (
              <GuatemalaPortadaView 
                onNavigate={(viewId) => setCurrentView(viewId)} 
                onBackToMaster={handleBackToMaster}
              />
            )}

            {(currentView === 'overview_gt' || currentView === 'overview') && (
              <GuatemalaOverviewView onBack={() => setCurrentView('portada')} />
            )}

            {(currentView === 'marca_gt' || currentView === 'marca') && (
              <GuatemalaMarcaView onBack={() => setCurrentView('portada')} />
            )}

            {(currentView === 'canal_gt' || currentView === 'canal') && (
              <GuatemalaCanalView onBack={() => setCurrentView('portada')} />
            )}

            {(currentView === 'matriz_kpis_gt' || currentView === 'matriz_kpis' || currentView === 'matriz_canal_gt' || currentView === 'matriz_canal') && (
              <GuatemalaMatrizCanalView onBack={() => setCurrentView('portada')} />
            )}

            {(currentView === 'matriz_regiones_gt' || currentView === 'matriz_regiones') && (
              <GuatemalaMatrizRegionesView onBack={() => setCurrentView('portada')} />
            )}

            {(currentView === 'growth_drivers_gt' || currentView === 'growth_drivers') && (
              <GuatemalaGrowthDriversView onBack={() => setCurrentView('portada')} />
            )}

            {(currentView === 'marca_canal_gt' || currentView === 'marca_canal') && (
              <GuatemalaMarcaCanalView onBack={() => setCurrentView('portada')} />
            )}

            {(currentView === 'mapa_gt' || currentView === 'mapa' || currentView === 'guatemala' || currentView === 'marca_region_gt') && (
              <GuatemalaView onBack={() => setCurrentView('portada')} />
            )}
          </>
        )}

        {/* 4. ECOSISTEMA COLOMBIA */}
        {currentCountry === 'CO' && (
          <>
            {currentView === 'portada' && (
              <ColombiaPortadaView 
                onNavigate={(viewId) => setCurrentView(viewId)} 
                onBackToMaster={handleBackToMaster}
              />
            )}

            {(currentView === 'overview_co' || currentView === 'overview') && (
              <ColombiaOverviewView onBackToPortada={() => setCurrentView('portada')} />
            )}

            {(currentView === 'marca_x_canales_co' || currentView === 'marca_x_canales' || currentView === 'marca') && (
              <ColombiaMarcaCanalesView onBackToPortada={() => setCurrentView('portada')} />
            )}

            {(currentView === 'canales_x_marca_co' || currentView === 'canales_x_marca' || currentView === 'canal') && (
              <ColombiaCanalesMarcaView onBackToPortada={() => setCurrentView('portada')} />
            )}

            {(currentView === 'matriz_kpis_co' || currentView === 'matriz_kpis') && (
              <ColombiaMatrizKpisView onBackToPortada={() => setCurrentView('portada')} />
            )}

            {(currentView === 'matriz_kpis_reg_co' || currentView === 'matriz_kpis_reg' || currentView === 'matriz_regiones') && (
              <ColombiaMatrizKpisRegionView onBackToPortada={() => setCurrentView('portada')} />
            )}
          </>
        )}

      </div>
    </HadaErrorBoundary>
  );
}
