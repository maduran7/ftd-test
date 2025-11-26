import { Movement, FinancialStats } from './types';

export function processFinancials(response: any): { processed: Movement[], stats: FinancialStats } {
  let rawMovements: any[] = [];

  // Detección inteligente de la estructura de datos
  if (Array.isArray(response)) rawMovements = response;
  else if (response?.data && Array.isArray(response.data)) rawMovements = response.data;
  else if (response?.results && Array.isArray(response.results)) rawMovements = response.results;
  else if (response?.movements && Array.isArray(response.movements)) rawMovements = response.movements;
  else return { processed: [], stats: { totalIn: 0, totalOut: 0, risks: [], top5: [] } };

  // 1. Normalizar
  const sorted = [...rawMovements].map(m => ({
    ...m,
    amount: parseFloat(m.amount),
    type: parseFloat(m.amount) >= 0 ? 'CREDIT' : 'DEBIT' // [Requisito: Clasificación]
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // 2. Balance Dinámico y Totales
  let runningBalance = 0;
  let totalIn = 0;
  let totalOut = 0;
  let sumAbsAmount = 0;

  const processed = sorted.map(m => {
    runningBalance += m.amount;
    if (m.amount > 0) totalIn += m.amount;
    else totalOut += m.amount;
    sumAbsAmount += Math.abs(m.amount);
    return { ...m, dynamicBalance: runningBalance };
  });

  // 3. Detección de Riesgos Avanzada
  const avgAmount = processed.length ? sumAbsAmount / processed.length : 0;
  
  // Riesgo A: Montos inusuales (> 3x promedio)
  const highValueRisks = processed.filter(m => Math.abs(m.amount) > (avgAmount * 3));

  // Riesgo B: Posibles Duplicados (Mismo monto y descripción en fechas cercanas) [Requisito Semi-Senior]
  const duplicateRisks: Movement[] = [];
  processed.forEach((m, i) => {
    if (i > 0) {
      const prev = processed[i-1];
      if (prev.amount === m.amount && prev.description === m.description) {
        duplicateRisks.push({ ...m, description: `${m.description} (Posible Duplicado)` });
      }
    }
  });

  const risks = [...highValueRisks, ...duplicateRisks];

  // 4. Top 5
  const top5 = [...processed]
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
    .slice(0, 5);

  return { processed, stats: { totalIn, totalOut, risks, top5 } };
}