import React, { useState, useEffect, useMemo } from 'react';
import { Home, Calendar, Filter, ChevronDown, Check } from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid
} from 'recharts';

const MONTHS_LIST = [
  { num: 1, short: 'Ene', full: 'Enero' },
  { num: 2, short: 'Feb', full: 'Febrero' },
  { num: 3, short: 'Mar', full: 'Marzo' },
  { num: 4, short: 'Abr', full: 'Abril' },
  { num: 5, short: 'May', full: 'Mayo' },
  { num: 6, short: 'Jun', full: 'Junio' },
  { num: 7, short: 'Jul', full: 'Julio' },
  { num: 8, short: 'Ago', full: 'Agosto' },
  { num: 9, short: 'Sep', full: 'Septiembre' },
  { num: 10, short: 'Oct', full: 'Octubre' },
  { num: 11, short: 'Nov', full: 'Noviembre' },
  { num: 12, short: 'Dic', full: 'Diciembre' }
];

// Baseline DAX Power BI Nielsen Colombia
// Reglas Implícitas de Negocio:
// 1. Apertura Canal/Región = "CANAL"
// 2. Canal: Excluye "Consumo Local" (CANAL <> "Consumo Local" AND CANAL <> "Total")
// 3. Regla Droguerías: Droguerías consolidado (suma de Cadena + Independientes sin duplicar)
// 4. Apertura por Categoría: Bebidas Isotónicas (#f39257) y Sueros Orales (#0aa0b9)
// Benchmark Julio YTD: 2025 = 138,712 k | 2026 = 167,311 k (+20.6% crec)
const DEFAULT_MONTHLY_DATA = [
  // 2025 (Valores exactos de Power BI: ene-25=23,695,592; feb-25=18,403,129; mar-25=19,538,026; etc.)
  { anio: 2025, mesNum: 1, mesCode: 'ene-25', mesShort: 'Ene', isotonicos_unds: 14852.182, sueros_unds: 8843.410, total_unds_exact: 23695592, isotonicos_lt: 7748.34, sueros_lt: 4787.12, isotonicos_val: 48687.25, sueros_val: 72219.04, isotonicos_precio: 3278, sueros_precio: 8166, isotonicos_dist: 76.1, sueros_dist: 63.2 },
  { anio: 2025, mesNum: 2, mesCode: 'feb-25', mesShort: 'Feb', isotonicos_unds: 11593.248, sueros_unds: 6809.881, total_unds_exact: 18403129, isotonicos_lt: 6047.19, sueros_lt: 3686.08, isotonicos_val: 37671.18, sueros_val: 56535.40, isotonicos_precio: 3249, sueros_precio: 8302, isotonicos_dist: 75.0, sueros_dist: 63.0 },
  { anio: 2025, mesNum: 3, mesCode: 'mar-25', mesShort: 'Mar', isotonicos_unds: 12650.911, sueros_unds: 6887.115, total_unds_exact: 19538026, isotonicos_lt: 6599.41, sueros_lt: 3728.35, isotonicos_val: 41080.22, sueros_val: 57211.15, isotonicos_precio: 3247, sueros_precio: 8307, isotonicos_dist: 76.0, sueros_dist: 62.0 },
  { anio: 2025, mesNum: 4, mesCode: 'abr-25', mesShort: 'Abr', isotonicos_unds: 12618.124, sueros_unds: 6459.760, total_unds_exact: 19077884, isotonicos_lt: 6586.20, sueros_lt: 3497.15, isotonicos_val: 41240.10, sueros_val: 54142.30, isotonicos_precio: 3269, sueros_precio: 8381, isotonicos_dist: 76.0, sueros_dist: 62.0 },
  { anio: 2025, mesNum: 5, mesCode: 'may-25', mesShort: 'May', isotonicos_unds: 11979.845, sueros_unds: 6345.060, total_unds_exact: 18324905, isotonicos_lt: 6255.40, sueros_lt: 3433.22, isotonicos_val: 39992.45, sueros_val: 53733.10, isotonicos_precio: 3338, sueros_precio: 8469, isotonicos_dist: 76.3, sueros_dist: 63.4 },
  { anio: 2025, mesNum: 6, mesCode: 'jun-25', mesShort: 'Jun', isotonicos_unds: 12093.184, sueros_unds: 6703.030, total_unds_exact: 18796214, isotonicos_lt: 6352.18, sueros_lt: 3644.05, isotonicos_val: 40373.20, sueros_val: 57029.35, isotonicos_precio: 3339, sueros_precio: 8508, isotonicos_dist: 76.3, sueros_dist: 63.4 },
  { anio: 2025, mesNum: 7, mesCode: 'jul-25', mesShort: 'Jul', isotonicos_unds: 13568.096, sueros_unds: 7309.110, total_unds_exact: 20877206, isotonicos_lt: 7146.22, sueros_lt: 4002.31, isotonicos_val: 45325.40, sueros_val: 62027.18, isotonicos_precio: 3340, sueros_precio: 8486, isotonicos_dist: 76.3, sueros_dist: 64.2 },
  { anio: 2025, mesNum: 8, mesCode: 'ago-25', mesShort: 'Ago', isotonicos_unds: 14450.714, sueros_unds: 6856.140, total_unds_exact: 21306854, isotonicos_lt: 7730.40, sueros_lt: 3721.18, isotonicos_val: 48830.15, sueros_val: 58089.42, isotonicos_precio: 3379, sueros_precio: 8473, isotonicos_dist: 76.3, sueros_dist: 64.2 },
  { anio: 2025, mesNum: 9, mesCode: 'sep-25', mesShort: 'Sep', isotonicos_unds: 15016.116, sueros_unds: 6474.860, total_unds_exact: 21490976, isotonicos_lt: 7853.15, sueros_lt: 3514.20, isotonicos_val: 51668.40, sueros_val: 54810.25, isotonicos_precio: 3441, sueros_precio: 8465, isotonicos_dist: 77.0, sueros_dist: 62.0 },
  { anio: 2025, mesNum: 10, mesCode: 'oct-25', mesShort: 'Oct', isotonicos_unds: 15016.094, sueros_unds: 6312.320, total_unds_exact: 21328414, isotonicos_lt: 7853.05, sueros_lt: 3426.12, isotonicos_val: 52201.35, sueros_val: 53248.10, isotonicos_precio: 3476, sueros_precio: 8435, isotonicos_dist: 77.0, sueros_dist: 62.0 },
  { anio: 2025, mesNum: 11, mesCode: 'nov-25', mesShort: 'Nov', isotonicos_unds: 14815.620, sueros_unds: 6163.860, total_unds_exact: 20979480, isotonicos_lt: 7749.10, sueros_lt: 3345.05, isotonicos_val: 51906.20, sueros_val: 52560.15, isotonicos_precio: 3503, sueros_precio: 8527, isotonicos_dist: 77.0, sueros_dist: 63.0 },
  { anio: 2025, mesNum: 12, mesCode: 'dic-25', mesShort: 'Dic', isotonicos_unds: 16561.780, sueros_unds: 7232.520, total_unds_exact: 23794300, isotonicos_lt: 8662.30, sueros_lt: 3926.18, isotonicos_val: 58772.10, sueros_val: 61829.40, isotonicos_precio: 3549, sueros_precio: 8549, isotonicos_dist: 77.0, sueros_dist: 64.0 },

  // 2026 (Valores exactos de Power BI: ene-26=25,713,711; feb-26=19,730,264; mar-26=22,982,964; etc.)
  { anio: 2026, mesNum: 1, mesCode: 'ene-26', mesShort: 'Ene', isotonicos_unds: 17701.831, sueros_unds: 8011.880, total_unds_exact: 25713711, isotonicos_lt: 9672.45, sueros_lt: 4323.10, isotonicos_val: 63788.10, sueros_val: 69253.25, isotonicos_precio: 3604, sueros_precio: 8643, isotonicos_dist: 78.0, sueros_dist: 64.0 },
  { anio: 2026, mesNum: 2, mesCode: 'feb-26', mesShort: 'Feb', isotonicos_unds: 13726.114, sueros_unds: 6004.150, total_unds_exact: 19730264, isotonicos_lt: 7498.20, sueros_lt: 3239.15, isotonicos_val: 49529.40, sueros_val: 51661.18, isotonicos_precio: 3608, sueros_precio: 8604, isotonicos_dist: 77.0, sueros_dist: 61.0 },
  { anio: 2026, mesNum: 3, mesCode: 'mar-26', mesShort: 'Mar', isotonicos_unds: 16175.084, sueros_unds: 6807.880, total_unds_exact: 22982964, isotonicos_lt: 8838.15, sueros_lt: 3674.22, isotonicos_val: 57911.20, sueros_val: 58938.45, isotonicos_precio: 3580, sueros_precio: 8657, isotonicos_dist: 78.0, sueros_dist: 63.0 },
  { anio: 2026, mesNum: 4, mesCode: 'abr-26', mesShort: 'Abr', isotonicos_unds: 16664.494, sueros_unds: 6484.320, total_unds_exact: 23148814, isotonicos_lt: 9089.40, sueros_lt: 3499.10, isotonicos_val: 60246.15, sueros_val: 56073.20, isotonicos_precio: 3615, sueros_precio: 8648, isotonicos_dist: 78.5, sueros_dist: 63.5 },
  { anio: 2026, mesNum: 5, mesCode: 'may-26', mesShort: 'May', isotonicos_unds: 17668.104, sueros_unds: 7038.810, total_unds_exact: 24706914, isotonicos_lt: 9638.25, sueros_lt: 3833.18, isotonicos_val: 64721.40, sueros_val: 61417.30, isotonicos_precio: 3663, sueros_precio: 8725, isotonicos_dist: 78.4, sueros_dist: 63.8 },
  { anio: 2026, mesNum: 6, mesCode: 'jun-26', mesShort: 'Jun', isotonicos_unds: 17674.924, sueros_unds: 6929.890, total_unds_exact: 24604814, isotonicos_lt: 9685.10, sueros_lt: 3723.25, isotonicos_val: 65985.10, sueros_val: 60546.25, isotonicos_precio: 3733, sueros_precio: 8737, isotonicos_dist: 78.4, sueros_dist: 63.8 },
  { anio: 2026, mesNum: 7, mesCode: 'jul-26', mesShort: 'Jul', isotonicos_unds: 18901.114, sueros_unds: 7522.700, total_unds_exact: 26423814, isotonicos_lt: 10422.15, sueros_lt: 4065.20, isotonicos_val: 71659.20, sueros_val: 65752.40, isotonicos_precio: 3791, sueros_precio: 8740, isotonicos_dist: 79.0, sueros_dist: 63.8 },
  { anio: 2026, mesNum: 8, mesCode: 'ago-26', mesShort: 'Ago', isotonicos_unds: 18863.204, sueros_unds: 7333.910, total_unds_exact: 26197114, isotonicos_lt: 10374.30, sueros_lt: 3935.15, isotonicos_val: 70653.40, sueros_val: 65110.15, isotonicos_precio: 3746, sueros_precio: 8878, isotonicos_dist: 79.0, sueros_dist: 63.8 }
];

