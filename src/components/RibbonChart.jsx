import React, { useState } from 'react';

const FLAVOR_COLORS = {
  'UVA': '#5c4376',
  'MORA AZUL': '#5073b8',
  'FRESA': '#d96b7d',
  'FRESA KIWI': '#e8998d',
  'FRESA-KIWI': '#e8998d',
  'MARACUYA': '#e5a038',
  'MARACUYÁ': '#e5a038',
  'COCO': '#eee9df',
  'NARANJA': '#e76f51',
  'NARANJA MANDARINA': '#e76f51',
  'MANDARINA': '#f97316',
  'BLUE RASPBERRY': '#0284c7',
  'TROPICAL': '#14b8a6',
  'COOL BLUE': '#38bdf8',
  'FRUIT PUNCH': '#ef4444',
  'LIMÓN': '#84cc16',
  'LIMON': '#84cc16',
  'MOUNTAIN BERRY': '#a855f7',
  'ORANGE': '#f97316',
  'LIME': '#84cc16',
  'ARÁNDANO': '#6366f1',
  'LIMA LIMON': '#2a9d8f',
  'MANZANA': '#c49a6c',
  'MANZANA VERDE': '#22c55e',
  'JAMAICA': '#9b2226',
  'PONCHE DE FRUTAS': '#c0392b',
  'SURTIDO': '#8d99ae',
  'OTROS SABORES': '#8d99ae',
  'OTROS': '#8d99ae',
  'SABORES': '#6c757d',
  'DEFAULT': '#8e7cc3'
};

const PALETTE = [
  '#e8998d', '#5c4376', '#d96b7d', '#e5a038', '#22c55e',
  '#e76f51', '#f97316', '#0284c7', '#14b8a6', '#38bdf8',
  '#ef4444', '#84cc16', '#a855f7', '#6366f1', '#8d99ae'
];

export default function RibbonChart({ data = [], title = '', height = 380 }) {
  const [hoveredFlavor, setHoveredFlavor] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-slate-400 text-sm font-semibold">
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
  const paddingTop = 44;
  const paddingBottom = 44;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;
  const colBottom = paddingTop + chartHeight; // Límite inferior estricto del eje

  const numCols = data.length;
  const barWidth = 34;

  // Encontrar el valor máximo mensual para escalar proporcionalmente la altura
  const maxTotal = Math.max(...data.map(d => {
    const sumFlavors = Object.values(d.sabores || {}).reduce((acc, v) => acc + Number(v || 0), 0);
    return Math.max(Number(d.total_k || 0), sumFlavors);
  }), 1) * 1.18;

  // 2. ORDENAMIENTO Y APILAMIENTO RESPETANDO ESTRICTAMENTE EL EJE INFERIOR
  const columns = data.map((d, colIdx) => {
    const cx = paddingLeft + (colIdx * (chartWidth / (numCols > 1 ? numCols - 1 : 1)));
    
    // Extraer y ordenar los sabores del mes por ranking descendente
    const monthFlavors = Object.entries(d.sabores || {})
      .map(([sabor, val]) => ({ sabor, val: Number(val || 0) }))
      .filter(f => f.val > 0)
      .sort((a, b) => b.val - a.val);

    const sumFlavorVals = monthFlavors.reduce((acc, f) => acc + f.val, 0);
    const totalVal = (d.total_k !== undefined && d.total_k !== null && d.total_k > 0) 
      ? Number(d.total_k) 
      : sumFlavorVals;
    
    // Altura proporcional que nunca excede chartHeight y mantiene un mínimo visible
    const totalPx = Math.max(16, (totalVal / maxTotal) * chartHeight);
    const colTop = colBottom - totalPx;

    let currentY = colTop;
    const segments = [];

    monthFlavors.forEach((item) => {
      // Normalización estricta: la suma de alturas es EXACTAMENTE igual a totalPx
      const segRatio = sumFlavorVals > 0 ? (item.val / sumFlavorVals) : (1 / monthFlavors.length);
      const segHeight = segRatio * totalPx;
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

  // 3. GENERAR CINTAS DE FLUJO INTERLAZADAS (Ribbons con curvas Bézier contenidas)
  const ribbons = [];
  for (let c = 0; c < columns.length - 1; c++) {
    const colA = columns[c];
    const colB = columns[c + 1];
    const xA = colA.cx + barWidth / 2;
    const xB = colB.cx - barWidth / 2;
    const dx = (xB - xA) * 0.5;

    allFlavors.forEach((sabor, fIdx) => {
      const segA = colA.segments.find(s => s.sabor === sabor);
      const segB = colB.segments.find(s => s.sabor === sabor);

      if (segA && segB) {
        // Conexión continua entre dos meses
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
        // Desvanecimiento suave hacia la base
        const path = `M ${xA} ${segA.yTop} C ${xA + dx} ${segA.yTop}, ${xB - dx} ${colBottom}, ${xB} ${colBottom} L ${xB} ${colBottom} C ${xB - dx} ${colBottom}, ${xA + dx} ${segA.yBottom}, ${xA} ${segA.yBottom} Z`;
        ribbons.push({
          key: `${c}-${sabor}-out`,
          sabor,
          color: getColor(sabor, fIdx),
          path,
          rankA: colA.segments.indexOf(segA),
          rankB: 99
        });
      } else if (!segA && segB) {
        // Emergencia suave desde la base
        const path = `M ${xA} ${colBottom} C ${xA + dx} ${colBottom}, ${xB - dx} ${segB.yTop}, ${xB} ${segB.yTop} L ${xB} ${segB.yBottom} C ${xB - dx} ${segB.yBottom}, ${xA + dx} ${colBottom}, ${xA} ${colBottom} Z`;
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
          {/* Línea de Base Eje X */}
          <line
            x1={paddingLeft - 8}
            y1={colBottom}
            x2={svgWidth - paddingRight + 8}
            y2={colBottom}
            stroke="#e2e8f0"
            strokeWidth={1.2}
          />

          {/* Cintas entrelazadas de flujo */}
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

          {/* Columnas mensuales con segmentos apilados contenidos en el eje */}
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
                      x={col.cx - 22}
                      y={col.colTop - 25}
                      width={44}
                      height={20}
                      rx={4}
                      fill="#ffffff"
                      stroke="#cbd5e1"
                      strokeWidth={1.2}
                      className="shadow-2xs"
                    />
                    <text
                      x={col.cx}
                      y={col.colTop - 11}
                      textAnchor="middle"
                      fontSize={12}
                      fontWeight="600"
                      fill="#0f172a"
                    >
                      {col.total_k.toLocaleString()}
                    </text>
                  </g>
                )}

                {/* Etiqueta del mes en la base (con separación adecuada del eje) */}
                <text
                  x={col.cx}
                  y={colBottom + 22}
                  textAnchor="middle"
                  fontSize={11.5}
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
        <div className="mt-2 text-xs font-black px-4 py-1.5 bg-slate-900 text-white rounded-full shadow-lg flex items-center gap-2">
          <span 
            className="w-3 h-3 rounded-full ring-2 ring-white" 
            style={{ backgroundColor: FLAVOR_COLORS[hoveredFlavor.toUpperCase()] || '#3b82f6' }}
          />
          <span className="tracking-wide">Sabor: {hoveredFlavor}</span>
        </div>
      )}
    </div>
  );
}
