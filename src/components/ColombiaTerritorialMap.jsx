import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { Layers, MapPin, Compass, Sparkles, Building2, Globe2 } from 'lucide-react';

// ============================================================================
// ESTRUCTURA OFICIAL DE LAS 8 REGIONES NIELSEN COLOMBIA Y SUS DEPARTAMENTOS
// ============================================================================
const COLOMBIA_REGIONS_CATALOG = {
  'ATLANTICO': {
    code: 'ATLANTICO',
    name: 'Región Atlántico / Costa Caribe',
    shortName: 'Atlántico',
    capital: 'Barranquilla / Cartagena',
    color: '#0284C7',
    departamentos: [
      'Atlántico',
      'Bolívar',
      'Cesar',
      'Córdoba',
      'La Guajira',
      'Magdalena',
      'Sucre'
    ],
    ciudadesPrincipales: ['Barranquilla', 'Cartagena', 'Santa Marta', 'Valledupar', 'Montería', 'Sincelejo', 'Riohacha']
  },
  'ANTIOQUIA-CHOCO': {
    code: 'ANTIOQUIA-CHOCO',
    name: 'Región Antioquia & Chocó',
    shortName: 'Antioquia - Chocó',
    capital: 'Medellín',
    color: '#00529B',
    departamentos: ['Antioquia', 'Chocó'],
    ciudadesPrincipales: ['Medellín', 'Bello', 'Itagüí', 'Envigado', 'Apartadó', 'Rionegro', 'Quibdó']
  },
  'CUNDI-BOY': {
    code: 'CUNDI-BOY',
    name: 'Región Cundi-Boyacá & D.C.',
    shortName: 'Cundi-Boyacá',
    capital: 'Bogotá D.C.',
    color: '#003870',
    departamentos: ['Bogotá D.C.', 'Cundinamarca', 'Boyacá'],
    ciudadesPrincipales: ['Bogotá D.C.', 'Soacha', 'Tunja', 'Duitama', 'Sogamoso', 'Zipaquirá', 'Facatativá', 'Girardot']
  },
  'PACIFICO': {
    code: 'PACIFICO',
    name: 'Región Pacífico',
    shortName: 'Pacífico',
    capital: 'Cali',
    color: '#0369A1',
    departamentos: ['Valle del Cauca', 'Cauca', 'Nariño'],
    ciudadesPrincipales: ['Cali', 'Buenaventura', 'Palmira', 'Tuluá', 'Popayán', 'Pasto', 'Ipiales', 'Tumaco']
  },
  'SANTANDERES': {
    code: 'SANTANDERES',
    name: 'Región Santanderes',
    shortName: 'Santanderes',
    capital: 'Bucaramanga / Cúcuta',
    color: '#0EA5E9',
    departamentos: ['Santander', 'Norte de Santander'],
    ciudadesPrincipales: ['Bucaramanga', 'Floridablanca', 'Girón', 'Barrancabermeja', 'Cúcuta', 'Ocaña', 'Pamplona']
  },
  'EJE CAFETERO': {
    code: 'EJE CAFETERO',
    name: 'Región Eje Cafetero',
    shortName: 'Eje Cafetero',
    capital: 'Pereira / Manizales / Armenia',
    color: '#38BDF8',
    departamentos: ['Risaralda', 'Caldas', 'Quindío'],
    ciudadesPrincipales: ['Pereira', 'Dosquebradas', 'Manizales', 'Armenia', 'Cartago', 'Santa Rosa de Cabal']
  },
  'CENTRO': {
    code: 'CENTRO',
    name: 'Región Centro & Sur',
    shortName: 'Centro',
    capital: 'Ibagué / Neiva',
    color: '#60A5FA',
    departamentos: ['Tolima', 'Huila', 'Caquetá', 'Putumayo', 'Amazonas'],
    ciudadesPrincipales: ['Ibagué', 'Espinal', 'Neiva', 'Pitalito', 'Florencia', 'Mocoa', 'Leticia']
  },
  'LLANOS': {
    code: 'LLANOS',
    name: 'Región Llanos Orientales & Amazonía',
    shortName: 'Llanos',
    capital: 'Villavicencio',
    color: '#93C5FD',
    departamentos: ['Meta', 'Casanare', 'Arauca', 'Vichada', 'Guaviare', 'Guainía', 'Vaupés'],
    ciudadesPrincipales: ['Villavicencio', 'Acacías', 'Yopal', 'Arauca', 'San José del Guaviare', 'Puerto Carreño', 'Inírida', 'Mitú']
  }
};

