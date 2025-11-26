import { MonitoringProvider } from '@/context/MonitoringContext';
import Dashboard from '@/components/Dashboard';

export default function Home() {
  return (
    <MonitoringProvider>
      <main>
        <Dashboard />
      </main>
    </MonitoringProvider>
  );
}