import React from 'react';

const MasterPortalView = ({ onSelectCountry, onOpenSemanticModel }) => {
  const countries = [
    {
      id: 'CO',
      name: 'Colombia',
      flag: '/assets/Banderas/Colombia.png',
      enabled: false,
      status: 'Próximamente'
    },
    {
      id: 'PE',
      name: 'Perú',
      flag: '/assets/Banderas/Peru.png',
      enabled: false,
      status: 'Próximamente'
    },
    {
      id: 'GT',
      name: 'Guatemala',
      flag: '/assets/Banderas/Guatemala.png',
      enabled: true,
      status: 'Disponible'
    },
    {
      id: 'CR',
      name: 'Costa Rica',
      flag: '/assets/Banderas/Costa Rica.png',
      enabled: true,
      status: 'Disponible'
    }
  ];

  return (
    <div className="min-h-screen bg-[#f3f6f9] relative flex flex-col justify-between overflow-hidden px-6 md:px-12 py-8 select-none font-sans">
      
      {/* Fondo de Nodos y Redes Geométricas estilo Nielsen */}
      <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="portal-network-grid" width="100" height="100" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="1.5" fill="#004B93" opacity="0.3" />
            <circle cx="90" cy="90" r="1.5" fill="#004B93" opacity="0.3" />
            <circle cx="50" cy="50" r="2" fill="#00c0f3" opacity="0.4" />
            <path d="M 10 10 L 50 50 L 90 90 M 50 50 L 90 10 M 10 90 L 50 50" stroke="#004B93" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.15" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#portal-network-grid)" />
      </svg>

      {/* CABECERA SUPERIOR CENTRAL: LOGOS FAMILIA PISA (HIDRAVIDA, ELECTROLIT, ELECTROLIFE) & NIELSEN */}
      <div className="max-w-2xl mx-auto w-full flex flex-col items-center justify-center gap-2 md:gap-3 z-10 pt-4">
        <div className="flex items-center justify-center gap-5 sm:gap-8 md:gap-10">
          <img 
            src="/assets/LOGOS/Hidravida-color.png" 
            alt="Hidravida" 
            className="h-9 sm:h-12 md:h-14 object-contain drop-shadow-xs transition-transform duration-300 hover:scale-105" 
          />
          <img 
            src="/assets/LOGOS/Electrolit-color.png" 
            alt="Electrolit" 
            className="h-9 sm:h-12 md:h-14 object-contain drop-shadow-xs transition-transform duration-300 hover:scale-105" 
          />
          <img 
            src="/assets/LOGOS/Electrolife-color.png" 
            alt="Electrolife" 
            className="h-9 sm:h-12 md:h-14 object-contain drop-shadow-xs transition-transform duration-300 hover:scale-105" 
          />
        </div>
        <img 
          src="/assets/LOGOS/Nielsen-logo.png" 
          alt="Nielsen" 
          className="h-6 sm:h-7 md:h-8 object-contain mt-1 drop-shadow-xs" 
        />
      </div>

      {/* CUADRÍCULA 2X2 DE PAÍSES */}
      <div className="max-w-2xl w-full mx-auto my-auto z-10 py-8">
        <div className="grid grid-cols-2 gap-x-12 gap-y-12 md:gap-x-20 md:gap-y-14 justify-items-center items-center">
          {countries.map((c) => {
            const isClickable = c.enabled;
            return (
              <button
                key={c.id}
                onClick={() => isClickable && onSelectCountry(c.id)}
                disabled={!isClickable}
                className={`group flex flex-col items-center focus:outline-hidden transition-all duration-300 ${
                  isClickable 
                    ? 'cursor-pointer transform hover:-translate-y-2' 
                    : 'cursor-not-allowed opacity-75'
                }`}
              >
                {/* Medallón Circular de la Bandera */}
                <div className="relative">
                  <div className={`w-36 h-36 md:w-44 md:h-44 rounded-full bg-white p-2 md:p-2.5 shadow-xl transition-all duration-300 flex items-center justify-center border-4 ${
                    isClickable
                      ? 'border-white group-hover:border-[#0066c0] group-hover:shadow-2xl group-hover:scale-105'
                      : 'border-slate-100 grayscale-[40%]'
                  }`}>
                    <img 
                      src={c.flag} 
                      alt={c.name}
                      className="w-full h-full rounded-full object-cover shadow-inner"
                    />
                  </div>

                  {/* Badge de Próximamente si no está habilitado */}
                  {!isClickable && (
                    <span className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-slate-700/90 text-white text-[11px] font-bold px-3 py-0.5 rounded-full shadow-md whitespace-nowrap">
                      {c.status}
                    </span>
                  )}
                </div>

                {/* Nombre del País */}
                <span className={`mt-4 text-2xl md:text-3xl font-extrabold tracking-tight transition-colors ${
                  isClickable
                    ? 'text-[#004b93] group-hover:text-[#0066c0]'
                    : 'text-slate-500'
                }`}>
                  {c.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* PIE DE PORTADA MAESTRA CON ACCESO AL MODELO SEMÁNTICO */}
      <div className="max-w-5xl w-full mx-auto flex items-center justify-between text-xs text-slate-400 font-medium z-10 pt-4 border-t border-slate-200/60">
        <span>Laboratorios PiSA • LATAM Analytics Hub</span>
        
        {/* BOTÓN DISCRETO AL MODELO SEMÁNTICO */}
        <button
          onClick={onOpenSemanticModel}
          title="Ver Arquitectura y Modelo Semántico de Datos"
          className="group hover:text-[#0066c0] transition-colors cursor-pointer flex items-center gap-1.5 px-2.5 py-1 rounded-md hover:bg-slate-200/50"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 group-hover:scale-125 transition-transform"></span>
          <span>Modelo semántico • Antigravity</span>
        </button>

        <span>Fuente: BigQuery • psa-eltr-latam-pr.Nielsen</span>
      </div>

    </div>
  );
};

export default MasterPortalView;
