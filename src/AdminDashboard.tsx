import { useState, useMemo, useEffect, useRef } from 'react';
import { useTheme } from './ThemeContext';
import { motion } from 'motion/react';
import { Users, MapPin, Briefcase, ArrowLeft, Download, Search, CheckCircle2, QrCode, LogOut, Trash2 } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { RamadanBackground } from './components/RamadanBackground';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

// Mock data generator
const generateMockData = () => {
  const areas = ['Al Wahda South', 'Al Wahda North', 'Khalidiya', 'Nadisiya', 'Khaleefa City', 'Muroor', 'Madina Zayed', 'Other'];
  const categories = [
    'Legal & Financial Experts',
    'Business & Management Professionals',
    'IT & Digital Experts',
    'Healthcare Professionals',
    'Engineers & Technologists',
    'Educators & Academicians'
  ];
  
  return Array.from({ length: 156 }).map((_, i) => {
    const phone = `050${Math.floor(1000000 + Math.random() * 9000000)}`;
    return {
      id: i + 1,
      registrationId: `IFTAR-${phone.slice(-4)}-${1000 + i}`,
      fullName: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      phone: phone,
      company: `Company ${Math.floor(Math.random() * 50) + 1}`,
      category: categories[Math.floor(Math.random() * categories.length)],
      area: areas[Math.floor(Math.random() * areas.length)],
      age: Math.floor(Math.random() * 16) + 18, // 18-34
      date: new Date(Date.now() - Math.random() * 10000000000).toISOString().split('T')[0],
      attended: Math.random() > 0.8, // 20% attended for mock
      whatsapp: `+971 ${phone.slice(1)}`,
      mealsPledged: Math.floor(Math.random() * 5) * 10,
      musandamTrip: Math.random() > 0.5 ? 'Yes' : 'No'
    };
  });
};

const mockData = generateMockData();

const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#14b8a6', '#f97316'];

