import { useState } from 'react';
import { useTheme } from './ThemeContext';
import { motion } from 'motion/react';
import { ArrowRight, ArrowLeft, Share2 } from 'lucide-react';

export function VenueTour({ onComplete, onBack }: { onComplete: () => void; onBack: () => void }) {
  const { isNight } = useTheme();
  const [hasInteracted, setHasInteracted] = useState(false);

  const handleShareLocation = async () => {
    const locationUrl = 'https://maps.google.com/maps?q=F9JC%2B29X,+Abu+Dhabi';
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Iftar Gathering Location',
          text: 'Join us for the Iftar Gathering at ICF Hall!',
          url: locationUrl,
        });
      } catch (err) {
        console.error('Error sharing location:', err);
      }
    } else {
      window.open(locationUrl, '_blank');
    }
  };

  return (
    <motion.div
      className={`p-6 md:p-10 rounded-3xl border shadow-xl overflow-hidden ${
        isNight
          ? 'bg-slate-900/80 border-slate-800 backdrop-blur-xl shadow-amber-900/5'
          : 'bg-white border-stone-100 shadow-stone-200/50'
      }`}
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className={`text-2xl md:text-3xl font-serif mb-2 ${
            isNight ? 'text-amber-400' : 'text-stone-900'
          }`}>
            Explore the Venue: IICC Hall
          </h2>
          <p className={`text-sm ${isNight ? 'text-amber-200/70' : 'text-stone-500'}`}>
            Located near Medeor Hospital. Use the map to explore the hall location and the nearby Abdul Khaliq Abdullah Alkhoori Masjid for prayer.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleShareLocation}
            className={`p-3 rounded-xl font-medium flex items-center justify-center transition-all border-2 ${
              isNight
                ? 'border-amber-500 text-amber-500 hover:bg-amber-500/10'
                : 'border-stone-900 text-stone-900 hover:bg-stone-50'
            }`}
            aria-label="Share Location"
            title="Share Location"
          >
            <Share2 className="w-5 h-5" />
          </button>
          <button
            onClick={onBack}
            className={`px-4 py-3 rounded-xl font-medium flex items-center gap-2 transition-all whitespace-nowrap ${
              isNight
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                : 'bg-stone-200 hover:bg-stone-300 text-stone-700'
            }`}
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <button
            onClick={onComplete}
            className={`px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all whitespace-nowrap ${
              isNight
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-900 shadow-lg shadow-amber-500/20'
                : 'bg-stone-900 hover:bg-stone-800 text-white shadow-lg shadow-stone-900/20'
            }`}
          >
            Finish <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div 
        className={`w-full h-[400px] md:h-[500px] rounded-2xl overflow-hidden relative border ${
          isNight ? 'border-slate-800 bg-slate-950' : 'border-stone-200 bg-stone-100'
        }`}
        onPointerDown={() => setHasInteracted(true)}
      >
        {!hasInteracted && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <div className={`px-4 py-2 rounded-full backdrop-blur-md animate-pulse ${
              isNight ? 'bg-amber-500/20 text-amber-300' : 'bg-stone-900/10 text-stone-700'
            }`}>
              Interact with map to explore
            </div>
          </div>
        )}
        
        <iframe
          title="Venue Map"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          src={`https://maps.google.com/maps?q=F9JC%2B29X,+Abu+Dhabi&t=k&z=17&output=embed`}
        ></iframe>
      </div>
    </motion.div>
  );
}
