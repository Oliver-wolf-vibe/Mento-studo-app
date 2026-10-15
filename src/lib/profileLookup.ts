import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/types';

export async function fetchProfilesByIds(userIds: string[]) {
  const ids = [...new Set(userIds)];
  if (ids.length === 0) {
    return { profiles: new Map<string, Profile>(), error: null };
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .in('id', ids);

  return {
    profiles: new Map((data || []).map((profile) => [profile.id, profile as Profile])),
    error: error?.message || null,
  };
}
