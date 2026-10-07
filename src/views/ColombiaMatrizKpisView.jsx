import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Home, ChevronDown, Check, CheckSquare, Square, Star, MapPin } from 'lucide-react';
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
// FILAS OFICIALES DE APERTURA CANAL / SUB-CANAL
// =========================================================================
export const MATRIX_ROWS = [
  { id: 'Droguerias', label: 'Droguerias', isSub: false, isTotal: false },
  { id: 'Droguerias Independientes', label: 'Drog. Ind.', isSub: true, isTotal: false, parent: 'Droguerias' },
  { id: 'Droguerias Cadena', label: 'Drog. Cad.', isSub: true, isTotal: false, parent: 'Droguerias' },
  { id: 'Super Cadena', label: 'Super Cadena', isSub: false, isTotal: false },
  { id: 'Superetes', label: 'Superetes', isSub: false, isTotal: false },
  { id: 'Tradicional', label: 'Tradicional', isSub: false, isTotal: false },
  { id: 'Total', label: 'Total', isSub: false, isTotal: true }
];

export const REGIONS_LIST = [
  'TOTAL',
  'ANTIOQUIA-CHOCO',
  'ATLANTICO',
  'CENTRO',
  'CUNDI-BOY',
  'EJE CAFETERO',
  'LLANOS',
  'PACIFICO',
  'SANTANDERES'
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

  // Normalizar entre 0 y 1
  const ratio = Math.max(0, Math.min(1, (val - min) / (max - min)));

  if (ratio >= 0.75) {
    return 'bg-[#bbf7d0] text-emerald-950 font-bold'; // Verde suave
  } else if (ratio >= 0.50) {
    return 'bg-[#dcfce7] text-emerald-900 font-medium'; // Verde muy claro
  } else if (ratio >= 0.25) {
    return 'bg-[#fef9c3] text-amber-950 font-medium'; // Amarillo pastel
  } else if (ratio >= 0.10) {
    return 'bg-[#fed7aa] text-orange-950 font-medium'; // Durazno
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
const KpiMatrixTable = ({ title, metricType, matrixData, channelSom, selectedRegion, onCellHover }) => {
  const [drogOpen, setDrogOpen] = useState(true);
  const isRegional = selectedRegion && selectedRegion !== 'TOTAL';

  // Filtrar filas según si es regional (oculta subcanales) o según acordeón drogOpen
  const visibleRows = useMemo(() => {
    if (isRegional) {
      return MATRIX_ROWS.filter(row => !row.isSub);
    }
    return MATRIX_ROWS.filter(row => !(row.isSub && !drogOpen));
  }, [drogOpen, isRegional]);

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
              <th className="p-1 text-left font-bold text-slate-400 bg-white border-b border-slate-200 w-[18%] min-w-[85px]">
                {/* Espacio Apertura */}
              </th>
              {MATRIX_BRANDS.map(brand => (
                <BrandColumnHeader key={brand.id} brand={brand} />
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => {
              const rowData = matrixData[row.id] || {};
              const isTotal = row.isTotal;
              const isSub = row.isSub;
              const isDrogParent = row.id === 'Droguerias';
              const somVal = channelSom && typeof channelSom[row.id] === 'number' ? channelSom[row.id] : null;

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
                      : isSub
                      ? 'bg-blue-50/20 hover:bg-blue-50/40 border-b border-slate-100'
                      : 'hover:bg-slate-50 border-b border-slate-200/80 font-bold'
                  }`}
                >
                  {/* Nombre del Canal / Apertura con SOM % en Share Unds / Share $ */}
                  <td className={`p-1 text-slate-800 ${isSub ? 'pl-2 text-[9.5px] font-semibold text-slate-600' : 'text-[10px] sm:text-[10.5px]'} ${isTotal ? 'font-black text-[#00529B]' : ''} truncate`}>
                    <div className="flex items-center gap-1">
                      {isDrogParent && !isRegional && (
                        <button
                          onClick={() => setDrogOpen(!drogOpen)}
                          title={drogOpen ? "Ocultar Drog. Ind. y Drog. Cad." : "Mostrar Drog. Ind. y Drog. Cad."}
                          className="w-3.5 h-3.5 rounded flex items-center justify-center bg-blue-100 hover:bg-blue-200 text-[#00529B] font-black text-[10px] leading-none shrink-0 transition-colors shadow-2xs cursor-pointer mr-0.5"
                        >
                          {drogOpen ? '−' : '+'}
                        </button>
                      )}
                      {isSub && <span className="text-slate-400 font-mono text-[9px]">└</span>}
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
                        <div className={`flex items-center justify-center gap-0.5 font-mono tracking-tighter ${isCellBold ? 'font-black text-slate-950' : 'font-medium'}`}>
                          {isLeader && (
                            <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-amber-400 text-amber-500 drop-shadow-2xs shrink-0" />
                          )}
                          <span className={isCellBold ? 'font-black' : ''}>{formatted}</span>
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
// VISTA PRINCIPAL: COLOMBIA MATRIZ KPI'S VIEW
// =========================================================================
const ColombiaMatrizKpisView = ({ onBackToPortada }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados persistentes de filtros
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonths, setSelectedMonths] = useState([1, 2, 3, 4, 5, 6, 7, 8]);
  const [selectedRegion, setSelectedRegion] = useState('TOTAL');

  // Control de dropdowns
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
  const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);
  const [regionDropdownOpen, setRegionDropdownOpen] = useState(false);

  const yearRef = useRef(null);
  const monthRef = useRef(null);
  const regionRef = useRef(null);

  // Cierre de dropdowns al dar clic afuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (yearRef.current && !yearRef.current.contains(event.target)) setYearDropdownOpen(false);
      if (monthRef.current && !monthRef.current.contains(event.target)) setMonthDropdownOpen(false);
      if (regionRef.current && !regionRef.current.contains(event.target)) setRegionDropdownOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Carga de datos de la API
  useEffect(() => {
    fetch('/api/nielsen/co/brand-channels')
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching brand-channels data for Matrix:', err);
        setLoading(false);
      });
  }, []);

  // Meses disponibles según año
  const availableMonthsCount = selectedYear === 2026 ? 8 : 12;

  const handleYearChange = (yr) => {
    setSelectedYear(yr);
    if (yr === 2026) {
      setSelectedMonths([1, 2, 3, 4, 5, 6, 7, 8]);
    } else {
      setSelectedMonths([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    }
    setYearDropdownOpen(false);
  };

  const toggleMonth = (mNum) => {
    if (selectedMonths.includes(mNum)) {
      setSelectedMonths(selectedMonths.filter(m => m !== mNum));
    } else {
      setSelectedMonths([...selectedMonths, mNum].sort((a, b) => a - b));
    }
  };

  const selectAllMonths = () => {
    const all = [];
    for (let i = 1; i <= availableMonthsCount; i++) all.push(i);
    setSelectedMonths(all);
  };

  // Texto resumen del segmentador de Meses
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
  // MOTOR DE CÁLCULO DE LAS 6 MATRICES KPI (ALINEADO A POWER BI & DAX)
  // =========================================================================
  const calculatedMatrices = useMemo(() => {
    if (!data) return { shareUnds: {}, shareVal: {}, rotacion: {}, precio: {}, distNum: {}, sabores: {} };

    const isNat = selectedRegion === 'TOTAL';
    const sourceRows = isNat ? (data.nationalChannelBrandRows || []) : (data.regionChannelBrandRows || []);

    // 1. Filtrar filas de marcas por Año, Meses y Región (si aplica)
    const filteredBrandRows = sourceRows.filter(r => {
      const matchYear = r.anio === selectedYear;
      const matchMonth = selectedMonths.includes(r.mesNum);
      const matchRegion = isNat ? true : (r.region === selectedRegion || r.apertura === 'Canal/Region/Drog');
      const matchCanalExclusion = r.canal !== 'Consumo Local';
      return matchYear && matchMonth && matchRegion && matchCanalExclusion;
    });

    // 2. Filtrar filas de sabores para la matriz de Sabores
    const flavorRows = (data.flavorRows || []).filter(r => {
      const matchYear = r.anio === selectedYear;
      const matchMonth = selectedMonths.includes(r.mesNum);
      const matchRegion = isNat ? true : (r.region === selectedRegion || r.region === 'TOTAL');
      const matchCanalExclusion = r.canal !== 'Consumo Local';
      return matchYear && matchMonth && matchRegion && matchCanalExclusion;
    });

    // Inicializar matrices
    const shareUnds = {};
    const shareVal = {};
    const rotacion = {};
    const precio = {};
    const distNum = {};
    const sabores = {};

    MATRIX_ROWS.forEach(row => {
      shareUnds[row.id] = {};
      shareVal[row.id] = {};
      rotacion[row.id] = {};
      precio[row.id] = {};
      distNum[row.id] = {};
      sabores[row.id] = {};
    });

    // 3. Canales individuales (Droguerias, Droguerias Independientes, Droguerias Cadena, Super Cadena, Superetes, Tradicional)
    const individualChannels = [
      'Droguerias',
      'Droguerias Independientes',
      'Droguerias Cadena',
      'Super Cadena',
      'Superetes',
      'Tradicional'
    ];

    individualChannels.forEach(canalId => {
      const canalRows = filteredBrandRows.filter(r => r.canal === canalId);
      const totalCanalUnds = canalRows.reduce((a, r) => a + (r.unds_k || 0), 0);
      const totalCanalVal = canalRows.reduce((a, r) => a + (r.val_m || 0), 0);

      MATRIX_BRANDS.forEach(b => {
        const bRows = canalRows.filter(r => r.marca === b.id);
        const sumUnds = bRows.reduce((a, r) => a + (r.unds_k || 0), 0);
        const sumVal = bRows.reduce((a, r) => a + (r.val_m || 0), 0);

        // Share Unidades & Valor
        shareUnds[canalId][b.id] = totalCanalUnds > 0 && sumUnds > 0 ? (sumUnds / totalCanalUnds) * 100 : null;
        shareVal[canalId][b.id] = totalCanalVal > 0 && sumVal > 0 ? (sumVal / totalCanalVal) * 100 : null;

        // Precio Promedio COP: CALCULATE(SUM(Vtas Valor)/SUM(Vtas Unds))
        precio[canalId][b.id] = sumUnds > 0 ? (sumVal * 1000000) / (sumUnds * 1000) : null;

        // Rotación Diaria: DAX AVERAGEX(Months, SUM(Vtas Unds) / (SUM(N. de Tiendas Venden) * Días Mes))
        const monthlyRotations = [];
        const distVals = [];

        selectedMonths.forEach(mNum => {
          const mRows = bRows.filter(r => r.mesNum === mNum);
          const mUnds = mRows.reduce((a, r) => a + (r.unds_k || 0) * 1000, 0);
          const mVenden = mRows.reduce((a, r) => a + (r.tiendas_venden || 0), 0);
          const days = new Date(selectedYear, mNum, 0).getDate();
          if (mVenden > 0 && mUnds > 0 && days > 0) {
            monthlyRotations.push(mUnds / (mVenden * days));
          }
          mRows.forEach(r => {
            if (typeof r.dist_num === 'number' && r.dist_num > 0) {
              distVals.push(r.dist_num);
            }
          });
        });

        rotacion[canalId][b.id] = monthlyRotations.length > 0 
          ? monthlyRotations.reduce((a, v) => a + v, 0) / monthlyRotations.length 
          : null;

        // Dist.Num: CALCULATE(MAXX('Nielsen Col', N. Tiendas Venden / N. Tiendas)) * 100
        const monthlyDistNums = [];
        selectedMonths.forEach(mNum => {
          const mRows = bRows.filter(r => r.mesNum === mNum);
          const sumV = mRows.reduce((a, r) => a + (r.tiendas_venden || 0), 0);
          const sumC = mRows.reduce((a, r) => a + (r.tiendas_c || 0), 0);
          if (sumC > 0 && sumV > 0) {
            monthlyDistNums.push((sumV / sumC) * 100);
          }
        });
        distNum[canalId][b.id] = monthlyDistNums.length > 0 ? Math.max(...monthlyDistNums) : null;
      });
    });

    // 4. Fila TOTAL Mercado (DAX: Apertura Canal/Region = "Total" / Apertura Canal/Region <> "Canal/Region/Drog")
    const totalNativeRows = filteredBrandRows.filter(r => r.apertura === 'Total' || r.canal === 'Total');
    const convRows = totalNativeRows.length > 0 
      ? totalNativeRows 
      : filteredBrandRows.filter(r => r.canal !== 'Droguerias Cadena' && r.canal !== 'Droguerias Independientes' && r.canal !== 'Consumo Local');

    const totalAllUnds = convRows.reduce((a, r) => a + (r.unds_k || 0), 0);
    const totalAllVal = convRows.reduce((a, r) => a + (r.val_m || 0), 0);

    MATRIX_BRANDS.forEach(b => {
      const bAllRows = convRows.filter(r => r.marca === b.id);
      const sumAllUnds = bAllRows.reduce((a, r) => a + (r.unds_k || 0), 0);
      const sumAllVal = bAllRows.reduce((a, r) => a + (r.val_m || 0), 0);

      shareUnds['Total'][b.id] = totalAllUnds > 0 && sumAllUnds > 0 ? (sumAllUnds / totalAllUnds) * 100 : null;
      shareVal['Total'][b.id] = totalAllVal > 0 && sumAllVal > 0 ? (sumAllVal / totalAllVal) * 100 : null;
      precio['Total'][b.id] = sumAllUnds > 0 ? (sumAllVal * 1000000) / (sumAllUnds * 1000) : null;

      // Rotación Total Diaria: DAX AVERAGEX(Months, SUM(Vtas Unds Conv) / (SUM(Tiendas Venden Conv) * Días Mes))
      const monthlyTotalRotations = [];

      selectedMonths.forEach(mNum => {
        const mRows = bAllRows.filter(r => r.mesNum === mNum);
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

      // Dist.Num Total: MAXX mensual de sum(N. de Tiendas Venden (C)) / sum(N. de Tiendas (C)) * 100
      const totalDistConvRows = filteredBrandRows.filter(
        r => r.marca === b.id &&
             r.canal !== 'Droguerias Cadena' &&
             r.canal !== 'Droguerias Independientes' &&
             r.canal !== 'Consumo Local' &&
             r.apertura === 'Canal'
      );
      const monthlyTotalDistNums = [];
      selectedMonths.forEach(mNum => {
        const mRows = totalDistConvRows.filter(r => r.mesNum === mNum);
        const sumV = mRows.reduce((a, r) => a + (r.tiendas_venden || 0), 0);
        const sumC = mRows.reduce((a, r) => a + (r.tiendas_c || 0), 0);
        if (sumC > 0 && sumV > 0) {
          monthlyTotalDistNums.push((sumV / sumC) * 100);
        }
      });

      distNum['Total'][b.id] = monthlyTotalDistNums.length > 0 ? Math.max(...monthlyTotalDistNums) : null;
    });

    // 5. MATRIZ 6: CONTEO DE SABORES ACTIVOS (DAX: DISTINCTCOUNT(SABOR) WHERE Vtas Unds > 0)
    MATRIX_ROWS.forEach(row => {
      const isTotalRow = row.id === 'Total';
      const totalFlavorNative = flavorRows.filter(r => r.apertura === 'Total' || r.canal === 'Total');
      const rowFlavorRows = isTotalRow
        ? (totalFlavorNative.length > 0 ? totalFlavorNative : flavorRows.filter(r => r.canal !== 'Droguerias Cadena' && r.canal !== 'Droguerias Independientes' && r.canal !== 'Consumo Local'))
        : flavorRows.filter(r => r.canal === row.id);

      MATRIX_BRANDS.forEach(b => {
        const distinctFlavors = new Set(
          rowFlavorRows
            .filter(r => r.marca === b.id && (r.unds_k > 0 || r.val_m > 0))
            .map(r => r.sabor.trim().toUpperCase())
        );
        sabores[row.id][b.id] = distinctFlavors.size > 0 ? distinctFlavors.size : null;
      });
    });

    // 6. SOM POR CANAL (% Participación del canal sobre la suma de los 4 canales convencionales)
    // Se excluye estrictamente Consumo Local y se usa como base la suma de Droguerías + Super Cadena + Superetes + Tradicional
    const convChannels = ['Droguerias', 'Super Cadena', 'Superetes', 'Tradicional'];
    const convOnlyRows = filteredBrandRows.filter(r => convChannels.includes(r.canal) && (r.apertura === 'Canal' || selectedRegion !== 'TOTAL'));
    const sumConvUnds = convOnlyRows.reduce((a, r) => a + (r.unds_k || 0), 0);
    const sumConvVal = convOnlyRows.reduce((a, r) => a + (r.val_m || 0), 0);

    const channelSomUnds = {};
    const channelSomVal = {};

    individualChannels.forEach(canalId => {
      const canalRows = filteredBrandRows.filter(r => r.canal === canalId);
      const totalCanalUnds = canalRows.reduce((a, r) => a + (r.unds_k || 0), 0);
      const totalCanalVal = canalRows.reduce((a, r) => a + (r.val_m || 0), 0);

      channelSomUnds[canalId] = sumConvUnds > 0 && totalCanalUnds > 0 ? (totalCanalUnds / sumConvUnds) * 100 : 0;
      channelSomVal[canalId] = sumConvVal > 0 && totalCanalVal > 0 ? (totalCanalVal / sumConvVal) * 100 : 0;
    });

    // En la fila Total señalamos el 100.0%
    channelSomUnds['Total'] = 100.0;
    channelSomVal['Total'] = 100.0;

    return { shareUnds, shareVal, rotacion, precio, distNum, sabores, channelSomUnds, channelSomVal };
  }, [data, selectedYear, selectedMonths, selectedRegion]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#00529B] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cargando Matriz KPI's Colombia...</p>
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

          {/* CENTRO: TÍTULO CENTRADO A LA HOJA O VISTA */}
          <div className="flex-1 flex items-center justify-center text-center">
            <h1 className="text-base md:text-xl font-black text-[#00529B] tracking-tight">
              Matriz KPI´s
            </h1>
          </div>

          {/* CONTROLES / SEGMENTADORES SUPERIORES (DERECHA) */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            
            {/* 1. Segmentador de Año (Orden de menor a mayor: 2024, 2025, 2026) */}
            <div className="relative" ref={yearRef}>
              <button
                onClick={() => { setYearDropdownOpen(!yearDropdownOpen); setMonthDropdownOpen(false); setRegionDropdownOpen(false); }}
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
                onClick={() => { setMonthDropdownOpen(!monthDropdownOpen); setYearDropdownOpen(false); setRegionDropdownOpen(false); }}
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

            {/* 3. Segmentador de Región (Píldora Azul Corporativa con Icono) */}
            <div className="relative" ref={regionRef}>
              <button
                onClick={() => { setRegionDropdownOpen(!regionDropdownOpen); setYearDropdownOpen(false); setMonthDropdownOpen(false); }}
                className="flex items-center justify-between gap-2 bg-[#00529B] hover:bg-[#004080] border border-[#00529B] rounded-xl px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs transition-all cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-white" />
                <span className="truncate max-w-[130px]">{selectedRegion}</span>
                <ChevronDown className="w-3.5 h-3.5 text-white/90" />
              </button>

              {regionDropdownOpen && (
                <div className="absolute right-0 top-10 bg-white border border-slate-200 shadow-xl rounded-xl p-1.5 w-48 z-50 animate-in fade-in max-h-56 overflow-y-auto">
                  {REGIONS_LIST.map(reg => (
                    <button
                      key={reg}
                      onClick={() => { setSelectedRegion(reg); setRegionDropdownOpen(false); }}
                      className={`w-full text-left px-2.5 py-1.5 text-xs font-bold rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                        selectedRegion === reg ? 'bg-[#00529B] text-white' : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="truncate">{reg}</span>
                      {selectedRegion === reg && <Check className="w-3.5 h-3.5 text-white" />}
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

      {/* 2. CONTENIDO PRINCIPAL: GRID 2x3 DE TABLAS MATRIZ KPI */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto p-3 md:p-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
          
          {/* Matriz 1: Share Unidades */}
          <KpiMatrixTable
            title="Share Unidades"
            metricType="share_unds"
            matrixData={calculatedMatrices.shareUnds}
            channelSom={calculatedMatrices.channelSomUnds}
            selectedRegion={selectedRegion}
          />

          {/* Matriz 2: Share $ (Valor) */}
          <KpiMatrixTable
            title="Share $"
            metricType="share_val"
            matrixData={calculatedMatrices.shareVal}
            channelSom={calculatedMatrices.channelSomVal}
            selectedRegion={selectedRegion}
          />

          {/* Matriz 3: Rotación */}
          <KpiMatrixTable
            title="Rotación"
            metricType="rotacion"
            matrixData={calculatedMatrices.rotacion}
            selectedRegion={selectedRegion}
          />

          {/* Matriz 4: Precio */}
          <KpiMatrixTable
            title="Precio"
            metricType="precio"
            matrixData={calculatedMatrices.precio}
            selectedRegion={selectedRegion}
          />

          {/* Matriz 5: Dist. Num. */}
          <KpiMatrixTable
            title="Dist. Num."
            metricType="dist_num"
            matrixData={calculatedMatrices.distNum}
            selectedRegion={selectedRegion}
          />

          {/* Matriz 6: Sabores (Apertura por Sabor) */}
          <KpiMatrixTable
            title="Sabores"
            metricType="sabores"
            matrixData={calculatedMatrices.sabores}
            selectedRegion={selectedRegion}
          />

        </div>
      </main>

    </div>
  );
};

export default ColombiaMatrizKpisView;
