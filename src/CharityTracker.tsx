import { useTheme } from './ThemeContext';
import { motion } from 'motion/react';
import { Heart } from 'lucide-react';

export function CharityTracker({ meals }: { meals: number }) {
  const { isNight } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl p-6 md:p-8 text-center border ${
        isNight
          ? 'bg-slate-900/50 border-amber-500/20 backdrop-blur-xl'
          : 'bg-white border-stone-200 shadow-sm'
      }`}
    >
      <div className="flex flex-col items-center justify-center gap-4 relative z-10">
        <div className={`p-4 rounded-full ${
          isNight ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-100 text-rose-500'
        }`}>
          <Heart className="w-8 h-8" />
        </div>
        
        <div>
          <h3 className={`text-sm uppercase tracking-widest font-semibold mb-2 ${
            isNight ? 'text-amber-200/60' : 'text-stone-500'
          }`}>
            Collective Impact
          </h3>
          <div className="flex items-baseline justify-center gap-2">
            <motion.span
              key={meals}
              initial={{ scale: 1.5, color: '#10b981' }}
              animate={{ scale: 1, color: isNight ? '#fbbf24' : '#1c1917' }}
              className={`text-5xl md:text-7xl font-serif font-bold ${
                isNight ? 'text-amber-400' : 'text-stone-900'
              }`}
            >
              {meals}
            </motion.span>
            <span className={`text-xl md:text-2xl font-light ${
              isNight ? 'text-amber-200/80' : 'text-stone-600'
            }`}>
              meals pledged
            </span>
          </div>
        </div>
        
        <p className={`text-sm max-w-md mx-auto mt-2 ${
          isNight ? 'text-slate-400' : 'text-stone-500'
        }`}>
          Supporting RSC and SSF to provide iftar for students across global campuses this Ramadan.
        </p>
      </div>

      {/* Decorative background elements */}
      {isNight && (
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
      )}
    </motion.div>
  );
}
