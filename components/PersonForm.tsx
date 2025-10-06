import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Person, TaskStatus, Account } from '../types';
import { CENTERS_TR, COUNTRY_PORTAL_MAP } from '../constants';
import * as XLSX from 'xlsx';

interface PersonFormProps {
  accounts: Account[];
  onSave: (person: Person) => Promise<void>;
  onBulkAdd: (persons: Omit<Person, 'id' | 'taskStatus'>[]) => void;
  personToEdit: Person | null;
  onClearForm: () => void;
}

const initialFormData: Person = {
  accountId: null,
  fullName: '',
  passportNo: '',
  birthDate: '',
  country: '',
  city: '',
  center: '',
  earliestDate: '',
  latestDate: '',
  appointmentDetails: '',
  taskStatus: TaskStatus.Ready,
};

const Spinner = () => (
  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export const PersonForm: React.FC<PersonFormProps> = ({ accounts, onSave, onBulkAdd, personToEdit, onClearForm }) => {
  const [formData, setFormData] = useState<Person>(initialFormData);
  const [availableCenters, setAvailableCenters] = useState<string[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // FIX: Moved `updateCenters` before `useEffect` to resolve block-scoped variable usage before declaration.
  const updateCenters = useCallback((cityName: string) => {
    const centers = CENTERS_TR.centers[cityName as keyof typeof CENTERS_TR.centers] || [];
    setAvailableCenters(centers);
  }, []);

  useEffect(() => {
    if (personToEdit) {
      setFormData(personToEdit);
      updateCenters(personToEdit.city);
      const portal = COUNTRY_PORTAL_MAP[personToEdit.country];
      if (portal) {
        setFilteredAccounts(accounts.filter(a => a.portal === portal));
      }
    } else {
      setFormData(initialFormData);
      setAvailableCenters([]);
      setFilteredAccounts(accounts);
    }
  }, [personToEdit, accounts, updateCenters]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let newFormData = { ...formData, [name]: value };

    if (name === 'city') {
      updateCenters(value);
      newFormData.center = '';
    }

    if (name === 'country') {
      const portal = COUNTRY_PORTAL_MAP[value];
      setFilteredAccounts(portal ? accounts.filter(a => a.portal === portal) : accounts);
      newFormData.accountId = null; // Reset account selection when country changes
    }
    
    setFormData(newFormData);
  };
  
  const handleDownloadSample = () => {
    // Note: Sample format is simplified as accounts are managed in-app
    const ws_data = [
        ["fullName", "passportNo", "birthDate", "country", "city", "center", "earliestDate", "latestDate"],
        ["Ali Veli", "A12345678", "1990-01-01", "DE", "İstanbul", "iDATA İstanbul Avrupa", "2025-11-01", "2025-11-30"]
    ];
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sablon");
    XLSX.writeFile(wb, "Randevu_Sablonu.xlsx");
  };

  const handleFileImportClick = () => {
    if (accounts.length === 0) {
      alert("Lütfen önce en az bir portal hesabı ekleyin.");
      return;
    }
    fileInputRef.current?.click();
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const data = e.target?.result;
              const workbook = XLSX.read(data, { type: 'binary' });
              const sheetName = workbook.SheetNames[0];
              const worksheet = workbook.Sheets[sheetName];
              const json = XLSX.utils.sheet_to_json(worksheet) as Omit<Person, 'id' | 'taskStatus' | 'accountId'>[];

              if (json.length > 0 && 'fullName' in json[0] && 'passportNo' in json[0]) {
                  // FIX: Added `accountId: null` to each person object from the imported file to match the expected type for `onBulkAdd`.
                  onBulkAdd(json.map(p => ({...p, accountId: null})));
              } else {
                  throw new Error("Excel dosyası beklenen formatta değil.");
              }
          } catch (error) {
              alert(`Dosya okunurken hata: ${error instanceof Error ? error.message : String(error)}`);
          } finally {
            if(fileInputRef.current) fileInputRef.current.value = "";
          }
      };
      reader.readAsBinaryString(file);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!e.currentTarget.checkValidity()) return;
    setIsSubmitting(true);
    try {
        await onSave({
            ...formData,
            accountId: Number(formData.accountId)
        });
        setFormData(initialFormData);
        onClearForm();
    } catch (error) {
        console.error("Save failed:", error);
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const InputField: React.FC<{name: keyof Person, label: string, type?: string, required?: boolean, list?: string, children?: React.ReactNode}> = ({ name, label, type = 'text', required = false, list, children }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="mt-1">
            {children ? (
                 <select id={name} name={name} value={String(formData[name] || '')} onChange={handleChange} required={required} className="form-select">
                    {children}
                 </select>
            ) : (
                <input type={type} id={name} name={name} value={String(formData[name] || '')} onChange={handleChange} required={required} list={list} className="form-input"/>
            )}
        </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Kişi Ekleme ve Güncelleme</h2>
          <div className="flex gap-2">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".xlsx, .xls, .csv"/>
            <button type="button" onClick={handleFileImportClick} className="text-sm bg-green-100 dark:bg-green-900/50 hover:bg-green-200 dark:hover:bg-green-800/50 text-green-800 dark:text-green-200 font-semibold py-1 px-3 rounded-md transition duration-150 ease-in-out">
                Excel'den Yükle
            </button>
            <button type="button" onClick={handleDownloadSample} className="text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold py-1 px-3 rounded-md transition duration-150 ease-in-out">
                Örnek Excel
            </button>
          </div>
      </div>

      <style>{`.form-input, .form-select { display: block; width: 100%; padding: 0.5rem 0.75rem; font-size: 0.875rem; line-height: 1.25rem; color: #1f2937; background-color: #fff; border: 1px solid #d1d5db; border-radius: 0.375rem; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); } .dark .form-input, .dark .form-select { color: #d1d5db; background-color: #374151; border-color: #4b5563; } .form-input:focus, .form-select:focus { outline: none; border-color: #4f46e5; box-shadow: 0 0 0 2px #c7d2fe; }`}</style>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="md:col-span-3"><InputField name="fullName" label="Ad Soyad" required /></div>
        <div className="md:col-span-2"><InputField name="passportNo" label="Pasaport No" required /></div>
        <div className="md:col-span-1"><InputField name="birthDate" label="Doğum Tarihi" type="date" required /></div>
        
        <div className="md:col-span-6 border-t border-gray-200 dark:border-gray-700 my-2"></div>
        
        <div className="md:col-span-2"><InputField name="country" label="Ülke" required>
                <option value="">Seçin…</option><option value="DE">Almanya</option><option value="IT">İtalya</option><option value="ES">İspanya</option><option value="FR">Fransa</option><option value="NL">Hollanda</option><option value="BE">Belçika</option><option value="CZ">Çekya</option>
        </InputField></div>
        <div className="md:col-span-4"><InputField name="accountId" label="Portal Hesabı" required>
            <option value="">{formData.country ? 'Hesap Seçin...' : 'Önce Ülke Seçin'}</option>
            {filteredAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.username} ({acc.portal.toUpperCase()})</option>)}
        </InputField></div>
        
        <div className="md:col-span-3"><InputField name="city" label="Şehir" required list="cities-datalist" />
            <datalist id="cities-datalist">
                {CENTERS_TR.cities.map(c => <option key={c} value={c} />)}
            </datalist>
        </div>
        <div className="md:col-span-3"><InputField name="center" label="Merkez" required>
                <option value="">Seçin…</option>
                {availableCenters.map(c => <option key={c} value={c}>{c}</option>)}
        </InputField></div>

        <div className="md:col-span-3"><InputField name="earliestDate" label="En Erken Tarih" type="date" /></div>
        <div className="md:col-span-3"><InputField name="latestDate" label="En Geç Tarih" type="date" /></div>

        <div className="md:col-span-6 flex items-center space-x-3">
            <button type="submit" disabled={isSubmitting} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 dark:disabled:bg-indigo-800 disabled:cursor-not-allowed">
                {isSubmitting && <Spinner />}
                {formData.id ? 'Kişiyi Güncelle' : 'Kişi Ekle'}
            </button>
            <button type="button" onClick={onClearForm} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Formu Temizle
            </button>
        </div>
      </form>
    </div>
  );
};