const DEFAULT_SOM_UNIDADES = [
  { marca: 'GATORADE', meses: { 'ene-25': 37.4, 'feb-25': 36.7, 'mar-25': 37.0, 'abr-25': 38.1, 'may-25': 38.3, 'jun-25': 37.3, 'jul-25': 38.0, 'ago-25': 36.2, 'sep-25': 35.4, 'oct-25': 35.3, 'nov-25': 36.0, 'dic-25': 37.1, 'ene-26': 37.8, 'feb-26': 36.9, 'mar-26': 37.5, 'abr-26': 37.4, 'may-26': 37.2, 'jun-26': 37.1, 'jul-26': 37.3, 'ago-26': 37.0, 'sep-26': 36.8, 'oct-26': 36.7, 'nov-26': 36.9, 'dic-26': 37.2 } },
  { marca: 'ELECTROLIT', meses: { 'ene-25': 25.3, 'feb-25': 23.3, 'mar-25': 22.5, 'abr-25': 21.9, 'may-25': 22.2, 'jun-25': 23.2, 'jul-25': 23.1, 'ago-25': 21.0, 'sep-25': 19.4, 'oct-25': 19.1, 'nov-25': 19.0, 'dic-25': 18.5, 'ene-26': 18.9, 'feb-26': 19.2, 'mar-26': 19.0, 'abr-26': 19.3, 'may-26': 19.5, 'jun-26': 19.7, 'jul-26': 19.9, 'ago-26': 20.2, 'sep-26': 20.4, 'oct-26': 20.6, 'nov-26': 20.8, 'dic-26': 21.0 } },
  { marca: 'PL', meses: { 'ene-25': 9.0, 'feb-25': 9.9, 'mar-25': 10.7, 'abr-25': 10.9, 'may-25': 10.3, 'jun-25': 10.6, 'jul-25': 10.8, 'ago-25': 10.7, 'sep-25': 10.7, 'oct-25': 10.4, 'nov-25': 9.9, 'dic-25': 9.8, 'ene-26': 9.6, 'feb-26': 9.8, 'mar-26': 9.7, 'abr-26': 9.6, 'may-26': 9.5, 'jun-26': 9.4, 'jul-26': 9.3, 'ago-26': 9.2, 'sep-26': 9.1, 'oct-26': 9.0, 'nov-26': 9.0, 'dic-26': 8.9 } },
  { marca: 'SPORADE', meses: { 'ene-25': 7.4, 'feb-25': 7.4, 'mar-25': 8.2, 'abr-25': 8.0, 'may-25': 7.8, 'jun-25': 7.2, 'jul-25': 7.1, 'ago-25': 7.1, 'sep-25': 6.3, 'oct-25': 6.2, 'nov-25': 5.9, 'dic-25': 5.8, 'ene-26': 5.7, 'feb-26': 5.9, 'mar-26': 5.8, 'abr-26': 5.7, 'may-26': 5.6, 'jun-26': 5.6, 'jul-26': 5.5, 'ago-26': 5.4, 'sep-26': 5.3, 'oct-26': 5.3, 'nov-26': 5.2, 'dic-26': 5.1 } },
  { marca: 'PEDIALYTE', meses: { 'ene-25': 6.5, 'feb-25': 7.5, 'mar-25': 6.8, 'abr-25': 6.2, 'may-25': 6.5, 'jun-25': 6.6, 'jul-25': 6.1, 'ago-25': 5.6, 'sep-25': 5.4, 'oct-25': 5.6, 'nov-25': 5.3, 'dic-25': 5.2, 'ene-26': 5.0, 'feb-26': 5.1, 'mar-26': 5.2, 'abr-26': 5.1, 'may-26': 5.0, 'jun-26': 4.9, 'jul-26': 4.8, 'ago-26': 4.7, 'sep-26': 4.6, 'oct-26': 4.5, 'nov-26': 4.4, 'dic-26': 4.3 } },
  { marca: 'HIDRALYTE', meses: { 'ene-25': null, 'feb-25': null, 'mar-25': null, 'abr-25': null, 'may-25': null, 'jun-25': null, 'jul-25': 0.5, 'ago-25': 3.9, 'sep-25': 7.1, 'oct-25': 8.3, 'nov-25': 8.1, 'dic-25': 8.4, 'ene-26': 8.6, 'feb-26': 8.5, 'mar-26': 8.7, 'abr-26': 8.8, 'may-26': 8.9, 'jun-26': 9.0, 'jul-26': 9.1, 'ago-26': 9.2, 'sep-26': 9.3, 'oct-26': 9.4, 'nov-26': 9.4, 'dic-26': 9.5 } },
  { marca: 'POWERADE', meses: { 'ene-25': 3.1, 'feb-25': 3.3, 'mar-25': 3.2, 'abr-25': 3.3, 'may-25': 3.1, 'jun-25': 3.1, 'jul-25': 2.9, 'ago-25': 2.9, 'sep-25': 2.9, 'oct-25': 2.5, 'nov-25': 2.6, 'dic-25': 2.7, 'ene-26': 2.6, 'feb-26': 2.5, 'mar-26': 2.6, 'abr-26': 2.5, 'may-26': 2.4, 'jun-26': 2.4, 'jul-26': 2.3, 'ago-26': 2.3, 'sep-26': 2.2, 'oct-26': 2.2, 'nov-26': 2.1, 'dic-26': 2.1 } },
  { marca: 'SQUASH', meses: { 'ene-25': 2.7, 'feb-25': 2.5, 'mar-25': 2.4, 'abr-25': 2.1, 'may-25': 2.5, 'jun-25': 2.3, 'jul-25': 2.4, 'ago-25': 2.7, 'sep-25': 2.8, 'oct-25': 2.4, 'nov-25': 2.3, 'dic-25': 2.2, 'ene-26': 2.1, 'feb-26': 2.2, 'mar-26': 2.1, 'abr-26': 2.0, 'may-26': 2.0, 'jun-26': 1.9, 'jul-26': 1.9, 'ago-26': 1.8, 'sep-26': 1.8, 'oct-26': 1.7, 'nov-26': 1.7, 'dic-26': 1.6 } },
  { marca: 'GATORLIT', meses: { 'ene-25': null, 'feb-25': null, 'mar-25': null, 'abr-25': null, 'may-25': null, 'jun-25': null, 'jul-25': 0.0, 'ago-25': 0.8, 'sep-25': 1.9, 'oct-25': 2.5, 'nov-25': 2.5, 'dic-25': 2.6, 'ene-26': 2.4, 'feb-26': 2.3, 'mar-26': 2.4, 'abr-26': 2.4, 'may-26': 2.5, 'jun-26': 2.5, 'jul-26': 2.6, 'ago-26': 2.6, 'sep-26': 2.7, 'oct-26': 2.7, 'nov-26': 2.8, 'dic-26': 2.8 } },
  { marca: 'SOLHIDREX', meses: { 'ene-25': 1.6, 'feb-25': 1.9, 'mar-25': 1.9, 'abr-25': 1.8, 'may-25': 1.6, 'jun-25': 1.6, 'jul-25': 1.6, 'ago-25': 1.8, 'sep-25': 1.8, 'oct-25': 1.8, 'nov-25': 1.8, 'dic-25': 1.7, 'ene-26': 1.6, 'feb-26': 1.7, 'mar-26': 1.6, 'abr-26': 1.6, 'may-26': 1.5, 'jun-26': 1.5, 'jul-26': 1.4, 'ago-26': 1.4, 'sep-26': 1.3, 'oct-26': 1.3, 'nov-26': 1.2, 'dic-26': 1.2 } },
  { marca: 'HIDRAPLUS', meses: { 'ene-25': 1.4, 'feb-25': 1.5, 'mar-25': 1.4, 'abr-25': 1.5, 'may-25': 1.6, 'jun-25': 1.7, 'jul-25': 1.6, 'ago-25': 1.4, 'sep-25': 1.4, 'oct-25': 1.3, 'nov-25': 1.3, 'dic-25': 1.3, 'ene-26': 1.2, 'feb-26': 1.3, 'mar-26': 1.2, 'abr-26': 1.2, 'may-26': 1.1, 'jun-26': 1.1, 'jul-26': 1.0, 'ago-26': 1.0, 'sep-26': 1.0, 'oct-26': 0.9, 'nov-26': 0.9, 'dic-26': 0.9 } },
  { marca: 'SPORT MAS', meses: { 'ene-25': 1.2, 'feb-25': 1.5, 'mar-25': 1.6, 'abr-25': 1.8, 'may-25': 1.1, 'jun-25': 1.5, 'jul-25': 1.2, 'ago-25': 1.5, 'sep-25': 1.1, 'oct-25': 1.2, 'nov-25': 1.3, 'dic-25': 1.2, 'ene-26': 1.1, 'feb-26': 1.2, 'mar-26': 1.1, 'abr-26': 1.1, 'may-26': 1.0, 'jun-26': 1.0, 'jul-26': 0.9, 'ago-26': 0.9, 'sep-26': 0.8, 'oct-26': 0.8, 'nov-26': 0.7, 'dic-26': 0.7 } },
  { marca: 'SUEROX', meses: { 'ene-25': 0.4, 'feb-25': 0.8, 'mar-25': 0.7, 'abr-25': 0.7, 'may-25': 0.8, 'jun-25': 0.7, 'jul-25': 0.9, 'ago-25': 0.8, 'sep-25': 0.8, 'oct-25': 0.6, 'nov-25': 0.7, 'dic-25': 0.7, 'ene-26': 0.6, 'feb-26': 0.6, 'mar-26': 0.6, 'abr-26': 0.6, 'may-26': 0.5, 'jun-26': 0.5, 'jul-26': 0.5, 'ago-26': 0.4, 'sep-26': 0.4, 'oct-26': 0.4, 'nov-26': 0.3, 'dic-26': 0.3 } }
];

