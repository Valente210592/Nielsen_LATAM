import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import { execSync } from 'child_process';
import NodeCache from 'node-cache';
import { createServer as createViteServer } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production';

const app = express();
app.use(express.json());
app.use(cookieParser());

// Caché con TTL de 5 minutos
const queryCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

// Función auxiliar para consultar BigQuery vía REST API con el Access Token de gcloud
let cachedToken = null;
let tokenExpiresAt = 0;

function getAccessToken(force = false) {
  const now = Date.now();
  if (!force && cachedToken && now < tokenExpiresAt) {
    return cachedToken;
  }
  try {
    cachedToken = execSync('gcloud auth print-access-token', { encoding: 'utf8' }).trim();
    tokenExpiresAt = now + 15 * 60 * 1000; // 15 minutos seguro
    return cachedToken;
  } catch (err) {
    console.error('Error al obtener access token de gcloud:', err.message);
    throw err;
  }
}

async function executeBqRequest(sql, token, billingProject = 'psa-ia-data-mx-dev-proj-hada') {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      query: sql,
      useLegacySql: false
    });

    const req = https.request({
      hostname: 'bigquery.googleapis.com',
      path: `/bigquery/v2/projects/${billingProject}/queries`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed.error) {
            const err = new Error(parsed.error.message || JSON.stringify(parsed.error));
            err.code = parsed.error.code || res.statusCode;
            return reject(err);
          }
          if (!parsed.rows || !parsed.schema?.fields) {
            return resolve([]);
          }
          const fields = parsed.schema.fields.map(f => f.name);
          const formatted = parsed.rows.map(row => {
            const obj = {};
            row.f.forEach((cell, idx) => {
              obj[fields[idx]] = cell.v;
            });
            return obj;
          });
          resolve(formatted);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function runBqQuery(sql) {
  let token = getAccessToken();
  try {
    return await executeBqRequest(sql, token, 'psa-ia-data-mx-dev-proj-hada');
  } catch (err) {
    // Si falla por cuota o permisos en un proyecto, intentar con el proyecto alternativo o renovar token
    if (err.code === 401 || /authentication|credential|token|unauthorized/i.test(err.message)) {
      console.warn('⚠️ Access token expirado. Renovando vía gcloud...');
      token = getAccessToken(true);
      return await executeBqRequest(sql, token, 'psa-ia-data-mx-dev-proj-hada');
    }
    if (err.code === 403 && /quota/i.test(err.message)) {
      console.warn('⚠️ Cuota diaria excedida en proyecto primario, intentando con psa-eltr-latam-pr...');
      return await executeBqRequest(sql, token, 'psa-eltr-latam-pr');
    }
    throw err;
  }
}

// ==========================================
// TELEMETRÍA Y REPORTES DE ERRORES CLIENTE
// ==========================================
app.post('/api/report-error', (req, res) => {
  const { message, stack, componentStack, url } = req.body || {};
  console.error('\n🚨 [CLIENT ERROR DETECTADO EN EL NAVEGADOR]');
  console.error(`📅 Fecha: ${new Date().toISOString()}`);
  if (url) console.error(`🌐 URL: ${url}`);
  if (message) console.error(`❌ Mensaje: ${message}`);
  if (stack) console.error(`📚 Stack: ${stack}`);
  if (componentStack) console.error(`🧩 Component Stack: ${componentStack}`);
  console.error('--------------------------------------------------\n');
  res.json({ status: 'ok', logged: true });
});

// ==========================================
// ENDPOINTS ANALÍTICOS NIELSEN COSTA RICA
// ==========================================

// 1. Overview KPIs de Costa Rica (Endpoint Avanzado para replicar Power BI)
app.get('/api/nielsen/cr/overview-dashboard', async (req, res) => {
  const anio = parseInt(req.query.anio || '2026', 10);
  const mes = req.query.mes || 'Todas'; // 'Todas' o '1'..'12'
  
  const cacheKey = `cr_overview_dashboard_${anio}_${mes}`;
  const cached = queryCache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const anioAnterior = anio - 1;
    
    // Determinar el mes y fecha ancla
    let anchorMonth = 8;
    if (mes !== 'Todas') {
      anchorMonth = parseInt(mes, 10);
    } else {
      // Si es Todas, obtener el mes máximo disponible para ese año
      const maxMesRow = await runBqQuery(`
        SELECT COALESCE(MAX(EXTRACT(MONTH FROM Periods)), 12) as max_mes 
        FROM \`psa-eltr-latam-pr.Nielsen.v_Nielsen_LATAM_Consolidado\` 
        WHERE Pais = 'COSTA RICA' AND EXTRACT(YEAR FROM Periods) = ${anio}
      `);
      if (maxMesRow && maxMesRow[0]) {
        anchorMonth = parseInt(maxMesRow[0].max_mes, 10);
      }
    }

    const padMonth = String(anchorMonth).padStart(2, '0');
    const anchorDateStr = `${anio}-${padMonth}-01`;

    let maxMesClause = '';
    if (mes !== 'Todas') {
      maxMesClause = `AND EXTRACT(MONTH FROM Periods) = ${anchorMonth}`;
    } else {
      maxMesClause = `AND EXTRACT(MONTH FROM Periods) <= ${anchorMonth}`;
    }

    // 1. Consulta Comparativa Anual (Año Actual vs Año Anterior)
    const kpiComparisonQuery = `
      SELECT 
        EXTRACT(YEAR FROM Periods) as anio,
        CATEGORIA,
        ROUND(SUM(Vtas_Unds) / 1000, 1) as unds_k,
        ROUND(SUM(Vtas_LT) / 1000, 1) as lt_k,
        ROUND(SUM(Vtas_Valor) / 1000, 1) as valor_k,
        ROUND(SUM(Vtas_Valor) / NULLIF(SUM(Vtas_Unds), 0), 2) as precio_unit,
        ROUND((SUM(N_de_Tiendas_Venden_C) / NULLIF(SUM(N_de_Tiendas_C), 0)) * 100, 1) as dist_num
      FROM \`psa-eltr-latam-pr.Nielsen.v_Nielsen_LATAM_Consolidado\`
      WHERE Pais = 'COSTA RICA'
        AND Apertura_Canal_Region = 'TOTAL'
        AND Apertura_Productos = 'CATEGORIA'
        AND EXTRACT(YEAR FROM Periods) IN (${anioAnterior}, ${anio})
        ${maxMesClause}
      GROUP BY anio, CATEGORIA
      ORDER BY anio, CATEGORIA
    `;

    // 2. Consulta Mensual L12M por Categoría
    const monthlyQuery = `
      SELECT 
        FORMAT_DATE('%Y-%m-01', Periods) as periodo,
        FORMAT_DATE('%b-%y', Periods) as mes_label,
        CATEGORIA,
        ROUND(SUM(Vtas_Unds) / 1000, 1) as unds_k,
        ROUND(SUM(Vtas_LT) / 1000, 1) as lt_k,
        ROUND(SUM(Vtas_Valor) / 1000, 1) as valor_k,
        ROUND(SUM(Vtas_Valor) / NULLIF(SUM(Vtas_Unds), 0), 2) as precio_unit,
        ROUND((SUM(N_de_Tiendas_Venden_C) / NULLIF(SUM(N_de_Tiendas_C), 0)) * 100, 1) as dist_num
      FROM \`psa-eltr-latam-pr.Nielsen.v_Nielsen_LATAM_Consolidado\`
      WHERE Pais = 'COSTA RICA'
        AND Apertura_Canal_Region = 'TOTAL'
        AND Apertura_Productos = 'CATEGORIA'
        AND Periods >= DATE_SUB(PARSE_DATE('%Y-%m-%d', '${anchorDateStr}'), INTERVAL 11 MONTH)
        AND Periods <= PARSE_DATE('%Y-%m-%d', '${anchorDateStr}')
      GROUP BY periodo, mes_label, CATEGORIA
      ORDER BY periodo, CATEGORIA
    `;

    // 3. Consulta SOM por Marca Mensual (con 1 mes previo adicional para calcular variación del primer mes visible)
    const somQuery = `
      WITH TotalesMensuales AS (
        SELECT 
          Periods,
          SUM(Vtas_Unds) as total_unds_mes,
          SUM(Vtas_Valor) as total_valor_mes
        FROM \`psa-eltr-latam-pr.Nielsen.v_Nielsen_LATAM_Consolidado\`
        WHERE Pais = 'COSTA RICA'
          AND Apertura_Canal_Region = 'TOTAL'
          AND Apertura_Productos = 'MARCA'
          AND Periods >= DATE_SUB(PARSE_DATE('%Y-%m-%d', '${anchorDateStr}'), INTERVAL 12 MONTH)
          AND Periods <= PARSE_DATE('%Y-%m-%d', '${anchorDateStr}')
        GROUP BY Periods
      ),
      VentasMarcas AS (
        SELECT 
          m.Periods,
          FORMAT_DATE('%b-%y', m.Periods) as mes_label,
          m.MARCA,
          SUM(m.Vtas_Unds) as marca_unds,
          SUM(m.Vtas_Valor) as marca_valor
        FROM \`psa-eltr-latam-pr.Nielsen.v_Nielsen_LATAM_Consolidado\` m
        WHERE m.Pais = 'COSTA RICA'
          AND m.Apertura_Canal_Region = 'TOTAL'
          AND m.Apertura_Productos = 'MARCA'
          AND m.Periods >= DATE_SUB(PARSE_DATE('%Y-%m-%d', '${anchorDateStr}'), INTERVAL 12 MONTH)
          AND m.Periods <= PARSE_DATE('%Y-%m-%d', '${anchorDateStr}')
        GROUP BY m.Periods, mes_label, m.MARCA
      ),
      TotalesAcumulados AS (
        SELECT 
          SUM(Vtas_Unds) as gran_total_unds,
          SUM(Vtas_Valor) as gran_total_valor
        FROM \`psa-eltr-latam-pr.Nielsen.v_Nielsen_LATAM_Consolidado\`
        WHERE Pais = 'COSTA RICA'
          AND Apertura_Canal_Region = 'TOTAL'
          AND Apertura_Productos = 'MARCA'
          AND Periods >= DATE_SUB(PARSE_DATE('%Y-%m-%d', '${anchorDateStr}'), INTERVAL 11 MONTH)
          AND Periods <= PARSE_DATE('%Y-%m-%d', '${anchorDateStr}')
      ),
      MarcaTotalesAcumulados AS (
        SELECT 
          m.MARCA,
          SUM(m.Vtas_Unds) as gran_marca_unds,
          SUM(m.Vtas_Valor) as gran_marca_valor
        FROM \`psa-eltr-latam-pr.Nielsen.v_Nielsen_LATAM_Consolidado\` m
        WHERE m.Pais = 'COSTA RICA'
          AND m.Apertura_Canal_Region = 'TOTAL'
          AND m.Apertura_Productos = 'MARCA'
          AND m.Periods >= DATE_SUB(PARSE_DATE('%Y-%m-%d', '${anchorDateStr}'), INTERVAL 11 MONTH)
          AND Periods <= PARSE_DATE('%Y-%m-%d', '${anchorDateStr}')
        GROUP BY m.MARCA
      )
      SELECT 
        v.mes_label,
        v.MARCA,
        ROUND((v.marca_unds / t.total_unds_mes) * 100, 1) as som_unds_pct,
        ROUND((v.marca_valor / t.total_valor_mes) * 100, 1) as som_valor_pct,
        ROUND((mta.gran_marca_unds / ta.gran_total_unds) * 100, 1) as total_som_unds,
        ROUND((mta.gran_marca_valor / ta.gran_total_valor) * 100, 1) as total_som_usd
      FROM VentasMarcas v
      JOIN TotalesMensuales t ON v.Periods = t.Periods
      LEFT JOIN MarcaTotalesAcumulados mta ON v.MARCA = mta.MARCA
      CROSS JOIN TotalesAcumulados ta
      ORDER BY v.Periods ASC
    `;

    // 4. Consulta de Años y Meses Disponibles en BigQuery para Costa Rica
    const yearsMonthsQuery = `
      SELECT 
        EXTRACT(YEAR FROM Periods) as anio,
        EXTRACT(MONTH FROM Periods) as num_mes
      FROM \`psa-eltr-latam-pr.Nielsen.v_Nielsen_LATAM_Consolidado\`
      WHERE Pais = 'COSTA RICA'
      GROUP BY anio, num_mes
      ORDER BY anio DESC, num_mes ASC
    `;

    const [kpiRows, monthlyRows, somRows, ymRows] = await Promise.all([
      runBqQuery(kpiComparisonQuery),
      runBqQuery(monthlyQuery),
      runBqQuery(somQuery),
      runBqQuery(yearsMonthsQuery)
    ]);

    const monthNames = [
      '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const availableMonthsByYear = {};
    ymRows.forEach(row => {
      const y = String(row.anio);
      const m = parseInt(row.num_mes, 10);
      if (!availableMonthsByYear[y]) {
        availableMonthsByYear[y] = [{ id: 'Todas', label: 'Todas' }];
      }
      availableMonthsByYear[y].push({
        id: String(m),
        label: monthNames[m] || `Mes ${m}`
      });
    });

    const availableYears = Object.keys(availableMonthsByYear).sort((a, b) => b - a);
    
    // Agrupar monthlyRows por mes con desglose por categoría
    const monthlyMap = {};
    monthlyRows.forEach(row => {
      if (!monthlyMap[row.mes_label]) {
        monthlyMap[row.mes_label] = {
          mes_label: row.mes_label,
          periodo: row.periodo,
          unds_isotonicas: 0,
          unds_sueros: 0,
          unds_total: 0,
          valor_isotonicas: 0,
          valor_sueros: 0,
          valor_total: 0,
          precio_isotonicas: 0,
          precio_sueros: 0,
          dist_isotonicas: 0,
          dist_sueros: 0
        };
      }
      const item = monthlyMap[row.mes_label];
      const isIso = row.CATEGORIA.includes('ISOTONIC');
      const unds = Number(row.unds_k || 0);
      const valor = Number(row.valor_k || 0);
      const precio = Number(row.precio_unit || 0);
      const dist = Number(row.dist_num || 0);

      if (isIso) {
        item.unds_isotonicas = unds;
        item.valor_isotonicas = valor;
        item.precio_isotonicas = precio;
        item.dist_isotonicas = dist;
      } else {
        item.unds_sueros = unds;
        item.valor_sueros = valor;
        item.precio_sueros = precio;
        item.dist_sueros = dist;
      }
      item.unds_total = item.unds_isotonicas + item.unds_sueros;
      item.valor_total = item.valor_isotonicas + item.valor_sueros;
    });

    const monthlyTrends = Object.values(monthlyMap);

    // Procesar SOM por Marca
    const brandsSet = new Set();
    const somUndsByBrand = {};
    const somUSDByBrand = {};

    somRows.forEach(row => {
      const brand = row.MARCA;
      if (!brand) return;
      brandsSet.add(brand);
      
      if (!somUndsByBrand[brand]) {
        somUndsByBrand[brand] = { 
          MARCA: brand,
          Total: Number(row.total_som_unds || 0)
        };
      }
      if (!somUSDByBrand[brand]) {
        somUSDByBrand[brand] = { 
          MARCA: brand,
          Total: Number(row.total_som_usd || 0)
        };
      }

      somUndsByBrand[brand][row.mes_label] = Number(row.som_unds_pct || 0);
      somUSDByBrand[brand][row.mes_label] = Number(row.som_valor_pct || 0);
    });

    // Procesar meses únicos ordenados visibles (12 meses móviles)
    const uniqueMonths = [...new Set(monthlyRows.map(r => r.mes_label))];
    const allSomMonths = [...new Set(somRows.map(r => r.mes_label))];
    const baselineMonth = allSomMonths.find(m => !uniqueMonths.includes(m)) || null;

    // Ranking de marcas ordenadas de mayor a menor con base en la columna Total (a la derecha)
    const topBrandsUnds = Object.values(somUndsByBrand)
      .sort((a, b) => (b.Total || 0) - (a.Total || 0))
      .slice(0, 15);

    const topBrandsUSD = Object.values(somUSDByBrand)
      .sort((a, b) => (b.Total || 0) - (a.Total || 0))
      .slice(0, 15);

    const result = {
      anioActual: anio,
      anioAnterior: anioAnterior,
      availableYears,
      availableMonthsByYear,
      kpiRows,
      monthlyTrends,
      uniqueMonths,
      baselineMonth,
      somUnidades: topBrandsUnds,
      somUSD: topBrandsUSD
    };

    queryCache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    console.error('Error al consultar /api/nielsen/cr/overview-dashboard:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// ENDPOINTS ANALÍTICOS NIELSEN GUATEMALA
// ==========================================

// 1. Overview KPIs de Guatemala (Endpoint Avanzado para replicar Power BI)
app.get('/api/nielsen/gt/overview-dashboard', async (req, res) => {
  const anio = parseInt(req.query.anio || '2026', 10);
  const mes = req.query.mes || 'Todas'; // 'Todas' o '1'..'12'
  
  const cacheKey = `gt_overview_dashboard_${anio}_${mes}`;
  const cached = queryCache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const anioAnterior = anio - 1;
    
    // Determinar el mes y fecha ancla
    let anchorMonth = 8;
    if (mes !== 'Todas') {
      anchorMonth = parseInt(mes, 10);
    } else {
      const maxMesRow = await runBqQuery(`
        SELECT COALESCE(MAX(EXTRACT(MONTH FROM Periods)), 12) as max_mes 
        FROM \`psa-eltr-latam-pr.Nielsen.v_Nielsen_LATAM_Consolidado\` 
        WHERE Pais = 'GUATEMALA' AND EXTRACT(YEAR FROM Periods) = ${anio}
      `);
      if (maxMesRow && maxMesRow[0]) {
        anchorMonth = parseInt(maxMesRow[0].max_mes, 10);
      }
    }

    const padMonth = String(anchorMonth).padStart(2, '0');
    const anchorDateStr = `${anio}-${padMonth}-01`;

    let maxMesClause = '';
    if (mes !== 'Todas') {
      maxMesClause = `AND EXTRACT(MONTH FROM Periods) = ${anchorMonth}`;
    } else {
      maxMesClause = `AND EXTRACT(MONTH FROM Periods) <= ${anchorMonth}`;
    }

    // 1. Consulta Comparativa Anual (Año Actual vs Año Anterior)
    const kpiComparisonQuery = `
      SELECT 
        EXTRACT(YEAR FROM Periods) as anio,
        CATEGORIA,
        ROUND(SUM(Vtas_Unds) / 1000, 1) as unds_k,
        ROUND(SUM(Vtas_LT) / 1000, 1) as lt_k,
        ROUND(SUM(Vtas_Valor) / 1000, 1) as valor_k,
        ROUND(SUM(Vtas_Valor) / NULLIF(SUM(Vtas_Unds), 0), 2) as precio_unit,
        ROUND(MAX(SAFE_DIVIDE(N_de_Tiendas_Venden_C, N_de_Tiendas_C)) * 100, 1) as dist_num
      FROM \`psa-eltr-latam-pr.Nielsen.v_Nielsen_LATAM_Consolidado\`
      WHERE Pais = 'GUATEMALA'
        AND Apertura_Canal_Region = 'TOTAL'
        AND Apertura_Productos = 'CATEGORIA'
        AND EXTRACT(YEAR FROM Periods) IN (${anioAnterior}, ${anio})
        ${maxMesClause}
      GROUP BY anio, CATEGORIA
      ORDER BY anio, CATEGORIA
    `;

    // 2. Consulta Mensual L12M por Categoría
    const monthlyQuery = `
      SELECT 
        FORMAT_DATE('%Y-%m-01', Periods) as periodo,
        FORMAT_DATE('%b-%y', Periods) as mes_label,
        CATEGORIA,
        ROUND(SUM(Vtas_Unds) / 1000, 1) as unds_k,
        ROUND(SUM(Vtas_LT) / 1000, 1) as lt_k,
        ROUND(SUM(Vtas_Valor) / 1000, 1) as valor_k,
        ROUND(SUM(Vtas_Valor) / NULLIF(SUM(Vtas_Unds), 0), 2) as precio_unit,
        ROUND(MAX(SAFE_DIVIDE(N_de_Tiendas_Venden_C, N_de_Tiendas_C)) * 100, 1) as dist_num
      FROM \`psa-eltr-latam-pr.Nielsen.v_Nielsen_LATAM_Consolidado\`
      WHERE Pais = 'GUATEMALA'
        AND Apertura_Canal_Region = 'TOTAL'
        AND Apertura_Productos = 'CATEGORIA'
        AND Periods >= DATE_SUB(PARSE_DATE('%Y-%m-%d', '${anchorDateStr}'), INTERVAL 11 MONTH)
        AND Periods <= PARSE_DATE('%Y-%m-%d', '${anchorDateStr}')
      GROUP BY periodo, mes_label, CATEGORIA
      ORDER BY periodo, CATEGORIA
    `;

    // 3. Consulta SOM por Marca Mensual (con 1 mes previo adicional para variación del primer mes visible)
    const somQuery = `
      WITH BaseMarcas AS (
        SELECT 
          Periods,
          FORMAT_DATE('%b-%y', Periods) as mes_label,
          CASE 
            WHEN UPPER(TRIM(MARCA)) IN ('ELECTROLIT', 'HIDRAVIDA') THEN 'HIDRAVIDA'
            WHEN UPPER(TRIM(MARCA)) IN ('ELECTROLIFE', 'HIDRALIFE') THEN 'HIDRALIFE'
            WHEN UPPER(TRIM(MARCA)) = 'GATORADE' THEN 'GATORADE'
            WHEN UPPER(TRIM(MARCA)) IN ('GATORLYTE', 'GATORLIT') THEN 'GATORLYTE'
            WHEN UPPER(TRIM(MARCA)) = 'GLUCOSORAL' THEN 'GLUCOSORAL'
            WHEN UPPER(TRIM(MARCA)) = 'ISOMAX' THEN 'ISOMAX'
            WHEN UPPER(TRIM(MARCA)) = 'PEDIALYTE' THEN 'PEDIALYTE'
            WHEN UPPER(TRIM(MARCA)) = 'POWERADE' THEN 'POWERADE'
            WHEN UPPER(TRIM(MARCA)) = 'REVIVE' THEN 'REVIVE'
            WHEN UPPER(TRIM(MARCA)) = 'SPORADE' THEN 'SPORADE'
            WHEN UPPER(TRIM(MARCA)) = 'SUEROX' THEN 'SUEROX'
            ELSE 'RESTO MARCAS'
          END as MARCA_NORM,
          SUM(Vtas_Unds) as unds,
          SUM(Vtas_Valor) as valor
        FROM \`psa-eltr-latam-pr.Nielsen.v_Nielsen_LATAM_Consolidado\`
        WHERE Pais = 'GUATEMALA'
          AND Apertura_Canal_Region = 'TOTAL'
          AND Apertura_Productos = 'MARCA'
          AND Periods >= DATE_SUB(PARSE_DATE('%Y-%m-%d', '${anchorDateStr}'), INTERVAL 12 MONTH)
          AND Periods <= PARSE_DATE('%Y-%m-%d', '${anchorDateStr}')
        GROUP BY Periods, mes_label, MARCA_NORM
      ),
      TotalesMensuales AS (
        SELECT 
          Periods,
          SUM(unds) as total_unds_mes,
          SUM(valor) as total_valor_mes
        FROM BaseMarcas
        GROUP BY Periods
      ),
      TotalesAcumulados AS (
        SELECT 
          SUM(unds) as gran_total_unds,
          SUM(valor) as gran_total_valor
        FROM BaseMarcas
        WHERE Periods >= DATE_SUB(PARSE_DATE('%Y-%m-%d', '${anchorDateStr}'), INTERVAL 11 MONTH)
      ),
      MarcaTotalesAcumulados AS (
        SELECT 
          MARCA_NORM,
          SUM(unds) as gran_marca_unds,
          SUM(valor) as gran_marca_valor
        FROM BaseMarcas
        WHERE Periods >= DATE_SUB(PARSE_DATE('%Y-%m-%d', '${anchorDateStr}'), INTERVAL 11 MONTH)
        GROUP BY MARCA_NORM
      )
      SELECT 
        b.mes_label,
        b.MARCA_NORM as MARCA,
        ROUND((b.unds / t.total_unds_mes) * 100, 1) as som_unds_pct,
        ROUND((b.valor / t.total_valor_mes) * 100, 1) as som_valor_pct,
        ROUND((mta.gran_marca_unds / ta.gran_total_unds) * 100, 1) as total_som_unds,
        ROUND((mta.gran_marca_valor / ta.gran_total_valor) * 100, 1) as total_som_usd
      FROM BaseMarcas b
      JOIN TotalesMensuales t ON b.Periods = t.Periods
      LEFT JOIN MarcaTotalesAcumulados mta ON b.MARCA_NORM = mta.MARCA_NORM
      CROSS JOIN TotalesAcumulados ta
      ORDER BY b.Periods ASC
    `;

    // 4. Consulta de Años y Meses Disponibles en BigQuery para Guatemala
    const yearsMonthsQuery = `
      SELECT 
        EXTRACT(YEAR FROM Periods) as anio,
        EXTRACT(MONTH FROM Periods) as num_mes
      FROM \`psa-eltr-latam-pr.Nielsen.v_Nielsen_LATAM_Consolidado\`
      WHERE Pais = 'GUATEMALA'
      GROUP BY anio, num_mes
      ORDER BY anio DESC, num_mes ASC
    `;

    const [kpiRows, monthlyRows, somRows, ymRows] = await Promise.all([
      runBqQuery(kpiComparisonQuery),
      runBqQuery(monthlyQuery),
      runBqQuery(somQuery),
      runBqQuery(yearsMonthsQuery)
    ]);

    const monthNames = [
      '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const availableMonthsByYear = {};
    ymRows.forEach(row => {
      const y = String(row.anio);
      const m = parseInt(row.num_mes, 10);
      if (!availableMonthsByYear[y]) {
        availableMonthsByYear[y] = [{ id: 'Todas', label: 'Todas' }];
      }
      availableMonthsByYear[y].push({
        id: String(m),
        label: monthNames[m] || `Mes ${m}`
      });
    });

    const availableYears = Object.keys(availableMonthsByYear).sort((a, b) => b - a);
    
    // Agrupar monthlyRows por mes con desglose por categoría
    const monthlyMap = {};
    monthlyRows.forEach(row => {
      if (!monthlyMap[row.mes_label]) {
        monthlyMap[row.mes_label] = {
          mes_label: row.mes_label,
          periodo: row.periodo,
          unds_isotonicas: 0,
          unds_sueros: 0,
          unds_total: 0,
          valor_isotonicas: 0,
          valor_sueros: 0,
          valor_total: 0,
          precio_isotonicas: 0,
          precio_sueros: 0,
          dist_isotonicas: 0,
          dist_sueros: 0
        };
      }
      const item = monthlyMap[row.mes_label];
      const isIso = row.CATEGORIA.includes('ISOTONIC');
      const unds = Number(row.unds_k || 0);
      const valor = Number(row.valor_k || 0);
      const precio = Number(row.precio_unit || 0);
      const dist = Number(row.dist_num || 0);

      if (isIso) {
        item.unds_isotonicas = unds;
        item.valor_isotonicas = valor;
        item.precio_isotonicas = precio;
        item.dist_isotonicas = dist;
      } else {
        item.unds_sueros = unds;
        item.valor_sueros = valor;
        item.precio_sueros = precio;
        item.dist_sueros = dist;
      }
      item.unds_total = item.unds_isotonicas + item.unds_sueros;
      item.valor_total = item.valor_isotonicas + item.valor_sueros;
    });

    const monthlyTrends = Object.values(monthlyMap);

    // Procesar SOM por Marca
    const somUndsByBrand = {};
    const somUSDByBrand = {};

    somRows.forEach(row => {
      const brand = row.MARCA;
      if (!brand) return;
      
      if (!somUndsByBrand[brand]) {
        somUndsByBrand[brand] = { 
          MARCA: brand,
          Total: Number(row.total_som_unds || 0)
        };
      }
      if (!somUSDByBrand[brand]) {
        somUSDByBrand[brand] = { 
          MARCA: brand,
          Total: Number(row.total_som_usd || 0)
        };
      }

      somUndsByBrand[brand][row.mes_label] = Number(row.som_unds_pct || 0);
      somUSDByBrand[brand][row.mes_label] = Number(row.som_valor_pct || 0);
    });

    const uniqueMonths = [...new Set(monthlyRows.map(r => r.mes_label))];
    const allSomMonths = [...new Set(somRows.map(r => r.mes_label))];
    const baselineMonth = allSomMonths.find(m => !uniqueMonths.includes(m)) || null;

    // Ranking de marcas ordenadas de mayor a menor con base en la columna Total (a la derecha)
    const topBrandsUnds = Object.values(somUndsByBrand)
      .sort((a, b) => (b.Total || 0) - (a.Total || 0));

    const topBrandsUSD = Object.values(somUSDByBrand)
      .sort((a, b) => (b.Total || 0) - (a.Total || 0));

    const result = {
      anioActual: anio,
      anioAnterior: anioAnterior,
      availableYears,
      availableMonthsByYear,
      kpiRows,
      monthlyTrends,
      uniqueMonths,
      baselineMonth,
      somUnidades: topBrandsUnds,
      somUSD: topBrandsUSD
    };

    queryCache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    console.error('Error al consultar /api/nielsen/gt/overview-dashboard:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// ENDPOINT: DASHBOARD DE MARCA X CANAL (COSTA RICA)
// ==========================================
app.get('/api/nielsen/cr/marca-dashboard', async (req, res) => {
  const marca = (req.query.marca || 'ELECTROLIT').trim();
  const anio = req.query.anio || '2026';
  const mes = req.query.mes || 'Todas';
  const region = (req.query.region || 'ATLANTICO').trim();

  const cacheKey = `cr_marca_${marca}_${anio}_${mes}_${region}`;
  const cached = queryCache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const anioNum = parseInt(anio, 10);
    const marcaEscaped = marca.replace(/'/g, "\\'");
    const regionEscaped = region.replace(/'/g, "\\'");

    let maxMesClause = '';
    let anchorDateStr = `${anioNum}-08-01`;

    if (mes !== 'Todas') {
      const mesNum = parseInt(mes, 10);
      maxMesClause = `AND EXTRACT(MONTH FROM Periods) = ${mesNum}`;
      anchorDateStr = `${anioNum}-${String(mesNum).padStart(2, '0')}-01`;
    } else {
      if (anioNum === 2026) {
        maxMesClause = `AND EXTRACT(MONTH FROM Periods) <= 8`;
        anchorDateStr = `2026-08-01`;
      } else {
        anchorDateStr = `${anioNum}-12-01`;
      }
    }

    const brandCase = `
      CASE 
        WHEN UPPER(TRIM(MARCA)) = 'ELECTROLIT' THEN 'ELECTROLIT'
        WHEN UPPER(TRIM(MARCA)) = 'ELECTROLIFE' THEN 'ELECTROLIFE'
        WHEN UPPER(TRIM(MARCA)) = 'GATORADE' THEN 'GATORADE'
        WHEN UPPER(TRIM(MARCA)) IN ('GATORLYTE', 'GATORLIT') THEN 'GATORLYTE'
        WHEN UPPER(TRIM(MARCA)) = 'POWERADE' THEN 'POWERADE'
        WHEN UPPER(TRIM(MARCA)) = 'PEDIALYTE' THEN 'PEDIALYTE'
        WHEN UPPER(TRIM(MARCA)) = 'PRIME' THEN 'PRIME'
        WHEN UPPER(TRIM(MARCA)) = 'SUEROX' THEN 'SUEROX'
        WHEN UPPER(TRIM(MARCA)) IN ('DILYTE', 'DI LYTE') THEN 'DILYTE'
        WHEN UPPER(TRIM(MARCA)) = 'FASTLYTE' THEN 'FASTLYTE'
        ELSE 'RESTO MARCAS'
      END
    `;

    const targetBrand = marca.toUpperCase() === 'RESTO MARCAS' ? 'RESTO MARCAS' : marcaEscaped;

    // 1. MIX Unidades (000) YTD: Total Mercado vs Marca Seleccionada por Canal
    const mixQuery = `
      WITH MixData AS (
        SELECT 
          ${brandCase} as MARCA_NORM,
          Canal,
          SUM(Vtas_Unds) as unds_raw
        FROM \`psa-eltr-latam-pr.Nielsen.v_Nielsen_LATAM_Consolidado\`
        WHERE Pais = 'COSTA RICA'
          AND Apertura_Canal_Region = 'CANAL'
          AND Apertura_Productos = 'MARCA'
          AND EXTRACT(YEAR FROM Periods) = ${anioNum}
          ${maxMesClause}
        GROUP BY MARCA_NORM, Canal
      )
      SELECT 
        Canal,
        ROUND(SUM(unds_raw) / 1000, 0) as total_mercado_unds_k,
        ROUND(SUM(CASE WHEN MARCA_NORM = '${targetBrand}' THEN unds_raw ELSE 0 END) / 1000, 0) as marca_unds_k
      FROM MixData
      GROUP BY Canal
      ORDER BY Canal ASC
    `;

    // 2. Tendencias Mensuales (12 meses móviles) por Canal para la Marca
    const trendsQuery = `
      WITH TotalCanalMensual AS (
        SELECT 
          Periods,
          FORMAT_DATE('%b-%y', Periods) as mes_label,
          Canal,
          SUM(Vtas_Unds) as total_canal_unds,
          SUM(Vtas_Valor) as total_canal_valor
        FROM \`psa-eltr-latam-pr.Nielsen.v_Nielsen_LATAM_Consolidado\`
        WHERE Pais = 'COSTA RICA'
          AND Apertura_Canal_Region = 'CANAL'
          AND Apertura_Productos = 'MARCA'
          AND Periods >= DATE_SUB(PARSE_DATE('%Y-%m-%d', '${anchorDateStr}'), INTERVAL 11 MONTH)
          AND Periods <= PARSE_DATE('%Y-%m-%d', '${anchorDateStr}')
        GROUP BY Periods, mes_label, Canal
      ),
      MarcaCanalMensual AS (
        SELECT 
          Periods,
          FORMAT_DATE('%b-%y', Periods) as mes_label,
          Canal,
          SUM(Vtas_Unds) as marca_unds,
          SUM(Vtas_Valor) as marca_valor,
          ROUND(SUM(Vtas_Valor) / NULLIF(SUM(Vtas_Unds), 0), 2) as precio_unit,
          ROUND(MAX(SAFE_DIVIDE(N_de_Tiendas_Venden_C, N_de_Tiendas_C)) * 100, 1) as dist_num,
          ROUND(SUM(Vtas_Unds) / NULLIF(SUM(N_de_Tiendas_Venden_C) * EXTRACT(DAY FROM LAST_DAY(Periods)), 0), 1) as rotacion
        FROM \`psa-eltr-latam-pr.Nielsen.v_Nielsen_LATAM_Consolidado\`
        WHERE Pais = 'COSTA RICA'
          AND Apertura_Canal_Region = 'CANAL'
          AND Apertura_Productos = 'MARCA'
          AND ${brandCase} = '${targetBrand}'
          AND Periods >= DATE_SUB(PARSE_DATE('%Y-%m-%d', '${anchorDateStr}'), INTERVAL 11 MONTH)
          AND Periods <= PARSE_DATE('%Y-%m-%d', '${anchorDateStr}')
        GROUP BY Periods, mes_label, Canal
      )
      SELECT 
        t.Periods,
        t.mes_label,
        t.Canal,
        COALESCE(m.marca_unds, 0) as marca_unds,
        COALESCE(m.marca_valor, 0) as marca_valor,
        COALESCE(m.precio_unit, 0) as precio_unit,
        COALESCE(m.dist_num, 0) as dist_num,
        COALESCE(m.rotacion, 0) as rotacion,
        ROUND((COALESCE(m.marca_unds, 0) / NULLIF(t.total_canal_unds, 0)) * 100, 1) as share_marca_en_canal
      FROM TotalCanalMensual t
      LEFT JOIN MarcaCanalMensual m ON t.Periods = m.Periods AND t.Canal = m.Canal
      ORDER BY t.Periods ASC, t.Canal ASC
    `;

    // 3. Desglose Mensual por Sabores a Nivel País (Marca seleccionada)
    const saboresPaisQuery = `
      SELECT 
        Periods,
        FORMAT_DATE('%b-%y', Periods) as mes_label,
        SABOR,
        ROUND(SUM(Vtas_Unds) / 1000, 1) as unds_k
      FROM \`psa-eltr-latam-pr.Nielsen.v_Nielsen_LATAM_Consolidado\`
      WHERE Pais = 'COSTA RICA'
        AND Apertura_Canal_Region = 'TOTAL'
        AND Apertura_Productos = 'SABOR'
        AND ${brandCase} = '${targetBrand}'
        AND Periods >= DATE_SUB(PARSE_DATE('%Y-%m-%d', '${anchorDateStr}'), INTERVAL 11 MONTH)
        AND Periods <= PARSE_DATE('%Y-%m-%d', '${anchorDateStr}')
      GROUP BY Periods, mes_label, SABOR
      ORDER BY Periods ASC, unds_k DESC
    `;

    // 4. Desglose Mensual por Sabores en la Región Seleccionada (Marca seleccionada)
    const saboresRegionQuery = `
      SELECT 
        Periods,
        FORMAT_DATE('%b-%y', Periods) as mes_label,
        SABOR,
        ROUND(SUM(Vtas_Unds) / 1000, 1) as unds_k
      FROM \`psa-eltr-latam-pr.Nielsen.v_Nielsen_LATAM_Consolidado\`
      WHERE Pais = 'COSTA RICA'
        AND Apertura_Canal_Region = 'TOTAL/REGION'
        AND Region = '${regionEscaped}'
        AND Apertura_Productos = 'SABOR'
        AND ${brandCase} = '${targetBrand}'
        AND Periods >= DATE_SUB(PARSE_DATE('%Y-%m-%d', '${anchorDateStr}'), INTERVAL 11 MONTH)
        AND Periods <= PARSE_DATE('%Y-%m-%d', '${anchorDateStr}')
      GROUP BY Periods, mes_label, SABOR
      ORDER BY Periods ASC, unds_k DESC
    `;

    // 5. Lista de Marcas Disponibles en Costa Rica (Ordenadas por relevancia/volumen)
    const brandsQuery = `
      SELECT 
        MARCA,
        SUM(Vtas_Unds) as total_vol
      FROM \`psa-eltr-latam-pr.Nielsen.v_Nielsen_LATAM_Consolidado\`
      WHERE Pais = 'COSTA RICA'
        AND Apertura_Productos = 'MARCA'
        AND MARCA IS NOT NULL AND MARCA != ''
      GROUP BY MARCA
      ORDER BY total_vol DESC
    `;

    const [mixRows, trendsRows, sabPaisRows, sabRegionRows, brandRows] = await Promise.all([
      runBqQuery(mixQuery),
      runBqQuery(trendsQuery),
      runBqQuery(saboresPaisQuery),
      runBqQuery(saboresRegionQuery),
      runBqQuery(brandsQuery)
    ]);

    // Procesar MIX
    let totalAutoservicios = 0;
    let totalTradicional = 0;
    let marcaAutoservicios = 0;
    let marcaTradicional = 0;

    mixRows.forEach(row => {
      if (row.Canal === 'AUTOSERVICIOS') {
        totalAutoservicios = Number(row.total_mercado_unds_k || 0);
        marcaAutoservicios = Number(row.marca_unds_k || 0);
      } else if (row.Canal === 'TRADICIONAL') {
        totalTradicional = Number(row.total_mercado_unds_k || 0);
        marcaTradicional = Number(row.marca_unds_k || 0);
      }
    });

    const totalMercado = totalAutoservicios + totalTradicional;
    const totalMarca = marcaAutoservicios + marcaTradicional;

    const mixResult = {
      totalMercado: {
        moderno: totalAutoservicios,
        tradicional: totalTradicional,
        total: totalMercado,
        modernoPct: totalMercado > 0 ? (totalAutoservicios / totalMercado) * 100 : 0,
        tradicionalPct: totalMercado > 0 ? (totalTradicional / totalMercado) * 100 : 0
      },
      marca: {
        nombre: marca,
        moderno: marcaAutoservicios,
        tradicional: marcaTradicional,
        total: totalMarca,
        modernoPct: totalMarca > 0 ? (marcaAutoservicios / totalMarca) * 100 : 0,
        tradicionalPct: totalMarca > 0 ? (marcaTradicional / totalMarca) * 100 : 0
      }
    };

    // Procesar Tendencias Mensuales
    const trendsMap = {};
    trendsRows.forEach(row => {
      if (!trendsMap[row.mes_label]) {
        trendsMap[row.mes_label] = {
          mes_label: row.mes_label,
          periodo: row.Periods,
          moderno_unds: 0,
          tradicional_unds: 0,
          moderno_precio: 0,
          tradicional_precio: 0,
          moderno_dist: 0,
          tradicional_dist: 0,
          moderno_rotacion: 0,
          tradicional_rotacion: 0,
          moderno_share: 0,
          tradicional_share: 0
        };
      }
      const item = trendsMap[row.mes_label];
      if (row.Canal === 'AUTOSERVICIOS') {
        item.moderno_unds = Number(row.marca_unds || 0);
        item.moderno_precio = Number(row.precio_unit || 0);
        item.dist_moderno = Number(row.dist_num || 0);
        item.moderno_rotacion = Number(row.rotacion || 0);
        item.moderno_share = Number(row.share_marca_en_canal || 0);
      } else if (row.Canal === 'TRADICIONAL') {
        item.tradicional_unds = Number(row.marca_unds || 0);
        item.tradicional_precio = Number(row.precio_unit || 0);
        item.dist_tradicional = Number(row.dist_num || 0);
        item.tradicional_rotacion = Number(row.rotacion || 0);
        item.tradicional_share = Number(row.share_marca_en_canal || 0);
      }
    });

    // Calcular Part. Venta % mensual para cada canal
    const monthlyTrends = Object.values(trendsMap).map(m => {
      const sumUnds = m.moderno_unds + m.tradicional_unds;
      return {
        ...m,
        part_moderno_pct: sumUnds > 0 ? (m.moderno_unds / sumUnds) * 100 : 0,
        part_tradicional_pct: sumUnds > 0 ? (m.tradicional_unds / sumUnds) * 100 : 0
      };
    });

    // Procesar Sabores País
    const saboresPaisMap = {};
    sabPaisRows.forEach(row => {
      if (!saboresPaisMap[row.mes_label]) {
        saboresPaisMap[row.mes_label] = { mes_label: row.mes_label, total_k: 0, sabores: {} };
      }
      const val = Number(row.unds_k || 0);
      saboresPaisMap[row.mes_label].sabores[row.SABOR] = val;
      saboresPaisMap[row.mes_label].total_k += val;
    });

    // Procesar Sabores Región
    const saboresRegionMap = {};
    sabRegionRows.forEach(row => {
      if (!saboresRegionMap[row.mes_label]) {
        saboresRegionMap[row.mes_label] = { mes_label: row.mes_label, total_k: 0, sabores: {} };
      }
      const val = Number(row.unds_k || 0);
      saboresRegionMap[row.mes_label].sabores[row.SABOR] = val;
      saboresRegionMap[row.mes_label].total_k += val;
    });

    const availableMonthsByYear = {
      '2026': [
        { id: 'Todas', label: 'Todas' },
        { id: '1', label: 'Enero' },
        { id: '2', label: 'Febrero' },
        { id: '3', label: 'Marzo' },
        { id: '4', label: 'Abril' },
        { id: '5', label: 'Mayo' },
        { id: '6', label: 'Junio' },
        { id: '7', label: 'Julio' },
        { id: '8', label: 'Agosto' }
      ],
      '2025': [
        { id: 'Todas', label: 'Todas' },
        { id: '1', label: 'Enero' },
        { id: '2', label: 'Febrero' },
        { id: '3', label: 'Marzo' },
        { id: '4', label: 'Abril' },
        { id: '5', label: 'Mayo' },
        { id: '6', label: 'Junio' },
        { id: '7', label: 'Julio' },
        { id: '8', label: 'Agosto' },
        { id: '9', label: 'Septiembre' },
        { id: '10', label: 'Octubre' },
        { id: '11', label: 'Noviembre' },
        { id: '12', label: 'Diciembre' }
      ],
      '2024': [
        { id: 'Todas', label: 'Todas' },
        { id: '1', label: 'Enero' },
        { id: '2', label: 'Febrero' },
        { id: '3', label: 'Marzo' },
        { id: '4', label: 'Abril' },
        { id: '5', label: 'Mayo' },
        { id: '6', label: 'Junio' },
        { id: '7', label: 'Julio' },
        { id: '8', label: 'Agosto' },
        { id: '9', label: 'Septiembre' },
        { id: '10', label: 'Octubre' },
        { id: '11', label: 'Noviembre' },
        { id: '12', label: 'Diciembre' }
      ]
    };

    const result = {
      marca,
      anio,
      mes,
      region,
      mixResult,
      monthlyTrends,
      saboresPais: Object.values(saboresPaisMap),
      saboresRegion: Object.values(saboresRegionMap),
      availableBrands: brandRows.map(b => b.MARCA),
      availableYears: ['2026', '2025', '2024'],
      availableMonthsByYear,
      availableRegions: ['ATLANTICO', 'CENTRAL', 'METRO', 'NORTE', 'SUR']
    };

    queryCache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    console.error('Error al consultar /api/nielsen/cr/marca-dashboard:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// ENDPOINT: DASHBOARD DE MARCA X CANAL (GUATEMALA)
// ==========================================
app.get('/api/nielsen/gt/marca-dashboard', async (req, res) => {
  const marca = (req.query.marca || 'HIDRAVIDA').trim();
  const anio = req.query.anio || '2026';
  const mes = req.query.mes || 'Todas';
  const region = (req.query.region || 'VERAPACES').trim();

  const cacheKey = `gt_marca_${marca}_${anio}_${mes}_${region}`;
  const cached = queryCache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const anioNum = parseInt(anio, 10);
    const marcaEscaped = marca.replace(/'/g, "\\'");
    const regionEscaped = region.replace(/'/g, "\\'");

    let maxMesClause = '';
    let anchorDateStr = `${anioNum}-08-01`;

    if (mes !== 'Todas') {
      const mesNum = parseInt(mes, 10);
      maxMesClause = `AND EXTRACT(MONTH FROM Periods) = ${mesNum}`;
      anchorDateStr = `${anioNum}-${String(mesNum).padStart(2, '0')}-01`;
    } else {
      if (anioNum === 2026) {
        maxMesClause = `AND EXTRACT(MONTH FROM Periods) <= 8`;
        anchorDateStr = `2026-08-01`;
      } else {
        anchorDateStr = `${anioNum}-12-01`;
      }
    }

    const brandCase = `
      CASE 
        WHEN UPPER(TRIM(MARCA)) IN ('ELECTROLIT', 'HIDRAVIDA') THEN 'HIDRAVIDA'
        WHEN UPPER(TRIM(MARCA)) IN ('ELECTROLIFE', 'HIDRALIFE') THEN 'HIDRALIFE'
        WHEN UPPER(TRIM(MARCA)) = 'GATORADE' THEN 'GATORADE'
        WHEN UPPER(TRIM(MARCA)) IN ('GATORLYTE', 'GATORLIT') THEN 'GATORLYTE'
        WHEN UPPER(TRIM(MARCA)) = 'GLUCOSORAL' THEN 'GLUCOSORAL'
        WHEN UPPER(TRIM(MARCA)) = 'ISOMAX' THEN 'ISOMAX'
        WHEN UPPER(TRIM(MARCA)) = 'PEDIALYTE' THEN 'PEDIALYTE'
        WHEN UPPER(TRIM(MARCA)) = 'POWERADE' THEN 'POWERADE'
        WHEN UPPER(TRIM(MARCA)) = 'REVIVE' THEN 'REVIVE'
        WHEN UPPER(TRIM(MARCA)) = 'SPORADE' THEN 'SPORADE'
        WHEN UPPER(TRIM(MARCA)) = 'SUEROX' THEN 'SUEROX'
        ELSE 'RESTO MARCAS'
      END
    `;

    const targetBrand = marca.toUpperCase() === 'RESTO MARCAS' ? 'RESTO MARCAS' : marcaEscaped;

    // 1. MIX Unidades (000) YTD: Total Mercado vs Marca Seleccionada por Canal
    const mixQuery = `
      WITH MixData AS (
        SELECT 
          ${brandCase} as MARCA_NORM,
          Canal,
          SUM(Vtas_Unds) as unds_raw
        FROM \`psa-eltr-latam-pr.Nielsen.v_Nielsen_LATAM_Consolidado\`
        WHERE Pais = 'GUATEMALA'
          AND Apertura_Canal_Region = 'CANAL'
          AND Apertura_Productos = 'MARCA'
          AND EXTRACT(YEAR FROM Periods) = ${anioNum}
          ${maxMesClause}
        GROUP BY MARCA_NORM, Canal
      )
      SELECT 
        Canal,
        ROUND(SUM(unds_raw) / 1000, 0) as total_mercado_unds_k,
        ROUND(SUM(CASE WHEN MARCA_NORM = '${targetBrand}' THEN unds_raw ELSE 0 END) / 1000, 0) as marca_unds_k
      FROM MixData
      GROUP BY Canal
      ORDER BY Canal ASC
    `;

    const rawBrandCondition = (marca.toUpperCase() === 'HIDRAVIDA')
      ? "UPPER(TRIM(MARCA)) = 'HIDRAVIDA'"
      : (marca.toUpperCase() === 'HIDRALIFE')
      ? "UPPER(TRIM(MARCA)) = 'HIDRALIFE'"
      : (marca.toUpperCase() === 'GATORLYTE')
      ? "UPPER(TRIM(MARCA)) = 'GATORLYTE'"
      : `${brandCase} = '${targetBrand}'`;

    // 2. Tendencias Mensuales (12 meses móviles) por Canal para la Marca
    const trendsQuery = `
      WITH TotalCanalMensual AS (
        SELECT 
          Periods,
          FORMAT_DATE('%b-%y', Periods) as mes_label,
          Canal,
          SUM(Vtas_Unds) as total_canal_unds,
          SUM(Vtas_Valor) as total_canal_valor
        FROM \`psa-eltr-latam-pr.Nielsen.v_Nielsen_LATAM_Consolidado\`
        WHERE Pais = 'GUATEMALA'
          AND Apertura_Canal_Region = 'CANAL'
          AND Apertura_Productos = 'MARCA'
          AND Periods >= DATE_SUB(PARSE_DATE('%Y-%m-%d', '${anchorDateStr}'), INTERVAL 11 MONTH)
          AND Periods <= PARSE_DATE('%Y-%m-%d', '${anchorDateStr}')
        GROUP BY Periods, mes_label, Canal
      ),
      VentasMarcaCanal AS (
        SELECT 
          Periods,
          FORMAT_DATE('%b-%y', Periods) as mes_label,
          Canal,
          SUM(Vtas_Unds) as marca_unds,
          SUM(Vtas_Valor) as marca_valor,
          ROUND(SUM(Vtas_Valor) / NULLIF(SUM(Vtas_Unds), 0), 2) as precio_unit
        FROM \`psa-eltr-latam-pr.Nielsen.v_Nielsen_LATAM_Consolidado\`
        WHERE Pais = 'GUATEMALA'
          AND Apertura_Canal_Region = 'CANAL'
          AND Apertura_Productos = 'MARCA'
          AND ${brandCase} = '${targetBrand}'
          AND Periods >= DATE_SUB(PARSE_DATE('%Y-%m-%d', '${anchorDateStr}'), INTERVAL 11 MONTH)
          AND Periods <= PARSE_DATE('%Y-%m-%d', '${anchorDateStr}')
        GROUP BY Periods, mes_label, Canal
      ),
      DistMarcaCanal AS (
        SELECT 
          Periods,
          Canal,
          ROUND(MAX(SAFE_DIVIDE(N_de_Tiendas_Venden_C, N_de_Tiendas_C)) * 100, 1) as dist_num,
          ROUND(SUM(Vtas_Unds) / NULLIF(SUM(N_de_Tiendas_Venden_C) * EXTRACT(DAY FROM LAST_DAY(Periods)), 0), 1) as rotacion
        FROM \`psa-eltr-latam-pr.Nielsen.v_Nielsen_LATAM_Consolidado\`
        WHERE Pais = 'GUATEMALA'
          AND Apertura_Canal_Region = 'CANAL'
          AND Apertura_Productos = 'MARCA'
          AND ${rawBrandCondition}
          AND Periods >= DATE_SUB(PARSE_DATE('%Y-%m-%d', '${anchorDateStr}'), INTERVAL 11 MONTH)
          AND Periods <= PARSE_DATE('%Y-%m-%d', '${anchorDateStr}')
        GROUP BY Periods, Canal
      )
      SELECT 
        t.Periods,
        t.mes_label,
        t.Canal,
        COALESCE(v.marca_unds, 0) as marca_unds,
        COALESCE(v.marca_valor, 0) as marca_valor,
        COALESCE(v.precio_unit, 0) as precio_unit,
        COALESCE(d.dist_num, 0) as dist_num,
        COALESCE(d.rotacion, 0) as rotacion,
        ROUND((COALESCE(v.marca_unds, 0) / NULLIF(t.total_canal_unds, 0)) * 100, 1) as share_marca_en_canal
      FROM TotalCanalMensual t
      LEFT JOIN VentasMarcaCanal v ON t.Periods = v.Periods AND t.Canal = v.Canal
      LEFT JOIN DistMarcaCanal d ON t.Periods = d.Periods AND t.Canal = d.Canal
      ORDER BY t.Periods ASC, t.Canal ASC
    `;

    // 3. Desglose Mensual por Sabores a Nivel País (Marca seleccionada)
    const saboresPaisQuery = `
      SELECT 
        Periods,
        FORMAT_DATE('%b-%y', Periods) as mes_label,
        COALESCE(SABOR, 'OTROS') as SABOR,
        ROUND(SUM(Vtas_Unds) / 1000, 1) as unds_k
      FROM \`psa-eltr-latam-pr.Nielsen.v_Nielsen_LATAM_Consolidado\`
      WHERE Pais = 'GUATEMALA'
        AND Apertura_Canal_Region = 'TOTAL'
        AND Apertura_Productos = 'SABOR'
        AND ${brandCase} = '${targetBrand}'
        AND Periods >= DATE_SUB(PARSE_DATE('%Y-%m-%d', '${anchorDateStr}'), INTERVAL 11 MONTH)
        AND Periods <= PARSE_DATE('%Y-%m-%d', '${anchorDateStr}')
      GROUP BY Periods, mes_label, SABOR
      ORDER BY Periods ASC, unds_k DESC
    `;

    // 4. Desglose Mensual por Sabores en la Región Seleccionada (Marca seleccionada)
    const saboresRegionQuery = `
      SELECT 
        Periods,
        FORMAT_DATE('%b-%y', Periods) as mes_label,
        COALESCE(SABOR, 'OTROS') as SABOR,
        ROUND(SUM(Vtas_Unds) / 1000, 1) as unds_k
      FROM \`psa-eltr-latam-pr.Nielsen.v_Nielsen_LATAM_Consolidado\`
      WHERE Pais = 'GUATEMALA'
        AND Apertura_Canal_Region = 'TOTAL/REGION'
        AND Region = '${regionEscaped}'
        AND Apertura_Productos = 'SABOR'
        AND ${brandCase} = '${targetBrand}'
        AND Periods >= DATE_SUB(PARSE_DATE('%Y-%m-%d', '${anchorDateStr}'), INTERVAL 11 MONTH)
        AND Periods <= PARSE_DATE('%Y-%m-%d', '${anchorDateStr}')
      GROUP BY Periods, mes_label, SABOR
      ORDER BY Periods ASC, unds_k DESC
    `;

    const [mixRows, trendsRows, sabPaisRows, sabRegionRows] = await Promise.all([
      runBqQuery(mixQuery),
      runBqQuery(trendsQuery),
      runBqQuery(saboresPaisQuery),
      runBqQuery(saboresRegionQuery)
    ]);

    // Procesar MIX
    let totalAutoservicios = 0;
    let totalTradicional = 0;
    let marcaAutoservicios = 0;
    let marcaTradicional = 0;

    mixRows.forEach(row => {
      if (row.Canal === 'AUTOSERVICIOS') {
        totalAutoservicios = Number(row.total_mercado_unds_k || 0);
        marcaAutoservicios = Number(row.marca_unds_k || 0);
      } else if (row.Canal === 'TRADICIONAL') {
        totalTradicional = Number(row.total_mercado_unds_k || 0);
        marcaTradicional = Number(row.marca_unds_k || 0);
      }
    });

    const totalMercado = totalAutoservicios + totalTradicional;
    const totalMarca = marcaAutoservicios + marcaTradicional;

    const mixResult = {
      totalMercado: {
        moderno: totalAutoservicios,
        tradicional: totalTradicional,
        total: totalMercado,
        modernoPct: totalMercado > 0 ? (totalAutoservicios / totalMercado) * 100 : 0,
        tradicionalPct: totalMercado > 0 ? (totalTradicional / totalMercado) * 100 : 0
      },
      marca: {
        nombre: marca,
        moderno: marcaAutoservicios,
        tradicional: marcaTradicional,
        total: totalMarca,
        modernoPct: totalMarca > 0 ? (marcaAutoservicios / totalMarca) * 100 : 0,
        tradicionalPct: totalMarca > 0 ? (marcaTradicional / totalMarca) * 100 : 0
      }
    };

    // Procesar Tendencias Mensuales
    const trendsMap = {};
    trendsRows.forEach(row => {
      if (!trendsMap[row.mes_label]) {
        trendsMap[row.mes_label] = {
          mes_label: row.mes_label,
          periodo: row.Periods,
          moderno_unds: 0,
          tradicional_unds: 0,
          moderno_precio: 0,
          tradicional_precio: 0,
          moderno_dist: 0,
          tradicional_dist: 0,
          moderno_rotacion: 0,
          tradicional_rotacion: 0,
          moderno_share: 0,
          tradicional_share: 0
        };
      }
      const item = trendsMap[row.mes_label];
      if (row.Canal === 'AUTOSERVICIOS') {
        item.moderno_unds = Number(row.marca_unds || 0);
        item.moderno_precio = Number(row.precio_unit || 0);
        item.dist_moderno = Number(row.dist_num || 0);
        item.moderno_rotacion = Number(row.rotacion || 0);
        item.moderno_share = Number(row.share_marca_en_canal || 0);
      } else if (row.Canal === 'TRADICIONAL') {
        item.tradicional_unds = Number(row.marca_unds || 0);
        item.tradicional_precio = Number(row.precio_unit || 0);
        item.dist_tradicional = Number(row.dist_num || 0);
        item.tradicional_rotacion = Number(row.rotacion || 0);
        item.tradicional_share = Number(row.share_marca_en_canal || 0);
      }
    });

    const monthlyTrends = Object.values(trendsMap).map(m => {
      const sumUnds = m.moderno_unds + m.tradicional_unds;
      return {
        ...m,
        part_moderno_pct: sumUnds > 0 ? (m.moderno_unds / sumUnds) * 100 : 0,
        part_tradicional_pct: sumUnds > 0 ? (m.tradicional_unds / sumUnds) * 100 : 0
      };
    });

    // Procesar Sabores País
    const saboresPaisMap = {};
    sabPaisRows.forEach(row => {
      if (!saboresPaisMap[row.mes_label]) {
        saboresPaisMap[row.mes_label] = { mes_label: row.mes_label, total_k: 0, sabores: {} };
      }
      const val = Number(row.unds_k || 0);
      saboresPaisMap[row.mes_label].sabores[row.SABOR] = val;
      saboresPaisMap[row.mes_label].total_k += val;
    });

    // Procesar Sabores Región
    const saboresRegionMap = {};
    sabRegionRows.forEach(row => {
      if (!saboresRegionMap[row.mes_label]) {
        saboresRegionMap[row.mes_label] = { mes_label: row.mes_label, total_k: 0, sabores: {} };
      }
      const val = Number(row.unds_k || 0);
      saboresRegionMap[row.mes_label].sabores[row.SABOR] = val;
      saboresRegionMap[row.mes_label].total_k += val;
    });

    const availableBrands = [
      'HIDRAVIDA', 'ISOMAX', 'GATORADE', 'SPORADE', 'REVIVE', 'POWERADE',
      'SUEROX', 'GLUCOSORAL', 'PEDIALYTE', 'GATORLYTE', 'HIDRALIFE', 'RESTO MARCAS'
    ];

    const availableRegions = [
      'METRO', 'NORORIENTE', 'OCCIDENTE', 'OCCIDENTE CHICO',
      'ORIENTE CHICO', 'ORIENTE GRANDE', 'SUR', 'VERAPACES'
    ];

    const availableMonthsByYear = {
      '2026': [
        { id: 'Todas', label: 'Todas' },
        { id: '1', label: 'Enero' },
        { id: '2', label: 'Febrero' },
        { id: '3', label: 'Marzo' },
        { id: '4', label: 'Abril' },
        { id: '5', label: 'Mayo' },
        { id: '6', label: 'Junio' },
        { id: '7', label: 'Julio' },
        { id: '8', label: 'Agosto' }
      ],
      '2025': [
        { id: 'Todas', label: 'Todas' },
        { id: '1', label: 'Enero' },
        { id: '2', label: 'Febrero' },
        { id: '3', label: 'Marzo' },
        { id: '4', label: 'Abril' },
        { id: '5', label: 'Mayo' },
        { id: '6', label: 'Junio' },
        { id: '7', label: 'Julio' },
        { id: '8', label: 'Agosto' },
        { id: '9', label: 'Septiembre' },
        { id: '10', label: 'Octubre' },
        { id: '11', label: 'Noviembre' },
        { id: '12', label: 'Diciembre' }
      ],
      '2024': [
        { id: 'Todas', label: 'Todas' },
        { id: '1', label: 'Enero' },
        { id: '2', label: 'Febrero' },
        { id: '3', label: 'Marzo' },
        { id: '4', label: 'Abril' },
        { id: '5', label: 'Mayo' },
        { id: '6', label: 'Junio' },
        { id: '7', label: 'Julio' },
        { id: '8', label: 'Agosto' },
        { id: '9', label: 'Septiembre' },
        { id: '10', label: 'Octubre' },
        { id: '11', label: 'Noviembre' },
        { id: '12', label: 'Diciembre' }
      ]
    };

    const result = {
      marca,
      anio,
      mes,
      region,
      mixResult,
      monthlyTrends,
      saboresPais: Object.values(saboresPaisMap),
      saboresRegion: Object.values(saboresRegionMap),
      availableBrands,
      availableYears: ['2026', '2025', '2024'],
      availableMonthsByYear,
      availableRegions
    };

    queryCache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    console.error('Error al consultar /api/nielsen/gt/marca-dashboard:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// ENDPOINT: DASHBOARD DE CANAL (COSTA RICA)
// ==========================================
app.get('/api/nielsen/cr/canal-dashboard', async (req, res) => {
  const canalParam = (req.query.canal || 'Moderno').trim();
  const bqCanal = (canalParam.toLowerCase() === 'tradicional') ? 'TRADICIONAL' : 'AUTOSERVICIOS';
  const marca = (req.query.marca || 'ELECTROLIT').trim();
  const anio = req.query.anio || '2026';
  const mes = req.query.mes || 'Todas';

  const cacheKey = `cr_canal_${bqCanal}_${marca}_${anio}_${mes}`;
  const cached = queryCache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const anioNum = parseInt(anio, 10);
    const marcaEscaped = marca.replace(/'/g, "\\'");

    let maxMesClause = '';
    let anchorDateStr = `${anioNum}-08-01`;

    if (mes !== 'Todas') {
      const mesNum = parseInt(mes, 10);
      maxMesClause = `AND EXTRACT(MONTH FROM Periods) = ${mesNum}`;
      anchorDateStr = `${anioNum}-${String(mesNum).padStart(2, '0')}-01`;
    } else {
      if (anioNum === 2026) {
        maxMesClause = `AND EXTRACT(MONTH FROM Periods) <= 8`;
        anchorDateStr = `2026-08-01`;
      } else {
        anchorDateStr = `${anioNum}-12-01`;
      }
    }

    const topBrandsCase = `
      CASE 
        WHEN UPPER(MARCA) = 'ELECTROLIT' THEN 'Electrolit'
        WHEN UPPER(MARCA) = 'ELECTROLIFE' THEN 'Electrolife'
        WHEN UPPER(MARCA) = 'GATORADE' THEN 'Gatorade'
        WHEN UPPER(MARCA) = 'GATORLYTE' THEN 'Gatorlyte'
        WHEN UPPER(MARCA) = 'POWERADE' THEN 'Powerade'
        WHEN UPPER(MARCA) = 'PEDIALYTE' THEN 'Pedialyte'
        WHEN UPPER(MARCA) = 'PRIME' THEN 'Prime'
        WHEN UPPER(MARCA) = 'SUEROX' THEN 'Suerox'
        WHEN UPPER(MARCA) = 'DI LYTE' OR UPPER(MARCA) = 'DILYTE' THEN 'Dilyte'
        WHEN UPPER(MARCA) = 'FASTLYTE' THEN 'Fastlyte'
        ELSE 'Resto Marcas'
      END
    `;

    // 1. MIX Unidades (000) YTD: TOTAL YTD vs CANAL YTD (Desglose por Marca)
    const mixQuery = `
      WITH BaseTotal AS (
        SELECT 
          ${topBrandsCase} as marca_norm,
          SUM(Vtas_Unds) as unds
        FROM \`psa-eltr-latam-pr.Nielsen.v_Nielsen_LATAM_Consolidado\`
        WHERE Pais = 'COSTA RICA'
          AND Apertura_Canal_Region = 'TOTAL'
          AND Apertura_Productos = 'MARCA'
          AND EXTRACT(YEAR FROM Periods) = ${anioNum}
          ${maxMesClause}
        GROUP BY marca_norm
      ),
      BaseCanal AS (
        SELECT 
          ${topBrandsCase} as marca_norm,
          SUM(Vtas_Unds) as unds
        FROM \`psa-eltr-latam-pr.Nielsen.v_Nielsen_LATAM_Consolidado\`
        WHERE Pais = 'COSTA RICA'
          AND Apertura_Canal_Region = 'CANAL'
          AND Canal = '${bqCanal}'
          AND Apertura_Productos = 'MARCA'
          AND EXTRACT(YEAR FROM Periods) = ${anioNum}
          ${maxMesClause}
        GROUP BY marca_norm
      )
      SELECT 
        t.marca_norm,
        ROUND(t.unds / 1000, 0) as total_unds_k,
        ROUND((t.unds / NULLIF((SELECT SUM(unds) FROM BaseTotal), 0)) * 100, 1) as total_pct,
        ROUND(COALESCE(c.unds, 0) / 1000, 0) as canal_unds_k,
        ROUND((COALESCE(c.unds, 0) / NULLIF((SELECT SUM(unds) FROM BaseCanal), 0)) * 100, 1) as canal_pct
      FROM BaseTotal t
      LEFT JOIN BaseCanal c ON t.marca_norm = c.marca_norm
      ORDER BY total_unds_k DESC
    `;

    // 2. Tendencias Mensuales de Indicadores por Marca en el Canal Seleccionado
    const trendsQuery = `
      WITH BaseData AS (
        SELECT 
          Periods,
          FORMAT_DATE('%b-%y', Periods) as mes_label,
          ${topBrandsCase} as marca_norm,
          Vtas_Unds,
          Vtas_Valor,
          N_de_Tiendas_Venden_C,
          N_de_Tiendas_C
        FROM \`psa-eltr-latam-pr.Nielsen.v_Nielsen_LATAM_Consolidado\`
        WHERE Pais = 'COSTA RICA'
          AND Apertura_Canal_Region = 'CANAL'
          AND Canal = '${bqCanal}'
          AND Apertura_Productos = 'MARCA'
          AND Periods >= DATE_SUB(PARSE_DATE('%Y-%m-%d', '${anchorDateStr}'), INTERVAL 11 MONTH)
          AND Periods <= PARSE_DATE('%Y-%m-%d', '${anchorDateStr}')
      ),
      TotalCanalMensual AS (
        SELECT 
          Periods,
          SUM(Vtas_Unds) as total_canal_unds
        FROM BaseData
        GROUP BY Periods
      ),
      MarcaAgg AS (
        SELECT 
          b.Periods,
          b.mes_label,
          b.marca_norm,
          SUM(b.Vtas_Unds) as unds,
          SUM(b.Vtas_Valor) as valor,
          ROUND(SUM(b.Vtas_Unds) / 1000, 0) as unds_k,
          ROUND(SUM(b.Vtas_Valor) / NULLIF(SUM(b.Vtas_Unds), 0), 2) as precio_unit,
          ROUND((SUM(b.N_de_Tiendas_Venden_C) / NULLIF(SUM(b.N_de_Tiendas_C), 0)) * 100, 1) as dist_num,
          ROUND(SUM(b.Vtas_Unds) / NULLIF(SUM(b.N_de_Tiendas_Venden_C) * 30, 0), 1) as rotacion
        FROM BaseData b
        GROUP BY b.Periods, b.mes_label, b.marca_norm
      )
      SELECT 
        m.Periods,
        m.mes_label,
        m.marca_norm,
        m.unds_k,
        m.precio_unit,
        m.dist_num,
        m.rotacion,
        ROUND((m.unds / NULLIF(t.total_canal_unds, 0)) * 100, 1) as som_unds_pct
      FROM MarcaAgg m
      JOIN TotalCanalMensual t ON m.Periods = t.Periods
      ORDER BY m.Periods ASC, m.unds_k DESC
    `;

    // 3. Desglose Mensual de Sabores a Nivel Total Canales (Marca Seleccionada)
    const saboresTotalCanalesQuery = `
      SELECT 
        Periods,
        FORMAT_DATE('%b-%y', Periods) as mes_label,
        SABOR,
        ROUND(SUM(Vtas_Unds) / 1000, 1) as unds_k
      FROM \`psa-eltr-latam-pr.Nielsen.v_Nielsen_LATAM_Consolidado\`
      WHERE Pais = 'COSTA RICA'
        AND Apertura_Canal_Region = 'TOTAL'
        AND Apertura_Productos = 'SABOR'
        AND MARCA = '${marcaEscaped}'
        AND Periods >= DATE_SUB(PARSE_DATE('%Y-%m-%d', '${anchorDateStr}'), INTERVAL 11 MONTH)
        AND Periods <= PARSE_DATE('%Y-%m-%d', '${anchorDateStr}')
      GROUP BY Periods, mes_label, SABOR
      ORDER BY Periods ASC, unds_k DESC
    `;

    // 4. Desglose Mensual de Sabores en el Canal Seleccionado (Marca Seleccionada)
    const saboresCanalQuery = `
      SELECT 
        Periods,
        FORMAT_DATE('%b-%y', Periods) as mes_label,
        SABOR,
        ROUND(SUM(Vtas_Unds) / 1000, 1) as unds_k
      FROM \`psa-eltr-latam-pr.Nielsen.v_Nielsen_LATAM_Consolidado\`
      WHERE Pais = 'COSTA RICA'
        AND Apertura_Canal_Region = 'CANAL'
        AND Canal = '${bqCanal}'
        AND Apertura_Productos = 'SABOR'
        AND MARCA = '${marcaEscaped}'
        AND Periods >= DATE_SUB(PARSE_DATE('%Y-%m-%d', '${anchorDateStr}'), INTERVAL 11 MONTH)
        AND Periods <= PARSE_DATE('%Y-%m-%d', '${anchorDateStr}')
      GROUP BY Periods, mes_label, SABOR
      ORDER BY Periods ASC, unds_k DESC
    `;

    // 5. Lista de Marcas Disponibles
    const brandsQuery = `
      SELECT 
        MARCA,
        SUM(Vtas_Unds) as total_vol
      FROM \`psa-eltr-latam-pr.Nielsen.v_Nielsen_LATAM_Consolidado\`
      WHERE Pais = 'COSTA RICA'
        AND Apertura_Productos = 'MARCA'
        AND MARCA IS NOT NULL AND MARCA != ''
      GROUP BY MARCA
      ORDER BY total_vol DESC
    `;

    const [mixRows, trendsRows, sabTotalRows, sabCanalRows, brandRows] = await Promise.all([
      runBqQuery(mixQuery),
      runBqQuery(trendsQuery),
      runBqQuery(saboresTotalCanalesQuery),
      runBqQuery(saboresCanalQuery),
      runBqQuery(brandsQuery)
    ]);

    // Procesar Tendencias Mensuales agrupadas por Periodo
    const periodsMap = {};
    trendsRows.forEach(row => {
      const p = row.Periods?.value || row.Periods;
      if (!periodsMap[p]) {
        periodsMap[p] = {
          Periods: p,
          mes_label: row.mes_label,
          brands: {}
        };
      }
      periodsMap[p].brands[row.marca_norm] = {
        unds_k: Number(row.unds_k || 0),
        som_unds_pct: Number(row.som_unds_pct || 0),
        dist_num: Number(row.dist_num || 0),
        precio_unit: Number(row.precio_unit || 0),
        rotacion: Number(row.rotacion || 0)
      };
    });

    const monthlyTrends = Object.values(periodsMap);

    // Procesar Sabores Total Canales
    const saboresTotalMap = {};
    sabTotalRows.forEach(row => {
      if (!saboresTotalMap[row.mes_label]) {
        saboresTotalMap[row.mes_label] = { mes_label: row.mes_label, total_k: 0, sabores: {} };
      }
      const val = Number(row.unds_k || 0);
      saboresTotalMap[row.mes_label].sabores[row.SABOR] = val;
      saboresTotalMap[row.mes_label].total_k += val;
    });

    // Procesar Sabores Canal
    const saboresCanalMap = {};
    sabCanalRows.forEach(row => {
      if (!saboresCanalMap[row.mes_label]) {
        saboresCanalMap[row.mes_label] = { mes_label: row.mes_label, total_k: 0, sabores: {} };
      }
      const val = Number(row.unds_k || 0);
      saboresCanalMap[row.mes_label].sabores[row.SABOR] = val;
      saboresCanalMap[row.mes_label].total_k += val;
    });

    const availableMonthsByYear = {
      '2026': [
        { id: 'Todas', label: 'Todas' },
        { id: '1', label: 'Enero' },
        { id: '2', label: 'Febrero' },
        { id: '3', label: 'Marzo' },
        { id: '4', label: 'Abril' },
        { id: '5', label: 'Mayo' },
        { id: '6', label: 'Junio' },
        { id: '7', label: 'Julio' },
        { id: '8', label: 'Agosto' }
      ],
      '2025': [
        { id: 'Todas', label: 'Todas' },
        { id: '1', label: 'Enero' },
        { id: '2', label: 'Febrero' },
        { id: '3', label: 'Marzo' },
        { id: '4', label: 'Abril' },
        { id: '5', label: 'Mayo' },
        { id: '6', label: 'Junio' },
        { id: '7', label: 'Julio' },
        { id: '8', label: 'Agosto' },
        { id: '9', label: 'Septiembre' },
        { id: '10', label: 'Octubre' },
        { id: '11', label: 'Noviembre' },
        { id: '12', label: 'Diciembre' }
      ],
      '2024': [
        { id: 'Todas', label: 'Todas' },
        { id: '1', label: 'Enero' },
        { id: '2', label: 'Febrero' },
        { id: '3', label: 'Marzo' },
        { id: '4', label: 'Abril' },
        { id: '5', label: 'Mayo' },
        { id: '6', label: 'Junio' },
        { id: '7', label: 'Julio' },
        { id: '8', label: 'Agosto' },
        { id: '9', label: 'Septiembre' },
        { id: '10', label: 'Octubre' },
        { id: '11', label: 'Noviembre' },
        { id: '12', label: 'Diciembre' }
      ]
    };

    const result = {
      canal: canalParam,
      bqCanal,
      marca,
      anio,
      mes,
      mixBrands: mixRows,
      monthlyTrends,
      saboresTotalCanales: Object.values(saboresTotalMap),
      saboresCanal: Object.values(saboresCanalMap),
      availableBrands: brandRows.map(b => b.MARCA),
      availableYears: ['2026', '2025', '2024'],
      availableMonthsByYear
    };

    queryCache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    console.error('Error al consultar /api/nielsen/cr/canal-dashboard:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// ENDPOINT: DASHBOARD DE CANAL (GUATEMALA)
// ==========================================
app.get('/api/nielsen/gt/canal-dashboard', async (req, res) => {
  const canalParam = (req.query.canal || 'Moderno').trim();
  const bqCanal = (canalParam.toLowerCase() === 'tradicional') ? 'TRADICIONAL' : 'AUTOSERVICIOS';
  const marca = (req.query.marca || 'HIDRAVIDA').trim();
  const anio = req.query.anio || '2026';
  const mes = req.query.mes || 'Todas';

  const cacheKey = `gt_canal_${bqCanal}_${marca}_${anio}_${mes}`;
  const cached = queryCache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const anioNum = parseInt(anio, 10);
    const marcaEscaped = marca.replace(/'/g, "\\'");

    let maxMesClause = '';
    let anchorDateStr = `${anioNum}-08-01`;

    if (mes !== 'Todas') {
      const mesNum = parseInt(mes, 10);
      maxMesClause = `AND EXTRACT(MONTH FROM Periods) = ${mesNum}`;
      anchorDateStr = `${anioNum}-${String(mesNum).padStart(2, '0')}-01`;
    } else {
      if (anioNum === 2026) {
        maxMesClause = `AND EXTRACT(MONTH FROM Periods) <= 8`;
        anchorDateStr = `2026-08-01`;
      } else {
        anchorDateStr = `${anioNum}-12-01`;
      }
    }

    const brandCase = `
      CASE 
        WHEN UPPER(TRIM(MARCA)) IN ('ELECTROLIT', 'HIDRAVIDA') THEN 'Hidravida'
        WHEN UPPER(TRIM(MARCA)) IN ('ELECTROLIFE', 'HIDRALIFE') THEN 'Hidralife'
        WHEN UPPER(TRIM(MARCA)) = 'GATORADE' THEN 'Gatorade'
        WHEN UPPER(TRIM(MARCA)) IN ('GATORLYTE', 'GATORLIT') THEN 'Gatorlyte'
        WHEN UPPER(TRIM(MARCA)) = 'POWERADE' THEN 'Powerade'
        WHEN UPPER(TRIM(MARCA)) = 'PEDIALYTE' THEN 'Pedialyte'
        WHEN UPPER(TRIM(MARCA)) = 'ISOMAX' THEN 'Isomax'
        WHEN UPPER(TRIM(MARCA)) = 'SUEROX' THEN 'Suerox'
        WHEN UPPER(TRIM(MARCA)) = 'SPORADE' THEN 'Sporade'
        WHEN UPPER(TRIM(MARCA)) = 'REVIVE' THEN 'Revive'
        WHEN UPPER(TRIM(MARCA)) = 'GLUCOSORAL' THEN 'Glucosoral'
        ELSE 'Resto Marcas'
      END
    `;

    let marcaFilterClause = `UPPER(TRIM(MARCA)) = '${marcaEscaped}'`;
    if (marca.toUpperCase() === 'HIDRAVIDA') {
      marcaFilterClause = `UPPER(TRIM(MARCA)) IN ('HIDRAVIDA', 'ELECTROLIT')`;
    } else if (marca.toUpperCase() === 'HIDRALIFE') {
      marcaFilterClause = `UPPER(TRIM(MARCA)) IN ('HIDRALIFE', 'ELECTROLIFE')`;
    } else if (marca.toUpperCase() === 'GATORLYTE') {
      marcaFilterClause = `UPPER(TRIM(MARCA)) IN ('GATORLYTE', 'GATORLIT')`;
    }

    // 1. MIX Unidades (000) YTD: TOTAL YTD vs CANAL YTD (Desglose por Marca)
    const mixQuery = `
      WITH BaseTotal AS (
        SELECT 
          ${brandCase} as marca_norm,
          SUM(Vtas_Unds) as unds
        FROM \`psa-eltr-latam-pr.Nielsen.v_Nielsen_LATAM_Consolidado\`
        WHERE Pais = 'GUATEMALA'
          AND Apertura_Canal_Region = 'TOTAL'
          AND Apertura_Productos = 'MARCA'
          AND EXTRACT(YEAR FROM Periods) = ${anioNum}
          ${maxMesClause}
        GROUP BY marca_norm
      ),
      BaseCanal AS (
        SELECT 
          ${brandCase} as marca_norm,
          SUM(Vtas_Unds) as unds
        FROM \`psa-eltr-latam-pr.Nielsen.v_Nielsen_LATAM_Consolidado\`
        WHERE Pais = 'GUATEMALA'
          AND Apertura_Canal_Region = 'CANAL'
          AND Canal = '${bqCanal}'
          AND Apertura_Productos = 'MARCA'
          AND EXTRACT(YEAR FROM Periods) = ${anioNum}
          ${maxMesClause}
        GROUP BY marca_norm
      )
      SELECT 
        t.marca_norm,
        ROUND(t.unds / 1000, 0) as total_unds_k,
        ROUND((t.unds / NULLIF((SELECT SUM(unds) FROM BaseTotal), 0)) * 100, 1) as total_pct,
        ROUND(COALESCE(c.unds, 0) / 1000, 0) as canal_unds_k,
        ROUND((COALESCE(c.unds, 0) / NULLIF((SELECT SUM(unds) FROM BaseCanal), 0)) * 100, 1) as canal_pct
      FROM BaseTotal t
      LEFT JOIN BaseCanal c ON t.marca_norm = c.marca_norm
      ORDER BY total_unds_k DESC
    `;

    // 2. Tendencias Mensuales de Indicadores por Marca en el Canal Seleccionado
    const trendsQuery = `
      WITH BaseData AS (
        SELECT 
          Periods,
          FORMAT_DATE('%b-%y', Periods) as mes_label,
          ${brandCase} as marca_norm,
          MARCA as marca_raw,
          Vtas_Unds,
          Vtas_Valor,
          N_de_Tiendas_Venden_C,
          N_de_Tiendas_C
        FROM \`psa-eltr-latam-pr.Nielsen.v_Nielsen_LATAM_Consolidado\`
        WHERE Pais = 'GUATEMALA'
          AND Apertura_Canal_Region = 'CANAL'
          AND Canal = '${bqCanal}'
          AND Apertura_Productos = 'MARCA'
          AND Periods >= DATE_SUB(PARSE_DATE('%Y-%m-%d', '${anchorDateStr}'), INTERVAL 11 MONTH)
          AND Periods <= PARSE_DATE('%Y-%m-%d', '${anchorDateStr}')
      ),
      TotalCanalMensual AS (
        SELECT 
          Periods,
          SUM(Vtas_Unds) as total_canal_unds
        FROM BaseData
        GROUP BY Periods
      ),
      VentasAgg AS (
        SELECT 
          b.Periods,
          b.mes_label,
          b.marca_norm,
          SUM(b.Vtas_Unds) as unds,
          SUM(b.Vtas_Valor) as valor,
          ROUND(SUM(b.Vtas_Unds) / 1000, 0) as unds_k,
          ROUND(SUM(b.Vtas_Valor) / NULLIF(SUM(b.Vtas_Unds), 0), 2) as precio_unit
        FROM BaseData b
        GROUP BY b.Periods, b.mes_label, b.marca_norm
      ),
      DistAgg AS (
        SELECT 
          b.Periods,
          b.marca_norm,
          ROUND(MAX(SAFE_DIVIDE(b.N_de_Tiendas_Venden_C, b.N_de_Tiendas_C)) * 100, 1) as dist_num,
          ROUND(SUM(b.Vtas_Unds) / NULLIF(SUM(b.N_de_Tiendas_Venden_C) * EXTRACT(DAY FROM LAST_DAY(b.Periods)), 0), 1) as rotacion
        FROM BaseData b
        WHERE (b.marca_norm NOT IN ('Hidravida', 'Hidralife', 'Gatorlyte'))
           OR (b.marca_norm = 'Hidravida' AND UPPER(TRIM(b.marca_raw)) = 'HIDRAVIDA')
           OR (b.marca_norm = 'Hidralife' AND UPPER(TRIM(b.marca_raw)) = 'HIDRALIFE')
           OR (b.marca_norm = 'Gatorlyte' AND UPPER(TRIM(b.marca_raw)) = 'GATORLYTE')
        GROUP BY b.Periods, b.marca_norm
      )
      SELECT 
        v.Periods,
        v.mes_label,
        v.marca_norm,
        v.unds_k,
        v.precio_unit,
        COALESCE(d.dist_num, 0) as dist_num,
        COALESCE(d.rotacion, 0) as rotacion,
        ROUND((v.unds / NULLIF(t.total_canal_unds, 0)) * 100, 1) as som_unds_pct
      FROM VentasAgg v
      JOIN TotalCanalMensual t ON v.Periods = t.Periods
      LEFT JOIN DistAgg d ON v.Periods = d.Periods AND v.marca_norm = d.marca_norm
      ORDER BY v.Periods ASC, v.unds_k DESC
    `;

    // 3. Desglose Mensual de Sabores a Nivel Total Canales (Marca Seleccionada)
    const saboresTotalCanalesQuery = `
      SELECT 
        Periods,
        FORMAT_DATE('%b-%y', Periods) as mes_label,
        SABOR,
        ROUND(SUM(Vtas_Unds) / 1000, 1) as unds_k
      FROM \`psa-eltr-latam-pr.Nielsen.v_Nielsen_LATAM_Consolidado\`
      WHERE Pais = 'GUATEMALA'
        AND Apertura_Canal_Region = 'TOTAL'
        AND Apertura_Productos = 'SABOR'
        AND ${marcaFilterClause}
        AND Periods >= DATE_SUB(PARSE_DATE('%Y-%m-%d', '${anchorDateStr}'), INTERVAL 11 MONTH)
        AND Periods <= PARSE_DATE('%Y-%m-%d', '${anchorDateStr}')
      GROUP BY Periods, mes_label, SABOR
      ORDER BY Periods ASC, unds_k DESC
    `;

    // 4. Desglose Mensual de Sabores en el Canal Seleccionado (Marca Seleccionada)
    const saboresCanalQuery = `
      SELECT 
        Periods,
        FORMAT_DATE('%b-%y', Periods) as mes_label,
        SABOR,
        ROUND(SUM(Vtas_Unds) / 1000, 1) as unds_k
      FROM \`psa-eltr-latam-pr.Nielsen.v_Nielsen_LATAM_Consolidado\`
      WHERE Pais = 'GUATEMALA'
        AND Apertura_Canal_Region = 'CANAL'
        AND Canal = '${bqCanal}'
        AND Apertura_Productos = 'SABOR'
        AND ${marcaFilterClause}
        AND Periods >= DATE_SUB(PARSE_DATE('%Y-%m-%d', '${anchorDateStr}'), INTERVAL 11 MONTH)
        AND Periods <= PARSE_DATE('%Y-%m-%d', '${anchorDateStr}')
      GROUP BY Periods, mes_label, SABOR
      ORDER BY Periods ASC, unds_k DESC
    `;

    // 5. Lista de Marcas Disponibles
    const availableBrandsList = [
      'HIDRAVIDA', 'ISOMAX', 'GATORADE', 'SPORADE', 'REVIVE', 'POWERADE',
      'SUEROX', 'GLUCOSORAL', 'PEDIALYTE', 'GATORLYTE', 'HIDRALIFE', 'RESTO MARCAS'
    ];

    const [mixRows, trendsRows, sabTotalRows, sabCanalRows] = await Promise.all([
      runBqQuery(mixQuery),
      runBqQuery(trendsQuery),
      runBqQuery(saboresTotalCanalesQuery),
      runBqQuery(saboresCanalQuery)
    ]);

    // Procesar Tendencias Mensuales en estructura amigable para frontend
    const periodsMap = {};
    trendsRows.forEach(row => {
      const p = row.Periods;
      if (!periodsMap[p]) {
        periodsMap[p] = {
          periodo: p,
          mes_label: row.mes_label,
          brands: {}
        };
      }
      periodsMap[p].brands[row.marca_norm] = {
        unds_k: Number(row.unds_k || 0),
        som_unds_pct: Number(row.som_unds_pct || 0),
        dist_num: Number(row.dist_num || 0),
        precio_unit: Number(row.precio_unit || 0),
        rotacion: Number(row.rotacion || 0)
      };
    });

    const monthlyTrends = Object.values(periodsMap);

    // Procesar Sabores Total Canales
    const saboresTotalMap = {};
    sabTotalRows.forEach(row => {
      if (!saboresTotalMap[row.mes_label]) {
        saboresTotalMap[row.mes_label] = { mes_label: row.mes_label, total_k: 0, sabores: {} };
      }
      const val = Number(row.unds_k || 0);
      saboresTotalMap[row.mes_label].sabores[row.SABOR] = val;
      saboresTotalMap[row.mes_label].total_k += val;
    });

    // Procesar Sabores Canal
    const saboresCanalMap = {};
    sabCanalRows.forEach(row => {
      if (!saboresCanalMap[row.mes_label]) {
        saboresCanalMap[row.mes_label] = { mes_label: row.mes_label, total_k: 0, sabores: {} };
      }
      const val = Number(row.unds_k || 0);
      saboresCanalMap[row.mes_label].sabores[row.SABOR] = val;
      saboresCanalMap[row.mes_label].total_k += val;
    });

    const availableMonthsByYear = {
      '2026': [
        { id: 'Todas', label: 'Todas' },
        { id: '1', label: 'Enero' },
        { id: '2', label: 'Febrero' },
        { id: '3', label: 'Marzo' },
        { id: '4', label: 'Abril' },
        { id: '5', label: 'Mayo' },
        { id: '6', label: 'Junio' },
        { id: '7', label: 'Julio' },
        { id: '8', label: 'Agosto' }
      ],
      '2025': [
        { id: 'Todas', label: 'Todas' },
        { id: '1', label: 'Enero' },
        { id: '2', label: 'Febrero' },
        { id: '3', label: 'Marzo' },
        { id: '4', label: 'Abril' },
        { id: '5', label: 'Mayo' },
        { id: '6', label: 'Junio' },
        { id: '7', label: 'Julio' },
        { id: '8', label: 'Agosto' },
        { id: '9', label: 'Septiembre' },
        { id: '10', label: 'Octubre' },
        { id: '11', label: 'Noviembre' },
        { id: '12', label: 'Diciembre' }
      ],
      '2024': [
        { id: 'Todas', label: 'Todas' },
        { id: '1', label: 'Enero' },
        { id: '2', label: 'Febrero' },
        { id: '3', label: 'Marzo' },
        { id: '4', label: 'Abril' },
        { id: '5', label: 'Mayo' },
        { id: '6', label: 'Junio' },
        { id: '7', label: 'Julio' },
        { id: '8', label: 'Agosto' },
        { id: '9', label: 'Septiembre' },
        { id: '10', label: 'Octubre' },
        { id: '11', label: 'Noviembre' },
        { id: '12', label: 'Diciembre' }
      ]
    };

    const result = {
      canal: canalParam,
      bqCanal,
      marca,
      anio,
      mes,
      mixBrands: mixRows,
      monthlyTrends,
      saboresTotalCanales: Object.values(saboresTotalMap),
      saboresCanal: Object.values(saboresCanalMap),
      availableBrands: availableBrandsList,
      availableYears: ['2026', '2025', '2024'],
      availableMonthsByYear
    };

    queryCache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    console.error('Error al consultar /api/nielsen/gt/canal-dashboard:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// ENDPOINT: MATRIZ KPI'S / MATRIZ CANAL (COSTA RICA)
// ==========================================
app.get('/api/nielsen/cr/matriz-kpis', async (req, res) => {
  const anio = req.query.anio || '2026';
  const mes = req.query.mes || 'Todas';

  const cacheKey = `cr_matriz_kpis_${anio}_${mes}`;
  const cached = queryCache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const anioNum = parseInt(anio, 10);
    let mesClause = '';
    if (mes !== 'Todas') {
      const mesNum = parseInt(mes, 10);
      mesClause = `AND EXTRACT(MONTH FROM Periods) = ${mesNum}`;
    } else {
      if (anioNum === 2026) {
        mesClause = `AND EXTRACT(MONTH FROM Periods) <= 8`;
      }
    }

    const query = `
      WITH BaseData AS (
        SELECT 
          CASE 
            WHEN Apertura_Canal_Region = 'TOTAL' THEN 'TOTAL'
            WHEN Canal = 'AUTOSERVICIOS' THEN 'MODERNO'
            WHEN Canal = 'TRADICIONAL' THEN 'TRADICIONAL'
            ELSE 'OTRO'
          END as canal_norm,
          CASE 
            WHEN UPPER(MARCA) = 'ELECTROLIT' THEN 'Electrolit'
            WHEN UPPER(MARCA) = 'ELECTROLIFE' THEN 'Electrolife'
            WHEN UPPER(MARCA) = 'GATORADE' THEN 'Gatorade'
            WHEN UPPER(MARCA) = 'GATORLYTE' THEN 'Gatorlyte'
            WHEN UPPER(MARCA) = 'POWERADE' THEN 'Powerade'
            WHEN UPPER(MARCA) = 'SUEROX' THEN 'Suerox'
            WHEN UPPER(MARCA) = 'PRIME' THEN 'Prime'
            ELSE 'Otros'
          END as marca_norm,
          Periods,
          Vtas_Unds,
          Vtas_Valor,
          N_de_Tiendas_Venden_C,
          N_de_Tiendas_C
        FROM \`psa-eltr-latam-pr.Nielsen.v_Nielsen_LATAM_Consolidado\`
        WHERE Pais = 'COSTA RICA'
          AND Apertura_Productos = 'MARCA'
          AND EXTRACT(YEAR FROM Periods) = ${anioNum}
          ${mesClause}
          AND (Apertura_Canal_Region = 'TOTAL' OR (Apertura_Canal_Region = 'CANAL' AND Canal IN ('AUTOSERVICIOS', 'TRADICIONAL')))
      ),
      TotalesCanal AS (
        SELECT 
          canal_norm,
          SUM(Vtas_Unds) as total_canal_unds,
          SUM(Vtas_Valor) as total_canal_valor,
          SUM(N_de_Tiendas_C) as sum_tiendas_canal
        FROM BaseData
        GROUP BY canal_norm
      ),
      AggMarcaCanal AS (
        SELECT 
          b.canal_norm,
          b.marca_norm,
          SUM(b.Vtas_Unds) as unds,
          SUM(b.Vtas_Valor) as valor,
          SUM(b.N_de_Tiendas_Venden_C) as sum_tiendas_venden,
          SUM(b.N_de_Tiendas_C) as sum_tiendas_marca,
          SUM(b.N_de_Tiendas_Venden_C * EXTRACT(DAY FROM LAST_DAY(b.Periods))) as sum_tiendas_dias
        FROM BaseData b
        WHERE b.marca_norm != 'Otros'
        GROUP BY b.canal_norm, b.marca_norm
      )
      SELECT 
        a.canal_norm,
        a.marca_norm,
        ROUND((a.unds / NULLIF(t.total_canal_unds, 0)) * 100, 1) as share_unds,
        ROUND((a.valor / NULLIF(t.total_canal_valor, 0)) * 100, 1) as share_valor,
        ROUND(a.valor / NULLIF(a.unds, 0), 2) as precio,
        ROUND((a.sum_tiendas_venden / NULLIF(a.sum_tiendas_marca, 0)) * 100, 2) as dist_num,
        ROUND(a.unds / NULLIF(a.sum_tiendas_dias, 0), 2) as rotacion
      FROM AggMarcaCanal a
      JOIN TotalesCanal t ON a.canal_norm = t.canal_norm
      ORDER BY a.canal_norm, a.marca_norm
    `;

    const rows = await runBqQuery(query);

    const brands = ['Electrolit', 'Electrolife', 'Gatorade', 'Gatorlyte', 'Powerade', 'Suerox', 'Prime'];
    const channels = ['MODERNO', 'TRADICIONAL', 'TOTAL'];

    const matrixData = {
      share_unds: {},
      share_valor: {},
      rotacion: {},
      precio: {},
      dist_num: {}
    };

    channels.forEach(ch => {
      matrixData.share_unds[ch] = {};
      matrixData.share_valor[ch] = {};
      matrixData.rotacion[ch] = {};
      matrixData.precio[ch] = {};
      matrixData.dist_num[ch] = {};
      brands.forEach(br => {
        matrixData.share_unds[ch][br] = 0;
        matrixData.share_valor[ch][br] = 0;
        matrixData.rotacion[ch][br] = 0;
        matrixData.precio[ch][br] = 0;
        matrixData.dist_num[ch][br] = 0;
      });
    });

    rows.forEach(r => {
      const ch = r.canal_norm;
      const br = r.marca_norm;
      if (matrixData.share_unds[ch] && matrixData.share_unds[ch][br] !== undefined) {
        matrixData.share_unds[ch][br] = Number(r.share_unds || 0);
        matrixData.share_valor[ch][br] = Number(r.share_valor || 0);
        matrixData.rotacion[ch][br] = Number(r.rotacion || 0);
        matrixData.precio[ch][br] = Number(r.precio || 0);
        matrixData.dist_num[ch][br] = Number(r.dist_num || 0);
      }
    });

    const responsePayload = {
      anio,
      mes,
      brands,
      channels,
      matrix: matrixData,
      availableYears: ['2026', '2025', '2024'],
      availableMonthsByYear: {
        '2026': [
          { id: 'Todas', label: 'Todas' },
          { id: '1', label: 'Enero' },
          { id: '2', label: 'Febrero' },
          { id: '3', label: 'Marzo' },
          { id: '4', label: 'Abril' },
          { id: '5', label: 'Mayo' },
          { id: '6', label: 'Junio' },
          { id: '7', label: 'Julio' },
          { id: '8', label: 'Agosto' }
        ],
        '2025': [
          { id: 'Todas', label: 'Todas' },
          { id: '1', label: 'Enero' },
          { id: '2', label: 'Febrero' },
          { id: '3', label: 'Marzo' },
          { id: '4', label: 'Abril' },
          { id: '5', label: 'Mayo' },
          { id: '6', label: 'Junio' },
          { id: '7', label: 'Julio' },
          { id: '8', label: 'Agosto' },
          { id: '9', label: 'Septiembre' },
          { id: '10', label: 'Octubre' },
          { id: '11', label: 'Noviembre' },
          { id: '12', label: 'Diciembre' }
        ],
        '2024': [
          { id: 'Todas', label: 'Todas' },
          { id: '1', label: 'Enero' },
          { id: '2', label: 'Febrero' },
          { id: '3', label: 'Marzo' },
          { id: '4', label: 'Abril' },
          { id: '5', label: 'Mayo' },
          { id: '6', label: 'Junio' },
          { id: '7', label: 'Julio' },
          { id: '8', label: 'Agosto' },
          { id: '9', label: 'Septiembre' },
          { id: '10', label: 'Octubre' },
          { id: '11', label: 'Noviembre' },
          { id: '12', label: 'Diciembre' }
        ]
      }
    };

    queryCache.set(cacheKey, responsePayload);
    res.json(responsePayload);
  } catch (error) {
    console.error('Error al consultar /api/nielsen/cr/matriz-kpis:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// ENDPOINT: MATRIZ KPI'S / MATRIZ CANAL (GUATEMALA)
// ==========================================
app.get('/api/nielsen/gt/matriz-kpis', async (req, res) => {
  const anio = req.query.anio || '2026';
  const mes = req.query.mes || 'Todas';

  const cacheKey = `gt_matriz_kpis_${anio}_${mes}`;
  const cached = queryCache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const anioNum = parseInt(anio, 10);
    let mesClause = '';
    if (mes !== 'Todas') {
      const mesNum = parseInt(mes, 10);
      mesClause = `AND EXTRACT(MONTH FROM Periods) = ${mesNum}`;
    } else {
      if (anioNum === 2026) {
        mesClause = `AND EXTRACT(MONTH FROM Periods) <= 8`;
      }
    }

    const query = `
      WITH BaseData AS (
        SELECT 
          CASE 
            WHEN Apertura_Canal_Region = 'TOTAL' THEN 'TOTAL'
            WHEN Canal IN ('AUTOSERVICIOS', 'MODERNO') THEN 'MODERNO'
            WHEN Canal = 'TRADICIONAL' THEN 'TRADICIONAL'
            ELSE 'OTRO'
          END as canal_norm,
          CASE 
            WHEN UPPER(TRIM(MARCA)) IN ('ELECTROLIT', 'HIDRAVIDA') THEN 'Hidravida'
            WHEN UPPER(TRIM(MARCA)) IN ('ELECTROLIFE', 'HIDRALIFE') THEN 'Hidralife'
            WHEN UPPER(TRIM(MARCA)) = 'GATORADE' THEN 'Gatorade'
            WHEN UPPER(TRIM(MARCA)) IN ('GATORLYTE', 'GATORLIT') THEN 'Gatorlyte'
            WHEN UPPER(TRIM(MARCA)) = 'POWERADE' THEN 'Powerade'
            WHEN UPPER(TRIM(MARCA)) = 'ISOMAX' THEN 'Isomax'
            WHEN UPPER(TRIM(MARCA)) = 'SUEROX' THEN 'Suerox'
            WHEN UPPER(TRIM(MARCA)) = 'SPORADE' THEN 'Sporade'
            WHEN UPPER(TRIM(MARCA)) = 'REVIVE' THEN 'Revive'
            ELSE 'Otros'
          END as marca_norm,
          CASE 
            WHEN UPPER(TRIM(MARCA)) = 'HIDRAVIDA' THEN 'Hidravida'
            WHEN UPPER(TRIM(MARCA)) = 'HIDRALIFE' THEN 'Hidralife'
            WHEN UPPER(TRIM(MARCA)) = 'GATORADE' THEN 'Gatorade'
            WHEN UPPER(TRIM(MARCA)) IN ('GATORLYTE', 'GATORLIT') THEN 'Gatorlyte'
            WHEN UPPER(TRIM(MARCA)) = 'POWERADE' THEN 'Powerade'
            WHEN UPPER(TRIM(MARCA)) = 'ISOMAX' THEN 'Isomax'
            WHEN UPPER(TRIM(MARCA)) = 'SUEROX' THEN 'Suerox'
            WHEN UPPER(TRIM(MARCA)) = 'SPORADE' THEN 'Sporade'
            WHEN UPPER(TRIM(MARCA)) = 'REVIVE' THEN 'Revive'
            ELSE NULL
          END as marca_pure,
          Periods,
          Vtas_Unds,
          Vtas_Valor,
          N_de_Tiendas_Venden_C,
          N_de_Tiendas_C
        FROM \`psa-eltr-latam-pr.Nielsen.v_Nielsen_LATAM_Consolidado\`
        WHERE Pais = 'GUATEMALA'
          AND Apertura_Productos = 'MARCA'
          AND EXTRACT(YEAR FROM Periods) = ${anioNum}
          ${mesClause}
          AND (Apertura_Canal_Region = 'TOTAL' OR (Apertura_Canal_Region = 'CANAL' AND Canal IN ('AUTOSERVICIOS', 'MODERNO', 'TRADICIONAL')))
      ),
      TotalesCanal AS (
        SELECT 
          canal_norm,
          SUM(Vtas_Unds) as total_canal_unds,
          SUM(Vtas_Valor) as total_canal_valor
        FROM BaseData
        GROUP BY canal_norm
      ),
      AggMarcaCanal AS (
        SELECT 
          b.canal_norm,
          b.marca_norm,
          SUM(b.Vtas_Unds) as unds,
          SUM(b.Vtas_Valor) as valor,
          SUM(CASE WHEN b.marca_pure IS NOT NULL THEN b.Vtas_Unds ELSE 0 END) as pure_unds,
          SUM(CASE WHEN b.marca_pure IS NOT NULL THEN b.N_de_Tiendas_Venden_C ELSE 0 END) as sum_tiendas_venden,
          SUM(CASE WHEN b.marca_pure IS NOT NULL THEN b.N_de_Tiendas_C ELSE 0 END) as sum_tiendas_marca,
          SUM(CASE WHEN b.marca_pure IS NOT NULL THEN b.N_de_Tiendas_Venden_C * EXTRACT(DAY FROM LAST_DAY(b.Periods)) ELSE 0 END) as sum_tiendas_dias
        FROM BaseData b
        WHERE b.marca_norm != 'Otros'
        GROUP BY b.canal_norm, b.marca_norm
      )
      SELECT 
        a.canal_norm,
        a.marca_norm,
        ROUND((a.unds / NULLIF(t.total_canal_unds, 0)) * 100, 1) as share_unds,
        ROUND((a.valor / NULLIF(t.total_canal_valor, 0)) * 100, 1) as share_valor,
        ROUND(a.valor / NULLIF(a.unds, 0), 2) as precio,
        ROUND((a.sum_tiendas_venden / NULLIF(a.sum_tiendas_marca, 0)) * 100, 1) as dist_num,
        ROUND(a.pure_unds / NULLIF(a.sum_tiendas_dias, 0), 2) as rotacion
      FROM AggMarcaCanal a
      JOIN TotalesCanal t ON a.canal_norm = t.canal_norm
      ORDER BY a.canal_norm, a.marca_norm
    `;

    const rows = await runBqQuery(query);

    const brands = [
      'Hidravida',
      'Hidralife',
      'Gatorade',
      'Gatorlyte',
      'Powerade',
      'Isomax',
      'Suerox',
      'Sporade',
      'Revive'
    ];
    const channels = ['MODERNO', 'TRADICIONAL', 'TOTAL'];

    const matrixData = {
      share_unds: {},
      share_valor: {},
      rotacion: {},
      precio: {},
      dist_num: {}
    };

    channels.forEach(ch => {
      matrixData.share_unds[ch] = {};
      matrixData.share_valor[ch] = {};
      matrixData.rotacion[ch] = {};
      matrixData.precio[ch] = {};
      matrixData.dist_num[ch] = {};
      brands.forEach(br => {
        matrixData.share_unds[ch][br] = 0;
        matrixData.share_valor[ch][br] = 0;
        matrixData.rotacion[ch][br] = 0;
        matrixData.precio[ch][br] = 0;
        matrixData.dist_num[ch][br] = 0;
      });
    });

    rows.forEach(r => {
      const ch = r.canal_norm;
      const br = r.marca_norm;
      if (matrixData.share_unds[ch] && matrixData.share_unds[ch][br] !== undefined) {
        matrixData.share_unds[ch][br] = Number(r.share_unds || 0);
        matrixData.share_valor[ch][br] = Number(r.share_valor || 0);
        matrixData.rotacion[ch][br] = Number(r.rotacion || 0);
        matrixData.precio[ch][br] = Number(r.precio || 0);
        matrixData.dist_num[ch][br] = Number(r.dist_num || 0);
      }
    });

    const responsePayload = {
      anio,
      mes,
      brands,
      channels,
      matrix: matrixData,
      availableYears: ['2026', '2025', '2024'],
      availableMonthsByYear: {
        '2026': [
          { id: 'Todas', label: 'Todas' },
          { id: '1', label: 'Enero' },
          { id: '2', label: 'Febrero' },
          { id: '3', label: 'Marzo' },
          { id: '4', label: 'Abril' },
          { id: '5', label: 'Mayo' },
          { id: '6', label: 'Junio' },
          { id: '7', label: 'Julio' },
          { id: '8', label: 'Agosto' }
        ],
        '2025': [
          { id: 'Todas', label: 'Todas' },
          { id: '1', label: 'Enero' },
          { id: '2', label: 'Febrero' },
          { id: '3', label: 'Marzo' },
          { id: '4', label: 'Abril' },
          { id: '5', label: 'Mayo' },
          { id: '6', label: 'Junio' },
          { id: '7', label: 'Julio' },
          { id: '8', label: 'Agosto' },
          { id: '9', label: 'Septiembre' },
          { id: '10', label: 'Octubre' },
          { id: '11', label: 'Noviembre' },
          { id: '12', label: 'Diciembre' }
        ],
        '2024': [
          { id: 'Todas', label: 'Todas' },
          { id: '1', label: 'Enero' },
          { id: '2', label: 'Febrero' },
          { id: '3', label: 'Marzo' },
          { id: '4', label: 'Abril' },
          { id: '5', label: 'Mayo' },
          { id: '6', label: 'Junio' },
          { id: '7', label: 'Julio' },
          { id: '8', label: 'Agosto' },
          { id: '9', label: 'Septiembre' },
          { id: '10', label: 'Octubre' },
          { id: '11', label: 'Noviembre' },
          { id: '12', label: 'Diciembre' }
        ]
      }
    };

    queryCache.set(cacheKey, responsePayload);
    res.json(responsePayload);
  } catch (error) {
    console.error('Error al consultar /api/nielsen/gt/matriz-kpis:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Matriz KPI's Regiones Costa Rica (BigQuery en tiempo real)
app.get('/api/nielsen/cr/matriz-regiones', async (req, res) => {
  const anio = req.query.anio || '2026';
  const mes = req.query.mes || 'Todas';

  const cacheKey = `matriz-regiones-cr-${anio}-${mes}`;
  if (queryCache.has(cacheKey)) {
    return res.json(queryCache.get(cacheKey));
  }

  try {
    const anioNum = parseInt(anio, 10) || 2026;
    let mesClause = '';
    if (mes !== 'Todas') {
      const mesNum = parseInt(mes, 10);
      if (!isNaN(mesNum)) {
        mesClause = `AND EXTRACT(MONTH FROM Periods) = ${mesNum}`;
      }
    } else {
      if (anioNum === 2026) {
        mesClause = `AND EXTRACT(MONTH FROM Periods) <= 8`;
      }
    }

    const query = `
      WITH BaseData AS (
        SELECT 
          CASE 
            WHEN Apertura_Canal_Region = 'TOTAL' THEN 'TOTAL'
            ELSE UPPER(TRIM(Region))
          END as region_norm,
          CASE 
            WHEN UPPER(MARCA) = 'ELECTROLIT' THEN 'Electrolit'
            WHEN UPPER(MARCA) = 'ELECTROLIFE' THEN 'Electrolife'
            WHEN UPPER(MARCA) = 'GATORADE' THEN 'Gatorade'
            WHEN UPPER(MARCA) = 'GATORLYTE' THEN 'Gatorlyte'
            WHEN UPPER(MARCA) = 'POWERADE' THEN 'Powerade'
            WHEN UPPER(MARCA) = 'SUEROX' THEN 'Suerox'
            WHEN UPPER(MARCA) = 'PRIME' THEN 'Prime'
            ELSE 'Otros'
          END as marca_norm,
          Periods,
          Vtas_Unds,
          Vtas_Valor,
          N_de_Tiendas_Venden_C,
          N_de_Tiendas_C
        FROM \`psa-eltr-latam-pr.Nielsen.v_Nielsen_LATAM_Consolidado\`
        WHERE Pais = 'COSTA RICA'
          AND Apertura_Productos = 'MARCA'
          AND EXTRACT(YEAR FROM Periods) = ${anioNum}
          ${mesClause}
          AND Apertura_Canal_Region IN ('TOTAL/REGION', 'TOTAL')
      ),
      TotalesRegion AS (
        SELECT 
          region_norm,
          SUM(Vtas_Unds) as total_region_unds,
          SUM(Vtas_Valor) as total_region_valor,
          SUM(N_de_Tiendas_C) as sum_tiendas_region
        FROM BaseData
        GROUP BY region_norm
      ),
      AggMarcaRegion AS (
        SELECT 
          b.region_norm,
          b.marca_norm,
          SUM(b.Vtas_Unds) as unds,
          SUM(b.Vtas_Valor) as valor,
          SUM(b.N_de_Tiendas_Venden_C) as sum_tiendas_venden,
          SUM(b.N_de_Tiendas_C) as sum_tiendas_marca,
          SUM(b.N_de_Tiendas_Venden_C * EXTRACT(DAY FROM LAST_DAY(b.Periods))) as sum_tiendas_dias
        FROM BaseData b
        WHERE b.marca_norm != 'Otros'
        GROUP BY b.region_norm, b.marca_norm
      )
      SELECT 
        a.region_norm,
        a.marca_norm,
        ROUND((a.unds / NULLIF(t.total_region_unds, 0)) * 100, 1) as share_unds,
        ROUND((a.valor / NULLIF(t.total_region_valor, 0)) * 100, 1) as share_valor,
        ROUND(a.valor / NULLIF(a.unds, 0), 2) as precio,
        ROUND((a.sum_tiendas_venden / NULLIF(a.sum_tiendas_marca, 0)) * 100, 2) as dist_num,
        ROUND(a.unds / NULLIF(a.sum_tiendas_dias, 0), 2) as rotacion
      FROM AggMarcaRegion a
      JOIN TotalesRegion t ON a.region_norm = t.region_norm
      ORDER BY a.region_norm, a.marca_norm
    `;

    const rows = await runBqQuery(query);

    const brands = ['Electrolit', 'Electrolife', 'Gatorade', 'Gatorlyte', 'Powerade', 'Suerox', 'Prime'];
    const regions = ['ATLANTICO', 'CENTRAL', 'METRO', 'NORTE', 'SUR', 'TOTAL'];

    const matrixData = {
      share_unds: {},
      share_valor: {},
      rotacion: {},
      precio: {},
      dist_num: {}
    };

    regions.forEach(reg => {
      matrixData.share_unds[reg] = {};
      matrixData.share_valor[reg] = {};
      matrixData.rotacion[reg] = {};
      matrixData.precio[reg] = {};
      matrixData.dist_num[reg] = {};
      brands.forEach(br => {
        matrixData.share_unds[reg][br] = 0;
        matrixData.share_valor[reg][br] = 0;
        matrixData.rotacion[reg][br] = 0;
        matrixData.precio[reg][br] = 0;
        matrixData.dist_num[reg][br] = 0;
      });
    });

    rows.forEach(r => {
      const reg = r.region_norm;
      const br = r.marca_norm;
      if (matrixData.share_unds[reg] && matrixData.share_unds[reg][br] !== undefined) {
        matrixData.share_unds[reg][br] = Number(r.share_unds || 0);
        matrixData.share_valor[reg][br] = Number(r.share_valor || 0);
        matrixData.rotacion[reg][br] = Number(r.rotacion || 0);
        matrixData.precio[reg][br] = Number(r.precio || 0);
        matrixData.dist_num[reg][br] = Number(r.dist_num || 0);
      }
    });

    const responsePayload = {
      anio,
      mes,
      brands,
      regions,
      matrix: matrixData,
      availableYears: ['2026', '2025', '2024'],
      availableMonthsByYear: {
        '2026': [
          { id: 'Todas', label: 'Todas' },
          { id: '1', label: 'Enero' },
          { id: '2', label: 'Febrero' },
          { id: '3', label: 'Marzo' },
          { id: '4', label: 'Abril' },
          { id: '5', label: 'Mayo' },
          { id: '6', label: 'Junio' },
          { id: '7', label: 'Julio' },
          { id: '8', label: 'Agosto' }
        ],
        '2025': [
          { id: 'Todas', label: 'Todas' },
          { id: '1', label: 'Enero' },
          { id: '2', label: 'Febrero' },
          { id: '3', label: 'Marzo' },
          { id: '4', label: 'Abril' },
          { id: '5', label: 'Mayo' },
          { id: '6', label: 'Junio' },
          { id: '7', label: 'Julio' },
          { id: '8', label: 'Agosto' },
          { id: '9', label: 'Septiembre' },
          { id: '10', label: 'Octubre' },
          { id: '11', label: 'Noviembre' },
          { id: '12', label: 'Diciembre' }
        ],
        '2024': [
          { id: 'Todas', label: 'Todas' },
          { id: '1', label: 'Enero' },
          { id: '2', label: 'Febrero' },
          { id: '3', label: 'Marzo' },
          { id: '4', label: 'Abril' },
          { id: '5', label: 'Mayo' },
          { id: '6', label: 'Junio' },
          { id: '7', label: 'Julio' },
          { id: '8', label: 'Agosto' },
          { id: '9', label: 'Septiembre' },
          { id: '10', label: 'Octubre' },
          { id: '11', label: 'Noviembre' },
          { id: '12', label: 'Diciembre' }
        ]
      }
    };

    queryCache.set(cacheKey, responsePayload);
    res.json(responsePayload);
  } catch (error) {
    console.error('Error al consultar /api/nielsen/cr/matriz-regiones:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// ENDPOINT: MATRIZ REGIONES (GUATEMALA)
// ==========================================
app.get('/api/nielsen/gt/matriz-regiones', async (req, res) => {
  const anio = req.query.anio || '2026';
  const mes = req.query.mes || 'Todas';

  const cacheKey = `matriz-regiones-gt-${anio}-${mes}`;
  if (queryCache.has(cacheKey)) {
    return res.json(queryCache.get(cacheKey));
  }

  try {
    const anioNum = parseInt(anio, 10) || 2026;
    let mesClause = '';
    if (mes !== 'Todas') {
      const mesNum = parseInt(mes, 10);
      if (!isNaN(mesNum)) {
        mesClause = `AND EXTRACT(MONTH FROM Periods) = ${mesNum}`;
      }
    } else {
      if (anioNum === 2026) {
        mesClause = `AND EXTRACT(MONTH FROM Periods) <= 8`;
      }
    }

    const query = `
      WITH BaseData AS (
        SELECT 
          CASE 
            WHEN Apertura_Canal_Region = 'TOTAL' THEN 'TOTAL'
            ELSE UPPER(TRIM(Region))
          END as region_norm,
          CASE 
            WHEN UPPER(TRIM(MARCA)) IN ('ELECTROLIT', 'HIDRAVIDA') THEN 'Hidravida'
            WHEN UPPER(TRIM(MARCA)) IN ('ELECTROLIFE', 'HIDRALIFE') THEN 'Hidralife'
            WHEN UPPER(TRIM(MARCA)) = 'GATORADE' THEN 'Gatorade'
            WHEN UPPER(TRIM(MARCA)) IN ('GATORLYTE', 'GATORLIT') THEN 'Gatorlyte'
            WHEN UPPER(TRIM(MARCA)) = 'POWERADE' THEN 'Powerade'
            WHEN UPPER(TRIM(MARCA)) = 'ISOMAX' THEN 'Isomax'
            WHEN UPPER(TRIM(MARCA)) = 'SUEROX' THEN 'Suerox'
            WHEN UPPER(TRIM(MARCA)) = 'SPORADE' THEN 'Sporade'
            WHEN UPPER(TRIM(MARCA)) = 'REVIVE' THEN 'Revive'
            ELSE 'Otros'
          END as marca_norm,
          CASE 
            WHEN UPPER(TRIM(MARCA)) = 'HIDRAVIDA' THEN 'Hidravida'
            WHEN UPPER(TRIM(MARCA)) = 'HIDRALIFE' THEN 'Hidralife'
            WHEN UPPER(TRIM(MARCA)) = 'GATORADE' THEN 'Gatorade'
            WHEN UPPER(TRIM(MARCA)) IN ('GATORLYTE', 'GATORLIT') THEN 'Gatorlyte'
            WHEN UPPER(TRIM(MARCA)) = 'POWERADE' THEN 'Powerade'
            WHEN UPPER(TRIM(MARCA)) = 'ISOMAX' THEN 'Isomax'
            WHEN UPPER(TRIM(MARCA)) = 'SUEROX' THEN 'Suerox'
            WHEN UPPER(TRIM(MARCA)) = 'SPORADE' THEN 'Sporade'
            WHEN UPPER(TRIM(MARCA)) = 'REVIVE' THEN 'Revive'
            ELSE NULL
          END as marca_pure,
          Periods,
          Vtas_Unds,
          Vtas_Valor,
          N_de_Tiendas_Venden_C,
          N_de_Tiendas_C
        FROM \`psa-eltr-latam-pr.Nielsen.v_Nielsen_LATAM_Consolidado\`
        WHERE Pais = 'GUATEMALA'
          AND Apertura_Productos = 'MARCA'
          AND EXTRACT(YEAR FROM Periods) = ${anioNum}
          ${mesClause}
          AND (
            Apertura_Canal_Region = 'TOTAL' 
            OR (Apertura_Canal_Region = 'TOTAL/REGION' AND UPPER(TRIM(Region)) != 'TOTAL')
          )
      ),
      TotalesRegion AS (
        SELECT 
          region_norm,
          SUM(Vtas_Unds) as total_region_unds,
          SUM(Vtas_Valor) as total_region_valor,
          SUM(N_de_Tiendas_C) as sum_tiendas_region
        FROM BaseData
        GROUP BY region_norm
      ),
      AggMarcaRegion AS (
        SELECT 
          b.region_norm,
          b.marca_norm,
          SUM(b.Vtas_Unds) as unds,
          SUM(b.Vtas_Valor) as valor,
          SUM(CASE WHEN b.marca_pure IS NOT NULL THEN b.N_de_Tiendas_Venden_C ELSE 0 END) as sum_tiendas_venden,
          SUM(CASE WHEN b.marca_pure IS NOT NULL THEN b.N_de_Tiendas_C ELSE 0 END) as sum_tiendas_marca,
          SUM(CASE WHEN b.marca_pure IS NOT NULL THEN b.N_de_Tiendas_Venden_C * EXTRACT(DAY FROM LAST_DAY(b.Periods)) ELSE 0 END) as sum_tiendas_dias
        FROM BaseData b
        WHERE b.marca_norm != 'Otros'
        GROUP BY b.region_norm, b.marca_norm
      )
      SELECT 
        a.region_norm,
        a.marca_norm,
        ROUND((a.unds / NULLIF(t.total_region_unds, 0)) * 100, 1) as share_unds,
        ROUND((a.valor / NULLIF(t.total_region_valor, 0)) * 100, 1) as share_valor,
        ROUND(a.valor / NULLIF(a.unds, 0), 2) as precio,
        ROUND((a.sum_tiendas_venden / NULLIF(a.sum_tiendas_marca, 0)) * 100, 1) as dist_num,
        ROUND(a.unds / NULLIF(a.sum_tiendas_dias, 0), 2) as rotacion
      FROM AggMarcaRegion a
      JOIN TotalesRegion t ON a.region_norm = t.region_norm
      ORDER BY a.region_norm, a.marca_norm
    `;

    const rows = await runBqQuery(query);

    const brands = [
      'Hidravida',
      'Hidralife',
      'Gatorade',
      'Gatorlyte',
      'Powerade',
      'Isomax',
      'Suerox',
      'Sporade',
      'Revive'
    ];

    const regions = [
      'OCCIDENTE CHICO',
      'OCCIDENTE',
      'METRO',
      'NORORIENTE',
      'SUR',
      'VERAPACES',
      'ORIENTE CHICO',
      'ORIENTE GRANDE',
      'TOTAL'
    ];

    const matrixData = {
      share_unds: {},
      share_valor: {},
      rotacion: {},
      precio: {},
      dist_num: {}
    };

    regions.forEach(reg => {
      matrixData.share_unds[reg] = {};
      matrixData.share_valor[reg] = {};
      matrixData.rotacion[reg] = {};
      matrixData.precio[reg] = {};
      matrixData.dist_num[reg] = {};
      brands.forEach(br => {
        matrixData.share_unds[reg][br] = 0;
        matrixData.share_valor[reg][br] = 0;
        matrixData.rotacion[reg][br] = 0;
        matrixData.precio[reg][br] = 0;
        matrixData.dist_num[reg][br] = 0;
      });
    });

    rows.forEach(r => {
      const reg = r.region_norm;
      const br = r.marca_norm;
      if (matrixData.share_unds[reg] && matrixData.share_unds[reg][br] !== undefined) {
        matrixData.share_unds[reg][br] = Number(r.share_unds || 0);
        matrixData.share_valor[reg][br] = Number(r.share_valor || 0);
        matrixData.rotacion[reg][br] = Number(r.rotacion || 0);
        matrixData.precio[reg][br] = Number(r.precio || 0);
        matrixData.dist_num[reg][br] = Number(r.dist_num || 0);
      }
    });

    const responsePayload = {
      anio,
      mes,
      brands,
      regions,
      matrix: matrixData,
      availableYears: ['2026', '2025', '2024'],
      availableMonthsByYear: {
        '2026': [
          { id: 'Todas', label: 'Todas' },
          { id: '1', label: 'Enero' },
          { id: '2', label: 'Febrero' },
          { id: '3', label: 'Marzo' },
          { id: '4', label: 'Abril' },
          { id: '5', label: 'Mayo' },
          { id: '6', label: 'Junio' },
          { id: '7', label: 'Julio' },
          { id: '8', label: 'Agosto' }
        ],
        '2025': [
          { id: 'Todas', label: 'Todas' },
          { id: '1', label: 'Enero' },
          { id: '2', label: 'Febrero' },
          { id: '3', label: 'Marzo' },
          { id: '4', label: 'Abril' },
          { id: '5', label: 'Mayo' },
          { id: '6', label: 'Junio' },
          { id: '7', label: 'Julio' },
          { id: '8', label: 'Agosto' },
          { id: '9', label: 'Septiembre' },
          { id: '10', label: 'Octubre' },
          { id: '11', label: 'Noviembre' },
          { id: '12', label: 'Diciembre' }
        ],
        '2024': [
          { id: 'Todas', label: 'Todas' },
          { id: '1', label: 'Enero' },
          { id: '2', label: 'Febrero' },
          { id: '3', label: 'Marzo' },
          { id: '4', label: 'Abril' },
          { id: '5', label: 'Mayo' },
          { id: '6', label: 'Junio' },
          { id: '7', label: 'Julio' },
          { id: '8', label: 'Agosto' },
          { id: '9', label: 'Septiembre' },
          { id: '10', label: 'Octubre' },
          { id: '11', label: 'Noviembre' },
          { id: '12', label: 'Diciembre' }
        ]
      }
    };

    queryCache.set(cacheKey, responsePayload);
    res.json(responsePayload);
  } catch (error) {
    console.error('Error al consultar /api/nielsen/gt/matriz-regiones:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint Growth Drivers Costa Rica
app.get('/api/nielsen/cr/growth-drivers', async (req, res) => {
  const anio = req.query.anio || '2026';
  const mes = req.query.mes || 'Todas';
  const selectedMarca = (req.query.marca || 'ELECTROLIT').toUpperCase();

  const cacheKey = `cr_growth_drivers_${anio}_${mes}_${selectedMarca}`;
  if (queryCache.has(cacheKey)) {
    return res.json(queryCache.get(cacheKey));
  }

  try {
    const targetYear = parseInt(anio, 10);
    const prevYear = targetYear - 1;

    let maxMonthForYear = 12;
    if (targetYear === 2026) maxMonthForYear = 8;

    const bqSql = `
      SELECT 
        EXTRACT(YEAR FROM Periods) as anio,
        EXTRACT(MONTH FROM Periods) as mes,
        CASE 
          WHEN UPPER(MARCA) = 'ELECTROLIT' THEN 'Electrolit'
          WHEN UPPER(MARCA) = 'ELECTROLIFE' THEN 'Electrolife'
          WHEN UPPER(MARCA) = 'GATORADE' THEN 'Gatorade'
          WHEN UPPER(MARCA) = 'GATORLYTE' THEN 'Gatorlyte'
          WHEN UPPER(MARCA) = 'POWERADE' THEN 'Powerade'
          WHEN UPPER(MARCA) = 'SUEROX' THEN 'Suerox'
          WHEN UPPER(MARCA) = 'PRIME' THEN 'Prime'
          ELSE UPPER(MARCA)
        END as marca_norm,
        SUM(Vtas_Unds) as unds,
        SUM(Vtas_Valor) as valor,
        SUM(N_de_Tiendas_Venden_C) as tv,
        SUM(N_de_Tiendas_C) as tt
      FROM \`psa-eltr-latam-pr.Nielsen.v_Nielsen_LATAM_Consolidado\`
      WHERE Pais = 'COSTA RICA'
        AND Apertura_Productos = 'MARCA'
        AND Apertura_Canal_Region = 'CANAL'
        AND EXTRACT(YEAR FROM Periods) IN (${targetYear}, ${prevYear})
      GROUP BY anio, mes, marca_norm
      ORDER BY marca_norm, mes
    `;

    const rawRows = await runBqQuery(bqSql);

    const brandsList = ['Electrolit', 'Electrolife', 'Gatorade', 'Gatorlyte', 'Powerade', 'Suerox', 'Prime'];
    const monthNamesShort = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

    // Determinar meses a procesar
    let monthsToProcess = [];
    if (mes === 'Todas') {
      for (let m = 1; m <= maxMonthForYear; m++) monthsToProcess.push(m);
    } else {
      monthsToProcess.push(parseInt(mes, 10));
    }

    // 1. Matriz YTD por Marcas
    const marcasYtdUnd = {};
    const marcasYtdUsd = {};

    brandsList.forEach(b => {
      let sum_dist_und = 0, sum_rot_und = 0, sum_total_und = 0;
      let sum_precio_usd = 0, sum_dist_usd = 0, sum_rot_usd = 0, sum_total_usd = 0;
      let sum_unds_ly = 0, sum_valor_ly = 0;

      monthsToProcess.forEach(m => {
        const rowTY = rawRows.find(r => r.marca_norm.toUpperCase() === b.toUpperCase() && parseInt(r.anio, 10) === targetYear && parseInt(r.mes, 10) === m);
        const rowLY = rawRows.find(r => r.marca_norm.toUpperCase() === b.toUpperCase() && parseInt(r.anio, 10) === prevYear && parseInt(r.mes, 10) === m);

        const u_ty = rowTY ? parseFloat(rowTY.unds) || 0 : 0;
        const u_ly = rowLY ? parseFloat(rowLY.unds) || 0 : 0;
        const v_ty = rowTY ? parseFloat(rowTY.valor) || 0 : 0;
        const v_ly = rowLY ? parseFloat(rowLY.valor) || 0 : 0;
        const tv_ty = rowTY ? parseFloat(rowTY.tv) || 0 : 0;
        const tv_ly = rowLY ? parseFloat(rowLY.tv) || 0 : 0;

        const p_ty = u_ty > 0 ? v_ty / u_ty : 0;
        const p_ly = u_ly > 0 ? v_ly / u_ly : 0;

        const diff_u = u_ty - u_ly;
        const diff_v = v_ty - v_ly;

        const p_impact = (p_ty - p_ly) * u_ty;
        const dist_impact_u = tv_ly > 0 ? (tv_ty / tv_ly - 1) * u_ly : 0;
        const rot_impact_u = diff_u - dist_impact_u;

        const dist_impact_v = dist_impact_u * p_ly;
        const rot_impact_v = rot_impact_u * p_ly;

        sum_dist_und += dist_impact_u;
        sum_rot_und += rot_impact_u;
        sum_total_und += diff_u;

        sum_precio_usd += p_impact;
        sum_dist_usd += dist_impact_v;
        sum_rot_usd += rot_impact_v;
        sum_total_usd += diff_v;

        sum_unds_ly += u_ly;
        sum_valor_ly += v_ly;
      });

      marcasYtdUnd[b] = {
        dist: { dif: Math.round(sum_dist_und), vsLy: sum_unds_ly > 0 ? (sum_dist_und / sum_unds_ly) * 100 : 0 },
        rot: { dif: Math.round(sum_rot_und), vsLy: sum_unds_ly > 0 ? (sum_rot_und / sum_unds_ly) * 100 : 0 },
        total: { dif: Math.round(sum_total_und), vsLy: sum_unds_ly > 0 ? (sum_total_und / sum_unds_ly) * 100 : 0 }
      };

      marcasYtdUsd[b] = {
        precio: { dif: Math.round(sum_precio_usd), vsLy: sum_valor_ly > 0 ? (sum_precio_usd / sum_valor_ly) * 100 : 0 },
        dist: { dif: Math.round(sum_dist_usd), vsLy: sum_valor_ly > 0 ? (sum_dist_usd / sum_valor_ly) * 100 : 0 },
        rot: { dif: Math.round(sum_rot_usd), vsLy: sum_valor_ly > 0 ? (sum_rot_usd / sum_valor_ly) * 100 : 0 },
        total: { dif: Math.round(sum_total_usd), vsLy: sum_valor_ly > 0 ? (sum_total_usd / sum_valor_ly) * 100 : 0 }
      };
    });

    // 2. Matriz Mensual & Gráficos para la marca seleccionada
    const monthlyDataUnd = [];
    const monthlyDataUsd = [];

    let totalUndRow = { dist_dif: 0, rot_dif: 0, total_dif: 0, sum_unds_ly: 0 };
    let totalUsdRow = { precio_dif: 0, dist_dif: 0, rot_dif: 0, total_dif: 0, sum_valor_ly: 0 };

    for (let m = 1; m <= maxMonthForYear; m++) {
      const monthLabel = monthNamesShort[m - 1];
      const rowTY = rawRows.find(r => r.marca_norm.toUpperCase() === selectedMarca && parseInt(r.anio, 10) === targetYear && parseInt(r.mes, 10) === m);
      const rowLY = rawRows.find(r => r.marca_norm.toUpperCase() === selectedMarca && parseInt(r.anio, 10) === prevYear && parseInt(r.mes, 10) === m);

      const u_ty = rowTY ? parseFloat(rowTY.unds) || 0 : 0;
      const u_ly = rowLY ? parseFloat(rowLY.unds) || 0 : 0;
      const v_ty = rowTY ? parseFloat(rowTY.valor) || 0 : 0;
      const v_ly = rowLY ? parseFloat(rowLY.valor) || 0 : 0;
      const tv_ty = rowTY ? parseFloat(rowTY.tv) || 0 : 0;
      const tv_ly = rowLY ? parseFloat(rowLY.tv) || 0 : 0;

      const p_ty = u_ty > 0 ? v_ty / u_ty : 0;
      const p_ly = u_ly > 0 ? v_ly / u_ly : 0;

      const diff_u = u_ty - u_ly;
      const diff_v = v_ty - v_ly;

      const p_impact = (p_ty - p_ly) * u_ty;
      const dist_impact_u = tv_ly > 0 ? (tv_ty / tv_ly - 1) * u_ly : 0;
      const rot_impact_u = diff_u - dist_impact_u;

      const dist_impact_v = dist_impact_u * p_ly;
      const rot_impact_v = rot_impact_u * p_ly;

      monthlyDataUnd.push({
        mes: m,
        label: monthLabel,
        chartLabel: `${monthLabel} ${String(targetYear).slice(2)}`,
        dist_dif: Math.round(dist_impact_u),
        dist_vsLy: u_ly > 0 ? (dist_impact_u / u_ly) * 100 : 0,
        rot_dif: Math.round(rot_impact_u),
        rot_vsLy: u_ly > 0 ? (rot_impact_u / u_ly) * 100 : 0,
        total_dif: Math.round(diff_u),
        total_vsLy: u_ly > 0 ? (diff_u / u_ly) * 100 : 0
      });

      monthlyDataUsd.push({
        mes: m,
        label: monthLabel,
        chartLabel: `${monthLabel} ${String(targetYear).slice(2)}`,
        precio_dif: Math.round(p_impact),
        precio_vsLy: v_ly > 0 ? (p_impact / v_ly) * 100 : 0,
        dist_dif: Math.round(dist_impact_v),
        dist_vsLy: v_ly > 0 ? (dist_impact_v / v_ly) * 100 : 0,
        rot_dif: Math.round(rot_impact_v),
        rot_vsLy: v_ly > 0 ? (rot_impact_v / v_ly) * 100 : 0,
        total_dif: Math.round(diff_v),
        total_vsLy: v_ly > 0 ? (diff_v / v_ly) * 100 : 0
      });

      totalUndRow.dist_dif += dist_impact_u;
      totalUndRow.rot_dif += rot_impact_u;
      totalUndRow.total_dif += diff_u;
      totalUndRow.sum_unds_ly += u_ly;

      totalUsdRow.precio_dif += p_impact;
      totalUsdRow.dist_dif += dist_impact_v;
      totalUsdRow.rot_dif += rot_impact_v;
      totalUsdRow.total_dif += diff_v;
      totalUsdRow.sum_valor_ly += v_ly;
    }

    const summaryTotalUnd = {
      dist_dif: Math.round(totalUndRow.dist_dif),
      dist_vsLy: totalUndRow.sum_unds_ly > 0 ? (totalUndRow.dist_dif / totalUndRow.sum_unds_ly) * 100 : 0,
      rot_dif: Math.round(totalUndRow.rot_dif),
      rot_vsLy: totalUndRow.sum_unds_ly > 0 ? (totalUndRow.rot_dif / totalUndRow.sum_unds_ly) * 100 : 0,
      total_dif: Math.round(totalUndRow.total_dif),
      total_vsLy: totalUndRow.sum_unds_ly > 0 ? (totalUndRow.total_dif / totalUndRow.sum_unds_ly) * 100 : 0
    };

    const summaryTotalUsd = {
      precio_dif: Math.round(totalUsdRow.precio_dif),
      precio_vsLy: totalUsdRow.sum_valor_ly > 0 ? (totalUsdRow.precio_dif / totalUsdRow.sum_valor_ly) * 100 : 0,
      dist_dif: Math.round(totalUsdRow.dist_dif),
      dist_vsLy: totalUsdRow.sum_valor_ly > 0 ? (totalUsdRow.dist_dif / totalUsdRow.sum_valor_ly) * 100 : 0,
      rot_dif: Math.round(totalUsdRow.rot_dif),
      rot_vsLy: totalUsdRow.sum_valor_ly > 0 ? (totalUsdRow.rot_dif / totalUsdRow.sum_valor_ly) * 100 : 0,
      total_dif: Math.round(totalUsdRow.total_dif),
      total_vsLy: totalUsdRow.sum_valor_ly > 0 ? (totalUsdRow.total_dif / totalUsdRow.sum_valor_ly) * 100 : 0
    };

    const responsePayload = {
      anio: targetYear,
      mes: mes,
      marca: selectedMarca,
      marcasYtdUnd,
      marcasYtdUsd,
      monthlyDataUnd,
      monthlyDataUsd,
      summaryTotalUnd,
      summaryTotalUsd,
      marcasDisponibles: [
        { id: 'ELECTROLIT', label: 'ELECTROLIT' },
        { id: 'ELECTROLIFE', label: 'ELECTROLIFE' },
        { id: 'GATORADE', label: 'GATORADE' },
        { id: 'GATORLYTE', label: 'GATORLYTE' },
        { id: 'POWERADE', label: 'POWERADE' },
        { id: 'SUEROX', label: 'SUEROX' },
        { id: 'PRIME', label: 'PRIME' }
      ],
      aniosDisponibles: [
        { id: '2026', label: '2026' },
        { id: '2025', label: '2025' },
        { id: '2024', label: '2024' }
      ],
      mesesPorAnio: {
        '2026': [
          { id: 'Todas', label: 'Todas' },
          { id: '1', label: 'Enero' },
          { id: '2', label: 'Febrero' },
          { id: '3', label: 'Marzo' },
          { id: '4', label: 'Abril' },
          { id: '5', label: 'Mayo' },
          { id: '6', label: 'Junio' },
          { id: '7', label: 'Julio' },
          { id: '8', label: 'Agosto' }
        ],
        '2025': [
          { id: 'Todas', label: 'Todas' },
          { id: '1', label: 'Enero' },
          { id: '2', label: 'Febrero' },
          { id: '3', label: 'Marzo' },
          { id: '4', label: 'Abril' },
          { id: '5', label: 'Mayo' },
          { id: '6', label: 'Junio' },
          { id: '7', label: 'Julio' },
          { id: '8', label: 'Agosto' },
          { id: '9', label: 'Septiembre' },
          { id: '10', label: 'Octubre' },
          { id: '11', label: 'Noviembre' },
          { id: '12', label: 'Diciembre' }
        ],
        '2024': [
          { id: 'Todas', label: 'Todas' },
          { id: '1', label: 'Enero' },
          { id: '2', label: 'Febrero' },
          { id: '3', label: 'Marzo' },
          { id: '4', label: 'Abril' },
          { id: '5', label: 'Mayo' },
          { id: '6', label: 'Junio' },
          { id: '7', label: 'Julio' },
          { id: '8', label: 'Agosto' },
          { id: '9', label: 'Septiembre' },
          { id: '10', label: 'Octubre' },
          { id: '11', label: 'Noviembre' },
          { id: '12', label: 'Diciembre' }
        ]
      }
    };

    queryCache.set(cacheKey, responsePayload);
    res.json(responsePayload);
  } catch (error) {
    console.error('Error al consultar /api/nielsen/cr/growth-drivers:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint Growth Drivers (Marcas Impacto) Guatemala
app.get('/api/nielsen/gt/growth-drivers', async (req, res) => {
  const anio = req.query.anio || '2026';
  const mes = req.query.mes || 'Todas';
  const selectedMarca = (req.query.marca || 'HIDRAVIDA').toUpperCase();

  const cacheKey = `gt_growth_drivers_${anio}_${mes}_${selectedMarca}`;
  if (queryCache.has(cacheKey)) {
    return res.json(queryCache.get(cacheKey));
  }

  try {
    const targetYear = parseInt(anio, 10);
    const prevYear = targetYear - 1;

    let maxMonthForYear = 12;
    if (targetYear === 2026) maxMonthForYear = 8;

    const bqSql = `
      SELECT 
        EXTRACT(YEAR FROM Periods) as anio,
        EXTRACT(MONTH FROM Periods) as mes,
        CASE 
          WHEN UPPER(MARCA) IN ('HIDRAVIDA', 'ELECTROLIT') THEN 'Hidravida'
          WHEN UPPER(MARCA) IN ('HIDRALIFE', 'ELECTROLIFE') THEN 'Hidralife'
          WHEN UPPER(MARCA) = 'GATORADE' THEN 'Gatorade'
          WHEN UPPER(MARCA) = 'GATORLYTE' THEN 'Gatorlyte'
          WHEN UPPER(MARCA) = 'POWERADE' THEN 'Powerade'
          WHEN UPPER(MARCA) = 'ISOMAX' THEN 'Isomax'
          WHEN UPPER(MARCA) = 'SUEROX' THEN 'Suerox'
          WHEN UPPER(MARCA) = 'SPORADE' THEN 'Sporade'
          WHEN UPPER(MARCA) = 'REVIVE' THEN 'Revive'
          ELSE UPPER(MARCA)
        END as marca_norm,
        SUM(Vtas_Unds) as unds,
        SUM(Vtas_Valor) as valor,
        SUM(N_de_Tiendas_Venden_C) as tv,
        SUM(N_de_Tiendas_C) as tt
      FROM \`psa-eltr-latam-pr.Nielsen.v_Nielsen_LATAM_Consolidado\`
      WHERE Pais = 'GUATEMALA'
        AND Apertura_Productos = 'MARCA'
        AND Apertura_Canal_Region = 'CANAL'
        AND EXTRACT(YEAR FROM Periods) IN (${targetYear}, ${prevYear})
      GROUP BY anio, mes, marca_norm
      ORDER BY marca_norm, mes
    `;

    const rawRows = await runBqQuery(bqSql);

    const brandsList = ['Hidravida', 'Hidralife', 'Gatorade', 'Gatorlyte', 'Powerade', 'Isomax', 'Suerox', 'Sporade', 'Revive'];
    const monthNamesShort = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

    // Determinar meses a procesar
    let monthsToProcess = [];
    if (mes === 'Todas') {
      for (let m = 1; m <= maxMonthForYear; m++) monthsToProcess.push(m);
    } else {
      monthsToProcess.push(parseInt(mes, 10));
    }

    // 1. Matriz YTD por Marcas
    const marcasYtdUnd = {};
    const marcasYtdUsd = {};

    brandsList.forEach(b => {
      let sum_dist_und = 0, sum_rot_und = 0, sum_total_und = 0;
      let sum_precio_usd = 0, sum_dist_usd = 0, sum_rot_usd = 0, sum_total_usd = 0;
      let sum_unds_ly = 0, sum_valor_ly = 0;

      monthsToProcess.forEach(m => {
        const rowTY = rawRows.find(r => r.marca_norm.toUpperCase() === b.toUpperCase() && parseInt(r.anio, 10) === targetYear && parseInt(r.mes, 10) === m);
        const rowLY = rawRows.find(r => r.marca_norm.toUpperCase() === b.toUpperCase() && parseInt(r.anio, 10) === prevYear && parseInt(r.mes, 10) === m);

        const u_ty = rowTY ? parseFloat(rowTY.unds) || 0 : 0;
        const u_ly = rowLY ? parseFloat(rowLY.unds) || 0 : 0;
        const v_ty = rowTY ? parseFloat(rowTY.valor) || 0 : 0;
        const v_ly = rowLY ? parseFloat(rowLY.valor) || 0 : 0;
        const tv_ty = rowTY ? parseFloat(rowTY.tv) || 0 : 0;
        const tv_ly = rowLY ? parseFloat(rowLY.tv) || 0 : 0;

        const p_ty = u_ty > 0 ? v_ty / u_ty : 0;
        const p_ly = u_ly > 0 ? v_ly / u_ly : 0;

        const diff_u = u_ty - u_ly;
        const diff_v = v_ty - v_ly;

        const p_impact = (p_ty - p_ly) * u_ty;
        const dist_impact_u = tv_ly > 0 ? (tv_ty / tv_ly - 1) * u_ly : 0;
        const rot_impact_u = diff_u - dist_impact_u;

        const dist_impact_v = dist_impact_u * p_ly;
        const rot_impact_v = rot_impact_u * p_ly;

        sum_dist_und += dist_impact_u;
        sum_rot_und += rot_impact_u;
        sum_total_und += diff_u;

        sum_precio_usd += p_impact;
        sum_dist_usd += dist_impact_v;
        sum_rot_usd += rot_impact_v;
        sum_total_usd += diff_v;

        sum_unds_ly += u_ly;
        sum_valor_ly += v_ly;
      });

      marcasYtdUnd[b] = {
        dist: { dif: Math.round(sum_dist_und), vsLy: sum_unds_ly > 0 ? (sum_dist_und / sum_unds_ly) * 100 : null },
        rot: { dif: Math.round(sum_rot_und), vsLy: sum_unds_ly > 0 ? (sum_rot_und / sum_unds_ly) * 100 : null },
        total: { dif: Math.round(sum_total_und), vsLy: sum_unds_ly > 0 ? (sum_total_und / sum_unds_ly) * 100 : null }
      };

      marcasYtdUsd[b] = {
        precio: { dif: Math.round(sum_precio_usd), vsLy: sum_valor_ly > 0 ? (sum_precio_usd / sum_valor_ly) * 100 : null },
        dist: { dif: Math.round(sum_dist_usd), vsLy: sum_valor_ly > 0 ? (sum_dist_usd / sum_valor_ly) * 100 : null },
        rot: { dif: Math.round(sum_rot_usd), vsLy: sum_valor_ly > 0 ? (sum_rot_usd / sum_valor_ly) * 100 : null },
        total: { dif: Math.round(sum_total_usd), vsLy: sum_valor_ly > 0 ? (sum_total_usd / sum_valor_ly) * 100 : null }
      };
    });

    // 2. Matriz Mensual & Gráficos para la marca seleccionada
    let selectedNorm = selectedMarca;
    if (selectedMarca === 'HIDRAVIDA' || selectedMarca === 'ELECTROLIT') selectedNorm = 'HIDRAVIDA';
    if (selectedMarca === 'HIDRALIFE' || selectedMarca === 'ELECTROLIFE') selectedNorm = 'HIDRALIFE';

    const monthlyDataUnd = [];
    const monthlyDataUsd = [];

    let totalUndRow = { dist_dif: 0, rot_dif: 0, total_dif: 0, sum_unds_ly: 0 };
    let totalUsdRow = { precio_dif: 0, dist_dif: 0, rot_dif: 0, total_dif: 0, sum_valor_ly: 0 };

    for (let m = 1; m <= maxMonthForYear; m++) {
      const monthLabel = monthNamesShort[m - 1];
      const rowTY = rawRows.find(r => r.marca_norm.toUpperCase() === selectedNorm && parseInt(r.anio, 10) === targetYear && parseInt(r.mes, 10) === m);
      const rowLY = rawRows.find(r => r.marca_norm.toUpperCase() === selectedNorm && parseInt(r.anio, 10) === prevYear && parseInt(r.mes, 10) === m);

      const u_ty = rowTY ? parseFloat(rowTY.unds) || 0 : 0;
      const u_ly = rowLY ? parseFloat(rowLY.unds) || 0 : 0;
      const v_ty = rowTY ? parseFloat(rowTY.valor) || 0 : 0;
      const v_ly = rowLY ? parseFloat(rowLY.valor) || 0 : 0;
      const tv_ty = rowTY ? parseFloat(rowTY.tv) || 0 : 0;
      const tv_ly = rowLY ? parseFloat(rowLY.tv) || 0 : 0;

      const p_ty = u_ty > 0 ? v_ty / u_ty : 0;
      const p_ly = u_ly > 0 ? v_ly / u_ly : 0;

      const diff_u = u_ty - u_ly;
      const diff_v = v_ty - v_ly;

      const p_impact = (p_ty - p_ly) * u_ty;
      const dist_impact_u = tv_ly > 0 ? (tv_ty / tv_ly - 1) * u_ly : 0;
      const rot_impact_u = diff_u - dist_impact_u;

      const dist_impact_v = dist_impact_u * p_ly;
      const rot_impact_v = rot_impact_u * p_ly;

      monthlyDataUnd.push({
        mes: m,
        label: monthLabel,
        chartLabel: `${monthLabel} ${String(targetYear).slice(2)}`,
        dist_dif: Math.round(dist_impact_u),
        dist_vsLy: u_ly > 0 ? (dist_impact_u / u_ly) * 100 : 0,
        rot_dif: Math.round(rot_impact_u),
        rot_vsLy: u_ly > 0 ? (rot_impact_u / u_ly) * 100 : 0,
        total_dif: Math.round(diff_u),
        total_vsLy: u_ly > 0 ? (diff_u / u_ly) * 100 : 0
      });

      monthlyDataUsd.push({
        mes: m,
        label: monthLabel,
        chartLabel: `${monthLabel} ${String(targetYear).slice(2)}`,
        precio_dif: Math.round(p_impact),
        precio_vsLy: v_ly > 0 ? (p_impact / v_ly) * 100 : 0,
        dist_dif: Math.round(dist_impact_v),
        dist_vsLy: v_ly > 0 ? (dist_impact_v / v_ly) * 100 : 0,
        rot_dif: Math.round(rot_impact_v),
        rot_vsLy: v_ly > 0 ? (rot_impact_v / v_ly) * 100 : 0,
        total_dif: Math.round(diff_v),
        total_vsLy: v_ly > 0 ? (diff_v / v_ly) * 100 : 0
      });

      totalUndRow.dist_dif += dist_impact_u;
      totalUndRow.rot_dif += rot_impact_u;
      totalUndRow.total_dif += diff_u;
      totalUndRow.sum_unds_ly += u_ly;

      totalUsdRow.precio_dif += p_impact;
      totalUsdRow.dist_dif += dist_impact_v;
      totalUsdRow.rot_dif += rot_impact_v;
      totalUsdRow.total_dif += diff_v;
      totalUsdRow.sum_valor_ly += v_ly;
    }

    const summaryTotalUnd = {
      dist_dif: Math.round(totalUndRow.dist_dif),
      dist_vsLy: totalUndRow.sum_unds_ly > 0 ? (totalUndRow.dist_dif / totalUndRow.sum_unds_ly) * 100 : 0,
      rot_dif: Math.round(totalUndRow.rot_dif),
      rot_vsLy: totalUndRow.sum_unds_ly > 0 ? (totalUndRow.rot_dif / totalUndRow.sum_unds_ly) * 100 : 0,
      total_dif: Math.round(totalUndRow.total_dif),
      total_vsLy: totalUndRow.sum_unds_ly > 0 ? (totalUndRow.total_dif / totalUndRow.sum_unds_ly) * 100 : 0
    };

    const summaryTotalUsd = {
      precio_dif: Math.round(totalUsdRow.precio_dif),
      precio_vsLy: totalUsdRow.sum_valor_ly > 0 ? (totalUsdRow.precio_dif / totalUsdRow.sum_valor_ly) * 100 : 0,
      dist_dif: Math.round(totalUsdRow.dist_dif),
      dist_vsLy: totalUsdRow.sum_valor_ly > 0 ? (totalUsdRow.dist_dif / totalUsdRow.sum_valor_ly) * 100 : 0,
      rot_dif: Math.round(totalUsdRow.rot_dif),
      rot_vsLy: totalUsdRow.sum_valor_ly > 0 ? (totalUsdRow.rot_dif / totalUsdRow.sum_valor_ly) * 100 : 0,
      total_dif: Math.round(totalUsdRow.total_dif),
      total_vsLy: totalUsdRow.sum_valor_ly > 0 ? (totalUsdRow.total_dif / totalUsdRow.sum_valor_ly) * 100 : 0
    };

    const responsePayload = {
      anio: targetYear,
      mes: mes,
      marca: selectedMarca,
      marcasYtdUnd,
      marcasYtdUsd,
      monthlyDataUnd,
      monthlyDataUsd,
      summaryTotalUnd,
      summaryTotalUsd,
      marcasDisponibles: [
        { id: 'HIDRAVIDA', label: 'HIDRAVIDA' },
        { id: 'HIDRALIFE', label: 'HIDRALIFE' },
        { id: 'GATORADE', label: 'GATORADE' },
        { id: 'GATORLYTE', label: 'GATORLYTE' },
        { id: 'POWERADE', label: 'POWERADE' },
        { id: 'ISOMAX', label: 'ISOMAX' },
        { id: 'SUEROX', label: 'SUEROX' },
        { id: 'SPORADE', label: 'SPORADE' },
        { id: 'REVIVE', label: 'ACTILIFE' }
      ],
      mesesPorAnio: {
        '2026': [
          { id: 'Todas', label: 'Todas' },
          { id: '1', label: 'Enero' },
          { id: '2', label: 'Febrero' },
          { id: '3', label: 'Marzo' },
          { id: '4', label: 'Abril' },
          { id: '5', label: 'Mayo' },
          { id: '6', label: 'Junio' },
          { id: '7', label: 'Julio' },
          { id: '8', label: 'Agosto' }
        ],
        '2025': [
          { id: 'Todas', label: 'Todas' },
          { id: '1', label: 'Enero' },
          { id: '2', label: 'Febrero' },
          { id: '3', label: 'Marzo' },
          { id: '4', label: 'Abril' },
          { id: '5', label: 'Mayo' },
          { id: '6', label: 'Junio' },
          { id: '7', label: 'Julio' },
          { id: '8', label: 'Agosto' },
          { id: '9', label: 'Septiembre' },
          { id: '10', label: 'Octubre' },
          { id: '11', label: 'Noviembre' },
          { id: '12', label: 'Diciembre' }
        ],
        '2024': [
          { id: 'Todas', label: 'Todas' },
          { id: '1', label: 'Enero' },
          { id: '2', label: 'Febrero' },
          { id: '3', label: 'Marzo' },
          { id: '4', label: 'Abril' },
          { id: '5', label: 'Mayo' },
          { id: '6', label: 'Junio' },
          { id: '7', label: 'Julio' },
          { id: '8', label: 'Agosto' },
          { id: '9', label: 'Septiembre' },
          { id: '10', label: 'Octubre' },
          { id: '11', label: 'Noviembre' },
          { id: '12', label: 'Diciembre' }
        ]
      }
    };

    queryCache.set(cacheKey, responsePayload);
    res.json(responsePayload);
  } catch (error) {
    console.error('Error al consultar /api/nielsen/gt/growth-drivers:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint Marca X Canal (Marcas - Canales) Costa Rica
app.get('/api/nielsen/cr/marca-canal', async (req, res) => {
  const anio = req.query.anio || '2026';
  const mes = req.query.mes || 'Todas';

  const cacheKey = `cr_marca_canal_${anio}_${mes}`;
  if (queryCache.has(cacheKey)) {
    return res.json(queryCache.get(cacheKey));
  }

  try {
    const targetYear = parseInt(anio, 10);
    let targetMonth = 12;
    if (targetYear === 2026) targetMonth = 8;
    if (mes !== 'Todas') {
      targetMonth = parseInt(mes, 10);
    }

    const targetEndPeriod = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;

    const bqSql = `
      WITH RawData AS (
        SELECT
          Periods,
          CASE
            WHEN Apertura_Canal_Region = 'TOTAL' THEN 'COSTA RICA'
            WHEN Apertura_Canal_Region = 'CANAL' AND Canal = 'AUTOSERVICIOS' THEN 'MODERNO'
            WHEN Apertura_Canal_Region = 'CANAL' AND Canal = 'TRADICIONAL' THEN 'TRADICIONAL'
            ELSE NULL
          END as canal_norm,
          CASE
            WHEN UPPER(TRIM(MARCA)) = 'ELECTROLIT' THEN 'Electrolit'
            WHEN UPPER(TRIM(MARCA)) = 'ELECTROLIFE' THEN 'Electrolife'
            WHEN UPPER(TRIM(MARCA)) = 'GATORADE' THEN 'Gatorade'
            WHEN UPPER(TRIM(MARCA)) = 'GATORLYTE' THEN 'Gatorlyte'
            WHEN UPPER(TRIM(MARCA)) = 'POWERADE' THEN 'Powerade'
            WHEN UPPER(TRIM(MARCA)) = 'PEDIALYTE' THEN 'Pedialyte'
            WHEN UPPER(TRIM(MARCA)) = 'PRIME' THEN 'Prime'
            WHEN UPPER(TRIM(MARCA)) = 'SUEROX' THEN 'Suerox'
            WHEN UPPER(TRIM(MARCA)) IN ('DI LYTE', 'DILYTE') THEN 'Dilyte'
            WHEN UPPER(TRIM(MARCA)) = 'FASTLYTE' THEN 'Fastlyte'
            ELSE 'Resto Marcas'
          END as marca_norm,
          SUM(Vtas_Unds) as unds,
          SUM(Vtas_Valor) as valor,
          SUM(N_de_Tiendas_Venden_C) as tv,
          SUM(N_de_Tiendas_C) as tt
        FROM \`psa-eltr-latam-pr.Nielsen.v_Nielsen_LATAM_Consolidado\`
        WHERE Pais = 'COSTA RICA'
          AND Apertura_Productos = 'MARCA'
          AND (
            Apertura_Canal_Region = 'TOTAL'
            OR (Apertura_Canal_Region = 'CANAL' AND Canal IN ('AUTOSERVICIOS', 'TRADICIONAL'))
          )
          AND Periods >= DATE_SUB(DATE '${targetEndPeriod}', INTERVAL 11 MONTH)
          AND Periods <= DATE '${targetEndPeriod}'
        GROUP BY Periods, canal_norm, marca_norm
      ),
      CategoryTotals AS (
        SELECT
          Periods,
          canal_norm,
          SUM(unds) as total_cat_unds
        FROM RawData
        GROUP BY Periods, canal_norm
      )
      SELECT
        r.Periods,
        r.canal_norm,
        r.marca_norm,
        r.unds,
        r.valor,
        r.tv,
        r.tt,
        c.total_cat_unds
      FROM RawData r
      JOIN CategoryTotals c ON r.Periods = c.Periods AND r.canal_norm = c.canal_norm
      ORDER BY r.canal_norm, r.marca_norm, r.Periods
    `;

    const rawRows = await runBqQuery(bqSql);

    const brandsDef = [
      { id: 'Electrolit', name: 'Electrolit', color: '#0066c0', textColor: '#ffffff' },
      { id: 'Electrolife', name: 'Electrolife', color: '#38bdf8', textColor: '#0f172a' },
      { id: 'Gatorade', name: 'Gatorade', color: '#ea580c', textColor: '#ffffff' },
      { id: 'Gatorlyte', name: 'Gatorlyte', color: '#fdba74', textColor: '#0f172a' },
      { id: 'Powerade', name: 'Powerade', color: '#6b21a8', textColor: '#ffffff' },
      { id: 'Pedialyte', name: 'Pedialyte', color: '#dc2626', textColor: '#ffffff' },
      { id: 'Prime', name: 'Prime', color: '#db2777', textColor: '#ffffff' },
      { id: 'Suerox', name: 'Suerox', color: '#991b1b', textColor: '#ffffff' },
      { id: 'Dilyte', name: 'Dilyte', color: '#ca8a04', textColor: '#ffffff' },
      { id: 'Fastlyte', name: 'Fastlyte', color: '#c084fc', textColor: '#0f172a' },
      { id: 'Resto Marcas', name: 'Resto Marcas', color: '#64748b', textColor: '#ffffff' }
    ];

    const channels = ['COSTA RICA', 'MODERNO', 'TRADICIONAL'];
    const monthNamesShort = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

    // Determinar los 12 periodos en orden cronológico con días reales por mes
    const uniquePeriodsMap = new Map();
    rawRows.forEach(r => {
      const pStr = typeof r.Periods === 'object' && r.Periods.value ? r.Periods.value : String(r.Periods);
      const dateKey = pStr.substring(0, 10);
      if (!uniquePeriodsMap.has(dateKey)) {
        const parts = dateKey.split('-');
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const daysInMonth = new Date(y, m, 0).getDate();
        const label = `${monthNamesShort[m - 1]}-${String(y).slice(-2)}`;
        uniquePeriodsMap.set(dateKey, { key: dateKey, label, year: y, month: m, daysInMonth });
      }
    });

    const periodsList = Array.from(uniquePeriodsMap.values()).sort((a, b) => a.key.localeCompare(b.key));

    // Estructuras de datos para los 5 KPIs
    const kpis = {
      unidades: {},
      som: {},
      dist: {},
      precio: {},
      rotacion: {}
    };

    channels.forEach(ch => {
      kpis.unidades[ch] = {};
      kpis.som[ch] = {};
      kpis.dist[ch] = {};
      kpis.precio[ch] = {};
      kpis.rotacion[ch] = {};

      brandsDef.forEach(b => {
        kpis.unidades[ch][b.id] = new Array(periodsList.length).fill(null);
        kpis.som[ch][b.id] = new Array(periodsList.length).fill(null);
        kpis.dist[ch][b.id] = new Array(periodsList.length).fill(null);
        kpis.precio[ch][b.id] = new Array(periodsList.length).fill(null);
        kpis.rotacion[ch][b.id] = new Array(periodsList.length).fill(null);
      });
    });

    // Mapear cada fila
    rawRows.forEach(r => {
      const ch = r.canal_norm;
      const brand = r.marca_norm;
      const pStr = typeof r.Periods === 'object' && r.Periods.value ? r.Periods.value : String(r.Periods);
      const dateKey = pStr.substring(0, 10);
      const periodIdx = periodsList.findIndex(p => p.key === dateKey);

      if (periodIdx !== -1 && kpis.unidades[ch] && kpis.unidades[ch][brand]) {
        const unds = Number(r.unds || 0);
        const valor = Number(r.valor || 0);
        const tv = Number(r.tv || 0);
        const tt = Number(r.tt || 0);
        const totalCatUnds = Number(r.total_cat_unds || 0);
        const daysInMonth = periodsList[periodIdx].daysInMonth || 30.5;

        // 1. Unidades (000)
        kpis.unidades[ch][brand][periodIdx] = Math.round(unds / 1000);

        // 2. SOM Unidades (%)
        kpis.som[ch][brand][periodIdx] = totalCatUnds > 0 ? parseFloat(((unds / totalCatUnds) * 100).toFixed(1)) : 0;

        // 3. Dist. Numérica (%)
        kpis.dist[ch][brand][periodIdx] = tt > 0 ? parseFloat(((tv / tt) * 100).toFixed(1)) : 0;

        // 4. Precio (USD)
        kpis.precio[ch][brand][periodIdx] = (unds > 0 && valor > 0) ? parseFloat((valor / unds).toFixed(2)) : null;

        // 5. Rotación (Unid/Tienda/Día) - Usando días reales del mes
        kpis.rotacion[ch][brand][periodIdx] = tv > 0 ? parseFloat(((unds / tv) / daysInMonth).toFixed(1)) : 0;
      }
    });

    const responsePayload = {
      periods: periodsList,
      channels,
      brands: brandsDef,
      data: kpis,
      mesesPorAnio: {
        '2026': [
          { id: 'Todas', label: 'Todas' },
          { id: '1', label: 'Enero' },
          { id: '2', label: 'Febrero' },
          { id: '3', label: 'Marzo' },
          { id: '4', label: 'Abril' },
          { id: '5', label: 'Mayo' },
          { id: '6', label: 'Junio' },
          { id: '7', label: 'Julio' },
          { id: '8', label: 'Agosto' }
        ],
        '2025': [
          { id: 'Todas', label: 'Todas' },
          { id: '1', label: 'Enero' },
          { id: '2', label: 'Febrero' },
          { id: '3', label: 'Marzo' },
          { id: '4', label: 'Abril' },
          { id: '5', label: 'Mayo' },
          { id: '6', label: 'Junio' },
          { id: '7', label: 'Julio' },
          { id: '8', label: 'Agosto' },
          { id: '9', label: 'Septiembre' },
          { id: '10', label: 'Octubre' },
          { id: '11', label: 'Noviembre' },
          { id: '12', label: 'Diciembre' }
        ],
        '2024': [
          { id: 'Todas', label: 'Todas' },
          { id: '1', label: 'Enero' },
          { id: '2', label: 'Febrero' },
          { id: '3', label: 'Marzo' },
          { id: '4', label: 'Abril' },
          { id: '5', label: 'Mayo' },
          { id: '6', label: 'Junio' },
          { id: '7', label: 'Julio' },
          { id: '8', label: 'Agosto' },
          { id: '9', label: 'Septiembre' },
          { id: '10', label: 'Octubre' },
          { id: '11', label: 'Noviembre' },
          { id: '12', label: 'Diciembre' }
        ]
      }
    };

    queryCache.set(cacheKey, responsePayload);
    res.json(responsePayload);
  } catch (error) {
    console.error('Error al consultar /api/nielsen/cr/marca-canal:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint Marca X Canal (Marcas - Canales) Guatemala
app.get('/api/nielsen/gt/marca-canal', async (req, res) => {
  const anio = req.query.anio || '2026';
  const mes = req.query.mes || 'Todas';

  const cacheKey = `gt_marca_canal_${anio}_${mes}`;
  if (queryCache.has(cacheKey)) {
    return res.json(queryCache.get(cacheKey));
  }

  try {
    const targetYear = parseInt(anio, 10);
    let targetMonth = 12;
    if (targetYear === 2026) targetMonth = 8;
    if (mes !== 'Todas') {
      targetMonth = parseInt(mes, 10);
    }

    const targetEndPeriod = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;

    const bqSql = `
      WITH RawData AS (
        SELECT
          Periods,
          CASE
            WHEN Apertura_Canal_Region = 'TOTAL' THEN 'GUATEMALA'
            WHEN Apertura_Canal_Region = 'CANAL' AND Canal = 'AUTOSERVICIOS' THEN 'MODERNO'
            WHEN Apertura_Canal_Region = 'CANAL' AND Canal = 'TRADICIONAL' THEN 'TRADICIONAL'
            ELSE NULL
          END as canal_norm,
          CASE
            WHEN UPPER(TRIM(MARCA)) IN ('HIDRAVIDA', 'ELECTROLIT') THEN 'Hidravida'
            WHEN UPPER(TRIM(MARCA)) IN ('HIDRALIFE', 'ELECTROLIFE') THEN 'Hidralife'
            WHEN UPPER(TRIM(MARCA)) = 'GATORADE' THEN 'Gatorade'
            WHEN UPPER(TRIM(MARCA)) IN ('GATORLYTE', 'GATORLIT') THEN 'Gatorlyte'
            WHEN UPPER(TRIM(MARCA)) = 'POWERADE' THEN 'Powerade'
            WHEN UPPER(TRIM(MARCA)) = 'PEDIALYTE' THEN 'Pedialyte'
            WHEN UPPER(TRIM(MARCA)) = 'ISOMAX' THEN 'Isomax'
            WHEN UPPER(TRIM(MARCA)) = 'SUEROX' THEN 'Suerox'
            WHEN UPPER(TRIM(MARCA)) = 'SPORADE' THEN 'Sporade'
            WHEN UPPER(TRIM(MARCA)) = 'REVIVE' THEN 'Revive'
            WHEN UPPER(TRIM(MARCA)) = 'GLUCOSORAL' THEN 'Glucosoral'
            ELSE 'Resto Marcas'
          END as marca_norm,
          SUM(Vtas_Unds) as unds,
          SUM(Vtas_Valor) as valor,
          -- Criterio de usuario: solo tiendas donde este Hidravida / Hidralife sin sumar Electrolit ni Electrolife
          SUM(CASE 
            WHEN UPPER(TRIM(MARCA)) IN ('ELECTROLIT', 'ELECTROLIFE') THEN 0 
            ELSE N_de_Tiendas_Venden_C 
          END) as tv,
          SUM(CASE 
            WHEN UPPER(TRIM(MARCA)) IN ('ELECTROLIT', 'ELECTROLIFE') THEN 0 
            ELSE Vtas_Unds 
          END) as unds_rotacion,
          MAX(N_de_Tiendas_C) as tt
        FROM \`psa-eltr-latam-pr.Nielsen.v_Nielsen_LATAM_Consolidado\`
        WHERE Pais = 'GUATEMALA'
          AND Apertura_Productos = 'MARCA'
          AND (
            Apertura_Canal_Region = 'TOTAL'
            OR (Apertura_Canal_Region = 'CANAL' AND Canal IN ('AUTOSERVICIOS', 'TRADICIONAL'))
          )
          AND Periods >= DATE_SUB(DATE '${targetEndPeriod}', INTERVAL 11 MONTH)
          AND Periods <= DATE '${targetEndPeriod}'
        GROUP BY Periods, canal_norm, marca_norm
      ),
      CategoryTotals AS (
        SELECT
          Periods,
          canal_norm,
          SUM(unds) as total_cat_unds
        FROM RawData
        GROUP BY Periods, canal_norm
      )
      SELECT
        r.Periods,
        r.canal_norm,
        r.marca_norm,
        r.unds,
        r.valor,
        r.tv,
        r.tt,
        r.unds_rotacion,
        c.total_cat_unds
      FROM RawData r
      JOIN CategoryTotals c ON r.Periods = c.Periods AND r.canal_norm = c.canal_norm
      ORDER BY r.canal_norm, r.marca_norm, r.Periods
    `;

    const rawRows = await runBqQuery(bqSql);

    const brandsDef = [
      { id: 'Hidravida', name: 'Hidravida', color: '#0066c0', textColor: '#ffffff' },
      { id: 'Hidralife', name: 'Hidralife', color: '#38bdf8', textColor: '#0f172a' },
      { id: 'Gatorade', name: 'Gatorade', color: '#ea580c', textColor: '#ffffff' },
      { id: 'Gatorlyte', name: 'Gatorlyte', color: '#fdba74', textColor: '#0f172a' },
      { id: 'Powerade', name: 'Powerade', color: '#6b21a8', textColor: '#ffffff' },
      { id: 'Pedialyte', name: 'Pedialyte', color: '#dc2626', textColor: '#ffffff' },
      { id: 'Isomax', name: 'Isomax', color: '#db2777', textColor: '#ffffff' },
      { id: 'Suerox', name: 'Suerox', color: '#991b1b', textColor: '#ffffff' },
      { id: 'Sporade', name: 'Sporade', color: '#ca8a04', textColor: '#ffffff' },
      { id: 'Revive', name: 'Revive', color: '#c084fc', textColor: '#ffffff' },
      { id: 'Glucosoral', name: 'Glucosoral', color: '#10b981', textColor: '#ffffff' },
      { id: 'Resto Marcas', name: 'Resto Marcas', color: '#64748b', textColor: '#ffffff' }
    ];

    const channels = ['GUATEMALA', 'MODERNO', 'TRADICIONAL'];
    const monthNamesShort = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

    // Determinar los 12 periodos en orden cronológico con días reales por mes
    const uniquePeriodsMap = new Map();
    rawRows.forEach(r => {
      const pStr = typeof r.Periods === 'object' && r.Periods.value ? r.Periods.value : String(r.Periods);
      const dateKey = pStr.substring(0, 10);
      if (!uniquePeriodsMap.has(dateKey)) {
        const parts = dateKey.split('-');
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const daysInMonth = new Date(y, m, 0).getDate();
        const label = `${monthNamesShort[m - 1]}-${String(y).slice(-2)}`;
        uniquePeriodsMap.set(dateKey, { key: dateKey, label, year: y, month: m, daysInMonth });
      }
    });

    const periodsList = Array.from(uniquePeriodsMap.values()).sort((a, b) => a.key.localeCompare(b.key));

    // Estructuras de datos para los 5 KPIs
    const kpis = {
      unidades: {},
      som: {},
      dist: {},
      precio: {},
      rotacion: {}
    };

    channels.forEach(ch => {
      kpis.unidades[ch] = {};
      kpis.som[ch] = {};
      kpis.dist[ch] = {};
      kpis.precio[ch] = {};
      kpis.rotacion[ch] = {};

      brandsDef.forEach(b => {
        kpis.unidades[ch][b.id] = new Array(periodsList.length).fill(null);
        kpis.som[ch][b.id] = new Array(periodsList.length).fill(null);
        kpis.dist[ch][b.id] = new Array(periodsList.length).fill(null);
        kpis.precio[ch][b.id] = new Array(periodsList.length).fill(null);
        kpis.rotacion[ch][b.id] = new Array(periodsList.length).fill(null);
      });
    });

    rawRows.forEach(r => {
      const ch = r.canal_norm;
      const brand = r.marca_norm;
      const pStr = typeof r.Periods === 'object' && r.Periods.value ? r.Periods.value : String(r.Periods);
      const dateKey = pStr.substring(0, 10);
      const periodIdx = periodsList.findIndex(p => p.key === dateKey);

      if (periodIdx !== -1 && kpis.unidades[ch] && kpis.unidades[ch][brand]) {
        const unds = Number(r.unds || 0);
        const undsRotacion = Number(r.unds_rotacion || r.unds || 0);
        const valor = Number(r.valor || 0);
        const tv = Number(r.tv || 0);
        const tt = Number(r.tt || 0);
        const totalCatUnds = Number(r.total_cat_unds || 0);
        const daysInMonth = periodsList[periodIdx].daysInMonth || 30.5;

        // 1. Unidades (000)
        kpis.unidades[ch][brand][periodIdx] = Math.round(unds / 1000);

        // 2. SOM Unidades (%)
        kpis.som[ch][brand][periodIdx] = totalCatUnds > 0 ? parseFloat(((unds / totalCatUnds) * 100).toFixed(1)) : 0;

        // 3. Dist. Numérica (%)
        kpis.dist[ch][brand][periodIdx] = tt > 0 ? parseFloat(((tv / tt) * 100).toFixed(1)) : 0;

        // 4. Precio (USD)
        kpis.precio[ch][brand][periodIdx] = (unds > 0 && valor > 0) ? parseFloat((valor / unds).toFixed(2)) : null;

        // 5. Rotación (Unid/Tienda/Día) - Usando días reales del mes
        kpis.rotacion[ch][brand][periodIdx] = tv > 0 ? parseFloat(((undsRotacion / tv) / daysInMonth).toFixed(1)) : 0;
      }
    });

    const responsePayload = {
      periods: periodsList,
      channels,
      brands: brandsDef,
      data: kpis,
      mesesPorAnio: {
        '2026': [
          { id: 'Todas', label: 'Todas' },
          { id: '1', label: 'Enero' },
          { id: '2', label: 'Febrero' },
          { id: '3', label: 'Marzo' },
          { id: '4', label: 'Abril' },
          { id: '5', label: 'Mayo' },
          { id: '6', label: 'Junio' },
          { id: '7', label: 'Julio' },
          { id: '8', label: 'Agosto' }
        ],
        '2025': [
          { id: 'Todas', label: 'Todas' },
          { id: '1', label: 'Enero' },
          { id: '2', label: 'Febrero' },
          { id: '3', label: 'Marzo' },
          { id: '4', label: 'Abril' },
          { id: '5', label: 'Mayo' },
          { id: '6', label: 'Junio' },
          { id: '7', label: 'Julio' },
          { id: '8', label: 'Agosto' },
          { id: '9', label: 'Septiembre' },
          { id: '10', label: 'Octubre' },
          { id: '11', label: 'Noviembre' },
          { id: '12', label: 'Diciembre' }
        ],
        '2024': [
          { id: 'Todas', label: 'Todas' },
          { id: '1', label: 'Enero' },
          { id: '2', label: 'Febrero' },
          { id: '3', label: 'Marzo' },
          { id: '4', label: 'Abril' },
          { id: '5', label: 'Mayo' },
          { id: '6', label: 'Junio' },
          { id: '7', label: 'Julio' },
          { id: '8', label: 'Agosto' },
          { id: '9', label: 'Septiembre' },
          { id: '10', label: 'Octubre' },
          { id: '11', label: 'Noviembre' },
          { id: '12', label: 'Diciembre' }
        ]
      }
    };

    queryCache.set(cacheKey, responsePayload);
    res.json(responsePayload);
  } catch (error) {
    console.error('Error al consultar /api/nielsen/gt/marca-canal:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint Marca Costa Rica (Totales País + Regiones)
app.get('/api/nielsen/cr/costa-rica', async (req, res) => {
  const anio = req.query.anio || '2026';
  const mes = req.query.mes || 'Todas';

  const cacheKey = `cr_costa_rica_${anio}_${mes}`;
  if (queryCache.has(cacheKey)) {
    return res.json(queryCache.get(cacheKey));
  }

  try {
    const targetYear = parseInt(anio, 10);
    let targetMonth = 12;
    if (targetYear === 2026) targetMonth = 8;
    if (mes !== 'Todas') {
      targetMonth = parseInt(mes, 10);
    }

    const targetEndPeriod = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;

    const bqSql = `
      WITH RawData AS (
        SELECT
          Periods,
          CASE
            WHEN Apertura_Canal_Region = 'TOTAL' THEN 'TOTAL'
            WHEN Apertura_Canal_Region = 'TOTAL/REGION' THEN UPPER(TRIM(Region))
            ELSE NULL
          END as scope_norm,
          CASE
            WHEN UPPER(TRIM(MARCA)) = 'ELECTROLIT' THEN 'Electrolit'
            WHEN UPPER(TRIM(MARCA)) = 'ELECTROLIFE' THEN 'Electrolife'
            WHEN UPPER(TRIM(MARCA)) = 'GATORADE' THEN 'Gatorade'
            WHEN UPPER(TRIM(MARCA)) = 'GATORLYTE' THEN 'Gatorlyte'
            WHEN UPPER(TRIM(MARCA)) = 'POWERADE' THEN 'Powerade'
            WHEN UPPER(TRIM(MARCA)) = 'PEDIALYTE' THEN 'Pedialyte'
            WHEN UPPER(TRIM(MARCA)) = 'PRIME' THEN 'Prime'
            WHEN UPPER(TRIM(MARCA)) = 'SUEROX' THEN 'Suerox'
            WHEN UPPER(TRIM(MARCA)) IN ('DI LYTE', 'DILYTE') THEN 'Dilyte'
            WHEN UPPER(TRIM(MARCA)) = 'FASTLYTE' THEN 'Fastlyte'
            ELSE 'Resto Marcas'
          END as marca_norm,
          SUM(Vtas_Unds) as unds,
          SUM(Vtas_Valor) as valor,
          SUM(N_de_Tiendas_Venden_C) as tv,
          SUM(N_de_Tiendas_C) as tt
        FROM \`psa-eltr-latam-pr.Nielsen.v_Nielsen_LATAM_Consolidado\`
        WHERE Pais = 'COSTA RICA'
          AND Apertura_Productos = 'MARCA'
          AND (
            Apertura_Canal_Region = 'TOTAL'
            OR (Apertura_Canal_Region = 'TOTAL/REGION' AND Region IN ('ATLANTICO', 'CENTRAL', 'METRO', 'NORTE', 'SUR'))
          )
          AND Periods >= DATE_SUB(DATE '${targetEndPeriod}', INTERVAL 11 MONTH)
          AND Periods <= DATE '${targetEndPeriod}'
        GROUP BY Periods, scope_norm, marca_norm
      ),
      CategoryTotals AS (
        SELECT
          Periods,
          scope_norm,
          SUM(unds) as total_cat_unds,
          SUM(valor) as total_cat_valor,
          SUM(tv) as total_cat_tv,
          SUM(tt) as total_cat_tt
        FROM RawData
        GROUP BY Periods, scope_norm
      )
      SELECT
        r.Periods,
        r.scope_norm,
        r.marca_norm,
        r.unds,
        r.valor,
        r.tv,
        r.tt,
        c.total_cat_unds,
        c.total_cat_valor,
        c.total_cat_tv,
        c.total_cat_tt
      FROM RawData r
      JOIN CategoryTotals c ON r.Periods = c.Periods AND r.scope_norm = c.scope_norm
      ORDER BY r.scope_norm, r.marca_norm, r.Periods
    `;

    const rawRows = await runBqQuery(bqSql);

    const brandsDef = [
      { id: 'Electrolit', name: 'ELECTROLIT', color: '#0066c0', stroke: '#0066c0', bg: '#e0f2fe', text: '#0369a1', strokeWidth: 2.8 },
      { id: 'Electrolife', name: 'ELECTROLIFE', color: '#38bdf8', stroke: '#0284c7', bg: '#f0f9ff', text: '#0284c7', strokeWidth: 2.2 },
      { id: 'Gatorade', name: 'GATORADE', color: '#ea580c', stroke: '#ea580c', bg: '#ffedd5', text: '#c2410c', strokeWidth: 2.8 },
      { id: 'Gatorlyte', name: 'GATORLYTE', color: '#fdba74', stroke: '#f97316', bg: '#fff7ed', text: '#ea580c', strokeWidth: 2.2 },
      { id: 'Powerade', name: 'POWERADE', color: '#6b21a8', stroke: '#6b21a8', bg: '#f3e8ff', text: '#7e22ce', strokeWidth: 2.8 },
      { id: 'Pedialyte', name: 'PEDIALYTE', color: '#dc2626', stroke: '#dc2626', bg: '#fee2e2', text: '#b91c1c', strokeWidth: 2.2 },
      { id: 'Prime', name: 'PRIME', color: '#db2777', stroke: '#db2777', bg: '#fce7f3', text: '#be185d', strokeWidth: 2.2 },
      { id: 'Suerox', name: 'SUEROX', color: '#991b1b', stroke: '#991b1b', bg: '#ffe4e6', text: '#881337', strokeWidth: 2.2 },
      { id: 'Dilyte', name: 'DILYTE', color: '#ca8a04', stroke: '#ca8a04', bg: '#fef9c3', text: '#854d0e', strokeWidth: 2.2 },
      { id: 'Fastlyte', name: 'FASTLYTE', color: '#c084fc', stroke: '#a855f7', bg: '#faf5ff', text: '#9333ea', strokeWidth: 2.2 },
      { id: 'Resto Marcas', name: 'RESTO MARCAS', color: '#64748b', stroke: '#64748b', bg: '#f1f5f9', text: '#334155', strokeWidth: 2.0 }
    ];

    const scopes = ['TOTAL', 'ATLANTICO', 'CENTRAL', 'METRO', 'NORTE', 'SUR'];
    const monthNamesShort = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

    const uniquePeriodsMap = new Map();
    rawRows.forEach(r => {
      const pStr = typeof r.Periods === 'object' && r.Periods.value ? r.Periods.value : String(r.Periods);
      const dateKey = pStr.substring(0, 10);
      if (!uniquePeriodsMap.has(dateKey)) {
        const parts = dateKey.split('-');
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const daysInMonth = new Date(y, m, 0).getDate();
        const label = `${monthNamesShort[m - 1]}-${String(y).slice(-2)}`;
        uniquePeriodsMap.set(dateKey, { key: dateKey, label, year: y, month: m, daysInMonth });
      }
    });

    const periodsList = Array.from(uniquePeriodsMap.values()).sort((a, b) => a.key.localeCompare(b.key));
    const totalDaysIn12M = periodsList.reduce((acc, p) => acc + (p.daysInMonth || 30.5), 0);

    const dataByScope = {};
    const tablesByScope = {};

    scopes.forEach(sc => {
      dataByScope[sc] = {
        unidades: {},
        som: {},
        dist: {},
        precio: {},
        rotacion: {}
      };

      tablesByScope[sc] = {
        unidades: { rows: [], totalRow: { label: 'Total', monthly: new Array(periodsList.length).fill(0), total: 0 } },
        som: { rows: [], totalRow: { label: 'Total', monthly: new Array(periodsList.length).fill(0), total: 0 } },
        dist: { rows: [], totalRow: { label: 'Total', monthly: new Array(periodsList.length).fill(0), total: 0 } },
        precio: { rows: [], totalRow: { label: 'Total', monthly: new Array(periodsList.length).fill(0), total: 0 } },
        rotacion: { rows: [], totalRow: { label: 'Total', monthly: new Array(periodsList.length).fill(0), total: 0 } }
      };

      brandsDef.forEach(b => {
        dataByScope[sc].unidades[b.id] = new Array(periodsList.length).fill(null);
        dataByScope[sc].som[b.id] = new Array(periodsList.length).fill(null);
        dataByScope[sc].dist[b.id] = new Array(periodsList.length).fill(null);
        dataByScope[sc].precio[b.id] = new Array(periodsList.length).fill(null);
        dataByScope[sc].rotacion[b.id] = new Array(periodsList.length).fill(null);
      });
    });

    const brandAccum = {};
    const catAccum = {};

    rawRows.forEach(r => {
      const sc = r.scope_norm;
      const brand = r.marca_norm;
      const pStr = typeof r.Periods === 'object' && r.Periods.value ? r.Periods.value : String(r.Periods);
      const dateKey = pStr.substring(0, 10);
      const periodIdx = periodsList.findIndex(p => p.key === dateKey);

      if (periodIdx !== -1 && dataByScope[sc] && dataByScope[sc].unidades[brand]) {
        const unds = Number(r.unds || 0);
        const valor = Number(r.valor || 0);
        const tv = Number(r.tv || 0);
        const tt = Number(r.tt || 0);
        const totalCatUnds = Number(r.total_cat_unds || 0);
        const totalCatValor = Number(r.total_cat_valor || 0);
        const totalCatTv = Number(r.total_cat_tv || 0);
        const totalCatTt = Number(r.total_cat_tt || 0);
        const daysInMonth = periodsList[periodIdx].daysInMonth || 30.5;

        // 1. Unidades (000)
        dataByScope[sc].unidades[brand][periodIdx] = Math.round(unds / 1000);

        // 2. SOM Unidades (%)
        dataByScope[sc].som[brand][periodIdx] = totalCatUnds > 0 ? parseFloat(((unds / totalCatUnds) * 100).toFixed(1)) : 0;

        // 3. Dist. Numérica (%)
        dataByScope[sc].dist[brand][periodIdx] = tt > 0 ? parseFloat(((tv / tt) * 100).toFixed(1)) : 0;

        // 4. Precio (USD)
        dataByScope[sc].precio[brand][periodIdx] = unds > 0 ? parseFloat((valor / unds).toFixed(2)) : 0;

        // 5. Rotación (Unid/Tienda/Día) - Días reales del mes
        dataByScope[sc].rotacion[brand][periodIdx] = tv > 0 ? parseFloat(((unds / tv) / daysInMonth).toFixed(1)) : 0;

        const key = `${sc}_${brand}`;
        if (!brandAccum[key]) {
          brandAccum[key] = { unds: 0, valor: 0, tv: 0, tt: 0 };
        }
        brandAccum[key].unds += unds;
        brandAccum[key].valor += valor;
        brandAccum[key].tv += tv;
        brandAccum[key].tt += tt;

        const catKey = `${sc}_${periodIdx}`;
        if (!catAccum[catKey]) {
          catAccum[catKey] = {
            unds: totalCatUnds,
            valor: totalCatValor,
            tv: totalCatTv,
            tt: totalCatTt
          };
        }
      }
    });

    // Construir Filas de Tablas
    scopes.forEach(sc => {
      let totalCatUndsSum = 0;
      let totalCatValorSum = 0;
      let totalCatTvSum = 0;
      let totalCatTtSum = 0;

      for (let pIdx = 0; pIdx < periodsList.length; pIdx++) {
        const cat = catAccum[`${sc}_${pIdx}`] || { unds: 0, valor: 0, tv: 0, tt: 0 };
        const daysInMonth = periodsList[pIdx].daysInMonth || 30.5;
        totalCatUndsSum += cat.unds;
        totalCatValorSum += cat.valor;
        totalCatTvSum += cat.tv;
        totalCatTtSum += cat.tt;

        tablesByScope[sc].unidades.totalRow.monthly[pIdx] = Math.round(cat.unds / 1000);
        tablesByScope[sc].som.totalRow.monthly[pIdx] = 100;
        tablesByScope[sc].dist.totalRow.monthly[pIdx] = 0; // Se calculará como el máximo de las marcas para este mes
        tablesByScope[sc].precio.totalRow.monthly[pIdx] = cat.unds > 0 ? parseFloat((cat.valor / cat.unds).toFixed(2)) : 0;
        tablesByScope[sc].rotacion.totalRow.monthly[pIdx] = cat.tv > 0 ? parseFloat(((cat.unds / cat.tv) / daysInMonth).toFixed(1)) : 0;
      }

      tablesByScope[sc].unidades.totalRow.total = Math.round(totalCatUndsSum / 1000);
      tablesByScope[sc].som.totalRow.total = 100;
      tablesByScope[sc].dist.totalRow.total = 0; // Se calculará como el máximo del año
      tablesByScope[sc].precio.totalRow.total = totalCatUndsSum > 0 ? parseFloat((totalCatValorSum / totalCatUndsSum).toFixed(2)) : 0;
      tablesByScope[sc].rotacion.totalRow.total = totalCatTvSum > 0 ? parseFloat(((totalCatUndsSum / totalCatTvSum) / totalDaysIn12M).toFixed(1)) : 0;

      brandsDef.forEach(b => {
        const bAcc = brandAccum[`${sc}_${b.id}`] || { unds: 0, valor: 0, tv: 0, tt: 0 };
        const mUnds = dataByScope[sc].unidades[b.id];
        const mSom = dataByScope[sc].som[b.id];
        const mDist = dataByScope[sc].dist[b.id];
        const mPrecio = dataByScope[sc].precio[b.id];
        const mRot = dataByScope[sc].rotacion[b.id];

        const totUnds = Math.round(bAcc.unds / 1000);
        tablesByScope[sc].unidades.rows.push({
          brand: b.name,
          brandId: b.id,
          monthly: mUnds.map(v => v ?? 0),
          total: totUnds
        });

        const totSom = totalCatUndsSum > 0 ? parseFloat(((bAcc.unds / totalCatUndsSum) * 100).toFixed(1)) : 0;
        tablesByScope[sc].som.rows.push({
          brand: b.name,
          brandId: b.id,
          monthly: mSom.map(v => v ?? 0),
          total: totSom
        });

        const validDistValues = mDist.filter(v => v !== null && v !== undefined);
        const totDist = validDistValues.length > 0 ? Math.round(Math.max(...validDistValues)) : 0;
        tablesByScope[sc].dist.rows.push({
          brand: b.name,
          brandId: b.id,
          monthly: mDist.map(v => v !== null && v !== undefined ? Math.round(v) : 0),
          total: totDist
        });

        const totPrecio = bAcc.unds > 0 ? parseFloat((bAcc.valor / bAcc.unds).toFixed(2)) : 0;
        tablesByScope[sc].precio.rows.push({
          brand: b.name,
          brandId: b.id,
          monthly: mPrecio.map(v => v ?? 0),
          total: totPrecio
        });

        const totRot = bAcc.tv > 0 ? parseFloat(((bAcc.unds / bAcc.tv) / totalDaysIn12M).toFixed(1)) : 0;
        tablesByScope[sc].rotacion.rows.push({
          brand: b.name,
          brandId: b.id,
          monthly: mRot.map(v => v ?? 0),
          total: totRot
        });
      });

      // Cálculo del Total Columna y Total General para Distribución Numérica (Máximo mensual y anual)
      for (let pIdx = 0; pIdx < periodsList.length; pIdx++) {
        const maxDistMonth = Math.max(...tablesByScope[sc].dist.rows.map(r => r.monthly[pIdx] || 0), 0);
        tablesByScope[sc].dist.totalRow.monthly[pIdx] = maxDistMonth;
      }
      tablesByScope[sc].dist.totalRow.total = Math.max(...tablesByScope[sc].dist.totalRow.monthly, 0);

      tablesByScope[sc].unidades.rows.sort((a, b) => b.total - a.total);
      tablesByScope[sc].som.rows.sort((a, b) => b.total - a.total);
      tablesByScope[sc].dist.rows.sort((a, b) => b.total - a.total);
      tablesByScope[sc].precio.rows.sort((a, b) => b.total - a.total);
      tablesByScope[sc].rotacion.rows.sort((a, b) => b.total - a.total);
    });

    const responsePayload = {
      periods: periodsList,
      scopes,
      brands: brandsDef,
      charts: dataByScope,
      tables: tablesByScope,
      regiones: ['ATLANTICO', 'CENTRAL', 'METRO', 'NORTE', 'SUR']
    };

    queryCache.set(cacheKey, responsePayload);
    res.json(responsePayload);
  } catch (error) {
    console.error('Error al consultar /api/nielsen/cr/costa-rica:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// ENDPOINT: MARCA GUATEMALA (TOTALES PAÍS + REGIONES)
// ==========================================
app.get('/api/nielsen/gt/guatemala', async (req, res) => {
  const anio = req.query.anio || '2026';
  const mes = req.query.mes || 'Todas';

  const cacheKey = `gt_guatemala_${anio}_${mes}`;
  if (queryCache.has(cacheKey)) {
    return res.json(queryCache.get(cacheKey));
  }

  try {
    const targetYear = parseInt(anio, 10);
    let targetMonth = 12;
    if (targetYear === 2026) targetMonth = 8;
    if (mes !== 'Todas') {
      targetMonth = parseInt(mes, 10);
    }

    const targetEndPeriod = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;

    const bqSql = `
      WITH RawData AS (
        SELECT
          Periods,
          CASE
            WHEN Apertura_Canal_Region = 'TOTAL' THEN 'TOTAL'
            WHEN Apertura_Canal_Region = 'TOTAL/REGION' THEN UPPER(TRIM(Region))
            ELSE NULL
          END as scope_norm,
          UPPER(TRIM(MARCA)) as marca_orig,
          CASE
            WHEN UPPER(TRIM(MARCA)) IN ('HIDRAVIDA', 'ELECTROLIT') THEN 'Hidravida'
            WHEN UPPER(TRIM(MARCA)) IN ('HIDRALIFE', 'ELECTROLIFE') THEN 'Hidralife'
            WHEN UPPER(TRIM(MARCA)) = 'GATORADE' THEN 'Gatorade'
            WHEN UPPER(TRIM(MARCA)) IN ('GATORLYTE', 'GATORLIT') THEN 'Gatorlyte'
            WHEN UPPER(TRIM(MARCA)) = 'POWERADE' THEN 'Powerade'
            WHEN UPPER(TRIM(MARCA)) = 'PEDIALYTE' THEN 'Pedialyte'
            WHEN UPPER(TRIM(MARCA)) = 'ISOMAX' THEN 'Isomax'
            WHEN UPPER(TRIM(MARCA)) = 'SUEROX' THEN 'Suerox'
            WHEN UPPER(TRIM(MARCA)) = 'SPORADE' THEN 'Sporade'
            WHEN UPPER(TRIM(MARCA)) = 'REVIVE' THEN 'Revive'
            WHEN UPPER(TRIM(MARCA)) = 'GLUCOSORAL' THEN 'Glucosoral'
            ELSE 'Resto Marcas'
          END as marca_norm,
          SUM(Vtas_Unds) as unds,
          SUM(Vtas_Valor) as valor,
          -- Criterio Guatemala: Solo tiendas donde esté Hidravida / Hidralife sin sumar Electrolit ni Electrolife
          SUM(CASE 
            WHEN UPPER(TRIM(MARCA)) IN ('ELECTROLIT', 'ELECTROLIFE') THEN 0 
            ELSE N_de_Tiendas_Venden_C 
          END) as tv,
          SUM(CASE 
            WHEN UPPER(TRIM(MARCA)) IN ('ELECTROLIT', 'ELECTROLIFE') THEN 0 
            ELSE Vtas_Unds 
          END) as unds_rotacion,
          SUM(N_de_Tiendas_Venden_C) as tv_orig,
          MAX(N_de_Tiendas_C) as tt
        FROM \`psa-eltr-latam-pr.Nielsen.v_Nielsen_LATAM_Consolidado\`
        WHERE Pais = 'GUATEMALA'
          AND Apertura_Productos = 'MARCA'
          AND (
            Apertura_Canal_Region = 'TOTAL'
            OR (Apertura_Canal_Region = 'TOTAL/REGION' AND UPPER(TRIM(Region)) IN (
              'METRO', 'NORORIENTE', 'OCCIDENTE', 'OCCIDENTE CHICO', 'ORIENTE CHICO', 'ORIENTE GRANDE', 'SUR', 'VERAPACES'
            ))
          )
          AND Periods >= DATE_SUB(DATE '${targetEndPeriod}', INTERVAL 11 MONTH)
          AND Periods <= DATE '${targetEndPeriod}'
        GROUP BY Periods, scope_norm, marca_orig, marca_norm
      ),
      CategoryTotals AS (
        SELECT
          Periods,
          scope_norm,
          SUM(unds) as total_cat_unds,
          SUM(valor) as total_cat_valor
        FROM RawData
        GROUP BY Periods, scope_norm
      )
      SELECT
        r.Periods,
        r.scope_norm,
        r.marca_orig,
        r.marca_norm,
        r.unds,
        r.valor,
        r.tv,
        r.tv_orig,
        r.tt,
        r.unds_rotacion,
        c.total_cat_unds,
        c.total_cat_valor
      FROM RawData r
      JOIN CategoryTotals c ON r.Periods = c.Periods AND r.scope_norm = c.scope_norm
      WHERE r.scope_norm IS NOT NULL
      ORDER BY r.scope_norm, r.marca_orig, r.Periods
    `;

    const rawRows = await runBqQuery(bqSql);

    // Generar la lista fija de 12 meses finalizando en targetEndPeriod
    const periodsList = [];
    const endD = new Date(targetYear, targetMonth - 1, 1);
    let totalDaysIn12M = 0;
    for (let i = 11; i >= 0; i--) {
      const d = new Date(endD.getFullYear(), endD.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const key = `${y}-${String(m).padStart(2, '0')}-01`;
      const shortYear = String(y).slice(-2);
      const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      const label = `${monthNames[m - 1]}-${shortYear}`;
      const daysInMonth = new Date(y, m, 0).getDate();
      totalDaysIn12M += daysInMonth;
      periodsList.push({ key, label, daysInMonth });
    }

    const scopes = ['TOTAL', 'METRO', 'NORORIENTE', 'OCCIDENTE', 'OCCIDENTE CHICO', 'ORIENTE CHICO', 'ORIENTE GRANDE', 'SUR', 'VERAPACES'];
    const brandsDef = [
      { id: 'Hidravida', name: 'HIDRAVIDA', color: '#0066c0', stroke: '#0066c0', bg: '#e0f2fe', text: '#0369a1', strokeWidth: 2.6 },
      { id: 'Hidralife', name: 'HIDRALIFE', color: '#38bdf8', stroke: '#0284c7', bg: '#e0f7fa', text: '#0284c7', strokeWidth: 2.2 },
      { id: 'Gatorade', name: 'GATORADE', color: '#ea580c', stroke: '#ea580c', bg: '#ffedd5', text: '#c2410c', strokeWidth: 2.4 },
      { id: 'Gatorlyte', name: 'GATORLYTE', color: '#fdba74', stroke: '#f97316', bg: '#fed7aa', text: '#c2410c', strokeWidth: 2 },
      { id: 'Powerade', name: 'POWERADE', color: '#6b21a8', stroke: '#6b21a8', bg: '#ede9fe', text: '#581c87', strokeWidth: 2.6 },
      { id: 'Pedialyte', name: 'PEDIALYTE', color: '#dc2626', stroke: '#dc2626', bg: '#fee2e2', text: '#b91c1c', strokeWidth: 2 },
      { id: 'Isomax', name: 'ISOMAX', color: '#db2777', stroke: '#db2777', bg: '#fce7f3', text: '#be185d', strokeWidth: 2 },
      { id: 'Suerox', name: 'SUEROX', color: '#991b1b', stroke: '#991b1b', bg: '#ffe4e6', text: '#9f1239', strokeWidth: 2 },
      { id: 'Sporade', name: 'SPORADE', color: '#ca8a04', stroke: '#ca8a04', bg: '#fef9c3', text: '#a16207', strokeWidth: 2 },
      { id: 'Revive', name: 'REVIVE', color: '#c084fc', stroke: '#a855f7', bg: '#f3e8ff', text: '#7e22ce', strokeWidth: 2 },
      { id: 'Glucosoral', name: 'GLUCOSORAL', color: '#10b981', stroke: '#059669', bg: '#d1fae5', text: '#047857', strokeWidth: 2 },
      { id: 'Resto Marcas', name: 'RESTO MARCAS', color: '#94a3b8', stroke: '#94a3b8', bg: '#f1f5f9', text: '#475569', strokeWidth: 1.6, isDashed: true }
    ];

    const dataByScope = {};
    const tablesByScope = {};
    const distOrigByScope = {};
    const rotOrigByScope = {};

    scopes.forEach(sc => {
      dataByScope[sc] = {
        unidades: {},
        som: {},
        dist: {},
        precio: {},
        rotacion: {}
      };

      tablesByScope[sc] = {
        unidades: { rows: [], totalRow: { label: 'Total', monthly: new Array(periodsList.length).fill(0), total: 0 } },
        som: { rows: [], totalRow: { label: 'Total', monthly: new Array(periodsList.length).fill(0), total: 0 } },
        dist: { rows: [], totalRow: { label: 'Total', monthly: new Array(periodsList.length).fill(0), total: 0 } },
        precio: { rows: [], totalRow: { label: 'Total', monthly: new Array(periodsList.length).fill(0), total: 0 } },
        rotacion: { rows: [], totalRow: { label: 'Total', monthly: new Array(periodsList.length).fill(0), total: 0 } }
      };

      brandsDef.forEach(b => {
        dataByScope[sc].unidades[b.id] = new Array(periodsList.length).fill(null);
        dataByScope[sc].som[b.id] = new Array(periodsList.length).fill(null);
        dataByScope[sc].dist[b.id] = new Array(periodsList.length).fill(null);
        dataByScope[sc].precio[b.id] = new Array(periodsList.length).fill(null);
        dataByScope[sc].rotacion[b.id] = new Array(periodsList.length).fill(null);
      });
    });

    const brandAccum = {};
    const catAccum = {};
    const brandPeriodAccum = {};

    rawRows.forEach(r => {
      const sc = r.scope_norm;
      const brand = r.marca_norm;
      const brandOrig = r.marca_orig;
      const pStr = typeof r.Periods === 'object' && r.Periods.value ? r.Periods.value : String(r.Periods);
      const dateKey = pStr.substring(0, 10);
      const periodIdx = periodsList.findIndex(p => p.key === dateKey);

      if (periodIdx !== -1 && sc) {
        const unds = Number(r.unds || 0);
        const valor = Number(r.valor || 0);
        const tv = Number(r.tv || 0);
        const tvOrig = Number(r.tv_orig || 0);
        const tt = Number(r.tt || 0);
        const undsRotacion = Number(r.unds_rotacion || 0);
        const totalCatUnds = Number(r.total_cat_unds || 0);
        const totalCatValor = Number(r.total_cat_valor || 0);

        // Registro de Distribución Original de la marca exacta
        if (!distOrigByScope[sc]) distOrigByScope[sc] = {};
        if (!distOrigByScope[sc][brandOrig]) distOrigByScope[sc][brandOrig] = new Array(periodsList.length).fill(0);
        distOrigByScope[sc][brandOrig][periodIdx] = tt > 0 ? Math.round((tvOrig / tt) * 100) : 0;

        // Registro de Rotación Original de la marca exacta
        if (!rotOrigByScope[sc]) rotOrigByScope[sc] = {};
        if (!rotOrigByScope[sc][brandOrig]) {
          rotOrigByScope[sc][brandOrig] = {
            unds: new Array(periodsList.length).fill(0),
            tv: new Array(periodsList.length).fill(0)
          };
        }
        rotOrigByScope[sc][brandOrig].unds[periodIdx] += unds;
        rotOrigByScope[sc][brandOrig].tv[periodIdx] += tvOrig;

        // Acumulación por marca_norm por periodo
        const bpKey = `${sc}_${brand}_${periodIdx}`;
        if (!brandPeriodAccum[bpKey]) {
          brandPeriodAccum[bpKey] = { unds: 0, valor: 0, tv: 0, tt: 0, unds_rot: 0 };
        }
        brandPeriodAccum[bpKey].unds += unds;
        brandPeriodAccum[bpKey].valor += valor;
        brandPeriodAccum[bpKey].tv += tv;
        brandPeriodAccum[bpKey].tt = tt;
        brandPeriodAccum[bpKey].unds_rot += undsRotacion;

        const key = `${sc}_${brand}`;
        if (!brandAccum[key]) {
          brandAccum[key] = { unds: 0, valor: 0, tv: 0, tt: 0, unds_rot: 0 };
        }
        brandAccum[key].unds += unds;
        brandAccum[key].valor += valor;
        brandAccum[key].tv += tv;
        brandAccum[key].tt += tt;
        brandAccum[key].unds_rot += undsRotacion;

        const catKey = `${sc}_${periodIdx}`;
        if (!catAccum[catKey]) {
          catAccum[catKey] = {
            unds: totalCatUnds,
            valor: totalCatValor,
            tv: 0,
            tt: 0
          };
        }
        catAccum[catKey].tv += tvOrig;
        if (tt > catAccum[catKey].tt) {
          catAccum[catKey].tt = tt;
        }
      }
    });

    // Llenar dataByScope para gráficas
    scopes.forEach(sc => {
      periodsList.forEach((p, pIdx) => {
        const daysInMonth = p.daysInMonth;
        const cat = catAccum[`${sc}_${pIdx}`] || { unds: 0, valor: 0, tv: 0, tt: 0 };
        brandsDef.forEach(b => {
          const bp = brandPeriodAccum[`${sc}_${b.id}_${pIdx}`] || { unds: 0, valor: 0, tv: 0, tt: 0, unds_rot: 0 };
          dataByScope[sc].unidades[b.id][pIdx] = Math.round(bp.unds / 1000);
          dataByScope[sc].som[b.id][pIdx] = cat.unds > 0 ? parseFloat(((bp.unds / cat.unds) * 100).toFixed(1)) : 0;
          dataByScope[sc].dist[b.id][pIdx] = bp.tt > 0 ? parseFloat(((bp.tv / bp.tt) * 100).toFixed(1)) : 0;
          dataByScope[sc].precio[b.id][pIdx] = (bp.unds > 0 && bp.valor > 0) ? parseFloat((bp.valor / bp.unds).toFixed(2)) : null;
          dataByScope[sc].rotacion[b.id][pIdx] = bp.tv > 0 ? parseFloat(((bp.unds_rot / bp.tv) / daysInMonth).toFixed(1)) : 0;
        });
      });

      // Construir Filas de Tablas
      let totalCatUndsSum = 0;
      let totalCatValorSum = 0;
      let totalCatTvDaysSum = 0;

      for (let pIdx = 0; pIdx < periodsList.length; pIdx++) {
        const cat = catAccum[`${sc}_${pIdx}`] || { unds: 0, valor: 0, tv: 0, tt: 0 };
        const daysInMonth = periodsList[pIdx].daysInMonth || 30.5;
        totalCatUndsSum += cat.unds;
        totalCatValorSum += cat.valor;
        totalCatTvDaysSum += (cat.tv * daysInMonth);

        tablesByScope[sc].unidades.totalRow.monthly[pIdx] = Math.round(cat.unds / 1000);
        tablesByScope[sc].som.totalRow.monthly[pIdx] = 100;
        tablesByScope[sc].dist.totalRow.monthly[pIdx] = 0; // Se calcula luego como el máximo entre marcas originales
        tablesByScope[sc].precio.totalRow.monthly[pIdx] = cat.unds > 0 ? parseFloat((cat.valor / cat.unds).toFixed(2)) : 0;
        tablesByScope[sc].rotacion.totalRow.monthly[pIdx] = cat.tv > 0 ? parseFloat(((cat.unds / cat.tv) / daysInMonth).toFixed(1)) : 0;
      }

      tablesByScope[sc].unidades.totalRow.total = Math.round(totalCatUndsSum / 1000);
      tablesByScope[sc].som.totalRow.total = 100;
      tablesByScope[sc].dist.totalRow.total = 0;
      tablesByScope[sc].precio.totalRow.total = totalCatUndsSum > 0 ? parseFloat((totalCatValorSum / totalCatUndsSum).toFixed(2)) : 0;
      tablesByScope[sc].rotacion.totalRow.total = totalCatTvDaysSum > 0 ? parseFloat((totalCatUndsSum / totalCatTvDaysSum).toFixed(1)) : 0;

      // Tablas Unidades, SOM, Precio
      brandsDef.forEach(b => {
        const bAcc = brandAccum[`${sc}_${b.id}`] || { unds: 0, valor: 0, tv: 0, tt: 0, unds_rot: 0 };
        const mUnds = dataByScope[sc].unidades[b.id];
        const mSom = dataByScope[sc].som[b.id];
        const mPrecio = dataByScope[sc].precio[b.id];

        const totUnds = Math.round(bAcc.unds / 1000);
        tablesByScope[sc].unidades.rows.push({
          brand: b.name,
          brandId: b.id,
          monthly: mUnds.map(v => v ?? 0),
          total: totUnds
        });

        const totSom = totalCatUndsSum > 0 ? parseFloat(((bAcc.unds / totalCatUndsSum) * 100).toFixed(1)) : 0;
        tablesByScope[sc].som.rows.push({
          brand: b.name,
          brandId: b.id,
          monthly: mSom.map(v => v ?? 0),
          total: totSom
        });

        const totPrecio = bAcc.unds > 0 ? parseFloat((bAcc.valor / bAcc.unds).toFixed(2)) : 0;
        tablesByScope[sc].precio.rows.push({
          brand: b.name,
          brandId: b.id,
          monthly: mPrecio.map(v => v ?? 0),
          total: totPrecio
        });
      });

      // Tablas Distribución Numérica: Basada en MARCAS ORIGINALES de Nielsen
      const origBrands = distOrigByScope[sc] || {};
      Object.entries(origBrands).forEach(([origName, monthlyVals]) => {
        const maxVal = Math.max(...monthlyVals, 0);
        if (maxVal > 0) {
          tablesByScope[sc].dist.rows.push({
            brand: origName,
            brandId: origName,
            monthly: monthlyVals,
            total: maxVal
          });
        }
      });

      // Tablas Rotación: Basada en MARCAS ORIGINALES de Nielsen
      const origRotBrands = rotOrigByScope[sc] || {};
      Object.entries(origRotBrands).forEach(([origName, rData]) => {
        let totUnds = 0;
        let totTvDays = 0;
        const monthlyVals = [];

        for (let i = 0; i < periodsList.length; i++) {
          const u = rData.unds[i];
          const tv = rData.tv[i];
          const d = periodsList[i].daysInMonth;
          totUnds += u;
          totTvDays += (tv * d);
          monthlyVals.push(tv > 0 ? parseFloat((u / tv / d).toFixed(1)) : 0);
        }

        const totRot = totTvDays > 0 ? parseFloat((totUnds / totTvDays).toFixed(1)) : 0;
        if (totUnds > 0) {
          tablesByScope[sc].rotacion.rows.push({
            brand: origName,
            brandId: origName,
            monthly: monthlyVals,
            total: totRot
          });
        }
      });

      // Cálculo del Total Columna y Total General para Distribución Numérica (Máximo mensual y anual)
      for (let pIdx = 0; pIdx < periodsList.length; pIdx++) {
        const maxDistMonth = Math.max(...tablesByScope[sc].dist.rows.map(r => r.monthly[pIdx] || 0), 0);
        tablesByScope[sc].dist.totalRow.monthly[pIdx] = maxDistMonth;
      }
      tablesByScope[sc].dist.totalRow.total = Math.max(...tablesByScope[sc].dist.totalRow.monthly, 0);

      tablesByScope[sc].unidades.rows.sort((a, b) => b.total - a.total);
      tablesByScope[sc].som.rows.sort((a, b) => b.total - a.total);
      tablesByScope[sc].dist.rows.sort((a, b) => b.total - a.total);
      tablesByScope[sc].precio.rows.sort((a, b) => b.total - a.total);
      tablesByScope[sc].rotacion.rows.sort((a, b) => b.total - a.total);
    });

    const responsePayload = {
      periods: periodsList,
      scopes,
      brands: brandsDef,
      charts: dataByScope,
      tables: tablesByScope,
      regiones: ['METRO', 'NORORIENTE', 'OCCIDENTE', 'OCCIDENTE CHICO', 'ORIENTE CHICO', 'ORIENTE GRANDE', 'SUR', 'VERAPACES']
    };

    queryCache.set(cacheKey, responsePayload);
    res.json(responsePayload);
  } catch (error) {
    console.error('Error al consultar /api/nielsen/gt/guatemala:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Overview General (Legacy)
app.get('/api/nielsen/cr/overview', async (req, res) => {
  const categoria = req.query.categoria || 'TODAS';
  const anio = req.query.anio || 'TODOS';
  
  const cacheKey = `cr_overview_${categoria}_${anio}`;
  const cached = queryCache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    let whereClauses = ["Pais = 'COSTA RICA'", "Apertura_Canal_Region = 'TOTAL'", "Apertura_Productos = 'CATEGORIA'"];
    if (categoria !== 'TODAS') {
      whereClauses.push(`CATEGORIA = '${categoria.replace(/'/g, "\\'")}'`);
    }
    if (anio !== 'TODOS') {
      whereClauses.push(`EXTRACT(YEAR FROM Periods) = ${parseInt(anio, 10)}`);
    }

    const whereStr = whereClauses.join(' AND ');

    // Query 1: Resumen General
    const summaryQuery = `
      SELECT 
        ROUND(SUM(Vtas_Valor), 2) AS total_ventas_valor,
        ROUND(SUM(Vtas_Unds), 0) AS total_ventas_unds,
        ROUND(SUM(Vtas_LT), 0) AS total_ventas_lt,
        ROUND(AVG(Dist_Pond_Reach), 2) AS avg_dist_pond,
        ROUND(AVG(N_de_Tiendas_Venden_C), 0) AS avg_tiendas_venden,
        ROUND(AVG(N_de_Tiendas_C), 0) AS avg_universo_tiendas
      FROM \`psa-eltr-latam-pr.Nielsen.v_Nielsen_LATAM_Consolidado\`
      WHERE ${whereStr}
    `;

    // Query 2: Tendencia Mensual por Periodo
    const trendQuery = `
      SELECT 
        FORMAT_DATE('%Y-%m', Periods) AS periodo_clave,
        FORMAT_DATE('%b %y', Periods) AS periodo_label,
        ROUND(SUM(Vtas_Valor), 2) AS ventas_valor,
        ROUND(SUM(Vtas_Unds), 0) AS ventas_unds,
        ROUND(SUM(Vtas_LT), 0) AS ventas_lt,
        ROUND(AVG(Dist_Pond_Reach), 1) AS dist_pond
      FROM \`psa-eltr-latam-pr.Nielsen.v_Nielsen_LATAM_Consolidado\`
      WHERE ${whereStr}
      GROUP BY periodo_clave, periodo_label
      ORDER BY periodo_clave ASC
    `;

    // Query 3: Desglose por Categoría
    const catQuery = `
      SELECT 
        CATEGORIA,
        ROUND(SUM(Vtas_Valor), 2) AS ventas_valor,
        ROUND(SUM(Vtas_Unds), 0) AS ventas_unds,
        ROUND(SUM(Vtas_LT), 0) AS ventas_lt
      FROM \`psa-eltr-latam-pr.Nielsen.v_Nielsen_LATAM_Consolidado\`
      WHERE ${whereStr}
      GROUP BY CATEGORIA
      ORDER BY ventas_valor DESC
    `;

    const [summaryRows, trendRows, catRows] = await Promise.all([
      runBqQuery(summaryQuery),
      runBqQuery(trendQuery),
      runBqQuery(catQuery)
    ]);

    const result = {
      kpis: summaryRows[0] || {},
      tendencia: trendRows || [],
      categorias: catRows || []
    };

    queryCache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    console.error('Error al consultar /api/nielsen/cr/overview:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// 2. Ranking y Market Share por Marca
app.get('/api/nielsen/cr/marcas', async (req, res) => {
  const categoria = req.query.categoria || 'TODAS';
  const anio = req.query.anio || 'TODOS';
  const cacheKey = `cr_marcas_${categoria}_${anio}`;
  const cached = queryCache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    let whereClauses = ["Pais = 'COSTA RICA'", "Apertura_Canal_Region = 'TOTAL'", "Apertura_Productos = 'MARCA'", "MARCA IS NOT NULL"];
    if (categoria !== 'TODAS') {
      whereClauses.push(`CATEGORIA = '${categoria.replace(/'/g, "\\'")}'`);
    }
    if (anio !== 'TODOS') {
      whereClauses.push(`EXTRACT(YEAR FROM Periods) = ${parseInt(anio, 10)}`);
    }

    const whereStr = whereClauses.join(' AND ');

    const marcasQuery = `
      SELECT 
        MARCA,
        CATEGORIA,
        ROUND(SUM(Vtas_Valor), 2) AS ventas_valor,
        ROUND(SUM(Vtas_Unds), 0) AS ventas_unds,
        ROUND(SUM(Vtas_LT), 0) AS ventas_lt,
        ROUND(AVG(Dist_Pond_Reach), 1) AS dist_pond_prom,
        ROUND(AVG(N_de_Tiendas_Venden_C), 0) AS tiendas_venden_prom
      FROM \`psa-eltr-latam-pr.Nielsen.v_Nielsen_LATAM_Consolidado\`
      WHERE ${whereStr}
      GROUP BY MARCA, CATEGORIA
      ORDER BY ventas_valor DESC
      LIMIT 20
    `;

    const rows = await runBqQuery(marcasQuery);
    
    // Calcular Market Share relativo
    const totalVentas = rows.reduce((acc, r) => acc + (parseFloat(r.ventas_valor) || 0), 0);
    const formatted = rows.map(r => ({
      ...r,
      market_share_pct: totalVentas > 0 ? parseFloat(((r.ventas_valor / totalVentas) * 100).toFixed(2)) : 0
    }));

    queryCache.set(cacheKey, formatted);
    res.json(formatted);
  } catch (error) {
    console.error('Error al consultar /api/nielsen/cr/marcas:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// 3. Desglose por Canal y Regiones
app.get('/api/nielsen/cr/canales-regiones', async (req, res) => {
  const anio = req.query.anio || 'TODOS';
  const cacheKey = `cr_canales_regiones_${anio}`;
  const cached = queryCache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    let yearFilter = '';
    if (anio !== 'TODOS') {
      yearFilter = `AND EXTRACT(YEAR FROM Periods) = ${parseInt(anio, 10)}`;
    }

    const canalesQuery = `
      SELECT 
        Markets AS Canal,
        ROUND(SUM(Vtas_Valor), 2) AS ventas_valor,
        ROUND(SUM(Vtas_Unds), 0) AS ventas_unds,
        ROUND(AVG(Dist_Pond_Reach), 1) AS dist_pond_prom
      FROM \`psa-eltr-latam-pr.Nielsen.v_Nielsen_LATAM_Consolidado\`
      WHERE Pais = 'COSTA RICA'
        AND Apertura_Productos = 'CATEGORIA'
        AND Apertura_Canal_Region = 'CANAL'
        ${yearFilter}
      GROUP BY Markets
      ORDER BY ventas_valor DESC
    `;

    const regionesQuery = `
      SELECT 
        Region,
        ROUND(SUM(Vtas_Valor), 2) AS ventas_valor,
        ROUND(SUM(Vtas_Unds), 0) AS ventas_unds,
        ROUND(AVG(Dist_Pond_Reach), 1) AS dist_pond_prom
      FROM \`psa-eltr-latam-pr.Nielsen.v_Nielsen_LATAM_Consolidado\`
      WHERE Pais = 'COSTA RICA'
        AND Apertura_Productos = 'CATEGORIA'
        AND Apertura_Canal_Region = 'TOTAL/REGION'
        AND Region IS NOT NULL
        ${yearFilter}
      GROUP BY Region
      ORDER BY ventas_valor DESC
    `;

    const [canalesRows, regionesRows] = await Promise.all([
      runBqQuery(canalesQuery),
      runBqQuery(regionesQuery)
    ]);

    const result = {
      canales: canalesRows || [],
      regiones: regionesRows || []
    };

    queryCache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    console.error('Error al consultar canales y regiones:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// ENDPOINT: ARQUITECTURA Y MODELO SEMÁNTICO EN VIVO
// ==========================================
app.get('/api/model/semantic-architecture', async (req, res) => {
  const cacheKey = 'semantic_architecture_model';
  const cached = queryCache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    // 1. Consultar columnas y tipos en INFORMATION_SCHEMA
    const schemaSql = `
      SELECT 
        table_name, 
        column_name, 
        data_type, 
        is_nullable, 
        ordinal_position
      FROM \`psa-eltr-latam-pr.Nielsen.INFORMATION_SCHEMA.COLUMNS\`
      WHERE table_name IN ('v_Nielsen_LATAM_Consolidado', 'cat_homologacion_marcas', 'v_Nielsen_CAM_Consolidado')
      ORDER BY table_name, ordinal_position
    `;

    // 2. Conteo de registros por país en vivo
    const countriesSql = `
      SELECT 
        Pais AS pais,
        COUNT(*) AS total_filas,
        COUNT(DISTINCT MARCAS_H) AS total_marcas,
        COUNT(DISTINCT Canal) AS total_canales,
        MIN(Periods) AS min_periodo,
        MAX(Periods) AS max_periodo
      FROM \`psa-eltr-latam-pr.Nielsen.v_Nielsen_LATAM_Consolidado\`
      GROUP BY Pais
      ORDER BY total_filas DESC
    `;

    // 3. Conteo de catálogo
    const catalogCountSql = `
      SELECT COUNT(*) AS total_marcas_homologadas 
      FROM \`psa-eltr-latam-pr.Nielsen.cat_homologacion_marcas\`
    `;

    const [schemaRows, countriesRows, catalogRows] = await Promise.all([
      runBqQuery(schemaSql).catch(() => []),
      runBqQuery(countriesSql).catch(() => []),
      runBqQuery(catalogCountSql).catch(() => [{ total_marcas_homologadas: 102 }])
    ]);

    // Agrupar columnas por tabla
    const tablesMap = {};
    (schemaRows || []).forEach(row => {
      const tName = row.table_name;
      if (!tablesMap[tName]) {
        tablesMap[tName] = [];
      }
      tablesMap[tName].push({
        column: row.column_name,
        type: row.data_type,
        nullable: row.is_nullable === 'YES',
        order: row.ordinal_position
      });
    });

    const responseData = {
      timestamp: new Date().toISOString(),
      project: 'psa-eltr-latam-pr',
      dataset: 'Nielsen',
      status: 'ONLINE',
      engine: 'Google BigQuery + Node.js Semantic Engine',
      tables: [
        {
          id: 'fact_latam',
          name: 'v_Nielsen_LATAM_Consolidado',
          alias: 'BD_LATAM / BD_CAM (Fact Table)',
          type: 'VIEW (Consolidada)',
          category: 'Fact Table',
          description: 'Tabla de hechos consolidada con transacciones de retail de Costa Rica, Guatemala, Colombia y Perú.',
          rowCount: (countriesRows || []).reduce((acc, c) => acc + (parseInt(c.total_filas) || 0), 0),
          columns: tablesMap['v_Nielsen_LATAM_Consolidado'] || []
        },
        {
          id: 'dim_homologacion',
          name: 'cat_homologacion_marcas',
          alias: 'Marcas_Nielsen_CAM (Dimension)',
          type: 'TABLE (Catálogo Maestro)',
          category: 'Dimension Table',
          description: 'Catálogo de homologación de marcas con llaves compuestas por país (KEY_Marcas -> MARCAS_H, MARCA_RESTO).',
          rowCount: catalogRows[0]?.total_marcas_homologadas || 102,
          columns: tablesMap['cat_homologacion_marcas'] || []
        },
        {
          id: 'dim_calendario',
          name: 'Dim_Calendario_Periodos',
          alias: 'Calendario / Calendario_ant',
          type: 'VIRTUAL DIMENSION',
          category: 'Dimension Table',
          description: 'Dimensión de inteligencia de tiempo derivada dinámicamente de los periodos auditados (Años, Meses, YTD, MAT).',
          rowCount: 48,
          columns: [
            { column: 'Periods', type: 'STRING', description: 'Periodo Nielsen oficial (ej. sep-25, ago-26)' },
            { column: 'Anio', type: 'INT64', description: 'Año de la auditoría (2024, 2025, 2026)' },
            { column: 'Mes', type: 'STRING', description: 'Mes analítico (ene, feb, ..., dic)' },
            { column: 'Mes_Numero', type: 'INT64', description: 'Orden numérico del mes (1 al 12)' },
            { column: 'Is_YTD', type: 'BOOLEAN', description: 'Indicador de pertenencia al acumulado YTD' }
          ]
        },
        {
          id: 'dim_canales_regiones',
          name: 'Dim_Canales_Regiones',
          alias: 'Estructura Comercial',
          type: 'VIRTUAL DIMENSION',
          category: 'Dimension Table',
          description: 'Jerarquía comercial y territorial (Canales Moderno, Tradicional, Farmacias y Aperturas Regionales).',
          rowCount: 16,
          columns: [
            { column: 'Canal', type: 'STRING', description: 'Canal de distribución (MODERNO, TRADICIONAL, TOTAL PAIS)' },
            { column: 'Region', type: 'STRING', description: 'Zona geográfica (METRO, OCCIDENTE, ATLANTICO, etc.)' },
            { column: 'Apertura_Canal_Region', type: 'STRING', description: 'Nivel de granularidad del reporte' }
          ]
        }
      ],
      relationships: [
        {
          from: 'cat_homologacion_marcas',
          fromCol: 'KEY_Marcas',
          to: 'v_Nielsen_LATAM_Consolidado',
          toCol: 'KEY_MARCAS',
          cardinality: '1:N',
          joinType: 'LEFT OUTER JOIN',
          description: 'Asocia cada registro transaccional con la marca homologada oficial y su tratamiento de Resto de Marcas.'
        },
        {
          from: 'Dim_Calendario_Periodos',
          fromCol: 'Periods',
          to: 'v_Nielsen_LATAM_Consolidado',
          toCol: 'Periods',
          cardinality: '1:N',
          joinType: 'INNER / LOGICAL',
          description: 'Controla el contexto temporal para filtros de Año, Mes, Time-Intelligence YTD y MAT.'
        },
        {
          from: 'Dim_Canales_Regiones',
          fromCol: 'Canal',
          to: 'v_Nielsen_LATAM_Consolidado',
          toCol: 'Canal',
          cardinality: '1:N',
          joinType: 'INNER / LOGICAL',
          description: 'Filtra y agrupa las ventas por canal comercial y desglose territorial.'
        }
      ],
      measures: [
        {
          name: 'Ventas Unidades (000)',
          category: 'Métricas Base',
          dax: 'Vtas Unds = SUM(BD_CAM[Vtas Unds])',
          sql: 'SUM(Vtas_Unds)',
          description: 'Volumen total comercializado expresado en miles de unidades.'
        },
        {
          name: 'Ventas Valor',
          category: 'Métricas Base',
          dax: 'Vtas Valor = SUM(BD_CAM[Vtas Valor])',
          sql: 'SUM(Vtas_Valor)',
          description: 'Venta total en valor monetario (moneda local o dólares según país).'
        },
        {
          name: 'Volumen Litros (LT)',
          category: 'Métricas Base',
          dax: 'Vtas (LT) = SUM(BD_CAM[Vtas (LT)])',
          sql: 'SUM(Vtas_LT)',
          description: 'Volumen físico total comercializado en miles de litros.'
        },
        {
          name: 'SOM Unidades (%)',
          category: 'Share de Mercado',
          dax: 'SOM Unds = DIVIDE([Vtas Unds Marca], CALCULATE([Vtas Unds], ALLSELECTED(Marcas)))',
          sql: 'ROUND(SAFE_DIVIDE(SUM(Vtas_Unds_Marca), SUM(Vtas_Unds_Total)) * 100, 1)',
          description: 'Participación de mercado de cada marca sobre el total de la categoría isotónicos/sueros.'
        },
        {
          name: 'Distribución Numérica (%)',
          category: 'Distribución',
          dax: 'Dist Num = DIVIDE([N. de Tiendas Venden], [N. de Tiendas Total])',
          sql: 'ROUND(SAFE_DIVIDE(SUM(N_Tiendas_Venden), SUM(N_Tiendas)) * 100, 1)',
          description: 'Porcentaje de puntos de venta que tienen presencia activa de la marca.'
        },
        {
          name: 'Precio Promedio por Litro',
          category: 'Eficiencia de Precio',
          dax: 'Precio x LT = DIVIDE([Vtas Valor], [Vtas (LT)])',
          sql: 'ROUND(SAFE_DIVIDE(SUM(Vtas_Valor), SUM(Vtas_LT)), 2)',
          description: 'Precio efectivo promedio por litro comercializado.'
        },
        {
          name: 'Crecimiento YoY (%)',
          category: 'Time Intelligence',
          dax: 'YoY Growth = DIVIDE([Vtas Actual] - [Vtas Anterior], [Vtas Anterior])',
          sql: 'SAFE_DIVIDE(v_act - v_ant, v_ant) * 100',
          description: 'Tasa de variación interanual respecto al mismo periodo del año previo.'
        }
      ],
      countriesSummary: countriesRows || []
    };

    queryCache.set(cacheKey, responseData);
    res.json(responseData);
  } catch (error) {
    console.error('Error al generar arquitectura del modelo semántico:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// VITE MIDDLEWARE (MODO INTEGRADO)
// ==========================================
async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 [HADA DASHBOARD] Servidor activo en http://localhost:${PORT}`);
    console.log(`🇨🇷 Dashboard Nielsen Costa Rica & Portada listo.`);
  });
}

startServer();
