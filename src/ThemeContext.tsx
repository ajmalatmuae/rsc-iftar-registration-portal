import { createContext, useContext, useEffect, useState } from 'react';

type ThemeContextType = {
  isNight: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isNight, setIsNight] = useState(false);

  useEffect(() => {
    const checkTime = () => {
      const hour = new Date().getHours();
      // Night is considered from 18:00 (6 PM) to 05:00 (5 AM)
      setIsNight(hour >= 18 || hour < 5);
    };
    checkTime();
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => setIsNight((prev) => !prev);

  return (
    <ThemeContext.Provider value={{ isNight, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
