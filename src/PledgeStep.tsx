import { useState } from 'react';
import { useTheme } from './ThemeContext';
import { motion } from 'motion/react';
import { Heart, Utensils, ArrowRight, ArrowLeft } from 'lucide-react';
import confetti from 'canvas-confetti';

export function PledgeStep({ onPledge, onSkip, onBack }: { onPledge: (amount: number) => void; onSkip: () => void; onBack: () => void }) {
  const { isNight } = useTheme();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const amounts = [
    { value: 1, label: '1 Kit', price: 'AED 8' },
    { value: 5, label: '5 Kits', price: 'AED 40' },
    { value: 10, label: '10 Kits', price: 'AED 80' },
    { value: 50, label: '50 Kits', price: 'AED 400' },
  ];

  const handlePledge = () => {
    if (!selectedAmount) return;
    
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      // Trigger confetti
      const colors = isNight ? ['#fbbf24', '#f59e0b', '#d97706'] : ['#10b981', '#34d399', '#059669'];
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: colors
      });
      
      setTimeout(() => {
        onPledge(selectedAmount);
      }, 1500);
    }, 1000);
  };

  return (
    <motion.div
      className={`p-8 md:p-12 rounded-3xl border shadow-xl text-center ${
        isNight
          ? 'bg-slate-900/80 border-slate-800 backdrop-blur-xl shadow-amber-900/5'
          : 'bg-white border-stone-100 shadow-stone-200/50'
      }`}
    >
      <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6 ${
        isNight ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-100 text-rose-500'
      }`}>
        <Heart className="w-10 h-10" />
      </div>

      <h2 className={`text-3xl md:text-4xl font-serif mb-4 ${
        isNight ? 'text-amber-400' : 'text-stone-900'
      }`}>
        Campus Iftar Pledge
      </h2>
      
      <div className={`max-w-2xl mx-auto mb-10 space-y-4 ${
        isNight ? 'text-amber-200/70' : 'text-stone-500'
      }`}>
        <p className="text-lg">
          Join Risala Study Circle (RSC) and SSF in providing iftar to over 46,500 students across 641+ global campuses.
        </p>
        <p className="text-md italic opacity-90">
          "The one who facilitates the breaking of the fast receives the same reward as the one who observes it, without diminishing the reward of the fasting person." (Tirmidhi)
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {amounts.map((amount) => (
          <button
            key={amount.value}
            onClick={() => {
              setSelectedAmount(amount.value);
              setCustomAmount('');
            }}
            className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${
              selectedAmount === amount.value
                ? isNight
                  ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                  : 'border-indigo-500 bg-indigo-50 text-indigo-700'
                : isNight
                  ? 'border-slate-700 hover:border-slate-600 bg-slate-800/50 text-slate-300'
                  : 'border-stone-200 hover:border-stone-300 bg-stone-50 text-stone-600'
            }`}
          >
            <Utensils className="w-6 h-6 mb-1 opacity-70" />
            <span className="font-bold text-lg">{amount.label}</span>
            <span className="text-sm opacity-70">{amount.price}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center justify-center gap-4 w-full pb-4">
        <div className="flex flex-row items-center justify-center gap-2 md:gap-4 w-full">
          <div className="flex items-center gap-2 shrink-0">
            <input
              type="number"
              min="1"
              placeholder="No. of kits"
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value);
                const val = parseInt(e.target.value);
                setSelectedAmount(isNaN(val) || val <= 0 ? null : val);
              }}
              className={`w-28 md:w-36 px-3 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all text-center text-sm md:text-base ${
                isNight
                  ? 'bg-slate-800/50 border-slate-700 text-amber-50 focus:ring-amber-500/50 focus:border-amber-500/50 placeholder-slate-500'
                  : 'bg-white border-stone-200 text-stone-900 focus:ring-indigo-500/50 focus:border-indigo-500/50 placeholder-stone-400'
              }`}
            />
          </div>
          
          <button
            onClick={handlePledge}
            disabled={!selectedAmount || isProcessing}
            className={`px-4 md:px-6 py-3 rounded-xl font-medium text-sm md:text-base flex items-center justify-center gap-2 transition-all shrink-0 ${
              !selectedAmount
                ? isNight ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                : isNight
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-900 shadow-lg shadow-amber-500/20'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20'
            }`}
          >
            {isProcessing ? (
              <span className="animate-pulse">Processing...</span>
            ) : (
              <>
                Confirm <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
        
        <button
          onClick={onSkip}
          className={`px-4 md:px-6 py-3 rounded-xl font-medium transition-colors shrink-0 text-sm md:text-base ${
            isNight
              ? 'text-slate-400 hover:text-slate-300 hover:bg-slate-800'
              : 'text-stone-500 hover:text-stone-700 hover:bg-stone-100'
          }`}
        >
          Skip for now
        </button>
      </div>
    </motion.div>
  );
}
