import { useEffect, useRef, useState } from 'react';
import { CornerDownLeft, Search } from 'lucide-react';
import { navigateCurrentTab } from '../lib/browser';
import { resolveSearch } from '../lib/navigation';
import { useLumoraStore } from '../store/useLumoraStore';

export default function SearchBar() {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const engine = useLumoraStore((state) => state.settings.searchEngine);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping = target?.matches('input, textarea, select, [contenteditable="true"]');
      if (event.key === '/' && !isTyping) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const url = resolveSearch(value, engine);
    if (!url) return;
    setValue('');
    inputRef.current?.blur();
    void navigateCurrentTab(url);
  };

  return (
    <form className="search-bar glass-panel" onSubmit={submit} role="search">
      <Search size={17} strokeWidth={1.6} aria-hidden="true" />
      <input
        ref={inputRef}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search or enter address"
        aria-label="Search or enter address"
        autoComplete="off"
        spellCheck={false}
      />
      {value ? (
        <button type="submit" className="search-enter" aria-label="Submit search">
          <CornerDownLeft size={15} strokeWidth={1.6} />
        </button>
      ) : (
        <kbd>/</kbd>
      )}
    </form>
  );
}
