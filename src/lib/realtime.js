import { useEffect, useRef } from 'react';
import { supabase } from './supabase';

// Subscribes to postgres_changes on a set of tables and calls onChange
// (debounced, so a burst of writes triggers one refetch, not N of them).
// subscriptions: [{ table, filter? }]. Pass a stable `enabled` to skip
// subscribing until prerequisites (e.g. a user id for the filter) are ready.
export function useLiveRefresh(channelName, subscriptions, onChange, enabled = true) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const filterKey = JSON.stringify(subscriptions);

  useEffect(() => {
    if (!enabled || !subscriptions || !subscriptions.length) return;
    let timer = null;
    const channel = supabase.channel(channelName);
    subscriptions.forEach(({ table, filter }) => {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table, ...(filter ? { filter } : {}) },
        () => {
          clearTimeout(timer);
          timer = setTimeout(() => onChangeRef.current(), 600);
        },
      );
    });
    channel.subscribe();
    return () => {
      clearTimeout(timer);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName, filterKey, enabled]);
}
