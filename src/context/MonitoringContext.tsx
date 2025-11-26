'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { LogEvent } from '@/lib/types';

interface MonitoringContextType {
  logs: LogEvent[];
  addLog: (log: Omit<LogEvent, 'id' | 'timestamp'>) => void;
  systemStatus: 'OK' | 'DEGRADED' | 'CRITICAL';
}

const MonitoringContext = createContext<MonitoringContextType>({} as any);

export const MonitoringProvider = ({ children }: { children: React.ReactNode }) => {
  const [logs, setLogs] = useState<LogEvent[]>([]);

  useEffect(() => { // Cargar historial local
    const saved = localStorage.getItem('sys_logs');
    if (saved) setLogs(JSON.parse(saved));
  }, []);

  const addLog = (logData: Omit<LogEvent, 'id' | 'timestamp'>) => {
    const newLog: LogEvent = {
      ...logData,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString()
    };
    setLogs(prev => {
      const updated = [newLog, ...prev].slice(0, 50); // Guardar últimos 50
      localStorage.setItem('sys_logs', JSON.stringify(updated));
      return updated;
    });
  };

  const recentErrors = logs.slice(0, 10).filter(l => l.status >= 500).length;
  const recentLatency = logs.slice(0, 5).reduce((acc, curr) => acc + curr.latency, 0) / 5;
  
  let systemStatus: 'OK' | 'DEGRADED' | 'CRITICAL' = 'OK';
  if (recentErrors > 2) systemStatus = 'CRITICAL';
  else if (recentLatency > 2000) systemStatus = 'DEGRADED'; 

  return (
    <MonitoringContext.Provider value={{ logs, addLog, systemStatus }}>
      {children}
    </MonitoringContext.Provider>
  );
};

export const useMonitoring = () => useContext(MonitoringContext);

export const useMonitoredFetch = () => { // Interceptor de red
  const { addLog } = useMonitoring();

  return async (endpoint: string) => {
    const start = performance.now();
    let status = 200;
    let data = null;
    let errorMsg = 'OK';

    try {
      const res = await fetch(`/api/proxy?endpoint=${endpoint}`);
      status = res.status;
      if (!res.ok) throw new Error(`HTTP ${status}`);
      data = await res.json();
    } catch (e: any) {
      status = status === 200 ? 500 : status;
      errorMsg = e.message;
      throw e;
    } finally {
      const latency = Math.round(performance.now() - start);
      addLog({
        endpoint, status, latency,
        type: status >= 400 ? 'ERROR' : (latency > 2000 ? 'RISK' : 'SUCCESS'),
        message: errorMsg
      });
    }
    return data;
  };
};