import { useCallback, useEffect, useRef, useState } from 'react';
import type { LumoraNotification } from '../types/lumora';

export interface NotificationItem extends LumoraNotification {
  exiting?: boolean;
}

type NotificationInput = Omit<LumoraNotification, 'id' | 'createdAt'>;

const createId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const useNotifications = () => {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const itemsRef = useRef<NotificationItem[]>([]);
  const timers = useRef(new Map<string, number>());

  const commit = useCallback((next: NotificationItem[]) => {
    itemsRef.current = next;
    setItems(next);
  }, []);

  const remove = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) window.clearTimeout(timer);
    timers.current.delete(id);
    commit(itemsRef.current.filter((item) => item.id !== id));
  }, [commit]);

  const scheduleRemove = useCallback((id: string) => {
    if (timers.current.has(id)) return;
    const timer = window.setTimeout(() => remove(id), 240);
    timers.current.set(id, timer);
  }, [remove]);

  const push = useCallback((input: NotificationInput) => {
    const active = itemsRef.current.filter((item) => !item.exiting);
    const overflow = active.length >= 3 ? active[active.length - 1] : undefined;
    const next: NotificationItem[] = [
      { ...input, id: createId(), createdAt: Date.now() },
      ...active.map((item) => item.id === overflow?.id ? { ...item, exiting: true } : item),
      ...itemsRef.current.filter((item) => item.exiting),
    ].slice(0, 4);
    commit(next);
    if (overflow) scheduleRemove(overflow.id);
  }, [commit, scheduleRemove]);

  const dismiss = useCallback((id: string) => {
    commit(itemsRef.current.map((item) => item.id === id ? { ...item, exiting: true } : item));
    scheduleRemove(id);
  }, [commit, scheduleRemove]);

  const clear = useCallback(() => {
    commit(itemsRef.current.map((item) => ({ ...item, exiting: true })));
    for (const item of itemsRef.current) scheduleRemove(item.id);
  }, [commit, scheduleRemove]);

  useEffect(() => () => {
    for (const timer of timers.current.values()) window.clearTimeout(timer);
  }, []);

  return { items, push, dismiss, clear };
};
