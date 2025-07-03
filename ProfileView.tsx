
import React, { useState, useRef } from 'react';
import { User } from '../types';

interface ProfileViewProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ user, onUpdateUser }) => {
  const [name, setName] = useState(user.name);
  const [companyName, setCompanyName] = useState(user.companyName);
  const [avatar, setAvatar] = useState(user.avatar);
  const [companyLogo, setCompanyLogo] = useState(user.companyLogo);
  const [message, setMessage] = useState('');
  
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };
  
  const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            if (!event.target?.result) {
                return reject(new Error("FileReader did not successfully read the file."));
            }
            const img = new Image();
            img.src = event.target.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    return reject(new Error('Could not get canvas context'));
                }
                ctx.drawImage(img, 0, 0, width, height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                resolve(dataUrl);
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
  };
  
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const resizedAvatar = await resizeImage(file, 256, 256);
        setAvatar(resizedAvatar);
      } catch (error) {
        console.error("Failed to resize avatar:", error);
        setMessage("Sorry, there was an error processing your avatar.");
      }
    }
  };

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const resizedLogo = await resizeImage(file, 400, 200);
        setCompanyLogo(resizedLogo);
      } catch (error) {
        console.error("Failed to resize logo:", error);
        setMessage("Sorry, there was an error processing your logo.");
      }
    }
  };

  const handleSave = () => {
    onUpdateUser({
      ...user,
      name,
      companyName,
      avatar,
      companyLogo
    });
    setMessage('Profile updated successfully!');
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="p-4 md:p-6 text-white h-full pt-24 pb-20 overflow-y-auto">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-center">My Profile</h2>

        <div className="flex flex-col items-center mb-8">
            <div className="relative">
                <div 
                    className="w-32 h-32 rounded-full bg-green-500 flex items-center justify-center font-bold text-white text-4xl overflow-hidden cursor-pointer"
                    onClick={() => avatarFileInputRef.current?.click()}
                    title="Change Avatar"
                >
                    {avatar ? (
                        <img src={avatar} alt="User Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <span>{getInitials(user.name)}</span>
                    )}
                </div>
                 <button onClick={() => avatarFileInputRef.current?.click()} className="absolute bottom-0 right-0 bg-slate-700 p-2 rounded-full border-2 border-slate-800 hover:bg-slate-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path><circle cx="12" cy="13" r="3"></circle></svg>
                 </button>
            </div>
          <input 
            type="file" 
            ref={avatarFileInputRef} 
            onChange={handleAvatarFileChange} 
            className="hidden" 
            accept="image/png, image/jpeg"
          />
        </div>

        <div className="space-y-6 bg-gray-800 p-6 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <p className="w-full bg-slate-700/50 border border-slate-600 rounded-lg p-3 text-gray-400">{user.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Company Name</label>
            <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
            <p className="text-xs text-gray-400 mt-2">This name will be automatically used in your generated RFP documents.</p>
          </div>
           <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Company Logo</label>
            <div className="mt-1 flex items-center gap-4">
              <span className="h-16 w-32 rounded-md overflow-hidden bg-gray-700 flex items-center justify-center border border-gray-600">
                {companyLogo ? <img src={companyLogo} alt="Company Logo" className="h-full w-full object-contain" /> : <span className="text-xs text-gray-400">No Logo</span>}
              </span>
              <button
                type="button"
                onClick={() => logoFileInputRef.current?.click()}
                className="bg-slate-700 py-2 px-3 border border-slate-600 rounded-md text-sm font-medium text-gray-300 hover:bg-slate-600"
              >
                Upload Logo
              </button>
            </div>
             <input type="file" ref={logoFileInputRef} onChange={handleLogoFileChange} className="hidden" accept="image/png, image/jpeg" />
             <p className="text-xs text-gray-400 mt-2">This logo will be automatically placed in your generated PDF documents.</p>
          </div>
           <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Current Plan</label>
             <p className="w-full bg-slate-700/50 border border-slate-600 rounded-lg p-3 text-green-400 font-semibold">{user.tier}</p>
          </div>
        </div>
        
        <div className="mt-8">
            <button onClick={handleSave} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors">
                Save Changes
            </button>
            {message && <p className="text-center text-green-400 mt-4">{message}</p>}
        </div>
      </div>
    </div>
  );
};

export default ProfileView;