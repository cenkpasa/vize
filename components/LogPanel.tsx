
import React, { useRef, useEffect } from 'react';
import { LogEntry } from '../types';

interface LogPanelProps {
  logs: LogEntry[];
}

const levelStyles: { [key in LogEntry['level']]: string } = {
  info: 'text-gray-400',
  success: 'text-green-400',
  error: 'text-red-400',
  warning: 'text-yellow-400',
};

export const LogPanel: React.FC<LogPanelProps> = ({ logs }) => {
    const logContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs]);

  return (
    <div className="bg-gray-900 dark:bg-black/50 shadow-lg rounded-lg border border-gray-700 dark:border-gray-800 p-6 mt-6 h-[460px] flex flex-col">
      <h2 className="text-xl font-semibold text-gray-100 mb-4">Log Kayıtları</h2>
      <div ref={logContainerRef} className="flex-grow overflow-y-auto bg-black/30 rounded-md p-3 font-mono text-xs text-gray-300 space-y-1">
        {logs.map(log => (
            <div key={log.id}>
                <span className="text-gray-500 mr-2">{log.timestamp}</span>
                <span className={`${levelStyles[log.level]} font-bold mr-2`}>{log.level.toUpperCase()}</span>
                <span className="whitespace-pre-wrap">{log.message}</span>
            </div>
        ))}
        {logs.length === 0 && <div className="text-gray-500">Log kayıtları burada görünecek...</div>}
      </div>
    </div>
  );
};
