import { useState, useEffect } from 'react';
import { ThemeProvider } from './ThemeContext';
import { RegistrationPortal } from './RegistrationPortal';
import { AdminDashboard } from './AdminDashboard';

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const handleHashChange = () => {
      setIsAdmin(window.location.hash === '#admin');
    };
    
    // Check initial hash
    handleHashChange();
    
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <ThemeProvider>
      {isAdmin ? (
        <AdminDashboard onBack={() => window.location.hash = ''} />
      ) : (
        <RegistrationPortal />
      )}
    </ThemeProvider>
  );
}
