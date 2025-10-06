
import React from 'react';
import { ToastMessage } from '../types';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: number) => void;
}

const toastStyles = {
    info: { bg: 'bg-blue-500', icon: 'ℹ️' },
    success: { bg: 'bg-green-500', icon: '✅' },
    warning: { bg: 'bg-yellow-500', icon: '⚠️' },
    error: { bg: 'bg-red-500', icon: '❌' },
};

const Toast: React.FC<{ message: ToastMessage; onDismiss: (id: number) => void }> = ({ message, onDismiss }) => {
    const { type, bg, icon } = { type: message.type, ...toastStyles[message.type] };

    React.useEffect(() => {
        const timer = setTimeout(() => {
            onDismiss(message.id);
        }, message.duration || 5000);

        return () => clearTimeout(timer);
    }, [message, onDismiss]);

    return (
        <div className={`flex items-center p-4 mb-4 text-white rounded-lg shadow-lg ${bg} transition-all duration-300 transform animate-fade-in-right`}>
            <style>{`
            @keyframes fade-in-right {
                from { opacity: 0; transform: translateX(100%); }
                to { opacity: 1; transform: translateX(0); }
            }
            .animate-fade-in-right { animation: fade-in-right 0.3s ease-out forwards; }
            `}</style>
            <span className="mr-3 text-xl">{icon}</span>
            <div className="flex-1 text-sm font-medium">{message.message}</div>
            <button onClick={() => onDismiss(message.id)} className="ml-4 -mr-2 p-1.5 text-white rounded-lg hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
            </button>
        </div>
    );
};


export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
    return (
        <div className="fixed top-5 right-5 z-50 w-full max-w-xs">
            {toasts.map(toast => (
                <Toast key={toast.id} message={toast} onDismiss={onDismiss} />
            ))}
        </div>
    );
};
