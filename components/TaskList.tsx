
import React, { useState, useMemo } from 'react';
import { Person, TaskStatus, Account } from '../types';
import * as XLSX from 'xlsx';

interface TaskListProps {
  persons: Person[];
  accounts: Account[];
  onEdit: (person: Person) => void;
  onDelete: (id: number) => void;
  onMarkAsCompleted: (id: number) => void;
  onRequeueTask: (id: number) => void;
  onShowHistory: (person: Person) => void;
}

const statusStyles: { [key in TaskStatus]: string } = {
  [TaskStatus.Ready]: 'bg-gray-200 text-gray-800',
  [TaskStatus.Running]: 'bg-green-200 text-green-800',
  [TaskStatus.Paused]: 'bg-yellow-200 text-yellow-800',
  [TaskStatus.ActionRequired]: 'bg-purple-200 text-purple-800 animate-pulse',
  [TaskStatus.Completed]: 'bg-blue-200 text-blue-800',
};

const mask = (s: string | undefined) => {
  if (!s) return '';
  return s.length <= 4 ? '*'.repeat(s.length) : `${s.slice(0, 2)}****${s.slice(-2)}`;
};

// Icons remain the same as previous version...
const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" />
    </svg>
);
const HistoryIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
const DeleteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);
const ExportIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);


const statusFilterOptions: (TaskStatus | 'all')[] = ['all', TaskStatus.Ready, TaskStatus.Running, TaskStatus.Paused, TaskStatus.ActionRequired, TaskStatus.Completed];
const statusFilterLabels: {[key: string]: string} = {
    'all': 'Tümü',
    [TaskStatus.Ready]: 'Hazır',
    [TaskStatus.Running]: 'Çalışıyor',
    [TaskStatus.Paused]: 'Duraklatıldı',
    [TaskStatus.ActionRequired]: 'Aksiyon Bekleniyor',
    [TaskStatus.Completed]: 'Tamamlandı'
}

export const TaskList: React.FC<TaskListProps> = ({ persons, accounts, onEdit, onDelete, onMarkAsCompleted, onRequeueTask, onShowHistory }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  
  const enrichedPersons = useMemo(() => {
    const accountMap = new Map(accounts.map(acc => [acc.id, acc.username]));
    return persons.map(p => ({
        ...p,
        accountUsername: accountMap.get(p.accountId!) || 'HESAP SİLİNMİŞ'
    }));
  }, [persons, accounts]);

  const filteredPersons = useMemo(() => {
    return enrichedPersons
      .filter(p => statusFilter === 'all' || p.taskStatus === statusFilter)
      .filter(p => {
        if (!searchTerm) return true;
        return Object.values(p).some(val => 
          String(val).toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
  }, [enrichedPersons, searchTerm, statusFilter]);

  const handleExport = () => {
    const dataToExport = filteredPersons.map(p => ({
        'Ad Soyad': p.fullName,
        'Pasaport No': p.passportNo,
        'Hesap': p.accountUsername,
        'Durum': p.taskStatus,
        'Randevu Detayları': p.appointmentDetails || '',
    }));
    if(dataToExport.length === 0){
      alert("Dışa aktarılacak veri bulunamadı.");
      return;
    }
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Görev Listesi");
    XLSX.writeFile(wb, "gorev_listesi_export.csv");
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 border border-gray-200 dark:border-gray-700 mt-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">Görev Listesi</h2>
            <button onClick={handleExport} className="inline-flex items-center text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold py-1 px-3 rounded-md transition duration-150 ease-in-out">
                <ExportIcon /> Veriyi Dışa Aktar
            </button>
        </div>
        <input
          type="text" placeholder="Listede ara..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          className="w-full sm:w-1/3 px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
         {statusFilterOptions.map(status => (
            <button key={status} onClick={() => setStatusFilter(status)} className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${statusFilter === status ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500'}`}>
                {statusFilterLabels[status]}
            </button>
        ))}
      </div>

      <div className="overflow-x-auto max-h-96">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 sticky top-0">
            <tr>
              <th scope="col" className="px-4 py-3">Ad Soyad</th>
              <th scope="col" className="px-4 py-3">Hesap</th>
              <th scope="col" className="px-4 py-3">Merkez</th>
              <th scope="col" className="px-4 py-3">Durum</th>
              <th scope="col" className="px-4 py-3 text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {filteredPersons.length > 0 ? filteredPersons.map(p => (
              <tr key={p.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">{p.fullName}<br/><span className="text-xs text-gray-400">{mask(p.passportNo)}</span></td>
                <td className="px-4 py-2 text-xs">{p.accountUsername}</td>
                <td className="px-4 py-2 text-xs">{p.center}</td>
                <td className="px-4 py-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusStyles[p.taskStatus]}`}>
                        {statusFilterLabels[p.taskStatus]}
                    </span>
                    {p.taskStatus === TaskStatus.ActionRequired && (
                        <div className="mt-2 flex gap-1">
                            <button onClick={() => onMarkAsCompleted(p.id!)} className="px-2 py-0.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">Tamamlandı</button>
                            <button onClick={() => onRequeueTask(p.id!)} className="px-2 py-0.5 text-xs bg-gray-500 text-white rounded hover:bg-gray-600">Tekrar Ara</button>
                        </div>
                    )}
                    {(p.taskStatus === TaskStatus.Completed || p.taskStatus === TaskStatus.ActionRequired) && (
                        <div className="text-xs mt-1 text-blue-500 dark:text-blue-400">
                            {p.appointmentDetails && <span className="font-semibold">{p.appointmentDetails}</span>}
                        </div>
                    )}
                </td>
                <td className="px-4 py-2 text-right">
                    <div className="inline-flex rounded-md shadow-sm" role="group">
                        <button onClick={() => onEdit(p)} title="Formu Doldur" className="p-2 text-sm font-medium text-blue-700 bg-white border border-gray-200 rounded-l-lg hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600">
                            <EditIcon/>
                        </button>
                         <button onClick={() => onShowHistory(p)} title="Geçmişi Görüntüle" className="p-2 text-sm font-medium text-gray-700 bg-white border-y border-gray-200 hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600">
                            <HistoryIcon />
                        </button>
                        <button onClick={() => onDelete(p.id!)} title="Sil" className="p-2 text-sm font-medium text-red-700 bg-white border border-gray-200 rounded-r-lg hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600">
                            <DeleteIcon/>
                        </button>
                    </div>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={5} className="text-center py-4">Liste boş veya arama sonucu bulunamadı.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
