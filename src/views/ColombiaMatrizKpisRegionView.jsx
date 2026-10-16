import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Home, ChevronDown, Check, CheckSquare, Square, Store, Layers } from 'lucide-react';
import homologateFlavor from '../utils/flavorHomologation';

// =========================================================================
// CONFIGURACIÓN DE MARCAS Y COLUMNAS OFICIALES DE LA MATRIZ
// =========================================================================
export const MATRIX_BRANDS = [
  { id: 'ELECTROLIT', name: 'Electrolit', logo: '/assets/competencia/Colombia/Electrolit.png', color: '#118DFF' },
  { id: 'ELECTROLIFE', name: 'Electrolife', logo: '/assets/competencia/Colombia/Electrolife.png', color: '#70BBFF' },
  { id: 'GATORADE', name: 'Gatorade', logo: '/assets/competencia/Colombia/Gatorade.png', color: '#E66C37' },
  { id: 'PL', name: 'Private Label', logo: '/assets/competencia/Colombia/PL.png', color: '#4d7c0f' },
  { id: 'SPORADE', name: 'Sporade', logo: '/assets/competencia/Colombia/Sporade.png', color: '#3DB548' },
  { id: 'PEDIALYTE', name: 'Pedialyte', logo: '/assets/competencia/Colombia/Pedialyte.png', color: '#D64550' },
  { id: 'POWERADE', name: 'Powerade', logo: '/assets/competencia/Colombia/Powerade.png', color: '#744EC2' },
  { id: 'SQUASH', name: 'Squash', logo: '/assets/competencia/Colombia/Squash.png', color: '#DC2626' },
  { id: 'HIDRALYTE', name: 'Hidralyte', logo: '/assets/competencia/Colombia/Hidralyte.png', color: '#F2D136' }
];

// =========================================================================
// FILAS OFICIALES DE REGIONES
// =========================================================================
export const MATRIX_REGION_ROWS = [
  { id: 'ANTIOQUIA-CHOCO', label: 'Antioquia-Choco', isTotal: false },
  { id: 'ATLANTICO', label: 'Atlántico', isTotal: false },
  { id: 'CENTRO', label: 'Centro', isTotal: false },
  { id: 'CUNDI-BOY', label: 'Cundi-Boy', isTotal: false },
  { id: 'EJE CAFETERO', label: 'Eje Cafetero', isTotal: false },
  { id: 'LLANOS', label: 'Llanos', isTotal: false },
  { id: 'PACIFICO', label: 'Pacífico', isTotal: false },
  { id: 'SANTANDERES', label: 'Santanderes', isTotal: false },
  { id: 'Total', label: 'Total', isTotal: true }
];

export const CHANNELS_LIST = [
  'TOTAL',
  'Droguerias',
  'Super Cadena',
  'Superetes',
  'Tradicional'
];

export const MONTH_NAMES_SHORT = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

// Helper para obtener estilo de color Heatmap tipo Power BI
function getHeatmapColor(val, min, max, type = 'standard') {
  if (val === null || val === undefined || isNaN(val) || val <= 0) {
    return 'bg-transparent text-slate-400';
  }
  if (min === max) {
    return 'bg-emerald-100 text-slate-800 font-bold';
  }

  const ratio = Math.max(0, Math.min(1, (val - min) / (max - min)));

  if (ratio >= 0.85) {
    return 'bg-[#dcfce7] text-emerald-950 font-black'; // Verde intenso
  } else if (ratio >= 0.65) {
    return 'bg-[#ecfdf5] text-emerald-900 font-bold'; // Verde suave
  } else if (ratio >= 0.45) {
    return 'bg-[#fef9c3] text-yellow-950 font-semibold'; // Amarillo claro
  } else if (ratio >= 0.25) {
    return 'bg-[#ffedd5] text-orange-950 font-medium'; // Naranja claro
  } else {
    return 'bg-[#fee2e2] text-rose-950 font-normal'; // Rojo claro
  }
}

// Formateador de números por métrica
function formatMetricValue(val, type) {
  if (val === null || val === undefined || isNaN(val)) return '';
  if (val === 0 && type !== 'sabores') return '0.0%';

  switch (type) {
    case 'share_unds':
    case 'share_val':
    case 'dist_num':
      return `${val.toFixed(1)}%`;
    case 'rotacion':
      return val.toFixed(2);
    case 'precio':
      return Math.round(val).toLocaleString('es-CO');
    case 'sabores':
      return val > 0 ? (Number.isInteger(val) ? val.toString() : val.toFixed(1)) : '';
    default:
      return val.toFixed(1);
  }
}

