import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, Badge, EmptyState, Spinner, Select } from '@/components/ui';
import type { Profile } from '@/lib/types';
import { Users, GraduationCap, ShieldCheck } from 'lucide-react';

export function AdminUsersTab() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (roleFilter !== 'all') query = query.eq('role', roleFilter);
    const { data } = await query;
    if (data) setUsers(data as Profile[]);
    setLoading(false);
  }, [roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const roleConfig = {
    student: { label: 'Student', variant: 'info' as const, icon: GraduationCap },
    mentor: { label: 'Mentor', variant: 'default' as const, icon: Users },
    admin: { label: 'Admin', variant: 'success' as const, icon: ShieldCheck },
  };

  if (loading) {
    return <div className="flex justify-center py-16"><Spinner className="w-6 h-6" /></div>;
  }

  const counts = users.reduce(
    (acc, u) => { acc[u.role] = (acc[u.role] || 0) + 1; return acc; },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center">
          <div className="text-white/40 text-xs mb-1">Students</div>
          <div className="text-white text-xl font-bold">{counts.student || 0}</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-white/40 text-xs mb-1">Mentors</div>
          <div className="text-white text-xl font-bold">{counts.mentor || 0}</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-white/40 text-xs mb-1">Admins</div>
          <div className="text-white text-xl font-bold">{counts.admin || 0}</div>
        </Card>
      </div>

      <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="max-w-xs">
        <option value="all">All Roles</option>
        <option value="student">Students</option>
        <option value="mentor">Mentors</option>
        <option value="admin">Admins</option>
      </Select>

      {users.length === 0 ? (
        <EmptyState icon={<Users size={32} />} title="No users found" description="Users will appear here once they sign up." />
      ) : (
        <div className="space-y-2">
          {users.map((user) => {
            const config = roleConfig[user.role];
            const RoleIcon = config.icon;
            return (
              <Card key={user.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} className="w-10 h-10 rounded-full object-cover" alt="" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/60 font-bold text-sm">
                      {user.full_name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <div>
                    <div className="text-white text-sm font-medium">{user.full_name}</div>
                    <div className="text-white/30 text-xs">{user.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {user.is_active ? (
                    <Badge variant="success">Active</Badge>
                  ) : (
                    <Badge variant="error">Inactive</Badge>
                  )}
                  <Badge variant={config.variant}>
                    <RoleIcon size={12} /> {config.label}
                  </Badge>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