export function AdminDashboard({ onBack }: { onBack: () => void }) {
  const { isNight } = useTheme();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tableSearchQuery, setTableSearchQuery] = useState('');
  const [scannerActive, setScannerActive] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const playBeep = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    
    // Resume context if suspended (browser policy)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
    
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.1);
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
    const fetchData = async () => {
      try {
        const response = await fetch('/api/registrations');
        const result = await response.json();
        
        if (result.status === 'success' && result.data && result.data.length > 0) {
          setData(result.data);
        } else {
          // Fallback to mock data if API returns empty or fails
          setData(mockData);
        }
      } catch (error) {
        console.error('Failed to fetch registrations:', error);
        setData(mockData);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated]);

  const startScanner = async () => {
    setCameraError(null);
    setScannerActive(true);
    
    try {
      // Force the browser permission prompt explicitly first
      // This helps bypass strict iframe/browser policies that block the library
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      
      // Stop the explicit stream immediately, we just needed the permission granted
      stream.getTracks().forEach(track => track.stop());

      // Now initialize the library, knowing permission is granted
      const html5QrCode = new Html5Qrcode("reader");
      scannerRef.current = html5QrCode;
      
      await html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          playBeep();
          handleMarkAttended(decodedText);
          setLastScanned(decodedText);
        },
        (errorMessage) => {
          // ignore background scan errors
        }
      );
    } catch (err) {
      console.error("Camera initialization error:", err);
      setCameraError("Camera access denied. Please click the camera icon in your browser's address bar to allow access, then try again.");
      setScannerActive(false);
      if (scannerRef.current) {
        scannerRef.current = null;
      }
    }
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().then(() => {
        scannerRef.current?.clear();
        scannerRef.current = null;
        setScannerActive(false);
      }).catch(err => console.error(err));
    } else {
      setScannerActive(false);
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const handleMarkAttended = async (identifier: string) => {
    // Optimistic UI update
    setData(prev => prev.map(user => {
      if (
        user.registrationId.toLowerCase() === identifier.toLowerCase() ||
        user.phone === identifier ||
        user.fullName.toLowerCase() === identifier.toLowerCase()
      ) {
        return { ...user, attended: true };
      }
      return user;
    }));

    // Save to backend (Google Sheets)
    try {
      await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier }),
      });
    } catch (error) {
      console.error('Failed to save attendance status to backend:', error);
    }
  };

  const handleDelete = async (registrationId: string) => {
    if (!window.confirm(`Are you sure you want to delete registration ${registrationId}?`)) return;
    
    try {
      const response = await fetch(`/api/registrations/${registrationId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setData(prev => prev.filter(u => u.registrationId !== registrationId));
      } else {
        alert('Failed to delete registration');
      }
    } catch (error) {
      console.error('Error deleting registration:', error);
      alert('Error deleting registration');
    }
  };

  const downloadCSV = () => {
    const headers = ['Registration ID', 'Name', 'Email', 'Phone', 'WhatsApp', 'Company', 'Category', 'Area', 'Kits Pledged', 'Musandam Trip', 'Attended'];
    const rows = data.map(d => [
      d.registrationId, d.fullName, d.email, d.phone, d.whatsapp, d.company, d.category, d.area, d.mealsPledged, d.musandamTrip, d.attended ? 'Yes' : 'No'
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "iftar_registrations.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return [];
    const query = searchQuery.toLowerCase();
    return data.filter(u => 
      u.registrationId.toLowerCase().includes(query) ||
      u.fullName.toLowerCase().includes(query) ||
      u.phone.includes(query)
    ).slice(0, 5);
  }, [data, searchQuery]);

  const filteredTableData = useMemo(() => {
    if (!tableSearchQuery) return data;
    const query = tableSearchQuery.toLowerCase();
    return data.filter(u => 
      u.registrationId.toLowerCase().includes(query) ||
      u.fullName.toLowerCase().includes(query) ||
      u.phone.includes(query) ||
      u.company.toLowerCase().includes(query) ||
      u.area.toLowerCase().includes(query) ||
      u.category.toLowerCase().includes(query)
    );
  }, [data, tableSearchQuery]);

  const areaData = useMemo(() => {
    const counts = data.reduce((acc, curr) => {
      acc[curr.area] = (acc[curr.area] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).map(([name, value]) => ({ name, value: value as number })).sort((a, b) => b.value - a.value);
  }, [data]);

  const categoryData = useMemo(() => {
    const counts = data.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).map(([name, value]) => ({ name, value: value as number })).sort((a, b) => b.value - a.value);
  }, [data]);

  const cardClasses = `p-6 rounded-3xl border shadow-xl ${
    isNight
      ? 'bg-slate-900/80 border-slate-800 backdrop-blur-xl shadow-amber-900/5'
      : 'bg-white border-stone-100 shadow-stone-200/50'
  }`;

  const textClasses = isNight ? 'text-amber-50' : 'text-stone-900';
  const subTextClasses = isNight ? 'text-amber-200/70' : 'text-stone-500';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const result = await response.json();
      if (result.status === 'success') {
        setIsAuthenticated(true);
      } else {
        setLoginError('Invalid username or password');
      }
    } catch (error) {
      setLoginError('An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
  };

  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-1000 ${isNight ? 'bg-slate-950 text-amber-50' : 'bg-stone-50 text-stone-900'}`}>
        <RamadanBackground />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`w-full max-w-md p-8 rounded-3xl border shadow-xl relative z-10 ${isNight ? 'bg-slate-900/80 border-slate-800 backdrop-blur-xl shadow-amber-900/5' : 'bg-white border-stone-100 shadow-stone-200/50'}`}
        >
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={onBack}
              className={`p-2 rounded-xl transition-colors ${isNight ? 'bg-slate-800 hover:bg-slate-700 text-amber-50' : 'bg-stone-100 hover:bg-stone-200 text-stone-900'}`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-serif">Admin Login</h2>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isNight ? 'text-amber-200/80' : 'text-stone-700'}`}>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all ${isNight ? 'bg-slate-800/50 border-slate-700 text-amber-50 focus:ring-amber-500/50 focus:border-amber-500/50' : 'bg-white border-stone-200 text-stone-900 focus:ring-indigo-500/50 focus:border-indigo-500/50'}`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isNight ? 'text-amber-200/80' : 'text-stone-700'}`}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all ${isNight ? 'bg-slate-800/50 border-slate-700 text-amber-50 focus:ring-amber-500/50 focus:border-amber-500/50' : 'bg-white border-stone-200 text-stone-900 focus:ring-indigo-500/50 focus:border-indigo-500/50'}`}
              />
            </div>
            {loginError && <p className="text-red-500 text-sm">{loginError}</p>}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 px-6 rounded-xl font-medium text-lg transition-all ${isNight ? 'bg-amber-500 hover:bg-amber-400 text-slate-900 shadow-lg shadow-amber-500/20' : 'bg-stone-900 hover:bg-stone-800 text-white shadow-lg shadow-stone-900/20'} ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-1000 ${isNight ? 'bg-slate-950 text-amber-50' : 'bg-stone-50 text-stone-900'}`}>
        <div className="animate-pulse text-xl font-serif">Loading dashboard data...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-4 md:p-8 transition-colors duration-1000 ${isNight ? 'bg-slate-950' : 'bg-stone-50'}`}>
      <RamadanBackground />
      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className={`p-3 rounded-xl transition-colors ${
                isNight ? 'bg-slate-800 hover:bg-slate-700 text-amber-50' : 'bg-white hover:bg-stone-100 text-stone-900 shadow-sm'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className={`text-2xl md:text-3xl font-serif ${textClasses}`}>Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className={`px-3 py-2 md:px-4 md:py-2 rounded-xl text-sm md:text-base font-medium flex items-center gap-2 transition-all ${
                isNight
                  ? 'bg-slate-800 hover:bg-slate-700 text-amber-50 border border-slate-700'
                  : 'bg-white hover:bg-stone-100 text-stone-900 border border-stone-200 shadow-sm'
              }`}
            >
              <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Logout</span>
            </button>
            <button
              onClick={downloadCSV}
              className={`px-3 py-2 md:px-4 md:py-2 rounded-xl text-sm md:text-base font-medium flex items-center gap-2 transition-all ${
                isNight
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-900 shadow-lg shadow-amber-500/20'
                  : 'bg-stone-900 hover:bg-stone-800 text-white shadow-lg shadow-stone-900/20'
              }`}
            >
              <Download className="w-4 h-4" /> <span className="hidden sm:inline">Download</span>
            </button>
          </div>
        </div>

        {/* Attendance Management */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={cardClasses}>
          <h2 className={`text-lg md:text-xl font-serif mb-6 ${textClasses}`}>Attendance Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Scanner Section */}
            <div className={`p-4 md:p-6 rounded-2xl border ${isNight ? 'border-slate-800 bg-slate-900/50' : 'border-stone-200 bg-stone-50'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-medium flex items-center gap-2 ${textClasses}`}>
                  <QrCode className="w-5 h-5" /> Barcode Scanner
                </h3>
                <button
                  onClick={scannerActive ? stopScanner : startScanner}
                  className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-colors ${
                    scannerActive 
                      ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' 
                      : isNight ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' : 'bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20'
                  }`}
                >
                  {scannerActive ? 'Stop Scanner' : 'Start Scanner'}
                </button>
              </div>
              
              {cameraError && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 text-red-500 text-sm">
                  {cameraError}
                </div>
              )}

              <div className={`overflow-hidden rounded-xl bg-black ${!scannerActive ? 'hidden' : ''}`}>
                <div id="reader" className="w-full min-h-[250px]"></div>
              </div>
              
              {!scannerActive && (
                <div className={`h-48 rounded-xl flex items-center justify-center border-2 border-dashed ${isNight ? 'border-slate-700' : 'border-stone-300'}`}>
                  <p className={`text-sm ${subTextClasses}`}>Click 'Start Scanner' to activate camera</p>
                </div>
              )}
              
              {lastScanned && (
                <div className={`mt-4 p-3 rounded-xl flex items-center gap-2 ${isNight ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm">Scanned: {lastScanned}</span>
                </div>
              )}
            </div>

            {/* Manual Entry Section */}
            <div className={`p-4 md:p-6 rounded-2xl border ${isNight ? 'border-slate-800 bg-slate-900/50' : 'border-stone-200 bg-stone-50'}`}>
              <h3 className={`font-medium flex items-center gap-2 mb-4 ${textClasses}`}>
                <Search className="w-5 h-5" /> Manual Search
              </h3>
              <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className={`h-4 w-4 ${isNight ? 'text-slate-500' : 'text-stone-400'}`} />
                </div>
                <input
                  type="text"
                  placeholder="Search ID, Name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 md:py-3 text-sm md:text-base rounded-xl border focus:outline-none focus:ring-2 transition-all ${
                    isNight
                      ? 'bg-slate-950 border-slate-700 text-amber-50 focus:ring-amber-500/50 focus:border-amber-500/50 placeholder-slate-500'
                      : 'bg-white border-stone-200 text-stone-900 focus:ring-indigo-500/50 focus:border-indigo-500/50 placeholder-stone-400'
                  }`}
                />
              </div>

              {searchQuery && (
                <div className="space-y-2">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map(user => (
                      <div key={user.id} className={`p-3 rounded-xl flex items-center justify-between border ${isNight ? 'border-slate-700 bg-slate-800/50' : 'border-stone-200 bg-white'}`}>
                        <div>
                          <p className={`font-medium text-sm ${textClasses}`}>{user.fullName}</p>
                          <p className={`text-xs ${subTextClasses}`}>{user.registrationId} • {user.phone}</p>
                        </div>
                        {user.attended ? (
                          <span className={`px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 ${isNight ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>
                            <CheckCircle2 className="w-3 h-3" /> Attended
                          </span>
                        ) : (
                          <button
                            onClick={() => handleMarkAttended(user.registrationId)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              isNight ? 'bg-amber-500 text-slate-900 hover:bg-amber-400' : 'bg-stone-900 text-white hover:bg-stone-800'
                            }`}
                          >
                            Mark Attended
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className={`text-sm text-center py-4 ${subTextClasses}`}>No matching registrations found.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={cardClasses}>
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-2xl ${isNight ? 'bg-amber-500/20 text-amber-400' : 'bg-indigo-100 text-indigo-600'}`}>
                <Users className="w-8 h-8" />
              </div>
              <div>
                <p className={`text-xs md:text-sm font-medium uppercase tracking-wider ${subTextClasses}`}>Total Registrations</p>
                <p className={`text-3xl md:text-4xl font-serif mt-1 ${textClasses}`}>{data.length}</p>
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={cardClasses}>
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-2xl ${isNight ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
                <MapPin className="w-8 h-8" />
              </div>
              <div>
                <p className={`text-xs md:text-sm font-medium uppercase tracking-wider ${subTextClasses}`}>Top Area</p>
                <p className={`text-xl md:text-2xl font-serif mt-1 ${textClasses}`}>{areaData[0]?.name}</p>
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={cardClasses}>
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-2xl ${isNight ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                <Briefcase className="w-8 h-8" />
              </div>
              <div>
                <p className={`text-xs md:text-sm font-medium uppercase tracking-wider ${subTextClasses}`}>Top Category</p>
                <p className={`text-lg md:text-xl font-serif mt-1 ${textClasses} truncate max-w-[150px] md:max-w-[200px]`}>{categoryData[0]?.name}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className={cardClasses}>
            <h2 className={`text-lg md:text-xl font-serif mb-6 ${textClasses}`}>Registrations by Area</h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={areaData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isNight ? '#334155' : '#e2e8f0'} horizontal={false} />
                  <XAxis type="number" stroke={isNight ? '#94a3b8' : '#64748b'} />
                  <YAxis dataKey="name" type="category" width={100} stroke={isNight ? '#94a3b8' : '#64748b'} tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isNight ? '#0f172a' : '#ffffff',
                      borderColor: isNight ? '#1e293b' : '#e2e8f0',
                      color: isNight ? '#f8fafc' : '#0f172a',
                      borderRadius: '0.75rem'
                    }} 
                  />
                  <Bar dataKey="value" fill={isNight ? '#f59e0b' : '#4f46e5'} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className={cardClasses}>
            <h2 className={`text-lg md:text-xl font-serif mb-6 ${textClasses}`}>Professional Categories</h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="45%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isNight ? '#0f172a' : '#ffffff',
                      borderColor: isNight ? '#1e293b' : '#e2e8f0',
                      color: isNight ? '#f8fafc' : '#0f172a',
                      borderRadius: '0.75rem'
                    }} 
                  />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '11px', color: isNight ? '#cbd5e1' : '#475569', paddingTop: '20px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className={`${cardClasses} overflow-hidden`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <h2 className={`text-lg md:text-xl font-serif ${textClasses}`}>All Registrations ({filteredTableData.length})</h2>
            <div className="relative w-full md:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className={`h-4 w-4 ${isNight ? 'text-slate-500' : 'text-stone-400'}`} />
              </div>
              <input
                type="text"
                placeholder="Search table..."
                value={tableSearchQuery}
                onChange={(e) => setTableSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 transition-all ${
                  isNight
                    ? 'bg-slate-950 border-slate-700 text-amber-50 focus:ring-amber-500/50 focus:border-amber-500/50 placeholder-slate-500'
                    : 'bg-white border-stone-200 text-stone-900 focus:ring-indigo-500/50 focus:border-indigo-500/50 placeholder-stone-400'
                }`}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b ${isNight ? 'border-slate-800 text-slate-400' : 'border-stone-200 text-stone-500'}`}>
                  <th className="py-3 px-2 md:px-4 font-medium text-xs md:text-sm uppercase tracking-wider">Name</th>
                  <th className="py-3 px-2 md:px-4 font-medium text-xs md:text-sm uppercase tracking-wider">Profession</th>
                  <th className="py-3 px-2 md:px-4 font-medium text-xs md:text-sm uppercase tracking-wider">Reg ID</th>
                  <th className="py-3 px-2 md:px-4 font-medium text-xs md:text-sm uppercase tracking-wider">Phone</th>
                  <th className="py-3 px-2 md:px-4 font-medium text-xs md:text-sm uppercase tracking-wider">WhatsApp</th>
                  <th className="py-3 px-2 md:px-4 font-medium text-xs md:text-sm uppercase tracking-wider">Category</th>
                  <th className="py-3 px-2 md:px-4 font-medium text-xs md:text-sm uppercase tracking-wider">Area</th>
                  <th className="py-3 px-2 md:px-4 font-medium text-xs md:text-sm uppercase tracking-wider">Kits</th>
                  <th className="py-3 px-2 md:px-4 font-medium text-xs md:text-sm uppercase tracking-wider">Trip</th>
                  <th className="py-3 px-2 md:px-4 font-medium text-xs md:text-sm uppercase tracking-wider">Status</th>
                  <th className="py-3 px-2 md:px-4 font-medium text-xs md:text-sm uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isNight ? 'divide-slate-800/50' : 'divide-stone-100'}`}>
                {filteredTableData.map((user) => (
                  <tr key={user.id} className={`transition-colors ${isNight ? 'hover:bg-slate-800/30' : 'hover:bg-stone-50'}`}>
                    <td className={`py-3 px-2 md:px-4 text-xs md:text-sm ${textClasses}`}>{user.fullName}</td>
                    <td className={`py-3 px-2 md:px-4 text-xs md:text-sm ${subTextClasses}`}>{user.company}</td>
                    <td className={`py-3 px-2 md:px-4 text-xs md:text-sm ${subTextClasses} font-mono`}>{user.registrationId}</td>
                    <td className={`py-3 px-2 md:px-4 text-xs md:text-sm ${subTextClasses}`}>{user.phone}</td>
                    <td className={`py-3 px-2 md:px-4 text-xs md:text-sm ${subTextClasses}`}>{user.whatsapp}</td>
                    <td className={`py-3 px-2 md:px-4 text-xs md:text-sm ${subTextClasses}`}>{user.category}</td>
                    <td className={`py-3 px-2 md:px-4 text-xs md:text-sm ${subTextClasses}`}>{user.area}</td>
                    <td className={`py-3 px-2 md:px-4 text-xs md:text-sm ${subTextClasses}`}>{user.mealsPledged}</td>
                    <td className={`py-3 px-2 md:px-4 text-xs md:text-sm ${subTextClasses}`}>{user.musandamTrip}</td>
                    <td className="py-3 px-2 md:px-4">
                      {user.attended ? (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${isNight ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>
                          Attended
                        </span>
                      ) : (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${isNight ? 'bg-slate-700 text-slate-300' : 'bg-stone-200 text-stone-600'}`}>
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-2 md:px-4">
                      <button
                        onClick={() => handleDelete(user.registrationId)}
                        className={`p-2 rounded-lg transition-colors ${isNight ? 'text-slate-500 hover:text-red-400 hover:bg-red-400/10' : 'text-stone-400 hover:text-red-500 hover:bg-red-50'}`}
                        title="Delete Registration"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
