import { useState, useEffect } from 'react';
import { useTheme } from './ThemeContext';
import { Clock } from 'lucide-react';

export function Countdown() {
  const { isNight } = useTheme();
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      // Let's assume Maghrib is at 18:30 today
      const maghrib = new Date();
      maghrib.setHours(18, 30, 0, 0);

      if (now > maghrib) {
        // If it's past Maghrib today, set for tomorrow
        maghrib.setDate(maghrib.getDate() + 1);
      }

      const diff = maghrib.getTime() - now.getTime();
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`flex items-center gap-3 px-6 py-3 rounded-full border ${
      isNight 
        ? 'border-amber-500/30 bg-amber-500/10 text-amber-300' 
        : 'border-stone-200 bg-white text-stone-600 shadow-sm'
    }`}>
      <Clock className="w-5 h-5" />
      <span className="font-mono text-lg tracking-wider">{timeLeft}</span>
      <span className="text-sm uppercase tracking-widest opacity-70 ml-2">to Maghrib</span>
    </div>
  );
}
