import React, { useState, useRef, useEffect, useMemo } from 'react';

// Paleta oficial de colores extraída directamente del "Manual de estilo de marca Electrolit"
// y adaptada a la clasificación homologada oficial
export const FLAVOR_COLOR_PALETTE = {
  'PONCHE DE FRUTAS': '#F70103', // Rojo Pasión Oficial
  'NARANJA': '#FF8000',          // Naranja Intenso
  'MARACUYA': '#E2B72D',         // Amarillo Mostaza
  'FRESA/KIWI': '#E6B4A5',       // Salmón Kiwi Fresa
  'FRESA': '#DE6A73',            // Rosa Fresa
  'MORA AZUL': '#7179BD',        // Violeta Mora
  'BLUE RASPBERRY': '#16A1D3',   // Azul Eléctrico
  'UVA': '#724678',              // Púrpura Uva
  'MANZANA': '#A86C41',          // Marrón Manzana
  'LIMON': '#84CC16',            // Verde Limón
  'COCO': '#8DA0B6',             // Gris Perla Coco
  'PIÑA': '#F59E0B',             // Piña
  'CEREZA': '#E11D48',           // Cereza
  'JAMAICA': '#770A17',          // Vino Tinto Jamaica
  'GUARANA': '#9333EA',          // Guaraná
  'OTROS SABORES': '#64748B'     // Gris Pizarra Neutro
};

export function getFlavorColor(flavorName, index = 0) {
  if (!flavorName) return '#64748B';
  const upper = flavorName.toUpperCase().trim();

  // Coincidencias exactas
  if (FLAVOR_COLOR_PALETTE[upper]) return FLAVOR_COLOR_PALETTE[upper];

  // Coincidencias por patrones
  if (upper.includes('PONCHE') || upper.includes('TROPICAL') || upper.includes('ROJOS')) return '#F70103';
  if (upper.includes('NARANJA') || upper.includes('MANDARINA')) return '#FF8000';
  if (upper.includes('MARACUY')) return '#E2B72D';
  if (upper.includes('KIWI') || upper.includes('FRESA/KIWI')) return '#E6B4A5';
  if (upper.includes('FRESA')) return '#DE6A73';
  if (upper.includes('MORA')) return '#7179BD';
  if (upper.includes('BLUE') || upper.includes('AZUL') || upper.includes('RASPBERRY')) return '#16A1D3';
  if (upper.includes('UVA')) return '#724678';
  if (upper.includes('MANZANA')) return '#A86C41';
  if (upper.includes('LIMON') || upper.includes('LIMA')) return '#84CC16';
  if (upper.includes('COCO')) return '#8DA0B6';
  if (upper.includes('PIÑA') || upper.includes('PINA')) return '#F59E0B';
  if (upper.includes('CEREZA')) return '#E11D48';
  if (upper.includes('JAMAICA')) return '#770A17';
  if (upper.includes('GUARANA')) return '#9333EA';

  return '#64748B';
}

/**
 * Componente PowerBiRibbonChart (Gráfico de Cintas / Ribbon Chart de Sabores Power BI)
 */
