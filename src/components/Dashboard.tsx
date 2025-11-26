'use client';
import { useEffect, useState } from 'react';
import { useMonitoredFetch, useMonitoring } from '@/context/MonitoringContext';
import { processFinancials } from '@/lib/analytics';
import { Movement, FinancialStats } from '@/lib/types';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { AlertTriangle, CheckCircle, Activity, TrendingUp, TrendingDown, Search, Filter, Bug, Calendar, DollarSign } from 'lucide-react';

const ACCOUNT_ID = process.env.NEXT_PUBLIC_ACCOUNT_ID || '999';

export default function Dashboard() {
  const fetcher = useMonitoredFetch();
  const { systemStatus, logs, addLog } = useMonitoring();
  
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<number>(0);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [filteredMovements, setFilteredMovements] = useState<Movement[]>([]);
  const [stats, setStats] = useState<FinancialStats | null>(null);
  const [activeTab, setActiveTab] = useState<'finance' | 'monitor'>('finance');
  
  // --- ESTADOS DE FILTROS ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'CREDIT' | 'DEBIT'>('ALL');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const balData = await fetcher(`/api/accounts/${ACCOUNT_ID}/balance`);
        if(balData) setBalance(balData.balance);

        const movData = await fetcher(`/api/accounts/${ACCOUNT_ID}/movements`);
        if(movData) {
          const { processed, stats } = processFinancials(movData);
          setMovements(processed);
          setFilteredMovements(processed);
          setStats(stats);
        }
      } catch (e) { console.error("Error inicial", e); } 
      finally { setLoading(false); }
    };
    loadData();
  }, []);

  // LÓGICA DE FILTRADO COMPLETA
  useEffect(() => {
    let result = movements;

    // 1. Filtro Texto
    if (searchTerm) {
      result = result.filter(m => m.description.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    // 2. Filtro Tipo
    if (filterType !== 'ALL') {
      result = result.filter(m => m.type === filterType);
    }
    // 3. Filtro Fechas
    if (dateStart) {
      result = result.filter(m => new Date(m.date) >= new Date(dateStart));
    }
    if (dateEnd) {
      result = result.filter(m => new Date(m.date) <= new Date(dateEnd));
    }
    // 4. Filtro Monto (Absoluto para facilitar búsqueda)
    if (minAmount) {
      result = result.filter(m => Math.abs(m.amount) >= parseFloat(minAmount));
    }
    if (maxAmount) {
      result = result.filter(m => Math.abs(m.amount) <= parseFloat(maxAmount));
    }

    setFilteredMovements(result);
  }, [searchTerm, filterType, dateStart, dateEnd, minAmount, maxAmount, movements]);

  const simulateError = () => {
    addLog({
      endpoint: '/api/simulated-crash',
      status: 500,
      latency: 4500,
      type: 'ERROR',
      message: 'Simulated Critical Failure'
    });
  };

  if (loading) return <div className="p-10 text-center font-bold text-gray-600">Cargando Sistema Bancario...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-800">
      {/* HEADER */}
      <header className="mb-8 flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Banco Prueba FTD</h1>
          <p className="text-gray-500 text-sm">ID Cuenta: {ACCOUNT_ID}</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-white shadow-md transition-colors ${
          systemStatus === 'OK' ? 'bg-green-500' : systemStatus === 'DEGRADED' ? 'bg-yellow-500' : 'bg-red-600'
        }`}>
          {systemStatus === 'OK' ? <CheckCircle size={18}/> : <AlertTriangle size={18}/>}
          <span>Estado API: {systemStatus}</span>
        </div>
      </header>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button onClick={() => setActiveTab('finance')} 
          className={`px-4 py-2 font-medium transition-colors ${activeTab === 'finance' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
          Finanzas & Análisis
        </button>
        <button onClick={() => setActiveTab('monitor')} 
          className={`px-4 py-2 font-medium transition-colors ${activeTab === 'monitor' ? 'border-b-2 border-gray-800 text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
          Monitoreo Técnico
        </button>
      </div>

      {activeTab === 'finance' ? (
        <div className="space-y-6">
          {/* TOTALES */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
              <h3 className="text-gray-500 text-sm font-medium uppercase">Balance Actual</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">${balance.toLocaleString()}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-green-100">
              <h3 className="text-gray-500 text-sm font-medium uppercase">Ingresos</h3>
              <p className="text-xl font-bold text-green-600 mt-2 flex items-center gap-1"><TrendingUp size={20}/> +${stats?.totalIn.toLocaleString()}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-red-100">
              <h3 className="text-gray-500 text-sm font-medium uppercase">Egresos</h3>
              <p className="text-xl font-bold text-red-600 mt-2 flex items-center gap-1"><TrendingDown size={20}/> ${stats?.totalOut.toLocaleString()}</p>
            </div>
          </div>

          {/* GRÁFICO */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold mb-4 text-gray-700">Evolución de Saldo</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={movements}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb"/>
                  <XAxis dataKey="date" tickFormatter={(t) => new Date(t).toLocaleDateString()} tick={{fontSize: 12}} stroke="#9ca3af" />
                  <YAxis tick={{fontSize: 12}} stroke="#9ca3af" />
                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Line type="monotone" dataKey="dynamicBalance" stroke="#2563eb" strokeWidth={3} dot={false} activeDot={{r: 6}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             {/* COLUMNA IZQUIERDA: RIESGOS + TOP 5 */}
             <div className="space-y-6">
                {/* RIESGOS */}
                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-red-500">
                  <h3 className="font-bold text-red-600 mb-4 flex items-center gap-2">
                    <AlertTriangle size={20} /> Riesgos (&gt;3x Promedio)
                  </h3>
                  <ul className="text-sm space-y-3">
                    {stats?.risks.length === 0 ? <p className="text-gray-400 italic">Sin riesgos detectados.</p> : stats?.risks.map((m, i) => (
                      <li key={i} className="flex justify-between items-start bg-red-50 p-2 rounded border border-red-100">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-800">{m.description}</span>
                          <span className="text-[10px] text-red-500 uppercase">{Math.abs(m.amount) > 1000 ? 'Monto Alto' : 'Duplicado'}</span>
                        </div>
                        <span className="font-bold text-red-700">${m.amount}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* TOP 5 MOVIMIENTOS*/}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <Activity size={20} /> Top 5 Mayores Movimientos
                  </h3>
                  <ul className="text-sm space-y-2">
                    {stats?.top5.map((m, i) => (
                      <li key={i} className="flex justify-between items-center border-b border-gray-50 last:border-0 pb-2">
                        <span className="text-gray-600 truncate max-w-[150px]">{m.description}</span>
                        <span className="font-mono font-bold text-gray-800">${m.amount}</span>
                      </li>
                    ))}
                  </ul>
                </div>
             </div>

            {/* COLUMNA DERECHA: FILTROS + TABLA */}
            <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-lg text-gray-700 mb-4">Movimientos Detallados</h3>
              
              {/* --- ZONA DE FILTROS --- */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4 p-4 bg-gray-50 rounded-lg">
                {/* Buscador */}
                <div className="col-span-2 md:col-span-1 relative">
                  <Search className="absolute left-2 top-2.5 text-gray-400" size={16}/>
                  <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 pr-2 py-2 w-full border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"/>
                </div>
                {/* Tipo */}
                <div className="relative">
                  <Filter className="absolute left-2 top-2.5 text-gray-400" size={16}/>
                  <select value={filterType} onChange={(e) => setFilterType(e.target.value as any)}
                    className="pl-8 pr-2 py-2 w-full border rounded text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="ALL">Todo Tipo</option>
                    <option value="CREDIT">Ingresos (Crédito)</option>
                    <option value="DEBIT">Egresos (Débito)</option>
                  </select>
                </div>
                {/* Rango Fechas */}
                <div className="relative flex gap-1">
                  <input type="date" value={dateStart} onChange={(e)=>setDateStart(e.target.value)} className="w-1/2 p-1 border rounded text-xs"/>
                  <input type="date" value={dateEnd} onChange={(e)=>setDateEnd(e.target.value)} className="w-1/2 p-1 border rounded text-xs"/>
                </div>
                {/* Rango Montos */}
                <div className="col-span-2 md:col-span-3 flex gap-2 items-center">
                  <span className="text-xs text-gray-500 font-bold">Monto:</span>
                  <input type="number" placeholder="Min" value={minAmount} onChange={(e)=>setMinAmount(e.target.value)} className="w-24 p-1 border rounded text-xs"/>
                  <span className="text-gray-400">-</span>
                  <input type="number" placeholder="Max" value={maxAmount} onChange={(e)=>setMaxAmount(e.target.value)} className="w-24 p-1 border rounded text-xs"/>
                </div>
              </div>

              {/* TABLA */}
              <div className="overflow-y-auto max-h-[400px]">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-100 text-gray-600 font-bold sticky top-0">
                    <tr>
                      <th className="p-3 rounded-tl-lg">Fecha</th>
                      <th className="p-3">Descripción</th>
                      <th className="p-3 text-center">Tipo</th>
                      <th className="p-3 text-right rounded-tr-lg">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredMovements.map((m, i) => (
                      <tr key={i} className="hover:bg-blue-50 transition-colors">
                        <td className="p-3 text-gray-500 text-xs">{new Date(m.date).toLocaleDateString()}</td>
                        <td className="p-3 font-medium text-gray-800">{m.description}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            m.type === 'CREDIT' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                          }`}>
                            {m.type === 'CREDIT' ? 'CREDIT' : 'DEBIT'}
                          </span>
                        </td>
                        <td className={`p-3 text-right font-bold font-mono ${m.amount > 0 ? 'text-green-600' : 'text-gray-800'}`}>
                          ${m.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {filteredMovements.length === 0 && (
                      <tr><td colSpan={4} className="p-8 text-center text-gray-400 italic">No hay movimientos con estos filtros.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // SECCIÓN MONITOREO
        <div className="bg-gray-900 text-green-400 p-6 rounded-xl font-mono shadow-2xl border border-gray-700">
           <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
            <h2 className="text-xl flex items-center gap-3">
               <Activity className="text-green-500 animate-pulse" /> Panel de Observabilidad
            </h2>
            <button 
              onClick={simulateError}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-xs font-bold flex items-center gap-2 transition-colors shadow-lg shadow-red-900/20"
            >
              <Bug size={14}/> INYECTAR FALLO
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-800 p-4 rounded border border-gray-700">
              <div className="text-gray-400 text-xs uppercase">Estado API</div>
              <div className={`text-lg font-bold ${systemStatus === 'OK' ? 'text-green-400' : 'text-red-500'}`}>{systemStatus}</div>
            </div>
            <div className="bg-gray-800 p-4 rounded border border-gray-700">
              <div className="text-gray-400 text-xs uppercase">Latencia</div>
              <div className="text-lg font-bold text-blue-400">124ms</div>
            </div>
             <div className="bg-gray-800 p-4 rounded border border-gray-700">
              <div className="text-gray-400 text-xs uppercase">Errores (1h)</div>
              <div className="text-lg font-bold text-yellow-400">{logs.filter(l => l.status >= 400).length}</div>
            </div>
             <div className="bg-gray-800 p-4 rounded border border-gray-700">
              <div className="text-gray-400 text-xs uppercase">Total Logs</div>
              <div className="text-lg font-bold text-gray-300">{logs.length}</div>
            </div>
          </div>
          <div className="overflow-x-auto bg-black rounded border border-gray-800 max-h-[400px]">
            <table className="w-full text-left text-xs md:text-sm">
              <thead className="bg-gray-800 text-gray-400 uppercase sticky top-0">
                <tr>
                  <th className="p-3">Time</th>
                  <th className="p-3">Lvl</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Latency</th>
                  <th className="p-3">Endpoint</th>
                  <th className="p-3">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {logs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-gray-800/50 transition-colors">
                    <td className="p-3 text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</td>
                    <td className="p-3">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        log.type === 'ERROR' ? 'bg-red-900 text-red-100' : 
                        log.type === 'RISK' ? 'bg-yellow-900 text-yellow-100' : 'bg-green-900 text-green-100'
                      }`}>
                        {log.type}
                      </span>
                    </td>
                    <td className={`p-3 font-bold ${log.status >= 500 ? 'text-red-500' : 'text-green-500'}`}>{log.status}</td>
                    <td className="p-3 text-blue-300">{log.latency}ms</td>
                    <td className="p-3 text-gray-300 truncate max-w-[150px]">{log.endpoint}</td>
                    <td className="p-3 text-gray-400 italic">{log.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}