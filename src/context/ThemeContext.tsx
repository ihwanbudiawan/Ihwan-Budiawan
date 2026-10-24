import React, { createContext, useContext, useState, useEffect } from 'react';
import { NotificationSoundType, playAlertChime } from '../utils/notificationService';

export type ThemePalette =
  | 'pln-emerald'
  | 'cyber-dark'
  | 'deep-space'
  | 'electric-indigo'
  | 'sunset-amber'
  | 'light-clean';

export type BackgroundStyle =
  | 'solid'
  | 'blueprint'
  | 'mesh'
  | 'circuit'
  | 'custom';

export type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  themePalette: ThemePalette;
  isDark: boolean;
  backgroundStyle: BackgroundStyle;
  customBg: string;
  notificationSound: NotificationSoundType;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setThemePalette: (palette: ThemePalette) => void;
  setBackgroundStyle: (style: BackgroundStyle) => void;
  setCustomBg: (bg: string) => void;
  setNotificationSound: (sound: NotificationSoundType) => void;
  testSound: (sound?: NotificationSoundType) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  themePalette: 'pln-emerald',
  isDark: true,
  backgroundStyle: 'blueprint',
  customBg: '',
  notificationSound: 'chime',
  toggleTheme: () => {},
  setTheme: () => {},
  setThemePalette: () => {},
  setBackgroundStyle: () => {},
  setCustomBg: () => {},
  setNotificationSound: () => {},
  testSound: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themePalette, setThemePaletteState] = useState<ThemePalette>(() => {
    try {
      const saved = localStorage.getItem('amr_powereye_palette') as ThemePalette;
      if (saved) return saved;
    } catch (e) {
      /* ignore */
    }
    return 'pln-emerald';
  });

  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('amr_powereye_theme') as Theme;
      if (saved === 'light' || saved === 'dark') {
        return saved;
      }
    } catch (e) {
      // Fallback
    }
    return 'dark';
  });

  const [backgroundStyle, setBackgroundStyleState] = useState<BackgroundStyle>(() => {
    try {
      const saved = localStorage.getItem('amr_powereye_bg_style') as BackgroundStyle;
      if (saved) return saved;
    } catch (e) {
      /* ignore */
    }
    return 'blueprint';
  });

  const [customBg, setCustomBgState] = useState<string>(() => {
    try {
      return localStorage.getItem('amr_powereye_custom_bg') || '';
    } catch (e) {
      return '';
    }
  });

  const [notificationSound, setNotificationSoundState] = useState<NotificationSoundType>(() => {
    try {
      const saved = localStorage.getItem('amr_powereye_sound') as NotificationSoundType;
      if (saved) return saved;
    } catch (e) {
      /* ignore */
    }
    return 'chime';
  });

  const isDark = theme !== 'light' && themePalette !== 'light-clean';

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('amr_powereye_theme', newTheme);
      if (newTheme === 'light') {
        setThemePaletteState('light-clean');
      } else if (themePalette === 'light-clean') {
        setThemePaletteState('pln-emerald');
      }
    } catch (e) {
      /* ignore */
    }
  };

  const setThemePalette = (newPalette: ThemePalette) => {
    setThemePaletteState(newPalette);
    try {
      localStorage.setItem('amr_powereye_palette', newPalette);
      if (newPalette === 'light-clean') {
        setThemeState('light');
      } else {
        setThemeState('dark');
      }
    } catch (e) {
      /* ignore */
    }
  };

  const setBackgroundStyle = (style: BackgroundStyle) => {
    setBackgroundStyleState(style);
    try {
      localStorage.setItem('amr_powereye_bg_style', style);
    } catch (e) {
      /* ignore */
    }
  };

  const setCustomBg = (bg: string) => {
    setCustomBgState(bg);
    try {
      localStorage.setItem('amr_powereye_custom_bg', bg);
    } catch (e) {
      /* ignore */
    }
  };

  const setNotificationSound = (sound: NotificationSoundType) => {
    setNotificationSoundState(sound);
    try {
      localStorage.setItem('amr_powereye_sound', sound);
    } catch (e) {
      /* ignore */
    }
  };

  const testSound = (sound?: NotificationSoundType) => {
    playAlertChime('critical', sound || notificationSound);
  };

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  useEffect(() => {
    try {
      const root = document.documentElement;
      if (isDark) {
        root.classList.add('dark');
        root.classList.remove('light');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.remove('dark');
        root.classList.add('light');
        root.style.colorScheme = 'light';
      }
    } catch (e) {
      // Ignore
    }
  }, [isDark]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themePalette,
        isDark,
        backgroundStyle,
        customBg,
        notificationSound,
        toggleTheme,
        setTheme,
        setThemePalette,
        setBackgroundStyle,
        setCustomBg,
        setNotificationSound,
        testSound,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

