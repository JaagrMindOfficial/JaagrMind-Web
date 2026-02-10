'use client';

import { useTheme } from './ThemeProvider';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Only show actual theme after hydration to prevent mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const themes = [
    { id: 'light' as const, label: 'Light', icon: Sun },
    { id: 'dark' as const, label: 'Dark', icon: Moon },
    { id: 'system' as const, label: 'System', icon: Monitor },
  ];

  // Always render Sun on server and initial client to prevent hydration mismatch
  // Only show actual icon after mount
  const CurrentIcon = mounted ? (resolvedTheme === 'dark' ? Moon : Sun) : Sun;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-accent/10 transition-colors"
        aria-label="Toggle theme"
      >
        <CurrentIcon className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-36 py-2 bg-background rounded-xl border border-border shadow-lg z-50">
          {themes.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                setTheme(id);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                theme === id
                  ? 'text-accent bg-accent/10'
                  : 'text-foreground hover:bg-accent/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {theme === id && (
                <span className="ml-auto text-accent">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