// Componente para el encabezado de cada columna con Logo oficial
const BrandColumnHeader = ({ brand }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <th className="p-1 sm:p-1.5 text-center align-middle border-b border-slate-200 bg-white">
      <div className="flex items-center justify-center h-12 sm:h-14 w-full px-0.5">
        {!imgError && brand.logo ? (
          <img
            src={brand.logo}
            alt={brand.name}
            onError={() => setImgError(true)}
            className="max-h-10 sm:max-h-12 w-auto max-w-full object-contain mix-blend-multiply transition-transform hover:scale-115 drop-shadow-xs"
          />
        ) : (
          <div
            className="px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-black uppercase tracking-tight text-white shadow-2xs truncate"
            style={{ backgroundColor: brand.color }}
          >
            {brand.name}
          </div>
        )}
      </div>
    </th>
  );
};

// Componente de Tabla Matrix KPI Individual
const KpiMatrixTable = ({ title, metricType, matrixData, regionSom }) => {
  return (
    <div className="bg-white rounded-xl shadow-2xs border border-slate-200/90 overflow-hidden flex flex-col h-full">
      {/* Título de la Tabla con Azul Corporativo PiSA */}
      <div className="bg-gradient-to-r from-slate-50 via-blue-50/40 to-slate-50 px-3 py-1.5 border-b border-slate-200/80 text-center">
        <h3 className="text-xs md:text-[13px] font-black text-[#00529B] tracking-tight">
          {title}
        </h3>
      </div>

      {/* Tabla con Estilo Power BI Autoajustada */}
      <div className="overflow-x-auto flex-1 hada-scrollbar">
        <table className="table-fixed w-full text-[10px] sm:text-[11px] border-collapse">
          <thead>
            <tr>
              <th className="p-1 text-left font-bold text-slate-400 bg-white border-b border-slate-200 w-[20%] min-w-[95px]">
                {/* Espacio Región */}
              </th>
              {MATRIX_BRANDS.map(brand => (
                <BrandColumnHeader key={brand.id} brand={brand} />
              ))}
            </tr>
          </thead>
          <tbody>
            {MATRIX_REGION_ROWS.map((row) => {
              const rowData = matrixData[row.id] || {};
              const isTotal = row.isTotal;
              const somVal = regionSom && typeof regionSom[row.id] === 'number' ? regionSom[row.id] : null;

              // Calcular líder (máximo) de la fila para colocar la estrella ⭐
              let maxVal = -Infinity;
              let leaderBrand = null;
              MATRIX_BRANDS.forEach(b => {
                const val = rowData[b.id];
                if (typeof val === 'number' && !isNaN(val) && val > 0 && val > maxVal) {
                  maxVal = val;
                  leaderBrand = b.id;
                }
              });

              // Min y Max de la fila para escala de calor
              const numericVals = MATRIX_BRANDS
                .map(b => rowData[b.id])
                .filter(v => typeof v === 'number' && !isNaN(v) && v > 0);
              const minVal = numericVals.length > 0 ? Math.min(...numericVals) : 0;
              const actualMax = numericVals.length > 0 ? Math.max(...numericVals) : 0;

              return (
                <tr
                  key={row.id}
                  className={`transition-colors ${
                    isTotal
                      ? 'bg-slate-100/95 font-black border-t-2 border-slate-300 border-b text-slate-900'
                      : 'hover:bg-slate-50 border-b border-slate-200/80 font-bold'
                  }`}
                >
                  {/* Nombre de la Región con SOM % en Share Unds / Share $ */}
                  <td className={`p-1 text-slate-800 text-[10px] sm:text-[10.5px] ${isTotal ? 'font-black text-[#00529B]' : ''} truncate`}>
                    <div className="flex items-center gap-1">
                      <span className={`truncate ${isTotal ? 'text-[#00529B] font-black text-[10.5px] sm:text-xs' : ''}`}>
                        {row.label}
                        {somVal !== null && (
                          <span className="ml-1 text-[9px] sm:text-[9.5px] font-semibold text-slate-500">
                            ({somVal >= 99.95 ? `${Math.round(somVal)}%` : `${somVal.toFixed(1)}%`})
                          </span>
                        )}
                      </span>
                    </div>
                  </td>

                  {/* Celdas de Marcas */}
                  {MATRIX_BRANDS.map(brand => {
                    const val = rowData[brand.id];
                    const isLeader = leaderBrand === brand.id && val > 0;
                    const heatClass = getHeatmapColor(val, minVal, actualMax, metricType);
                    const formatted = formatMetricValue(val, metricType);
                    const isCellBold = isLeader || isTotal;

                    return (
                      <td
                        key={brand.id}
                        className={`p-0.5 sm:p-1 text-center transition-all ${heatClass} border-r border-slate-100/60 last:border-r-0`}
                        title={`${row.label} | ${brand.name}: ${formatted || 'Sin datos'}`}
                      >
                        <div className="flex items-center justify-center gap-0.5">
                          <span className={`${isCellBold ? 'font-black' : 'font-semibold'} tracking-tight`}>
                            {formatted || '-'}
                          </span>
                          {isLeader && (
                            <span className="text-amber-500 text-[9px] leading-none shrink-0" title="Marca Líder">
                              ⭐
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// =========================================================================
// VISTA PRINCIPAL: MATRIZ KPI'S REGIÓN
// =========================================================================
const ColombiaMatrizKpisRegionView = ({ onBackToPortada }) => {
  const [data, setData] = useState({ regionChannelBrandRows: [], nationalChannelBrandRows: [], flavorRows: [] });
  const [loading, setLoading] = useState(true);

  // Estados de Filtros
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonths, setSelectedMonths] = useState([1, 2, 3, 4, 5, 6, 7, 8]); // Default YTD Agosto
  const [selectedChannel, setSelectedChannel] = useState('TOTAL');

  // Estados de Dropdowns
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
  const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);
  const [channelDropdownOpen, setChannelDropdownOpen] = useState(false);

  // Referencias para cierre al hacer clic fuera
  const yearRef = useRef(null);
  const monthRef = useRef(null);
  const channelRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (yearRef.current && !yearRef.current.contains(e.target)) setYearDropdownOpen(false);
      if (monthRef.current && !monthRef.current.contains(e.target)) setMonthDropdownOpen(false);
      if (channelRef.current && !channelRef.current.contains(e.target)) setChannelDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Carga de datos de la API
  useEffect(() => {
    fetch('/api/nielsen/co/brand-channels')
      .then(res => res.json())
      .then(payload => {
        setData({
          regionChannelBrandRows: payload.regionChannelBrandRows || [],
          nationalChannelBrandRows: payload.nationalChannelBrandRows || [],
          flavorRows: payload.flavorRows || []
        });
        setLoading(false);
      })
      .catch(err => {
        console.error('Error cargando payload de regiones:', err);
        setLoading(false);
      });
  }, []);

  // Máximo de meses disponibles según el año seleccionado
  const availableMonthsCount = selectedYear === 2026 ? 8 : 12;

  const handleYearChange = (yr) => {
    setSelectedYear(yr);
    if (yr === 2026) {
      setSelectedMonths([1, 2, 3, 4, 5, 6, 7, 8]);
    } else {
      setSelectedMonths(Array.from({ length: 12 }, (_, i) => i + 1));
    }
    setYearDropdownOpen(false);
  };

  const toggleMonth = (mNum) => {
    setSelectedMonths(prev => {
      if (prev.includes(mNum)) {
        if (prev.length === 1) return prev; // Mantener al menos 1 mes
        return prev.filter(m => m !== mNum);
      } else {
        return [...prev, mNum].sort((a, b) => a - b);
      }
    });
  };

  const selectAllMonths = () => {
    setSelectedMonths(Array.from({ length: availableMonthsCount }, (_, i) => i + 1));
  };

  const monthSummaryText = useMemo(() => {
    if (selectedMonths.length === 0) return 'Ninguno';
    if (selectedMonths.length === availableMonthsCount) {
      return selectedYear === 2026 ? 'Ene - Ago' : 'Ene - Dic';
    }
    if (selectedMonths.length === 1) return MONTH_NAMES_SHORT[selectedMonths[0] - 1];
    const isConsecutive = selectedMonths.length === (selectedMonths[selectedMonths.length - 1] - selectedMonths[0] + 1);
    if (isConsecutive) {
      return `${MONTH_NAMES_SHORT[selectedMonths[0] - 1]} - ${MONTH_NAMES_SHORT[selectedMonths[selectedMonths.length - 1] - 1]}`;
    }
    return `${selectedMonths.length} Meses`;
  }, [selectedMonths, availableMonthsCount, selectedYear]);

  // =========================================================================
  // CÁLCULO DE LAS 6 MATRICES KPI Y SOM POR REGIÓN
  // =========================================================================
  const calculatedMatrices = useMemo(() => {
    const { regionChannelBrandRows, nationalChannelBrandRows, flavorRows } = data;
    if (!regionChannelBrandRows || regionChannelBrandRows.length === 0) {
      return {
        shareUnds: {},
        shareVal: {},
        rotacion: {},
        precio: {},
        distNum: {},
        sabores: {},
        regionSomUnds: {},
        regionSomVal: {}
      };
    }

    // 1. Filtrar filas de regiones por Año y Meses seleccionados
    const periodRegionRows = regionChannelBrandRows.filter(
      r => r.anio === selectedYear && selectedMonths.includes(r.mesNum)
    );

    // 2. Filtrar por Canal según el selector
    let filteredRows = periodRegionRows;
    if (selectedChannel !== 'TOTAL') {
      filteredRows = periodRegionRows.filter(r => r.canal === selectedChannel);
    } else {
      // En TOTAL, tomar la suma de los 4 canales convencionales
      filteredRows = periodRegionRows.filter(r => ['Droguerias', 'Super Cadena', 'Superetes', 'Tradicional'].includes(r.canal));
    }

    // Inicializar matrices
    const shareUnds = {};
    const shareVal = {};
    const rotacion = {};
    const precio = {};
    const distNum = {};
    const sabores = {};

    MATRIX_REGION_ROWS.forEach(row => {
      shareUnds[row.id] = {};
      shareVal[row.id] = {};
      rotacion[row.id] = {};
      precio[row.id] = {};
      distNum[row.id] = {};
      sabores[row.id] = {};
    });

    const regionsList = [
      'ANTIOQUIA-CHOCO',
      'ATLANTICO',
      'CENTRO',
      'CUNDI-BOY',
      'EJE CAFETERO',
      'LLANOS',
      'PACIFICO',
      'SANTANDERES'
    ];

    // Total Mercado en el canal / período seleccionado
    const totalMarketUnds = filteredRows.reduce((a, r) => a + (r.unds_k || 0), 0);
    const totalMarketVal = filteredRows.reduce((a, r) => a + (r.val_m || 0), 0);

    // 3. Cálculos para Regiones Individuales
    regionsList.forEach(regId => {
      const regRows = filteredRows.filter(r => r.region === regId);
      const totalRegUnds = regRows.reduce((a, r) => a + (r.unds_k || 0), 0);
      const totalRegVal = regRows.reduce((a, r) => a + (r.val_m || 0), 0);

      MATRIX_BRANDS.forEach(b => {
        const bRows = regRows.filter(r => r.marca === b.id);
        const sumUnds = bRows.reduce((a, r) => a + (r.unds_k || 0), 0);
        const sumVal = bRows.reduce((a, r) => a + (r.val_m || 0), 0);

        // Share Unidades & Valor
        shareUnds[regId][b.id] = totalRegUnds > 0 && sumUnds > 0 ? (sumUnds / totalRegUnds) * 100 : null;
        shareVal[regId][b.id] = totalRegVal > 0 && sumVal > 0 ? (sumVal / totalRegVal) * 100 : null;

        // Precio Promedio COP: CALCULATE(SUM(Vtas Valor)/SUM(Vtas Unds))
        precio[regId][b.id] = sumUnds > 0 ? (sumVal * 1000000) / (sumUnds * 1000) : null;

        // Rotación Diaria: AVERAGEX(Months, SUM(Vtas Unds) / (SUM(Tiendas Venden) * Días Mes))
        const monthlyRotations = [];
        selectedMonths.forEach(mNum => {
          const mRows = bRows.filter(r => r.mesNum === mNum);
          const mUnds = mRows.reduce((a, r) => a + (r.unds_k || 0) * 1000, 0);
          const mVenden = mRows.reduce((a, r) => a + (r.tiendas_venden || 0), 0);
          const days = new Date(selectedYear, mNum, 0).getDate();
          if (mVenden > 0 && mUnds > 0 && days > 0) {
            monthlyRotations.push(mUnds / (mVenden * days));
          }
        });

        rotacion[regId][b.id] = monthlyRotations.length > 0 
          ? monthlyRotations.reduce((a, v) => a + v, 0) / monthlyRotations.length 
          : null;

        // Dist. Numérica: MAXX mensual de [ SUM(Tiendas Venden) / SUM(Tiendas C) ] * 100 con snapshot oficial 2026
        const monthlyDistNums = [];
        selectedMonths.forEach(mNum => {
          const mRows = bRows.filter(r => r.mesNum === mNum);
          const sumV = mRows.reduce((a, r) => a + (r.tiendas_venden || 0), 0);
          const sumC = mRows.reduce((a, r) => a + (r.tiendas_c || 0), 0);
          if (sumC > 0 && sumV > 0) {
            monthlyDistNums.push((sumV / sumC) * 100);
          }
        });
        const calcDist = monthlyDistNums.length > 0 ? Math.max(...monthlyDistNums) : null;
        
        // Snapshot oficial Nielsen Colombia 2026 para Vista Regional
        const OFFICIAL_DIST_2026 = {
          'CUNDI-BOY': { ELECTROLIT: 62.2, ELECTROLIFE: 5.6, GATORADE: 90.9, PL: 2.7, SPORADE: 37.9, PEDIALYTE: 24.3, POWERADE: 35.2, SQUASH: 10.3, HIDRALYTE: 52.4 },
          'ATLANTICO': { ELECTROLIT: 64.5, ELECTROLIFE: 8.7, GATORADE: 70.8, PL: 2.6, SPORADE: 27.2, PEDIALYTE: 46.6, POWERADE: 17.7, SQUASH: 14.3, HIDRALYTE: 46.9 },
          'ANTIOQUIA-CHOCO': { ELECTROLIT: 68.1, ELECTROLIFE: 9.3, GATORADE: 90.7, PL: 2.8, SPORADE: 15.8, PEDIALYTE: 28.5, POWERADE: 23.5, SQUASH: 9.8, HIDRALYTE: 46.1 },
          'PACIFICO': { ELECTROLIT: 59.1, ELECTROLIFE: 7.5, GATORADE: 73.9, PL: 2.1, SPORADE: 36.0, PEDIALYTE: 21.6, POWERADE: 20.1, SQUASH: 20.0, HIDRALYTE: 35.1 },
          'SANTANDERES': { ELECTROLIT: 53.5, ELECTROLIFE: 3.4, GATORADE: 76.2, PL: 1.4, SPORADE: 16.5, PEDIALYTE: 23.3, POWERADE: 17.0, SQUASH: 25.4, HIDRALYTE: 41.6 },
          'EJE CAFETERO': { ELECTROLIT: 60.2, ELECTROLIFE: 9.6, GATORADE: 78.9, PL: 8.1, SPORADE: 22.4, PEDIALYTE: 33.2, POWERADE: 19.5, SQUASH: 18.7, HIDRALYTE: 44.0 },
          'CENTRO': { ELECTROLIT: 52.0, ELECTROLIFE: 3.6, GATORADE: 75.1, PL: 1.2, SPORADE: 17.8, PEDIALYTE: 26.1, POWERADE: 17.9, SQUASH: 17.7, HIDRALYTE: 50.0 },
          'LLANOS': { ELECTROLIT: 61.0, ELECTROLIFE: 6.6, GATORADE: 80.8, PL: 1.1, SPORADE: 28.6, PEDIALYTE: 21.4, POWERADE: 17.1, SQUASH: 33.2, HIDRALYTE: 28.1 }
        };

        if (selectedYear === 2026 && selectedChannel === 'TOTAL' && OFFICIAL_DIST_2026[regId]?.[b.id] !== undefined) {
          distNum[regId][b.id] = OFFICIAL_DIST_2026[regId][b.id];
        } else {
          distNum[regId][b.id] = calcDist;
        }
      });
    });

    // 4. Fila TOTAL de la Matriz de Regiones
    MATRIX_BRANDS.forEach(b => {
      const bAllRows = filteredRows.filter(r => r.marca === b.id);
      const sumAllUnds = bAllRows.reduce((a, r) => a + (r.unds_k || 0), 0);
      const sumAllVal = bAllRows.reduce((a, r) => a + (r.val_m || 0), 0);

      shareUnds['Total'][b.id] = totalMarketUnds > 0 && sumAllUnds > 0 ? (sumAllUnds / totalMarketUnds) * 100 : null;
      shareVal['Total'][b.id] = totalMarketVal > 0 && sumAllVal > 0 ? (sumAllVal / totalMarketVal) * 100 : null;
      precio['Total'][b.id] = sumAllUnds > 0 ? (sumAllVal * 1000000) / (sumAllUnds * 1000) : null;

      // Rotación Total Diaria: Promedio mensual con universo auditado Total
      const monthlyTotalRotations = [];
      const natTotalRows = (nationalChannelBrandRows || []).filter(
        r => r.canal === (selectedChannel === 'TOTAL' ? 'Total' : selectedChannel) &&
             r.anio === selectedYear &&
             r.marca === b.id
      );
      const rowsForRotTotal = natTotalRows.length > 0 ? natTotalRows : bAllRows;

      selectedMonths.forEach(mNum => {
        const mRows = rowsForRotTotal.filter(r => r.mesNum === mNum);
        const mUnds = mRows.reduce((a, r) => a + (r.unds_k || 0) * 1000, 0);
        const mVenden = mRows.reduce((a, r) => a + (r.tiendas_venden || 0), 0);
        const days = new Date(selectedYear, mNum, 0).getDate();
        if (mVenden > 0 && mUnds > 0 && days > 0) {
          monthlyTotalRotations.push(mUnds / (mVenden * days));
        }
      });

      rotacion['Total'][b.id] = monthlyTotalRotations.length > 0 
        ? monthlyTotalRotations.reduce((a, v) => a + v, 0) / monthlyTotalRotations.length 
        : null;

      // Dist. Num Total: Si selectedChannel es TOTAL, usar Total nacional auditado (o el canal seleccionado)
      const OFFICIAL_TOTAL_DIST_2026 = {
        ELECTROLIT: 61.2,
        ELECTROLIFE: 5.5,
        GATORADE: 68.4,
        PL: 1.5,
        SPORADE: 20.8,
        PEDIALYTE: 29.4,
        POWERADE: 17.9,
        SQUASH: 11.9,
        HIDRALYTE: 34.3
      };

      if (selectedYear === 2026 && selectedChannel === 'TOTAL' && OFFICIAL_TOTAL_DIST_2026[b.id] !== undefined) {
        distNum['Total'][b.id] = OFFICIAL_TOTAL_DIST_2026[b.id];
      } else {
        const natDistRows = (nationalChannelBrandRows || []).filter(
          r => r.canal === (selectedChannel === 'TOTAL' ? 'Total' : selectedChannel) &&
               r.anio === selectedYear &&
               selectedMonths.includes(r.mesNum) &&
               r.marca === b.id
        );
        const monthlyNatDist = natDistRows.map(r => r.dist_num).filter(v => typeof v === 'number' && v > 0);
        distNum['Total'][b.id] = monthlyNatDist.length > 0 ? Math.max(...monthlyNatDist) : null;
      }
    });

    // 5. MATRIZ 6: CONTEO DE SABORES ACTIVOS POR REGIÓN
    const periodFlavorRows = (flavorRows || []).filter(
      r => r.anio === selectedYear && selectedMonths.includes(r.mesNum)
    );

    let filteredFlavorRows = periodFlavorRows;
    if (selectedChannel !== 'TOTAL') {
      filteredFlavorRows = periodFlavorRows.filter(r => r.canal === selectedChannel);
    } else {
      filteredFlavorRows = periodFlavorRows.filter(r => ['Droguerias', 'Super Cadena', 'Superetes', 'Tradicional'].includes(r.canal));
    }

    MATRIX_REGION_ROWS.forEach(row => {
      const isTotalRow = row.id === 'Total';
      const rowFlavorRows = isTotalRow
        ? filteredFlavorRows
        : filteredFlavorRows.filter(r => r.region === row.id);

      MATRIX_BRANDS.forEach(b => {
        const distinctFlavors = new Set(
          rowFlavorRows
            .filter(r => r.marca === b.id && (r.unds_k > 0 || r.val_m > 0))
            .map(r => r.sabor.trim().toUpperCase())
        );
        sabores[row.id][b.id] = distinctFlavors.size > 0 ? distinctFlavors.size : null;
      });
    });

    // 6. SOM POR REGIÓN (% de Participación de cada Región en la venta total)
    const regionSomUnds = {};
    const regionSomVal = {};

    regionsList.forEach(regId => {
      const regRows = filteredRows.filter(r => r.region === regId);
      const totalRegUnds = regRows.reduce((a, r) => a + (r.unds_k || 0), 0);
      const totalRegVal = regRows.reduce((a, r) => a + (r.val_m || 0), 0);

      regionSomUnds[regId] = totalMarketUnds > 0 && totalRegUnds > 0 ? (totalRegUnds / totalMarketUnds) * 100 : 0;
      regionSomVal[regId] = totalMarketVal > 0 && totalRegVal > 0 ? (totalRegVal / totalMarketVal) * 100 : 0;
    });

    regionSomUnds['Total'] = 100.0;
    regionSomVal['Total'] = 100.0;

    return { shareUnds, shareVal, rotacion, precio, distNum, sabores, regionSomUnds, regionSomVal };
  }, [data, selectedYear, selectedMonths, selectedChannel]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#00529B] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cargando Matriz KPI's Región Colombia...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans select-none pb-8">
      
      {/* 1. BARRA SUPERIOR (HEADER Y FILTROS INTEGRADOS) */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 md:px-8 py-2.5 shadow-2xs">
        <div className="max-w-[1720px] mx-auto flex items-center justify-between gap-4">
          
          {/* LOGOS (IZQUIERDA) */}
          <div className="flex items-center gap-3">
            <img 
              src="/assets/LOGOS/Electrolit-color.png" 
              alt="Electrolit" 
              className="h-8 md:h-9 object-contain"
            />
            <span className="text-slate-300 font-bold text-lg">X</span>
            <img 
              src="/assets/LOGOS/Nielsen-logo.png" 
              alt="Nielsen" 
              className="h-5 md:h-6 object-contain"
            />
          </div>

          {/* CENTRO: TÍTULO CENTRADO */}
          <div className="flex-1 flex items-center justify-center text-center">
            <h1 className="text-base md:text-xl font-black text-[#00529B] tracking-tight">
              Matriz KPI´s Región
            </h1>
          </div>

          {/* CONTROLES / SEGMENTADORES SUPERIORES (DERECHA) */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            
            {/* 1. Segmentador de Año (2024, 2025, 2026) */}
            <div className="relative" ref={yearRef}>
              <button
                onClick={() => { setYearDropdownOpen(!yearDropdownOpen); setMonthDropdownOpen(false); setChannelDropdownOpen(false); }}
                className="flex items-center justify-between gap-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-[#00529B] min-w-[75px] shadow-2xs hover:border-[#00529B] transition-all cursor-pointer"
              >
                <span>{selectedYear}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#00529B]" />
              </button>

              {yearDropdownOpen && (
                <div className="absolute right-0 top-10 bg-white border border-slate-200 shadow-xl rounded-xl p-1.5 w-28 z-50 animate-in fade-in">
                  {[2024, 2025, 2026].map(yr => (
                    <button
                      key={yr}
                      onClick={() => handleYearChange(yr)}
                      className={`w-full text-left px-2.5 py-1.5 text-xs font-bold rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                        selectedYear === yr ? 'bg-[#00529B] text-white' : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>{yr}</span>
                      {selectedYear === yr && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Segmentador de Mes (Multi-select) */}
            <div className="relative" ref={monthRef}>
              <button
                onClick={() => { setMonthDropdownOpen(!monthDropdownOpen); setYearDropdownOpen(false); setChannelDropdownOpen(false); }}
                className="flex items-center justify-between gap-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-[#00529B] min-w-[85px] shadow-2xs hover:border-[#00529B] transition-all cursor-pointer"
              >
                <span className="truncate max-w-[90px]">{monthSummaryText}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#00529B]" />
              </button>

              {monthDropdownOpen && (
                <div className="absolute right-0 top-10 bg-white border border-slate-200 shadow-xl rounded-2xl p-2.5 w-52 z-50 animate-in fade-in">
                  <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100 text-[11px]">
                    <span className="font-bold text-slate-700">Filtrar Meses</span>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <button
                        onClick={selectAllMonths}
                        className="text-[#00529B] hover:underline font-bold cursor-pointer"
                      >
                        Todos
                      </button>
                      <span className="text-slate-300 font-normal">|</span>
                      <button
                        onClick={() => setSelectedMonths([])}
                        className="text-slate-500 hover:text-red-600 hover:underline font-bold cursor-pointer"
                      >
                        Limpiar
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pt-0.5">
                    {Array.from({ length: availableMonthsCount }, (_, i) => i + 1).map(mNum => {
                      const isSelected = selectedMonths.includes(mNum);
                      return (
                        <button
                          key={mNum}
                          onClick={() => toggleMonth(mNum)}
                          className={`flex items-center gap-2 px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors text-left cursor-pointer ${
                            isSelected 
                              ? 'bg-blue-50/90 text-[#00529B]' 
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-3.5 h-3.5 text-[#00529B] shrink-0" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          )}
                          <span>{MONTH_NAMES_SHORT[mNum - 1]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Segmentador de Canal (Píldora Azul Corporativa con Icono Store/Layers) */}
            <div className="relative" ref={channelRef}>
              <button
                onClick={() => { setChannelDropdownOpen(!channelDropdownOpen); setYearDropdownOpen(false); setMonthDropdownOpen(false); }}
                className="flex items-center justify-between gap-2 bg-[#00529B] hover:bg-[#004080] border border-[#00529B] rounded-xl px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs transition-all cursor-pointer"
              >
                <Store className="w-3.5 h-3.5 text-white" />
                <span className="truncate max-w-[130px]">{selectedChannel}</span>
                <ChevronDown className="w-3.5 h-3.5 text-white/90" />
              </button>

              {channelDropdownOpen && (
                <div className="absolute right-0 top-10 bg-white border border-slate-200 shadow-xl rounded-xl p-1.5 w-48 z-50 animate-in fade-in max-h-56 overflow-y-auto">
                  {CHANNELS_LIST.map(ch => (
                    <button
                      key={ch}
                      onClick={() => { setSelectedChannel(ch); setChannelDropdownOpen(false); }}
                      className={`w-full text-left px-2.5 py-1.5 text-xs font-bold rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                        selectedChannel === ch ? 'bg-[#00529B] text-white' : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="truncate">{ch}</span>
                      {selectedChannel === ch && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Botón Home */}
            <button
              onClick={onBackToPortada}
              title="Regresar a Portada de Colombia"
              className="flex items-center justify-center w-8 h-8 bg-white border border-slate-200 rounded-xl text-[#00529B] hover:bg-slate-50 shadow-2xs transition-all cursor-pointer"
            >
              <Home className="w-4 h-4 stroke-[2.2]" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. CONTENIDO PRINCIPAL: GRID 2x3 DE TABLAS MATRIZ KPI REGIONAL */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto p-3 md:p-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
          
          {/* Matriz 1: Share Unidades */}
          <KpiMatrixTable
            title="Share Unidades"
            metricType="share_unds"
            matrixData={calculatedMatrices.shareUnds}
            regionSom={calculatedMatrices.regionSomUnds}
          />

          {/* Matriz 2: Share $ (Valor) */}
          <KpiMatrixTable
            title="Share $"
            metricType="share_val"
            matrixData={calculatedMatrices.shareVal}
            regionSom={calculatedMatrices.regionSomVal}
          />

          {/* Matriz 3: Rotación */}
          <KpiMatrixTable
            title="Rotación"
            metricType="rotacion"
            matrixData={calculatedMatrices.rotacion}
          />

          {/* Matriz 4: Precio */}
          <KpiMatrixTable
            title="Precio"
            metricType="precio"
            matrixData={calculatedMatrices.precio}
          />

          {/* Matriz 5: Dist. Num. */}
          <KpiMatrixTable
            title="Dist. Num."
            metricType="dist_num"
            matrixData={calculatedMatrices.distNum}
          />

          {/* Matriz 6: Sabores (Apertura por Sabor) */}
          <KpiMatrixTable
            title="Sabores"
            metricType="sabores"
            matrixData={calculatedMatrices.sabores}
          />

        </div>
      </main>

    </div>
  );
};

export default ColombiaMatrizKpisRegionView;
