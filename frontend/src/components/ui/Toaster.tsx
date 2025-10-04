'use client';

import { useState } from 'react';

interface ToastType {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}

// Simple toast implementation - in a real app you might want to use a library like react-hot-toast
export function Toaster() {
  const [toasts, setToasts] = useState<ToastType[]>([]);

  return (
    <div className="fixed bottom-0 right-0 z-50 p-4 space-y-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden ${
            toast.type === 'error' ? 'border-l-4 border-red-400' :
            toast.type === 'success' ? 'border-l-4 border-green-400' :
            toast.type === 'warning' ? 'border-l-4 border-yellow-400' :
            'border-l-4 border-blue-400'
          }`}
        >
          <div className="p-4">
            <div className="flex items-start">
              <div className="ml-3 w-0 flex-1 pt-0.5">
                <p className="text-sm font-medium text-gray-900">{toast.title}</p>
                {toast.message && (
                  <p className="mt-1 text-sm text-gray-500">{toast.message}</p>
                )}
              </div>
              <div className="ml-4 flex-shrink-0 flex">
                <button
                  className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-600"
                  onClick={() => {
                    setToasts(toasts.filter(t => t.id !== toast.id));
                  }}
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}