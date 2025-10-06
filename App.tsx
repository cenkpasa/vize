
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Person, LogEntry, GlobalStatus, AppSettings, TaskStatus, ToastMessage, TaskHistoryEntry, Account } from './types';
import useIndexedDB from './hooks/useIndexedDB';
import { useAgentWorker } from './hooks/useAgentWorker';
import { Header } from './components/Header';
import { PersonForm } from './components/PersonForm';
import { TaskList } from './components/TaskList';
import { SettingsAndControls } from './components/SettingsAndControls';
import { LogPanel } from './components/LogPanel';
import { ToastContainer } from './components/ToastContainer';
import { TaskHistoryModal } from './components/TaskHistoryModal';
import { AccountModal } from './components/AccountModal';

const App: React.FC = () => {
    const [persons, setPersons] = useState<Person[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [personToEdit, setPersonToEdit] = useState<Person | null>(null);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const [globalStatus, setGlobalStatus] = useState<GlobalStatus>('stopped');
    const [nextRunTime, setNextRunTime] = useState<number | null>(null);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [settings, setSettings] = useState<AppSettings>({
        apiUrl: 'http://localhost:3000',
        pollInterval: 120,
        pollJitter: 30,
        browserNotify: false,
        soundNotify: true,
    });
    const [apiStatus, setApiStatus] = useState({ ok: false, message: 'Kontrol ediliyor...' });
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [historyPerson, setHistoryPerson] = useState<Person | null>(null);
    const [taskHistory, setTaskHistory] = useState<TaskHistoryEntry[]>([]);
    const [isBulkUpdating, setIsBulkUpdating] = useState(false);

    const { db, getPersons, savePerson, deletePerson, getAccounts, saveAccount, deleteAccount, getSettings, saveSetting, saveTaskHistoryEntry, getTaskHistory } = useIndexedDB();
    const criticalNotifyAudioRef = useRef<HTMLAudioElement>(null);
    
    useEffect(() => {
        const isDark = localStorage.getItem('theme') === 'dark';
        setIsDarkMode(isDark);
        document.documentElement.classList.toggle('dark', isDark);
    }, []);

    const toggleDarkMode = () => {
        localStorage.setItem('theme', !isDarkMode ? 'dark' : 'light');
        setIsDarkMode(!isDarkMode);
        document.documentElement.classList.toggle('dark', !isDarkMode);
    };

    const addLog = useCallback((level: LogEntry['level'], message: string) => {
        setLogs(prev => [...prev.slice(-200), { id: Date.now(), level, message, timestamp: new Date().toLocaleTimeString('tr-TR') }]);
    }, []);

    const addToast = useCallback((message: string, type: ToastMessage['type'] = 'info', duration?: number) => {
        setToasts(prev => [...prev, { id: Date.now(), message, type, duration }]);
    }, []);
    
    const dismissToast = (id: number) => {
        setToasts(toasts => toasts.filter(t => t.id !== id));
    };

    const checkApiStatus = useCallback(async () => {
        try {
            const response = await fetch(`${settings.apiUrl}/status`);
            if (!response.ok) throw new Error(`Server responded with status ${response.status}`);
            const data = await response.json();
            setApiStatus({ ok: true, message: data.message });
            return true;
        } catch (error) {
            setApiStatus({ ok: false, message: 'Sunucuya ulaşılamadı. Lütfen backend sunucusunun çalıştığından emin olun.' });
            return false;
        }
    }, [settings.apiUrl]);

    useEffect(() => {
        const loadData = async () => {
            if (db) {
                try {
                    const [p, a, s] = await Promise.all([getPersons(), getAccounts(), getSettings()]);
                    setPersons(p);
                    setAccounts(a);
                    setSettings(currentSettings => ({ ...currentSettings, ...s }));
                    addLog('info', 'Uygulama başlatıldı, veriler yüklendi.');
                } catch (error) {
                    addToast("Veritabanı okunurken hata oluştu.", 'error');
                }
            }
        };
        loadData();
    }, [db]);
    
    useEffect(() => {
        checkApiStatus();
        const interval = setInterval(checkApiStatus, 30000); // Check API status every 30s
        return () => clearInterval(interval);
    }, [checkApiStatus]);

    const logStatusChange = useCallback(async (personId: number, oldStatus: TaskStatus, newStatus: TaskStatus, details: string) => {
        try {
            await saveTaskHistoryEntry({ personId, oldStatus, newStatus, details, timestamp: new Date().toISOString() });
        } catch (error) {
            addToast("Görev geçmişi kaydedilemedi.", 'error');
        }
    }, [saveTaskHistoryEntry, addToast]);
    
    const checkAppointmentOnBackend = useCallback(async (person: Person, account: Account) => {
        addLog('info', `[${person.fullName}] Backend'e görev gönderiliyor...`);
        try {
            const response = await fetch(`${settings.apiUrl}/check-appointment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ person, account }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.log || 'Unknown backend error');
            
            addLog(result.available ? 'success' : 'info', `[${person.fullName}] Backend Raporu: ${result.log}`);

            if (result.available) {
                 // The worker found an appointment, now the main thread handles the notification and state update.
                const toastMsg = `FIRSAT: ${person.fullName} için randevu bulundu! Detay: ${result.appointmentDetails}`;
                
                if (settings.browserNotify && Notification.permission === 'granted') {
                    new Notification('RANDEVU BULUNDU!', { body: toastMsg });
                }
                if (settings.soundNotify) {
                    criticalNotifyAudioRef.current?.play();
                }
                addToast(toastMsg, 'success', 10000);

                const updatedPerson = { ...person, taskStatus: TaskStatus.ActionRequired, bookedDate: result.foundDate, appointmentDetails: result.appointmentDetails };
                await logStatusChange(person.id!, person.taskStatus, TaskStatus.ActionRequired, `Slot bulundu: ${result.appointmentDetails}`);
                await savePerson(updatedPerson);
                setPersons(prev => prev.map(p => p.id === person.id ? updatedPerson : p));
            }

        } catch (error) {
            addLog('error', `[${person.fullName}] Backend ile iletişimde hata: ${error instanceof Error ? error.message : String(error)}`);
        }
    }, [settings.apiUrl, settings.browserNotify, settings.soundNotify, addLog, addToast, savePerson, logStatusChange]);

    const workerCallbacks = {
        onLog: addLog,
        onNextRunUpdate: setNextRunTime,
        onBackendCheck: checkAppointmentOnBackend,
    };
    const { postCommand } = useAgentWorker(workerCallbacks);

    // CRUD operations...
    const handleSavePerson = async (person: Person) => {
        const isUpdating = !!person.id;
        const oldStatus = isUpdating ? persons.find(p => p.id === person.id)?.taskStatus : undefined;
        let newStatus = oldStatus ?? (globalStatus === 'running' ? TaskStatus.Running : TaskStatus.Ready);
        
        const personToSave = { ...person, taskStatus: newStatus };

        await savePerson(personToSave);
        if (isUpdating && oldStatus && oldStatus !== newStatus) {
            await logStatusChange(person.id!, oldStatus, newStatus, 'Formdan manuel güncellendi.');
        }
        const updatedPersons = await getPersons();
        setPersons(updatedPersons);
        addToast(`'${person.fullName}' başarıyla ${isUpdating ? 'güncellendi' : 'eklendi'}.`, 'success');
        setPersonToEdit(null);
    };

    const handleDeletePerson = async (id: number) => {
        await deletePerson(id);
        setPersons(await getPersons());
    };
    
    const handleSaveAccount = async (account: Account) => {
        await saveAccount(account);
        setAccounts(await getAccounts());
    };
    
    const handleDeleteAccount = async (id: number) => {
        await deleteAccount(id);
        setAccounts(await getAccounts());
    };
    
    const handleSettingsChange = async (newSettings: AppSettings) => {
        setSettings(newSettings);
        for (const [key, value] of Object.entries(newSettings)) {
            await saveSetting(key as keyof AppSettings, value);
        }
    };
    
    const updateTaskStatus = async (id: number, newStatus: TaskStatus, details: string) => {
        const person = persons.find(p => p.id === id);
        if (!person) return;
        
        await logStatusChange(id, person.taskStatus, newStatus, details);
        const updatedPerson = { ...person, taskStatus: newStatus };
        await savePerson(updatedPerson);
        setPersons(prev => prev.map(p => p.id === id ? updatedPerson : p));
    };

    const handleMarkAsCompleted = (id: number) => updateTaskStatus(id, TaskStatus.Completed, 'Kullanıcı tarafından manuel tamamlandı.');
    const handleRequeueTask = (id: number) => updateTaskStatus(id, globalStatus === 'running' ? TaskStatus.Running : TaskStatus.Ready, 'Kullanıcı tarafından yeniden sıraya alındı.');

    const updateAllTasks = async (newStatus: TaskStatus, condition?: TaskStatus) => {
        const updatedPersons = await Promise.all(persons.map(async p => {
            if (p.taskStatus !== TaskStatus.Completed && (!condition || p.taskStatus === condition) && p.taskStatus !== newStatus) {
                await logStatusChange(p.id!, p.taskStatus, newStatus, 'Toplu işlemle güncellendi.');
                return { ...p, taskStatus: newStatus };
            }
            return p;
        }));
        await Promise.all(updatedPersons.map(p => savePerson(p)));
        setPersons(updatedPersons);
        return updatedPersons;
    };
    
    const handleStartAll = async () => {
        if (!apiStatus.ok) {
            addToast('Backend sunucusu aktif değil! Lütfen önce sunucuyu başlatın.', 'error');
            return;
        }
        if (!window.confirm("İzlemeyi başlatmak istediğinizden emin misiniz?")) return;
        setIsBulkUpdating(true);
        const updated = await updateAllTasks(TaskStatus.Running);
        setGlobalStatus('running');
        postCommand('start', { tasks: updated, accounts, settings: { ...settings, status: 'running' } });
        setIsBulkUpdating(false);
    };
    // ... handlePauseAll, handleStopAll similar to previous versions but with API checks...
    const handlePauseAll = async () => {
        if (!window.confirm("Duraklatmak istediğinizden emin misiniz?")) return;
        setIsBulkUpdating(true);
        await updateAllTasks(TaskStatus.Paused, TaskStatus.Running);
        setGlobalStatus('paused');
        postCommand('stop');
        setIsBulkUpdating(false);
    }
    const handleStopAll = async () => {
        if (!window.confirm("Durdurmak istediğinizden emin misiniz?")) return;
        setIsBulkUpdating(true);
        await updateAllTasks(TaskStatus.Ready);
        setGlobalStatus('stopped');
        postCommand('stop');
        setIsBulkUpdating(false);
    }

    const handleShowHistory = async (person: Person) => {
        const history = await getTaskHistory(person.id!);
        setTaskHistory(history);
        setHistoryPerson(person);
    };

    return (
        <div className="container mx-auto p-4 max-w-7xl">
            <audio ref={criticalNotifyAudioRef} src="https://actions.google.com/sounds/v1/alarms/crystal_ring.ogg" preload="auto" />
            <ToastContainer toasts={toasts} onDismiss={dismissToast} />
            {isAccountModalOpen && <AccountModal accounts={accounts} onSave={handleSaveAccount} onDelete={handleDeleteAccount} onClose={() => setIsAccountModalOpen(false)} />}
            {historyPerson && <TaskHistoryModal person={historyPerson} history={taskHistory} onClose={() => setHistoryPerson(null)}/>}
            
            <Header isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} onShowAccountModal={() => setIsAccountModalOpen(true)} />

            <main className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3">
                    <PersonForm accounts={accounts} onSave={handleSavePerson} onBulkAdd={()=>{/* Implement bulk add with account assignment logic */}} personToEdit={personToEdit} onClearForm={() => setPersonToEdit(null)} />
                    <TaskList persons={persons} accounts={accounts} onEdit={setPersonToEdit} onDelete={handleDeletePerson} onMarkAsCompleted={handleMarkAsCompleted} onRequeueTask={handleRequeueTask} onShowHistory={handleShowHistory} />
                </div>
                <div className="lg:col-span-2">
                    <SettingsAndControls settings={settings} onSettingsChange={handleSettingsChange} globalStatus={globalStatus} apiStatus={apiStatus} nextRunTime={nextRunTime} isBulkUpdating={isBulkUpdating} onStartAll={handleStartAll} onPauseAll={handlePauseAll} onStopAll={handleStopAll} />
                    <LogPanel logs={logs} />
                </div>
            </main>
        </div>
    );
};

export default App;