// ============================================================================
// POLÍGONOS GEOJSON TERRITORIALES DE COLOMBIA POR REGIÓN NIELSEN
// ============================================================================
const COLOMBIA_REGIONS_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'ATLANTICO',
      properties: { name: 'ATLANTICO' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-77.1, 8.6], [-76.2, 9.1], [-75.8, 9.4], [-75.5, 10.1], [-75.2, 10.8],
          [-74.8, 11.1], [-74.2, 11.3], [-73.1, 11.6], [-72.5, 11.9], [-71.2, 12.5],
          [-71.1, 11.8], [-72.0, 11.0], [-72.7, 10.3], [-73.2, 9.5], [-73.5, 8.8],
          [-73.9, 8.1], [-74.5, 7.8], [-75.4, 7.6], [-76.4, 7.8], [-77.1, 8.6]
        ]]
      }
    },
    {
      type: 'Feature',
      id: 'ANTIOQUIA-CHOCO',
      properties: { name: 'ANTIOQUIA-CHOCO' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-77.4, 8.6], [-76.5, 8.8], [-75.4, 7.6], [-74.5, 7.8], [-74.3, 6.9],
          [-74.6, 5.8], [-75.3, 5.5], [-76.0, 5.4], [-77.1, 4.8], [-77.6, 5.8],
          [-77.7, 7.2], [-77.4, 8.6]
        ]]
      }
    },
    {
      type: 'Feature',
      id: 'SANTANDERES',
      properties: { name: 'SANTANDERES' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-74.5, 7.8], [-73.5, 8.8], [-72.4, 9.2], [-72.2, 8.3], [-72.4, 7.3],
          [-72.8, 6.7], [-73.7, 6.0], [-74.2, 6.4], [-74.5, 7.8]
        ]]
      }
    },
    {
      type: 'Feature',
      id: 'EJE CAFETERO',
      properties: { name: 'EJE CAFETERO' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-76.0, 5.5], [-75.3, 5.5], [-75.1, 5.2], [-75.3, 4.4], [-75.8, 4.3],
          [-76.0, 4.9], [-76.0, 5.5]
        ]]
      }
    },
    {
      type: 'Feature',
      id: 'CUNDI-BOY',
      properties: { name: 'CUNDI-BOY' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-74.6, 5.8], [-74.2, 6.4], [-73.7, 6.0], [-72.8, 6.7], [-72.0, 6.0],
          [-72.5, 4.8], [-73.5, 4.2], [-74.3, 4.1], [-74.9, 4.5], [-74.6, 5.8]
        ]]
      }
    },
    {
      type: 'Feature',
      id: 'PACIFICO',
      properties: { name: 'PACIFICO' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-77.1, 4.8], [-76.0, 4.9], [-75.8, 4.3], [-76.1, 3.2], [-76.4, 2.0],
          [-77.2, 1.2], [-78.8, 0.8], [-79.0, 1.5], [-77.6, 3.8], [-77.1, 4.8]
        ]]
      }
    },
    {
      type: 'Feature',
      id: 'CENTRO',
      properties: { name: 'CENTRO' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-75.8, 4.3], [-74.9, 4.5], [-74.3, 4.1], [-74.4, 2.8], [-74.2, 1.5],
          [-73.5, 0.2], [-70.0, -2.5], [-69.8, -4.2], [-71.5, -4.0], [-74.0, -1.0],
          [-76.0, 0.2], [-77.2, 1.2], [-76.4, 2.0], [-76.1, 3.2], [-75.8, 4.3]
        ]]
      }
    },
    {
      type: 'Feature',
      id: 'LLANOS',
      properties: { name: 'LLANOS' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-72.8, 6.7], [-71.8, 7.0], [-70.5, 7.1], [-69.8, 6.2], [-67.5, 5.5],
          [-67.8, 1.8], [-69.5, 1.2], [-70.0, -2.5], [-73.5, 0.2], [-74.2, 1.5],
          [-74.4, 2.8], [-73.5, 4.2], [-72.5, 4.8], [-72.0, 6.0], [-72.8, 6.7]
        ]]
      }
    }
  ]
};

