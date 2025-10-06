
export enum TaskStatus {
  Ready = 'hazır',
  Running = 'çalışıyor',
  Paused = 'duraklatıldı',
  ActionRequired = 'aksiyon bekleniyor',
  Completed = 'tamamlandı',
}

export interface Account {
  id?: number;
  portal: 'idata' | 'vfs';
  username: string;
  password?: string; // Password is now optional in the interface, handled securely
}

export interface Person {
  id?: number;
  accountId: number | null; // Link to an Account
  fullName: string;
  passportNo: string;
  birthDate: string;
  country: string;
  city: string;
  center: string;
  earliestDate: string;
  latestDate: string;
  taskStatus: TaskStatus;
  bookedDate?: string;
  appointmentDetails?: string;
  lastReminder?: string;
}

export interface LogEntry {
  id: number;
  level: 'info' | 'success' | 'error' | 'warning';
  message: string;
  timestamp: string;
}

export type GlobalStatus = 'running' | 'paused' | 'stopped';

export interface AppSettings {
  apiUrl: string;
  pollInterval: number;
  pollJitter: number;
  browserNotify: boolean;
  soundNotify: boolean;
}

export interface ToastMessage {
  id: number;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
  duration?: number;
}

export interface TaskHistoryEntry {
  id?: number;
  personId: number;
  timestamp: string;
  oldStatus: TaskStatus;
  newStatus: TaskStatus;
  details: string;
}
