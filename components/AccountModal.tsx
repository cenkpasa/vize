
import React, { useState } from 'react';
import { Account } from '../types';

interface AccountModalProps {
  accounts: Account[];
  onSave: (account: Account) => void;
  onDelete: (id: number) => void;
  onClose: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({ accounts, onSave, onDelete, onClose }) => {
  const [newAccount, setNewAccount] = useState<Omit<Account, 'id'>>({ portal: 'idata', username: '', password: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setNewAccount({ ...newAccount, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAccount.username && newAccount.password) {
      onSave(newAccount as Account);
      setNewAccount({ portal: 'idata', username: '', password: '' });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Portal Hesap Yönetimi</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <div className="p-6">
            <div className="bg-yellow-100 dark:bg-yellow-900/50 border-l-4 border-yellow-500 text-yellow-700 dark:text-yellow-200 p-3 text-sm rounded-md mb-4">
                <b>Güvenlik Notu:</b> Bu bilgiler sadece sizin bilgisayarınızın tarayıcısında saklanmaktadır. Backend sunucusu bu şifreyi sadece otomasyon sırasında kullanır ve asla kaydetmez.
            </div>
            <h3 className="font-semibold text-lg mb-2 text-gray-800 dark:text-gray-200">Yeni Hesap Ekle</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                <div className="md:col-span-1">
                    <label className="text-sm">Portal</label>
                    <select name="portal" value={newAccount.portal} onChange={handleChange} className="form-input mt-1">
                        <option value="idata">iDATA</option>
                        <option value="vfs">VFS Global</option>
                    </select>
                </div>
                 <div className="md:col-span-1">
                    <label className="text-sm">Kullanıcı Adı (E-posta)</label>
                    <input type="text" name="username" value={newAccount.username} onChange={handleChange} required className="form-input mt-1"/>
                </div>
                 <div className="md:col-span-1">
                    <label className="text-sm">Şifre</label>
                    <input type="password" name="password" value={newAccount.password} onChange={handleChange} required className="form-input mt-1"/>
                </div>
                <button type="submit" className="px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">Ekle</button>
            </form>
            
            <hr className="my-6 dark:border-gray-600"/>

            <h3 className="font-semibold text-lg mb-2 text-gray-800 dark:text-gray-200">Kayıtlı Hesaplar</h3>
            <div className="overflow-y-auto max-h-48">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left text-gray-600 dark:text-gray-400">
                            <th className="py-2">Portal</th><th className="py-2">Kullanıcı Adı</th><th className="py-2">İşlem</th>
                        </tr>
                    </thead>
                    <tbody>
                        {accounts.map(acc => (
                            <tr key={acc.id} className="border-t dark:border-gray-700">
                                <td className="py-2">{acc.portal.toUpperCase()}</td>
                                <td className="py-2 font-mono">{acc.username}</td>
                                <td>
                                    <button onClick={() => onDelete(acc.id!)} className="text-red-500 hover:text-red-700 text-xs">Sil</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {accounts.length === 0 && <p className="text-center text-sm text-gray-500 py-4">Kayıtlı hesap bulunmuyor.</p>}
            </div>
        </div>
      </div>
    </div>
  );
};
