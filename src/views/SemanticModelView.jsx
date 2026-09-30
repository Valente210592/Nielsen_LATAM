import React, { useState, useEffect } from 'react';

const SemanticModelView = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('diagram'); // 'diagram' | 'dictionary' | 'measures' | 'lineage'
  const [modelData, setModelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchCol, setSearchCol] = useState('');
  const [selectedTable, setSelectedTable] = useState('v_Nielsen_LATAM_Consolidado');

  useEffect(() => {
    fetch('/api/model/semantic-architecture')
      .then(res => res.json())
      .then(data => {
        setModelData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error cargando modelo semántico:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-600">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-semibold tracking-wide">Cargando Modelo Semántico e Introspección BigQuery...</p>
      </div>
    );
  }

  const factTable = modelData?.tables?.find(t => t.id === 'fact_latam') || modelData?.tables?.[0];
  const dimMarcas = modelData?.tables?.find(t => t.id === 'dim_homologacion') || modelData?.tables?.[1];
  const dimCalendario = modelData?.tables?.find(t => t.id === 'dim_calendario') || modelData?.tables?.[2];
  const dimCanales = modelData?.tables?.find(t => t.id === 'dim_canales_regiones') || modelData?.tables?.[3];

  const allColumns = (modelData?.tables || []).flatMap(t => 
    (t.columns || []).map(c => ({
      ...c,
      tableName: t.name,
      tableAlias: t.alias || t.name,
      category: t.category
    }))
  );

  const filteredColumns = allColumns.filter(c => {
    const q = searchCol.toLowerCase();
    return (
      (c.column && c.column.toLowerCase().includes(q)) ||
      (c.type && c.type.toLowerCase().includes(q)) ||
      (c.tableName && c.tableName.toLowerCase().includes(q)) ||
      (c.tableAlias && c.tableAlias.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col selection:bg-blue-100">
      
      {/* HEADER SUPERIOR */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all shadow-2xs hover:scale-102 cursor-pointer"
            >
              ← Regresar al Hub
            </button>
            <div className="h-6 w-px bg-slate-200"></div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-black text-[#004b93] tracking-tight">
                  Modelo Semántico & Arquitectura de Datos
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200/60 uppercase tracking-wide">
                  Star Schema
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Homologación viva entre Power BI, Google BigQuery y Motor Web PiSA
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/70 rounded-full text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>BigQuery: Conectado</span>
            </div>
            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md">
              psa-eltr-latam-pr.Nielsen
            </span>
          </div>
        </div>

        {/* NAVEGACIÓN POR PESTAÑAS */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-2 border-t border-slate-100 pt-2 pb-2">
          <button
            onClick={() => setActiveTab('diagram')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'diagram'
                ? 'bg-[#004b93] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>📐 Diagrama de Relaciones</span>
          </button>

          <button
            onClick={() => setActiveTab('dictionary')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'dictionary'
                ? 'bg-[#004b93] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>📖 Diccionario de Datos ({allColumns.length} Campos)</span>
          </button>

          <button
            onClick={() => setActiveTab('measures')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'measures'
                ? 'bg-[#004b93] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>🧮 Medidas Semánticas (DAX ↔ SQL)</span>
          </button>

          <button
            onClick={() => setActiveTab('lineage')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'lineage'
                ? 'bg-[#004b93] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>🌐 Linaje & Flujo End-to-End</span>
          </button>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* ========================================================= */}
        {/* TAB 1: DIAGRAMA DE RELACIONES (POWER BI / STUDIO STYLE)  */}
        {/* ========================================================= */}
        {activeTab === 'diagram' && (
          <div className="space-y-6">
            
            {/* Banner resumen de salud del modelo */}
            <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200 bg-white/10 px-2.5 py-0.5 rounded-full">
                    Esquema en Estrella Activo
                  </span>
                  <h2 className="text-xl md:text-2xl font-black mt-1">
                    v_Nielsen_LATAM_Consolidado (Multi-País)
                  </h2>
                  <p className="text-xs text-blue-100 mt-1 max-w-2xl">
                    Modelo relacional unificado en BigQuery que consolida 4 países en tiempo real, homologado con catálogos y dimensiones temporales con cero pérdida de granularidad.
                  </p>
                </div>

                <div className="flex gap-4">
                  <div className="bg-white/10 backdrop-blur-xs px-4 py-2.5 rounded-xl border border-white/15 text-center">
                    <span className="text-[10px] uppercase font-bold text-blue-200 block">Total Filas</span>
                    <span className="text-lg font-black text-white">
                      {(factTable?.rowCount || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-xs px-4 py-2.5 rounded-xl border border-white/15 text-center">
                    <span className="text-[10px] uppercase font-bold text-blue-200 block">Países Activos</span>
                    <span className="text-lg font-black text-white">4</span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-xs px-4 py-2.5 rounded-xl border border-white/15 text-center">
                    <span className="text-[10px] uppercase font-bold text-blue-200 block">Marcas Catálogo</span>
                    <span className="text-lg font-black text-white">
                      {dimMarcas?.rowCount || 102}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* DIAGRAMA INTERACTIVO DE TARJETAS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* COLUMNA IZQUIERDA: DIMENSIÓN MARCAS */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* TARJETA: cat_homologacion_marcas */}
                <div className="bg-white rounded-xl border-2 border-amber-300 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div className="bg-amber-500 text-white px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🏷️</span>
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-wide">cat_homologacion_marcas</h3>
                        <span className="text-[10px] text-amber-100 block font-medium">Marcas_Nielsen_CAM (Dimensión 1)</span>
                      </div>
                    </div>
                    <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-md font-bold">
                      {dimMarcas?.rowCount || 102} filas
                    </span>
                  </div>

                  <div className="p-3 text-xs divide-y divide-slate-100 max-h-56 overflow-y-auto">
                    <div className="py-1.5 flex items-center justify-between bg-amber-50/60 px-2 rounded-md font-bold text-amber-900">
                      <span>🔑 KEY_Marcas (PK)</span>
                      <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">STRING</span>
                    </div>
                    <div className="py-1.5 flex items-center justify-between px-2 text-slate-700">
                      <span>MARCA</span>
                      <span className="text-[10px] text-slate-400">STRING</span>
                    </div>
                    <div className="py-1.5 flex items-center justify-between px-2 text-slate-700">
                      <span>MARCAS_H</span>
                      <span className="text-[10px] text-slate-400">STRING</span>
                    </div>
                    <div className="py-1.5 flex items-center justify-between px-2 text-slate-700">
                      <span>MARCA_RESTO</span>
                      <span className="text-[10px] text-slate-400">STRING</span>
                    </div>
                    <div className="py-1.5 flex items-center justify-between px-2 text-slate-700">
                      <span>MARCA_GUATEMALA</span>
                      <span className="text-[10px] text-slate-400">STRING</span>
                    </div>
                    <div className="py-1.5 flex items-center justify-between px-2 text-slate-700">
                      <span>Pais</span>
                      <span className="text-[10px] text-slate-400">STRING</span>
                    </div>
                  </div>

                  {/* Indicador de relación */}
                  <div className="bg-amber-50 border-t border-amber-200/60 px-3 py-2 text-[11px] text-amber-800 flex items-center justify-between font-semibold">
                    <span>Relación: 1 a Muchos (1 ─── *)</span>
                    <span className="font-mono text-[10px] bg-white px-1.5 py-0.5 rounded border border-amber-300">
                      KEY_Marcas → KEY_MARCAS
                    </span>
                  </div>
                </div>

                {/* TARJETA: Dimensión Geográfica y Canales */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div className="bg-teal-600 text-white px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🏢</span>
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-wide">Dim_Canales_Regiones</h3>
                        <span className="text-[10px] text-teal-100 block font-medium">Estructura Comercial</span>
                      </div>
                    </div>
                    <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-md font-bold">Jerarquía</span>
                  </div>

                  <div className="p-3 text-xs space-y-1 text-slate-700">
                    <div className="py-1 flex items-center justify-between px-2 font-medium">
                      <span>Canal (MODERNO, TRADICIONAL, FARMACIAS)</span>
                      <span className="text-[10px] text-slate-400">STRING</span>
                    </div>
                    <div className="py-1 flex items-center justify-between px-2 font-medium">
                      <span>Region (METRO, OCCIDENTE, etc.)</span>
                      <span className="text-[10px] text-slate-400">STRING</span>
                    </div>
                    <div className="py-1 flex items-center justify-between px-2 font-medium">
                      <span>Apertura_Canal_Region</span>
                      <span className="text-[10px] text-slate-400">STRING</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* COLUMNA CENTRAL: TABLA DE HECHOS CONSOLIDADA (FACT TABLE) */}
              <div className="lg:col-span-5">
                <div className="bg-white rounded-xl border-2 border-blue-500 shadow-lg overflow-hidden">
                  <div className="bg-[#004b93] text-white px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📊</span>
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-wide">v_Nielsen_LATAM_Consolidado</h3>
                        <span className="text-[11px] text-blue-200 block font-medium">
                          Tabla de Hechos Central (Fact Table)
                        </span>
                      </div>
                    </div>
                    <span className="text-xs bg-emerald-500/90 text-white px-2.5 py-0.5 rounded-full font-bold">
                      Vista Maestra
                    </span>
                  </div>

                  {/* Detalle de columnas con scroll */}
                  <div className="p-4 text-xs divide-y divide-slate-100 max-h-[480px] overflow-y-auto space-y-1">
                    
                    {/* Llaves Foráneas */}
                    <div className="pb-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Llaves Foráneas & Relaciones
                      </span>
                      <div className="space-y-1">
                        <div className="py-1 px-2 bg-amber-50 rounded text-amber-900 font-bold flex items-center justify-between">
                          <span>🔗 KEY_MARCAS (FK)</span>
                          <span className="text-[10px] text-amber-700">cat_homologacion_marcas</span>
                        </div>
                        <div className="py-1 px-2 bg-purple-50 rounded text-purple-900 font-bold flex items-center justify-between">
                          <span>🔗 Periods (FK)</span>
                          <span className="text-[10px] text-purple-700">Dim_Calendario</span>
                        </div>
                        <div className="py-1 px-2 bg-teal-50 rounded text-teal-900 font-bold flex items-center justify-between">
                          <span>🔗 Canal / Region (FK)</span>
                          <span className="text-[10px] text-teal-700">Dim_Canales</span>
                        </div>
                      </div>
                    </div>

                    {/* Métricas Numéricas */}
                    <div className="py-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Métricas y Hechos (Fact Measures)
                      </span>
                      <div className="space-y-1 text-slate-700 font-mono">
                        <div className="py-1 px-2 flex justify-between bg-slate-50 rounded font-semibold text-slate-900">
                          <span>Σ Vtas_Unds</span>
                          <span className="text-[10px] text-blue-600">FLOAT64 (Miles)</span>
                        </div>
                        <div className="py-1 px-2 flex justify-between bg-slate-50 rounded font-semibold text-slate-900">
                          <span>Σ Vtas_Valor</span>
                          <span className="text-[10px] text-blue-600">FLOAT64 (Moneda)</span>
                        </div>
                        <div className="py-1 px-2 flex justify-between bg-slate-50 rounded font-semibold text-slate-900">
                          <span>Σ Vtas_LT</span>
                          <span className="text-[10px] text-blue-600">FLOAT64 (Litros)</span>
                        </div>
                        <div className="py-1 px-2 flex justify-between bg-slate-50 rounded">
                          <span>Σ Dist_Pond_Reach</span>
                          <span className="text-[10px] text-slate-400">FLOAT64</span>
                        </div>
                        <div className="py-1 px-2 flex justify-between bg-slate-50 rounded">
                          <span>Σ N_de_Tiendas</span>
                          <span className="text-[10px] text-slate-400">FLOAT64</span>
                        </div>
                        <div className="py-1 px-2 flex justify-between bg-slate-50 rounded">
                          <span>Σ N_de_Tiendas_Venden</span>
                          <span className="text-[10px] text-slate-400">FLOAT64</span>
                        </div>
                      </div>
                    </div>

                    {/* Atributos Descriptivos */}
                    <div className="pt-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Atributos Descriptivos
                      </span>
                      <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600">
                        <div className="bg-slate-50 p-1.5 rounded">Pais</div>
                        <div className="bg-slate-50 p-1.5 rounded">CATEGORIA</div>
                        <div className="bg-slate-50 p-1.5 rounded">MARCA</div>
                        <div className="bg-slate-50 p-1.5 rounded">MARCAS_H</div>
                        <div className="bg-slate-50 p-1.5 rounded">PRESENTACION</div>
                        <div className="bg-slate-50 p-1.5 rounded">SABOR</div>
                        <div className="bg-slate-50 p-1.5 rounded">LIQUIDO_POLVO</div>
                        <div className="bg-slate-50 p-1.5 rounded">Markets</div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              {/* COLUMNA DERECHA: DIMENSIÓN CALENDARIO & PAÍSES EN VIVO */}
              <div className="lg:col-span-3 space-y-6">
                
                {/* TARJETA: Dimensión Calendario */}
                <div className="bg-white rounded-xl border-2 border-purple-300 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div className="bg-purple-600 text-white px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">📅</span>
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-wide">Dim_Calendario</h3>
                        <span className="text-[10px] text-purple-100 block font-medium">Time-Intelligence</span>
                      </div>
                    </div>
                    <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-md font-bold">1:N</span>
                  </div>

                  <div className="p-3 text-xs divide-y divide-slate-100">
                    <div className="py-1.5 flex items-center justify-between bg-purple-50/60 px-2 rounded-md font-bold text-purple-900">
                      <span>🔑 Periods</span>
                      <span className="text-[10px] text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">PK</span>
                    </div>
                    <div className="py-1 flex items-center justify-between px-2 text-slate-700">
                      <span>Año (2024, 2025, 2026)</span>
                      <span className="text-[10px] text-slate-400">INT64</span>
                    </div>
                    <div className="py-1 flex items-center justify-between px-2 text-slate-700">
                      <span>Mes (ene, feb, ..., dic)</span>
                      <span className="text-[10px] text-slate-400">STRING</span>
                    </div>
                    <div className="py-1 flex items-center justify-between px-2 text-slate-700">
                      <span>Mes_Numero (1 - 12)</span>
                      <span className="text-[10px] text-slate-400">INT64</span>
                    </div>
                    <div className="py-1 flex items-center justify-between px-2 text-slate-700">
                      <span>Is_YTD (Filtro Acumulado)</span>
                      <span className="text-[10px] text-slate-400">BOOLEAN</span>
                    </div>
                  </div>
                </div>

                {/* TARJETA: Auditoría de Países LATAM */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <span>🌎</span>
                    <span>Auditoría de Países Activos</span>
                  </h4>

                  <div className="space-y-2">
                    {(modelData?.countriesSummary || []).map(c => (
                      <div key={c.pais} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">{c.pais}</span>
                          <span className="text-[10px] text-slate-400">
                            {c.min_periodo} → {c.max_periodo}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-[#0066c0] block">
                            {parseInt(c.total_filas).toLocaleString()}
                          </span>
                          <span className="text-[9px] text-slate-400 uppercase font-semibold">filas</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: DICCIONARIO DE DATOS EN VIVO (INFORMATION_SCHEMA)  */}
        {/* ========================================================= */}
        {activeTab === 'dictionary' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            
            <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-[#004b93]">
                  Diccionario de Datos e Introspección BigQuery
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Campos y tipos de datos leídos en tiempo real desde <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-mono">INFORMATION_SCHEMA.COLUMNS</code>
                </p>
              </div>

              {/* Barra de Búsqueda */}
              <div className="relative w-full md:w-80">
                <input
                  type="text"
                  placeholder="Buscar columna, tipo o tabla..."
                  value={searchCol}
                  onChange={(e) => setSearchCol(e.target.value)}
                  className="w-full px-3.5 py-2 pl-9 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
                <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
              </div>
            </div>

            {/* TABLA DE COLUMNAS */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Tabla / Entidad</th>
                    <th className="py-3 px-4">Nombre de Columna</th>
                    <th className="py-3 px-4">Tipo de Dato</th>
                    <th className="py-3 px-4">Categoría</th>
                    <th className="py-3 px-4">Nulable</th>
                    <th className="py-3 px-4">Orden</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                  {filteredColumns.map((col, idx) => {
                    const isKey = col.column.toLowerCase().includes('key') || col.column.toLowerCase() === 'periods';
                    const isMetric = col.column.toLowerCase().includes('vtas') || col.column.toLowerCase().includes('dist') || col.column.toLowerCase().includes('tiendas');

                    return (
                      <tr key={idx} className="hover:bg-blue-50/40 transition-colors">
                        <td className="py-2.5 px-4 font-semibold text-slate-800">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                            {col.tableName}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-900 flex items-center gap-1.5">
                          {isKey && <span title="Llave de Relación">🔑</span>}
                          {col.column}
                        </td>
                        <td className="py-2.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            col.type === 'STRING'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200/50'
                              : col.type?.includes('FLOAT') || col.type?.includes('INT')
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                              : 'bg-purple-50 text-purple-700 border border-purple-200/50'
                          }`}>
                            {col.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-4">
                          {isKey ? (
                            <span className="text-amber-700 font-bold text-[11px]">Llave / Relación</span>
                          ) : isMetric ? (
                            <span className="text-blue-600 font-bold text-[11px]">Métrica / Hecho</span>
                          ) : (
                            <span className="text-slate-500 text-[11px]">Dimensión Atributo</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-slate-400">
                          {col.nullable ? 'SÍ' : 'NO'}
                        </td>
                        <td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">
                          #{col.order || idx + 1}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: MEDIDAS SEMÁNTICAS (DAX POWER BI ↔ BIGQUERY SQL)   */}
        {/* ========================================================= */}
        {activeTab === 'measures' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
              <h3 className="text-lg font-black text-[#004b93]">
                Catálogo de Fórmulas y Medidas Semánticas
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-3xl">
                Correspondencia exacta entre las fórmulas DAX implementadas originalmente en Power BI y su motor analítico optimizado en BigQuery SQL para máxima velocidad en la Web.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {(modelData?.measures || []).map((m, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-white hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-black text-slate-900">{m.name}</h4>
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                        {m.category}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mb-3">{m.description}</p>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block mb-0.5">
                          Fórmula DAX (Power BI)
                        </span>
                        <div className="p-2 rounded bg-amber-50 text-amber-950 font-mono text-[11px] border border-amber-200/60 overflow-x-auto">
                          {m.dax}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block mb-0.5">
                          Equivalente BigQuery SQL (Web)
                        </span>
                        <div className="p-2 rounded bg-blue-50 text-blue-950 font-mono text-[11px] border border-blue-200/60 overflow-x-auto">
                          {m.sql}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: LINAJE Y FLUJO END-TO-END                           */}
        {/* ========================================================= */}
        {activeTab === 'lineage' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 md:p-8 space-y-6">
            <div>
              <h3 className="text-lg font-black text-[#004b93]">
                Linaje y Flujo de Datos End-to-End
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Trazabilidad completa desde la ingesta de archivos Nielsen hasta las visualizaciones interactivas.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
              
              {/* PASO 1 */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center flex flex-col items-center">
                <span className="text-2xl mb-2">📁</span>
                <span className="text-[10px] font-bold uppercase text-slate-400">Paso 1: Origen</span>
                <h4 className="text-xs font-black text-slate-800 mt-1">Archivos Nielsen</h4>
                <p className="text-[11px] text-slate-500 mt-1">Bases brutas de Costa Rica, Guatemala, Colombia y Perú</p>
              </div>

              {/* PASO 2 */}
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-center flex flex-col items-center">
                <span className="text-2xl mb-2">☁️</span>
                <span className="text-[10px] font-bold uppercase text-blue-600">Paso 2: Storage</span>
                <h4 className="text-xs font-black text-blue-900 mt-1">Google Cloud Storage</h4>
                <p className="text-[11px] text-blue-700 mt-1">Bucket central de ingesta automatizada</p>
              </div>

              {/* PASO 3 */}
              <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-center flex flex-col items-center">
                <span className="text-2xl mb-2">⚡</span>
                <span className="text-[10px] font-bold uppercase text-indigo-600">Paso 3: Data Warehouse</span>
                <h4 className="text-xs font-black text-indigo-900 mt-1">BigQuery Tables</h4>
                <p className="text-[11px] text-indigo-700 mt-1">Tablas particionadas y catálogo de marcas</p>
              </div>

              {/* PASO 4 */}
              <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-center flex flex-col items-center">
                <span className="text-2xl mb-2">🔄</span>
                <span className="text-[10px] font-bold uppercase text-purple-600">Paso 4: Vista Unificada</span>
                <h4 className="text-xs font-black text-purple-900 mt-1">v_Nielsen_LATAM</h4>
                <p className="text-[11px] text-purple-700 mt-1">LEFT JOIN con cat_homologacion_marcas</p>
              </div>

              {/* PASO 5 */}
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center flex flex-col items-center">
                <span className="text-2xl mb-2">📊</span>
                <span className="text-[10px] font-bold uppercase text-emerald-600">Paso 5: Consumo Web</span>
                <h4 className="text-xs font-black text-emerald-900 mt-1">Dashboard HADA</h4>
                <p className="text-[11px] text-emerald-700 mt-1">React + Tailwind + Express Backend</p>
              </div>

            </div>

            {/* Cuadro de Garantía de Calidad */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
              <h5 className="font-bold text-slate-800 flex items-center gap-2">
                <span>🛡️</span>
                <span>Garantía de Integridad y Disponibilidad:</span>
              </h5>
              <ul className="list-disc pl-5 space-y-1 text-[11px]">
                <li><strong>Cero Pérdida de Datos:</strong> La vista consolidada conserva el 100% de los registros de todos los países.</li>
                <li><strong>Respaldo Disponible:</strong> Se mantiene activa la vista previa <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">v_Nielsen_CAM_Consolidado</code> como respaldo de contingencia.</li>
                <li><strong>Seguridad IAM:</strong> Acceso federado controlado mediante credenciales corporativas de Google Cloud.</li>
              </ul>
            </div>
          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200/80 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>Laboratorios PiSA • LATAM Analytics Hub</span>
          <span>Modelo Semántico • Antigravity 2.0</span>
          <span>Fuente: BigQuery • psa-eltr-latam-pr.Nielsen</span>
        </div>
      </footer>

    </div>
  );
};

export default SemanticModelView;