const PowerBiRibbonChart = ({
  series = [],
  flavorsList = [],
  height = 230
}) => {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(380);
  const [hoveredInfo, setHoveredInfo] = useState(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 50) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Dimensiones del canvas SVG
  const margin = { top: 28, right: 18, bottom: 44, left: 20 };
  const chartWidth = Math.max(containerWidth - margin.left - margin.right, 100);
  const chartHeight = Math.max(height - margin.top - margin.bottom, 80);

  // Determinar si hay datos con volumen
  const hasData = useMemo(() => {
    return series.some(pt => (pt.total || 0) > 0);
  }, [series]);

  const activeSeries = useMemo(() => {
    if (!series || series.length === 0) return [];
    return series;
  }, [series]);

  // Calcular valor máximo de Total para la escala Y
  const maxTotalVal = useMemo(() => {
    if (!hasData) return 100;
    const maxVal = Math.max(...activeSeries.map(s => s.total || 0), 10);
    return Math.ceil(maxVal * 1.15);
  }, [activeSeries, hasData]);

  // Cálculo de posiciones de columnas y segmentos por mes
  const monthColumns = useMemo(() => {
    if (activeSeries.length === 0) return [];

    const numPoints = activeSeries.length;
    const stepX = numPoints > 1 ? chartWidth / (numPoints - 1) : chartWidth / 2;
    const barWidth = Math.max(Math.min(stepX * 0.46, 32), 16);

    return activeSeries.map((item, idx) => {
      const cx = numPoints > 1 ? margin.left + idx * stepX : margin.left + chartWidth / 2;
      const total = item.total || 0;

      // Obtener sabores ordenados: menor volumen en la base (abajo) y mayor volumen en el tope (arriba)
      const flavorsInMonth = flavorsList
        .map(f => ({ sabor: f, val: item[f] || 0 }))
        .filter(f => f.val > 0)
        .sort((a, b) => a.val - b.val);

      let currentYVal = 0;
      const segments = [];

      flavorsInMonth.forEach((fObj) => {
        const yStartVal = currentYVal;
        const yEndVal = currentYVal + fObj.val;
        currentYVal = yEndVal;

        const yTop = margin.top + chartHeight - (yEndVal / maxTotalVal) * chartHeight;
        const yBottom = margin.top + chartHeight - (yStartVal / maxTotalVal) * chartHeight;
        const segHeight = Math.max(yBottom - yTop, 1);

        segments.push({
          sabor: fObj.sabor,
          val: fObj.val,
          yTop,
          yBottom,
          segHeight,
          color: getFlavorColor(fObj.sabor)
        });
      });

      const rawTopY = total > 0 
        ? margin.top + chartHeight - (total / maxTotalVal) * chartHeight 
        : margin.top + chartHeight;

      // Etiqueta limpia directamente encima de la barra (sin líneas conectoras)
      const labelY = Math.max(rawTopY - 10, margin.top - 12);

      return {
        idx,
        mesCode: item.mesCode,
        total,
        cx,
        barWidth,
        topY: rawTopY,
        labelY,
        segments
      };
    });
  }, [activeSeries, flavorsList, chartWidth, chartHeight, margin, maxTotalVal]);

  // Generación de cintas (Ribbons) entre columnas adyacentes
  const ribbons = useMemo(() => {
    if (!hasData || monthColumns.length < 2) return [];

    const ribbonPaths = [];

    for (let i = 0; i < monthColumns.length - 1; i++) {
      const colA = monthColumns[i];
      const colB = monthColumns[i + 1];

      const x1 = colA.cx + colA.barWidth / 2;
      const x2 = colB.cx - colB.barWidth / 2;
      const cpDist = (x2 - x1) * 0.5;

      flavorsList.forEach(flavor => {
        const segA = colA.segments.find(s => s.sabor === flavor);
        const segB = colB.segments.find(s => s.sabor === flavor);

        if (!segA && !segB) return;

        const yA_top = segA ? segA.yTop : (margin.top + chartHeight);
        const yA_bot = segA ? segA.yBottom : (margin.top + chartHeight);
        const yB_top = segB ? segB.yTop : (margin.top + chartHeight);
        const yB_bot = segB ? segB.yBottom : (margin.top + chartHeight);

        if (Math.abs(yA_bot - yA_top) < 0.5 && Math.abs(yB_bot - yB_top) < 0.5) return;

        const d = `
          M ${x1} ${yA_top}
          C ${x1 + cpDist} ${yA_top}, ${x2 - cpDist} ${yB_top}, ${x2} ${yB_top}
          L ${x2} ${yB_bot}
          C ${x2 - cpDist} ${yB_bot}, ${x1 + cpDist} ${yA_bot}, ${x1} ${yA_bot}
          Z
        `;

        ribbonPaths.push({
          key: `${colA.mesCode}-${colB.mesCode}-${flavor}`,
          d,
          color: getFlavorColor(flavor),
          flavor,
          colA_mes: colA.mesCode,
          colB_mes: colB.mesCode,
          colA_total: colA.total,
          colB_total: colB.total,
          midX: (x1 + x2) / 2,
          valA: segA ? segA.val : 0,
          valB: segB ? segB.val : 0
        });
      });
    }

    return ribbonPaths;
  }, [monthColumns, flavorsList, hasData, margin.top, chartHeight]);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full select-none flex flex-col" 
      onMouseLeave={() => setHoveredInfo(null)}
    >
      <svg width={containerWidth} height={height} className="overflow-visible">
        
        {/* LÍNEAS DE CUADRÍCULA HORIZONTALES */}
        <line
          x1={margin.left}
          y1={margin.top}
          x2={margin.left + chartWidth}
          y2={margin.top}
          stroke="#f1f5f9"
          strokeDasharray="2 2"
          strokeWidth="0.8"
        />
        <line
          x1={margin.left}
          y1={margin.top + chartHeight / 2}
          x2={margin.left + chartWidth}
          y2={margin.top + chartHeight / 2}
          stroke="#f8fafc"
          strokeDasharray="2 2"
          strokeWidth="0.8"
        />

        {/* 1. CINTAS FLUIDAS ENTRE MESES */}
        <g className="ribbon-bands">
          {ribbons.map(rib => (
            <path
              key={rib.key}
              d={rib.d}
              fill={rib.color}
              fillOpacity="0.75"
              className="transition-opacity duration-150 cursor-pointer hover:fill-opacity-95"
              onMouseEnter={(e) => {
                const rect = containerRef.current.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const isB = mouseX >= rib.midX;
                setHoveredInfo({
                  mesCode: isB ? rib.colB_mes : rib.colA_mes,
                  sabor: rib.flavor,
                  val: Math.round(isB ? rib.valB : rib.valA),
                  total: Math.round(isB ? rib.colB_total : rib.colA_total),
                  x: mouseX,
                  y: e.clientY - rect.top
                });
              }}
              onMouseMove={(e) => {
                const rect = containerRef.current.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const isB = mouseX >= rib.midX;
                setHoveredInfo({
                  mesCode: isB ? rib.colB_mes : rib.colA_mes,
                  sabor: rib.flavor,
                  val: Math.round(isB ? rib.valB : rib.valA),
                  total: Math.round(isB ? rib.colB_total : rib.colA_total),
                  x: mouseX,
                  y: e.clientY - rect.top
                });
              }}
            />
          ))}
        </g>

        {/* 2. COLUMNAS Y SEGMENTOS */}
        <g className="month-bars">
          {monthColumns.map(col => (
            <g key={col.mesCode}>
              {/* Línea guía vertical */}
              <line
                x1={col.cx}
                y1={margin.top}
                x2={col.cx}
                y2={margin.top + chartHeight}
                stroke="#f1f5f9"
                strokeDasharray="2 2"
                strokeWidth="0.8"
              />

              {/* Segmentos apilados */}
              {col.segments.map(seg => (
                <rect
                  key={`${col.mesCode}-${seg.sabor}`}
                  x={col.cx - col.barWidth / 2}
                  y={seg.yTop}
                  width={col.barWidth}
                  height={seg.segHeight}
                  fill={seg.color}
                  fillOpacity="0.95"
                  rx="1"
                  className="cursor-pointer transition-all hover:opacity-100 hover:brightness-105"
                  onMouseEnter={(e) => {
                    const rect = containerRef.current.getBoundingClientRect();
                    setHoveredInfo({
                      mesCode: col.mesCode,
                      sabor: seg.sabor,
                      val: Math.round(seg.val),
                      total: Math.round(col.total),
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top
                    });
                  }}
                  onMouseMove={(e) => {
                    const rect = containerRef.current.getBoundingClientRect();
                    setHoveredInfo(prev => prev ? {
                      ...prev,
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top
                    } : null);
                  }}
                />
              ))}
            </g>
          ))}
        </g>

        {/* 3. CAPA SUPERIOR: ETIQUETAS DE DATOS (SIN LÍNEA CONECTORA, DIRECTAMENTE SOBRE LA BARRA) */}
        <g className="data-labels-layer">
          {monthColumns.map(col => {
            if (col.total <= 0) return null;
            const labelStr = Math.round(col.total).toLocaleString();
            const badgeW = Math.max(labelStr.length * 6.5 + 8, 22);
            const badgeH = 12.5;

            return (
              <g key={`badge-${col.mesCode}`}>
                {/* Pastilla sólida de fondo */}
                <rect
                  x={col.cx - badgeW / 2}
                  y={col.labelY - badgeH / 2}
                  width={badgeW}
                  height={badgeH}
                  rx="3.5"
                  fill="#ffffff"
                  stroke="#cbd5e1"
                  strokeWidth="0.8"
                  className="filter drop-shadow-xs"
                />

                {/* Texto Total */}
                <text
                  x={col.cx}
                  y={col.labelY + 3.2}
                  textAnchor="middle"
                  fontSize="8"
                  fontWeight="900"
                  fill="#0f172a"
                  fontFamily="system-ui, -apple-system, sans-serif"
                >
                  {labelStr}
                </text>
              </g>
            );
          })}
        </g>

        {/* 4. EJE X HORIZONTAL BASE Y TICKS */}
        <line
          x1={margin.left}
          y1={margin.top + chartHeight}
          x2={margin.left + chartWidth}
          y2={margin.top + chartHeight}
          stroke="#64748b"
          strokeWidth="1.2"
        />

        {/* ETIQUETAS DE MESES DEL EJE X (INCLINADAS A -45°) */}
        {monthColumns.map(col => (
          <g key={`tick-${col.mesCode}`} transform={`translate(${col.cx}, ${margin.top + chartHeight})`}>
            <line x1="0" y1="0" x2="0" y2="4" stroke="#64748b" strokeWidth="1" />
            <text
              x="-6"
              y="14"
              transform="rotate(-45, -6, 14)"
              textAnchor="end"
              fontSize="8.5"
              fontWeight="700"
              fill="#334155"
            >
              {col.mesCode}
            </text>
          </g>
        ))}

      </svg>

      {/* ===================================================================== */}
      {/* TOOLTIP OSCURO POWER BI EXACTO CON COLOR OFICIAL POR SABOR            */}
      {/* ===================================================================== */}
      {hoveredInfo && (
        <div
          className="absolute z-50 pointer-events-none bg-[#1e293b]/95 backdrop-blur-xs text-white rounded-lg p-2.5 shadow-2xl border border-slate-600/80 text-[10.5px] font-sans animate-in fade-in duration-100 min-w-[145px]"
          style={{
            left: Math.min(hoveredInfo.x + 12, containerWidth - 155),
            top: Math.max(hoveredInfo.y - 65, 5)
          }}
        >
          <div className="flex items-center justify-between gap-3 text-slate-300 border-b border-slate-600/60 pb-1 mb-1.5 text-[9.5px]">
            <span className="font-bold text-slate-400">MesAño:</span>
            <span className="font-extrabold text-white">{hoveredInfo.mesCode}</span>
          </div>

          <div className="flex items-center justify-between gap-3 mb-1">
            <span className="text-slate-400 font-semibold">SABOR:</span>
            <span 
              className="font-black uppercase flex items-center gap-1.5"
              style={{ color: getFlavorColor(hoveredInfo.sabor) }}
            >
              <span 
                className="w-2 h-2 rounded-full inline-block" 
                style={{ backgroundColor: getFlavorColor(hoveredInfo.sabor) }}
              />
              {hoveredInfo.sabor}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 mb-1">
            <span className="text-slate-400 font-semibold">Vta KPI_Cat:</span>
            <span className="font-black text-white">
              {typeof hoveredInfo.val === 'number'
                ? (Number.isInteger(hoveredInfo.val) ? hoveredInfo.val.toLocaleString() : Number(hoveredInfo.val).toFixed(1))
                : hoveredInfo.val}
            </span>
          </div>

          {hoveredInfo.total !== null && (
            <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-600/60 text-slate-300">
              <span className="text-slate-400 font-semibold">Total:</span>
              <span className="font-bold text-white">
                {typeof hoveredInfo.total === 'number'
                  ? (Number.isInteger(hoveredInfo.total) ? hoveredInfo.total.toLocaleString() : Number(hoveredInfo.total).toFixed(1))
                  : hoveredInfo.total}
              </span>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default PowerBiRibbonChart;
