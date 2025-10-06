
import { useEffect, useRef, useCallback } from 'react';
import { agentWorkerCode } from '../services/agentWorker';
import { Person, GlobalStatus, AppSettings, Account } from '../types';

interface WorkerCallbacks {
  onLog: (level: 'info' | 'success' | 'error' | 'warning', message: string) => void;
  onBackendCheck: (task: Person, account: Account) => void;
  onNextRunUpdate: (time: number | null) => void;
}

export const useAgentWorker = (callbacks: WorkerCallbacks) => {
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    const workerBlob = new Blob([agentWorkerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(workerBlob);
    const worker = new Worker(workerUrl);
    workerRef.current = worker;

    worker.onmessage = (e) => {
      const { type, level, msg, task, account, time } = e.data;
      switch (type) {
        case 'log':
          callbacks.onLog(level, msg);
          break;
        case 'check_backend':
          callbacks.onBackendCheck(task, account);
          break;
        case 'update_next_run':
          callbacks.onNextRunUpdate(time);
          break;
      }
    };

    worker.onerror = (e) => {
      console.error('Worker error:', e);
      callbacks.onLog('error', `Worker error: ${e.message}`);
    };

    return () => {
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
      workerRef.current = null;
    };
  }, [callbacks]);

  const postCommand = useCallback((command: 'start' | 'update' | 'stop', data?: { tasks: Person[], accounts: Account[], settings: AppSettings & { status: GlobalStatus } }) => {
    if (workerRef.current) {
      workerRef.current.postMessage({ command, data });
    }
  }, []);

  return { postCommand };
};
