import { useTheme } from '../ThemeContext';
import { motion } from 'motion/react';

export function RamadanBackground() {
  const { isNight } = useTheme();

  // Generate random stars
  const stars = Array.from({ length: 50 }).map((_, i) => ({
    id: i,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    size: Math.random() * 2 + 1,
    duration: Math.random() * 3 + 2,
    delay: Math.random() * 5,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Stars - only visible in night mode */}
      {isNight && (
        <div className="absolute inset-0">
          {stars.map((star) => (
            <motion.div
              key={star.id}
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: [0.2, 0.8, 0.2],
                scale: [1, 1.2, 1]
              }}
              transition={{
                duration: star.duration,
                repeat: Infinity,
                delay: star.delay,
                ease: "easeInOut"
              }}
              className="absolute bg-amber-200 rounded-full"
              style={{
                top: star.top,
                left: star.left,
                width: star.size,
                height: star.size,
                boxShadow: '0 0 4px rgba(253, 230, 138, 0.8)'
              }}
            />
          ))}
        </div>
      )}

      {/* Crescent Moon */}
      <motion.div
        initial={{ opacity: 0, x: 50, y: -50 }}
        animate={{ opacity: isNight ? 0.8 : 0.1, x: 0, y: 0 }}
        transition={{ duration: 2, ease: "easeOut" }}
        className="absolute top-10 right-10 w-24 h-24"
      >
        <div className={`w-20 h-20 rounded-full ${isNight ? 'bg-amber-100' : 'bg-stone-300'} relative`}>
          <div className={`absolute -top-2 -left-4 w-20 h-20 rounded-full ${isNight ? 'bg-slate-950' : 'bg-stone-50'}`} />
        </div>
      </motion.div>

      {/* Decorative Lanterns (Lights) */}
      <div className="absolute top-0 left-0 right-0 flex justify-around px-10">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 50, 
              damping: 20, 
              delay: i * 0.2 
            }}
            className="relative flex flex-col items-center"
          >
            {/* String */}
            <div className={`w-px h-20 ${isNight ? 'bg-amber-900/50' : 'bg-stone-300'}`} />
            
            {/* Lantern Body */}
            <motion.div
              animate={{ 
                rotate: [-2, 2, -2],
                y: [0, 5, 0]
              }}
              transition={{
                duration: 4 + i,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className={`w-10 h-16 rounded-lg border-2 relative flex items-center justify-center ${
                isNight 
                  ? 'bg-amber-900/20 border-amber-600/50 shadow-[0_0_20px_rgba(217,119,6,0.2)]' 
                  : 'bg-stone-100 border-stone-300'
              }`}
            >
              {/* Light inside */}
              <motion.div
                animate={{ 
                  opacity: [0.4, 0.8, 0.4],
                  scale: [0.8, 1.1, 0.8]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className={`w-4 h-8 rounded-full blur-sm ${isNight ? 'bg-amber-400' : 'bg-amber-200'}`}
              />
              
              {/* Decorative details */}
              <div className={`absolute top-0 left-0 right-0 h-2 border-b ${isNight ? 'border-amber-600/50' : 'border-stone-300'}`} />
              <div className={`absolute bottom-0 left-0 right-0 h-2 border-t ${isNight ? 'border-amber-600/50' : 'border-stone-300'}`} />
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* Subtle Gradient Overlays */}
      <div className={`absolute inset-0 transition-opacity duration-1000 ${
        isNight 
          ? 'bg-radial-[at_50%_0%] from-amber-900/10 via-transparent to-transparent opacity-100' 
          : 'opacity-0'
      }`} />

      {/* Ramadan Kareem Text - Very subtle */}
      <div className="absolute bottom-10 left-0 right-0 flex justify-center opacity-10 select-none">
        <h2 className={`text-4xl md:text-6xl font-serif italic ${isNight ? 'text-amber-200' : 'text-stone-400'}`}>
          Ramadan Kareem
        </h2>
      </div>
    </div>
  );
}
