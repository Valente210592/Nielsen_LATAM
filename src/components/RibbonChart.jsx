import React, { useState } from 'react';

const FLAVOR_COLORS = {
  'UVA': '#5c4376',
  'MORA AZUL': '#5073b8',
  'FRESA': '#d96b7d',
  'FRESA KIWI': '#e8998d',
  'MARACUYA': '#e5a038',
  'COCO': '#eee9df',
  'NARANJA MANDARINA': '#e76f51',
  'LIMA LIMON': '#2a9d8f',
  'MANZANA': '#c49a6c',
  'JAMAICA': '#9b2226',
  'PONCHE DE FRUTAS': '#c0392b',
  'LIMON': '#52b788',
  'SURTIDO': '#8d99ae',
  'SABORES': '#6c757d',
  'DEFAULT': '#8e7cc3'
};

const PALETTE = [
  '#5073b8', '#5c4376', '#e8998d', '#d96b7d', '#e5a038', 
  '#f5ca68', '#7ea875', '#2a9d8f', '#e76f51', '#9b2226', 
  '#52b788', '#8d99ae', '#457b9d', '#1d3557', '#e63946'
];

export default function RibbonChart({ data = [], title = '', height = 400 }) {
  const [hoveredFlavor, setHoveredFlavor] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-slate-400 text-sm font-semibold">
        Sin datos disponibles
      </div>
    );
  }

  // 1. Obtener lista global de sabores para consistencia de colores
  const flavorTotals = {};
  data.forEach(d => {
    if (d.sabores) {
      Object.entries(d.sabores).forEach(([sabor, val]) => {
        flavorTotals[sabor] = (flavorTotals[sabor] || 0) + Number(val || 0);
      });
    }
  });

  const allFlavors = Object.keys(flavorTotals).sort((a, b) => flavorTotals[b] - flavorTotals[a]);

  const getColor = (sabor, index) => {
    return FLAVOR_COLORS[sabor.toUpperCase()] || PALETTE[index % PALETTE.length];
  };

  const svgWidth = 800;
  const svgHeight = height;
  const paddingLeft = 32;
  const paddingRight = 32;
  const paddingTop = 46;
  const paddingBottom = 40;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const numCols = data.length;
  const barWidth = 34;

  // Encontrar el valor máximo mensual para escalar proporcionalmente la altura
  const maxTotal = Math.max(...data.map(d => d.total_k || 1), 1) * 1.12;

  // 2. ORDENAMIENTO DINÁMICO MES A MES (Efecto Power BI Ribbon Chart)
  // En cada mes, los sabores se ordenan de MAYOR a MENOR venta de ESE MES específico
  const columns = data.map((d, colIdx) => {
    const cx = paddingLeft + (colIdx * (chartWidth / (numCols > 1 ? numCols - 1 : 1)));
    const totalVal = d.total_k || 0;
    
    const totalPx = (totalVal / maxTotal) * chartHeight;
    const colBottom = paddingTop + chartHeight;
    const colTop = colBottom - totalPx;

    // Extraer y ordenar los sabores de este mes particular en orden descendente
    const monthFlavors = Object.entries(d.sabores || {})
      .map(([sabor, val]) => ({ sabor, val: Number(val || 0) }))
      .filter(f => f.val > 0)
      .sort((a, b) => b.val - a.val); // El sabor #1 del mes queda en la cima

    let currentY = colTop;
    const segments = [];

    monthFlavors.forEach((item) => {
      const segHeight = (item.val / maxTotal) * chartHeight;
      const yTop = currentY;
      const yBottom = currentY + segHeight;
      const fIdx = allFlavors.indexOf(item.sabor);

      segments.push({
        sabor: item.sabor,
        val: item.val,
        yTop,
        yBottom,
        segHeight,
        color: getColor(item.sabor, fIdx >= 0 ? fIdx : 0)
      });

      currentY = yBottom;
    });

    return {
      cx,
      colBottom,
      colTop,
      mes_label: d.mes_label,
      total_k: Math.round(totalVal),
      segments
    };
  });

  // 3. GENERAR CINTAS DE FLUJO INTERLAZADAS (Ribbons conectando mes t con mes t+1)
  const ribbons = [];
  for (let c = 0; c < columns.length - 1; c++) {
    const colA = columns[c];
    const colB = columns[c + 1];
    const xA = colA.cx + barWidth / 2;
    const xB = colB.cx - barWidth / 2;
    const dx = (xB - xA) * 0.5;

    // Conectar todos los sabores que tengan presencia en colA y/o colB
    allFlavors.forEach((sabor, fIdx) => {
      const segA = colA.segments.find(s => s.sabor === sabor);
      const segB = colB.segments.find(s => s.sabor === sabor);

      if (segA && segB) {
        // El sabor está presente en ambos meses: se dibuja la cinta con su transición de ranking
        const path = `M ${xA} ${segA.yTop} C ${xA + dx} ${segA.yTop}, ${xB - dx} ${segB.yTop}, ${xB} ${segB.yTop} L ${xB} ${segB.yBottom} C ${xB - dx} ${segB.yBottom}, ${xA + dx} ${segA.yBottom}, ${xA} ${segA.yBottom} Z`;
        ribbons.push({
          key: `${c}-${sabor}`,
          sabor,
          color: getColor(sabor, fIdx),
          path,
          rankA: colA.segments.indexOf(segA),
          rankB: colB.segments.indexOf(segB)
        });
      } else if (segA && !segB) {
        // El sabor sale del top o cae a 0: se desvanece suavemente
        const path = `M ${xA} ${segA.yTop} C ${xA + dx} ${segA.yTop}, ${xB - dx} ${colB.colBottom}, ${xB} ${colB.colBottom} L ${xB} ${colB.colBottom} C ${xB - dx} ${colB.colBottom}, ${xA + dx} ${segA.yBottom}, ${xA} ${segA.yBottom} Z`;
        ribbons.push({
          key: `${c}-${sabor}-out`,
          sabor,
          color: getColor(sabor, fIdx),
          path,
          rankA: colA.segments.indexOf(segA),
          rankB: 99
        });
      } else if (!segA && segB) {
        // El sabor entra nuevo al ranking: emerge suavemente
        const path = `M ${xA} ${colA.colBottom} C ${xA + dx} ${colA.colBottom}, ${xB - dx} ${segB.yTop}, ${xB} ${segB.yTop} L ${xB} ${segB.yBottom} C ${xB - dx} ${segB.yBottom}, ${xA + dx} ${colA.colBottom}, ${xA} ${colA.colBottom} Z`;
        ribbons.push({
          key: `${c}-${sabor}-in`,
          sabor,
          color: getColor(sabor, fIdx),
          path,
          rankA: 99,
          rankB: colB.segments.indexOf(segB)
        });
      }
    });
  }

  return (
    <div className="w-full flex flex-col items-center select-none">
      <div className="w-full relative">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto overflow-visible">
          {/* Cintas entrelazadas de flujo (Ribbons con curvas Bézier) */}
          <g>
            {ribbons.map(r => {
              const isHovered = hoveredFlavor === r.sabor;
              const isDimmed = hoveredFlavor && !isHovered;
              return (
                <path
                  key={r.key}
                  d={r.path}
                  fill={r.color}
                  fillOpacity={isHovered ? 0.94 : isDimmed ? 0.12 : 0.68}
                  className="transition-all duration-200 cursor-pointer"
                  onMouseEnter={() => setHoveredFlavor(r.sabor)}
                  onMouseLeave={() => setHoveredFlavor(null)}
                />
              );
            })}
          </g>

          {/* Columnas mensuales con segmentos apilados por ranking */}
          <g>
            {columns.map((col, cIdx) => (
              <g key={cIdx}>
                {col.segments.map((seg, sIdx) => {
                  const isHovered = hoveredFlavor === seg.sabor;
                  const isDimmed = hoveredFlavor && !isHovered;
                  return (
                    <rect
                      key={sIdx}
                      x={col.cx - barWidth / 2}
                      y={seg.yTop}
                      width={barWidth}
                      height={seg.segHeight}
                      fill={seg.color}
                      opacity={isHovered ? 1 : isDimmed ? 0.22 : 0.94}
                      rx={1}
                      className="transition-all duration-200 cursor-pointer"
                      onMouseEnter={() => setHoveredFlavor(seg.sabor)}
                      onMouseLeave={() => setHoveredFlavor(null)}
                    >
                      <title>{`#${sIdx + 1} ${seg.sabor}: ${seg.val.toLocaleString()}k`}</title>
                    </rect>
                  );
                })}

                {/* Badge con total mensual en la cima */}
                {col.total_k > 0 && (
                  <g>
                    <rect
                      x={col.cx - 24}
                      y={col.colTop - 26}
                      width={48}
                      height={21}
                      rx={5}
                      fill="#ffffff"
                      stroke="#cbd5e1"
                      strokeWidth={1.2}
                      className="shadow-sm"
                    />
                    <text
                      x={col.cx}
                      y={col.colTop - 11}
                      textAnchor="middle"
                      fontSize={13}
                      fontWeight="500"
                      fill="#0f172a"
                    >
                      {col.total_k.toLocaleString()}
                    </text>
                  </g>
                )}

                {/* Etiqueta del mes en la base */}
                <text
                  x={col.cx}
                  y={paddingTop + chartHeight + 24}
                  textAnchor="middle"
                  fontSize={12}
                  fill="#475569"
                  fontWeight="700"
                >
                  {col.mes_label ? col.mes_label.toLowerCase() : ''}
                </text>
              </g>
            ))}
          </g>
        </svg>
      </div>

      {/* Tooltip de sabor activo al interactuar */}
      {hoveredFlavor && (
        <div className="mt-3 text-xs font-black px-5 py-2 bg-slate-900 text-white rounded-full shadow-lg flex items-center gap-2.5">
          <span 
            className="w-3.5 h-3.5 rounded-full ring-2 ring-white" 
            style={{ backgroundColor: FLAVOR_COLORS[hoveredFlavor.toUpperCase()] || '#3b82f6' }}
          />
          <span className="tracking-wide">Sabor: {hoveredFlavor}</span>
        </div>
      )}
    </div>
  );
}
