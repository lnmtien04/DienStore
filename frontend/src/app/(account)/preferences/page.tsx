'use client';

import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';

export default function PreferencesPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null; // Tránh hydration mismatch

  const themes = [
    { key: 'light', label: 'Sáng', icon: SunIcon },
    { key: 'dark', label: 'Tối', icon: MoonIcon },
    { key: 'system', label: 'Theo hệ thống', icon: ComputerDesktopIcon },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Giao diện</h2>
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="space-y-3">
          {themes.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTheme(key)}
              className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                <span className="font-medium text-gray-900 dark:text-white">{label}</span>
              </div>
              {theme === key && (
                <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400"></div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}