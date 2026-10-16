import React from 'react';

const ColombiaPortadaView = ({ onNavigate, onBackToMaster }) => {
  const col1Buttons = [
    {
      id: 'overview_co',
      title: 'Overview',
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-[#0066c0] fill-none stroke-2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3v18h18" />
          <path d="M18 9l-5 5-4-4-5 5" />
          <path d="M6 18v-3" />
          <path d="M10 18v-6" />
          <path d="M14 18v-4" />
          <path d="M18 18v-8" />
        </svg>
      )
    },
    {
      id: 'marca_x_canales_co',
      title: 'Marca',
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-[#0066c0] fill-none stroke-2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
          <line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
      )
    },
    {
      id: 'canales_x_marca_co',
      title: 'Canal',
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-[#0066c0] fill-none stroke-2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <circle cx="4" cy="4" r="2" />
          <circle cx="20" cy="4" r="2" />
          <circle cx="4" cy="20" r="2" />
          <circle cx="20" cy="20" r="2" />
          <line x1="9.8" y1="9.8" x2="5.5" y2="5.5" />
          <line x1="14.2" y1="9.8" x2="18.5" y2="5.5" />
          <line x1="9.8" y1="14.2" x2="5.5" y2="18.5" />
          <line x1="14.2" y1="14.2" x2="18.5" y2="18.5" />
        </svg>
      )
    },
    {
      id: 'matriz_kpis_co',
      title: "Matriz KPI's",
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-[#0066c0] fill-none stroke-2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      )
    }
  ];

  const col2Buttons = [
    {
      id: 'matriz_kpis_reg_co',
      title: "Matriz KPI's Reg.",
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-[#0066c0] fill-none stroke-2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      )
    },
    {
      id: 'growth_drivers_co',
      title: 'Growth Drivers',
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-[#0066c0] fill-none stroke-2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 2.1l4 4-4 4" />
          <path d="M3 12.2v-2a4 4 0 0 1 4-4h14" />
          <path d="M7 21.9l-4-4 4-4" />
          <path d="M21 11.8v2a4 4 0 0 1-4 4H3" />
          <path d="M12 9v6" />
          <path d="M13.5 10.5c0-.8-.7-1.5-1.5-1.5s-1.5.7-1.5 1.5c0 1.5 3 1.5 3 3 0 .8-.7 1.5-1.5 1.5s-1.5-.7-1.5-1.5" />
        </svg>
      )
    },
    {
      id: 'matriz_bcg_co',
      title: 'Matriz BCG',
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-[#0066c0] fill-none stroke-2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
          <path d="M22 12A10 10 0 0 0 12 2v10z" />
        </svg>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-[#f4f6f9] relative flex flex-col justify-between overflow-hidden px-6 md:px-12 py-5 select-none font-sans">
      
      {/* Fondo de Malla Geométrica Nielsen */}
      <svg className="absolute inset-0 w-full h-full opacity-15 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="network-mesh-bg-co" width="180" height="160" patternUnits="userSpaceOnUse">
            <circle cx="20" cy="30" r="2.5" fill="#004B93" />
            <circle cx="150" cy="130" r="2.5" fill="#004B93" />
            <circle cx="70" cy="140" r="2" fill="#00c0f3" />
            <circle cx="130" cy="40" r="2" fill="#00c0f3" />
            <line x1="20" y1="30" x2="130" y2="40" stroke="#94a3b8" strokeWidth="0.8" />
            <line x1="130" y1="40" x2="150" y2="130" stroke="#94a3b8" strokeWidth="0.8" />
            <line x1="150" y1="130" x2="70" y2="140" stroke="#94a3b8" strokeWidth="0.8" />
            <line x1="70" y1="140" x2="20" y2="30" stroke="#94a3b8" strokeWidth="0.8" />
            <line x1="20" y1="30" x2="150" y2="130" stroke="#cbd5e1" strokeWidth="0.6" strokeDasharray="3 3" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#network-mesh-bg-co)" />
      </svg>

      {/* CABECERA SUPERIOR: LOGO ELECTROLIT | LOGO NIELSEN */}
      <div className="flex items-center justify-between w-full max-w-6xl mx-auto z-10 px-2 pt-1">
        <div className="flex items-center">
          <img 
            src="/assets/LOGOS/Electrolit-color.png" 
            alt="Electrolit Logo" 
            className="h-10 md:h-12 object-contain" 
          />
        </div>

        <button
          onClick={onBackToMaster}
          title="Regresar a Portada Maestra de Países"
          className="group flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-200/50 transition-all cursor-pointer"
        >
          <img 
            src="/assets/LOGOS/Nielsen-logo.png" 
            alt="Nielsen Logo" 
            className="h-8 md:h-9 object-contain mix-blend-multiply group-hover:scale-105 transition-transform" 
          />
        </button>
      </div>

      {/* HERO CENTRAL: MEDALLÓN COLOMBIA + CORDILLERA + BOTELLA DE ELECTROLIT MARACUYÁ */}
      <div className="max-w-6xl w-full mx-auto my-auto z-10 py-1">
        <div className="relative flex items-center justify-center min-h-[300px]">
          
          {/* LADO IZQUIERDO: Medallón de Bandera de Colombia y Título */}
          <div className="absolute left-2 md:left-8 top-4 flex flex-col items-center text-center z-20">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white hover:scale-105 transition-transform duration-300 flex items-center justify-center">
              <img 
                src="/assets/Banderas/Colombia.png" 
                alt="Bandera Colombia" 
                className="w-full h-full object-cover" 
              />
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-[#0066c0] mt-3 tracking-tight">
              Colombia
            </h2>
          </div>

          {/* CENTRO: COMPOSICIÓN 3D CAFETERA + BOTELLA ELECTROLIT */}
          <div className="relative flex items-center justify-center w-full max-w-3xl min-h-[290px]">
            
            {/* Silueta Vectorial de Cordillera de los Andes / Nevados */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-80">
              <svg viewBox="0 0 600 280" className="w-full h-full max-w-[580px]" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M 10 180 Q 70 140 130 160 T 260 110 T 380 140 T 520 120 T 590 160" stroke="#d97706" strokeWidth="1.2" opacity="0.45" />
                <path d="M 40 190 Q 110 120 180 150 T 320 80 T 440 130 T 570 140" stroke="#b45309" strokeWidth="1.5" opacity="0.6" />
                <path d="M 90 240 L 140 190 L 165 205 L 180 150 L 210 100 L 225 110 L 240 70 L 260 120 L 280 140 L 310 180 L 330 200 L 360 220" stroke="#d97706" strokeWidth="2.2" opacity="0.8" />
              </svg>
            </div>

            <div className="flex items-center justify-center gap-6 md:gap-12 relative z-20">
              
              {/* LADO IZQUIERDO DE LA BOTELLA: TAZA DE CAFÉ, HOJAS Y PALMA 3D */}
              <div className="hidden sm:flex flex-col items-center gap-2 select-none group cursor-pointer">
                {/* Nevado / Cordillera */}
                <div className="w-24 h-12 relative flex items-center justify-center opacity-85">
                  <div className="text-3xl text-amber-600 filter drop-shadow-sm">🏔️</div>
                </div>

                {/* Taza de Café de Colombia & Hojas de Cafetal 3D */}
                <div className="w-28 h-28 relative flex flex-col items-center justify-center">
                  <div className="text-emerald-700 text-3xl absolute -bottom-1 -left-2 opacity-90 rotate-[-15deg] group-hover:rotate-0 transition-transform">
                    🌿
                  </div>
                  <div className="text-red-600 text-2xl absolute -bottom-1 -right-1 opacity-90">
                    🍒
                  </div>
                  <div className="text-amber-800 text-3xl absolute -top-2 right-1 opacity-80">
                    🌴
                  </div>
                  <div className="relative z-10 text-5xl md:text-6xl filter drop-shadow-[0_8px_12px_rgba(0,0,0,0.18)] transform group-hover:scale-110 transition-transform">
                    ☕
                  </div>
                </div>
              </div>

              {/* CENTRO: BOTELLA ELECTROLIT CON GOTAS */}
              <div className="relative flex flex-col items-center justify-center px-1">
                <div className="absolute inset-0 -m-8 pointer-events-none opacity-80">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 absolute top-4 left-4"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400 absolute top-10 right-2"></div>
                  <div className="w-2 h-2 rounded-full bg-blue-500 absolute bottom-12 left-2"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-300 absolute bottom-6 right-6"></div>
                </div>

                <div className="relative z-10 flex flex-col items-center justify-center cursor-pointer group">
                  <img 
                    src="/assets/botella_electrolit.png" 
                    alt="Electrolit Maracuyá" 
                    onError={(e) => {
                      e.target.src = "/assets/Botellas/ZA_230_CR-BOTELLA_ELECTROLIT_Maracuyá_FRONTAL.png";
                    }}
                    className="h-60 md:h-72 object-contain drop-shadow-2xl group-hover:scale-105 transition-all duration-300" 
                  />
                  <div className="w-32 h-4 bg-slate-500/25 rounded-full blur-md -mt-1 group-hover:w-36 transition-all" />
                </div>
              </div>

              {/* LADO DERECHO DE LA BOTELLA: ORQUÍDEA, MARIPOSA DE MACONDO Y TUCÁN 3D */}
              <div className="hidden sm:flex flex-col items-center gap-2 select-none group cursor-pointer">
                {/* Sol Caribeño */}
                <div className="w-24 h-12 relative flex items-center justify-center opacity-85">
                  <div className="text-3xl text-amber-500 filter drop-shadow-sm">☀️</div>
                </div>

                {/* Orquídea Cattleya Trianae & Mariposa Amarilla 3D */}
                <div className="w-28 h-28 relative flex flex-col items-center justify-center">
                  <div className="text-pink-500 text-3xl absolute -bottom-1 -left-2 opacity-90 filter drop-shadow-sm">
                    🌺
                  </div>
                  <div className="text-emerald-500 text-2xl absolute -top-2 -left-2 opacity-80">
                    🍃
                  </div>
                  <div className="text-blue-500 text-2xl absolute top-1 right-1 opacity-90">
                    🦜
                  </div>
                  <div className="relative z-10 text-5xl md:text-6xl filter drop-shadow-[0_8px_12px_rgba(0,0,0,0.18)] transform group-hover:scale-110 transition-transform">
                    🦋
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* BOTONES CAPSULARES (2 COLUMNAS) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-3.5 max-w-4xl mx-auto mt-4 px-2">
          
          {/* Columna 1 */}
          <div className="flex flex-col gap-3">
            {col1Buttons.map(btn => (
              <button
                key={btn.id}
                onClick={() => onNavigate(btn.id)}
                className="group relative flex items-center bg-[#004B93] hover:bg-[#003870] text-white rounded-full p-1 pr-6 shadow-md hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 border border-sky-400/20 text-left cursor-pointer"
              >
                <div className="w-13 h-13 md:w-14 md:h-14 -my-1 -ml-1 rounded-full bg-white text-[#0066c0] flex items-center justify-center shadow-lg border border-slate-100 group-hover:scale-105 transition-transform shrink-0 z-10">
                  {btn.icon}
                </div>
                <span className="ml-4 font-bold text-base md:text-lg tracking-normal text-white drop-shadow-xs">
                  {btn.title}
                </span>
              </button>
            ))}
          </div>

          {/* Columna 2 */}
          <div className="flex flex-col gap-3">
            {col2Buttons.map(btn => (
              <button
                key={btn.id}
                onClick={() => onNavigate(btn.id)}
                className="group relative flex items-center bg-[#004B93] hover:bg-[#003870] text-white rounded-full p-1 pr-6 shadow-md hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 border border-sky-400/20 text-left cursor-pointer"
              >
                <div className="w-13 h-13 md:w-14 md:h-14 -my-1 -ml-1 rounded-full bg-white text-[#0066c0] flex items-center justify-center shadow-lg border border-slate-100 group-hover:scale-105 transition-transform shrink-0 z-10">
                  {btn.icon}
                </div>
                <span className="ml-4 font-bold text-base md:text-lg tracking-normal text-white drop-shadow-xs">
                  {btn.title}
                </span>
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* PIE DE PORTADA */}
      <div className="max-w-5xl w-full mx-auto flex items-center justify-between text-[11px] text-slate-400 font-medium z-10 pt-2">
        <span>Laboratorios PiSA • Electrolit Colombia</span>
        <span>Fuente: BigQuery • psa-eltr-latam-pr.Nielsen</span>
      </div>

    </div>
  );
};

export default ColombiaPortadaView;
