import { useRef } from 'react';
import { useTheme } from './ThemeContext';
import { motion } from 'motion/react';
import { Download, CheckCircle2, Calendar, MapPin, Clock, Share2 } from 'lucide-react';
import Barcode from 'react-barcode';
import * as htmlToImage from 'html-to-image';

export function Ticket({ userData }: { userData: any }) {
  const { isNight } = useTheme();
  const ticketRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!ticketRef.current) return;
    
    try {
      const dataUrl = await htmlToImage.toPng(ticketRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: isNight ? '#020617' : '#fafaf9', // Provide a solid background to avoid transparency issues
        style: {
          margin: '0',
          transform: 'none',
        },
      });
      
      const link = document.createElement('a');
      link.download = `Iftar-Ticket-${userData?.registrationId || 'Guest'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download ticket:', err);
      alert('Failed to download ticket. Please try again.');
    }
  };

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
      className="max-w-full mx-auto px-2 sm:px-4 py-8 overflow-x-hidden flex flex-col items-center"
    >
      <div className="text-center mb-8 w-full max-w-[375px]">
        <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
          isNight ? 'bg-amber-500/20 text-amber-400' : 'bg-green-100 text-green-500'
        }`}>
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className={`text-2xl font-serif mb-1 ${
          isNight ? 'text-amber-400' : 'text-stone-900'
        }`}>
          Registration Complete
        </h2>
        <p className={`text-sm ${isNight ? 'text-amber-200/70' : 'text-stone-500'}`}>
          We look forward to welcoming you, {userData?.fullName?.split(' ')[0] || 'Guest'}.
        </p>
      </div>

      <div className="mb-6 flex flex-row gap-2 sm:gap-4 w-full max-w-[375px] px-2 sm:px-0">
        <button
          onClick={handleDownload}
          className={`flex-1 py-3 sm:py-4 px-2 sm:px-6 rounded-2xl font-medium text-sm sm:text-base flex items-center justify-center gap-1 sm:gap-2 transition-all ${
            isNight
              ? 'bg-amber-500 hover:bg-amber-400 text-slate-900 shadow-lg shadow-amber-500/20'
              : 'bg-stone-900 hover:bg-stone-800 text-white shadow-lg shadow-stone-900/20'
          }`}
        >
          <Download className="w-5 h-5" /> Download
        </button>
        <button
          onClick={handleShareLocation}
          className={`flex-1 py-3 sm:py-4 px-2 sm:px-6 rounded-2xl font-medium text-sm sm:text-base flex items-center justify-center gap-1 sm:gap-2 transition-all border-2 ${
            isNight
              ? 'border-amber-500 text-amber-500 hover:bg-amber-500/10'
              : 'border-stone-900 text-stone-900 hover:bg-stone-50'
          }`}
        >
          <Share2 className="w-5 h-5" /> Location
        </button>
      </div>

      <div className="flex justify-center w-full max-w-[375px] sm:max-w-none">
        <div className="w-full sm:w-auto transform scale-90 sm:scale-100 origin-top">
          {/* Wrapper for capture to include shadow and avoid flex cutoff */}
          <div ref={ticketRef} className={`p-4 sm:p-6 inline-block w-full sm:w-auto ${isNight ? 'bg-[#020617]' : 'bg-[#fafaf9]'}`}>
            <div 
              className={`relative overflow-hidden rounded-3xl border shadow-2xl w-full sm:w-[375px] shrink-0 ${
                isNight
                  ? 'bg-[#020617] border-slate-800'
                  : 'bg-white border-stone-200'
              }`}
              style={{ minHeight: '650px' }}
            >
              {/* Main Content */}
        <div className="p-8 h-full flex flex-col justify-between">
          <div className="flex-1">
            <div className="flex justify-between items-start mb-6">
              <img 
                src="https://lh3.googleusercontent.com/d/13L4kdEX64GtYiNyCZtH3eG9BJFZLrIf_" 
                alt="Logo" 
                className="h-12 object-contain"
                referrerPolicy="no-referrer"
              />
              <div className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase ${isNight ? 'bg-amber-500/20 text-amber-400' : 'bg-stone-100 text-stone-600'}`}>
                Official Entry
              </div>
            </div>
            <h3 className="text-[#f59e0b] text-3xl font-serif leading-tight mb-8">
              Exclusive Iftar<br />Gathering
            </h3>
            
            <div className="grid grid-cols-2 gap-4 mb-10">
              <div>
                <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] mb-2">Attendee</p>
                <p className={`font-medium text-xl mb-1 ${isNight ? 'text-white' : 'text-stone-900'}`}>
                  {userData?.fullName || 'Guest'}
                </p>
                <p className="text-slate-400 text-xs truncate">
                  {userData?.company || 'Professional'}
                </p>
              </div>
              <div>
                <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] mb-2">Details</p>
                <p className={`font-medium text-xl mb-1 ${isNight ? 'text-white' : 'text-stone-900'}`}>
                  {userData?.gender || 'Attendee'}, {userData?.age || '25'}
                </p>
                <p className="text-slate-400 text-xs truncate">
                  {userData?.area || 'Abu Dhabi'}
                </p>
              </div>
            </div>

            <div className="space-y-5 mt-auto mb-8">
              <div className="flex items-start gap-4">
                <Calendar className="w-5 h-5 text-[#f59e0b] mt-0.5 shrink-0" />
                <div className="text-slate-300 text-sm leading-relaxed">
                  Wednesday, March 11,<br />2026
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Clock className="w-5 h-5 text-[#f59e0b] shrink-0" />
                <div className="text-slate-300 text-sm">
                  17:30 – 21:00
                </div>
              </div>
              <div className="flex items-start gap-4">
                <MapPin className="w-5 h-5 text-[#f59e0b] mt-0.5 shrink-0" />
                <div className="text-slate-300 text-sm leading-relaxed">
                  ICF Hall, opposite Gems<br />Winchester School
                </div>
              </div>
            </div>
          </div>

          {/* Dashed Line with Cutouts */}
          <div className="relative h-px my-4">
            <div className={`absolute -left-12 -top-4 w-8 h-8 rounded-full ${isNight ? 'bg-slate-950' : 'bg-stone-100'}`}></div>
            <div className={`absolute -right-12 -top-4 w-8 h-8 rounded-full ${isNight ? 'bg-slate-950' : 'bg-stone-100'}`}></div>
            <div className="border-t border-dashed border-slate-800 w-full"></div>
          </div>

          {/* Barcode Section */}
          <div className="bg-[#e5e7eb] -mx-8 -mb-8 p-8 flex flex-col items-center justify-center mt-auto">
            <div className="w-full overflow-hidden flex justify-center">
              <Barcode 
                value={userData?.registrationId || 'IFTAR-0000-0000'} 
                width={1.8} 
                height={70} 
                displayValue={false} 
                background="transparent"
                lineColor="#000000"
                margin={0}
              />
            </div>
            <p className="text-stone-900 font-mono text-sm mt-4 tracking-[0.3em] font-medium">
              {userData?.registrationId || 'IFTAR-0000-0000'}
            </p>
          </div>
        </div>
      </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
