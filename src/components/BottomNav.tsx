import React from 'react';

type View = 'home' | 'projects' | 'pricing' | 'profile' | 'mission' | 'reports';

interface BottomNavProps {
  currentView: View;
  setView: (view: View) => void;
}

const NavItem: React.FC<{ label: string; icon: React.ReactNode; isActive: boolean; onClick: () => void }> = ({ label, icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-full transition-colors duration-200 ${isActive ? 'text-green-400' : 'text-gray-400 hover:text-white'}`}
    aria-label={`Navigate to ${label}`}
  >
    {icon}
    <span className="text-xs mt-1">{label}</span>
  </button>
);

const HomeIcon    = () => <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const MissionIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>;
const ReportsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>;
const ProjectsIcon= () => <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4"/><polyline points="14 2 14 8 20 8"/><path d="M2 17h.01"/><path d="M7 17h.01"/><path d="M12 17h.01"/></svg>;
const ProfileIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;

const BottomNav: React.FC<BottomNavProps> = ({ currentView, setView }) => (
  <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-lg z-20 border-t border-slate-700/50">
    <div className="flex justify-around items-center max-w-4xl mx-auto h-16">
      <NavItem label="Home"     icon={<HomeIcon />}     isActive={currentView === 'home'}     onClick={() => setView('home')} />
      <NavItem label="Mission"  icon={<MissionIcon />}  isActive={currentView === 'mission'}  onClick={() => setView('mission')} />
      <NavItem label="Reports"  icon={<ReportsIcon />}  isActive={currentView === 'reports'}  onClick={() => setView('reports')} />
      <NavItem label="Projects" icon={<ProjectsIcon />} isActive={currentView === 'projects'} onClick={() => setView('projects')} />
      <NavItem label="Profile"  icon={<ProfileIcon />}  isActive={currentView === 'profile'}  onClick={() => setView('profile')} />
    </div>
  </nav>
);

export default BottomNav;
