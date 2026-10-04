'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import type { CoolList } from '@/lib/cool';
import type { PrivateEntry } from '@/lib/privateLibrary';

// The private library entries, once a visitor has typed the password into the
// library title. Held in memory only, so a reload locks it again. It lives
// above the card because the title (in the card) unlocks what the list (in the
// page) shows.

type Unlock = (password: string) => Promise<'ok' | 'wrong' | 'error'>;

const PrivateLibraryContext = createContext<{ entries: PrivateEntry[] | null; unlock: Unlock }>({
  entries: null,
  unlock: async () => 'error',
});

export function PrivateLibraryProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<PrivateEntry[] | null>(null);

  const unlock = useCallback<Unlock>(async (password) => {
    try {
      const response = await fetch('/api/library/private', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (response.status === 401) return 'wrong';
      if (!response.ok) return 'error';
      setEntries(((await response.json()) as { entries: PrivateEntry[] }).entries);
      return 'ok';
    } catch {
      return 'error';
    }
  }, []);

  return (
    <PrivateLibraryContext.Provider value={{ entries, unlock }}>
      {children}
    </PrivateLibraryContext.Provider>
  );
}

/** Puts each private entry back where it sat in its list; orphans are skipped. */
function mergePrivate(lists: CoolList[], entries: PrivateEntry[]): CoolList[] {
  const merged = lists.map((list) => ({ ...list, items: [...list.items] }));
  for (const { list: listId, index, item } of [...entries].sort((a, b) => a.index - b.index)) {
    const list = merged.find((candidate) => candidate.id === listId);
    if (!list) continue;
    list.items.splice(Math.min(index, list.items.length), 0, { ...item, private: true });
  }
  return merged;
}

/** The lists with the private entries in them, once unlocked. */
export function useLibraryLists(lists: CoolList[]): CoolList[] {
  const { entries } = useContext(PrivateLibraryContext);
  return entries ? mergePrivate(lists, entries) : lists;
}

const WRONG_MS = 900;

/**
 * The library tab's heading, with nothing to say it does anything: clicking it
 * swaps the word for a password field. Enter sends it; escape, or leaving the
 * field empty, puts the word back. Once unlocked it is just the heading again.
 */
export function LibraryTitle({ children }: { children: ReactNode }) {
  const { entries, unlock } = useContext(PrivateLibraryContext);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [state, setState] = useState<'idle' | 'checking' | 'wrong' | 'error'>('idle');

  const close = () => {
    setOpen(false);
    setValue('');
    setState('idle');
  };

  const onKeyDown = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') return close();
    if (e.key !== 'Enter' || !value || state === 'checking') return;
    setState('checking');
    const result = await unlock(value);
    if (result === 'ok') return close();
    setValue('');
    setState(result);
    if (result === 'wrong') setTimeout(() => setState((s) => (s === 'wrong' ? 'idle' : s)), WRONG_MS);
  };

  if (!open || entries) {
    return (
      <span onClick={entries ? undefined : () => setOpen(true)}>{children}</span>
    );
  }

  return (
    <input
      className="vault-input"
      data-state={state}
      type="password"
      autoFocus
      autoComplete="off"
      spellCheck={false}
      aria-label="password"
      placeholder={
        state === 'wrong' ? 'nope' : state === 'error' ? 'try again later' : 'for your eyes only'
      }
      value={value}
      // readOnly rather than disabled: disabling drops focus, and a wrong
      // guess should leave the field ready for the next one
      readOnly={state === 'checking'}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={onKeyDown}
      onBlur={() => {
        if (!value && state !== 'checking') close();
      }}
    />
  );
}
