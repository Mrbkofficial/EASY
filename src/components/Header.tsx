import React, { useState, useEffect } from 'react';
import { User } from '../types';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => setTime(new Date()), 1000 * 60);
    return () => clearInterval(timerId);
  }, []);

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <header className="fixed top-0 left-0 right-0 bg-slate-900/60 backdrop-blur-lg z-20 px-4 md:px-6 py-3 border-b border-slate-700/50">
      <div className="flex justify-between items-center max-w-4xl mx-auto">
        <h1 className="text-xl font-bold text-white tracking-tight">
          EASY <span className="text-green-400 text-sm font-medium">Agent Hub</span>
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-xl font-semibold text-white hidden sm:block">{formatTime(time)}</span>
          {user && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center font-bold text-white overflow-hidden">
                {user.avatar ? (
                  <img src={user.avatar} alt="User Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{getInitials(user.name)}</span>
                )}
              </div>
              <button onClick={onLogout} className="text-gray-300 hover:text-white" aria-label="Logout">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" x2="9" y1="12" y2="12"></line></svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
