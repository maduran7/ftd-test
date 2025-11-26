export interface Movement {
  id: string;
  date: string;
  amount: number;
  description: string;
  type?: 'CREDIT' | 'DEBIT';
  dynamicBalance?: number;
}

export interface LogEvent {
  id: string;
  timestamp: string;
  endpoint: string;
  status: number;
  latency: number;
  type: 'SUCCESS' | 'ERROR' | 'RISK';
  message: string;
}

export interface FinancialStats {
  totalIn: number;
  totalOut: number;
  risks: Movement[];
  top5: Movement[];
}