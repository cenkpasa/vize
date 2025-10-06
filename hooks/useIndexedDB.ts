
import { useState, useEffect, useCallback } from 'react';
import { DB_CONFIG } from '../constants';
import { Person, AppSettings, TaskHistoryEntry, Account } from '../types';

type Store = typeof DB_CONFIG.PERSONS_STORE | typeof DB_CONFIG.SETTINGS_STORE | typeof DB_CONFIG.HISTORY_STORE | typeof DB_CONFIG.ACCOUNTS_STORE;

const useIndexedDB = () => {
  const [db, setDb] = useState<IDBDatabase | null>(null);

  useEffect(() => {
    const request = indexedDB.open(DB_CONFIG.NAME, DB_CONFIG.VERSION);

    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      if (!dbInstance.objectStoreNames.contains(DB_CONFIG.PERSONS_STORE)) {
        dbInstance.createObjectStore(DB_CONFIG.PERSONS_STORE, { keyPath: 'id', autoIncrement: true });
      }
      if (!dbInstance.objectStoreNames.contains(DB_CONFIG.ACCOUNTS_STORE)) {
        dbInstance.createObjectStore(DB_CONFIG.ACCOUNTS_STORE, { keyPath: 'id', autoIncrement: true });
      }
      if (!dbInstance.objectStoreNames.contains(DB_CONFIG.SETTINGS_STORE)) {
        dbInstance.createObjectStore(DB_CONFIG.SETTINGS_STORE, { keyPath: 'key' });
      }
      if (!dbInstance.objectStoreNames.contains(DB_CONFIG.HISTORY_STORE)) {
        const historyStore = dbInstance.createObjectStore(DB_CONFIG.HISTORY_STORE, { keyPath: 'id', autoIncrement: true });
        historyStore.createIndex('personId', 'personId', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      setDb((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      console.error("IndexedDB error:", (event.target as IDBOpenDBRequest).error);
    };

    return () => {
      if (db) {
        db.close();
      }
    };
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const performDbOperation = useCallback(<T,>(
    storeName: Store,
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => IDBRequest | IDBIndex
  ): Promise<T> => {
    return new Promise((resolve, reject) => {
      if (!db) {
        return reject('DB not initialized');
      }
      try {
        const transaction = db.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);
        const request = operation(store);
        
        transaction.oncomplete = () => {
          resolve((request as IDBRequest).result as T);
        };
        transaction.onerror = () => {
          reject(transaction.error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }, [db]);

  // Person operations
  const getPersons = useCallback((): Promise<Person[]> => performDbOperation<Person[]>(DB_CONFIG.PERSONS_STORE, 'readonly', store => store.getAll()), [performDbOperation]);
  const savePerson = useCallback((person: Person): Promise<number> => performDbOperation<number>(DB_CONFIG.PERSONS_STORE, 'readwrite', store => store.put(person)), [performDbOperation]);
  const deletePerson = useCallback((id: number): Promise<void> => performDbOperation<void>(DB_CONFIG.PERSONS_STORE, 'readwrite', store => store.delete(id)), [performDbOperation]);
  
  // Account operations
  const getAccounts = useCallback((): Promise<Account[]> => performDbOperation<Account[]>(DB_CONFIG.ACCOUNTS_STORE, 'readonly', store => store.getAll()), [performDbOperation]);
  const saveAccount = useCallback((account: Account): Promise<number> => performDbOperation<number>(DB_CONFIG.ACCOUNTS_STORE, 'readwrite', store => store.put(account)), [performDbOperation]);
  const deleteAccount = useCallback((id: number): Promise<void> => performDbOperation<void>(DB_CONFIG.ACCOUNTS_STORE, 'readwrite', store => store.delete(id)), [performDbOperation]);

  // Settings operations
  const getSettings = useCallback(async (): Promise<Partial<AppSettings>> => {
    const settingsArray = await performDbOperation<{key: keyof AppSettings, value: any}[]>(DB_CONFIG.SETTINGS_STORE, 'readonly', store => store.getAll());
    return settingsArray.reduce((acc, setting) => {
        (acc as any)[setting.key] = setting.value;
        return acc;
    }, {} as Partial<AppSettings>);
  }, [performDbOperation]);
  const saveSetting = useCallback((key: keyof AppSettings, value: any): Promise<string> => performDbOperation<string>(DB_CONFIG.SETTINGS_STORE, 'readwrite', store => store.put({ key, value })), [performDbOperation]);

  // History operations
  const saveTaskHistoryEntry = useCallback((entry: TaskHistoryEntry): Promise<number> => performDbOperation<number>(DB_CONFIG.HISTORY_STORE, 'readwrite', store => store.add(entry)), [performDbOperation]);
  const getTaskHistory = useCallback((personId: number): Promise<TaskHistoryEntry[]> => performDbOperation<TaskHistoryEntry[]>(DB_CONFIG.HISTORY_STORE, 'readonly', store => store.index('personId').getAll(personId)), [performDbOperation]);


  return { db, getPersons, savePerson, deletePerson, getAccounts, saveAccount, deleteAccount, getSettings, saveSetting, saveTaskHistoryEntry, getTaskHistory };
};

export default useIndexedDB;
