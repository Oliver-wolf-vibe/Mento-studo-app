import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-sky-300/60';
  const variants = {
    primary: 'bg-gradient-to-r from-sky-500 to-emerald-400 !text-white shadow-lg shadow-sky-500/20 hover:brightness-105 active:scale-[0.98]',
    secondary: 'bg-white/75 text-slate-700 hover:bg-white border border-white/80 shadow-sm active:scale-[0.98]',
    outline: 'border border-sky-700/20 text-sky-800 hover:bg-white/70 active:scale-[0.98]',
    ghost: 'text-slate-600 hover:text-sky-800 hover:bg-white/60 active:scale-[0.98]',
    danger: 'bg-rose-500 !text-white hover:bg-rose-600 active:scale-[0.98]',
  };
  const sizes = { sm: 'text-xs px-3.5 py-2 gap-1.5', md: 'text-sm px-4 py-2.5 gap-2', lg: 'text-base px-6 py-3.5 gap-2' };
  return <button className={cn(baseClasses, variants[variant], sizes[size], className)} {...props}>{children}</button>;
}

interface CardProps { children: ReactNode; className?: string; onClick?: () => void; }
export function Card({ children, className = '', onClick }: CardProps) {
  return <div className={cn('glass-surface rounded-2xl', className)} onClick={onClick}>{children}</div>;
}

interface BadgeProps { children: ReactNode; variant?: 'default' | 'success' | 'warning' | 'error' | 'info'; className?: string; }
export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variants = { default: 'bg-slate-100/80 text-slate-600 border-slate-200', success: 'bg-emerald-100 text-emerald-700 border-emerald-200', warning: 'bg-amber-100 text-amber-700 border-amber-200', error: 'bg-rose-100 text-rose-700 border-rose-200', info: 'bg-sky-100 text-sky-700 border-sky-200' };
  return <span className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border', variants[variant], className)}>{children}</span>;
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { label?: string; error?: string; }
export function Input({ label, error, className = '', ...props }: InputProps) {
  return <div className="w-full">{label && <label className="block text-sm font-semibold text-slate-600 mb-1.5">{label}</label>}<input className={cn('w-full bg-white/70 border border-sky-900/10 rounded-xl px-3.5 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-400 transition-colors', error && 'border-rose-400', className)} {...props} />{error && <p className="mt-1 text-xs text-rose-600">{error}</p>}</div>;
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> { label?: string; error?: string; }
export function Textarea({ label, error, className = '', ...props }: TextareaProps) {
  return <div className="w-full">{label && <label className="block text-sm font-semibold text-slate-600 mb-1.5">{label}</label>}<textarea className={cn('w-full bg-white/70 border border-sky-900/10 rounded-xl px-3.5 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-400 transition-colors resize-y', error && 'border-rose-400', className)} {...props} />{error && <p className="mt-1 text-xs text-rose-600">{error}</p>}</div>;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> { label?: string; error?: string; children: ReactNode; }
export function Select({ label, error, className = '', children, ...props }: SelectProps) {
  return <div className="w-full">{label && <label className="block text-sm font-semibold text-slate-600 mb-1.5">{label}</label>}<select className={cn('w-full bg-white/70 border border-sky-900/10 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:border-sky-400 transition-colors', error && 'border-rose-400', className)} {...props}>{children}</select>{error && <p className="mt-1 text-xs text-rose-600">{error}</p>}</div>;
}

interface ModalProps { open: boolean; onClose: () => void; title: string; children: ReactNode; className?: string; }
export function Modal({ open, onClose, title, children, className = '' }: ModalProps) {
  if (!open) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/35 backdrop-blur-sm animate-fadeIn" onClick={onClose}><div className={cn('bg-white/95 border border-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slideUp shadow-2xl shadow-sky-900/20', className)} onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between p-5 border-b border-slate-200"><h3 className="text-lg font-bold text-slate-800">{title}</h3><button onClick={onClose} className="text-slate-400 hover:text-slate-800 transition-colors p-1" aria-label="Close dialog"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg></button></div><div className="p-5">{children}</div></div></div>;
}

export function EmptyState({ icon, title, description }: { icon?: ReactNode; title: string; description?: string }) {
  return <div className="flex flex-col items-center justify-center py-16 text-center">{icon && <div className="text-sky-500/50 mb-4">{icon}</div>}<h3 className="text-slate-700 font-semibold text-sm">{title}</h3>{description && <p className="text-slate-500 text-xs mt-1 max-w-sm">{description}</p>}</div>;
}

export function Spinner({ className = '' }: { className?: string }) { return <div className={cn('inline-block animate-spin rounded-full border-2 border-sky-200 border-t-sky-600', className)} />; }
export function PageLoader() { return <div className="theme-page flex items-center justify-center"><Spinner className="w-8 h-8" /></div>; }
