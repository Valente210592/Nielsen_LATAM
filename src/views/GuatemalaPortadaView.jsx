import React from 'react';

const GuatemalaPortadaView = ({ onNavigate, onBackToMaster }) => {
  const buttonsCol1 = [
    {
      id: 'overview_gt',
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
      id: 'marca_gt',
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
      id: 'canal_gt',
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
      id: 'matriz_kpis_gt',
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
      id: 'matriz_regiones_gt',
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
      id: 'growth_drivers_gt',
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
      id: 'marca_canal_gt',
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
      id: 'mapa_gt',
      title: 'Guatemala',
      icon: (
        <svg viewBox="0 0 50 50" className="w-9 h-9 md:w-10 md:h-10 stroke-[#0066c0] fill-none stroke-[2.2]" strokeLinecap="round" strokeLinejoin="round">
          {/* Silueta Geográfica Fiel de Guatemala */}
          <path d="
            M 19 8 
            L 34 8 
            L 34 24 
            L 37 24 
            L 41 26 
            L 38 29 
            L 34 35 
            L 32 38 
            L 29 40 
            L 26 43 
            L 17 41 
            L 11 36 
            L 11 30 
            L 12 28 
            L 14 23 
            L 24 23 
            L 25 21 
            L 23 18 
            L 18 15 
            L 15 13 
            L 18 13 
            L 19 8 
            Z" 
            strokeWidth="2.2" 
            fill="rgba(0, 102, 192, 0.04)"
          />
        </svg>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-[#f3f6f9] relative flex flex-col justify-between overflow-hidden px-6 md:px-12 py-6 select-none font-sans">
      
      {/* Fondo de Nodos y Redes Geométricas estilo Nielsen (Idéntico a Costa Rica) */}
      <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="network-mesh-bg-gt" width="180" height="160" patternUnits="userSpaceOnUse">
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
        <rect width="100%" height="100%" fill="url(#network-mesh-bg-gt)" />
      </svg>

      {/* CABECERA SUPERIOR: LOGO HIDRAVIDA | LOGO NIELSEN */}
      <div className="flex items-center justify-between w-full max-w-5xl mx-auto z-10 px-2">
        <div className="flex items-center justify-center w-28 md:w-32">
          <img 
            src="/assets/LOGOS/Hidravida-color.png" 
            alt="Hidravida Logo" 
            className="h-10 md:h-12 object-contain"
            onError={(e) => {
              e.target.src = "/assets/LOGOS/Electrolit-color.png";
            }}
          />
        </div>

        {/* Logo Nielsen interactivo para regresar a la Portada Maestra */}
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

      {/* COMPOSICIÓN ARTÍSTICA CENTRAL GUATEMALA */}
      <div className="max-w-5xl w-full mx-auto my-auto z-10 py-2">
        <div className="relative flex flex-col items-center justify-center min-h-[290px]">
          
          {/* LADO IZQUIERDO: Bandera Guatemala y Título Centrados */}
          <div className="absolute left-0 top-0 w-28 md:w-32 flex flex-col items-center text-center z-20">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white hover:scale-105 transition-transform duration-300 flex items-center justify-center">
              <img 
                src="/assets/Banderas/Guatemala.png" 
                alt="Bandera Guatemala" 
                className="w-full h-full object-cover"
              />
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-[#0066c0] mt-3 tracking-tight text-center whitespace-nowrap">
              Guatemala
            </h2>
          </div>

          {/* CENTRO: ILUSTRACIÓN DE NATURALEZA Y BOTELLA DE HIDRAVIDA */}
          <div className="flex items-center justify-center gap-6 md:gap-12 relative">
            
            {/* LADO IZQUIERDO DE LA BOTELLA: ARCO DE SANTA CATALINA & QUETZAL / CAFÉ */}
            <div className="flex flex-col items-center gap-3 select-none">
              
              {/* Arco de Santa Catalina (Antigua Guatemala) Vectorial */}
              <div className="w-28 h-16 relative flex items-center justify-center opacity-90">
                <svg viewBox="0 0 120 70" className="w-full h-full stroke-amber-600 fill-none stroke-[2]" strokeLinecap="round" strokeLinejoin="round">
                  {/* Fachada del Arco */}
                  <rect x="25" y="15" width="70" height="20" fill="rgba(245, 158, 11, 0.08)" stroke="#d97706" strokeWidth="2" />
                  {/* Torre del Reloj */}
                  <rect x="48" y="2" width="24" height="14" fill="rgba(245, 158, 11, 0.15)" stroke="#d97706" strokeWidth="1.8" />
                  <circle cx="60" cy="9" r="3.5" stroke="#d97706" strokeWidth="1.2" />
                  {/* Pilares y Arco Abovedado */}
                  <rect x="25" y="35" width="16" height="30" stroke="#d97706" strokeWidth="2" />
                  <rect x="79" y="35" width="16" height="30" stroke="#d97706" strokeWidth="2" />
                  <path d="M 41 65 L 41 45 Q 60 30 79 45 L 79 65" stroke="#d97706" strokeWidth="2.2" />
                </svg>
              </div>

              {/* Venadito de Cola Blanca y Ramita de Naturaleza */}
              <div className="w-28 h-32 relative flex flex-col items-center justify-center">
                <div className="relative group cursor-pointer">
                  <div className="text-emerald-700 text-4xl absolute -bottom-2 -left-3 opacity-90 rotate-[-15deg]">🌿</div>
                  <div className="text-red-600 text-2xl absolute -bottom-1 -right-1 opacity-90 animate-pulse">🍒</div>
                  <div className="relative z-10 text-5xl md:text-6xl filter drop-shadow-md transform hover:scale-110 transition-transform select-none">
                    🦌
                  </div>
                </div>
              </div>
            </div>

            {/* CENTRO: BOTELLA HIDRAVIDA CON GOTAS Y REFLEJO */}
            <div className="relative flex flex-col items-center justify-center z-10 px-2">
              <div className="absolute inset-0 -m-8 pointer-events-none opacity-80">
                <div className="w-2 h-2 rounded-full bg-cyan-400 absolute top-4 left-6 animate-ping"></div>
                <div className="w-3 h-3 rounded-full bg-blue-400 absolute top-12 right-4"></div>
                <div className="w-2 h-2 rounded-full bg-purple-400 absolute bottom-14 left-4"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 absolute bottom-8 right-8"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 absolute top-20 left-2"></div>
              </div>

              <div className="relative group cursor-pointer transform hover:scale-105 transition-all duration-300">
                <img 
                  src="/assets/Botellas/Guatemala/Hidravida_Uva_Portada.png" 
                  alt="Botella Hidravida Uva Oficial" 
                  className="h-64 md:h-72 object-contain filter drop-shadow-2xl"
                  onError={(e) => {
                    e.target.src = "/assets/Botellas/Guatemala/DG ZA_230_GU-BOTELLA_HIDRAVIDA_UVA_FRONTAL.png";
                  }}
                />
                <div className="w-28 h-4 bg-slate-400/30 rounded-full blur-sm mx-auto -mt-2"></div>
              </div>
            </div>

            {/* LADO DERECHO DE LA BOTELLA: VOLCANES Y TEMPLO MAYA */}
            <div className="flex flex-col items-center gap-3 select-none">
              
              {/* Volcán de Agua y Fuego Vectorial */}
              <div className="w-32 h-16 relative flex items-center justify-center opacity-90">
                <svg viewBox="0 0 130 70" className="w-full h-full stroke-purple-600 fill-none stroke-[2.2]" strokeLinecap="round">
                  {/* Nube sobre el cráter */}
                  <path d="M 55 12 Q 70 6 85 12 Q 95 18 85 22 Q 70 22 55 16 Z" strokeWidth="1.2" className="stroke-slate-400 fill-white/40" />
                  {/* Silueta Volcán Principal */}
                  <path d="M 15 62 L 58 20 L 72 20 L 115 62" stroke="#6b21a8" strokeWidth="2.2" />
                  {/* Volcán Secundario */}
                  <path d="M 35 62 L 68 32 L 102 62" strokeWidth="1.4" className="stroke-purple-400" />
                </svg>
              </div>

              {/* Templo Maya de Tikal / Selva */}
              <div className="w-32 h-32 relative flex flex-col items-center justify-center">
                <div className="relative flex flex-col items-center justify-center group">
                  <div className="text-emerald-600 text-5xl absolute -top-4 -left-2 opacity-80">🍃</div>
                  <div className="text-emerald-500 text-5xl absolute -bottom-2 -right-3 opacity-90">🌱</div>
                  <div className="relative z-10 text-5xl md:text-6xl filter drop-shadow-md transform hover:scale-110 transition-transform">
                    🏛️
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
        <span>Laboratorios PiSA • Hidravida Guatemala</span>
        <span>Fuente: BigQuery • psa-eltr-latam-pr.Nielsen</span>
      </div>

    </div>
  );
};

export default GuatemalaPortadaView;