// ============================================================================
// COMPONENTE: MAPA TERRITORIAL DE COLOMBIA (OPENSTREETMAP + GLASSMORPHISM)
// ============================================================================
const ColombiaTerritorialMap = ({ onSelectRegion, activeRegionCode = null }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const geojsonLayerRef = useRef(null);

  const [hoveredRegion, setHoveredRegion] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(activeRegionCode || 'CUNDI-BOY');

  const currentRegionInfo = useMemo(() => {
    return COLOMBIA_REGIONS_CATALOG[hoveredRegion || selectedRegion] || COLOMBIA_REGIONS_CATALOG['CUNDI-BOY'];
  }, [hoveredRegion, selectedRegion]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Inicializar mapa de OpenStreetMap limpio
    if (!mapInstanceRef.current) {
      if (mapContainerRef.current._leaflet_id) {
        delete mapContainerRef.current._leaflet_id;
      }

      const map = L.map(mapContainerRef.current, {
        center: [4.5709, -74.2973],
        zoom: 5.6,
        minZoom: 4.8,
        maxZoom: 9,
        zoomControl: false,
        attributionControl: false
      });

      // Capa base estándar y oficial de OpenStreetMap (sin marcas de agua, sin API Key)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        subdomains: ['a', 'b', 'c']
      }).addTo(map);

      // Control de zoom discreto
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Capa de Polígonos de Regiones de Colombia
    if (geojsonLayerRef.current) {
      map.removeLayer(geojsonLayerRef.current);
    }

    const geojsonLayer = L.geoJSON(COLOMBIA_REGIONS_GEOJSON, {
      style: (feature) => {
        const regCode = feature.id;
        const regInfo = COLOMBIA_REGIONS_CATALOG[regCode] || {};
        const isSelected = selectedRegion === regCode;
        const isHovered = hoveredRegion === regCode;

        return {
          fillColor: regInfo.color || '#0284C7',
          fillOpacity: isHovered ? 0.75 : isSelected ? 0.65 : 0.45,
          weight: isHovered || isSelected ? 2.5 : 1.2,
          color: isHovered || isSelected ? '#002D5A' : '#ffffff',
          dashArray: isHovered || isSelected ? '' : '2',
          className: 'cursor-pointer transition-all duration-200'
        };
      },
      onEachFeature: (feature, layer) => {
        const regCode = feature.id;
        const regInfo = COLOMBIA_REGIONS_CATALOG[regCode] || {};

        layer.on({
          mouseover: (e) => {
            const l = e.target;
            l.setStyle({
              weight: 2.5,
              color: '#002D5A',
              fillOpacity: 0.8,
              dashArray: ''
            });
            l.bringToFront();
            setHoveredRegion(regCode);
          },
          mouseout: (e) => {
            geojsonLayer.resetStyle(e.target);
            setHoveredRegion(null);
          },
          click: () => {
            setSelectedRegion(regCode);
            if (onSelectRegion) {
              onSelectRegion(regCode);
            }
          }
        });

        // Tooltip Glassmorphism interactivo
        const tooltipHtml = `
          <div style="
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(8px);
            border: 1px solid rgba(0, 45, 90, 0.2);
            border-radius: 10px;
            padding: 8px 12px;
            box-shadow: 0 10px 25px -5px rgba(0, 45, 90, 0.25);
            font-family: system-ui, -apple-system, sans-serif;
            min-width: 150px;
          ">
            <div style="font-size: 9.5px; font-weight: 800; color: #004B93; text-transform: uppercase;">
              🇨🇴 Colombia
            </div>
            <div style="font-size: 12px; font-weight: 900; color: #0f172a; margin-top: 2px;">
              ${regInfo.name}
            </div>
            <div style="font-size: 10px; color: #64748b; margin-top: 4px;">
              Departamentos: <strong style="color: #0284c7;">${regInfo.departamentos ? regInfo.departamentos.length : 0}</strong>
            </div>
          </div>
        `;

        layer.bindTooltip(tooltipHtml, {
          sticky: true,
          direction: 'auto',
          className: 'custom-leaflet-glass-tooltip'
        });
      }
    }).addTo(map);

    geojsonLayerRef.current = geojsonLayer;

  }, [selectedRegion, hoveredRegion]);

  return (
    <div className="relative w-full h-[520px] rounded-3xl overflow-hidden border border-white/60 shadow-[0_20px_50px_rgba(0,75,147,0.15)] bg-slate-100 select-none">
      
      {/* CONTENEDOR DEL MAPA LEAFLET */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* ===================================================================== */}
      {/* 1. TARJETA FLOTANTE GLASSMORPHISM: ESTRUCTURA TERRITORIAL DE LA ZONA */}
      {/* ===================================================================== */}
      <div className="absolute top-4 left-4 z-10 max-w-[320px] w-full bg-white/85 backdrop-blur-md rounded-2xl p-4 border border-white/80 shadow-[0_15px_35px_rgba(0,45,90,0.15)] transition-all">
        
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#004B93] animate-pulse" />
            <span className="text-[10px] font-black tracking-wider text-[#004B93] uppercase">
              División Territorial Nielsen
            </span>
          </div>
          <span className="text-[9.5px] font-extrabold bg-blue-50 text-[#004B93] border border-blue-200/60 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Globe2 className="w-3 h-3" />
            Colombia
          </span>
        </div>

        {/* Nombre de la Región */}
        <h3 className="text-base font-black text-[#002D5A] leading-tight">
          {currentRegionInfo.name}
        </h3>
        
        <p className="text-[10px] font-semibold text-slate-500 mt-1 flex items-center gap-1">
          <Building2 className="w-3.5 h-3.5 text-blue-600 inline" />
          Centro Urbano: <strong className="text-slate-800">{currentRegionInfo.capital}</strong>
        </p>

        {/* Lista de Departamentos Reales de la Región */}
        <div className="mt-3 bg-white/90 rounded-xl p-2.5 border border-slate-100 shadow-2xs">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            Departamentos Oficiales ({currentRegionInfo.departamentos.length})
          </span>
          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1 hada-scrollbar">
            {currentRegionInfo.departamentos.map((dep) => (
              <span
                key={dep}
                className="text-[9.5px] font-bold bg-blue-50/80 text-[#00529B] border border-blue-100 rounded-md px-2 py-0.5"
              >
                {dep}
              </span>
            ))}
          </div>
        </div>

        {/* Ciudades Principales */}
        <div className="mt-2.5 pt-2 border-t border-slate-200/70 text-[9.5px] text-slate-500 flex items-center justify-between">
          <span className="font-medium">Ciudades Clave:</span>
          <span className="font-bold text-slate-700 truncate max-w-[170px]" title={currentRegionInfo.ciudadesPrincipales.join(', ')}>
            {currentRegionInfo.ciudadesPrincipales.slice(0, 3).join(', ')}...
          </span>
        </div>

      </div>

      {/* ===================================================================== */}
      {/* 2. LEYENDA FLOTANTE DE LAS 8 REGIONES NIELSEN                         */}
      {/* ===================================================================== */}
      <div className="absolute bottom-4 left-4 z-10 bg-white/90 backdrop-blur-md rounded-2xl p-3 border border-white/80 shadow-[0_10px_25px_rgba(0,45,90,0.12)] max-w-[420px] w-full">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black text-[#004B93] uppercase tracking-wider">
            8 Regiones Nielsen de Colombia
          </span>
          <span className="text-[9px] font-bold text-slate-400">Pasa el cursor o selecciona</span>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {Object.entries(COLOMBIA_REGIONS_CATALOG).map(([code, reg]) => {
            const isSelected = selectedRegion === code;
            return (
              <button
                key={code}
                onClick={() => setSelectedRegion(code)}
                className={`flex items-center gap-1.5 p-1 rounded-lg text-left transition-all cursor-pointer ${
                  isSelected ? 'bg-blue-100/80 ring-1 ring-[#004B93]' : 'hover:bg-slate-100'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: reg.color }} />
                <span className="text-[9px] font-bold text-slate-700 truncate">
                  {reg.shortName}
                </span>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default ColombiaTerritorialMap;
