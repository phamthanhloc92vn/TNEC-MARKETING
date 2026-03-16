'use client';

export default function Toast({ message, type = 'success' }) {
  const styles = {
    success: 'bg-emerald-500',
    error: 'bg-red-500',
    info: 'bg-indigo-500',
  };

  return (
    <div className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] ${styles[type]} text-white px-6 py-3 rounded-2xl shadow-xl text-sm font-medium animate-slide-up flex items-center gap-2`}>
      {type === 'success' && '✅'}
      {type === 'error' && '❌'}
      {type === 'info' && 'ℹ️'}
      <span>{message}</span>
    </div>
  );
}
