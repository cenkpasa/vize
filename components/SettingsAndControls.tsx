
import React from 'react';
import { AppSettings, GlobalStatus } from '../types';

interface SettingsAndControlsProps {
    settings: AppSettings;
    onSettingsChange: (newSettings: AppSettings) => void;
    globalStatus: GlobalStatus;
    apiStatus: { ok: boolean; message: string };
    nextRunTime: number | null;
    isBulkUpdating: boolean;
    onStartAll: () => void;
    onPauseAll: () => void;
    onStopAll: () => void;
}

const statusInfo: { [key in GlobalStatus]: { text: string; dotClass: string } } = {
    running: { text: 'Çalışıyor', dotClass: 'bg-green-500 animate-pulse-green' },
    paused: { text: 'Duraklatıldı', dotClass: 'bg-yellow-500' },
    stopped: { text: 'Durduruldu', dotClass: 'bg-red-500' },
};

const ToggleSwitch: React.FC<{ label: string; checked: boolean; onChange: (checked: boolean) => void }> = ({ label, checked, onChange }) => (
    <label className="flex items-center cursor-pointer">
        <div className="relative">
            <input type="checkbox" className="sr-only" checked={checked} onChange={e => onChange(e.target.checked)} />
            <div className={`block w-12 h-6 rounded-full transition ${checked ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'translate-x-6' : ''}`}></div>
        </div>
        <div className="ml-3 text-sm text-gray-700 dark:text-gray-300">{label}</div>
    </label>
);


export const SettingsAndControls: React.FC<SettingsAndControlsProps> = ({
    settings, onSettingsChange, globalStatus, apiStatus, nextRunTime, isBulkUpdating, onStartAll, onPauseAll, onStopAll
}) => {
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onSettingsChange({ ...settings, [e.target.name]: e.target.type === 'number' ? Number(e.target.value) : e.target.value });
    };

    const handleToggleChange = (key: keyof AppSettings, checked: boolean) => {
        onSettingsChange({ ...settings, [key]: checked });
    }

    return (
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
             <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Ajan ve Global Ayarlar</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="sm:col-span-2">
                        <label htmlFor="apiUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Backend Sunucu Adresi <span className="text-red-500">*</span>
                        </label>
                        <input type="text" name="apiUrl" id="apiUrl" value={settings.apiUrl}
                               onChange={handleChange} className="mt-1 w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"/>
                        <p className={`mt-1 text-xs ${apiStatus.ok ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                           API Durumu: {apiStatus.message}
                        </p>
                    </div>
                     <div>
                        <label htmlFor="pollInterval" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Kontrol Aralığı (sn) <span className="text-red-500">*</span>
                        </label>
                        <input type="number" name="pollInterval" id="pollInterval" value={settings.pollInterval} min="30"
                               onChange={handleChange} className="mt-1 w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"/>
                    </div>
                    <div>
                        <label htmlFor="pollJitter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Jitter (±sn)
                        </label>
                        <input type="number" name="pollJitter" id="pollJitter" value={settings.pollJitter} min="0"
                               onChange={handleChange} className="mt-1 w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"/>
                    </div>
                    <div className="col-span-1 sm:col-span-2 space-y-3 pt-2">
                        <ToggleSwitch label="Masaüstü bildirimleri" checked={settings.browserNotify} onChange={(c) => handleToggleChange('browserNotify', c)} />
                        <ToggleSwitch label="Sesli uyarı" checked={settings.soundNotify} onChange={(c) => handleToggleChange('soundNotify', c)} />
                    </div>
                </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-800/50 backdrop-blur-sm p-4 border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                        <span className={`w-3 h-3 rounded-full mr-2 ${statusInfo[globalStatus].dotClass}`}></span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">Durum: {statusInfo[globalStatus].text}</span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                        Sonraki kontrol: {nextRunTime ? new Date(nextRunTime).toLocaleTimeString('tr-TR') : '-'}
                    </div>
                </div>
                 <div className="grid grid-cols-3 gap-2">
                    <button onClick={onStartAll} className="px-4 py-2 text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none disabled:bg-green-400 disabled:cursor-not-allowed" disabled={isBulkUpdating || globalStatus === 'running'}>
                        Başlat
                    </button>
                    <button onClick={onPauseAll} className="px-4 py-2 text-sm font-medium rounded-md text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none disabled:bg-yellow-300 disabled:cursor-not-allowed" disabled={isBulkUpdating || globalStatus !== 'running'}>
                        Duraklat
                    </button>
                    <button onClick={onStopAll} className="px-4 py-2 text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none disabled:bg-red-400 disabled:cursor-not-allowed" disabled={isBulkUpdating || globalStatus === 'stopped'}>
                        Durdur
                    </button>
                </div>
            </div>
        </div>
    );
};
