import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { Logo } from '@/components/Logo';
import { Badge } from '@/components/ui';
import type { Notification } from '@/lib/types';
import { Bell, LogOut, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface DashboardLayoutProps {
  navItems: NavItem[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
  roleLabel: string;
}

export function DashboardLayout({ navItems, activeTab, onTabChange, children, roleLabel }: DashboardLayoutProps) {
  const { profile, signOut } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase.from('notifications').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(20);
    if (data) setNotifications(data as Notification[]);
  }, [profile]);

  useEffect(() => {
    fetchNotifications();
    if (!profile) return;
    const channel = supabase.channel('notifications-channel').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` }, fetchNotifications).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchNotifications, profile]);

  const unreadCount = notifications.filter((notification) => !notification.is_read).length;
  const markAllRead = async () => {
    if (!profile) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', profile.id).eq('is_read', false);
    fetchNotifications();
  };

  return <div className="theme-page bg-grid">
    {sidebarOpen && <div className="fixed inset-0 z-30 bg-slate-900/25 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />}
    <aside className={cn('fixed top-0 left-0 z-40 h-screen w-64 bg-white/72 border-r border-white/80 flex flex-col transition-transform duration-300 shadow-xl shadow-sky-900/10 backdrop-blur-xl lg:translate-x-0', sidebarOpen ? 'translate-x-0' : '-translate-x-full')}>
      <div className="p-5 border-b border-sky-900/10"><div className="flex items-center gap-2.5"><Logo size={32} className="text-sky-700" /><div className="leading-tight"><div className="text-slate-800 font-extrabold text-sm">Mento</div><div className="text-slate-500 text-[10px] tracking-wider uppercase">Grow together</div></div></div></div>
      <div className="p-3 border-b border-sky-900/10"><div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-white/60">{profile?.avatar_url ? <img src={profile.avatar_url} alt={profile.full_name} className="w-9 h-9 rounded-full object-cover" /> : <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 text-sm font-bold">{profile?.full_name?.charAt(0).toUpperCase() || 'U'}</div>}<div className="flex-1 min-w-0"><div className="text-slate-800 text-sm font-bold truncate">{profile?.full_name}</div><div className="text-slate-500 text-xs">{roleLabel}</div></div></div></div>
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">{navItems.map((item) => { const Icon = item.icon; const isActive = activeTab === item.id; return <button key={item.id} onClick={() => { onTabChange(item.id); setSidebarOpen(false); }} className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all', isActive ? 'bg-gradient-to-r from-sky-500 to-emerald-400 !text-white shadow-md shadow-sky-500/20' : 'text-slate-600 hover:text-sky-800 hover:bg-white/70')}><Icon size={18} />{item.label}</button>; })}</nav>
      <div className="p-3 border-t border-sky-900/10"><button onClick={() => signOut()} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:text-rose-700 hover:bg-rose-50 transition-all"><LogOut size={18} />Sign Out</button></div>
    </aside>
    <div className="lg:ml-64">
      <header className="sticky top-0 z-20 bg-white/60 backdrop-blur-xl border-b border-white/70"><div className="flex items-center justify-between px-4 sm:px-6 py-3.5"><div className="flex items-center gap-3"><button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden text-slate-600 hover:text-sky-700">{sidebarOpen ? <X size={20} /> : <Menu size={20} />}</button><h1 className="text-slate-800 font-extrabold text-base sm:text-lg">{navItems.find((item) => item.id === activeTab)?.label || 'Dashboard'}</h1></div><div className="relative"><button onClick={() => { setShowNotifPanel(!showNotifPanel); if (!showNotifPanel && unreadCount > 0) markAllRead(); }} className="relative p-2 rounded-xl text-slate-600 hover:text-sky-700 hover:bg-white/70 transition-all"><Bell size={20} />{unreadCount > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-gradient-to-r from-sky-500 to-emerald-400 !text-white text-[10px] font-bold rounded-full flex items-center justify-center">{unreadCount > 9 ? '9+' : unreadCount}</span>}</button>{showNotifPanel && <div className="absolute right-0 top-full mt-2 w-[min(20rem,calc(100vw-2rem))] bg-white/95 border border-white rounded-2xl shadow-2xl shadow-sky-900/15 overflow-hidden animate-slideDown z-50"><div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between"><span className="text-slate-800 font-extrabold text-sm">Notifications</span>{unreadCount > 0 && <Badge variant="info">{unreadCount} new</Badge>}</div><div className="max-h-96 overflow-y-auto">{notifications.length === 0 ? <div className="px-4 py-8 text-center text-slate-500 text-sm">No notifications yet</div> : notifications.map((notification) => <div key={notification.id} className={cn('px-4 py-3 border-b border-slate-100 hover:bg-sky-50 transition-colors', !notification.is_read && 'bg-sky-50')}><div className="text-slate-800 text-sm font-bold">{notification.title}</div>{notification.body && <div className="text-slate-500 text-xs mt-0.5">{notification.body}</div>}<div className="text-slate-400 text-[10px] mt-1">{new Date(notification.created_at).toLocaleString()}</div></div>)}</div></div>}</div></div></header>
      <main className="p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  </div>;
}
