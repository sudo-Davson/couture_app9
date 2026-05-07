import React, { ButtonHTMLAttributes, InputHTMLAttributes } from 'react';

export function Card({ children, className = '', onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div onClick={onClick} className={`bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-sm border border-slate-100 dark:border-slate-800 p-4 ${onClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''} ${className}`}>
      {children}
    </div>
  );
}

export function Button({ children, variant = 'primary', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' }) {
  const base = "flex items-center justify-center font-bold rounded-2xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 py-3.5 px-4",
    secondary: "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 active:bg-slate-300 py-3.5 px-4",
    danger: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 active:bg-red-200 py-3.5 px-4",
    ghost: "text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 py-2 px-3",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement>, React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  multiline?: boolean;
}

export function Input({ label, error, multiline, className = '', ...props }: InputProps) {
  const inputClass = "w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-slate-900 dark:text-white font-medium placeholder:text-slate-400";
  
  return (
    <label className={`block space-y-1.5 ${className}`}>
      {label && <span className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">{label}</span>}
      {multiline ? (
        <textarea className={inputClass} {...(props as any)} />
      ) : (
        <input className={inputClass} {...props} />
      )}
      {error && <span className="text-xs text-red-500 ml-1">{error}</span>}
    </label>
  );
}

export function Badge({ children, variant = 'gray' }: { children: React.ReactNode; variant?: 'green' | 'blue' | 'gray' | 'orange' | 'red' }) {
  const variants = {
    green: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400",
    blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400",
    gray: "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300",
    orange: "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400",
    red: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400",
  };
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${variants[variant]}`}>
      {children}
    </span>
  );
}
