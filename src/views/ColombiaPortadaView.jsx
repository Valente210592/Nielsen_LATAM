import React, { useState } from 'react';
import { Home, HelpCircle, Construction, ArrowLeft, X } from 'lucide-react';

const ColombiaPortadaView = ({ onNavigate, onBackToMaster }) => {
  const [showHelp, setShowHelp] = useState(false);
  const [devModalItem, setDevModalItem] = useState(null);

  const menuItems = [
    { id: 'overview_co', label: 'Overview', active: true },
    { id: 'marca_x_canales_co', label: 'Marca x Canales', active: true },
    { id: 'canales_x_marca_co', label: 'Canales x Marca', active: true },
    { id: 'matriz_kpis_co', label: 'Matriz KPI´s', active: true },
    { id: 'matriz_kpis_reg_co', label: 'Matriz KPI´s Reg.', active: true },
    { id: 'growth_drivers_co', label: 'Growth Drivers', active: false },
    { id: 'marcas_canales_co', label: 'Marcas - Canales', active: false },
    { id: 'matriz_bcg_co', label: 'Matriz BCG', active: false },
    { id: 'colombia_total_co', label: 'Colombia', active: false },
    { id: 'droguerias_co', label: 'Droguerias', active: false },
    { id: 'super_cadena_co', label: 'Super Cadena', active: false },
    { id: 'superetes_co', label: 'Superetes', active: false },
    { id: 'tradicional_co', label: 'Tradicional', active: false },
  ];

  const handleItemClick = (item) => {
    if (item.active) {
      onNavigate(item.id);
    } else {
      setDevModalItem(item);
    }
  };

  return (
    <div className="min-h-screen bg-white relative flex flex-col justify-between overflow-hidden font-sans select-none">
      
      {/* 1. BARRA SUPERIOR (HEADER) */}
      <header className="w-full px-6 md:px-10 py-3 flex items-center justify-between border-b border-slate-100/80 bg-white z-20">
        
        {/* LOGO ELECTROLIT */}
        <div className="flex items-center">
          <img 
            src="/assets/LOGOS/Electrolit-color.png" 
            alt="Electrolit" 
            className="h-10 md:h-12 object-contain"
          />
        </div>

        {/* LOGO NIELSEN */}
        <div className="flex items-center">
          <img 
            src="/assets/LOGOS/Nielsen-logo.png" 
            alt="Nielsen" 
            className="h-7 md:h-8 object-contain"
          />
        </div>

        {/* BOTÓN HOME (REGRESAR A PORTAL LATAM) */}
        <button
          onClick={onBackToMaster}
          title="Regresar a Portada Multipaís LATAM"
          className="p-2 text-[#0066c0] hover:text-[#004b93] hover:bg-blue-50 rounded-xl transition-all cursor-pointer group"
        >
          <Home className="w-7 h-7 stroke-[1.8] group-hover:scale-110 transition-transform" />
        </button>
      </header>

      {/* 2. CUERPO PRINCIPAL DE LA PORTADA */}
      <main className="flex-1 w-full max-w-7xl mx-auto relative flex items-center px-4 md:px-8 py-2">
        
        {/* CONTENEDOR DE DOS COLUMNAS: BANDERA COLOMBIA A LA IZQUIERDA Y BOTONES A LA DERECHA */}
        <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-2 items-center relative">
          
          {/* LADO IZQUIERDO: MEDALLÓN BANDERA DE COLOMBIA EN 3D */}
          <div className="md:col-span-5 relative flex items-center justify-center md:justify-start -ml-4 md:-ml-8 overflow-visible">
            
            <div className="relative w-[340px] h-[340px] sm:w-[420px] sm:h-[420px] md:w-[480px] md:h-[480px] lg:w-[540px] lg:h-[540px] rounded-full border-4 border-slate-200/80 shadow-[0_20px_50px_rgba(0,0,0,0.25)] overflow-hidden flex flex-col items-center justify-center transform transition-transform hover:scale-[1.01]">
              
              {/* FRANJA AMARILLA (50% de la bandera) */}
              <div className="w-full h-1/2 bg-[#FCD116] relative flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/5" />
              </div>

              {/* FRANJA AZUL (25% de la bandera) */}
              <div className="w-full h-1/4 bg-[#003893] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/10" />
              </div>

              {/* FRANJA ROJA (25% de la bandera) */}
              <div className="w-full h-1/4 bg-[#CE1126] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
              </div>

              {/* Silueta / Mapa estilizado de Colombia superpuesto */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <svg viewBox="0 0 500 500" className="w-3/4 h-3/4 opacity-30 drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
                  <path 
                    d="M 230 140 Q 270 135 300 160 Q 320 200 300 250 Q 260 300 230 360 Q 200 320 180 260 Q 185 200 230 140 Z" 
                    fill="#ffffff" 
                    stroke="#ffffff" 
                    strokeWidth="3"
                  />
                </svg>
              </div>

              {/* Efecto de curvatura 3D, esfera y brillo de cristal */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-black/25 via-transparent to-white/40 pointer-events-none border border-white/40" />
              <div className="absolute top-4 left-8 w-1/3 h-1/3 bg-white/30 rounded-full blur-xl pointer-events-none" />
            </div>
          </div>

          {/* LADO DERECHO: 13 BOTONES / PÍLDORAS AZULES */}
          <div className="md:col-span-7 flex flex-col items-center md:items-start justify-center gap-1.5 sm:gap-2 z-10 w-full pl-0 md:pl-2">
            {menuItems.map((item, index) => {
              const widthClasses = [
                'w-[280px] sm:w-[320px] md:w-[350px]', // Overview
                'w-[300px] sm:w-[350px] md:w-[380px]', // Marca x Canales
                'w-[320px] sm:w-[370px] md:w-[410px]', // Canales x Marca
                'w-[340px] sm:w-[390px] md:w-[430px]', // Matriz KPI's
                'w-[360px] sm:w-[410px] md:w-[450px]', // Matriz KPI's Reg.
                'w-[380px] sm:w-[430px] md:w-[480px]', // Growth Drivers
                'w-[400px] sm:w-[460px] md:w-[500px]', // Marcas - Canales
                'w-[380px] sm:w-[430px] md:w-[480px]', // Matriz BCG
                'w-[360px] sm:w-[410px] md:w-[450px]', // Colombia
                'w-[340px] sm:w-[390px] md:w-[430px]', // Droguerias
                'w-[320px] sm:w-[370px] md:w-[410px]', // Super Cadena
                'w-[300px] sm:w-[350px] md:w-[380px]', // Superetes
                'w-[280px] sm:w-[320px] md:w-[350px]', // Tradicional
              ];

              const btnWidth = widthClasses[index] || 'w-[320px]';

              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`group relative h-9 sm:h-10 ${btnWidth} ${
                    item.active
                      ? 'bg-gradient-to-r from-[#00529B] via-[#0066c0] to-[#0077d9] text-white shadow-[0_4px_10px_rgba(0,82,155,0.35)] hover:shadow-[0_6px_16px_rgba(0,82,155,0.5)] border-blue-400/30 hover:border-white transform hover:-translate-y-0.5 hover:scale-[1.02]'
                      : 'bg-gradient-to-r from-slate-400 via-slate-500 to-slate-600 text-slate-100 shadow-sm opacity-85 hover:opacity-100 border-slate-300/30 hover:border-amber-300 hover:text-white'
                  } font-extrabold text-xs sm:text-sm md:text-base rounded-full border transition-all duration-200 flex items-center justify-center cursor-pointer`}
                >
                  {/* Brillo superior en la píldora */}
                  <div className="absolute top-0 inset-x-4 h-1/2 bg-white/15 rounded-t-full pointer-events-none"></div>

                  {/* Texto centrado */}
                  <span className="relative z-10 tracking-wide text-shadow-xs drop-shadow-xs flex items-center gap-2">
                    {item.label}
                    {!item.active && (
                      <span className="text-[10px] bg-slate-700/60 text-amber-200 px-2 py-0.5 rounded-full font-normal">
                        Próximamente
                      </span>
                    )}
                  </span>

                  {/* Indicador de Activo */}
                  {item.active && (
                    <span className="absolute right-3 w-2 h-2 rounded-full bg-cyan-300 animate-ping"></span>
                  )}
                </button>
              );
            })}
          </div>

        </div>

      </main>

      {/* 3. MODAL DE "EN DESARROLLO" */}
      {devModalItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-center relative space-y-4">
            <button
              onClick={() => setDevModalItem(null)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Construction className="w-9 h-9 stroke-[2]" />
            </div>

            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                Módulo en Construcción
              </span>
              <h3 className="text-xl font-black text-[#00529B] mt-2">
                {devModalItem.label}
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Esta sección está siendo estructurada con base en las especificaciones y datos de Nielsen Colombia.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setDevModalItem(null)}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-[#00529B] to-[#0077d9] text-white rounded-xl text-xs font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Regresar a la Portada
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. PIE DE PÁGINA CON BOTÓN DE AYUDA (?) */}
      <footer className="w-full px-6 md:px-10 py-3 flex items-center justify-between text-xs text-slate-400 z-20 border-t border-slate-100/80 bg-white">
        <span className="font-medium text-slate-500">
          Laboratorios PiSA • Nielsen Retail Index Colombia
        </span>

        {/* BOTÓN (?) */}
        <div className="relative">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="text-[#0066c0] hover:text-[#004b93] hover:bg-blue-50 p-1.5 rounded-full transition-all cursor-pointer"
            title="Información y Ayuda del Dashboard"
          >
            <HelpCircle className="w-6 h-6 stroke-[1.8]" />
          </button>

          {/* Modal / Popover de Información */}
          {showHelp && (
            <div className="absolute right-0 bottom-10 w-72 bg-white border border-slate-200 shadow-2xl rounded-2xl p-4 text-left z-30 animate-in fade-in slide-in-from-bottom-2">
              <h4 className="text-sm font-bold text-slate-800 mb-1">Guía de Navegación</h4>
              <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                Haz clic en <strong>Overview</strong> o <strong>Marca x Canales</strong> para explorar los módulos analíticos activos de Nielsen Colombia.
              </p>
              <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-2 flex justify-between">
                <span>Puerto: 3001</span>
                <span>Fuente: BigQuery</span>
              </div>
            </div>
          )}
        </div>
      </footer>

    </div>
  );
};

export default ColombiaPortadaView;
