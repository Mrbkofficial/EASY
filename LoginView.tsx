
import React, { useState } from 'react';
import { User, UserTier } from '../types';

interface LoginViewProps {
  setUsers: React.Dispatch<React.SetStateAction<Record<string, User>>>;
  setCurrentUser: (user: User) => void;
  users: Record<string, User>;
}

const LoginView: React.FC<LoginViewProps> = ({ setUsers, setCurrentUser, users }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    email: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      // Login logic
      const user = users[formData.email];
      if (user) { // In a real app, you'd check a hashed password
        setCurrentUser(user);
      } else {
        setError('Invalid email or password.');
      }
    } else {
      // Signup logic
      if (users[formData.email]) {
        setError('An account with this email already exists.');
        return;
      }
      if (!formData.name || !formData.companyName || !formData.email) {
          setError('Please fill out all fields.');
          return;
      }
      const newUser: User = {
        id: `user-${Date.now()}`,
        name: formData.name,
        email: formData.email,
        companyName: formData.companyName,
        tier: UserTier.Free,
        projects: [],
      };
      setUsers(prev => ({...prev, [newUser.email]: newUser}));
      setCurrentUser(newUser);
    }
  };

  return (
    <div className="bg-gradient-to-b from-slate-900 to-slate-950 min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800/60 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-slate-700/50">
        <h2 className="text-3xl font-bold text-white text-center mb-2">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p className="text-center text-gray-400 mb-8">{isLogin ? 'Login to continue to EasyRFP' : 'Get started with your AI assistant'}</p>
        
        {error && <p className="bg-red-500/20 text-red-300 p-3 rounded-lg mb-6 text-center">{error}</p>}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                <input type="text" name="name" onChange={handleChange} value={formData.name} required className="w-full bg-slate-700/50 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Company Name</label>
                <input type="text" name="companyName" onChange={handleChange} value={formData.companyName} required className="w-full bg-slate-700/50 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
            <input type="email" name="email" onChange={handleChange} value={formData.email} required className="w-full bg-slate-700/50 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <input type="password" name="password" onChange={handleChange} value={formData.password} required className="w-full bg-slate-700/50 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors">
            {isLogin ? 'Log In' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-gray-400 mt-8">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}
          <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="font-semibold text-green-400 hover:text-green-300 ml-2">
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginView;