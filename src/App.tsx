import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import HomeView from './views/HomeView';
import ProjectsView from './views/ProjectsView';
import PricingView from './views/PricingView';
import LoginView from './views/LoginView';
import ProfileView from './views/ProfileView';
import MissionControlView from './views/MissionControlView';
import { User } from './types';

type View = 'home' | 'projects' | 'pricing' | 'profile' | 'mission';

const App: React.FC = () => {
  const [users, setUsers] = useState<Record<string, User>>(() => {
    const saved = localStorage.getItem('users');
    return saved ? JSON.parse(saved) : {};
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const email = localStorage.getItem('currentUserEmail');
    const saved = localStorage.getItem('users');
    if (email && saved) {
      const parsedUsers = JSON.parse(saved);
      const user = parsedUsers[email];
      if (user) {
        user.projects = user.projects.map((p: any) => ({ ...p, createdAt: new Date(p.createdAt) }));
        return user;
      }
    }
    return null;
  });

  const [currentView, setCurrentView] = useState<View>('home');

  useEffect(() => {
    if (currentUser) {
      try {
        const updatedUsers = { ...users, [currentUser.email]: currentUser };
        setUsers(updatedUsers);
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        localStorage.setItem('currentUserEmail', currentUser.email);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          alert('Storage limit exceeded. Please remove some projects or reduce avatar size.');
        } else {
          console.error('Failed to save to local storage:', error);
        }
      }
    } else {
      localStorage.removeItem('currentUserEmail');
    }
  }, [currentUser]);

  const handleUpdateUser = (updatedUser: User) => setCurrentUser(updatedUser);
  const handleLogout = () => { setCurrentUser(null); setCurrentView('home'); };

  if (!currentUser) {
    return <LoginView setUsers={setUsers} setCurrentUser={setCurrentUser} users={users} />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'home':     return <HomeView user={currentUser} onUpdateUser={handleUpdateUser} setView={setCurrentView} />;
      case 'projects': return <ProjectsView user={currentUser} onUpdateUser={handleUpdateUser} />;
      case 'pricing':  return <PricingView user={currentUser} onUpdateUser={handleUpdateUser} />;
      case 'profile':  return <ProfileView user={currentUser} onUpdateUser={handleUpdateUser} />;
      case 'mission':  return <MissionControlView />;
      default:         return <HomeView user={currentUser} onUpdateUser={handleUpdateUser} setView={setCurrentView} />;
    }
  };

  return (
    <div className="bg-gradient-to-b from-slate-900 to-slate-950 min-h-screen text-white font-sans antialiased">
      <Header user={currentUser} onLogout={handleLogout} />
      <main className="h-screen w-full max-w-4xl mx-auto">
        {renderView()}
      </main>
      <BottomNav currentView={currentView} setView={setCurrentView} />
    </div>
  );
};

export default App;
