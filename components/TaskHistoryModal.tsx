import React from 'react';
import { Person, TaskHistoryEntry, TaskStatus } from '../types';

interface TaskHistoryModalProps {
  person: Person;
  history: TaskHistoryEntry[];
  onClose: () => void;
}

const statusFilterLabels: {[key: string]: string} = {
    [TaskStatus.Ready]: 'Hazır',
    [TaskStatus.Running]: 'Çalışıyor',
    [TaskStatus.Paused]: 'Duraklatıldı',
    [TaskStatus.ActionRequired]: 'Aksiyon Bekleniyor',
    [TaskStatus.Completed]: 'Tamamlandı'
}

export const TaskHistoryModal: React.FC<TaskHistoryModalProps> = ({ person, history, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Görev Geçmişi: <span className="text-indigo-600 dark:text-indigo-400">{person.fullName}</span>
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {history.length > 0 ? (
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th scope="col" className="px-4 py-3">Zaman Damgası</th>
                  <th scope="col" className="px-4 py-3">Önceki Durum</th>
                  <th scope="col" className="px-4 py-3">Yeni Durum</th>
                  <th scope="col" className="px-4 py-3">Detay</th>
                </tr>
              </thead>
              <tbody>
                {history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(entry => (
                  <tr key={entry.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
                    <td className="px-4 py-2 font-mono">{new Date(entry.timestamp).toLocaleString('tr-TR')}</td>
                    <td className="px-4 py-2">{statusFilterLabels[entry.oldStatus] || entry.oldStatus}</td>
                    <td className="px-4 py-2">{statusFilterLabels[entry.newStatus] || entry.newStatus}</td>
                    <td className="px-4 py-2">{entry.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400">Bu görev için geçmiş kaydı bulunamadı.</p>
          )}
        </div>
        <div className="p-4 border-t dark:border-gray-700 text-right">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
