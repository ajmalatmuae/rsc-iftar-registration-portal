import { useState } from 'react';
import { useTheme } from './ThemeContext';
import { motion, AnimatePresence } from 'motion/react';
import { Moon, Sun, MapPin, Clock, Users, Phone } from 'lucide-react';
import { RegistrationForm } from './RegistrationForm';
import { PledgeStep } from './PledgeStep';
import { VenueTour } from './VenueTour';
import { Ticket } from './Ticket';
import { Countdown } from './Countdown';
import { RamadanBackground } from './components/RamadanBackground';

export function RegistrationPortal() {
  const { isNight, toggleTheme } = useTheme();
  const [step, setStep] = useState<'form' | 'pledge' | 'tour' | 'ticket'>('form');
  const [userData, setUserData] = useState<any>(null);
  const [pledgedMeals, setPledgedMeals] = useState(46500);
  const [showContact, setShowContact] = useState(false);

  const handleRegistration = async (data: any) => {
    const regId = `IFTAR-${data.phone?.slice(-4) || '0000'}-${Math.floor(1000 + Math.random() * 9000)}`;
    const fullData = { ...data, registrationId: data.registrationId || regId, date: new Date().toISOString() };
    setUserData(fullData);
    
    // We will save to Google Sheets AFTER the pledge step so we can capture the meals pledged
    setStep('pledge');
  };

  const handlePledge = async (amount: number) => {
    setPledgedMeals((prev) => prev + amount);
    
    // Update the user data with the pledged amount
    const updatedUserData = { ...userData, mealsPledged: amount };
    setUserData(updatedUserData);

    try {
      // Attempt to save to Google Sheets via backend
      await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedUserData),
      });
    } catch (error) {
      console.error('Failed to save registration with pledge:', error);
    }

    setStep('tour');
  };

  const handleSkipPledge = async () => {
    const updatedUserData = { ...userData, mealsPledged: 0 };
    setUserData(updatedUserData);

    try {
      // Attempt to save to Google Sheets via backend
      await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedUserData),
      });
    } catch (error) {
      console.error('Failed to save registration without pledge:', error);
    }

    setStep('tour');
  };

  const handleFinishTour = () => {
    setStep('ticket');
  };

  const handleBack = () => {
    if (step === 'pledge') setStep('form');
    if (step === 'tour') setStep('pledge');
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-1000 ${
        isNight
          ? 'bg-slate-950 text-amber-50'
          : 'bg-stone-50 text-stone-900'
      }`}
    >
      <RamadanBackground />
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 p-3 rounded-full bg-black/10 dark:bg-white/10 backdrop-blur-md z-50 hover:bg-black/20 dark:hover:bg-white/20 transition-colors"
        aria-label="Toggle Theme"
      >
        {isNight ? <Sun className="w-6 h-6 text-amber-400" /> : <Moon className="w-6 h-6 text-indigo-900" />}
      </button>

      {/* Hidden Admin Button */}
      <button 
        onClick={() => window.location.hash = '#admin'}
        className="fixed bottom-4 left-4 w-8 h-8 opacity-0 z-50 cursor-default"
        aria-label="Admin Dashboard"
      />

      {/* Contact Option */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
        <div className={`bg-amber-500 text-slate-900 px-4 py-3 rounded-2xl shadow-lg shadow-amber-500/20 transition-all font-medium whitespace-nowrap text-sm ${showContact ? 'opacity-100 pointer-events-auto translate-y-0' : 'opacity-0 pointer-events-none translate-y-2'}`}>
          <p className="mb-1 opacity-80">Need help?</p>
          <a href="tel:0565087764" className="block hover:underline">📞 0565087764</a>
          <a href="tel:0528082030" className="block hover:underline">📞 0528082030</a>
        </div>
        <button
          onClick={() => setShowContact(!showContact)}
          className="p-4 rounded-full bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/20 hover:bg-amber-400 transition-all flex items-center gap-2"
          aria-label="Contact Us"
        >
          <Phone className="w-5 h-5" />
        </button>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex justify-center mb-8"
          >
            <div className={`p-4 rounded-3xl backdrop-blur-sm ${isNight ? 'bg-white/10' : 'bg-white/50 shadow-sm'}`}>
              <img 
                src="https://lh3.googleusercontent.com/d/13L4kdEX64GtYiNyCZtH3eG9BJFZLrIf_" 
                alt="RSC Logo" 
                className="h-20 md:h-24 object-contain rounded-xl"
                referrerPolicy="no-referrer"
              />
            </div>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-3xl md:text-5xl font-serif mb-4 tracking-tight ${
              isNight ? 'text-amber-400' : 'text-stone-800'
            }`}
          >
            Iftar Gathering for Professionals
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className={`text-lg md:text-xl font-light ${isNight ? 'text-amber-200/70' : 'text-stone-500'}`}
          >
            A gathering of minds, a celebration of spirit.
          </motion.p>
          
          <div className="mt-8 flex flex-col md:flex-row items-center justify-center gap-6">
            <Countdown />
          </div>
        </header>

        {/* Main Content Area */}
        <main className="mt-12">
          <AnimatePresence mode="wait">
            {step === 'form' && (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <RegistrationForm onSubmit={handleRegistration} initialData={userData} />
              </motion.div>
            )}
            {step === 'pledge' && (
              <motion.div
                key="pledge"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <PledgeStep onPledge={handlePledge} onSkip={handleSkipPledge} onBack={handleBack} />
              </motion.div>
            )}
            {step === 'tour' && (
              <motion.div
                key="tour"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <VenueTour onComplete={handleFinishTour} onBack={handleBack} />
              </motion.div>
            )}
            {step === 'ticket' && (
              <motion.div
                key="ticket"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Ticket userData={userData} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
