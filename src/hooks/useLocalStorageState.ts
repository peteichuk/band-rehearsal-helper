import { useState } from 'react';

export function useLocalStorageState<T>(key: string, initial: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored != null ? (JSON.parse(stored) as T) : initial;
    } catch {
      return initial;
    }
  });

  const setAndPersist = (next: T) => {
    setValue(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // ignore (e.g. storage disabled/full)
    }
  };

  return [value, setAndPersist];
}