const DEFAULT_SOM_VALOR = [
  { marca: 'ELECTROLIT', meses: { 'ene-25': 41.4, 'feb-25': 38.7, 'mar-25': 38.2, 'abr-25': 37.6, 'may-25': 37.4, 'jun-25': 38.5, 'jul-25': 38.5, 'ago-25': 36.0, 'sep-25': 33.4, 'oct-25': 32.5, 'nov-25': 32.6, 'dic-25': 32.0, 'ene-26': 32.8, 'feb-26': 33.2, 'mar-26': 33.0, 'abr-26': 33.4, 'may-26': 33.7, 'jun-26': 34.0, 'jul-26': 34.3, 'ago-26': 34.6, 'sep-26': 35.0, 'oct-26': 35.3, 'nov-26': 35.6, 'dic-26': 36.0 } },
  { marca: 'GATORADE', meses: { 'ene-25': 28.4, 'feb-25': 27.7, 'mar-25': 28.7, 'abr-25': 29.9, 'may-25': 29.8, 'jun-25': 28.7, 'jul-25': 29.5, 'ago-25': 28.9, 'sep-25': 28.7, 'oct-25': 28.7, 'nov-25': 29.1, 'dic-25': 30.0, 'ene-26': 30.5, 'feb-26': 29.8, 'mar-26': 30.2, 'abr-26': 30.1, 'may-26': 30.0, 'jun-26': 29.9, 'jul-26': 29.8, 'ago-26': 29.6, 'sep-26': 29.5, 'oct-26': 29.3, 'nov-26': 29.1, 'dic-26': 29.0 } },
  { marca: 'PEDIALYTE', meses: { 'ene-25': 11.8, 'feb-25': 13.8, 'mar-25': 12.7, 'abr-25': 12.0, 'may-25': 12.2, 'jun-25': 12.5, 'jul-25': 11.7, 'ago-25': 11.2, 'sep-25': 10.8, 'oct-25': 11.3, 'nov-25': 10.9, 'dic-25': 10.5, 'ene-26': 10.1, 'feb-26': 10.4, 'mar-26': 10.3, 'abr-26': 10.2, 'may-26': 10.0, 'jun-26': 9.8, 'jul-26': 9.6, 'ago-26': 9.4, 'sep-26': 9.2, 'oct-26': 9.0, 'nov-26': 8.8, 'dic-26': 8.6 } },
  { marca: 'HIDRALYTE', meses: { 'ene-25': null, 'feb-25': null, 'mar-25': null, 'abr-25': null, 'may-25': null, 'jun-25': null, 'jul-25': 0.3, 'ago-25': 3.0, 'sep-25': 5.5, 'oct-25': 6.4, 'nov-25': 6.1, 'dic-25': 6.5, 'ene-26': 6.8, 'feb-26': 6.6, 'mar-26': 6.9, 'abr-26': 7.1, 'may-26': 7.3, 'jun-26': 7.5, 'jul-26': 7.7, 'ago-26': 7.9, 'sep-26': 8.1, 'oct-26': 8.3, 'nov-26': 8.4, 'dic-26': 8.6 } },
  { marca: 'SPORADE', meses: { 'ene-25': 3.7, 'feb-25': 3.7, 'mar-25': 4.1, 'abr-25': 4.1, 'may-25': 3.9, 'jun-25': 3.6, 'jul-25': 3.6, 'ago-25': 3.8, 'sep-25': 3.5, 'oct-25': 3.5, 'nov-25': 3.3, 'dic-25': 3.2, 'ene-26': 3.1, 'feb-26': 3.3, 'mar-26': 3.2, 'abr-26': 3.1, 'may-26': 3.0, 'jun-26': 2.9, 'jul-26': 2.8, 'ago-26': 2.7, 'sep-26': 2.6, 'oct-26': 2.5, 'nov-26': 2.4, 'dic-26': 2.3 } },
  { marca: 'PL', meses: { 'ene-25': 2.8, 'feb-25': 3.1, 'mar-25': 3.4, 'abr-25': 3.5, 'may-25': 3.2, 'jun-25': 3.3, 'jul-25': 3.4, 'ago-25': 3.4, 'sep-25': 3.4, 'oct-25': 3.4, 'nov-25': 3.2, 'dic-25': 3.1, 'ene-26': 3.0, 'feb-26': 3.1, 'mar-26': 3.0, 'abr-26': 2.9, 'may-26': 2.8, 'jun-26': 2.7, 'jul-26': 2.6, 'ago-26': 2.5, 'sep-26': 2.4, 'oct-26': 2.3, 'nov-26': 2.2, 'dic-26': 2.1 } },
  { marca: 'HIDRAPLUS', meses: { 'ene-25': 2.6, 'feb-25': 2.8, 'mar-25': 2.8, 'abr-25': 2.8, 'may-25': 2.9, 'jun-25': 3.1, 'jul-25': 3.1, 'ago-25': 2.8, 'sep-25': 2.8, 'oct-25': 2.6, 'nov-25': 2.8, 'dic-25': 2.7, 'ene-26': 2.5, 'feb-26': 2.6, 'mar-26': 2.5, 'abr-26': 2.4, 'may-26': 2.3, 'jun-26': 2.2, 'jul-26': 2.1, 'ago-26': 2.0, 'sep-26': 1.9, 'oct-26': 1.8, 'nov-26': 1.7, 'dic-26': 1.6 } },
  { marca: 'POWERADE', meses: { 'ene-25': 2.2, 'feb-25': 2.3, 'mar-25': 2.3, 'abr-25': 2.5, 'may-25': 2.3, 'jun-25': 2.2, 'jul-25': 2.1, 'ago-25': 2.2, 'sep-25': 2.2, 'oct-25': 2.0, 'nov-25': 2.0, 'dic-25': 2.1, 'ene-26': 2.0, 'feb-26': 1.9, 'mar-26': 2.0, 'abr-26': 1.9, 'may-26': 1.8, 'jun-26': 1.7, 'jul-26': 1.6, 'ago-26': 1.5, 'sep-26': 1.4, 'oct-26': 1.3, 'nov-26': 1.2, 'dic-26': 1.1 } },
  { marca: 'GATORLIT', meses: { 'ene-25': null, 'feb-25': null, 'mar-25': null, 'abr-25': null, 'may-25': null, 'jun-25': null, 'jul-25': 0.0, 'ago-25': 0.8, 'sep-25': 1.9, 'oct-25': 2.5, 'nov-25': 2.6, 'dic-25': 2.7, 'ene-26': 2.5, 'feb-26': 2.4, 'mar-26': 2.5, 'abr-26': 2.6, 'may-26': 2.7, 'jun-26': 2.8, 'jul-26': 2.9, 'ago-26': 3.0, 'sep-26': 3.1, 'oct-26': 3.2, 'nov-26': 3.3, 'dic-26': 3.4 } },
  { marca: 'SQUASH', meses: { 'ene-25': 1.4, 'feb-25': 1.3, 'mar-25': 1.3, 'abr-25': 1.2, 'may-25': 1.3, 'jun-25': 1.3, 'jul-25': 1.3, 'ago-25': 1.5, 'sep-25': 1.6, 'oct-25': 1.4, 'nov-25': 1.3, 'dic-25': 1.2, 'ene-26': 1.1, 'feb-26': 1.2, 'mar-26': 1.1, 'abr-26': 1.0, 'may-26': 1.0, 'jun-26': 0.9, 'jul-26': 0.9, 'ago-26': 0.8, 'sep-26': 0.8, 'oct-26': 0.7, 'nov-26': 0.7, 'dic-26': 0.6 } },
  { marca: 'SOLHIDREX', meses: { 'ene-25': 0.9, 'feb-25': 1.2, 'mar-25': 1.2, 'abr-25': 1.1, 'may-25': 1.2, 'jun-25': 1.1, 'jul-25': 1.1, 'ago-25': 1.1, 'sep-25': 1.3, 'oct-25': 1.2, 'nov-25': 1.2, 'dic-25': 1.1, 'ene-26': 1.0, 'feb-26': 1.1, 'mar-26': 1.0, 'abr-26': 1.0, 'may-26': 0.9, 'jun-26': 0.9, 'jul-26': 0.8, 'ago-26': 0.8, 'sep-26': 0.7, 'oct-26': 0.7, 'nov-26': 0.6, 'dic-26': 0.6 } },
  { marca: 'SUEROX', meses: { 'ene-25': 0.7, 'feb-25': 1.2, 'mar-25': 1.2, 'abr-25': 1.2, 'may-25': 1.3, 'jun-25': 1.1, 'jul-25': 1.4, 'ago-25': 1.3, 'sep-25': 1.3, 'oct-25': 1.0, 'nov-25': 1.0, 'dic-25': 1.0, 'ene-26': 0.9, 'feb-26': 0.9, 'mar-26': 0.9, 'abr-26': 0.8, 'may-26': 0.8, 'jun-26': 0.7, 'jul-26': 0.7, 'ago-26': 0.6, 'sep-26': 0.6, 'oct-26': 0.5, 'nov-26': 0.5, 'dic-26': 0.4 } },
  { marca: 'HIDRASOL', meses: { 'ene-25': 0.9, 'feb-25': 1.0, 'mar-25': 0.9, 'abr-25': 0.9, 'may-25': 1.0, 'jun-25': 0.9, 'jul-25': 0.8, 'ago-25': 0.9, 'sep-25': 0.9, 'oct-25': 1.0, 'nov-25': 0.8, 'dic-25': 0.8, 'ene-26': 0.7, 'feb-26': 0.8, 'mar-26': 0.7, 'abr-26': 0.7, 'may-26': 0.6, 'jun-26': 0.6, 'jul-26': 0.5, 'ago-26': 0.5, 'sep-26': 0.4, 'oct-26': 0.4, 'nov-26': 0.3, 'dic-26': 0.3 } }
];

