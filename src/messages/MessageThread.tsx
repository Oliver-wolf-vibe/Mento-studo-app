import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth/AuthContext';
import { Button, EmptyState } from '@/components/ui';
import type { Message } from '@/lib/types';
import { Send, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageThreadProps {
  matchId: string;
  otherPersonName: string;
}

export function MessageThread({ matchId, otherPersonName }: MessageThreadProps) {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true });
    if (data) setMessages(data as Message[]);
    setLoading(false);
  }, [matchId]);

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel(`messages-${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`,
        },
        () => fetchMessages()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMessages, matchId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !profile) return;

    const content = newMessage.trim();
    setNewMessage('');

    const { error } = await supabase.from('messages').insert({
      match_id: matchId,
      sender_id: profile.id,
      content,
    });

    if (error) {
      setNewMessage(content);
    } else {
      // Create notification for the other person
      const { data: matchData } = await supabase
        .from('matches')
        .select('student_id, mentor_id')
        .eq('id', matchId)
        .maybeSingle();

      if (matchData) {
        const recipientId =
          matchData.student_id === profile.id ? matchData.mentor_id : matchData.student_id;
        await supabase.from('notifications').insert({
          user_id: recipientId,
          type: 'new_message',
          title: `New message from ${profile.full_name}`,
          body: content.length > 60 ? content.substring(0, 60) + '...' : content,
          related_id: matchId,
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="inline-block animate-spin rounded-full border-2 border-white/20 border-t-white w-6 h-6" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[500px]">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
        <MessageSquare size={18} className="text-white/60" />
        <span className="text-white font-medium text-sm">Chat with {otherPersonName}</span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <EmptyState
            icon={<MessageSquare size={32} />}
            title="No messages yet"
            description="Start the conversation by sending a message below."
          />
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_id === profile?.id;
            return (
              <div
                key={msg.id}
                className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={cn(
                    'max-w-[75%] px-4 py-2.5 rounded-2xl text-sm animate-slideUp',
                    isOwn
                      ? 'bg-white text-black rounded-br-md'
                      : 'bg-neutral-800 text-white rounded-bl-md'
                  )}
                >
                  <p className="break-words">{msg.content}</p>
                  <p
                    className={cn(
                      'text-[10px] mt-1',
                      isOwn ? 'text-black/40' : 'text-white/30'
                    )}
                  >
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSend} className="p-3 border-t border-white/10 flex gap-2">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-neutral-800 border border-white/10 rounded-lg px-3.5 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
        />
        <Button type="submit" size="md" disabled={!newMessage.trim()}>
          <Send size={16} />
        </Button>
      </form>
    </div>
  );
}
