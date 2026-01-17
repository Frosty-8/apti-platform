// src/theme/ThemeProvider.jsx
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {},
  setTheme: (_t) => {}
})

export function ThemeProvider({ children }) {
  // initial: try to read localStorage, otherwise null so we can reflect pre-theme
  const [theme, setThemeState] = useState(() => {
    try {
      return localStorage.getItem('theme') || null
    } catch (e) {
      return null
    }
  })

  const applyTheme = useCallback((next) => {
    try {
      if (next === 'dark') document.documentElement.classList.add('dark')
      else document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', next)
    } catch (e) {
      // ignore (localStorage disabled)
    }
    setThemeState(next)
  }, [])

  const toggleTheme = useCallback(() => {
    const current = (theme === null)
      ? (document.documentElement.classList.contains('dark') ? 'dark' : 'light')
      : theme
    const next = current === 'dark' ? 'light' : 'dark'
    applyTheme(next)
  }, [theme, applyTheme])

  const setTheme = useCallback((t) => {
    if (t !== 'dark' && t !== 'light') return
    applyTheme(t)
  }, [applyTheme])

  useEffect(() => {
    // Sync with pre-theme script or saved value on mount
    try {
      if (theme === null) {
        const htmlHasDark = document.documentElement.classList.contains('dark')
        setThemeState(htmlHasDark ? 'dark' : 'light')
      } else {
        // ensure html class matches stored theme
        if (theme === 'dark' && !document.documentElement.classList.contains('dark')) {
          document.documentElement.classList.add('dark')
        }
        if (theme === 'light' && document.documentElement.classList.contains('dark')) {
          document.documentElement.classList.remove('dark')
        }
      }
    } catch (e) {}
    // expose toggle for quick debug (remove in prod)
    // eslint-disable-next-line no-undef
    try { window.__theme_toggle__ = toggleTheme } catch(e) {}
    return () => {
      try { delete window.__theme_toggle__ } catch(e) {}
    }
  }, [theme, toggleTheme])

  return (
    <ThemeContext.Provider value={{ theme: theme || (document.documentElement.classList.contains('dark') ? 'dark' : 'light'), toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