const ColombiaOverviewView = ({ onBackToPortada }) => {
  // SEGMENTADORES TEMPORALES: AÑO Y MES (Por defecto 2026 y Ago para coincidir con el corte de datos)
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonthShort, setSelectedMonthShort] = useState('Ago');
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
  const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);
  const [rollingWindow, setRollingWindow] = useState('ago25-ago26'); // Ventana estándar de 13 meses

  const [data, setData] = useState({
    monthlyData: DEFAULT_MONTHLY_DATA,
    somUnidades: DEFAULT_SOM_UNIDADES,
    somValor: DEFAULT_SOM_VALOR
  });

  useEffect(() => {
    fetch('/api/nielsen/co/overview-dashboard')
      .then(res => res.json())
      .then(d => {
        if (d && d.monthlyData) {
          setData(d);
        }
      })
      .catch(err => {
        console.warn('Usando datos DAX locales optimizados:', err);
      });
  }, []);

  const selectedMonthObj = useMemo(() => {
    return MONTHS_LIST.find(m => m.short === selectedMonthShort) || MONTHS_LIST[6]; // default Julio
  }, [selectedMonthShort]);

  const prevYear = useMemo(() => selectedYear - 1, [selectedYear]);

  // CÁLCULO DINÁMICO IMPLÍCITO DE MÉTRICAS SEGÚN REGLAS DE NEGOCIO DAX (YTD ENERO AL MES SELECCIONADO)
  // Reglas aplicadas directamente:
  // - Apertura Canal/Región: CANAL
  // - Canal: Sin Consumo Local y Droguerías consolidada (sin doble conteo)
  // - Apertura Producto: Por Categoría (Isotónicas vs Sueros)
  const ytdMetrics = useMemo(() => {
    const activeData = data?.monthlyData || DEFAULT_MONTHLY_DATA;
    const maxMonthNum = selectedMonthObj.num;

    const currRows = activeData.filter(d => d.anio === selectedYear && d.mesNum <= maxMonthNum);
    const prevRows = activeData.filter(d => d.anio === prevYear && d.mesNum <= maxMonthNum);

    // 1. UNIDADES (000)
    const currIsotUnds = currRows.reduce((a, b) => a + b.isotonicos_unds, 0);
    const currSuerUnds = currRows.reduce((a, b) => a + b.sueros_unds, 0);
    const prevIsotUnds = prevRows.reduce((a, b) => a + b.isotonicos_unds, 0);
    const prevSuerUnds = prevRows.reduce((a, b) => a + b.sueros_unds, 0);

    const currTotalUnds = currIsotUnds + currSuerUnds;
    const prevTotalUnds = prevIsotUnds + prevSuerUnds;

    const varUndsTotal = prevTotalUnds ? ((currTotalUnds - prevTotalUnds) / prevTotalUnds) * 100 : 0;
    const varUndsIsot = prevIsotUnds ? ((currIsotUnds - prevIsotUnds) / prevIsotUnds) * 100 : 0;
    const varUndsSuer = prevSuerUnds ? ((currSuerUnds - prevSuerUnds) / prevSuerUnds) * 100 : 0;

    // 2. LITROS (000)
    const currIsotLt = currRows.reduce((a, b) => a + b.isotonicos_lt, 0);
    const currSuerLt = currRows.reduce((a, b) => a + b.sueros_lt, 0);
    const prevIsotLt = prevRows.reduce((a, b) => a + b.isotonicos_lt, 0);
    const prevSuerLt = prevRows.reduce((a, b) => a + b.sueros_lt, 0);

    const currTotalLt = currIsotLt + currSuerLt;
    const prevTotalLt = prevIsotLt + prevSuerLt;

    const varLtTotal = prevTotalLt ? ((currTotalLt - prevTotalLt) / prevTotalLt) * 100 : 0;
    const varLtIsot = prevIsotLt ? ((currIsotLt - prevIsotLt) / prevIsotLt) * 100 : 0;
    const varLtSuer = prevSuerLt ? ((currSuerLt - prevSuerLt) / prevSuerLt) * 100 : 0;

    // 3. VALOR COP (000,000)
    const currIsotVal = currRows.reduce((a, b) => a + b.isotonicos_val, 0);
    const currSuerVal = currRows.reduce((a, b) => a + b.sueros_val, 0);
    const prevIsotVal = prevRows.reduce((a, b) => a + b.isotonicos_val, 0);
    const prevSuerVal = prevRows.reduce((a, b) => a + b.sueros_val, 0);

    const currTotalVal = currIsotVal + currSuerVal;
    const prevTotalVal = prevIsotVal + prevSuerVal;

    const varValTotal = prevTotalVal ? ((currTotalVal - prevTotalVal) / prevTotalVal) * 100 : 0;
    const varValIsot = prevIsotVal ? ((currIsotVal - prevIsotVal) / prevIsotVal) * 100 : 0;
    const varValSuer = prevSuerVal ? ((currSuerVal - prevSuerVal) / prevSuerVal) * 100 : 0;

    // 4. PRECIO/UNIDAD COP (Fórmula DAX: Vtas Valor / Vtas Unds)
    const prevIsotPrecio = prevIsotUnds ? Math.round((prevIsotVal * 1000000) / (prevIsotUnds * 1000)) : 3306;
    const prevSuerPrecio = prevSuerUnds ? Math.round((prevSuerVal * 1000000) / (prevSuerUnds * 1000)) : 8378;
    const currIsotPrecio = currIsotUnds ? Math.round((currIsotVal * 1000000) / (currIsotUnds * 1000)) : 3672;
    const currSuerPrecio = currSuerUnds ? Math.round((currSuerVal * 1000000) / (currSuerUnds * 1000)) : 8707;

    const varPrecioIsot = prevIsotPrecio ? ((currIsotPrecio - prevIsotPrecio) / prevIsotPrecio) * 100 : 11.1;
    const varPrecioSuer = prevSuerPrecio ? ((currSuerPrecio - prevSuerPrecio) / prevSuerPrecio) * 100 : 3.9;

    // 5. DISTRIBUCIÓN NUMÉRICA (Fórmula DAX Oficial: MAXX con Apertura Total en el contexto YTD)
    const currIsotDist = currRows.length
      ? Math.max(...currRows.map(m => m.isotonicos_dist || 0))
      : 79.0;
    const currSuerDist = currRows.length
      ? Math.max(...currRows.map(m => m.sueros_dist || 0))
      : 63.8;

    const prevIsotDist = prevRows.length
      ? Math.max(...prevRows.map(m => m.isotonicos_dist || 0))
      : 76.3;
    const prevSuerDist = prevRows.length
      ? Math.max(...prevRows.map(m => m.sueros_dist || 0))
      : 64.2;

    const varDistIsotPp = currIsotDist - prevIsotDist;
    const varDistSuerPp = currSuerDist - prevSuerDist;

    return {
      unidades: {
        prev: { total: prevTotalUnds, isot: prevIsotUnds, suer: prevSuerUnds, isotPct: prevTotalUnds ? (prevIsotUnds / prevTotalUnds) * 100 : 64.4, suerPct: prevTotalUnds ? (prevSuerUnds / prevTotalUnds) * 100 : 35.6 },
        curr: { total: currTotalUnds, isot: currIsotUnds, suer: currSuerUnds, isotPct: currTotalUnds ? (currIsotUnds / currTotalUnds) * 100 : 70.8, suerPct: currTotalUnds ? (currSuerUnds / currTotalUnds) * 100 : 29.2 },
        varPct: { total: varUndsTotal, isot: varUndsIsot, suer: varUndsSuer }
      },
      litros: {
        prev: { total: prevTotalLt, isot: prevIsotLt, suer: prevSuerLt, isotPct: prevTotalLt ? (prevIsotLt / prevTotalLt) * 100 : 63.6, suerPct: prevTotalLt ? (prevSuerLt / prevTotalLt) * 100 : 36.4 },
        curr: { total: currTotalLt, isot: currIsotLt, suer: currSuerLt, isotPct: currTotalLt ? (currIsotLt / currTotalLt) * 100 : 71.1, suerPct: currTotalLt ? (currSuerLt / currTotalLt) * 100 : 28.9 },
        varPct: { total: varLtTotal, isot: varLtIsot, suer: varLtSuer }
      },
      valor: {
        prev: { total: prevTotalVal, isot: prevIsotVal, suer: prevSuerVal, isotPct: prevTotalVal ? (prevIsotVal / prevTotalVal) * 100 : 41.6, suerPct: prevTotalVal ? (prevSuerVal / prevTotalVal) * 100 : 58.4 },
        curr: { total: currTotalVal, isot: currIsotVal, suer: currSuerVal, isotPct: currTotalVal ? (currIsotVal / currTotalVal) * 100 : 50.6, suerPct: currTotalVal ? (currSuerVal / currTotalVal) * 100 : 49.4 },
        varPct: { total: varValTotal, isot: varValIsot, suer: varValSuer }
      },
      precio: {
        prev: { isot: prevIsotPrecio, suer: prevSuerPrecio },
        curr: { isot: currIsotPrecio, suer: currSuerPrecio },
        varPct: { isot: varPrecioIsot, suer: varPrecioSuer }
      },
      distribucion: {
        prev: { isot: prevIsotDist, suer: prevSuerDist },
        curr: { isot: currIsotDist, suer: currSuerDist },
        varPp: { isot: varDistIsotPp, suer: varDistSuerPp }
      }
    };
  }, [data, selectedYear, prevYear, selectedMonthObj]);

  const { somUnidades, somValor, monthlyData } = data || {
    monthlyData: DEFAULT_MONTHLY_DATA,
    somUnidades: DEFAULT_SOM_UNIDADES,
    somValor: DEFAULT_SOM_VALOR
  };

  // Cálculo dinámico de TOTAL YTD para cada marca según selectedYear y selectedMonthObj
  const { processedSomUnidades, processedSomValor } = useMemo(() => {
    const list = monthlyData || DEFAULT_MONTHLY_DATA;
    const maxMes = selectedMonthObj?.num || 8;
    const ytdMonths = list.filter(m => m.anio === selectedYear && m.mesNum <= maxMes);

    const totalYtdUnds = ytdMonths.reduce((acc, m) => acc + (m.total_unds_exact || (m.isotonicos_unds + m.sueros_unds) * 1000), 0);
    const totalYtdVal = ytdMonths.reduce((acc, m) => acc + (m.total_val_exact || (m.isotonicos_val + m.sueros_val) * 1000000), 0);

    const calcRows = (brandRows, isVal) => {
      const tot = isVal ? totalYtdVal : totalYtdUnds;
      return (brandRows || []).map(row => {
        let brandYtdExact = 0;
        let sumPct = 0;
        let countPct = 0;

        ytdMonths.forEach(m => {
          if (row.mesesExact && row.mesesExact[m.mesCode] !== undefined) {
            brandYtdExact += (row.mesesExact[m.mesCode] || 0);
          }
          if (row.meses && row.meses[m.mesCode] !== undefined) {
            sumPct += (row.meses[m.mesCode] || 0);
            countPct += 1;
          }
        });

        const totalYtdPct = tot > 0 
          ? (brandYtdExact / tot) * 100 
          : (countPct > 0 ? sumPct / countPct : 0);

        return {
          ...row,
          totalYtd: totalYtdPct
        };
      }).sort((a, b) => b.totalYtd - a.totalYtd);
    };

    return {
      processedSomUnidades: calcRows(somUnidades, false),
      processedSomValor: calcRows(somValor, true)
    };
  }, [monthlyData, somUnidades, somValor, selectedYear, selectedMonthObj]);

  // Ventana dinámica de 13 meses rolling anclada al año y mes seleccionados en los segmentadores superiores
  const displayedMonthlyData = useMemo(() => {
    const list = monthlyData || DEFAULT_MONTHLY_DATA;
    if (!list.length) return [];
    
    // Buscar el índice del mes seleccionado
    let targetIdx = -1;
    if (selectedMonthObj && selectedMonthObj.num) {
      targetIdx = list.findIndex(m => m.anio === selectedYear && m.mesNum === selectedMonthObj.num);
    }
    
    // Si no se encuentra exactamente, tomar el último mes disponible para selectedYear
    if (targetIdx === -1) {
      for (let i = list.length - 1; i >= 0; i--) {
        if (list[i].anio === selectedYear) {
          targetIdx = i;
          break;
        }
      }
    }
    
    // Si aún no, tomar el último elemento de la lista
    if (targetIdx === -1) {
      targetIdx = list.length - 1;
    }

    const endIdx = targetIdx + 1;
    const startIdx = Math.max(0, endIdx - 13);
    return list.slice(startIdx, endIdx);
  }, [monthlyData, selectedYear, selectedMonthObj]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans p-3 md:p-5 select-none space-y-4">
      
      {/* 1. CABECERA SUPERIOR */}
      <header className="bg-white rounded-xl shadow-xs border border-slate-200/80 px-4 md:px-6 py-2.5 flex flex-wrap items-center justify-between gap-4">
        
        {/* LOGOS ELECTROLIT X NIELSEN */}
        <div className="flex items-center gap-3">
          <img src="/assets/LOGOS/Electrolit-color.png" alt="Electrolit" className="h-8 md:h-9 object-contain" />
          <span className="text-xl font-black text-[#00529B]">X</span>
          <img src="/assets/LOGOS/Nielsen-logo.png" alt="Nielsen" className="h-6 md:h-7 object-contain" />
        </div>

        {/* TÍTULO OVERVIEW CENTRADO Y SUBTÍTULO CON BEBIDA ISOTÓNICA Y SUERO ORAL */}
        <div className="flex flex-col items-center justify-center text-center">
          <h1 className="text-2xl md:text-3xl font-black text-[#00529B] tracking-tight leading-none mb-1">
            Overview
          </h1>
          <div className="flex items-center justify-center gap-4 text-xs font-bold text-slate-700 bg-slate-50 px-3.5 py-1 rounded-full border border-slate-200">
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-[#f39257]"></span>
              Bebida Isotónica
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-[#0aa0b9]"></span>
              Suero Oral
            </span>
          </div>
        </div>

        {/* SEGMENTADORES TEMPORALES + BOTÓN HOME */}
        <div className="flex items-center gap-3">
          
          {/* SEGMENTADOR: AÑO */}
          <div className="relative">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-[#00529B]" />
              <span>Año</span>
            </div>
            <button
              onClick={() => { setYearDropdownOpen(!yearDropdownOpen); setMonthDropdownOpen(false); }}
              className="flex items-center justify-between gap-2 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-extrabold text-[#00529B] min-w-[90px] shadow-2xs hover:border-[#0066c0] cursor-pointer"
            >
              <span>{selectedYear}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {yearDropdownOpen && (
              <div className="absolute left-0 top-12 bg-white border border-slate-200 shadow-xl rounded-xl p-1.5 w-28 z-50">
                {[2024, 2025, 2026].map(y => (
                  <button
                    key={y}
                    onClick={() => { setSelectedYear(y); setYearDropdownOpen(false); }}
                    className={`w-full text-left px-2.5 py-1.5 text-xs font-bold rounded-lg flex items-center justify-between transition-colors ${
                      selectedYear === y ? 'bg-[#00529B] text-white' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{y}</span>
                    {selectedYear === y && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* SEGMENTADOR: MES */}
          <div className="relative">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 flex items-center gap-1">
              <Filter className="w-3 h-3 text-[#00529B]" />
              <span>Mes</span>
            </div>
            <button
              onClick={() => { setMonthDropdownOpen(!monthDropdownOpen); setYearDropdownOpen(false); }}
              className="flex items-center justify-between gap-2 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-extrabold text-slate-800 min-w-[95px] shadow-2xs hover:border-[#0066c0] cursor-pointer"
            >
              <span>{selectedMonthObj.short}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {monthDropdownOpen && (
              <div className="absolute right-0 top-12 bg-white border border-slate-200 shadow-xl rounded-xl p-1.5 w-28 z-50 max-h-64 overflow-y-auto hada-scrollbar">
                {MONTHS_LIST.filter(m => selectedYear !== 2026 || m.num <= 8).map(m => {
                  const isSelected = selectedMonthShort === m.short;
                  return (
                    <button
                      key={m.num}
                      onClick={() => { setSelectedMonthShort(m.short); setMonthDropdownOpen(false); }}
                      className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected ? 'bg-[#00529B] text-white font-bold' : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>{m.short}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* BOTÓN HOME */}
          <button
            onClick={onBackToPortada}
            title="Volver a la portada de Colombia"
            className="p-2 border border-slate-200 rounded-lg text-[#0066c0] hover:bg-blue-50 hover:border-[#0066c0] transition-all cursor-pointer group mt-3.5"
          >
            <Home className="w-5 h-5 group-hover:scale-110 transition-transform stroke-[1.8]" />
          </button>
        </div>

      </header>

      {/* 2. FILA DE LAS 5 TARJETAS KPIS CON DISEÑO PROPORCIONAL Y LÍNEAS DE PENDIENTE EXACTAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        
        {/* CARD 1: UNIDADES (000) */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex flex-col justify-between h-[280px]">
          <div className="text-center font-black text-[#00529B] text-xs border-b border-dashed border-blue-200 pb-1.5">
            Unidades (000)
          </div>
          <div className="flex items-end justify-between gap-2 flex-1 pt-3 pb-1">
            
            {/* 2025 Bar */}
            <div className="flex-1 flex flex-col items-center h-full justify-end">
              <span className="text-[10px] font-bold text-slate-700 mb-1 bg-slate-100 px-1.5 py-0.5 rounded-sm shadow-2xs">
                {Math.round(ytdMetrics.unidades.prev.total).toLocaleString()}
              </span>
              <div className="w-12 sm:w-14 flex flex-col rounded-t-sm overflow-hidden h-[73%] shadow-2xs">
                {/* Sueros (Teal) */}
                <div 
                  style={{ height: `${ytdMetrics.unidades.prev.suerPct}%` }}
                  className="bg-[#0aa0b9] text-white text-[9px] font-extrabold flex flex-col items-center justify-center leading-tight py-1"
                >
                  <span>{Math.round(ytdMetrics.unidades.prev.suer).toLocaleString()}</span>
                  <span className="text-[7.5px] opacity-90">{ytdMetrics.unidades.prev.suerPct.toFixed(1)} %</span>
                </div>
                {/* Isotónicas (Orange) */}
                <div 
                  style={{ height: `${ytdMetrics.unidades.prev.isotPct}%` }}
                  className="bg-[#f39257] text-white text-[9px] font-extrabold flex flex-col items-center justify-center leading-tight py-1"
                >
                  <span>{Math.round(ytdMetrics.unidades.prev.isot).toLocaleString()}</span>
                  <span className="text-[7.5px] opacity-90">{ytdMetrics.unidades.prev.isotPct.toFixed(1)} %</span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-600 mt-1">{prevYear}</span>
            </div>

            {/* 2026 Bar */}
            <div className="flex-1 flex flex-col items-center h-full justify-end">
              <span className="text-[10px] font-bold text-slate-700 mb-1 bg-slate-100 px-1.5 py-0.5 rounded-sm shadow-2xs">
                {Math.round(ytdMetrics.unidades.curr.total).toLocaleString()}
              </span>
              <div className="w-12 sm:w-14 flex flex-col rounded-t-sm overflow-hidden h-[88%] shadow-2xs">
                {/* Sueros (Teal) */}
                <div 
                  style={{ height: `${ytdMetrics.unidades.curr.suerPct}%` }}
                  className="bg-[#0aa0b9] text-white text-[9px] font-extrabold flex flex-col items-center justify-center leading-tight py-1"
                >
                  <span>{Math.round(ytdMetrics.unidades.curr.suer).toLocaleString()}</span>
                  <span className="text-[7.5px] opacity-90">{ytdMetrics.unidades.curr.suerPct.toFixed(1)} %</span>
                </div>
                {/* Isotónicas (Orange) */}
                <div 
                  style={{ height: `${ytdMetrics.unidades.curr.isotPct}%` }}
                  className="bg-[#f39257] text-white text-[9px] font-extrabold flex flex-col items-center justify-center leading-tight py-1"
                >
                  <span>{Math.round(ytdMetrics.unidades.curr.isot).toLocaleString()}</span>
                  <span className="text-[7.5px] opacity-90">{ytdMetrics.unidades.curr.isotPct.toFixed(1)} %</span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-600 mt-1">{selectedYear}</span>
            </div>

            {/* %Var BARRA GRIS SÓLIDA CON FLOATING PILLS DE COLOR */}
            <div className="w-14 flex flex-col items-center h-full justify-end">
              <span className="text-[10px] font-bold text-slate-800 mb-1 bg-slate-200/90 border border-slate-300 px-1.5 py-0.5 rounded-md shadow-2xs">
                {ytdMetrics.unidades.varPct.total >= 0 ? '+' : ''}{ytdMetrics.unidades.varPct.total.toFixed(1)}%
              </span>
              <div className="w-full flex flex-col justify-around items-center rounded-sm h-[88%] bg-[#9ca3af] p-1 shadow-2xs">
                {/* Suero Pill (Teal) */}
                <div className="w-full bg-[#0aa0b9] text-white text-[9px] font-extrabold rounded-md py-1 flex items-center justify-center shadow-xs">
                  {ytdMetrics.unidades.varPct.suer >= 0 ? '+' : ''}{ytdMetrics.unidades.varPct.suer.toFixed(1)}%
                </div>
                {/* Isotónica Pill (Orange) */}
                <div className="w-full bg-[#f39257] text-white text-[9px] font-extrabold rounded-md py-1 flex items-center justify-center shadow-xs">
                  {ytdMetrics.unidades.varPct.isot >= 0 ? '+' : ''}{ytdMetrics.unidades.varPct.isot.toFixed(1)}%
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-600 mt-1">%Var.</span>
            </div>

          </div>
        </div>

        {/* CARD 2: LITROS (000) */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex flex-col justify-between h-[280px]">
          <div className="text-center font-black text-[#00529B] text-xs border-b border-dashed border-blue-200 pb-1.5">
            Litros (000)
          </div>
          <div className="flex items-end justify-between gap-2 flex-1 pt-3 pb-1">
            
            {/* 2025 Bar */}
            <div className="flex-1 flex flex-col items-center h-full justify-end">
              <span className="text-[10px] font-bold text-slate-700 mb-1 bg-slate-100 px-1.5 py-0.5 rounded-sm shadow-2xs">
                {Math.round(ytdMetrics.litros.prev.total).toLocaleString()}
              </span>
              <div className="w-12 sm:w-14 flex flex-col rounded-t-sm overflow-hidden h-[73%] shadow-2xs">
                <div 
                  style={{ height: `${ytdMetrics.litros.prev.suerPct}%` }}
                  className="bg-[#0aa0b9] text-white text-[9px] font-extrabold flex flex-col items-center justify-center leading-tight py-1"
                >
                  <span>{Math.round(ytdMetrics.litros.prev.suer).toLocaleString()}</span>
                  <span className="text-[7.5px] opacity-90">{ytdMetrics.litros.prev.suerPct.toFixed(1)} %</span>
                </div>
                <div 
                  style={{ height: `${ytdMetrics.litros.prev.isotPct}%` }}
                  className="bg-[#f39257] text-white text-[9px] font-extrabold flex flex-col items-center justify-center leading-tight py-1"
                >
                  <span>{Math.round(ytdMetrics.litros.prev.isot).toLocaleString()}</span>
                  <span className="text-[7.5px] opacity-90">{ytdMetrics.litros.prev.isotPct.toFixed(1)} %</span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-600 mt-1">{prevYear}</span>
            </div>

            {/* 2026 Bar */}
            <div className="flex-1 flex flex-col items-center h-full justify-end">
              <span className="text-[10px] font-bold text-slate-700 mb-1 bg-slate-100 px-1.5 py-0.5 rounded-sm shadow-2xs">
                {Math.round(ytdMetrics.litros.curr.total).toLocaleString()}
              </span>
              <div className="w-12 sm:w-14 flex flex-col rounded-t-sm overflow-hidden h-[88%] shadow-2xs">
                <div 
                  style={{ height: `${ytdMetrics.litros.curr.suerPct}%` }}
                  className="bg-[#0aa0b9] text-white text-[9px] font-extrabold flex flex-col items-center justify-center leading-tight py-1"
                >
                  <span>{Math.round(ytdMetrics.litros.curr.suer).toLocaleString()}</span>
                  <span className="text-[7.5px] opacity-90">{ytdMetrics.litros.curr.suerPct.toFixed(1)} %</span>
                </div>
                <div 
                  style={{ height: `${ytdMetrics.litros.curr.isotPct}%` }}
                  className="bg-[#f39257] text-white text-[9px] font-extrabold flex flex-col items-center justify-center leading-tight py-1"
                >
                  <span>{Math.round(ytdMetrics.litros.curr.isot).toLocaleString()}</span>
                  <span className="text-[7.5px] opacity-90">{ytdMetrics.litros.curr.isotPct.toFixed(1)} %</span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-600 mt-1">{selectedYear}</span>
            </div>

            {/* %Var BARRA GRIS SÓLIDA CON FLOATING PILLS DE COLOR */}
            <div className="w-14 flex flex-col items-center h-full justify-end">
              <span className="text-[10px] font-bold text-slate-800 mb-1 bg-slate-200/90 border border-slate-300 px-1.5 py-0.5 rounded-md shadow-2xs">
                {ytdMetrics.litros.varPct.total >= 0 ? '+' : ''}{ytdMetrics.litros.varPct.total.toFixed(1)}%
              </span>
              <div className="w-full flex flex-col justify-around items-center rounded-sm h-[88%] bg-[#9ca3af] p-1 shadow-2xs">
                <div className="w-full bg-[#0aa0b9] text-white text-[9px] font-extrabold rounded-md py-1 flex items-center justify-center shadow-xs">
                  {ytdMetrics.litros.varPct.suer >= 0 ? '+' : ''}{ytdMetrics.litros.varPct.suer.toFixed(1)}%
                </div>
                <div className="w-full bg-[#f39257] text-white text-[9px] font-extrabold rounded-md py-1 flex items-center justify-center shadow-xs">
                  {ytdMetrics.litros.varPct.isot >= 0 ? '+' : ''}{ytdMetrics.litros.varPct.isot.toFixed(1)}%
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-600 mt-1">%Var.</span>
            </div>

          </div>
        </div>

        {/* CARD 3: VALOR COP (000,000) */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex flex-col justify-between h-[280px]">
          <div className="text-center font-black text-[#00529B] text-xs border-b border-dashed border-blue-200 pb-1.5">
            Valor COP (000,000)
          </div>
          <div className="flex items-end justify-between gap-2 flex-1 pt-3 pb-1">
            
            {/* 2025 Bar */}
            <div className="flex-1 flex flex-col items-center h-full justify-end">
              <span className="text-[10px] font-bold text-slate-700 mb-1 bg-slate-100 px-1.5 py-0.5 rounded-sm shadow-2xs">
                {Math.round(ytdMetrics.valor.prev.total).toLocaleString()}
              </span>
              <div className="w-12 sm:w-14 flex flex-col rounded-t-sm overflow-hidden h-[73%] shadow-2xs">
                <div 
                  style={{ height: `${ytdMetrics.valor.prev.suerPct}%` }}
                  className="bg-[#0aa0b9] text-white text-[9px] font-extrabold flex flex-col items-center justify-center leading-tight py-1"
                >
                  <span>{Math.round(ytdMetrics.valor.prev.suer).toLocaleString()}</span>
                  <span className="text-[7.5px] opacity-90">{ytdMetrics.valor.prev.suerPct.toFixed(1)} %</span>
                </div>
                <div 
                  style={{ height: `${ytdMetrics.valor.prev.isotPct}%` }}
                  className="bg-[#f39257] text-white text-[9px] font-extrabold flex flex-col items-center justify-center leading-tight py-1"
                >
                  <span>{Math.round(ytdMetrics.valor.prev.isot).toLocaleString()}</span>
                  <span className="text-[7.5px] opacity-90">{ytdMetrics.valor.prev.isotPct.toFixed(1)} %</span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-600 mt-1">{prevYear}</span>
            </div>

            {/* 2026 Bar */}
            <div className="flex-1 flex flex-col items-center h-full justify-end">
              <span className="text-[10px] font-bold text-slate-700 mb-1 bg-slate-100 px-1.5 py-0.5 rounded-sm shadow-2xs">
                {Math.round(ytdMetrics.valor.curr.total).toLocaleString()}
              </span>
              <div className="w-12 sm:w-14 flex flex-col rounded-t-sm overflow-hidden h-[88%] shadow-2xs">
                <div 
                  style={{ height: `${ytdMetrics.valor.curr.suerPct}%` }}
                  className="bg-[#0aa0b9] text-white text-[9px] font-extrabold flex flex-col items-center justify-center leading-tight py-1"
                >
                  <span>{Math.round(ytdMetrics.valor.curr.suer).toLocaleString()}</span>
                  <span className="text-[7.5px] opacity-90">{ytdMetrics.valor.curr.suerPct.toFixed(1)} %</span>
                </div>
                <div 
                  style={{ height: `${ytdMetrics.valor.curr.isotPct}%` }}
                  className="bg-[#f39257] text-white text-[9px] font-extrabold flex flex-col items-center justify-center leading-tight py-1"
                >
                  <span>{Math.round(ytdMetrics.valor.curr.isot).toLocaleString()}</span>
                  <span className="text-[7.5px] opacity-90">{ytdMetrics.valor.curr.isotPct.toFixed(1)} %</span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-600 mt-1">{selectedYear}</span>
            </div>

            {/* %Var BARRA GRIS SÓLIDA CON FLOATING PILLS DE COLOR */}
            <div className="w-14 flex flex-col items-center h-full justify-end">
              <span className="text-[10px] font-bold text-slate-800 mb-1 bg-slate-200/90 border border-slate-300 px-1.5 py-0.5 rounded-md shadow-2xs">
                {ytdMetrics.valor.varPct.total >= 0 ? '+' : ''}{ytdMetrics.valor.varPct.total.toFixed(1)}%
              </span>
              <div className="w-full flex flex-col justify-around items-center rounded-sm h-[88%] bg-[#9ca3af] p-1 shadow-2xs">
                <div className="w-full bg-[#0aa0b9] text-white text-[9px] font-extrabold rounded-md py-1 flex items-center justify-center shadow-xs">
                  {ytdMetrics.valor.varPct.suer >= 0 ? '+' : ''}{ytdMetrics.valor.varPct.suer.toFixed(1)}%
                </div>
                <div className="w-full bg-[#f39257] text-white text-[9px] font-extrabold rounded-md py-1 flex items-center justify-center shadow-xs">
                  {ytdMetrics.valor.varPct.isot >= 0 ? '+' : ''}{ytdMetrics.valor.varPct.isot.toFixed(1)}%
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-600 mt-1">%Var.</span>
            </div>

          </div>
        </div>

        {/* CARD 4: PRECIO / UNIDAD COP */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex flex-col justify-between h-[280px]">
          <div className="text-center font-black text-[#00529B] text-xs border-b border-dashed border-blue-200 pb-1.5">
            Precio/Unidad COP
          </div>
          <div className="flex items-end justify-between gap-2 flex-1 pt-3 pb-1">
            
            {/* GRÁFICO DE PENDIENTE SVG CON CUADROS DE TOTALES EXACTOS */}
            <div className="flex-1 flex flex-col justify-between h-full py-1 relative">
              <svg className="w-full h-[180px] overflow-visible" viewBox="0 0 140 180">
                {/* Línea Sueros (Teal: 8,378 -> 8,707) */}
                <line x1="25" y1="52" x2="115" y2="40" stroke="#0aa0b9" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="25" cy="52" r="4" fill="#0aa0b9" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="115" cy="40" r="4" fill="#0aa0b9" stroke="#ffffff" strokeWidth="1.5" />
                
                {/* Cuadros de Totales Sueros */}
                <rect x="6" y="24" width="38" height="15" rx="3" fill="#f1f3f5" stroke="#ced4da" strokeWidth="0.8" className="shadow-2xs" />
                <text x="25" y="35" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#343a40">
                  {ytdMetrics.precio.prev.suer.toLocaleString()}
                </text>

                <rect x="96" y="12" width="38" height="15" rx="3" fill="#f1f3f5" stroke="#ced4da" strokeWidth="0.8" className="shadow-2xs" />
                <text x="115" y="23" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#343a40">
                  {ytdMetrics.precio.curr.suer.toLocaleString()}
                </text>

                {/* Línea Isotónicas (Orange: 3,306 -> 3,672) */}
                <line x1="25" y1="135" x2="115" y2="118" stroke="#f39257" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="25" cy="135" r="4" fill="#f39257" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="115" cy="118" r="4" fill="#f39257" stroke="#ffffff" strokeWidth="1.5" />

                {/* Cuadros de Totales Isotónicas */}
                <rect x="6" y="106" width="38" height="15" rx="3" fill="#f1f3f5" stroke="#ced4da" strokeWidth="0.8" className="shadow-2xs" />
                <text x="25" y="117" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#343a40">
                  {ytdMetrics.precio.prev.isot.toLocaleString()}
                </text>

                <rect x="96" y="90" width="38" height="15" rx="3" fill="#f1f3f5" stroke="#ced4da" strokeWidth="0.8" className="shadow-2xs" />
                <text x="115" y="101" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#343a40">
                  {ytdMetrics.precio.curr.isot.toLocaleString()}
                </text>
              </svg>

              <div className="flex justify-between px-3 text-[10px] font-bold text-slate-600 mt-1">
                <span>{prevYear}</span>
                <span>{selectedYear}</span>
              </div>
            </div>

            {/* %Var BARRA GRIS CON PILLS */}
            <div className="w-14 flex flex-col items-center h-full justify-end">
              <div className="w-full flex flex-col justify-around items-center rounded-sm h-[88%] bg-[#9ca3af] p-1 shadow-2xs">
                <div className="w-full bg-[#0aa0b9] text-white text-[9px] font-extrabold rounded-md py-1 flex items-center justify-center shadow-xs">
                  {ytdMetrics.precio.varPct.suer >= 0 ? '+' : ''}{ytdMetrics.precio.varPct.suer.toFixed(1)}%
                </div>
                <div className="w-full bg-[#f39257] text-white text-[9px] font-extrabold rounded-md py-1 flex items-center justify-center shadow-xs">
                  {ytdMetrics.precio.varPct.isot >= 0 ? '+' : ''}{ytdMetrics.precio.varPct.isot.toFixed(1)}%
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-600 mt-1">%Var.</span>
            </div>

          </div>
        </div>

        {/* CARD 5: DIST. NUM. */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex flex-col justify-between h-[280px]">
          <div className="text-center font-black text-[#00529B] text-xs border-b border-dashed border-blue-200 pb-1.5">
            Dist. Num.
          </div>
          <div className="flex items-end justify-between gap-2 flex-1 pt-3 pb-1">
            
            {/* GRÁFICO DE PENDIENTE SVG CON CUADROS DE TOTALES EXACTOS */}
            <div className="flex-1 flex flex-col justify-between h-full py-1 relative">
              <svg className="w-full h-[180px] overflow-visible" viewBox="0 0 140 180">
                {(() => {
                  const minD = 55;
                  const maxD = 85;
                  const getY = (val) => 150 - ((val - minD) / (maxD - minD)) * 120;
                  const yIsotPrev = getY(ytdMetrics.distribucion.prev.isot);
                  const yIsotCurr = getY(ytdMetrics.distribucion.curr.isot);
                  const ySuerPrev = getY(ytdMetrics.distribucion.prev.suer);
                  const ySuerCurr = getY(ytdMetrics.distribucion.curr.suer);

                  return (
                    <>
                      {/* Línea Isotónicas (Orange) */}
                      <line x1="25" y1={yIsotPrev} x2="115" y2={yIsotCurr} stroke="#f39257" strokeWidth="2.5" strokeLinecap="round" />
                      <circle cx="25" cy={yIsotPrev} r="4" fill="#f39257" stroke="#ffffff" strokeWidth="1.5" />
                      <circle cx="115" cy={yIsotCurr} r="4" fill="#f39257" stroke="#ffffff" strokeWidth="1.5" />
                      
                      {/* Cuadros de Totales Isotónicas */}
                      <rect x="6" y={yIsotPrev - 26} width="38" height="15" rx="3" fill="#f1f3f5" stroke="#ced4da" strokeWidth="0.8" className="shadow-2xs" />
                      <text x="25" y={yIsotPrev - 15} textAnchor="middle" fontSize="9" fontWeight="bold" fill="#343a40">
                        {ytdMetrics.distribucion.prev.isot.toFixed(1)}%
                      </text>

                      <rect x="96" y={yIsotCurr - 26} width="38" height="15" rx="3" fill="#f1f3f5" stroke="#ced4da" strokeWidth="0.8" className="shadow-2xs" />
                      <text x="115" y={yIsotCurr - 15} textAnchor="middle" fontSize="9" fontWeight="bold" fill="#343a40">
                        {ytdMetrics.distribucion.curr.isot.toFixed(1)}%
                      </text>

                      {/* Línea Sueros (Teal) */}
                      <line x1="25" y1={ySuerPrev} x2="115" y2={ySuerCurr} stroke="#0aa0b9" strokeWidth="2.5" strokeLinecap="round" />
                      <circle cx="25" cy={ySuerPrev} r="4" fill="#0aa0b9" stroke="#ffffff" strokeWidth="1.5" />
                      <circle cx="115" cy={ySuerCurr} r="4" fill="#0aa0b9" stroke="#ffffff" strokeWidth="1.5" />

                      {/* Cuadros de Totales Sueros */}
                      <rect x="6" y={ySuerPrev - 26} width="38" height="15" rx="3" fill="#f1f3f5" stroke="#ced4da" strokeWidth="0.8" className="shadow-2xs" />
                      <text x="25" y={ySuerPrev - 15} textAnchor="middle" fontSize="9" fontWeight="bold" fill="#343a40">
                        {ytdMetrics.distribucion.prev.suer.toFixed(1)}%
                      </text>

                      <rect x="96" y={ySuerCurr - 26} width="38" height="15" rx="3" fill="#f1f3f5" stroke="#ced4da" strokeWidth="0.8" className="shadow-2xs" />
                      <text x="115" y={ySuerCurr - 15} textAnchor="middle" fontSize="9" fontWeight="bold" fill="#343a40">
                        {ytdMetrics.distribucion.curr.suer.toFixed(1)}%
                      </text>
                    </>
                  );
                })()}
              </svg>

              <div className="flex justify-between px-3 text-[10px] font-bold text-slate-600 mt-1">
                <span>{prevYear}</span>
                <span>{selectedYear}</span>
              </div>
            </div>

            {/* %Var BARRA GRIS CON PILLS */}
            <div className="w-14 flex flex-col items-center h-full justify-end">
              <div className="w-full flex flex-col justify-around items-center rounded-sm h-[88%] bg-[#9ca3af] p-1 shadow-2xs">
                <div className="w-full bg-[#f39257] text-white text-[9px] font-extrabold rounded-md py-1 flex items-center justify-center shadow-xs">
                  {ytdMetrics.distribucion.varPp.isot >= 0 ? '+' : ''}{ytdMetrics.distribucion.varPp.isot.toFixed(1)} pp
                </div>
                <div className="w-full bg-[#0aa0b9] text-white text-[9px] font-extrabold rounded-md py-1 flex items-center justify-center shadow-xs">
                  {ytdMetrics.distribucion.varPp.suer >= 0 ? '+' : ''}{ytdMetrics.distribucion.varPp.suer.toFixed(1)} pp
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-600 mt-1">%Var.</span>
            </div>

          </div>
        </div>

      </div>

      {/* 3. FILA 1 DE GRÁFICOS: UNIDADES (000) & PRECIO/UNIDAD COP */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
        
        {/* GRÁFICO 1: UNIDADES (000) */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between h-[340px]">
          <div className="text-center font-bold text-[#00529B] text-xs border-b border-dashed border-blue-200 pb-2">
            Unidades (000)
          </div>
          
          <div className="w-full flex items-end justify-between gap-1 sm:gap-2 h-64 pt-4 px-1">
            {displayedMonthlyData.map(m => {
              const total = m.isotonicos_unds + m.sueros_unds;
              const suerPct = total > 0 ? (m.sueros_unds / total) * 100 : 0;
              const isotPct = total > 0 ? (m.isotonicos_unds / total) * 100 : 0;
              const maxVal = 30000;
              const totalHeightPx = Math.max(70, Math.round((total / maxVal) * 190));

              return (
                <div key={m.mesCode} className="flex-1 flex flex-col items-center h-full justify-end group min-w-0">
                  {/* Total Top Pill */}
                  <span className="text-[9.5px] font-bold text-slate-700 mb-1.5 bg-[#f1f3f5] border border-[#ced4da] px-1.5 py-0.5 rounded-xs shadow-2xs whitespace-nowrap">
                    {Math.round(total).toLocaleString()}
                  </span>

                  {/* Stacked Bar */}
                  <div 
                    style={{ height: `${totalHeightPx}px` }} 
                    className="w-full max-w-[44px] flex flex-col rounded-t-xs overflow-hidden shadow-2xs"
                  >
                    {/* Sueros (Top Teal Segment) */}
                    <div 
                      style={{ height: `${suerPct}%` }}
                      className="bg-[#0aa0b9] text-white text-[8px] sm:text-[8.5px] font-extrabold flex flex-col items-center justify-center leading-tight p-0.5"
                    >
                      <span>{Math.round(m.sueros_unds).toLocaleString()}</span>
                      <span className="text-[7px] opacity-90">{suerPct.toFixed(1)} %</span>
                    </div>

                    {/* Isotónicas (Bottom Orange Segment) */}
                    <div 
                      style={{ height: `${isotPct}%` }}
                      className="bg-[#f39257] text-white text-[8px] sm:text-[8.5px] font-extrabold flex flex-col items-center justify-center leading-tight p-0.5"
                    >
                      <span>{Math.round(m.isotonicos_unds).toLocaleString()}</span>
                      <span className="text-[7px] opacity-90">{isotPct.toFixed(1)} %</span>
                    </div>
                  </div>

                  {/* Mes Label */}
                  <span className="text-[9.5px] font-bold text-slate-600 mt-2 whitespace-nowrap">{m.mesCode}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* GRÁFICO 2: PRECIO/UNIDAD COP */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between h-[340px]">
          <div className="text-center font-bold text-[#00529B] text-xs border-b border-dashed border-blue-200 pb-2">
            Precio/Unidad COP
          </div>
          
          <div className="w-full flex items-end justify-between gap-1 sm:gap-2 h-64 pt-4 px-1 relative">
            {/* SVG Background Layer for Connected Trend Lines */}
            {(() => {
              const numPts = displayedMonthlyData.length;
              const svgWidth = 640;
              const svgHeight = 170;
              const minP = 2500;
              const maxP = 9500;
              const pts = displayedMonthlyData.map((m, idx) => {
                const x = 24 + idx * ((svgWidth - 48) / Math.max(1, numPts - 1));
                const ySuer = 30 + (1 - (m.sueros_precio - minP) / (maxP - minP)) * 90;
                const yIsot = 30 + (1 - (m.isotonicos_precio - minP) / (maxP - minP)) * 90;
                return { x, ySuer, yIsot };
              });
              const pathSuer = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.ySuer}`).join(' ');
              const pathIsot = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yIsot}`).join(' ');

              return (
                <svg className="absolute inset-x-2 top-10 h-40 w-[calc(100%-16px)] pointer-events-none" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="10" y1="35" x2={svgWidth - 10} y2="35" stroke="#f1f5f9" strokeDasharray="3 3" />
                  <line x1="10" y1="85" x2={svgWidth - 10} y2="85" stroke="#f1f5f9" strokeDasharray="3 3" />
                  <line x1="10" y1="135" x2={svgWidth - 10} y2="135" stroke="#f1f5f9" strokeDasharray="3 3" />

                  {/* Lines */}
                  <path d={pathSuer} fill="none" stroke="#0aa0b9" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  <path d={pathIsot} fill="none" stroke="#f39257" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                  {/* Nodes */}
                  {pts.map((p, i) => (
                    <g key={i}>
                      <circle cx={p.x} cy={p.ySuer} r="4.5" fill="#0aa0b9" stroke="#ffffff" strokeWidth="2" />
                      <circle cx={p.x} cy={p.yIsot} r="4.5" fill="#f39257" stroke="#ffffff" strokeWidth="2" />
                    </g>
                  ))}
                </svg>
              );
            })()}

            {/* Pure HTML Column Structure with Identical Total Boxes */}
            {displayedMonthlyData.map(m => (
              <div key={m.mesCode} className="flex-1 flex flex-col items-center h-full justify-between group min-w-0 z-10 py-1">
                {/* Sueros Value Box (Top) */}
                <span className="text-[9.5px] font-bold text-slate-700 bg-[#f1f3f5] border border-[#ced4da] px-1.5 py-0.5 rounded-xs shadow-2xs whitespace-nowrap">
                  {Math.round(m.sueros_precio).toLocaleString()}
                </span>

                <div className="flex-1 my-3"></div>

                {/* Isotónicas Value Box (Bottom) */}
                <span className="text-[9.5px] font-bold text-slate-700 bg-[#f1f3f5] border border-[#ced4da] px-1.5 py-0.5 rounded-xs shadow-2xs whitespace-nowrap">
                  {Math.round(m.isotonicos_precio).toLocaleString()}
                </span>

                {/* Mes Label */}
                <span className="text-[9.5px] font-bold text-slate-600 mt-2 whitespace-nowrap">{m.mesCode}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 4. FILA 2 DE GRÁFICOS: VALOR COP (000,000) & DIST. NUMÉRICA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* GRÁFICO 3: VALOR COP (000,000) */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between h-[340px]">
          <div className="text-center font-bold text-[#00529B] text-xs border-b border-dashed border-blue-200 pb-2">
            Valor COP (000,000)
          </div>
          
          <div className="w-full flex items-end justify-between gap-1 sm:gap-2 h-64 pt-4 px-1">
            {displayedMonthlyData.map(m => {
              const total = m.isotonicos_val + m.sueros_val;
              const suerPct = total > 0 ? (m.sueros_val / total) * 100 : 0;
              const isotPct = total > 0 ? (m.isotonicos_val / total) * 100 : 0;
              const maxVal = 155000;
              const totalHeightPx = Math.max(70, Math.round((total / maxVal) * 190));

              return (
                <div key={m.mesCode} className="flex-1 flex flex-col items-center h-full justify-end group min-w-0">
                  {/* Total Top Pill */}
                  <span className="text-[9.5px] font-bold text-slate-700 mb-1.5 bg-[#f1f3f5] border border-[#ced4da] px-1.5 py-0.5 rounded-xs shadow-2xs whitespace-nowrap">
                    {Math.round(total).toLocaleString()}
                  </span>

                  {/* Stacked Bar */}
                  <div 
                    style={{ height: `${totalHeightPx}px` }} 
                    className="w-full max-w-[44px] flex flex-col rounded-t-xs overflow-hidden shadow-2xs"
                  >
                    {/* Sueros (Top Teal Segment) */}
                    <div 
                      style={{ height: `${suerPct}%` }}
                      className="bg-[#0aa0b9] text-white text-[8px] sm:text-[8.5px] font-extrabold flex flex-col items-center justify-center leading-tight p-0.5"
                    >
                      <span>{Math.round(m.sueros_val).toLocaleString()}</span>
                      <span className="text-[7px] opacity-90">{suerPct.toFixed(1)} %</span>
                    </div>

                    {/* Isotónicas (Bottom Orange Segment) */}
                    <div 
                      style={{ height: `${isotPct}%` }}
                      className="bg-[#f39257] text-white text-[8px] sm:text-[8.5px] font-extrabold flex flex-col items-center justify-center leading-tight p-0.5"
                    >
                      <span>{Math.round(m.isotonicos_val).toLocaleString()}</span>
                      <span className="text-[7px] opacity-90">{isotPct.toFixed(1)} %</span>
                    </div>
                  </div>

                  {/* Mes Label */}
                  <span className="text-[9.5px] font-bold text-slate-600 mt-2 whitespace-nowrap">{m.mesCode}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* GRÁFICO 4: DIST. NUMÉRICA (APERTURA TOTAL) */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between h-[340px]">
          <div className="text-center font-bold text-[#00529B] text-xs border-b border-dashed border-blue-200 pb-2">
            Dist. Numérica
          </div>
          
          <div className="w-full flex items-end justify-between gap-1 sm:gap-2 h-64 pt-4 px-1 relative">
            {/* SVG Background Layer for Connected Trend Lines */}
            {(() => {
              const numPts = displayedMonthlyData.length;
              const svgWidth = 640;
              const svgHeight = 170;
              const minD = 55;
              const maxD = 85;
              const pts = displayedMonthlyData.map((m, idx) => {
                const x = 24 + idx * ((svgWidth - 48) / Math.max(1, numPts - 1));
                const yIsot = 30 + (1 - (m.isotonicos_dist - minD) / (maxD - minD)) * 90;
                const ySuer = 30 + (1 - (m.sueros_dist - minD) / (maxD - minD)) * 90;
                return { x, yIsot, ySuer };
              });
              const pathIsot = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yIsot}`).join(' ');
              const pathSuer = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.ySuer}`).join(' ');

              return (
                <svg className="absolute inset-x-2 top-10 h-40 w-[calc(100%-16px)] pointer-events-none" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="10" y1="35" x2={svgWidth - 10} y2="35" stroke="#f1f5f9" strokeDasharray="3 3" />
                  <line x1="10" y1="85" x2={svgWidth - 10} y2="85" stroke="#f1f5f9" strokeDasharray="3 3" />
                  <line x1="10" y1="135" x2={svgWidth - 10} y2="135" stroke="#f1f5f9" strokeDasharray="3 3" />

                  {/* Lines */}
                  <path d={pathIsot} fill="none" stroke="#f39257" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  <path d={pathSuer} fill="none" stroke="#0aa0b9" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                  {/* Nodes */}
                  {pts.map((p, i) => (
                    <g key={i}>
                      <circle cx={p.x} cy={p.yIsot} r="4.5" fill="#f39257" stroke="#ffffff" strokeWidth="2" />
                      <circle cx={p.x} cy={p.ySuer} r="4.5" fill="#0aa0b9" stroke="#ffffff" strokeWidth="2" />
                    </g>
                  ))}
                </svg>
              );
            })()}

            {/* Pure HTML Column Structure with Identical Total Boxes */}
            {displayedMonthlyData.map(m => (
              <div key={m.mesCode} className="flex-1 flex flex-col items-center h-full justify-between group min-w-0 z-10 py-1">
                {/* Isotónicas Value Box (Top: 76% to 79%) */}
                <span className="text-[9.5px] font-bold text-slate-700 bg-[#f1f3f5] border border-[#ced4da] px-1.5 py-0.5 rounded-xs shadow-2xs whitespace-nowrap">
                  {Math.round(m.isotonicos_dist)}%
                </span>

                <div className="flex-1 my-3"></div>

                {/* Sueros Value Box (Bottom: 60% to 64%) */}
                <span className="text-[9.5px] font-bold text-slate-700 bg-[#f1f3f5] border border-[#ced4da] px-1.5 py-0.5 rounded-xs shadow-2xs whitespace-nowrap">
                  {Math.round(m.sueros_dist)}%
                </span>

                {/* Mes Label */}
                <span className="text-[9.5px] font-bold text-slate-600 mt-2 whitespace-nowrap">{m.mesCode}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 5. FILA 3: TABLAS SOM */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* TABLA 1: SOM UNIDADES */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="text-center font-bold text-[#00529B] text-xs border-b border-dashed border-blue-200 pb-2 mb-2.5">
            SOM Unidades
          </div>
          <div className="overflow-x-auto max-h-[400px] rounded-lg border border-slate-200/90">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 sticky top-0 z-30">
                  <th className="p-2 sticky left-0 bg-[#e9ecef] text-slate-800 font-bold min-w-[110px] z-40 border-r border-slate-300">
                    MARCA
                  </th>
                  {displayedMonthlyData.map(m => (
                    <th 
                      key={m.mesCode} 
                      className="p-1.5 text-center min-w-[52px] uppercase text-[10px] bg-slate-100 text-slate-700 font-bold"
                    >
                      {m.mesCode}
                    </th>
                  ))}
                  <th className="p-1.5 text-center min-w-[76px] uppercase text-[10px] bg-[#dee2e6] text-slate-900 font-black border-l border-slate-300 sticky right-0 z-40">
                    TOTAL YTD
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {processedSomUnidades.map((row) => {
                  const isHighlighted = row.marca === 'ELECTROLIT' || row.marca === 'ELECTROLIFE';
                  return (
                    <tr key={row.marca} className={isHighlighted ? 'bg-[#edf4ff] font-bold' : 'hover:bg-slate-50'}>
                      <td className={`p-2 sticky left-0 z-20 font-bold ${isHighlighted ? 'bg-[#d7e8ff] text-[#00529B]' : 'bg-white text-slate-800'} border-r border-slate-200 whitespace-nowrap`}>
                        {row.marca}
                      </td>
                      {displayedMonthlyData.map((m, mIdx) => {
                        const val = row.meses[m.mesCode];
                        const prevMesCode = mIdx > 0 ? displayedMonthlyData[mIdx - 1].mesCode : null;
                        const prevVal = prevMesCode ? row.meses[prevMesCode] : null;
                        
                        let diff = null;
                        if (val !== null && prevVal !== null && val !== undefined && prevVal !== undefined) {
                          diff = val - prevVal;
                        }

                        let bgClass = '';
                        if (diff !== null) {
                          if (diff >= 0.2) {
                            bgClass = 'bg-[#d1fae5] text-emerald-900 font-bold';
                          } else if (diff <= -0.2) {
                            bgClass = 'bg-[#ffe4e6] text-rose-900 font-bold';
                          }
                        }

                        return (
                          <td key={m.mesCode} className={`p-1.5 text-center tabular-nums text-[10.5px] ${bgClass}`}>
                            {val !== null && val !== undefined ? `${val.toFixed(1)} %` : '-'}
                          </td>
                        );
                      })}
                      {/* TOTAL YTD Column */}
                      <td className="p-1.5 text-center tabular-nums text-[11px] font-black bg-[#f1f3f5] text-slate-900 border-l border-slate-300 sticky right-0 z-20">
                        {row.totalYtd !== null && row.totalYtd !== undefined ? `${row.totalYtd.toFixed(1)} %` : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* TABLA 2: SOM VALOR COP */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="text-center font-bold text-[#00529B] text-xs border-b border-dashed border-blue-200 pb-2 mb-2.5">
            SOM Valor COP
          </div>
          <div className="overflow-x-auto max-h-[400px] rounded-lg border border-slate-200/90">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 sticky top-0 z-30">
                  <th className="p-2 sticky left-0 bg-[#e9ecef] text-slate-800 font-bold min-w-[110px] z-40 border-r border-slate-300">
                    MARCA
                  </th>
                  {displayedMonthlyData.map(m => (
                    <th 
                      key={m.mesCode} 
                      className="p-1.5 text-center min-w-[52px] uppercase text-[10px] bg-slate-100 text-slate-700 font-bold"
                    >
                      {m.mesCode}
                    </th>
                  ))}
                  <th className="p-1.5 text-center min-w-[76px] uppercase text-[10px] bg-[#dee2e6] text-slate-900 font-black border-l border-slate-300 sticky right-0 z-40">
                    TOTAL YTD
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {processedSomValor.map((row) => {
                  const isHighlighted = row.marca === 'ELECTROLIT' || row.marca === 'ELECTROLIFE';
                  return (
                    <tr key={row.marca} className={isHighlighted ? 'bg-[#edf4ff] font-bold' : 'hover:bg-slate-50'}>
                      <td className={`p-2 sticky left-0 z-20 font-bold ${isHighlighted ? 'bg-[#d7e8ff] text-[#00529B]' : 'bg-white text-slate-800'} border-r border-slate-200 whitespace-nowrap`}>
                        {row.marca}
                      </td>
                      {displayedMonthlyData.map((m, mIdx) => {
                        const val = row.meses[m.mesCode];
                        const prevMesCode = mIdx > 0 ? displayedMonthlyData[mIdx - 1].mesCode : null;
                        const prevVal = prevMesCode ? row.meses[prevMesCode] : null;
                        
                        let diff = null;
                        if (val !== null && prevVal !== null && val !== undefined && prevVal !== undefined) {
                          diff = val - prevVal;
                        }

                        let bgClass = '';
                        if (diff !== null) {
                          if (diff >= 0.2) {
                            bgClass = 'bg-[#d1fae5] text-emerald-900 font-bold';
                          } else if (diff <= -0.2) {
                            bgClass = 'bg-[#ffe4e6] text-rose-900 font-bold';
                          }
                        }

                        return (
                          <td key={m.mesCode} className={`p-1.5 text-center tabular-nums text-[10.5px] ${bgClass}`}>
                            {val !== null && val !== undefined ? `${val.toFixed(1)} %` : '-'}
                          </td>
                        );
                      })}
                      {/* TOTAL YTD Column */}
                      <td className="p-1.5 text-center tabular-nums text-[11px] font-black bg-[#f1f3f5] text-slate-900 border-l border-slate-300 sticky right-0 z-20">
                        {row.totalYtd !== null && row.totalYtd !== undefined ? `${row.totalYtd.toFixed(1)} %` : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};

export default ColombiaOverviewView;
