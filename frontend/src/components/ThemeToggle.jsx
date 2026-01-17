// src/components/ThemeToggle.jsx
import React from 'react'
import { useTheme } from '../theme/ThemeProvider'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={() => {
        try {
          toggleTheme()
        } catch (e) {
          console.error('toggleTheme error', e)
        }
      }}
      className="w-full md:w-auto flex items-center gap-2 justify-center px-3 py-2 rounded-md border hover:shadow-sm bg-white dark:bg-slate-900 text-sm"
      aria-pressed={theme === 'dark'}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-sky-400" viewBox="0 0 20 20" fill="currentColor"><path d="M17.293 13.293A8 8 0 116.707 2.707 7 7 0 0017.293 13.293z" /></svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-500" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zM10 16a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM4.22 4.22a1 1 0 011.42 0L6.64 5.22a1 1 0 01-1.42 1.42L4.22 5.64a1 1 0 010-1.42zM14.36 14.36a1 1 0 011.42 0l1 1a1 1 0 11-1.42 1.42l-1-1a1 1 0 010-1.42z" /><path d="M10 6a4 4 0 100 8 4 4 0 000-8z" /></svg>
      )}
      <span>{theme === 'dark' ? 'Dark' : 'Light'}</span>
    </button>
  )
}
