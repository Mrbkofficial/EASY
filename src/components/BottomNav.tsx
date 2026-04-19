import React from 'react';

type View = 'home' | 'projects' | 'pricing' | 'profile' | 'mission';

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

const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>;
const ProjectsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M2 17h.01"></path><path d="M7 17h.01"></path><path d="M12 17h.01"></path></svg>;
const PricingIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>;
const ProfileIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const MissionIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>;

const BottomNav: React.FC<BottomNavProps> = ({ currentView, setView }) => (
  <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-lg z-20 border-t border-slate-700/50">
    <div className="flex justify-around items-center max-w-4xl mx-auto h-16">
      <NavItem label="Home"     icon={<HomeIcon />}     isActive={currentView === 'home'}     onClick={() => setView('home')} />
      <NavItem label="Projects" icon={<ProjectsIcon />} isActive={currentView === 'projects'} onClick={() => setView('projects')} />
      <NavItem label="Mission"  icon={<MissionIcon />}  isActive={currentView === 'mission'}  onClick={() => setView('mission')} />
      <NavItem label="Pricing"  icon={<PricingIcon />}  isActive={currentView === 'pricing'}  onClick={() => setView('pricing')} />
      <NavItem label="Profile"  icon={<ProfileIcon />}  isActive={currentView === 'profile'}  onClick={() => setView('profile')} />
    </div>
  </nav>
);

export default BottomNav;
